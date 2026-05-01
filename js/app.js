/* ============================================================
   EXPENSE MANAGER — React App  (JSX via Babel Standalone)
   React 18 UMD + Tailwind CDN
   All 6 phases in one file.
   ============================================================ */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// ── CONSTANTS ─────────────────────────────────────────────────────────────

const TABS = ['Expense', 'Income', 'Savings', 'Payoff'];

const TAB_LABEL = {
  Expense: 'Expenses',
  Income:  'Income',
  Savings: 'Savings',
  Payoff:  'Payoffs',
};

const TYPE_COLOR = {
  Expense: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100',    tab: 'border-red-500 text-red-600',    badge: 'bg-red-100 text-red-700'    },
  Income:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100',  tab: 'border-green-500 text-green-600',  badge: 'bg-green-100 text-green-700'  },
  Savings: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   tab: 'border-blue-500 text-blue-600',   badge: 'bg-blue-100 text-blue-700'   },
  Payoff:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  tab: 'border-amber-500 text-amber-600',  badge: 'bg-amber-100 text-amber-700'  },
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BAR_COLOR = {
  Expense: '#ef4444',
  Income:  '#22c55e',
  Savings: '#3b82f6',
  Payoff:  '#f59e0b',
};

const MAX_QUICK_SLOTS  = 5;
const QUICK_SLOTS_KEY  = 'expenseManager_quickSlots';

// Emoji map — matched by lowercase sub-category name
const CAT_EMOJI = {
  'coffee': '☕', 'tea': '🍵', 'chai': '🍵',
  'auto': '🛺', 'rickshaw': '🛺', 'autorickshaw': '🛺',
  'cab': '🚕', 'taxi': '🚕', 'uber': '🚕', 'ola': '🚕',
  'bus': '🚌', 'train': '🚆', 'metro': '🚇', 'bike': '🏍️',
  'groceries': '🛒', 'grocery': '🛒', 'supermarket': '🛒',
  'vegetables': '🥦', 'fruits': '🍎',
  'dining': '🍽️', 'dining out': '🍽️', 'restaurant': '🍽️',
  'food': '🍔', 'lunch': '🍱', 'dinner': '🍛', 'breakfast': '🥗',
  'swiggy': '🍜', 'zomato': '🍜', 'takeaway': '🥡',
  'petrol': '⛽', 'fuel': '⛽', 'diesel': '⛽',
  'electricity': '⚡', 'power bill': '⚡', 'eb': '⚡',
  'rent': '🏠', 'house': '🏠', 'maintenance': '🔧',
  'shopping': '🛍️', 'clothes': '👗', 'clothing': '👗', 'amazon': '📦', 'flipkart': '📦',
  'movie': '🎬', 'movies': '🎬', 'cinema': '🎬', 'entertainment': '🎭', 'ott': '📺',
  'medical': '💊', 'medicine': '💊', 'doctor': '🏥', 'hospital': '🏥', 'pharmacy': '💊',
  'gym': '💪', 'fitness': '💪', 'sports': '⚽',
  'salary': '💰', 'income': '💰', 'freelance': '💻', 'bonus': '💰',
  'savings': '🏦', 'investment': '📈', 'mutual fund': '📈', 'sip': '📈', 'fd': '🏦',
  'emi': '💳', 'loan': '💳', 'credit card': '💳',
  'internet': '📶', 'wifi': '📶', 'broadband': '📶',
  'mobile': '📱', 'phone': '📱', 'recharge': '📱',
  'travel': '✈️', 'flight': '✈️', 'hotel': '🏨', 'trip': '🗺️',
  'education': '📚', 'school': '📚', 'fees': '📚', 'books': '📖',
  'gift': '🎁', 'donation': '🤝', 'insurance': '🛡️',
  'water': '💧', 'gas': '🔥',
};

function catEmoji(name) {
  return CAT_EMOJI[(name || '').toLowerCase().trim()] || '📌';
}

