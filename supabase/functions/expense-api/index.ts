import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-google-id-token, x-user-email',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const DEFAULT_GOOGLE_CLIENT_ID = '443549607958-j392cki6rankqqi597sav782hg80adon.apps.googleusercontent.com';

type Payload = {
  action?: string;
  userEmail?: string;
  date?: string;
  year?: number;
  month?: number;
  id?: string;
  budgets?: Array<{ category: string; type?: string; monthlyBudget?: number; yearlyBudget?: number }>;
  expenses?: Array<{ type?: string; category?: string; detail?: string; amount?: number | string; notes?: string }>;
  notes?: string;
  category?: string;
  amount?: number | string;
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function normalizeType(value: string | null | undefined) {
  const key = (value || '').toString().trim().toLowerCase();
  const map: Record<string, string> = {
    expense: 'Expense',
    expenses: 'Expense',
    income: 'Income',
    payoff: 'Payoff',
    payoffs: 'Payoff',
    savings: 'Savings',
    saving: 'Savings'
  };
  return map[key] || (value || 'Expense').toString().trim();
}

function generateTxnId() {
  return `txn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
}

function formatDateKey(dateValue: string | Date) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function verifyGoogleIdentity(request: Request) {
  const token = request.headers.get('X-Google-Id-Token');
  const fallbackEmail = (request.headers.get('X-User-Email') || '').trim().toLowerCase();

  if (!token) {
    return fallbackEmail ? { email: fallbackEmail, verified: false } : null;
  }

  try {
    const verifyUrl = new URL('https://oauth2.googleapis.com/tokeninfo');
    verifyUrl.searchParams.set('id_token', token);

    const verifyResponse = await fetch(verifyUrl);
    if (!verifyResponse.ok) {
      return fallbackEmail ? { email: fallbackEmail, verified: false } : null;
    }

    const payload = await verifyResponse.json();
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || DEFAULT_GOOGLE_CLIENT_ID;
    const email = (payload.email || fallbackEmail || '').toString().trim().toLowerCase();
    const audienceMatches = !clientId || payload.aud === clientId;
    const emailVerified = payload.email_verified === 'true' || payload.email_verified === true;

    if (!email || !audienceMatches || !emailVerified) {
      return null;
    }

    return { email, verified: true };
  } catch {
    return fallbackEmail ? { email: fallbackEmail, verified: false } : null;
  }
}

async function isAllowedUser(supabase: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('email')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.error('allowed user check failed', error);
    return false;
  }

  return !!data;
}

function buildCategoryGroups(rows: Array<Record<string, unknown>>) {
  const grouped: Record<string, Array<{ category: string; details: string[] }>> = {
    Expense: [],
    Income: [],
    Savings: [],
    Payoff: []
  };

  const tempMap: Record<string, Map<string, Set<string>>> = {
    Expense: new Map(),
    Income: new Map(),
    Savings: new Map(),
    Payoff: new Map()
  };

  for (const row of rows || []) {
    const type = normalizeType((row.type || '').toString());
    const parent = (row.category || '').toString().trim();
    const detail = (row.detail || '').toString().trim();

    if (!parent || !(type in tempMap)) continue;

    if (!tempMap[type].has(parent)) {
      tempMap[type].set(parent, new Set());
    }

    if (detail) {
      tempMap[type].get(parent)?.add(detail);
    }
  }

  for (const type of Object.keys(tempMap)) {
    grouped[type] = Array.from(tempMap[type].entries()).map(([category, details]) => ({
      category,
      details: Array.from(details)
    }));
  }

  return grouped;
}

async function getCategories(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('category_master')
    .select('type, category, detail, budget_monthly, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('category', { ascending: true });

  if (error) throw error;

  const categories = (data || []).map((row) => ({
    name: (row.detail || row.category || '').toString().trim(),
    type: normalizeType(row.type),
    budget: Number(row.budget_monthly || 0),
    parentCategory: (row.category || '').toString().trim(),
    detail: (row.detail || '').toString().trim()
  }));

  return {
    success: true,
    categories,
    categoryGroups: buildCategoryGroups((data || []) as Array<Record<string, unknown>>)
  };
}

async function getBudgets(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('category_master')
    .select('type, category, detail, budget_monthly, budget_yearly')
    .eq('active', true)
    .order('type', { ascending: true })
    .order('category', { ascending: true });

  if (error) throw error;

  return {
    success: true,
    budgets: (data || []).map((row) => ({
      type: normalizeType(row.type),
      category: (row.detail || row.category || '').toString().trim(),
      monthlyBudget: Number(row.budget_monthly || 0),
      yearlyBudget: Number(row.budget_yearly || 0)
    }))
  };
}

async function getMonthlyBudget(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('category_master')
    .select('type, budget_monthly')
    .eq('active', true);

  if (error) throw error;

  const budget = {
    expense: 0,
    income: 0,
    savings: 0,
    payoff: 0
  };

  for (const row of data || []) {
    const typeKey = normalizeType(row.type).toLowerCase() as keyof typeof budget;
    if (typeKey in budget) {
      budget[typeKey] += Number(row.budget_monthly || 0);
    }
  }

  return { success: true, budget };
}

async function getExpensesByMonth(supabase: ReturnType<typeof createClient>, payload: Payload) {
  const year = Number(payload.year);
  const month = Number(payload.month);

  if (!year || !month) {
    return { success: false, message: 'Missing year or month' };
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('transactions')
    .select('id, entry_date, type, category, detail, amount, notes, created_at, status')
    .neq('status', 'DELETED')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const expensesByDate: Record<string, unknown[]> = {};

  for (const row of data || []) {
    const dateKey = formatDateKey(row.entry_date);
    if (!dateKey) continue;

    if (!expensesByDate[dateKey]) {
      expensesByDate[dateKey] = [];
    }

    expensesByDate[dateKey].push({
      id: row.id,
      date: dateKey,
      type: normalizeType(row.type),
      category: (row.detail || row.category || '').toString().trim(),
      parentCategory: (row.category || '').toString().trim(),
      detail: (row.detail || '').toString().trim(),
      amount: Number(row.amount || 0),
      notes: row.notes || '',
      status: row.status || 'ACTIVE'
    });
  }

  return { success: true, expensesByDate };
}

async function getDashboardData(supabase: ReturnType<typeof createClient>, payload: Payload) {
  const [categoriesResult, budgetResult, expensesResult] = await Promise.all([
    getCategories(supabase),
    getMonthlyBudget(supabase),
    getExpensesByMonth(supabase, payload)
  ]);

  return {
    success: true,
    categories: categoriesResult.categories,
    categoryGroups: categoriesResult.categoryGroups || {},
    budget: budgetResult.budget,
    expensesByDate: expensesResult.expensesByDate || {}
  };
}

async function saveExpenses(supabase: ReturnType<typeof createClient>, payload: Payload, userEmail: string) {
  if (!payload.date || !Array.isArray(payload.expenses)) {
    return { success: false, message: 'Missing required fields: date and expenses array' };
  }

  const rows = (payload.expenses || [])
    .filter((expense) => expense.category && expense.amount)
    .map((expense) => ({
      id: generateTxnId(),
      entry_date: payload.date,
      type: normalizeType(expense.type || 'Expense'),
      category: (expense.category || '').toString().trim(),
      detail: (expense.detail || '').toString().trim() || null,
      amount: Number(expense.amount || 0),
      notes: (expense.notes || '').toString(),
      created_by_email: userEmail,
      status: 'ACTIVE'
    }));

  if (!rows.length) {
    return { success: false, message: 'No valid expenses to save' };
  }

  const { error } = await supabase.from('transactions').insert(rows);
  if (error) throw error;

  return {
    success: true,
    message: `Saved ${rows.length} expenses`,
    count: rows.length,
    savedExpenses: rows
  };
}

async function saveBudget(supabase: ReturnType<typeof createClient>, payload: Payload) {
  const budgets = Array.isArray(payload.budgets) ? payload.budgets : [];

  for (const budget of budgets) {
    const incomingCategory = (budget.category || '').toString().trim();
    if (!incomingCategory) continue;

    const monthlyBudget = Number(budget.monthlyBudget || 0);
    const yearlyBudget = Number(budget.yearlyBudget || monthlyBudget * 12);
    const budgetType = (budget.type || '').toString().trim();

    // Look up the row by detail name, scoped by type
    let query = supabase
      .from('category_master')
      .select('id')
      .eq('active', true)
      .ilike('detail', incomingCategory);
    if (budgetType) query = query.ilike('type', budgetType);
    const { data: existing, error: lookupError } = await query.limit(1).maybeSingle();
    if (lookupError) throw lookupError;

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('category_master')
        .update({
          budget_monthly: monthlyBudget,
          budget_yearly: yearlyBudget,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    }
  }

  return { success: true, message: 'Budgets saved successfully' };
}

async function deleteExpense(supabase: ReturnType<typeof createClient>, payload: Payload) {
  if (!payload.id) {
    return { success: false, message: 'Missing expense id' };
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'DELETED', updated_at: new Date().toISOString() })
    .eq('id', payload.id);

  if (error) throw error;

  return { success: true, message: 'Expense deleted' };
}

async function updateExpense(supabase: ReturnType<typeof createClient>, payload: Payload) {
  if (!payload.id) {
    return { success: false, message: 'Missing expense id' };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (payload.date) updateData.entry_date = payload.date;
  if (payload.category) updateData.category = payload.category;
  if (payload.amount !== undefined) updateData.amount = Number(payload.amount || 0);
  if (payload.notes !== undefined) updateData.notes = payload.notes || '';

  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', payload.id);

  if (error) throw error;

  return { success: true, message: 'Expense updated' };
}

async function getAllowedUsersList(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('email')
    .eq('active', true)
    .order('email', { ascending: true });

  if (error) throw error;

  return {
    success: true,
    allowedUsers: (data || []).map((row) => row.email)
  };
}

async function setAllowedUsersList(supabase: ReturnType<typeof createClient>, payload: Payload) {
  const incoming = Array.isArray((payload as Record<string, unknown>).allowedUsers)
    ? ((payload as Record<string, unknown>).allowedUsers as string[])
    : [];

  const emails = incoming
    .map((value) => (value || '').toString().trim().toLowerCase())
    .filter(Boolean);

  if (!emails.length) {
    return { success: false, message: 'No allowed users provided' };
  }

  const upsertRows = emails.map((email) => ({ email, role: 'user', active: true, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from('allowed_users').upsert(upsertRows, { onConflict: 'email' });
  if (error) throw error;

  return {
    success: true,
    allowedUsers: emails
  };
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('EXPENSE_PROJECT_URL');
  const supabaseServiceRoleKey = Deno.env.get('EXPENSE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse({ success: false, message: 'Missing Supabase environment configuration' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  let payload: Payload = {};
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return jsonResponse({ success: false, message: 'Invalid JSON payload' }, 400);
  }

  const identity = await verifyGoogleIdentity(request);
  const userEmail = (payload.userEmail || identity?.email || '').toString().trim().toLowerCase();

  if (!userEmail) {
    return jsonResponse({ success: false, error: 'UNAUTHORIZED', message: 'No user identity available' }, 401);
  }

  const allowed = await isAllowedUser(supabase, userEmail);
  if (!allowed) {
    return jsonResponse({ success: false, error: 'UNAUTHORIZED', message: 'Access denied' }, 401);
  }

  try {
    switch (payload.action) {
      case 'getCategories':
        return jsonResponse(await getCategories(supabase));
      case 'getBudgets':
        return jsonResponse(await getBudgets(supabase));
      case 'getMonthlyBudget':
        return jsonResponse(await getMonthlyBudget(supabase));
      case 'getDashboardData':
        return jsonResponse(await getDashboardData(supabase, payload));
      case 'getExpensesByMonth':
        return jsonResponse(await getExpensesByMonth(supabase, payload));
      case 'saveExpenses':
        return jsonResponse(await saveExpenses(supabase, payload, userEmail));
      case 'saveBudget':
        return jsonResponse(await saveBudget(supabase, payload));
      case 'deleteExpense':
        return jsonResponse(await deleteExpense(supabase, payload));
      case 'updateExpense':
        return jsonResponse(await updateExpense(supabase, payload));
      case 'getAllowedUsers':
        return jsonResponse(await getAllowedUsersList(supabase));
      case 'setAllowedUsers':
        return jsonResponse(await setAllowedUsersList(supabase, payload));
      default:
        return jsonResponse({ success: false, message: `Unknown action: ${payload.action || 'undefined'}` }, 400);
    }
  } catch (error) {
    console.error('expense-api error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ success: false, message }, 500);
  }
});
