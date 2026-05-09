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

function makeQuickRow(prevDate, type, parentCat, subCategory) {
  return {
    _id:         uid(),
    date:        prevDate    || todayStr(),
    type:        type        || 'Expense',
    parentCat:   parentCat   || '',
    subCategory: subCategory || '',
    amount:      '',
    notes:       '',
  };
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
    <header className="shrink-0 bg-slate-800 border-b border-slate-700 relative z-50 md:hidden">
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

// ── SIDE NAV (desktop only, md+) ──────────────────────────────────────────

function SideNav({ currentPage, setCurrentPage, onLogout }) {
  const NAV_ITEMS = [
    {
      page: 'dashboard', label: 'Home',
      icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      page: 'analytics', label: 'Analytics',
      icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      page: 'transactions', label: 'Transactions',
      icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
    {
      page: 'budget', label: 'Budget',
      icon: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  const userEmail = window.appAuth?.getUserEmail?.() || '';

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex flex-col w-14 bg-slate-800 text-white shrink-0 h-screen">
      {/* Brand icon */}
      <div className="flex items-center justify-center h-14 border-b border-slate-700 shrink-0">
        <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Nav items — icons only */}
      <nav className="flex-1 py-3 flex flex-col items-center gap-1">
        {NAV_ITEMS.map(({ page, label, icon }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              title={label}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border-l-2 ${
                isActive
                  ? 'bg-slate-700 text-sky-300 border-sky-400'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white border-transparent'
              }`}
            >
              {icon}
            </button>
          );
        })}
      </nav>

      {/* Bottom: logout icon */}
      <div className="flex items-center justify-center pb-4 border-t border-slate-700 pt-3 shrink-0">
        <button
          onClick={onLogout}
          title="Logout"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

// Month selector
function MonthSelector({ selectedMonth, onChange, compact = false }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(prevMonth(selectedMonth))}
        className={`${compact ? 'px-1.5 py-0.5 text-base' : 'px-2 py-1 text-lg'} text-gray-400 hover:text-gray-700 leading-none`}
        aria-label="Previous month"
      >&#8249;</button>
      <input
        type="month"
        value={selectedMonth}
        onChange={e => onChange(e.target.value)}
        className={`border border-gray-200 rounded text-gray-700 bg-white ${compact ? 'px-2 py-0.5 text-xs' : 'px-2 py-1 text-sm'}`}
      />
      <button
        onClick={() => onChange(nextMonth(selectedMonth))}
        className={`${compact ? 'px-1.5 py-0.5 text-base' : 'px-2 py-1 text-lg'} text-gray-400 hover:text-gray-700 leading-none`}
        aria-label="Next month"
      >&#8250;</button>
    </div>
  );
}

// Summary cards
function SummaryCards({ transactions, selectedMonth, budgets, onCardClick, compact = false }) {
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
    <div className={`grid grid-cols-2 md:grid-cols-4 ${compact ? 'gap-2' : 'gap-3'}`}>
      {TABS.map(type => {
        const c       = TYPE_COLOR[type];
        const spent   = totals[type];
        const budget  = budgetTotals[type];
        const hasBudget = budget > 0;
        const pct     = hasBudget ? (spent / budget) * 100 : 0;
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
              ? `${Math.round(pct)}% · over by ₹${Math.round(spent - budget).toLocaleString('en-IN')}`
              : `${Math.round(pct)}% of ₹${Math.round(budget).toLocaleString('en-IN')}`);
        return (
          <button
            key={type}
            onClick={() => onCardClick && onCardClick(type)}
            className={`${c.bg} ${c.border} border rounded-lg text-left w-full cursor-pointer hover:shadow-md transition-shadow ${compact ? 'h-9 px-2 py-1 flex items-center gap-2' : 'p-3'}`}
          >
            {compact ? (
              <>
                <div className="text-[10px] text-gray-500 truncate">{TAB_LABEL[type]}</div>
                {hasBudget && (
                  <div className={`text-[10px] leading-none ${labelColor}`}>{Math.round(pct)}%</div>
                )}
                <div className={`text-sm md:text-base font-bold ml-auto leading-none ${c.text}`}>{'₹' + Math.round(spent).toLocaleString('en-IN')}</div>
              </>
            ) : (
              <>
                <div className="text-xs mb-1 text-gray-500">{TAB_LABEL[type]}</div>
                <div className={`text-xl font-bold text-right ${c.text}`}>{'₹' + Math.round(spent).toLocaleString('en-IN')}</div>
                {hasBudget && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full overflow-hidden h-1.5">
                      <div className={`rounded-full transition-all ${barColor} h-1.5`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className={`text-[9px] leading-tight mt-1 text-right ${labelColor}`}>
                      {labelText}
                    </div>
                  </div>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── BUDGET PAGE ───────────────────────────────────────────────────────────

function BudgetPage({ categoryGroups, onBack, showToast }) {
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

  const groupsByType = TABS.map(type => ({
    type,
    groups: categoryGroups[type] || [],
  }));

  const budgetSummary = useMemo(() => {
    const totals = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
    Object.entries(budgetMap).forEach(([key, value]) => {
      const [type] = key.split('::');
      if (type in totals) totals[type] += parseMoney(value || '0');
    });
    return totals;
  }, [budgetMap]);

  function renderBudgetColumnCard(types) {
    const sections = types
      .map(type => ({ type, groups: categoryGroups[type] || [] }))
      .filter(section => section.groups.length > 0);

    if (!sections.length) return null;

    return (
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div>
          {sections.map(({ type, groups }, sectionIndex) => {
            const c = TYPE_COLOR[type];
            const monthlyTotal = budgetSummary[type] || 0;
            const yearlyTotal = monthlyTotal * 12;
            return (
              <section key={type} className={sectionIndex > 0 ? 'border-t border-gray-200' : ''}>
                <div className="px-3 py-1.5 flex items-center gap-2 bg-white">
                  <span className={`inline-block w-2 h-2 rounded-full ${c.badge.split(' ')[0]}`} />
                  <h3 className="text-xs font-semibold text-gray-700">{TAB_LABEL[type]}</h3>
                  <div className="ml-auto text-right leading-tight">
                    <div className="text-xs font-semibold text-gray-700">{fmt(monthlyTotal)}</div>
                    <div className="text-[10px] text-gray-400">yr {fmt(yearlyTotal)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_minmax(0,1fr)_128px_112px] text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-y border-gray-100 bg-gray-50 px-3 py-1">
                  <div>Category</div>
                  <div>Sub-category</div>
                  <div className="text-right">Monthly</div>
                  <div className="text-right">Yearly</div>
                </div>

                <div className="divide-y divide-gray-50">
                  {groups.flatMap(({ category, details }) =>
                    (details || []).map((sc, i) => {
                      const monthly = budgetMap[`${type}::${sc}`] || '';
                      const yearly = monthly ? Math.round(parseMoney(monthly) * 12).toLocaleString('en-IN') : '—';
                      return (
                        <div key={`${type}::${category}::${sc}`} className={`grid grid-cols-[140px_minmax(0,1fr)_128px_112px] items-center gap-3 px-3 py-1 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <div className="text-xs text-slate-600 truncate">{i === 0 ? category : ''}</div>
                          <div className="text-xs text-gray-700 truncate">{sc}</div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-gray-400">₹</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={monthly}
                              onChange={e => handleChange(type, sc, e.target.value)}
                              placeholder="0"
                              className="w-20 border border-gray-200 rounded-md px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                            />
                          </div>
                          <div className="text-[10px] text-gray-400 text-right">₹{yearly}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-4 md:px-6 py-3 space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <button onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-800">Budget Settings</h1>
          <span className="ml-auto text-xs text-gray-400">Monthly limits per sub-category</span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading budgets…</div>
        ) : (
          <div className="space-y-3">
            {groupsByType.every(({ groups }) => groups.length === 0) && (
              <div className="text-center py-12 text-gray-400 text-sm">No categories found.</div>
            )}
            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 items-start">
              <div>{renderBudgetColumnCard(['Expense'])}</div>
              <div>{renderBudgetColumnCard(['Income', 'Payoff', 'Savings'])}</div>
            </div>
          </div>
        )}

        {/* Save bar */}
        {!loading && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 py-2 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              {dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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

  // Highlight today's column when viewing the current month
  const todayDay = useMemo(() => {
    if (selectedMonth !== currentMonthStr()) return null;
    return new Date().getDate();
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

  const GROUP_W = 120;
  const DETAIL_W = 160;
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
    const available = containerW - GROUP_W - DETAIL_W - TOTAL_W - 2;
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
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-100 bg-gray-50/60">
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
        <div ref={containerRef} className="overflow-auto">
          <table className="border-collapse w-full" style={{ tableLayout: 'fixed', minWidth: GROUP_W + DETAIL_W + visibleDays.length * MIN_CELL + TOTAL_W }}>
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left text-[11px] text-gray-400 font-medium"
                  style={{ minWidth: GROUP_W, width: GROUP_W }}>Sub-category</th>
                <th className="sticky top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left text-[11px] text-gray-400 font-medium"
                  style={{ left: GROUP_W, minWidth: DETAIL_W, width: DETAIL_W }}>Details</th>
                {visibleDayLabels.map(({ d, label }) => (
                  <th key={d}
                    className={`sticky top-0 z-10 border-b border-gray-200 py-1.5 text-center text-[11px] font-medium ${
                      d === todayDay ? 'bg-blue-100 text-blue-700' :
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
                const groupSubCats = details || [];
                return groupSubCats.map((sc, si) => {
                  const rowBg = si % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                  return (
                    <tr key={`${category}::${sc}`}>
                      {si === 0 && (
                        <td
                          rowSpan={groupSubCats.length}
                          className="sticky left-0 z-20 border-r border-b border-gray-200 px-3 align-top text-[11px] font-semibold text-slate-600 bg-slate-50"
                          style={{ minWidth: GROUP_W, width: GROUP_W, height: 30 }}
                        >
                          <div className="pt-2">{category}</div>
                        </td>
                      )}
                      <td className={`sticky z-20 border-r border-b border-gray-100 px-3 text-[11px] text-gray-700 font-medium ${rowBg}`}
                        style={{ left: GROUP_W, minWidth: DETAIL_W, width: DETAIL_W, height: 30 }}>{sc}</td>
                      {visibleDays.map(d => {
                            const val      = (grid[sc] || {})[d] || '';
                            const note     = (notesGrid[sc] || {})[d] || '';
                            const filled   = parseMoney(val) > 0;
                            const hasNote  = note.trim().length > 0;
                            const isActive = activeNote && activeNote.sc === sc && activeNote.d === d;
                            const cellBg   = d === todayDay ? 'bg-blue-50'
                              : weekendSet.has(d) ? 'bg-slate-50'
                              : si % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                            return (
                              <td key={d}
                                className={`p-0 border border-gray-100 ${cellBg}`}
                                style={{ width: CELL_W, height: 30 }}>
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
                                    style={{ width: CELL_W, height: 30, paddingBottom: hasNote ? 8 : undefined }}
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
                      <td className={`sticky right-0 z-10 border-l border-b border-gray-100 px-2 text-right text-[11px] font-semibold ${rowBg}`}
                        style={{ minWidth: TOTAL_W, height: 30 }}>
                            {rowTotals[sc] > 0
                              ? <span className="text-gray-700">{Math.round(rowTotals[sc]).toLocaleString('en-IN')}</span>
                              : <span className="text-gray-200">—</span>}
                          </td>
                    </tr>
                  );
                });
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="sticky left-0 z-20 border-r border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100"
                  style={{ minWidth: GROUP_W, width: GROUP_W }}>
                  </td>
                <td className="sticky z-20 border-r border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-500 bg-gray-100"
                  style={{ left: GROUP_W, minWidth: DETAIL_W, width: DETAIL_W }}>
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

// ── ROW CARD (one editable row in the multi-row quick entry) ─────────────

// ── MOBILE QUICK ENTRY (form → pending list) ─────────────────────────────

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

  // Auto-select first category + sub-category once categoryGroups loads
  useEffect(() => {
    if (parentCat) return; // already set
    const firstCat = (categoryGroups[txnType] || [])[0]?.category || '';
    const firstSub = (categoryGroups[txnType] || [])[0]?.details?.[0] || '';
    if (firstCat) { setParentCat(firstCat); setSubCat(firstSub); }
  }, [categoryGroups]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const parentCats = useMemo(
    () => (categoryGroups[txnType] || []).map(g => g.category),
    [categoryGroups, txnType]
  );
  const subCats = useMemo(
    () => (categoryGroups[txnType] || []).find(g => g.category === parentCat)?.details || [],
    [categoryGroups, txnType, parentCat]
  );

  function handleTypeChange(t) {
    const firstCat = (categoryGroups[t] || [])[0]?.category || '';
    const firstSub = (categoryGroups[t] || [])[0]?.details?.[0] || '';
    setTxnType(t); setParentCat(firstCat); setSubCat(firstSub);
  }
  function handleParentChange(p) {
    const firstSub = (categoryGroups[txnType] || []).find(g => g.category === p)?.details?.[0] || '';
    setParentCat(p); setSubCat(firstSub);
  }

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
    // Capture the current date/type/category/sub-cat into the pending entry
    setPending(prev => [...prev, {
      _id: uid(),
      date,
      type: txnType,
      parentCat,
      subCategory: subCat,
      amount: amt,
      notes,
    }]);
    // Only clear amount and notes — keep date/type/category sticky for next entry
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

  const todayTxns  = useMemo(() => transactions.filter(t => t.date === today), [transactions]);
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
          ><span>✎</span><span>Edit</span></button>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
            ><span className="text-xl leading-none">+</span></button>
          ))}
        </div>
      </div>

      {/* Today mini-summary */}
      <div className="text-xs text-gray-400">
        Today: {todayTxns.length} {todayTxns.length === 1 ? 'entry' : 'entries'}
        {todayTotal > 0 ? ` · ${fmt(todayTotal)} spent` : ''}
      </div>

      {/* ── Add Entry form ── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Add Entry</h3>
          <span className="text-[10px] text-gray-400">Change fields freely between adds</span>
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

        {/* ── Pending list ── */}
        {pending.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {pending.length} {pending.length === 1 ? 'entry' : 'entries'} pending
              </span>
              <span className="text-xs font-semibold text-gray-700">{fmt(pendingTotal)}</span>
            </div>

            <ul className="divide-y divide-gray-50">
              {pending.map(e => {
                const c = TYPE_COLOR[e.type];
                return (
                  <li key={e._id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${c.badge}`}>{e.type}</span>
                        <span className="text-sm text-gray-800 truncate">{catEmoji(e.subCategory)}&nbsp;{e.subCategory || e.parentCat || e.type}</span>
                      </div>
                      <span className="text-xs text-gray-400">{fmtDate(e.date)}{e.notes ? ` · ${e.notes}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">{fmt(e.amount)}</span>
                      <button onClick={() => removePending(e._id)}
                        className="text-gray-300 hover:text-red-400 text-sm leading-none" aria-label="Remove">✕</button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="px-4 py-3 border-t border-gray-100">
              <button onClick={saveAll}
                className="w-full py-2.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 font-medium">
                Save {pending.length} {pending.length === 1 ? 'entry' : 'entries'} · {fmt(pendingTotal)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TRANSACTIONS PAGE ──────────────────────────────────────────────────────

function TransactionsPage({ transactions, onBack, onLoadMonth, initialMonth, onDelete, initialHeadFilter }) {
  // ── Period filter state ─────────────────────────────────────────────────
  const [periodMode, setPeriodMode] = useState('month');  // 'month' | 'range'
  const [filterMonth, setFilterMonth] = useState(() => initialMonth || currentMonthStr());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [loading, setLoading]   = useState(false);

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

  // ── Apply period filter ─────────────────────────────────────────────────
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
    return [...periodFiltered].sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);
  }, [periodFiltered]);

  const grouped = useMemo(() => ({
    Expense: filtered.filter(t => t.type === 'Expense'),
    Income: filtered.filter(t => t.type === 'Income'),
    Savings: filtered.filter(t => t.type === 'Savings'),
    Payoff: filtered.filter(t => t.type === 'Payoff'),
  }), [filtered]);

  function TransactionSection({ title, items, accent }) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
            <span className="text-sm font-semibold text-gray-700">{title}</span>
          </div>
          <span className="text-xs text-gray-400">{items.length} entries</span>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-10 text-sm text-gray-400 text-center">No transactions.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                <th className="px-4 py-1.5 font-medium">Date</th>
                <th className="px-4 py-1.5 font-medium">Sub-category</th>
                <th className="px-4 py-1.5 font-medium">Comments</th>
                <th className="px-4 py-1.5 text-right font-medium">Amount</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(t => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 group">
                  <td className="px-4 py-1.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="px-4 py-1.5 text-gray-800 whitespace-nowrap">{t.subCategory || t.category || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-1.5 text-xs text-gray-400 max-w-[220px] truncate">{t.notes || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-1.5 text-right font-medium text-gray-800 whitespace-nowrap">{fmt(t.amount)}</td>
                  <td className="px-2 py-1.5 text-right">
                    {onDelete && (
                      <button
                        onClick={() => onDelete(t)}
                        className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1"
                        aria-label="Delete"
                      >✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-4 md:px-6 py-4 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-sm font-medium">&#8592; Back</button>
          <h2 className="text-base font-semibold text-gray-800">Transactions</h2>
          {loading && <span className="text-xs text-gray-400 animate-pulse ml-1">Loading…</span>}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} entries</span>
        </div>

        <div className="md:hidden bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">

          {/* Period row */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-3">
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
              <div className="flex justify-start pt-1">
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

        </div>

        <div className="hidden md:grid md:grid-cols-[240px_minmax(0,1fr)] gap-4 items-start">
          <div className="bg-white border border-gray-200 rounded-lg sticky top-4">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center gap-3">
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
                <div className="pt-1">
                  <MonthSelector selectedMonth={filterMonth} onChange={setFilterMonth} />
                </div>
              )}

              {periodMode === 'range' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                      className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                      className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm" />
                  </div>
                  <button onClick={loadRange}
                    disabled={!fromDate || !toDate || fromDate > toDate || loading}
                    className="w-full px-4 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >{loading ? 'Loading…' : 'Load'}</button>
                </div>
              )}
            </div>
          </div>

          <div>
            {/* ── Content ── */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                {loading ? 'Loading…' : 'No transactions for this period.'}
              </div>
            ) : (
              <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] gap-4 items-start">
                <TransactionSection title="Expenses" items={grouped.Expense} accent="#ef4444" />
                <div className="space-y-4">
                  <TransactionSection title="Income" items={grouped.Income} accent="#22c55e" />
                  <TransactionSection title="Savings" items={grouped.Savings} accent="#3b82f6" />
                  <TransactionSection title="Payoff" items={grouped.Payoff} accent="#f59e0b" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile content ── */}
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-sm">
              {loading ? 'Loading…' : 'No transactions for this period.'}
            </div>
          ) : (
            <TransactionSection title="All Transactions" items={filtered} accent="#64748b" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── ANALYTICS PAGE ─────────────────────────────────────────────────────────

function AnalyticsPage({ onBack, transactions: dashboardTxns, selectedMonth, budgets = [] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear]               = useState(currentYear);
  const [analyticsView, setAnalyticsView] = useState('chart');
  const [mode, setMode]               = useState('year'); // 'year' | 'custom'
  const [customMonths, setCustomMonths] = useState([]);
  const [activeTypes, setActiveTypes] = useState(new Set(TABS)); // all selected by default
  const [monthData, setMonthData]     = useState({}); // 'YYYY-MM' → tx[]
  const [fetchedYears, setFetchedYears] = useState(() => new Set());
  const [loading, setLoading]         = useState(false);
  const [fetchError, setFetchError]   = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);

  const fmt = (n) => {
    if (n === null || n === undefined) return '₹0';
    return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  };

  const fmtK = (n) => {
    const value = Number(n) || 0;
    if (value >= 100000) return Math.round(value / 100000) + 'L';
    if (value >= 1000) return Math.round(value / 1000) + 'K';
    return String(Math.round(value));
  };

  // Seed current month's data from already-loaded dashboard transactions
  useEffect(() => {
    if (!dashboardTxns || !selectedMonth) return;
    setMonthData(prev => ({ ...prev, [selectedMonth]: dashboardTxns }));
  }, [dashboardTxns, selectedMonth]);

  async function fetchYear(y) {
    if (fetchedYears.has(y)) return;
    setLoading(true);
    setFetchError(null);
    try {
      // Fetch all 12 months in parallel using the proven getExpensesByMonth action
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const results = await Promise.all(
        months.map(m => callBackend({ action: 'getExpensesByMonth', year: y, month: m }))
      );
      const newMonthData = {};
      results.forEach((res, i) => {
        const monthKey = `${y}-${String(i + 1).padStart(2, '0')}`;
        if (res?.success && res.expensesByDate) {
          // Flatten date-keyed object → flat array
          newMonthData[monthKey] = Object.values(res.expensesByDate).flat();
        } else {
          newMonthData[monthKey] = [];
        }
      });
      setMonthData(prev => ({ ...prev, ...newMonthData }));
      setFetchedYears(prev => new Set([...prev, y]));
    } catch (e) {
      console.error('[Analytics] fetch error:', e);
      setFetchError('Network error loading analytics data.');
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

  function toggleType(t) {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); } // keep at least one
      else next.add(t);
      return next;
    });
    setExpandedCat(null);
  }
  function selectAllTypes() { setActiveTypes(new Set(TABS)); setExpandedCat(null); }
  const isAllTypes = activeTypes.size === TABS.length;

  // Flat filtered transactions
  const filteredTxs = useMemo(() =>
    displayMonths.flatMap(m => (monthData[m] || []).filter(t => activeTypes.has(t.type))),
    [displayMonths, monthData, activeTypes]
  );

  // Income vs Exp+Payoff(ex-CCD) vs Savings grouped chart
  const incomeExpChart = useMemo(() =>
    displayMonths.map(m => {
      const txns = monthData[m] || [];
      const income    = txns.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);
      const expPayoff = txns
        .filter(t => t.type === 'Expense' ||
          (t.type === 'Payoff' && !(t.subCategory || t.category || '').toLowerCase().includes('credit card')))
        .reduce((s, t) => s + t.amount, 0);
      const savings   = txns.filter(t => t.type === 'Savings').reduce((s, t) => s + t.amount, 0);
      return { month: m, income, expPayoff, savings };
    }),
    [displayMonths, monthData]
  );
  const maxIES = Math.max(...incomeExpChart.map(m => Math.max(m.income, m.expPayoff, m.savings)), 1);

  const topItemsByType = useMemo(() => {
    const types = ['Expense', 'Savings', 'Payoff'];
    return types.map(tp => {
      const totals = {};
      filteredTxs.forEach(t => {
        if (t.type !== tp) return;
        if (tp === 'Payoff' && (t.subCategory || t.category || '').toLowerCase().includes('credit card')) return;
        const key = t.parentCategory || t.category;
        totals[key] = (totals[key] || 0) + t.amount;
      });
      const items = Object.entries(totals)
        .map(([cat, total]) => ({ cat, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const max = Math.max(...items.map(i => i.total), 1);
      return { type: tp, items, max };
    });
  }, [filteredTxs]);

  // Budget aggregated to parent-category level (yearly) using transaction data to resolve detail→parent
  const budgetByParent = useMemo(() => {
    const detailToParent = {};
    Object.values(monthData).flat().forEach(t => {
      const key = `${t.type}::${t.category}`;
      if (!detailToParent[key]) detailToParent[key] = t.parentCategory || t.category;
    });
    const result = {};
    (budgets || []).forEach(b => {
      // Exclude credit card from Payoff budget
      if (b.type === 'Payoff' && b.category.toLowerCase().includes('credit card')) return;
      const parent = detailToParent[`${b.type}::${b.category}`] || b.category;
      if (!result[b.type]) result[b.type] = {};
      result[b.type][parent] = (result[b.type][parent] || 0) + b.yearlyBudget;
    });
    return result;
  }, [monthData, budgets]);

  // Per-type breakdown: actual vs yearly budget, per parent category
  const typeBreakdown = useMemo(() => {
    const map = {};
    for (const t of filteredTxs) {
      const tp = t.type;
      // Exclude credit card from Payoff chart
      if (tp === 'Payoff' && (t.subCategory || t.category || '').toLowerCase().includes('credit card')) continue;
      const parent = t.parentCategory || t.category;
      const detail = t.category || parent;
      if (!map[tp]) map[tp] = {};
      if (!map[tp][parent]) map[tp][parent] = { total: 0, subs: {} };
      map[tp][parent].total += t.amount;
      map[tp][parent].subs[detail] = (map[tp][parent].subs[detail] || 0) + t.amount;
    }
    return TABS.filter(tp => map[tp]).map(tp => {
      const typeTotal = Object.values(map[tp]).reduce((s, v) => s + v.total, 0);
      const typeBudget = Object.values(budgetByParent[tp] || {}).reduce((s, v) => s + v, 0);
      const cats = Object.entries(map[tp]).map(([cat, v]) => ({
        cat,
        total: v.total,
        budget: budgetByParent[tp]?.[cat] || 0,
        subs: Object.entries(v.subs).map(([s, a]) => ({ s, a })).sort((a, b) => b.a - a.a),
      })).sort((a, b) => b.total - a.total);
      return { type: tp, typeTotal, typeBudget, cats };
    });
  }, [filteredTxs, budgetByParent]);

  // MoM table — grouped by type
  const momData = useMemo(() => {
    return TABS.filter(tp => activeTypes.has(tp)).map(tp => {
      const cats = new Set(
        filteredTxs.filter(t => t.type === tp).map(t => t.parentCategory || t.category)
      );
      const rows = [...cats].map(cat => ({
        cat,
        values: displayMonths.map(m =>
          (monthData[m] || [])
            .filter(t => t.type === tp && (t.parentCategory || t.category) === cat)
            .reduce((s, t) => s + t.amount, 0)
        ),
      })).sort((a, b) =>
        b.values.reduce((s, v) => s + v, 0) - a.values.reduce((s, v) => s + v, 0)
      );
      const totals = displayMonths.map((m, i) => rows.reduce((s, r) => s + r.values[i], 0));
      return { type: tp, rows, totals };
    }).filter(g => g.rows.length > 0);
  }, [filteredTxs, displayMonths, monthData, activeTypes]);

  // Single active type for coloring (use first selected, or neutral when multiple)
  const singleType = activeTypes.size === 1 ? [...activeTypes][0] : null;
  const barColor = singleType ? (BAR_COLOR[singleType] || '#94a3b8') : '#64748b';
  const goodUp   = singleType === 'Income' || singleType === 'Savings';

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

        {/* Type multi-select pills */}
        <div className="flex gap-1 flex-wrap items-center">
          <button
            onClick={selectAllTypes}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${isAllTypes ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-gray-300 hover:border-slate-400'}`}
          >All</button>
          {TABS.map(t => {
            const active = activeTypes.has(t) && !isAllTypes;
            return (
              <button
                key={t}
                onClick={() => { if (isAllTypes) { setActiveTypes(new Set([t])); setExpandedCat(null); } else toggleType(t); }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? 'text-white border-transparent' : 'bg-white text-slate-500 border-gray-300 hover:border-slate-400'}`}
                style={active ? { backgroundColor: BAR_COLOR[t] } : {}}
              >{t}</button>
            );
          })}
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

        {fetchError && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {fetchError}
          </div>
        )}

        {!loading && displayMonths.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Select months to view analytics.</div>
        )}

        {!loading && displayMonths.length > 0 && (
          <>
            {/* INCOME vs OUTFLOWS vs SAVINGS */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Income vs Outflows vs Savings</h3>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#22c55e' }}/> Income
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#ef4444' }}/> Exp+Payoff
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#3b82f6' }}/> Savings
                  </span>
                </div>
              </div>
              {incomeExpChart.every(m => m.income === 0 && m.expPayoff === 0 && m.savings === 0) ? (
                <p className="text-sm text-gray-400 text-center py-6">No data for this period.</p>
              ) : (
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="lg:w-[760px] lg:max-w-[760px] max-w-full overflow-x-auto">
                    <div className="inline-flex items-end gap-2 pb-1">
                      {incomeExpChart.map(({ month, income, expPayoff, savings }) => {
                        const CHART_H = 140;
                        const inH  = income    > 0 ? Math.max((income    / maxIES) * CHART_H, 3) : 0;
                        const epH  = expPayoff > 0 ? Math.max((expPayoff / maxIES) * CHART_H, 3) : 0;
                        const svH  = savings   > 0 ? Math.max((savings   / maxIES) * CHART_H, 3) : 0;
                        const epPct = income > 0 && expPayoff > 0 ? Math.round(expPayoff / income * 100) : null;
                        const svPct = income > 0 && savings   > 0 ? Math.round(savings   / income * 100) : null;
                        const label = MONTH_NAMES[parseInt(month.split('-')[1], 10) - 1];
                        return (
                          <div key={month} className="relative group flex flex-col items-center" style={{ minWidth: '52px' }}>
                            <div className="flex items-end gap-1" style={{ height: '160px' }}>
                              <div className="flex flex-col items-center justify-end" style={{ height: '160px' }}>
                                {income > 0 && <span className="mb-0.5" style={{ fontSize: '8px', color: '#15803d' }}>{fmtK(income)}</span>}
                                <div style={{ width: '10px', height: `${inH}px`, backgroundColor: '#22c55e', borderRadius: '2px 2px 0 0' }} />
                              </div>
                              <div className="flex flex-col items-center justify-end" style={{ height: '160px' }}>
                                {epPct !== null && <span className="mb-0.5 font-semibold" style={{ fontSize: '8px', color: '#dc2626' }}>{epPct}%</span>}
                                {epH > 0 && <div style={{ width: '10px', height: `${epH}px`, backgroundColor: '#ef4444', borderRadius: '2px 2px 0 0' }} />}
                              </div>
                              <div className="flex flex-col items-center justify-end" style={{ height: '160px' }}>
                                {svPct !== null && <span className="mb-0.5 font-semibold" style={{ fontSize: '8px', color: '#2563eb' }}>{svPct}%</span>}
                                {svH > 0 && <div style={{ width: '10px', height: `${svH}px`, backgroundColor: '#3b82f6', borderRadius: '2px 2px 0 0' }} />}
                              </div>
                            </div>
                            <span className="text-gray-500 mt-1 shrink-0" style={{ fontSize: '10px' }}>{label}</span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 text-left">
                              <div className="font-medium">{label}</div>
                              {income > 0 && <div>Income: {fmt(income)}</div>}
                              {expPayoff > 0 && <div>Exp+Payoff: {fmt(expPayoff)}{epPct !== null ? ` (${epPct}% of inc)` : ''}</div>}
                              {savings > 0 && <div>Savings: {fmt(savings)}{svPct !== null ? ` (${svPct}% of inc)` : ''}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-5">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Top 5 Items</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch w-full lg:divide-x lg:divide-gray-200">
                        {topItemsByType.map(({ type, items, max }) => {
                          const color = type === 'Expense' ? '#ef4444' : type === 'Savings' ? '#3b82f6' : '#f59e0b';
                          const paddedItems = [...items, ...Array.from({ length: Math.max(0, 5 - items.length) }, (_, idx) => ({ cat: '', total: 0, isPlaceholder: true, key: `${type}-empty-${idx}` }))].slice(0, 5);
                          return (
                            <div key={type} className="min-w-0 flex flex-col lg:px-4 first:lg:pl-0 last:lg:pr-0">
                              <div className="text-xs font-medium text-gray-700 mb-2">{type}</div>
                              {items.length === 0 ? (
                                <div className="text-xs text-gray-300">No data</div>
                              ) : (
                                <div className="w-full">
                                  <div className="grid grid-cols-5 gap-2.5 h-[198px] w-full">
                                    {paddedItems.map(({ cat, total, isPlaceholder, key }) => {
                                      const height = max > 0 ? Math.max(total / max * 110, 8) : 0;
                                      return (
                                        <div key={key || cat} className="min-w-0 h-full flex flex-col items-center">
                                          <div className="h-8 mb-1 px-0.5 text-[9px] font-medium text-gray-700 text-center leading-tight break-all w-full flex items-end justify-center overflow-hidden">
                                            {!isPlaceholder && total > 0 ? fmt(total) : ''}
                                          </div>
                                          <div className="flex-1 w-full flex items-end">
                                            <div
                                              className="w-full rounded-t"
                                              style={{ height: isPlaceholder ? '0px' : `${height}px`, backgroundColor: color, opacity: isPlaceholder ? 0 : 1 }}
                                              title={!isPlaceholder ? `${cat}: ${fmt(total)}` : ''}
                                            />
                                          </div>
                                          <div className="mt-1 h-8 text-[9px] text-gray-500 text-center leading-tight overflow-hidden w-full">
                                            {!isPlaceholder ? cat : ''}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <div className="flex items-center">
                <button
                  onClick={() => setAnalyticsView('chart')}
                  className={`text-xs px-3 py-1.5 rounded-l border ${analyticsView === 'chart' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-gray-300 hover:border-slate-400'}`}
                >Chart</button>
                <button
                  onClick={() => setAnalyticsView('table')}
                  className={`text-xs px-3 py-1.5 rounded-r border-t border-b border-r ${analyticsView === 'table' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-gray-300 hover:border-slate-400'}`}
                >Table</button>
              </div>
            </div>

            {/* PER-TYPE STACKED HORIZONTAL BAR vs BUDGET */}
            {analyticsView === 'chart' && (() => {
              const CAT_PALETTE = ['#3b82f6','#f59e0b','#10b981','#8b5cf6','#f97316','#06b6d4','#ec4899','#84cc16','#6366f1','#14b8a6','#ef4444','#a3a3a3'];
              if (typeBreakdown.length === 0)
                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-400 text-center py-6">No data for this period.</p>
                  </div>
                );
              const monthsWithData = displayMonths.filter(m => (monthData[m] || []).length > 0).length || 1;
              return (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6">
                  {typeBreakdown.map(({ type: tp, typeTotal, typeBudget, cats }) => {
                    const hasBudget = typeBudget > 0;
                    const prorated = hasBudget ? typeBudget * monthsWithData / 12 : 0;
                    // For Income/Savings: being UNDER budget is bad. For Expense/Payoff: being OVER is bad.
                    const isTargetType = tp === 'Income' || tp === 'Savings';
                    const badYearly  = hasBudget && (isTargetType ? typeTotal < typeBudget : typeTotal > typeBudget);
                    const badMonthly = hasBudget && (isTargetType ? typeTotal < prorated   : typeTotal > prorated);
                    const scale = hasBudget ? Math.max(typeTotal, typeBudget) : typeTotal;
                    const actualBarPct  = scale > 0 ? typeTotal  / scale * 100 : 100;
                    const monthMarkerPct = hasBudget && scale > 0 ? prorated / scale * 100 : 0;
                    return (
                      <div key={tp}>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">{tp}</span>
                          <div className="text-xs text-right">
                            <span className={badYearly ? 'font-semibold text-red-500' : 'font-semibold text-gray-700'}>{fmt(typeTotal)}</span>
                            {hasBudget && (() => {
                              const pct = Math.round(typeTotal / typeBudget * 100);
                              const diff = Math.abs(typeTotal - typeBudget);
                              const monthDiff = Math.abs(typeTotal - prorated);
                              const yearlyLabel = isTargetType
                                ? (badYearly ? `${pct}% of target · ${fmt(diff)} short ↓` : `${pct}% of target · ${fmt(diff)} ahead ↑`)
                                : (badYearly ? `${pct}% used · ${fmt(diff)} over ↑`        : `${pct}% used · ${fmt(diff)} remaining ↓`);
                              const monthLabel = isTargetType
                                ? (badMonthly ? `${fmt(monthDiff)} short month ↓` : `${fmt(monthDiff)} ahead month ↑`)
                                : (badMonthly ? `${fmt(monthDiff)} over month ↑`  : `${fmt(monthDiff)} under month ↓`);
                              return (
                                <span className="ml-1">
                                  <span className="text-gray-400">of {fmt(typeBudget)} yearly — </span>
                                  <span className={badYearly ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                                    {yearlyLabel}
                                  </span>
                                  <span className={`ml-1 ${badMonthly ? 'text-orange-500 font-medium' : 'text-emerald-600 font-medium'}`}>
                                    · {monthLabel}
                                  </span>
                                </span>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Stacked bar */}
                        <div className="relative mb-1 overflow-hidden rounded" style={{ height: '28px', backgroundColor: '#f3f4f6' }}>
                          <div
                            className="absolute top-0 left-0 h-full flex"
                            style={{ width: `${actualBarPct}%`, minWidth: typeTotal > 0 ? '2px' : '0' }}
                          >
                            {cats.map(({ cat, total }, idx) => (
                              <div
                                key={cat}
                                title={`${cat}: ${fmt(total)}`}
                                className="h-full cursor-pointer hover:opacity-80 transition-opacity"
                                style={{
                                  width: `${typeTotal > 0 ? total/typeTotal*100 : 0}%`,
                                  backgroundColor: badYearly ? `${CAT_PALETTE[idx % CAT_PALETTE.length]}cc` : CAT_PALETTE[idx % CAT_PALETTE.length],
                                  minWidth: total > 0 ? '2px' : '0',
                                }}
                                onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                              />
                            ))}
                          </div>
                          {hasBudget && (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-10" style={{ left: `${monthMarkerPct}%`, transform: 'translateX(-1px)' }} />
                          )}
                        </div>

                        {/* Scale labels */}
                        {hasBudget && (
                          <div className="relative text-gray-400 mb-3" style={{ fontSize: '10px' }}>
                            <span className="absolute left-0">₹0</span>
                            <span className="absolute" style={{ left: `${monthMarkerPct}%`, transform: 'translateX(-50%)' }}>
                              {fmt(prorated)} ← {monthsWithData}M budget
                            </span>
                          </div>
                        )}
                        <div className={hasBudget ? 'mt-4' : 'mt-1'} />

                        {/* Legend — 4 columns */}
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 border border-gray-100 rounded">
                          {cats.map(({ cat, total, budget, subs }, idx) => {
                            const clr = CAT_PALETTE[idx % CAT_PALETTE.length];
                            const isOpen = expandedCat === cat;
                            const over = budget > 0 && total > budget;
                            return (
                              <div key={cat} className="px-3 py-1 border-b border-gray-100">
                                <button
                                  className="flex items-center gap-1.5 hover:opacity-70 transition-opacity w-full text-left py-1"
                                  onClick={() => setExpandedCat(isOpen ? null : cat)}>
                                  <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: clr }} />
                                  <span className="text-xs text-gray-700 truncate font-medium flex-1 min-w-0">{cat}</span>
                                  <div className="text-right shrink-0">
                                    <div className={`text-xs ${over ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>{fmt(total)}</div>
                                    {budget > 0 && (
                                      <div className={`text-xs ${over ? 'text-red-400' : 'text-gray-400'}`}>
                                        / {fmt(budget)} ({Math.round(total/budget*100)}%)
                                      </div>
                                    )}
                                    {budget === 0 && typeTotal > 0 && (
                                      <div className="text-xs text-gray-400">{Math.round(total/typeTotal*100)}% of total</div>
                                    )}
                                  </div>
                                  <span className="text-gray-300 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                                </button>
                                {isOpen && (
                                  <div className="mb-2 pl-4 border-l-2 border-gray-100 space-y-0.5">
                                    {subs.map(({ s, a }) => (
                                      <div key={s} className="flex items-center gap-1.5 text-xs">
                                        <span className="text-gray-500 truncate flex-1 min-w-0">{s}</span>
                                        <span className="text-gray-400 shrink-0 text-right">{fmt(a)} ({total > 0 ? Math.round(a/total*100) : 0}%)</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* MONTH-OVER-MONTH TABLE */}
            {analyticsView === 'table' && displayMonths.length > 1 && momData.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Month-over-Month</h3>
                <table className="text-xs w-full min-w-max">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1.5 pr-4 font-medium text-gray-600 sticky left-0 bg-white min-w-[140px]">Category</th>
                      {displayMonths.map(m => (
                        <th key={m} className="text-right py-1.5 px-2 font-medium text-gray-600 whitespace-nowrap">
                          {MONTH_NAMES[parseInt(m.split('-')[1], 10) - 1]} {m.split('-')[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {momData.map(({ type: tp, rows, totals }, gi) => {
                      const isIncomeSavings = tp === 'Income' || tp === 'Savings';
                      return (
                        <React.Fragment key={tp}>
                          {/* Type header row */}
                          <tr className={gi > 0 ? 'border-t-2 border-gray-300' : ''}>
                            <td colSpan={displayMonths.length + 1} className="pt-3 pb-1 sticky left-0 bg-white">
                              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{tp}</span>
                            </td>
                          </tr>
                          {/* Category rows */}
                          {rows.map(({ cat, values }) => (
                            <tr key={cat} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                              <td className="py-1.5 pr-4 text-gray-700 sticky left-0 bg-white pl-3">{cat}</td>
                              {values.map((v, i) => {
                                const prev = i > 0 ? values[i - 1] : null;
                                const diff = prev !== null && prev > 0 ? v - prev : 0;
                                const up   = diff > 0;
                                const arrowCls = up
                                  ? (isIncomeSavings ? 'text-green-500' : 'text-red-500')
                                  : (isIncomeSavings ? 'text-red-500'   : 'text-green-500');
                                return (
                                  <td key={i} className="py-1.5 px-2 text-right text-gray-700 whitespace-nowrap">
                                    {v > 0 ? fmt(v) : <span className="text-gray-300">—</span>}
                                    {diff !== 0 && <span className={`ml-0.5 ${arrowCls}`}>{up ? '↑' : '↓'}</span>}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          {/* Type subtotal row */}
                          <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                            <td className="py-1.5 pr-4 text-gray-600 sticky left-0 bg-gray-50 pl-3">{tp} Total</td>
                            {totals.map((v, i) => (
                              <td key={i} className="py-1.5 px-2 text-right text-gray-700 whitespace-nowrap">
                                {v > 0 ? fmt(v) : <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        </React.Fragment>
                      );
                    })}
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

// ── CALENDAR DAY PANEL ─────────────────────────────────────────────────────

function CalendarDayPanel({ day, isOpen, onClose, transactions, categoryGroups, onSave, onDelete }) {
  const [txnType, setTxnType]     = useState('Expense');
  const [parentCat, setParentCat] = useState('');
  const [subCat, setSubCat]       = useState('');
  const [amount, setAmount]       = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  // Reset form when day or type changes
  useEffect(() => {
    setAmount('');
    setNotes('');
  }, [day]);

  useEffect(() => {
    const firstCat = (categoryGroups[txnType] || [])[0]?.category || '';
    const firstSub = (categoryGroups[txnType] || [])[0]?.details?.[0] || '';
    setParentCat(firstCat);
    setSubCat(firstSub);
  }, [txnType, categoryGroups, day]);

  const parentCats = (categoryGroups[txnType] || []).map(g => g.category);
  const subCats    = (categoryGroups[txnType] || []).find(g => g.category === parentCat)?.details || [];

  function handleParentChange(p) {
    const firstSub = (categoryGroups[txnType] || []).find(g => g.category === p)?.details?.[0] || '';
    setParentCat(p);
    setSubCat(firstSub);
  }

  const dayTxns = useMemo(
    () => (day ? transactions.filter(t => t.date === day) : []),
    [day, transactions]
  );

  const dayTotals = useMemo(() => {
    const t = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
    dayTxns.forEach(tx => { t[tx.type] = (t[tx.type] || 0) + tx.amount; });
    return t;
  }, [dayTxns]);

  const formattedDay = useMemo(() => {
    if (!day) return '';
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [day]);

  const canSave = parseMoney(amount) > 0 && subCat && day;

  async function handleSave() {
    const amt = parseMoney(amount);
    if (!amt || !day) return;
    setSaving(true);
    try {
      await onSave({
        id: String(uid()),
        date: day,
        type: txnType,
        subCategory: subCat,
        amount: amt,
        notes,
      });
      setAmount('');
      setNotes('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      {/* Slide-in panel */}
      <div
        className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 200ms ease-in-out' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">{formattedDay}</div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {TABS.map(type => {
                  const amt = dayTotals[type];
                  if (!amt) return null;
                  const c = TYPE_COLOR[type];
                  return (
                    <span key={type} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>
                      {type} {fmt(amt)}
                    </span>
                  );
                })}
                {Object.values(dayTotals).every(v => !v) && (
                  <span className="text-[11px] text-gray-400">No entries</span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none ml-2">✕</button>
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {dayTxns.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">No entries for this day</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {dayTxns.map(t => {
                const c = TYPE_COLOR[t.type] || TYPE_COLOR.Expense;
                return (
                  <li key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 group">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${c.badge}`}>{t.type}</span>
                        <span className="text-xs text-gray-800 truncate">{catEmoji(t.subCategory)}&nbsp;{t.subCategory || t.type}</span>
                      </div>
                      {t.notes && <div className="text-[10px] text-gray-400 mt-0.5 pl-0.5">{t.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="text-xs font-semibold text-gray-800">{fmt(t.amount)}</span>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(t)}
                          className="text-gray-300 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete"
                        >✕</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Add entry section */}
        <div className="shrink-0 border-t border-gray-100">
          <div className="px-4 py-2 bg-gray-50">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Add Entry</span>
          </div>
          <div className="px-4 py-3 space-y-2 bg-white">
            {/* Type */}
            <div className="grid grid-cols-4 gap-1">
              {TABS.map(t => (
                <button key={t} onClick={() => setTxnType(t)}
                  className={`py-1 text-[10px] rounded font-medium transition-colors ${
                    txnType === t ? TYPE_COLOR[t].badge : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>{t}</button>
              ))}
            </div>
            {/* Category */}
            <select value={parentCat} onChange={e => handleParentChange(e.target.value)}
              className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-300">
              <option value="">-- Category --</option>
              {parentCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Sub-category */}
            {subCats.length > 0 ? (
              <select value={subCat} onChange={e => setSubCat(e.target.value)}
                className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-300">
                <option value="">-- Sub-category --</option>
                {subCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input type="text" value={subCat} onChange={e => setSubCat(e.target.value)}
                placeholder="Sub-category"
                className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-300" />
            )}
            {/* Amount */}
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canSave) handleSave(); }}
              placeholder="Amount (₹)" min="0" step="0.01" inputMode="decimal"
              className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-300" />
            {/* Notes */}
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-300" />
            {/* Save */}
            <button onClick={handleSave} disabled={!canSave || saving}
              className="w-full py-2 bg-gray-800 text-white text-xs rounded font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── CALENDAR PAGE (desktop only) ───────────────────────────────────────────

const DOW_LABELS   = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const TYPE_DOT_CLR = { Expense: 'bg-red-400', Income: 'bg-green-400', Savings: 'bg-blue-400', Payoff: 'bg-amber-400' };

function CalendarPage({ transactions, selectedMonth, setSelectedMonth, categoryGroups, onSave, onDelete }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [panelOpen, setPanelOpen]     = useState(false);

  function openDay(dateStr) { setSelectedDay(dateStr); setPanelOpen(true); }

  const { cells, todayIso } = useMemo(() => {
    const [y, m]      = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDow    = (new Date(y, m - 1, 1).getDay() + 6) % 7; // Mon-start
    const todayIso    = new Date().toISOString().slice(0, 10);
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells, todayIso };
  }, [selectedMonth]);

  const dayAgg = useMemo(() => {
    const agg = {};
    transactions.filter(t => t.date.startsWith(selectedMonth)).forEach(t => {
      if (!agg[t.date]) agg[t.date] = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
      agg[t.date][t.type] = (agg[t.date][t.type] || 0) + t.amount;
    });
    return agg;
  }, [transactions, selectedMonth]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0">
        <h2 className="text-sm font-semibold text-gray-800">Calendar</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DOW_LABELS.map(d => (
            <div key={d} className={`text-center text-[11px] font-semibold pb-1.5 ${d === 'Sa' || d === 'Su' ? 'text-slate-400' : 'text-gray-500'}`}>{d}</div>
          ))}
        </div>
        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
          {cells.map((day, idx) => {
            if (!day) return <div key={`blank-${idx}`} className="bg-gray-50 min-h-[90px]" />;
            const dateStr   = `${selectedMonth}-${String(day).padStart(2, '0')}`;
            const isToday   = dateStr === todayIso;
            const isSelected = dateStr === selectedDay && panelOpen;
            const isWeekend = idx % 7 >= 5;
            const agg       = dayAgg[dateStr] || {};
            const expTotal  = agg.Expense || 0;
            const hasData   = TABS.some(t => (agg[t] || 0) > 0);
            return (
              <button
                key={dateStr}
                onClick={() => openDay(dateStr)}
                className={`relative min-h-[90px] p-2 flex flex-col text-left transition-colors ${
                  isSelected ? 'bg-blue-50' :
                  isWeekend  ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white hover:bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                <span className={`text-xs font-semibold ${isToday ? 'text-blue-600' : isWeekend ? 'text-slate-400' : 'text-gray-700'}`}>{day}</span>
                {hasData && (
                  <div className="flex gap-0.5 mt-1">
                    {TABS.map(t => agg[t] > 0 ? <span key={t} className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT_CLR[t]}`} /> : null)}
                  </div>
                )}
                {expTotal > 0 && (
                  <span className="mt-auto text-[10px] font-medium text-red-500 self-end">{fmtK(expTotal)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <CalendarDayPanel
        day={selectedDay}
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        transactions={transactions}
        categoryGroups={categoryGroups}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}

// ── MINI CALENDAR (dashboard, desktop only) ────────────────────────────────

function MiniCalendar({ transactions, selectedMonth, selectedDay, onDayClick }) {
  const { cells, todayIso } = useMemo(() => {
    const [y, m]      = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDow    = (new Date(y, m - 1, 1).getDay() + 6) % 7;
    const todayIso    = new Date().toISOString().slice(0, 10);
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells, todayIso };
  }, [selectedMonth]);

  const dayAgg = useMemo(() => {
    const agg = {};
    transactions.filter(t => t.date.startsWith(selectedMonth)).forEach(t => {
      if (!agg[t.date]) agg[t.date] = { Expense: 0, Income: 0, Savings: 0, Payoff: 0 };
      agg[t.date][t.type] = (agg[t.date][t.type] || 0) + t.amount;
    });
    return agg;
  }, [transactions, selectedMonth]);

  function intensityBg(total) {
    if (total <= 0)   return '';
    if (total < 1000) return 'bg-slate-50';
    if (total < 5000) return 'bg-slate-100';
    return 'bg-slate-200';
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500">Monthly Overview</span>
      </div>
      {/* DOW headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DOW_LABELS.map(d => (
          <div key={d} className={`text-center text-[10px] font-semibold py-1.5 ${d === 'Sa' || d === 'Su' ? 'text-slate-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {cells.map((day, idx) => {
          if (!day) return <div key={`b-${idx}`} className="bg-gray-50 h-12" />;
          const dateStr   = `${selectedMonth}-${String(day).padStart(2, '0')}`;
          const isToday      = dateStr === todayIso;
          const isSelected   = dateStr === selectedDay;
          const isWeekend    = idx % 7 >= 5;
          const agg          = dayAgg[dateStr] || {};
          const dayTotal     = TABS.reduce((sum, type) => sum + (agg[type] || 0), 0);
          const iBg          = isSelected ? '' : intensityBg(dayTotal);
          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`h-12 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isSelected ? 'bg-slate-700' :
                iBg || (isWeekend ? 'bg-gray-50' : 'bg-white')
              } ${isToday && !isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
            >
              <span className={`text-[10px] font-medium leading-none ${
                isSelected ? 'text-white' : isToday ? 'text-blue-600' : isWeekend ? 'text-slate-400' : 'text-gray-600'
              }`}>{day}</span>
              {TABS.some(t => (agg[t] || 0) > 0) && (
                <div className="flex gap-0.5 leading-none">
                  {TABS.map(t => agg[t] > 0 ? <span key={t} className={`w-1 h-1 rounded-full ${TYPE_DOT_CLR[t]}`} /> : null)}
                </div>
              )}
              {dayTotal > 0 && (
                <span className={`text-[9px] font-medium leading-none ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>{fmtK(dayTotal)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── DASHBOARD PAGE ─────────────────────────────────────────────────────────

function DashboardPage({
  transactions, selectedMonth, setSelectedMonth,
  bulkRows, setBulkRows, activeTab, setActiveTab,
  categoryGroups, onBulkSave, onQuickAdd, onDelete, budgets, onCardClick,
}) {
  const lastEntryDay = useMemo(() => {
    const dates = transactions
      .filter(t => t.date.startsWith(selectedMonth))
      .map(t => t.date)
      .sort();
    return dates.length ? dates[dates.length - 1] : null;
  }, [transactions, selectedMonth]);

  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  // Auto-select the last entry day whenever it changes (month switch or data load)
  useEffect(() => {
    setSelectedCalendarDay(lastEntryDay);
  }, [lastEntryDay]);

  function handleDayClick(dateStr) {
    setSelectedCalendarDay(prev => prev === dateStr ? null : dateStr);
  }

  const dayTxns = useMemo(
    () => selectedCalendarDay
      ? transactions
          .filter(t => t.date === selectedCalendarDay)
          .sort((a, b) => TABS.indexOf(a.type) - TABS.indexOf(b.type) || b.amount - a.amount)
      : [],
    [selectedCalendarDay, transactions]
  );

  const formattedSelectedDay = useMemo(() => {
    if (!selectedCalendarDay) return '';
    const [y, m, d] = selectedCalendarDay.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
  }, [selectedCalendarDay]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ── DESKTOP: two-column layout ── */}
      <div className="hidden md:flex gap-4 px-6 py-4 items-start">
        {/* Left: main content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 pt-0.5">
              <MonthSelector compact selectedMonth={selectedMonth} onChange={setSelectedMonth} />
            </div>
            <div className="flex-1 min-w-0">
              <SummaryCards
                compact
                transactions={transactions}
                selectedMonth={selectedMonth}
                budgets={budgets}
                onCardClick={onCardClick}
              />
            </div>
          </div>
          <SpreadsheetGrid
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categoryGroups={categoryGroups}
            selectedMonth={selectedMonth}
            onSave={onBulkSave}
          />
        </div>

        {/* Right: mini calendar + day transactions — sticky */}
        <div className="w-64 shrink-0 sticky top-4 space-y-2">
          <MiniCalendar
            transactions={transactions}
            selectedMonth={selectedMonth}
            selectedDay={selectedCalendarDay}
            onDayClick={handleDayClick}
          />

          {/* Day transactions list */}
          {selectedCalendarDay && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">{formattedSelectedDay}</span>
                <button onClick={() => setSelectedCalendarDay(null)} className="text-gray-300 hover:text-gray-500 text-sm leading-none">✕</button>
              </div>
              {dayTxns.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-400">No entries</div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {dayTxns.map(t => {
                    const c = TYPE_COLOR[t.type] || TYPE_COLOR.Expense;
                    return (
                      <li key={t.id} className="flex items-center justify-between px-3 py-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${c.badge}`}>{t.type}</span>
                            <span className="text-xs text-gray-700 truncate">{t.subCategory || t.category || t.type}</span>
                          </div>
                          {t.notes && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{t.notes}</div>}
                        </div>
                        <span className="text-xs font-semibold text-gray-800 ml-2 shrink-0">{fmt(t.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE: stacked layout ── */}
      <div className="md:hidden px-4 py-4 space-y-4">
        <div className="flex items-center justify-center">
          <MonthSelector selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        </div>
        <SummaryCards
          transactions={transactions}
          selectedMonth={selectedMonth}
          budgets={budgets}
          onCardClick={onCardClick}
        />
        <QuickEntrySection
          categoryGroups={categoryGroups}
          onAdd={onQuickAdd}
          transactions={transactions}
        />
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
  const [initialTypeFilter, setInitialTypeFilter] = useState(null);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  function navigateToTransactions(type) {
    setInitialTypeFilter(type);
    setCurrentPage('transactions');
  }

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
    <div className="flex min-h-screen w-full bg-gray-50 overflow-x-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <SideNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={() => window.appAuth?.logout?.()}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 md:ml-14">
        {/* Mobile top nav — hidden on desktop */}
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
            onDelete={handleDelete}
            budgets={budgets}
            onCardClick={navigateToTransactions}
          />
        )}

        {currentPage === 'calendar' && (
          <CalendarPage
            transactions={transactions}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            categoryGroups={categoryGroups}
            onSave={handleQuickAdd}
            onDelete={handleDelete}
          />
        )}

        {currentPage === 'transactions' && (
          <TransactionsPage
            transactions={transactions}
            onBack={() => setCurrentPage('dashboard')}
            onLoadMonth={loadDashboardData}
            initialMonth={selectedMonth}
            onDelete={handleDelete}
            initialHeadFilter={initialTypeFilter}
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
            transactions={transactions}
            selectedMonth={selectedMonth}
            budgets={budgets}
          />
        )}

        <AppToast toast={toast} onClear={() => setToast(null)} />
      </div>
    </div>
  );
}

// ── MOUNT ──────────────────────────────────────────────────────────────────
const _root = ReactDOM.createRoot(document.getElementById('app-root'));
_root.render(<App />);