function loadQuickSlots() {
  try {
    const raw = localStorage.getItem(QUICK_SLOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistQuickSlots(slots) {
  try { localStorage.setItem(QUICK_SLOTS_KEY, JSON.stringify(slots)); } catch {}
}

// ── HELPERS ────────────────────────────────────────────────────────────────

let _rowId = 0;
function uid() { return ++_rowId; }

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function makeRow(prevDate) {
  return { _id: uid(), date: prevDate || todayStr(), subCategory: '', amount: '', notes: '' };
}

function initRows() {
  const rows = [];
  for (let i = 0; i < 5; i++) rows.push(makeRow(rows[i - 1]?.date));
  return rows;
}

function fmt(n) {
  if (n === null || n === undefined) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtK(n) {
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return (n / 1000).toFixed(1) + 'K';
  return String(Math.round(n));
}

function parseMoney(s) {
  const n = parseFloat(s);
  return isNaN(n) || n < 0 ? 0 : n;
}

// Safely evaluate a spreadsheet-style expression like "=1400+210+23" → "1633"
function evalExpression(expr) {
  const raw = expr.startsWith('=') ? expr.slice(1) : expr;
  if (raw.trim() === '') return '';
  // Whitelist: only digits, decimal points, arithmetic operators, parentheses, whitespace
  if (!/^[0-9\s+\-*/().]+$/.test(raw)) return '';
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return (' + raw + ')')();
    if (typeof result !== 'number' || !isFinite(result) || result < 0) return '';
    return String(Math.round(result * 100) / 100);
  } catch (_) {
    return '';
  }
}

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function prevMonth(m) {
  const [y, mo] = m.split('-').map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
}

function nextMonth(m) {
  const [y, mo] = m.split('-').map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
}

function buildSubCatLookup(categoryGroups) {
  const map = {};
  Object.entries(categoryGroups).forEach(([type, groups]) => {
    (groups || []).forEach(({ category, details }) => {
      (details || []).forEach(det => { map[det] = { parentCategory: category, type }; });
    });
  });
  return map;
}

function flattenExpensesByDate(expensesByDate) {
  return Object.entries(expensesByDate || {}).flatMap(([date, exps]) =>
    (exps || []).map(e => ({
      id: e.id || String(uid()),
      date: e.date || date,
      type: e.type || 'Expense',
      subCategory: e.detail || e.name || e.category || '',
      amount: parseMoney(e.amount),
      notes: e.notes || '',
    }))
  );
}

// ── BACKEND ────────────────────────────────────────────────────────────────

async function callBackend(payload) {
  const storage = window.AUTH_STORAGE || sessionStorage;
  const keys = window.AUTH_STORAGE_KEYS || {
    idToken:   'expenseManager_idToken',
    userEmail: 'expenseManager_userEmail',
  };
  const idToken   = storage.getItem(keys.idToken);
  const userEmail = storage.getItem(keys.userEmail);

  const url = `${window.EXPENSE_SUPABASE_URL}/functions/v1/${window.EXPENSE_SUPABASE_FUNCTION_NAME}`;
  const headers = {
    'Content-Type':  'application/json',
    'X-Client-Info': 'expense-manager-react-v7',
  };
  if (window.EXPENSE_SUPABASE_ANON_KEY) headers['apikey'] = window.EXPENSE_SUPABASE_ANON_KEY;
  if (idToken)   headers['X-Google-Id-Token'] = idToken;
  if (userEmail) { headers['X-User-Email'] = userEmail; payload = { ...payload, userEmail }; }

  const resp = await fetch(url, {
    method:  'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return resp.json();
}

// ── LOADING OVERLAY (DOM bridge for loading state) ─────────────────────────

function setLoadingOverlay(show) {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  if (show) el.classList.remove('hidden');
  else      el.classList.add('hidden');
}

// ── COMPONENTS ─────────────────────────────────────────────────────────────

// Toast — React-managed (separate from auth.js #toast)
function AppToast({ toast, onClear }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClear, 2800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  const bg = toast.type === 'error' ? 'bg-red-600' : 'bg-green-600';
  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-md shadow-lg text-white text-sm font-medium ${bg} transition-opacity`}>
      {toast.msg}
    </div>
  );
}

// Top nav
function TopNav({ currentPage, setCurrentPage, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(page) {
    setCurrentPage(page);
    setMenuOpen(false);
  }

  function handleLogout() {
    setMenuOpen(false);
    onLogout();
  }

  return (
    <header className="shrink-0 bg-slate-800 border-b border-slate-700 relative z-50">
      <div className="h-11 flex items-center justify-between px-4">
        <span className="font-bold text-sm text-white tracking-tight">Expense Manager</span>

        {/* Desktop nav — visible on lg+ */}
        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`font-medium transition-colors ${currentPage === 'dashboard' ? 'text-sky-300' : 'text-slate-400 hover:text-white'}`}
          >Dashboard</button>
          <button
            onClick={() => setCurrentPage('transactions')}
            className={`font-medium transition-colors ${currentPage === 'transactions' ? 'text-sky-300' : 'text-slate-400 hover:text-white'}`}
          >Transactions</button>
          <button
            onClick={() => setCurrentPage('budget')}
            className={`font-medium transition-colors ${currentPage === 'budget' ? 'text-sky-300' : 'text-slate-400 hover:text-white'}`}
          >Budget</button>
          <button
            onClick={() => setCurrentPage('analytics')}
            className={`font-medium transition-colors ${currentPage === 'analytics' ? 'text-sky-300' : 'text-slate-400 hover:text-white'}`}
          >Analytics</button>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-red-400 font-medium transition-colors"
          >Logout</button>
        </nav>

        {/* Hamburger — visible below lg */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-0.5 bg-slate-300 transition-transform origin-center ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block w-5 h-0.5 bg-slate-300 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-slate-300 transition-transform origin-center ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden absolute top-full right-0 left-0 bg-slate-800 border-b border-slate-700 shadow-lg">
          <nav className="flex flex-col py-1">
            <button
              onClick={() => navigate('dashboard')}
              className={`text-left px-5 py-3 text-sm font-medium transition-colors ${currentPage === 'dashboard' ? 'text-sky-300 bg-slate-700' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Dashboard</button>
            <button
              onClick={() => navigate('transactions')}
              className={`text-left px-5 py-3 text-sm font-medium transition-colors ${currentPage === 'transactions' ? 'text-sky-300 bg-slate-700' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Transactions</button>
            <button
              onClick={() => navigate('budget')}
              className={`text-left px-5 py-3 text-sm font-medium transition-colors ${currentPage === 'budget' ? 'text-sky-300 bg-slate-700' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Budget</button>
            <button
              onClick={() => navigate('analytics')}
              className={`text-left px-5 py-3 text-sm font-medium transition-colors ${currentPage === 'analytics' ? 'text-sky-300 bg-slate-700' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            >Analytics</button>
            <button
              onClick={handleLogout}
              className="text-left px-5 py-3 text-sm font-medium text-red-400 hover:bg-slate-700 transition-colors"
            >Logout</button>
          </nav>
        </div>
      )}
    </header>
  );
}

// Month selector
function MonthSelector({ selectedMonth, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(prevMonth(selectedMonth))}
        className="px-2 py-1 text-gray-400 hover:text-gray-700 text-lg leading-none"
        aria-label="Previous month"
      >&#8249;</button>
      <input
        type="month"
        value={selectedMonth}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-sm text-gray-700 bg-white"
      />
      <button
        onClick={() => onChange(nextMonth(selectedMonth))}
        className="px-2 py-1 text-gray-400 hover:text-gray-700 text-lg leading-none"
        aria-label="Next month"
      >&#8250;</button>
    </div>
  );
}

// Summary cards
function SummaryCards({ transactions, selectedMonth, budgets }) {
  const totals = useMemo(() => {
    const t = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
    transactions
      .filter(tx => tx.date.startsWith(selectedMonth))
      .forEach(tx => {
        if (tx.type === 'Payoff' && (tx.subCategory || '').toLowerCase().includes('credit card')) return;
        t[tx.type] = (t[tx.type] || 0) + tx.amount;
      });
    return t;
  }, [transactions, selectedMonth]);

  // Total monthly budget per type
  const budgetTotals = useMemo(() => {
    const t = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
    (budgets || []).forEach(b => {
      if (b.type in t) t[b.type] += b.monthlyBudget || 0;
    });
    return t;
  }, [budgets]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TABS.map(type => {
        const c       = TYPE_COLOR[type];
        const spent   = totals[type];
        const budget  = budgetTotals[type];
        const hasBudget = budget > 0;
        const pct     = hasBudget ? Math.min((spent / budget) * 100, 100) : 0;
        const over    = hasBudget && spent > budget;
        // For Income/Savings: higher % = good (green), lower = amber/red
        // For Expense/Payoff: higher % = bad (red), lower = green
        const higherIsBetter = type === 'Income' || type === 'Savings';
        const barColor = higherIsBetter
          ? (pct >= 100 ? 'bg-green-500' : pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400')
          : (over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-green-400');
        const labelColor = higherIsBetter
          ? (pct < 50 ? 'text-red-600 font-semibold' : 'text-gray-400')
          : (over ? 'text-red-600 font-semibold' : 'text-gray-400');
        const labelText = higherIsBetter
          ? `${Math.round(pct)}% of ₹${Math.round(budget).toLocaleString('en-IN')}`
          : (over
              ? `Over by ₹${Math.round(spent - budget).toLocaleString('en-IN')}`
              : `${Math.round(pct)}% of ₹${Math.round(budget).toLocaleString('en-IN')}`);
        return (
          <div key={type} className={`${c.bg} ${c.border} border rounded-lg p-3`}>
            <div className="text-xs text-gray-500 mb-1">{TAB_LABEL[type]}</div>
            <div className={`text-xl font-bold text-right ${c.text}`}>{'₹' + Math.round(spent).toLocaleString('en-IN')}</div>
            {hasBudget && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <div className={`text-[10px] mt-1 text-right ${labelColor}`}>
                  {labelText}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── BUDGET PAGE ───────────────────────────────────────────────────────────

function BudgetPage({ categoryGroups, onBack, showToast }) {
  const [activeTab, setActiveTab] = useState('Expense');
  const [budgetMap, setBudgetMap] = useState({}); // key: subCat name → monthly amount string
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);

  // Load budgets from Supabase on mount
  useEffect(() => {
    setLoading(true);
    callBackend({ action: 'getBudgets' })
      .then(res => {
        if (res?.success) {
          const map = {};
          (res.budgets || []).forEach(b => {
            // Key by type::subCat to avoid collisions across types
            map[`${b.type}::${b.category}`] = b.monthlyBudget > 0 ? String(b.monthlyBudget) : '';
          });
          setBudgetMap(map);
        } else {
          showToast('Failed to load budgets', 'error');
        }
      })
      .catch(() => showToast('Failed to load budgets', 'error'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(type, subCat, val) {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    setBudgetMap(prev => ({ ...prev, [`${type}::${subCat}`]: val }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    // Build payload: all sub-cats across all tabs
    const budgets = [];
    TABS.forEach(type => {
      (categoryGroups[type] || []).forEach(({ details }) => {
        (details || []).forEach(sc => {
          const key = `${type}::${sc}`;
          budgets.push({
            type,
            category:      sc,
            monthlyBudget: parseMoney(budgetMap[key] || '0'),
            yearlyBudget:  parseMoney(budgetMap[key] || '0') * 12,
          });
        });
      });
    });
    try {
      const res = await callBackend({ action: 'saveBudget', budgets });
      if (res?.success) {
        showToast('Budgets saved');
        setDirty(false);
      } else {
        showToast('Save failed', 'error');
      }
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const groups = categoryGroups[activeTab] || [];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">Budget Settings</h1>
          <span className="ml-auto text-xs text-gray-400">Monthly limits per sub-category</span>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {TABS.map(type => {
            const c = TYPE_COLOR[type];
            return (
              <button key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === type
                    ? `${c.tab} border-b-2`
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                {TAB_LABEL[type]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading budgets…</div>
        ) : (
          <div className="space-y-4">
            {groups.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">No categories found.</div>
            )}
            {groups.map(({ category, details }) => (
              <div key={category} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                {/* Group header */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{category}</span>
                </div>
                {/* Sub-cat rows */}
                <div className="divide-y divide-gray-50">
                  {(details || []).map((sc, i) => {
                    const monthly = budgetMap[`${activeTab}::${sc}`] || '';
                    const yearly  = monthly ? Math.round(parseMoney(monthly) * 12).toLocaleString('en-IN') : '—';
                    return (
                      <div key={sc} className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <span className="flex-1 text-sm text-gray-700">{sc}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={monthly}
                            onChange={e => handleChange(activeTab, sc, e.target.value)}
                            placeholder="0"
                            className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                          />
                          <span className="text-[11px] text-gray-400 w-24 text-right">/ yr ₹{yearly}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save bar */}
        {!loading && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 py-3 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-5 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {saving ? 'Saving…' : 'Save Budgets'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BULK ENTRY (desktop only, hidden on mobile) ────────────────────────────

function SpreadsheetGrid({ activeTab, setActiveTab, categoryGroups, selectedMonth, onSave }) {
  // Groups: [{ category, details:[] }]
  const catGroups = useMemo(
    () => categoryGroups[activeTab] || [],
    [categoryGroups, activeTab]
  );
  // Flat list of all sub-cats (for total calculations)
  const subCats = useMemo(
    () => catGroups.flatMap(g => g.details || []),
    [catGroups]
  );
  // Accordion: track which single category is open
  const [openGroup, setOpenGroup] = useState(() => catGroups[0]?.category ?? null);
  function toggleGroup(cat) {
    setOpenGroup(prev => prev === cat ? null : cat);
  }

  const { days, dayLabels, weekendSet } = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const count = new Date(y, m, 0).getDate();
    const days = Array.from({ length: count }, (_, i) => i + 1);
    const weekendSet = new Set();
    const dayLabels = days.map(d => {
      const date = new Date(y, m - 1, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) weekendSet.add(d);
      return { d, label: date.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2) };
    });
    return { days, dayLabels, weekendSet };
  }, [selectedMonth]);

  // grid[sc][d] = amount string,  notesGrid[sc][d] = note string
  const [grid, setGrid]           = useState({});
  const [notesGrid, setNotesGrid] = useState({});
  // activeNote: { sc, d, top, left } | null
  const [activeNote, setActiveNote] = useState(null);
  const noteRef = useRef(null);
  const [draftSavedAt, setDraftSavedAt] = useState(null); // Date | null

  // Draft localStorage key — scoped to month + type
  const draftKey = `expenseManager_draft_${selectedMonth}_${activeTab}`;

  // Day-range filter (1-based day numbers within the month)
  const [fromDay, setFromDay] = useState(1);
  const [toDay,   setToDay]   = useState(() => {
    const today = new Date();
    const cur   = currentMonthStr();
    if (selectedMonth === cur) return today.getDate();
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  });

  function defaultToDay(monthStr) {
    const today = new Date();
    const [y, m] = monthStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    if (monthStr === currentMonthStr()) return Math.min(today.getDate(), lastDay);
    return lastDay;
  }

  // Reset range + grid when month or tab changes; restore draft if available
  useEffect(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    setFromDay(1);
    setToDay(defaultToDay(selectedMonth));
    setActiveNote(null);
    setDraftSavedAt(null);
    setOpenGroup(catGroups[0]?.category ?? null);
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const { grid: g, notesGrid: ng, savedAt } = JSON.parse(raw);
        setGrid(g || {});
        setNotesGrid(ng || {});
        setDraftSavedAt(savedAt ? new Date(savedAt) : null);
        return;
      }
    } catch (_) {}
    setGrid({});
    setNotesGrid({});
  }, [activeTab, selectedMonth]);

  function saveDraft() {
    const now = new Date();
    try {
      localStorage.setItem(draftKey, JSON.stringify({ grid, notesGrid, savedAt: now.toISOString() }));
    } catch (_) {}
    setDraftSavedAt(now);
  }

  function clearDraft() {
    try { localStorage.removeItem(draftKey); } catch (_) {}
    setDraftSavedAt(null);
  }

  const visibleDayLabels = useMemo(
    () => dayLabels.filter(({ d }) => d >= fromDay && d <= toDay),
    [dayLabels, fromDay, toDay]
  );
  const visibleDays = useMemo(() => visibleDayLabels.map(({ d }) => d), [visibleDayLabels]);

  // Close note popover on outside click
  useEffect(() => {
    if (!activeNote) return;
    function onDown(e) {
      if (noteRef.current && !noteRef.current.contains(e.target)) setActiveNote(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [activeNote]);

  function setCell(sc, d, val) {
    if (val !== '') {
      if (val.startsWith('=')) {
        // expression mode: allow digits, operators, parentheses, decimals, spaces
        if (!/^=[0-9\s+\-*/().]*$/.test(val)) return;
      } else {
        // plain number mode
        if (!/^\d*\.?\d*$/.test(val)) return;
      }
    }
    setGrid(prev => ({ ...prev, [sc]: { ...(prev[sc] || {}), [d]: val } }));
  }

  function commitCell(sc, d) {
    const val = (grid[sc] || {})[d] || '';
    if (!val.startsWith('=')) return;
    const result = evalExpression(val);
    setGrid(prev => ({ ...prev, [sc]: { ...(prev[sc] || {}), [d]: result } }));
  }

  function setNote(sc, d, val) {
    setNotesGrid(prev => ({ ...prev, [sc]: { ...(prev[sc] || {}), [d]: val } }));
  }

  function openNote(sc, d, e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const top  = rect.bottom + 6;
    const left = Math.min(rect.left, window.innerWidth - 232);
    setActiveNote({ sc, d, top, left });
  }

  const rowTotals = useMemo(() => {
    const t = {};
    subCats.forEach(sc => {
      t[sc] = visibleDays.reduce((s, d) => s + parseMoney((grid[sc] || {})[d] || ''), 0);
    });
    return t;
  }, [grid, subCats, visibleDays]);

  const colTotals = useMemo(() => {
    const t = {};
    visibleDays.forEach(d => {
      t[d] = subCats.reduce((s, sc) => s + parseMoney((grid[sc] || {})[d] || ''), 0);
    });
    return t;
  }, [grid, subCats, visibleDays]);

  const grandTotal = useMemo(
    () => Object.values(rowTotals).reduce((s, v) => s + v, 0),
    [rowTotals]
  );

  const filledCount = useMemo(() => {
    let n = 0;
    subCats.forEach(sc => visibleDays.forEach(d => { if (parseMoney((grid[sc] || {})[d] || '') > 0) n++; }));
    return n;
  }, [grid, subCats, visibleDays]);

  function handleSave() {
    const rows = [];
    subCats.forEach(sc => {
      // save ALL filled days, not just visible, so nothing is lost if range was narrowed
      days.forEach(d => {
        const amt = parseMoney((grid[sc] || {})[d] || '');
        if (amt > 0) {
          rows.push({
            _id: String(uid()),
            date: `${selectedMonth}-${String(d).padStart(2, '0')}`,
            subCategory: sc,
            amount: String(amt),
            notes: (notesGrid[sc] || {})[d] || '',
          });
        }
      });
    });
    onSave(activeTab, rows);
    setGrid({});
    setNotesGrid({});
    clearDraft();
  }

  const LABEL_W = 170;
  const TOTAL_W  = 82;
  const MIN_CELL = 52;

  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(es => setContainerW(es[0].contentRect.width));
    ro.observe(el);
    setContainerW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const CELL_W = useMemo(() => {
    if (!containerW || visibleDays.length === 0) return MIN_CELL;
    const available = containerW - LABEL_W - TOTAL_W - 2;
    return Math.max(MIN_CELL, Math.floor(available / visibleDays.length));
  }, [containerW, visibleDays.length]);

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Type tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(tab => {
          const c = TYPE_COLOR[tab];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab ? `${c.tab} bg-white` : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>{TAB_LABEL[tab]}</button>
          );
        })}
      </div>

      {/* Day-range filter bar */}
      {subCats.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50/60">
          <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">Show days</span>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={toDay} value={fromDay}
              onChange={e => setFromDay(Math.max(1, Math.min(Number(e.target.value), toDay)))}
              className="w-14 border border-gray-200 rounded px-2 py-1 text-[11px] text-center text-gray-700 [appearance:textfield]"
            />
            <span className="text-[11px] text-gray-300">–</span>
            <input type="number" min={fromDay} max={days.length} value={toDay}
              onChange={e => setToDay(Math.min(days.length, Math.max(Number(e.target.value), fromDay)))}
              className="w-14 border border-gray-200 rounded px-2 py-1 text-[11px] text-center text-gray-700 [appearance:textfield]"
            />
          </div>
          {(fromDay !== 1 || toDay !== days.length) && (
            <button onClick={() => { setFromDay(1); setToDay(days.length); }}
              className="text-[11px] text-gray-400 hover:text-gray-700 underline underline-offset-2">
              Reset
            </button>
          )}
          <span className="ml-auto text-[11px] text-gray-300">{visibleDays.length} day{visibleDays.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {subCats.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">No sub-categories loaded for this head.</div>
      ) : (
        <div ref={containerRef} className="overflow-auto" style={{ maxHeight: '62vh' }}>
          <table className="border-collapse w-full" style={{ tableLayout: 'fixed', minWidth: LABEL_W + visibleDays.length * MIN_CELL + TOTAL_W }}>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left text-[11px] text-gray-400 font-medium"
                  style={{ minWidth: LABEL_W, width: LABEL_W }}>Sub-category</th>
                {visibleDayLabels.map(({ d, label }) => (
                  <th key={d}
                    className={`sticky top-0 z-10 border-b border-gray-200 py-1.5 text-center text-[11px] font-medium ${
                      weekendSet.has(d) ? 'bg-slate-100 text-slate-400' : 'bg-gray-50 text-gray-400'
                    }`}
                    style={{ minWidth: CELL_W, width: CELL_W }}>
                    <div className="leading-tight">{d}</div>
                    <div className="text-[9px] opacity-60 leading-tight">{label}</div>
                  </th>
                ))}
                <th className="sticky top-0 right-0 z-20 bg-gray-50 border-b border-l border-gray-200 px-2 py-2 text-right text-[11px] text-gray-400 font-medium"
                  style={{ minWidth: TOTAL_W, width: TOTAL_W }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {catGroups.map(({ category, details }) => {
                const isCollapsed = openGroup !== category;
                const groupSubCats = details || [];
                const groupTotal = visibleDays.reduce((s, d) =>
                  s + groupSubCats.reduce((ss, sc) => ss + parseMoney((grid[sc] || {})[d] || ''), 0), 0);
                const colCount = visibleDays.length + 2; // label + days + total
                return (
                  <React.Fragment key={category}>
                    {/* Group header row */}
                    <tr className="bg-slate-50 border-y border-slate-200">
                      <td
                        className="sticky left-0 z-10 border-r border-slate-200 px-3 text-[11px] font-semibold text-slate-600 whitespace-nowrap bg-slate-50 cursor-pointer select-none"
                        style={{ minWidth: LABEL_W, height: 30 }}
                        onClick={() => toggleGroup(category)}
                      >
                        <span className="mr-1.5 text-slate-400">{isCollapsed ? '▶' : '▼'}</span>
                        {category}
                        {isCollapsed && groupTotal > 0 && (
                          <span className="ml-2 text-slate-400 font-normal">{Math.round(groupTotal).toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      {isCollapsed
                        ? <td colSpan={visibleDays.length + 1} className="bg-slate-50" />
                        : visibleDays.map(d => (
                            <td key={d} className={`border-r border-slate-100 bg-slate-50 ${weekendSet.has(d) ? 'bg-slate-100' : ''}`}
                              style={{ width: CELL_W, height: 30 }} />
                          ))
                      }
                      {!isCollapsed && (
                        <td className="sticky right-0 z-10 border-l border-slate-200 bg-slate-50"
                          style={{ minWidth: TOTAL_W, height: 30 }} />
                      )}
                    </tr>

                    {/* Sub-category rows */}
                    {!isCollapsed && groupSubCats.map((sc, si) => {
                      const rowBg = si % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                      return (
                        <tr key={sc}>
                          <td className={`sticky left-0 z-10 border-r border-gray-100 pl-7 pr-3 text-[11px] text-gray-700 font-medium whitespace-nowrap ${rowBg}`}
                            style={{ minWidth: LABEL_W, height: 36 }}>{sc}</td>
                          {visibleDays.map(d => {
                            const val      = (grid[sc] || {})[d] || '';
                            const note     = (notesGrid[sc] || {})[d] || '';
                            const filled   = parseMoney(val) > 0;
                            const hasNote  = note.trim().length > 0;
                            const isActive = activeNote && activeNote.sc === sc && activeNote.d === d;
                            const cellBg   = weekendSet.has(d)
                              ? 'bg-slate-50' : si % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                            return (
                              <td key={d}
                                className={`p-0 border border-gray-100 ${cellBg}`}
                                style={{ width: CELL_W, height: 36 }}>
                                <div className="relative group w-full h-full">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={val}
                                    onChange={e => setCell(sc, d, e.target.value)}
                                    onBlur={() => commitCell(sc, d)}
                                    className={`block w-full h-full px-1.5 text-[11px] bg-transparent outline-none
                                      focus:bg-sky-50 focus:ring-inset focus:ring-1 focus:ring-sky-300
                                      ${val.startsWith('=') ? 'text-left text-violet-600 font-normal' : ''}
                                      ${filled && !val.startsWith('=') ? 'text-right text-gray-800 font-semibold' : ''}
                                      ${!filled ? 'text-right text-gray-200 placeholder-gray-200' : ''}`}
                                    placeholder="·"
                                    style={{ width: CELL_W, height: 36, paddingBottom: hasNote ? 10 : undefined }}
                                  />
                                  {hasNote && (
                                    <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400 pointer-events-none" />
                                  )}
                                  <button
                                    onMouseDown={e => openNote(sc, d, e)}
                                    className={`absolute bottom-0.5 right-0.5 text-[9px] leading-none px-0.5 rounded transition-opacity
                                      ${isActive ? 'opacity-100 text-sky-500' : 'opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500'}`}
                                    tabIndex={-1}
                                    title="Add note"
                                  >✎</button>
                                </div>
                              </td>
                            );
                          })}
                          <td className={`sticky right-0 z-10 border-l border-gray-100 px-2 text-right text-[11px] font-semibold ${rowBg}`}
                            style={{ minWidth: TOTAL_W, height: 36 }}>
                            {rowTotals[sc] > 0
                              ? <span className="text-gray-700">{Math.round(rowTotals[sc]).toLocaleString('en-IN')}</span>
                              : <span className="text-gray-200">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="sticky left-0 z-10 border-r border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100">
                  Day total</td>
                {visibleDays.map(d => {
                  const t = colTotals[d];
                  return (
                    <td key={d} className={`border border-gray-100 px-1 py-1.5 text-right text-[11px] font-medium ${
                      weekendSet.has(d) ? 'bg-slate-100' : 'bg-gray-100'
                    } ${t > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                      {t > 0 ? Math.round(t).toLocaleString('en-IN') : '—'}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 border-l border-gray-200 px-2 py-1.5 text-right text-xs font-bold text-gray-800 bg-gray-100">
                  {grandTotal > 0 ? '₹' + Math.round(grandTotal).toLocaleString('en-IN') : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{filledCount} cell{filledCount !== 1 ? 's' : ''} filled</span>
        {draftSavedAt && (
          <span className="text-[11px] text-amber-500">
            Draft saved {draftSavedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={saveDraft} disabled={filledCount === 0}
            className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Save draft
          </button>
          <button onClick={handleSave} disabled={filledCount === 0}
            className="px-4 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Save{filledCount > 0 ? ` (${filledCount})` : ''}
          </button>
        </div>
      </div>

      {/* Note popover — fixed so it's never clipped by overflow:auto */}
      {activeNote && (
        <div ref={noteRef}
          className="fixed z-[300] bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-56"
          style={{ top: activeNote.top, left: activeNote.left }}
          onMouseDown={e => e.stopPropagation()}>
          <div className="text-[10px] text-gray-400 mb-2 font-medium">
            {activeNote.sc} · Day {activeNote.d}
          </div>
          <textarea
            autoFocus
            rows={3}
            value={(notesGrid[activeNote.sc] || {})[activeNote.d] || ''}
            onChange={e => setNote(activeNote.sc, activeNote.d, e.target.value)}
            placeholder="Add a note…"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-sky-300"
          />
          <button onClick={() => setActiveNote(null)}
            className="mt-2 w-full py-1.5 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-700">
            Done
          </button>
        </div>
      )}
    </div>
  );
}

// ── QUICK SLOTS CONFIG MODAL ──────────────────────────────────────────────

function QuickSlotsConfig({ categoryGroups, quickSlots, onToggle, onClose }) {
  // Build flat list of all sub-categories across all types
  const allItems = useMemo(() => {
    const result = [];
    Object.entries(categoryGroups).forEach(([type, groups]) => {
      (groups || []).forEach(({ category, details }) => {
        (details || []).forEach(det => {
          result.push({ subCategory: det, parentCategory: category, type });
        });
      });
    });
    return result;
  }, [categoryGroups]);

  const selectedKeys = new Set(quickSlots.map(s => s.subCategory));
  const canAddMore = quickSlots.length < MAX_QUICK_SLOTS;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Sheet — slides up from bottom */}
      <div
        className="relative mt-auto bg-white rounded-t-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Configure shortcuts</h3>
            <p className="text-xs text-gray-400 mt-0.5">{quickSlots.length}/{MAX_QUICK_SLOTS} selected</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {allItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No categories loaded yet.</p>
          )}
          {TABS.map(type => {
            const items = allItems.filter(i => i.type === type);
            if (items.length === 0) return null;
            return (
              <div key={type}>
                <p className={`text-xs font-semibold mb-2 ${TYPE_COLOR[type].text}`}>{TAB_LABEL[type]}</p>
                <div className="grid grid-cols-3 gap-2">
                  {items.map(item => {
                    const selected = selectedKeys.has(item.subCategory);
                    return (
                      <button
                        key={item.subCategory}
                        onClick={() => onToggle(item)}
                        disabled={!selected && !canAddMore}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors
                          ${ selected
                              ? `${TYPE_COLOR[type].bg} ${TYPE_COLOR[type].border} ${TYPE_COLOR[type].text}`
                              : canAddMore
                                ? 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                          }`}
                      >
                        <span className="text-xl">{catEmoji(item.subCategory)}</span>
                        <span className="truncate w-full text-center px-1 leading-tight">{item.subCategory}</span>
                        {selected && <span className="text-[10px] opacity-60">✓ selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-800 text-white text-sm rounded font-medium hover:bg-gray-700"
          >Done</button>
        </div>
      </div>
    </div>
  );
}

// ── MOBILE QUICK ENTRY (redesigned) ───────────────────────────────────────

function QuickEntrySection({ categoryGroups, onAdd, transactions }) {
  const today = todayStr();
  const [date, setDate]           = useState(today);
  const [txnType, setTxnType]     = useState('Expense');
  const [parentCat, setParentCat] = useState('');
  const [subCat, setSubCat]       = useState('');
  const [amount, setAmount]       = useState('');
  const [notes, setNotes]         = useState('');
  const [pending, setPending]     = useState([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [quickSlots, setQuickSlots] = useState(loadQuickSlots);
  const amountRef = useRef(null);

  // Pad slots to always show MAX_QUICK_SLOTS tiles
  const slotTiles = useMemo(() => {
    const tiles = [...quickSlots];
    while (tiles.length < MAX_QUICK_SLOTS) tiles.push(null);
    return tiles;
  }, [quickSlots]);

  function toggleSlot(item) {
    setQuickSlots(prev => {
      const exists = prev.find(s => s.subCategory === item.subCategory);
      const next = exists
        ? prev.filter(s => s.subCategory !== item.subCategory)
        : prev.length < MAX_QUICK_SLOTS ? [...prev, item] : prev;
      persistQuickSlots(next);
      return next;
    });
  }

  // Parent categories for the selected type
  const parentCats = useMemo(
    () => (categoryGroups[txnType] || []).map(g => g.category),
    [categoryGroups, txnType]
  );

  // Sub-categories for the selected parent
  const subCats = useMemo(
    () => (categoryGroups[txnType] || []).find(g => g.category === parentCat)?.details || [],
    [categoryGroups, txnType, parentCat]
  );

  function handleTypeChange(t) { setTxnType(t); setParentCat(''); setSubCat(''); }
  function handleParentChange(p) { setParentCat(p); setSubCat(''); }

  function tapSlot(slot) {
    setTxnType(slot.type || 'Expense');
    setParentCat(slot.parentCategory || '');
    setSubCat(slot.subCategory || '');
    setAmount('');
    setTimeout(() => amountRef.current?.focus(), 80);
  }

  const canAdd = parseMoney(amount) > 0;

  function addToPending() {
    const amt = parseMoney(amount);
    if (!amt) return;
    setPending(prev => [...prev, { _id: uid(), date, type: txnType, parentCat, subCategory: subCat, amount: amt, notes }]);
    setAmount('');
    setNotes('');
    setTimeout(() => amountRef.current?.focus(), 80);
  }

  function removePending(id) { setPending(prev => prev.filter(e => e._id !== id)); }

  function saveAll() {
    if (pending.length === 0) return;
    const snapshot = [...pending];
    setPending([]);
    snapshot.forEach(entry => onAdd({
      id: String(uid()), date: entry.date,
      type: entry.type, subCategory: entry.subCategory,
      amount: entry.amount, notes: entry.notes,
    }));
  }

  const todayTxns = useMemo(() => transactions.filter(t => t.date === today), [transactions]);
  const todayTotal = todayTxns.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
  const pendingTotal = pending.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-3">

      {/* Config modal */}
      {configOpen && (
        <QuickSlotsConfig
          categoryGroups={categoryGroups}
          quickSlots={quickSlots}
          onToggle={toggleSlot}
          onClose={() => setConfigOpen(false)}
        />
      )}

      {/* Quick shortcut tiles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-400">Quick fill</p>
          <button
            onClick={() => setConfigOpen(true)}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
            aria-label="Configure shortcuts"
          >
            <span>✎</span><span>Edit</span>
          </button>
        </div>

        {/* 5 equal icon tiles */}
        <div className="grid gap-2" style={{gridTemplateColumns: 'repeat(5, 1fr)'}}>
          {slotTiles.map((slot, i) => slot ? (
            <button
              key={slot.subCategory}
              onClick={() => tapSlot(slot)}
              className="flex flex-col items-center gap-1 py-3 bg-white border border-gray-200 rounded-xl active:bg-gray-50 transition-colors min-w-0"
            >
              <span className="text-2xl leading-none">{catEmoji(slot.subCategory)}</span>
              <span className="text-[10px] text-gray-600 truncate w-full text-center px-0.5 leading-tight">{slot.subCategory}</span>
            </button>
          ) : (
            <button
              key={`empty-${i}`}
              onClick={() => setConfigOpen(true)}
              className="flex flex-col items-center justify-center py-3 border border-dashed border-gray-200 rounded-xl text-gray-300 hover:border-gray-400 hover:text-gray-400 transition-colors"
              aria-label="Add shortcut"
            >
              <span className="text-xl leading-none">+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today mini-summary */}
      <div className="text-xs text-gray-400">
        Today: {todayTxns.length} {todayTxns.length === 1 ? 'entry' : 'entries'}
        {todayTotal > 0 ? ` · ${fmt(todayTotal)} spent` : ''}
      </div>

      {/* Add Entry card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Add Entry</h3>
        </div>

        <div className="px-4 py-3 space-y-3">

          {/* 1. Date */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
          </div>

          {/* 2. Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <div className="grid grid-cols-4 gap-1">
              {TABS.map(t => (
                <button key={t} onClick={() => handleTypeChange(t)}
                  className={`py-1.5 text-xs rounded font-medium transition-colors ${
                    txnType === t ? TYPE_COLOR[t].badge : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          {/* 3. Category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select value={parentCat} onChange={e => handleParentChange(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
              <option value="">-- select category --</option>
              {parentCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 4. Sub-category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sub-category</label>
            {subCats.length > 0 ? (
              <select value={subCat} onChange={e => setSubCat(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                <option value="">-- select sub-category --</option>
                {subCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" value={subCat} onChange={e => setSubCat(e.target.value)}
                placeholder={parentCat ? 'Enter sub-category' : 'Select category first'}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
            )}
          </div>

          {/* 5. Amount */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
            <input ref={amountRef} type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canAdd) addToPending(); }}
              placeholder="0" min="0" step="0.01" inputMode="decimal"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canAdd) addToPending(); }}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm" />
          </div>

          <button onClick={addToPending} disabled={!canAdd}
            className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            + Add to list
          </button>
        </div>

        {/* Pending entries */}
        {pending.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {pending.length} pending
              </span>
              <span className="text-xs font-semibold text-gray-700">{fmt(pendingTotal)}</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {pending.map(e => (
                <li key={e._id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <span className="text-sm text-gray-800 truncate block">{e.subCategory || e.parentCat || e.type}</span>
                    <span className="text-xs text-gray-400">{fmtDate(e.date)}{e.notes ? ` · ${e.notes}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLOR[e.type]?.badge || ''}`}>{e.type}</span>
                    <span className="text-sm font-medium text-gray-700">{fmt(e.amount)}</span>
                    <button onClick={() => removePending(e._id)}
                      className="text-gray-300 hover:text-red-400 text-xs leading-none" aria-label="Remove">✕</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-gray-100">
              <button onClick={saveAll}
                className="w-full py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 font-medium">
                Save {pending.length} {pending.length === 1 ? 'entry' : 'entries'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TRANSACTIONS PAGE ──────────────────────────────────────────────────────

function TransactionsPage({ transactions, onBack, onLoadMonth, initialMonth, onDelete }) {
  // ── Period filter state ─────────────────────────────────────────────────
  const [periodMode, setPeriodMode] = useState('month');  // 'month' | 'range'
  const [filterMonth, setFilterMonth] = useState(() => initialMonth || currentMonthStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Head (type) filter state — independent of period ───────────────────
  const [headFilter, setHeadFilter] = useState('All'); // 'All' | 'Expense' | 'Income' | 'Savings' | 'Payoff'

  // Load month whenever month mode + filterMonth changes
  useEffect(() => {
    if (periodMode !== 'month') return;
    setLoading(true);
    onLoadMonth(filterMonth).finally(() => setLoading(false));
  }, [filterMonth, periodMode]);

  // Load range on demand
  async function loadRange() {
    if (!fromDate || !toDate || fromDate > toDate) return;
    setLoading(true);
    const [fy, fm] = fromDate.split('-').map(Number);
    const [ty, tm] = toDate.split('-').map(Number);
    const months = [];
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
      if (m === 12) { y++; m = 1; } else m++;
    }
    try { for (const mo of months) await onLoadMonth(mo); }
    finally { setLoading(false); }
  }

  // ── Apply both filters independently ───────────────────────────────────
  const periodFiltered = useMemo(() => {
    if (periodMode === 'month') {
      return transactions.filter(t => t.date.startsWith(filterMonth));
    }
    if (periodMode === 'range' && fromDate && toDate) {
      return transactions.filter(t => t.date >= fromDate && t.date <= toDate);
    }
    return transactions;
  }, [transactions, periodMode, filterMonth, fromDate, toDate]);

  const filtered = useMemo(() => {
    const list = headFilter === 'All'
      ? periodFiltered
      : periodFiltered.filter(t => t.type === headFilter);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [periodFiltered, headFilter]);

  // Totals across the period (all heads), so head pills show useful numbers
  const periodTotals = useMemo(() => {
    const t = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
    periodFiltered.forEach(tx => { t[tx.type] = (t[tx.type] || 0) + tx.amount; });
    return t;
  }, [periodFiltered]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-sm font-medium">&#8592; Back</button>
          <h2 className="text-base font-semibold text-gray-800">Transactions</h2>
          {loading && <span className="text-xs text-gray-400 animate-pulse ml-1">Loading…</span>}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} entries</span>
        </div>

        {/* ── Filter card ── */}
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">

          {/* Period row */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Period</span>
              <div className="flex gap-1">
                {['month', 'range'].map(m => (
                  <button key={m} onClick={() => setPeriodMode(m)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      periodMode === m ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{m === 'month' ? 'Month' : 'Range'}</button>
                ))}
              </div>
            </div>

            {periodMode === 'month' && (
              <div className="flex justify-center pt-1">
                <MonthSelector selectedMonth={filterMonth} onChange={setFilterMonth} />
              </div>
            )}

            {periodMode === 'range' && (
              <div className="flex flex-wrap items-end gap-3 pt-1">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">From</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">To</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-sm" />
                </div>
                <button onClick={loadRange}
                  disabled={!fromDate || !toDate || fromDate > toDate || loading}
                  className="px-4 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >{loading ? 'Loading…' : 'Load'}</button>
              </div>
            )}
          </div>

          {/* Head row */}
          <div className="px-4 py-3 space-y-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Head</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => setHeadFilter('All')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  headFilter === 'All' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>All</button>
              {TABS.map(type => {
                const c = TYPE_COLOR[type];
                const amt = periodTotals[type];
                return (
                  <button key={type} onClick={() => setHeadFilter(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                      headFilter === type ? c.badge : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    <span>{type}</span>
                    {amt > 0 && <span className="opacity-70">{fmt(amt)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {loading ? 'Loading…' : 'No transactions for this period.'}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Sub-category</th>
                  <th className="px-4 py-2 text-right font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Head</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const c = TYPE_COLOR[t.type] || TYPE_COLOR.Expense;
                  return (
                    <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                      <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.date)}</td>
                      <td className="px-4 py-2.5 text-gray-800">
                        <div>{t.subCategory || <span className="text-gray-300">—</span>}</div>
                        {t.notes && <div className="text-xs text-gray-400">{t.notes}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">{fmt(t.amount)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{t.type}</span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {onDelete && (
                          <button
                            onClick={() => onDelete(t)}
                            className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1"
                            aria-label="Delete"
                          >✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ANALYTICS PAGE ─────────────────────────────────────────────────────────

function AnalyticsPage({ onBack }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear]               = useState(currentYear);
  const [mode, setMode]               = useState('year'); // 'year' | 'custom'
  const [customMonths, setCustomMonths] = useState([]);
  const [activeType, setActiveType]   = useState('Expense');
  const [monthData, setMonthData]     = useState({}); // 'YYYY-MM' → tx[]
  const [fetchedYears, setFetchedYears] = useState(() => new Set());
  const [loading, setLoading]         = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);

  async function fetchYear(y) {
    if (fetchedYears.has(y)) return;
    setLoading(true);
    try {
      const res = await callBackend({ action: 'getExpensesByYear', year: y });
      if (res.success) {
        setMonthData(prev => ({ ...prev, ...res.expensesByMonth }));
        setFetchedYears(prev => new Set([...prev, y]));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchYear(year); }, [year]);

  // Which months to show
  const displayMonths = useMemo(() => {
    if (mode === 'year')
      return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    return [...customMonths].sort();
  }, [mode, year, customMonths]);

  // Flat filtered transactions
  const filteredTxs = useMemo(() =>
    displayMonths.flatMap(m => (monthData[m] || []).filter(t => t.type === activeType)),
    [displayMonths, monthData, activeType]
  );

  // Monthly totals for trend chart
  const monthTotals = useMemo(() =>
    displayMonths.map(m => ({
      month: m,
      total: (monthData[m] || [])
        .filter(t => t.type === activeType)
        .reduce((s, t) => s + t.amount, 0),
    })),
    [displayMonths, monthData, activeType]
  );
  const maxTotal = Math.max(...monthTotals.map(m => m.total), 1);

  // Category breakdown (parent → subs)
  const catBreakdown = useMemo(() => {
    const map = {};
    for (const t of filteredTxs) {
      const p = t.parentCategory || t.category;
      if (!map[p]) map[p] = { total: 0, subs: {} };
      map[p].total += t.amount;
      const s = t.category || p;
      map[p].subs[s] = (map[p].subs[s] || 0) + t.amount;
    }
    const grand = Object.values(map).reduce((s, v) => s + v.total, 0) || 1;
    return Object.entries(map)
      .map(([cat, v]) => ({
        cat,
        total: v.total,
        pct: (v.total / grand * 100).toFixed(1),
        subs: Object.entries(v.subs)
          .map(([s, a]) => ({ s, a, pct: (a / grand * 100).toFixed(1) }))
          .sort((a, b) => b.a - a.a),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs]);

  // MoM table
  const momCats = useMemo(() => {
    const set = new Set(filteredTxs.map(t => t.parentCategory || t.category));
    return [...set];
  }, [filteredTxs]);

  const momData = useMemo(() =>
    momCats.map(cat => ({
      cat,
      values: displayMonths.map(m =>
        (monthData[m] || [])
          .filter(t => t.type === activeType && (t.parentCategory || t.category) === cat)
          .reduce((s, t) => s + t.amount, 0)
      ),
    })).sort((a, b) =>
      b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0)
    ),
    [momCats, displayMonths, monthData, activeType]
  );

  const barColor = BAR_COLOR[activeType] || '#94a3b8';
  // For Income/Savings: rising = good (green ↑); for Expense/Payoff: rising = bad (red ↑)
  const goodUp   = activeType === 'Income' || activeType === 'Savings';

  function toggleCustomMonth(m) {
    const y = parseInt(m.split('-')[0], 10);
    fetchYear(y);
    setCustomMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">

      {/* ── Controls bar ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700">&#8592; Back</button>
        <span className="text-sm font-semibold text-gray-700">Analytics</span>

        {/* Year / Custom toggle */}
        <div className="flex items-center ml-auto">
          <button
            onClick={() => setMode('year')}
            className={`text-xs px-3 py-1.5 rounded-l border ${mode === 'year' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-gray-300 hover:border-slate-400'}`}
          >Year</button>
          <button
            onClick={() => setMode('custom')}
            className={`text-xs px-3 py-1.5 rounded-r border-t border-b border-r ${mode === 'custom' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-gray-300 hover:border-slate-400'}`}
          >Custom</button>
        </div>

        {/* Year stepper (year mode) */}
        {mode === 'year' && (
          <div className="flex items-center gap-1">
            <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 text-gray-400 hover:text-gray-700">&#8249;</button>
            <span className="text-sm font-medium w-12 text-center text-gray-700">{year}</span>
            <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear} className="px-2 py-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">&#8250;</button>
          </div>
        )}

        {/* Type tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setActiveType(t); setExpandedCat(null); }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${activeType === t ? 'text-white border-transparent' : 'bg-white text-slate-500 border-gray-300 hover:border-slate-400'}`}
              style={activeType === t ? { backgroundColor: BAR_COLOR[t] } : {}}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* ── Custom month picker ── */}
      {mode === 'custom' && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500 font-medium">Pick months:</span>
            <button onClick={() => setYear(y => y - 1)} className="text-gray-400 hover:text-gray-700 px-1 text-sm">&#8249;</button>
            <span className="text-xs font-medium text-gray-700">{year}</span>
            <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1 text-sm">&#8250;</button>
            {customMonths.length > 0 && (
              <button onClick={() => setCustomMonths([])} className="text-xs text-red-400 hover:text-red-600 ml-auto">Clear all</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MONTH_NAMES.map((n, i) => {
              const m   = `${year}-${String(i + 1).padStart(2, '0')}`;
              const sel = customMonths.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleCustomMonth(m)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${sel ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-gray-300 hover:border-slate-400'}`}
                >{n} {year}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        )}

        {!loading && displayMonths.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Select months to view analytics.</div>
        )}

        {!loading && displayMonths.length > 0 && (
          <>
            {/* MONTHLY TREND */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{activeType} — Monthly Trend</h3>
              {monthTotals.every(m => m.total === 0) ? (
                <p className="text-sm text-gray-400 text-center py-6">No data for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1.5 min-w-max pb-1" style={{ height: '180px' }}>
                    {monthTotals.map(({ month, total }) => {
                      const barH = total > 0 ? Math.max((total / maxTotal) * 140, 4) : 0;
                      const label = MONTH_NAMES[parseInt(month.split('-')[1], 10) - 1];
                      return (
                        <div key={month} className="relative group flex flex-col items-center justify-end gap-1" style={{ width: '44px', height: '180px' }}>
                          <span className="absolute top-0 left-0 right-0 text-center text-gray-500" style={{ fontSize: '9px' }}>
                            {total > 0 ? fmtK(total) : ''}
                          </span>
                          <div className="w-8 rounded-t mx-auto" style={{ height: `${barH}px`, backgroundColor: barColor }} />
                          <span className="text-gray-500 shrink-0" style={{ fontSize: '10px' }}>{label}</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                            {label}: {fmt(total)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CATEGORY BREAKDOWN */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h3>
              {catBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No data for this period.</p>
              ) : (
                <div className="space-y-2">
                  {catBreakdown.map(({ cat, total, pct, subs }) => (
                    <div key={cat}>
                      <button className="w-full text-left" onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}>
                        <div className="flex items-center gap-2 py-1">
                          <span className="text-sm text-gray-700 shrink-0 w-32 truncate">{cat}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0 w-28 text-right">
                            {fmt(total)} <span className="text-gray-400">({pct}%)</span>
                          </span>
                          <span className="text-gray-400 text-xs shrink-0">{expandedCat === cat ? '▲' : '▼'}</span>
                        </div>
                      </button>
                      {expandedCat === cat && (
                        <div className="ml-4 mt-1 mb-2 space-y-1.5">
                          {subs.map(({ s, a, pct: sp }) => (
                            <div key={s} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 shrink-0 w-28 truncate">{s}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${sp}%`, backgroundColor: barColor, opacity: 0.65 }} />
                              </div>
                              <span className="text-xs text-gray-400 shrink-0 w-16 text-right">{fmt(a)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MONTH-OVER-MONTH TABLE */}
            {displayMonths.length > 1 && momData.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Month-over-Month</h3>
                <table className="text-xs w-full min-w-max">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1.5 pr-4 font-medium text-gray-600 sticky left-0 bg-white min-w-[120px]">Category</th>
                      {displayMonths.map(m => (
                        <th key={m} className="text-right py-1.5 px-2 font-medium text-gray-600 whitespace-nowrap">
                          {MONTH_NAMES[parseInt(m.split('-')[1], 10) - 1]} {m.split('-')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {momData.map(({ cat, values }) => (
                      <tr key={cat} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="py-1.5 pr-4 text-gray-700 sticky left-0 bg-white">{cat}</td>
                        {values.map((v, i) => {
                          const prev  = i > 0 ? values[i - 1] : null;
                          const diff  = prev !== null && prev > 0 ? v - prev : 0;
                          const up    = diff > 0;
                          const arrowCls = up
                            ? (goodUp ? 'text-green-500' : 'text-red-500')
                            : (goodUp ? 'text-red-500'   : 'text-green-500');
                          return (
                            <td key={i} className="py-1.5 px-2 text-right text-gray-700 whitespace-nowrap">
                              {v > 0 ? fmt(v) : <span className="text-gray-300">—</span>}
                              {diff !== 0 && <span className={`ml-0.5 ${arrowCls}`}>{up ? '↑' : '↓'}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-gray-200 font-semibold">
                      <td className="py-2 pr-4 text-gray-700 sticky left-0 bg-white">Total</td>
                      {displayMonths.map(m => {
                        const total = (monthData[m] || [])
                          .filter(t => t.type === activeType)
                          .reduce((s, t) => s + t.amount, 0);
                        return (
                          <td key={m} className="py-2 px-2 text-right text-gray-700 whitespace-nowrap">
                            {total > 0 ? fmt(total) : <span className="text-gray-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── DASHBOARD PAGE ─────────────────────────────────────────────────────────

function DashboardPage({
  transactions, selectedMonth, setSelectedMonth,
  bulkRows, setBulkRows, activeTab, setActiveTab,
  categoryGroups, onBulkSave, onQuickAdd, budgets,
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Month selector */}
        <div className="flex items-center justify-center">
          <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        </div>

        {/* Summary cards */}
        <SummaryCards transactions={transactions} selectedMonth={selectedMonth} budgets={budgets} />

        {/* Desktop: spreadsheet grid (md and above) */}
        <div className="hidden md:block">
          <SpreadsheetGrid
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categoryGroups={categoryGroups}
            selectedMonth={selectedMonth}
            onSave={onBulkSave}
          />
        </div>

        {/* Mobile: quick entry (below md) */}
        <div className="md:hidden">
          <QuickEntrySection
            categoryGroups={categoryGroups}
            onAdd={onQuickAdd}
            transactions={transactions}
          />
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ───────────────────────────────────────────────────────────────

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage,   setCurrentPage]   = useState('dashboard');
  const [transactions,  setTransactions]  = useState([]);
  const [categoryGroups, setCategoryGroups] = useState({ Expense: [], Income: [], Savings: [], Payoff: [] });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [toast, setToast]   = useState(null);
  const [activeTab, setActiveTab] = useState('Expense');
  const [bulkRows, setBulkRows]   = useState({
    Expense: initRows(),
    Income:  initRows(),
    Savings: initRows(),
    Payoff:  initRows(),
  });
  const [budgets, setBudgets] = useState([]);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  // ── Backend: load budgets
  const loadBudgets = useCallback(async () => {
    try {
      const res = await callBackend({ action: 'getBudgets' });
      if (res?.success) setBudgets(res.budgets || []);
    } catch (e) {
      console.warn('[APP] loadBudgets failed', e);
    }
  }, []);

  // ── Backend: load dashboard data for a month
  const loadDashboardData = useCallback(async (monthStr) => {
    const [y, m] = monthStr.split('-').map(Number);
    setLoadingOverlay(true);
    try {
      const result = await callBackend({ action: 'getDashboardData', year: y, month: m });
      if (result?.error === 'UNAUTHORIZED') { window.appAuth?.handleUnauthorized?.(); return; }
      if (result?.success) {
        // Update category groups if returned
        if (result.categoryGroups && typeof result.categoryGroups === 'object') {
          setCategoryGroups(result.categoryGroups);
        }
        // Flatten and merge this month's transactions
        const flat = flattenExpensesByDate(result.expensesByDate || {});
        setTransactions(prev => {
          const others = prev.filter(t => !t.date.startsWith(monthStr));
          return [...others, ...flat];
        });
      }
    } catch (e) {
      console.warn('[APP] loadDashboardData failed', e);
      showToast('Failed to load data', 'error');
    } finally {
      setLoadingOverlay(false);
    }
  }, [showToast]);

  // Keep a ref so window callbacks always invoke the latest version
  const loadDashRef = useRef(loadDashboardData);
  useEffect(() => { loadDashRef.current = loadDashboardData; }, [loadDashboardData]);

  const selectedMonthRef = useRef(selectedMonth);
  useEffect(() => { selectedMonthRef.current = selectedMonth; }, [selectedMonth]);

  // ── Wire window callbacks that auth.js calls
  useEffect(() => {
    // auth.js calls these after successful sign-in / session restore
    window.initializeAppAfterAuth = () => {
      setIsInitialized(true);
      return true; // signal "ready" back to auth.js
    };
    window.loadHomeData = () => {
      // No-op: the isInitialized effect handles the initial load after auth.
      // auth.js calls this right after initializeAppAfterAuth(); the effect
      // already fires from the isInitialized state change, so we skip here
      // to avoid a double API call.
    };
    window.resetAppInitialization = () => {
      setIsInitialized(false);
      setTransactions([]);
      setCategoryGroups({ Expense: [], Income: [], Savings: [], Payoff: [] });
      setCurrentPage('dashboard');
    };

    // Hide the loading overlay now that React has mounted
    setLoadingOverlay(false);

    // If auth.js already ran restoreSession before React mounted, self-initialize
    if (window.appAuth?.isSignedIn()) {
      setIsInitialized(true);
    }

    return () => {
      delete window.initializeAppAfterAuth;
      delete window.loadHomeData;
      delete window.resetAppInitialization;
    };
  }, []); // run once on mount only

  // ── Load data when initialized (first time)
  useEffect(() => {
    if (!isInitialized) return;
    loadDashboardData(selectedMonth);
    loadBudgets();
  }, [isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload when selected month changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    loadDashboardData(selectedMonth);
  }, [selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bulk save (Phases 3 + 6)
  const handleBulkSave = useCallback(async (type, rows) => {
    const filled = rows.filter(r => r.subCategory && parseMoney(r.amount) > 0);
    if (filled.length === 0) { showToast('No filled rows to save', 'error'); return; }

    const lookup = buildSubCatLookup(categoryGroups);

    // Group by date for API calls
    const byDate = {};
    filled.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });

    setLoadingOverlay(true);
    try {
      const allSaved = [];

      for (const [date, dateRows] of Object.entries(byDate)) {
        const result = await callBackend({
          action:   'saveExpenses',
          date,
          expenses: dateRows.map(r => {
            const meta = lookup[r.subCategory] || {};
            return {
              type:     meta.type || type,
              category: meta.parentCategory || r.subCategory || type,
              detail:   r.subCategory,
              amount:   parseMoney(r.amount),
              notes:    r.notes,
            };
          }),
        });

        if (result?.error === 'UNAUTHORIZED') { window.appAuth?.handleUnauthorized?.(); return; }

        if (result?.success) {
          const savedItems = result.savedExpenses || dateRows.map(r => ({
            id: String(uid()), date, type,
            subCategory: r.subCategory,
            amount: parseMoney(r.amount),
            notes: r.notes,
          }));
          savedItems.forEach(e => allSaved.push({
            id: e.id || String(uid()),
            date: e.date || date,
            type: e.type || type,
            subCategory: e.detail || e.subCategory || '',
            amount: parseMoney(e.amount),
            notes: e.notes || '',
          }));
        }
      }

      if (allSaved.length > 0) {
        setTransactions(prev => [...prev, ...allSaved]);
        setBulkRows(prev => ({ ...prev, [type]: initRows() }));
        showToast(`Saved ${allSaved.length} ${allSaved.length === 1 ? 'entry' : 'entries'}`);
      }
    } catch (e) {
      console.error('[APP] Bulk save error', e);
      showToast('Save failed', 'error');
    } finally {
      setLoadingOverlay(false);
    }
  }, [categoryGroups, showToast]);

  // ── Quick add (Phase 4 + 6)
  const handleDelete = useCallback(async (transaction) => {
    if (!window.confirm(`Delete "${transaction.subCategory || transaction.type}" — ${fmt(transaction.amount)}?`)) return;
    // Optimistic remove
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    try {
      const result = await callBackend({ action: 'deleteExpense', id: transaction.id });
      if (result?.error === 'UNAUTHORIZED') { window.appAuth?.handleUnauthorized?.(); return; }
      if (result?.success) {
        showToast('Deleted');
      } else {
        setTransactions(prev => [...prev, transaction]);
        showToast('Delete failed', 'error');
      }
    } catch (e) {
      setTransactions(prev => [...prev, transaction]);
      showToast('Delete failed', 'error');
    }
  }, [showToast]);

  const handleQuickAdd = useCallback(async (transaction) => {
    // Optimistic local add
    setTransactions(prev => [...prev, transaction]);

    const lookup = buildSubCatLookup(categoryGroups);
    const meta   = lookup[transaction.subCategory] || {};

    try {
      const result = await callBackend({
        action: 'saveExpenses',
        date:   transaction.date,
        expenses: [{
          type:     meta.type || transaction.type,
          category: meta.parentCategory || transaction.subCategory || transaction.type,
          detail:   transaction.subCategory,
          amount:   transaction.amount,
          notes:    transaction.notes || '',
        }],
      });

      if (result?.error === 'UNAUTHORIZED') { window.appAuth?.handleUnauthorized?.(); return; }

      if (result?.success) {
        // Patch ID from backend if returned
        const backendId = result.savedExpenses?.[0]?.id;
        if (backendId) {
          setTransactions(prev =>
            prev.map(t => t.id === transaction.id ? { ...t, id: backendId } : t)
          );
        }
        showToast('Saved');
      } else {
        // Roll back
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
        showToast('Save failed', 'error');
      }
    } catch (e) {
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      showToast('Save failed', 'error');
    }
  }, [categoryGroups, showToast]);

  // Don't render until auth is complete (auth.js controls #app-root visibility)
  if (!isInitialized) return null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <TopNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={() => window.appAuth?.logout?.()}
      />

      {currentPage === 'dashboard' && (
        <DashboardPage
          transactions={transactions}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          bulkRows={bulkRows}
          setBulkRows={setBulkRows}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          categoryGroups={categoryGroups}
          onBulkSave={handleBulkSave}
          onQuickAdd={handleQuickAdd}
          budgets={budgets}
        />
      )}

      {currentPage === 'transactions' && (
        <TransactionsPage
          transactions={transactions}
          onBack={() => setCurrentPage('dashboard')}
          onLoadMonth={loadDashboardData}
          initialMonth={selectedMonth}
          onDelete={handleDelete}
        />
      )}

      {currentPage === 'budget' && (
        <BudgetPage
          categoryGroups={categoryGroups}
          onBack={() => setCurrentPage('dashboard')}
          showToast={showToast}
        />
      )}

      {currentPage === 'analytics' && (
        <AnalyticsPage
          onBack={() => setCurrentPage('dashboard')}
        />
      )}

      <AppToast toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}

// ── MOUNT ──────────────────────────────────────────────────────────────────
const _root = ReactDOM.createRoot(document.getElementById('app-root'));
_root.render(<App />);
