/* ====================================================
    EXPENSE MANAGER - VANILLA JAVASCRIPT APP
    ==================================================== */

// ====================================================
// CONFIGURATION & CONSTANTS
// ====================================================

const CONFIG = {
     BACKEND_URL: 'https://script.google.com/macros/s/AKfycbxhSI9Zo27sE1AcY_HLzZu0gP7N70qvS3Adx3DL4l-4a9hHTgEjM1O4f3jS4HQ8Dm08EA/exec',
     MONTH_NAMES: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
     EXPENSE_ROWS: 5,
     DATE_FORMAT: 'YYYY-MM-DD'
};
window.CONFIG = CONFIG;

// Shared auth storage configuration
const STORAGE_KEYS = window.AUTH_STORAGE_KEYS || {
    idToken: 'expenseManager_idToken',
    userEmail: 'expenseManager_userEmail',
    userName: 'expenseManager_userName'
};
const storage = window.AUTH_STORAGE || sessionStorage;

// ====================================================
// STATE MANAGEMENT
// ====================================================

/**
 * Application state object
 * Stores current month/year, selected date, and expenses data
 */
let appState = {
    categories: [], // [{name, type}]
    homeSelectedMonth: null,
    homeExpensesByDate: {},
    homeSelectedType: 'all',
    homeViewMode: 'summary', // 'transactions' or 'summary'
    expandedCategories: new Set(), // Track expanded category keys in summary view
    monthlyBudget: {} // {expense: amount, income: amount, savings: amount, payoff: amount}
};

// ====================================================
// DOM ELEMENT REFERENCES
// ====================================================

// Calendar page removed; DOM lookups are performed inline where needed.

// ====================================================
// FETCH DATA FUNCTIONS (Backend API Calls)
// ====================================================

/**
 * Get the current Google ID token for authenticated API calls.
 * @returns {string|null} - ID token or null if not signed in
 */
function getAuthToken() {
    return storage.getItem(STORAGE_KEYS.idToken);
}

/**
 * Get the current user's email address.
 * @returns {string|null} - User email or null if not signed in
 */
function getUserEmail() {
    return storage.getItem(STORAGE_KEYS.userEmail);
}

/**
 * Call Apps Script Web App with a JSON payload
 * Sends a simple POST request without headers to avoid CORS preflight
 * @param {Object} payload - Request payload (must include action and userEmail)
 * @returns {Promise<Object>} - Parsed JSON response from backend
 */
async function callAppsScript(payload) {
    const userEmail = getUserEmail();
    if (userEmail) {
        payload.userEmail = userEmail;
        console.log('[API] Sending request with userEmail:', userEmail, 'action:', payload.action);
    } else {
        console.warn('[API] WARNING: No userEmail found in storage');
    }
    const response = await fetch(CONFIG.BACKEND_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    return await response.json();
}

/**
 * Check API response for authorization errors
 * Centralized handler for UNAUTHORIZED responses
 * @param {Object} result - API response object
 * @returns {boolean} - True if authorized, false if unauthorized
 */
function checkApiAuthorization(result) {
    if (result && result.success === false && result.error === 'UNAUTHORIZED') {
        console.error('[API] Unauthorized response from backend');
        if (window.appAuth && typeof window.appAuth.handleUnauthorized === 'function') {
            window.appAuth.handleUnauthorized('Access denied. Please sign in again.');
        }
        return false;
    }
    return true;
}

/**
 * Fetch all expense categories from backend.
 * Called during app initialization.
 */
async function fetchCategories() {
    try {
        const result = await callAppsScript({ 
            action: 'getCategories'
        });

        if (!checkApiAuthorization(result)) return;

        if (result.success && result.categories) {
            appState.categories = result.categories;
            console.log('Categories loaded:', appState.categories);
        } else {
            console.error('Failed to load categories:', result.message);
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

// ====================================================
// UTILITY FUNCTIONS
// ====================================================

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Format date object to string (YYYY-MM-DD)
 * @param {Date} dateObj - Date object to format
 * @returns {string} - Formatted date string
 */
function formatDateToString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format date string for user display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Formatted for display (e.g., "Tuesday, Dec 30, 2025")
 */
function formatDateForDisplay(dateString) {
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(year, parseInt(month) - 1, day);
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Get icon emoji for category
 * @param {string} category - Category name
 * @param {string} type - Transaction type
 * @returns {string} - Emoji icon
 */
function getCategoryIcon(category, type) {
    const icons = {
        // Common categories
        'Food': '🍽️',
        'Transport': '🚗',
        'Shopping': '🛒',
        'Entertainment': '🎬',
        'Bills': '📄',
        'Health': '⚕️',
        'Education': '📚',
        'Groceries': '🛒',
        'Dining': '🍽️',
        'Travel': '✈️',
        'Salary': '💰',
        'Investment': '📈',
        'Gift': '🎁',
        'Rent': '🏠',
        'Utilities': '💡',
        'Insurance': '🛡️',
        'Subscription': '📱',
        'Savings': '🏦',
        'Payoff': '💳'
    };
    
    // Match by category first
    for (const [key, icon] of Object.entries(icons)) {
        if (category.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    
    // Fallback by type
    const typeKey = (type || '').toLowerCase();
    if (typeKey === 'income') return '💰';
    if (typeKey === 'expense') return '💸';
    if (typeKey === 'savings') return '🏦';
    if (typeKey === 'payoff') return '💳';
    
    return '📊';
}

/**
 * Fetch expenses for an entire month
 * (For future feature: monthly summary)
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 */
// REMOVED - using the new async version without parameters instead

// ====================================================
// HOME PAGE FUNCTIONS (MONTHLY OVERVIEW)
// ====================================================

/**
 * Initialize Home Page state and elements
 */
function initializeHomePage() {
    // Set initial month to current month
    const now = new Date();
    appState.homeSelectedMonth = {
        year: now.getFullYear(),
        month: now.getMonth() + 1 // 1-12
    };
    
    // Setup event listeners
    const homePrevBtn = document.getElementById('homePrevMonth');
    const homeNextBtn = document.getElementById('homeNextMonth');
    const homeMonthPicker = document.getElementById('homeMonthPicker');
    const homeAddBtn = document.getElementById('homeAddBtn');
    
    if (homePrevBtn) homePrevBtn.addEventListener('click', () => changeHomeMonth(-1));
    if (homeNextBtn) homeNextBtn.addEventListener('click', () => changeHomeMonth(1));
    if (homeMonthPicker) homeMonthPicker.addEventListener('change', handleMonthPickerChange);
    if (homeAddBtn) homeAddBtn.addEventListener('click', navigateToAddExpense);

    // Enable summary cards as filter toggles
    setupHomeSummaryFilters();
    
    // Setup view toggle buttons
    setupViewToggle();
    
    // Set initial picker value
    updateMonthPicker();
    
    // Load Home data
    loadHomeData();
}

/**
 * Setup click/keyboard handlers for summary cards to filter transactions
 */
function setupHomeSummaryFilters() {
    const cards = document.querySelectorAll('.home-summary-card[data-type]');
    if (!cards.length) return;

    cards.forEach(card => {
        const type = (card.dataset.type || '').toLowerCase();

        card.addEventListener('click', () => handleHomeSummarySelect(type));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleHomeSummarySelect(type);
            }
        });
    });

    updateHomeSummarySelection(appState.homeSelectedType);
}

/**
 * Toggle the selected summary card filter and re-render list
 */
function handleHomeSummarySelect(type) {
    const normalizedType = type || 'all';
    const nextType = appState.homeSelectedType === normalizedType ? 'all' : normalizedType;
    appState.homeSelectedType = nextType;

    updateHomeSummarySelection(nextType);

    if (appState.homeSelectedMonth) {
        const { year, month } = appState.homeSelectedMonth;
        renderMonthlyTransactionList(year, month);
    } else {
        renderMonthlyTransactionList();
    }
}

/**
 * Reflect active filter state on the summary cards
 */
function updateHomeSummarySelection(selectedType = 'all') {
    const activeType = (selectedType || 'all').toLowerCase();

    document.querySelectorAll('.home-summary-card[data-type]').forEach(card => {
        const cardType = (card.dataset.type || '').toLowerCase();
        const isActive = activeType !== 'all' && activeType === cardType;
        card.classList.toggle('selected', isActive);
        card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

/**
 * Setup view toggle buttons between Transactions and Summary
 */
function setupViewToggle() {
    const toggleBtns = document.querySelectorAll('.view-toggle .toggle-btn');
    const titleEl = document.getElementById('transactionListTitle');
    if (!toggleBtns.length) return;

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            if (view === appState.homeViewMode) return;

            appState.homeViewMode = view;
            
            // Update heading
            if (titleEl) {
                titleEl.textContent = view === 'summary' ? 'Summary' : 'Transactions';
            }
            
            // Update active state
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Re-render
            if (appState.homeSelectedMonth) {
                const { year, month } = appState.homeSelectedMonth;
                renderMonthlyTransactionList(year, month);
            }
        });
    });
}

/**
 * Change month on Home page
 */
function changeHomeMonth(direction) {
    const { year, month } = appState.homeSelectedMonth;
    
    let newMonth = month + direction;
    let newYear = year;
    
    if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    }
    
    appState.homeSelectedMonth = { year: newYear, month: newMonth };
    updateMonthPicker();
    loadHomeData();
}

/**
 * Handle month picker change
 */
function handleMonthPickerChange(event) {
    const value = event.target.value; // Format: "2025-12"
    if (!value) return;
    
    const [year, month] = value.split('-').map(Number);
    appState.homeSelectedMonth = { year, month };
    loadHomeData();
}

/**
 * Update month picker input value
 */
function updateMonthPicker() {
    const monthPicker = document.getElementById('homeMonthPicker');
    const monthDisplay = document.getElementById('homeMonthYear');
    if (monthPicker) {
        const { year, month } = appState.homeSelectedMonth;
        monthPicker.value = `${year}-${String(month).padStart(2, '0')}`;
    }
    if (monthDisplay) {
        const { year, month } = appState.homeSelectedMonth;
        const shortYear = String(year).slice(-2);
        monthDisplay.textContent = `${CONFIG.MONTH_NAMES[month - 1]} ${shortYear}`;
    }
}

/**
 * Navigate to Add screen
 */
function navigateToAddExpense() {
    openAddScreen();
}

/**
 * Load all Home page data (summary, transactions)
 */
async function loadHomeData() {
    showLoading();
    
    try {
        const { year, month } = appState.homeSelectedMonth;
        
        // Update month/year display
        const monthYearDisplay = document.getElementById('homeMonthYear');
        if (monthYearDisplay) {
            const shortYear = String(year).slice(-2);
            monthYearDisplay.textContent = `${CONFIG.MONTH_NAMES[month - 1]} ${shortYear}`;
        }
        
        // Fetch monthly budget
        await fetchMonthlyBudget(year, month);
        
        // Fetch expenses for the month
        await fetchHomeExpensesForMonth(year, month);
        
        // Calculate and display summary
        calculateAndDisplayMonthlySummary(year, month);
        
        // Display transaction list
        renderMonthlyTransactionList(year, month);
    } finally {
        hideLoading();
    }
}

/**
 * Fetch monthly budget for the selected month
 */
async function fetchMonthlyBudget(year, month) {
    try {
        console.log('[BUDGET] Fetching budget for', year, month);
        const result = await callAppsScript({
            action: 'getMonthlyBudget',
            year: year,
            month: month
        });

        console.log('[BUDGET] Result:', result);

        if (!checkApiAuthorization(result)) return;

        if (result.success && result.budget) {
            appState.monthlyBudget = result.budget;
            console.log('[BUDGET] Stored budget:', appState.monthlyBudget);
        } else {
            console.warn('[BUDGET] No budget data in result, using mock data for local testing');
            // Mock data for local testing
            appState.monthlyBudget = {
                expense: 50000,
                income: 200000,
                savings: 70000,
                payoff: 50000
            };
        }
    } catch (error) {
        console.error('[HOME] Error fetching budget:', error);
        // Use mock data on error for local testing
        appState.monthlyBudget = {
            expense: 50000,
            income: 200000,
            savings: 70000,
            payoff: 50000
        };
    }
}

/**
 * Fetch expenses for a specific month for Home page
 */
async function fetchHomeExpensesForMonth(year, month) {
    try {
        console.log(`[HOME] Fetching expenses for ${year}-${String(month).padStart(2, '0')}`);
        
        const result = await callAppsScript({
            action: 'getExpensesByMonth',
            year: year,
            month: month
        });
        
        console.log('[HOME] Fetch result:', result);
        
        if (!checkApiAuthorization(result)) return;
        
        if (result.success && result.expensesByDate) {
            appState.homeExpensesByDate = result.expensesByDate;
        } else if (result.success && result.expenses) {
            // Group by date if backend returns flat array
            appState.homeExpensesByDate = {};
            result.expenses.forEach(expense => {
                const date = expense.date || expense.Date;
                if (!appState.homeExpensesByDate[date]) {
                    appState.homeExpensesByDate[date] = [];
                }
                appState.homeExpensesByDate[date].push(expense);
            });
        } else {
            appState.homeExpensesByDate = {};
        }
        
    } catch (error) {
        console.error('[HOME] Error fetching expenses:', error);
        appState.homeExpensesByDate = {};
    }
}

/**
 * Calculate and display monthly summary totals with budget percentages
 */
function calculateAndDisplayMonthlySummary(year, month) {
    let totalExpense = 0;
    let totalIncome = 0;
    let totalSavings = 0;
    let totalPayoff = 0;
    
    // Sum up all expenses for the month
    if (appState.homeExpensesByDate) {
        Object.values(appState.homeExpensesByDate).forEach(expenses => {
            expenses.forEach(expense => {
                const amount = parseFloat(expense.amount || expense.Amount || 0);
                const type = (expense.type || expense.Type || '').toLowerCase();
                
                if (type === 'expense') {
                    totalExpense += amount;
                } else if (type === 'income') {
                    totalIncome += amount;
                } else if (type === 'savings') {
                    totalSavings += amount;
                } else if (type === 'payoff') {
                    totalPayoff += amount;
                }
            });
        });
    }
    
    // Update DOM
    const expenseEl = document.getElementById('homeTotalExpenses');
    const incomeEl = document.getElementById('homeTotalIncome');
    const savingsEl = document.getElementById('homeTotalSavings');
    const payoffEl = document.getElementById('homeTotalPayoffs');
    
    if (expenseEl) expenseEl.textContent = `₹${totalExpense.toFixed(2)}`;
    if (incomeEl) incomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
    if (savingsEl) savingsEl.textContent = `₹${totalSavings.toFixed(2)}`;
    if (payoffEl) payoffEl.textContent = `₹${totalPayoff.toFixed(2)}`;
    
    // Update percentage hints
    updateBudgetHints(totalExpense, totalIncome, totalSavings, totalPayoff);
}

/**
 * Update budget percentage hints on cards
 */
function updateBudgetHints(expense, income, savings, payoff) {
    console.log('[HINTS] Called with:', { expense, income, savings, payoff });
    console.log('[HINTS] Monthly budget:', appState.monthlyBudget);
    
    const budgetData = [
        { type: 'expense', actual: expense, hintId: 'hintExpenses' },
        { type: 'income', actual: income, hintId: 'hintIncome' },
        { type: 'savings', actual: savings, hintId: 'hintSavings' },
        { type: 'payoff', actual: payoff, hintId: 'hintPayoffs' }
    ];
    
    budgetData.forEach(item => {
        const hintEl = document.getElementById(item.hintId);
        if (!hintEl) {
            console.warn('[HINTS] Element not found:', item.hintId);
            return;
        }
        
        const budget = appState.monthlyBudget[item.type] || 0;
        console.log(`[HINTS] ${item.type}: actual=${item.actual}, budget=${budget}`);
        
        if (budget <= 0) {
            hintEl.textContent = '';
            hintEl.style.display = 'none';
            return;
        }
        
        const percentage = Math.round((item.actual / budget) * 100);
        hintEl.textContent = `${percentage}%`;
        hintEl.style.display = 'block';
        console.log(`[HINTS] ${item.type}: ${percentage}% displayed`);
        
        // Color logic:
        // - Expense & Payoff: >100% is bad (red), ≤100% is good (green)
        // - Income & Savings: <100% is bad (red), ≥100% is good (green)
        const isBad = (item.type === 'expense' || item.type === 'payoff') 
            ? percentage > 100 
            : percentage < 100;
        
        if (isBad) {
            hintEl.classList.add('over-budget');
        } else {
            hintEl.classList.remove('over-budget');
        }
    });
}

/**
 * Render category-wise summary view
 */
function renderCategorySummary(year, month) {
    const listContainer = document.getElementById('homeTransactionList');
    if (!listContainer) return;

    // Collect all transactions
    const allTransactions = [];
    if (appState.homeExpensesByDate) {
        Object.entries(appState.homeExpensesByDate).forEach(([date, expenses]) => {
            expenses.forEach(expense => {
                const type = expense.type || expense.Type || 'Expense';
                const normalizedType = (type || '').toLowerCase();
                allTransactions.push({
                    date: date,
                    type: type,
                    typeKey: normalizedType,
                    category: expense.category || expense.Category || 'Uncategorized',
                    amount: parseFloat(expense.amount || expense.Amount || 0),
                    notes: expense.notes || expense.Notes || ''
                });
            });
        });
    }

    const selectedType = (appState.homeSelectedType || 'all').toLowerCase();
    const filteredTransactions = allTransactions.filter(txn => {
        return selectedType === 'all' ? true : txn.typeKey === selectedType;
    });

    // Group by category and collect transactions
    const categoryMap = new Map();
    filteredTransactions.forEach(txn => {
        const key = `${txn.category}|${txn.typeKey}`;
        if (!categoryMap.has(key)) {
            categoryMap.set(key, {
                category: txn.category,
                type: txn.type,
                typeKey: txn.typeKey,
                total: 0,
                count: 0,
                transactions: []
            });
        }
        const entry = categoryMap.get(key);
        entry.total += txn.amount;
        entry.count += 1;
        entry.transactions.push(txn);
    });

    const summaryItems = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);

    const hasFilter = selectedType !== 'all';

    // Render
    if (summaryItems.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>${hasFilter ? 'No transactions for this filter' : 'No transactions for this month'}</p>
            </div>
        `;
    } else {
        listContainer.innerHTML = summaryItems.map((item, idx) => {
            const icon = getCategoryIcon(item.category, item.type);
            const countLabel = item.count === 1 ? '1 transaction' : `${item.count} transactions`;
            const categoryKey = `${item.category}|${item.typeKey}`;
            const isExpanded = appState.expandedCategories.has(categoryKey);
            
            // Sort transactions by date (newest first)
            item.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const detailsHtml = isExpanded ? `
                <div class="summary-details">
                    ${item.transactions.map(txn => {
                        const notes = txn.notes ? txn.notes.trim() : '';
                        const detailsLine = notes ? `<div class="txn-detail-notes">${notes}</div>` : '';
                        return `
                            <div class="summary-detail-row">
                                <div class="detail-left">
                                    <span class="detail-date">${formatDateForDisplay(txn.date)}</span>
                                    ${detailsLine}
                                </div>
                                <span class="detail-amount">₹${txn.amount.toFixed(2)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : '';
            
            return `
                <div class="summary-row ${isExpanded ? 'expanded' : ''}" data-category-key="${categoryKey}">
                    <div class="summary-header" data-type="${item.typeKey}">
                        <div class="txn-icon">${icon}</div>
                        <div class="txn-main">
                            <div class="txn-title">${item.category}</div>
                            <div class="txn-details">
                                <span class="txn-notes-display">${countLabel}</span>
                            </div>
                        </div>
                        <div class="txn-meta">
                            <span class="transaction-type-badge ${item.typeKey}">${item.type}</span>
                            <span class="txn-amount">₹${item.total.toFixed(2)}</span>
                        </div>
                        <div class="expand-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                    ${detailsHtml}
                </div>
            `;
        }).join('');
        
        // Add click handlers for expansion
        setupSummaryExpansion();
    }
}

/**
 * Setup click handlers for expanding/collapsing summary categories
 */
function setupSummaryExpansion() {
    const summaryRows = document.querySelectorAll('.summary-row');
    summaryRows.forEach(row => {
        const header = row.querySelector('.summary-header');
        if (!header) return;
        
        header.addEventListener('click', () => {
            const categoryKey = row.dataset.categoryKey;
            if (!categoryKey) return;
            
            if (appState.expandedCategories.has(categoryKey)) {
                appState.expandedCategories.delete(categoryKey);
            } else {
                appState.expandedCategories.add(categoryKey);
            }
            
            // Re-render
            if (appState.homeSelectedMonth) {
                const { year, month } = appState.homeSelectedMonth;
                renderCategorySummary(year, month);
            }
        });
    });
}

/**
 * Render monthly transaction list
 */
function renderMonthlyTransactionList(year, month) {
    // Check view mode and delegate to appropriate renderer
    if (appState.homeViewMode === 'summary') {
        renderCategorySummary(year, month);
        return;
    }

    const listContainer = document.getElementById('homeTransactionList');
    
    if (!listContainer) return;
    
    // Collect all transactions
    const allTransactions = [];
    if (appState.homeExpensesByDate) {
        Object.entries(appState.homeExpensesByDate).forEach(([date, expenses]) => {
            expenses.forEach(expense => {
                const type = expense.type || expense.Type || 'Expense';
                const normalizedType = (type || '').toLowerCase();
                allTransactions.push({
                    date: date,
                    type: type,
                    typeKey: normalizedType,
                    category: expense.category || expense.Category || 'Uncategorized',
                    amount: parseFloat(expense.amount || expense.Amount || 0),
                    notes: expense.notes || expense.Notes || ''
                });
            });
        });
    }
    
    const selectedType = (appState.homeSelectedType || 'all').toLowerCase();
    const filteredTransactions = allTransactions.filter(txn => {
        return selectedType === 'all' ? true : txn.typeKey === selectedType;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const hasFilter = selectedType !== 'all';

    // Group by date (already newest-first list); grouping keeps order
    const groupsMap = new Map();
    filteredTransactions.forEach(txn => {
        if (!groupsMap.has(txn.date)) {
            groupsMap.set(txn.date, []);
        }
        groupsMap.get(txn.date).push(txn);
    });

    const grouped = Array.from(groupsMap.entries()).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    grouped.forEach(([, arr]) => arr.sort((a, b) => new Date(b.date) - new Date(a.date)));

    // Render
    if (filteredTransactions.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>${hasFilter ? 'No transactions for this filter' : 'No transactions for this month'}</p>
            </div>
        `;
    } else {
        listContainer.innerHTML = grouped.map(([date, items]) => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const txnDate = new Date(date);
            
            let dateLabel;
            if (txnDate.toDateString() === today.toDateString()) {
                dateLabel = 'Today';
            } else if (txnDate.toDateString() === yesterday.toDateString()) {
                dateLabel = 'Yesterday';
            } else {
                dateLabel = formatDateForDisplay(date);
            }
            
            const count = items.length;
            const countLabel = count === 1 ? '1 Transaction' : `${count} Transactions`;
            
            const rows = items.map(txn => {
                const icon = getCategoryIcon(txn.category, txn.type);
                const notes = txn.notes ? txn.notes.trim() : '';
                const detailsHtml = notes ? `
                            <div class="txn-details">
                                <span class="txn-notes-display">${notes}</span>
                            </div>` : '';
                return `
                    <div class="txn-row" data-type="${txn.typeKey}">
                        <div class="txn-icon">${icon}</div>
                        <div class="txn-main">
                            <div class="txn-title">${txn.category}</div>${detailsHtml}
                        </div>
                        <div class="txn-meta">
                            <span class="transaction-type-badge ${txn.typeKey}">${txn.type}</span>
                            <span class="txn-amount">₹${txn.amount.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="txn-date-group">
                    <div class="txn-date-header">
                        <span class="txn-date-label">${dateLabel}</span>
                        <span class="txn-count">${countLabel}</span>
                    </div>
                    ${rows}
                </div>
            `;
        }).join('');
    }
}

// ====================================================
// PAGE NAVIGATION HANDLER
// ====================================================

function setupPageNavigation() {
    const pageNavBtns = document.querySelectorAll('.nav-rail-item');
    const pages = document.querySelectorAll('.page');
    
    console.log('[PAGE_NAV] Found buttons:', pageNavBtns.length);
    console.log('[PAGE_NAV] Found pages:', pages.length);

    // Hide all pages initially
    pages.forEach(page => {
        page.style.display = 'none';
    });

    pageNavBtns.forEach(btn => {
        const targetPage = btn.getAttribute('data-page');
        if (!targetPage) {
            return; // skip buttons like logout without a target page
        }

        // Remove any existing listeners by cloning and replacing the button
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[PAGE_NAV] Button clicked, target page:', targetPage);

            // Use Add flow helper so rows and defaults are initialized every time
            if (targetPage === 'add') {
                openAddScreen();
                document.querySelectorAll('.nav-rail-item').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');
                return;
            }

            // Hide all pages
            pages.forEach(page => {
                page.style.display = 'none';
            });

            // Show target page
            const targetPageEl = document.getElementById(`${targetPage}-page`);
            console.log('[PAGE_NAV] Looking for element:', `${targetPage}-page`, 'Found:', !!targetPageEl);
            
            if (targetPageEl) {
                targetPageEl.style.display = 'block';
                console.log('[PAGE_NAV] Showed page:', targetPage);
                
                // Initialize budget page when navigating to it
                if (targetPage === 'budget') {
                    console.log('[BUDGET] Initializing budget page...');
                    initBudgetPage();
                }
            } else {
                console.error('[PAGE_NAV] Page not found:', `${targetPage}-page`);
            }

            // Update active button
            document.querySelectorAll('.nav-rail-item').forEach(b => b.classList.remove('active'));
            newBtn.classList.add('active');

            console.log(`[PAGE_NAV] Switched to page: ${targetPage}`);
        });
    });

    // Show dashboard by default on initial load
    const dashboardPage = document.getElementById('dashboard-page');
    const dashboardBtn = document.querySelector('.nav-rail-item[data-page="dashboard"]');
    
    if (dashboardPage) {
        dashboardPage.style.display = 'block';
        console.log('[PAGE_NAV] Dashboard set as initial page');
    }
    
    if (dashboardBtn) {
        dashboardBtn.classList.add('active');
        console.log('[PAGE_NAV] Dashboard button marked as active');
    }

    console.log('[PAGE_NAV] Page navigation initialized with', pageNavBtns.length, 'buttons and', pages.length, 'pages');
}

// ====================================================
// APP START
// ====================================================

let authedAppInitialized = false;

function resetAppInitialization() {
    authedAppInitialized = false;
}

function initializeAppAfterAuth() {
    if (authedAppInitialized) return true;

    const token = getAuthToken();
    if (!token) {
        console.log('[APP] No idToken in session; skipping app initialization');
        return false;
    }

    console.log('[APP] Initializing app after auth');
    initializeHomePage();
    initializeAddScreen();
    setupPageNavigation();
    setupFAB();
    setupLogout();
    fetchCategories().catch(err => console.error('[APP] Failed to load categories:', err));
    hideLoading();

    authedAppInitialized = true;
    return true;
}

// Start-up: only attempt auth-gated init if a token already exists
document.addEventListener('DOMContentLoaded', () => {
    if (!initializeAppAfterAuth()) {
        console.log('[APP] Awaiting authentication before initializing app');
    }
});

// Expose hooks for auth module
window.initializeAppAfterAuth = initializeAppAfterAuth;
window.resetAppInitialization = resetAppInitialization;

// Log app initialization for debugging
console.log('Expense Manager app script loaded');

// ====================================================
// FLOATING ACTION BUTTON (FAB) HANDLER
// ====================================================

/**
 * Setup FAB to open Add page
 */
function setupFAB() {
    const fabBtn = document.getElementById('fabAddExpense');
    if (fabBtn) {
        fabBtn.addEventListener('click', () => {
            console.log('[FAB] Opening add page...');
            // Use same flow as nav to reset rows/defaults
            openAddScreen();
            // Remove active class from all nav items to reflect floating entry
            const navItems = document.querySelectorAll('.nav-rail-item');
            navItems.forEach(item => item.classList.remove('active'));
        });
        console.log('[FAB] FAB button initialized');
    } else {
        console.warn('[FAB] FAB button not found in DOM');
    }
}

// ====================================================
// AUTH HANDLERS
// ====================================================

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[APP] Logout requested');
        
        if (window.appAuth && typeof window.appAuth.logout === 'function') {
            window.appAuth.logout();
        } else {
            // Fallback: clear storage and reload
            storage.removeItem(STORAGE_KEYS.idToken);
            storage.removeItem(STORAGE_KEYS.userEmail);
            storage.removeItem(STORAGE_KEYS.userName);
            window.location.reload();
        }
    });
}

// ====================================================
// ADD SCREEN FUNCTIONS (REFACTORED)
// ====================================================

let addScreenState = {
    currentTab: 'expenses',
    expenseMode: 'byDate', // 'byDate' or 'byCategory'
    expenseRows: [],
    expenseRowsByCategory: [],
    monthlyRows: {
        income: [],
        savings: [],
        payoff: []
    },
    rowCounter: 0,
    rowCounterByCategory: 0
};

/**
 * Initialize Add Screen
 */
function initializeAddScreen() {
    console.log('[ADD_SCREEN] Initializing...');
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.add-tab');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchAddTab(btn.dataset.tab));
    });
    
    // Back button
    const addBackBtn = document.getElementById('addBackBtn');
    if (addBackBtn) {
        addBackBtn.addEventListener('click', closeAddScreen);
    }
    
    // Expense mode switching (By Date / By Category)
    const modeRadios = document.querySelectorAll('input[name="expenseMode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', () => switchExpenseMode(radio.value));
    });
    
    // Expenses tab buttons
    const addExpenseRowBtn = document.getElementById('addExpenseRowBtn');
    if (addExpenseRowBtn) {
        addExpenseRowBtn.addEventListener('click', addExpenseRow);
    }
    
    const addExpenseRowByCategoryBtn = document.getElementById('addExpenseRowByCategoryBtn');
    if (addExpenseRowByCategoryBtn) {
        addExpenseRowByCategoryBtn.addEventListener('click', addExpenseRowByCategory);
    }
    
    const expensesSaveBtn = document.getElementById('expensesSaveBtn');
    if (expensesSaveBtn) {
        expensesSaveBtn.addEventListener('click', saveExpenses);
    }
    
    // Category dropdown change listener
    const expensesCategorySelect = document.getElementById('expensesCategorySelect');
    if (expensesCategorySelect) {
        expensesCategorySelect.addEventListener('change', updateSaveButtonState);
    }
    
    // Monthly tab buttons
    const monthlySaveBtn = document.getElementById('monthlySaveBtn');
    if (monthlySaveBtn) {
        monthlySaveBtn.addEventListener('click', saveMonthly);
    }

    // Monthly add-row buttons
    const addIncomeMonthlyRowBtn = document.getElementById('addIncomeMonthlyRowBtn');
    if (addIncomeMonthlyRowBtn) {
        addIncomeMonthlyRowBtn.addEventListener('click', () => addMonthlyRow('income'));
    }

    const addSavingsMonthlyRowBtn = document.getElementById('addSavingsMonthlyRowBtn');
    if (addSavingsMonthlyRowBtn) {
        addSavingsMonthlyRowBtn.addEventListener('click', () => addMonthlyRow('savings'));
    }

    const addPayoffMonthlyRowBtn = document.getElementById('addPayoffMonthlyRowBtn');
    if (addPayoffMonthlyRowBtn) {
        addPayoffMonthlyRowBtn.addEventListener('click', () => addMonthlyRow('payoff'));
    }
    
    // Collapsible sections
    const sectionHeaders = document.querySelectorAll('.section-header-collapsible');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => toggleSection(header.dataset.section));
    });
    
    console.log('[ADD_SCREEN] Initialized successfully');
}

/**
 * Open Add Screen
 */
function openAddScreen() {
    console.log('[ADD_SCREEN] Opening...');
    console.log('[ADD_SCREEN] appState.categories available:', appState.categories ? appState.categories.length : 'undefined');
    
    // Ensure categories are loaded
    if (!appState.categories || appState.categories.length === 0) {
        console.log('[ADD_SCREEN] Categories not loaded, fetching now...');
        fetchCategories().then(() => {
            openAddScreenAfterCategories();
        });
    } else {
        openAddScreenAfterCategories();
    }
}

/**
 * Open Add Screen after categories are loaded
 */
function openAddScreenAfterCategories() {
    // Switch to add page
    const addPage = document.getElementById('add-page');
    if (addPage) {
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
        addPage.style.display = 'block';
        
        // Reset to expenses tab
        resetAddScreen();
        switchAddTab('expenses');
    }
}

/**
 * Close Add Screen
 */
function closeAddScreen() {
    console.log('[ADD_SCREEN] Closing...');
    
    // Navigate to home
    const homeNavBtn = document.querySelector('.nav-rail-item[data-page="dashboard"]');
    if (homeNavBtn) {
        homeNavBtn.click();
    }
}

/**
 * Reset Add Screen
 */
function resetAddScreen() {
    console.log('[ADD_SCREEN] Resetting...');
    addScreenState.currentTab = 'expenses';
    addScreenState.expenseMode = 'byDate';
    addScreenState.expenseRows = [];
    addScreenState.expenseRowsByCategory = [];
    addScreenState.monthlyRows = { income: [], savings: [], payoff: [] };
    addScreenState.rowCounter = 0;
    addScreenState.rowCounterByCategory = 0;

    const expenseContainer = document.getElementById('expenseRowsContainer');
    if (expenseContainer) expenseContainer.innerHTML = '';
    
    const expenseByCategoryContainer = document.getElementById('expenseRowsByCategoryContainer');
    if (expenseByCategoryContainer) expenseByCategoryContainer.innerHTML = '';

    ['income', 'savings', 'payoff'].forEach(type => {
        const container = document.getElementById(`${type}MonthlyRows`);
        if (container) container.innerHTML = '';
    });
    
    // Set main date field to today
    const dateInput = document.getElementById('expensesDate');
    if (dateInput) {
        const today = new Date();
        dateInput.valueAsDate = today;
    }
    
    // Set category selector to default
    const categorySelect = document.getElementById('expensesCategorySelect');
    if (categorySelect) {
        categorySelect.value = '';
        if (!appState.categories || appState.categories.length === 0) {
            console.log('[ADD_SCREEN] Categories not loaded yet, fetching...');
            fetchCategories().then(() => {
                populateCategoriesByType(categorySelect, 'Expense');
            });
        } else {
            populateCategoriesByType(categorySelect, 'Expense');
        }
    }
    
    // Set monthly selector to current month for both tabs
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthValue = `${year}-${month}`;
    
    const monthlyMonthPicker = document.getElementById('monthlyMonthPicker');
    if (monthlyMonthPicker) {
        monthlyMonthPicker.value = monthValue;
    }

    // Reset expense mode selector to byDate
    const modeRadios = document.querySelectorAll('input[name="expenseMode"]');
    modeRadios.forEach(radio => {
        radio.checked = radio.value === 'byDate';
    });
    switchExpenseMode('byDate');

    // Reset save buttons text
    const expensesSaveBtn = document.getElementById('expensesSaveBtn');
    if (expensesSaveBtn) {
        expensesSaveBtn.textContent = 'Save';
    }
    
    const monthlySaveBtn = document.getElementById('monthlySaveBtn');
    if (monthlySaveBtn) {
        monthlySaveBtn.textContent = 'Save';
    }

    // Ensure at least one empty expense row is present
    addExpenseRow();

    // Reset tab visuals and save button
    switchAddTab('expenses');
    updateSaveButtonState();
}

/**
 * Switch between add screen tabs
 */
function switchAddTab(tabName) {
    addScreenState.currentTab = tabName;

    document.querySelectorAll('.add-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.add-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}TabContent`);
    });

    if (tabName === 'monthly') {
        ['income', 'savings', 'payoff'].forEach(type => {
            const container = document.getElementById(`${type}MonthlyRows`);
            if (container && container.children.length === 0) {
                addMonthlyRow(type);
            }
        });
    } else {
        // Ensure at least one expense row is present when returning to expenses tab
        const expenseContainer = document.getElementById('expenseRowsContainer');
        if (expenseContainer && expenseContainer.children.length === 0) {
            addExpenseRow();
        }
    }

    updateSaveButtonState();
}

/**
 * Switch expense mode (By Date or By Category)
 */
function switchExpenseMode(mode) {
    console.log('[ADD_SCREEN] Switching expense mode to:', mode);
    addScreenState.expenseMode = mode;
    
    const byDateMode = document.getElementById('expenseByDateMode');
    const byCategoryMode = document.getElementById('expenseByCategoryMode');
    
    if (mode === 'byDate') {
        byDateMode.classList.remove('hidden');
        byCategoryMode.classList.add('hidden');
        
        // Reset by-category container and rows
        const container = document.getElementById('expenseRowsByCategoryContainer');
        if (container) container.innerHTML = '';
        addScreenState.expenseRowsByCategory = [];
        addScreenState.rowCounterByCategory = 0;
        
        // Ensure at least one row in by-date mode
        const dateContainer = document.getElementById('expenseRowsContainer');
        if (dateContainer && dateContainer.children.length === 0) {
            addExpenseRow();
        }
    } else {
        byDateMode.classList.add('hidden');
        byCategoryMode.classList.remove('hidden');
        
        // Ensure categories are loaded before populating dropdown
        if (!appState.categories || appState.categories.length === 0) {
            console.log('[ADD_SCREEN] Categories not loaded, fetching...');
            fetchCategories().then(() => {
                const categorySelect = document.getElementById('expensesCategorySelect');
                if (categorySelect) {
                    categorySelect.innerHTML = '<option value="">Select category</option>';
                    populateCategoriesByType(categorySelect, 'Expense');
                }
            });
        } else {
            // Categories already loaded
            const categorySelect = document.getElementById('expensesCategorySelect');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select category</option>';
                populateCategoriesByType(categorySelect, 'Expense');
            }
        }
        
        // Reset by-date container and rows
        const container = document.getElementById('expenseRowsContainer');
        if (container) container.innerHTML = '';
        addScreenState.expenseRows = [];
        addScreenState.rowCounter = 0;
        
        // Ensure at least one row in by-category mode
        const categoryContainer = document.getElementById('expenseRowsByCategoryContainer');
        if (categoryContainer && categoryContainer.children.length === 0) {
            addExpenseRowByCategory();
        }
    }
    
    updateSaveButtonState();
}

/**
 * Toggle collapsible section
 */
function toggleSection(sectionName) {
    const content = document.getElementById(sectionName + 'SectionContent');
    const arrow = document.querySelector(`[data-section="${sectionName}"] .collapse-arrow`);
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        arrow.textContent = '▼';
    } else {
        content.classList.add('collapsed');
        arrow.textContent = '▶';
    }
}

/**
 * Expand section
 */
function expandSection(sectionName) {
    const content = document.getElementById(sectionName + 'SectionContent');
    const arrow = document.querySelector(`[data-section="${sectionName}"] .collapse-arrow`);
    
    if (content) {
        content.classList.remove('collapsed');
        if (arrow) arrow.textContent = '▼';
    }
}

/**
 * Add expense row
 */
function addExpenseRow() {
    const container = document.getElementById('expenseRowsContainer');
    const rowId = addScreenState.rowCounter++;
    const isFirstRow = addScreenState.expenseRows.length === 0;
    
    const row = document.createElement('tr');
    row.className = 'expense-row';
    row.dataset.rowId = rowId;
    row.dataset.type = 'expense';
    
    row.innerHTML = `
        <td data-label="Category">
            <select class="row-category" data-row-id="${rowId}">
                <option value="">Select category</option>
            </select>
        </td>
        <td data-label="Amount">
            <input type="number" class="row-amount" data-row-id="${rowId}" placeholder="0.00" step="0.01" min="0">
        </td>
        <td data-label="Notes">
            <input type="text" class="row-notes" data-row-id="${rowId}" placeholder="Optional">
        </td>
        <td data-label="Action">
            <button type="button" class="remove-btn" ${isFirstRow ? 'disabled' : ''} onclick="removeExpenseRow(${rowId})">✕</button>
        </td>
    `;
    
    container.appendChild(row);
    
    // Populate categories
    const categorySelect = row.querySelector('.row-category');
    console.log('[ADD_SCREEN] addExpenseRow: Populating categories for expense row');
    
    // Try to find expense categories - database uses 'Expenses' (plural)
    const typesToTry = ['Expenses', 'Expense', 'expense'];
    
    for (let typeVariation of typesToTry) {
        populateCategoriesByType(categorySelect, typeVariation);
        if (categorySelect.options.length > 1) { // More than just the "Select category" option
            console.log(`[ADD_SCREEN] ✓ Found categories with type: "${typeVariation}"`);
            break;
        }
    }
    
    // Add to state
    addScreenState.expenseRows.push(rowId);
    
    // Add input listeners for enable logic
    const inputs = row.querySelectorAll('input, select');
    console.log(`[ADD_SCREEN] Row ${rowId}: Found ${inputs.length} input/select elements`);
    
    inputs.forEach((input, index) => {
        console.log(`[ADD_SCREEN] Row ${rowId}: Attaching listeners to input ${index}:`, input.className);
        
        input.addEventListener('input', () => {
            console.log(`[ADD_SCREEN] Row ${rowId}: input event triggered`);
            checkExpenseRowInput();
            updateSaveButtonState();
        });
        
        input.addEventListener('change', () => {
            console.log(`[ADD_SCREEN] Row ${rowId}: change event triggered`);
            checkExpenseRowInput();
            updateSaveButtonState();
        });
    });
    
    console.log('[ADD_SCREEN] Added expense row:', rowId);
}

/**
 * Remove expense row
 */
function removeExpenseRow(rowId) {
    const row = document.querySelector(`.expense-row[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
        addScreenState.expenseRows = addScreenState.expenseRows.filter(id => id !== rowId);
        checkExpenseRowInput();
        updateSaveButtonState();
        console.log('[ADD_SCREEN] Removed expense row:', rowId);
    }
}

/**
 * Add expense row by category (Date input instead of Category)
 */
function addExpenseRowByCategory() {
    const container = document.getElementById('expenseRowsByCategoryContainer');
    const rowId = addScreenState.rowCounterByCategory++;
    const isFirstRow = addScreenState.expenseRowsByCategory.length === 0;
    
    const row = document.createElement('tr');
    row.className = 'expense-row-by-category';
    row.dataset.rowId = rowId;
    row.dataset.type = 'expenseByCategory';
    
    const today = new Date().toISOString().split('T')[0];
    
    row.innerHTML = `
        <td data-label="Date">
            <input type="date" class="row-date" data-row-id="${rowId}" value="${today}">
        </td>
        <td data-label="Amount">
            <input type="number" class="row-amount" data-row-id="${rowId}" placeholder="0.00" step="0.01" min="0">
        </td>
        <td data-label="Notes">
            <input type="text" class="row-notes" data-row-id="${rowId}" placeholder="Optional">
        </td>
        <td data-label="Action">
            <button type="button" class="remove-btn" ${isFirstRow ? 'disabled' : ''} onclick="removeExpenseRowByCategory(${rowId})">✕</button>
        </td>
    `;
    
    container.appendChild(row);
    
    // Add to state
    addScreenState.expenseRowsByCategory.push(rowId);
    
    // Add input listeners for enable logic
    const inputs = row.querySelectorAll('input, select');
    console.log(`[ADD_SCREEN] Category row ${rowId}: Found ${inputs.length} input/select elements`);
    
    inputs.forEach((input, index) => {
        console.log(`[ADD_SCREEN] Category row ${rowId}: Attaching listeners to input ${index}:`, input.className);
        
        input.addEventListener('input', () => {
            console.log(`[ADD_SCREEN] Category row ${rowId}: input event triggered`);
            checkExpenseRowByCategoryInput();
            updateSaveButtonState();
        });
        
        input.addEventListener('change', () => {
            console.log(`[ADD_SCREEN] Category row ${rowId}: change event triggered`);
            checkExpenseRowByCategoryInput();
            updateSaveButtonState();
        });
    });
    
    console.log('[ADD_SCREEN] Added expense row by category:', rowId);
}

/**
 * Remove expense row by category
 */
function removeExpenseRowByCategory(rowId) {
    const row = document.querySelector(`.expense-row-by-category[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
        addScreenState.expenseRowsByCategory = addScreenState.expenseRowsByCategory.filter(id => id !== rowId);
        checkExpenseRowByCategoryInput();
        updateSaveButtonState();
        console.log('[ADD_SCREEN] Removed expense row by category:', rowId);
    }
}

/**
 * Check if any expense row by category has input (to enable + button)
 */
function checkExpenseRowByCategoryInput() {
    const rows = document.querySelectorAll('.expense-row-by-category');
    const addBtn = document.getElementById('addExpenseRowByCategoryBtn');
    
    console.log('[ADD_SCREEN] checkExpenseRowByCategoryInput: Checking', rows.length, 'expense rows by category');
    
    let hasInput = false;
    rows.forEach(row => {
        const dateInput = row.querySelector('.row-date');
        const amountInput = row.querySelector('.row-amount');
        
        if ((dateInput && dateInput.value) || (amountInput && amountInput.value)) {
            hasInput = true;
        }
    });
    
    if (addBtn) {
        addBtn.disabled = !hasInput;
    }
    
    // Update save button state
    updateSaveButtonState();
}

/**
 * Check if any expense row has input (to enable + button)
 */
function checkExpenseRowInput() {
    const rows = document.querySelectorAll('.expense-row');
    let hasInput = false;
    
    console.log('[ADD_SCREEN] checkExpenseRowInput: Checking', rows.length, 'expense rows');
    
    rows.forEach((row, index) => {
        const categorySelect = row.querySelector('.row-category');
        const amountInput = row.querySelector('.row-amount');
        const notesInput = row.querySelector('.row-notes');
        
        const category = categorySelect ? categorySelect.value : '';
        const amount = amountInput ? amountInput.value : '';
        const notes = notesInput ? notesInput.value : '';
        
        console.log(`[ADD_SCREEN] Row ${index}: category="${category}", amount="${amount}", notes="${notes}"`);
        
        if (category || amount || notes) {
            hasInput = true;
        }
    });
    
    const addBtn = document.getElementById('addExpenseRowBtn');
    if (addBtn) {
        addBtn.disabled = !hasInput;
        console.log(`[ADD_SCREEN] Add button state: disabled=${!hasInput}`);
    }
}


/**
 * Add monthly row
 */
function addMonthlyRow(sectionType) {
    const container = document.getElementById(sectionType + 'MonthlyRows');
    if (!container) return;
    const rowId = addScreenState.rowCounter++;
    
    const row = document.createElement('tr');
    row.className = 'monthly-row';
    row.dataset.rowId = rowId;
    row.dataset.type = sectionType;
    
    const isFirstRow = addScreenState.monthlyRows[sectionType].length === 0;
    
    row.innerHTML = `
        <td data-label="Category">
            <select class="row-category" data-row-id="${rowId}">
                <option value="">Select category</option>
            </select>
        </td>
        <td data-label="Amount">
            <input type="number" class="row-amount" data-row-id="${rowId}" placeholder="0.00" step="0.01" min="0">
        </td>
        <td data-label="Notes">
            <input type="text" class="row-notes" data-row-id="${rowId}" placeholder="Optional">
        </td>
    `;
    
    container.appendChild(row);
    
    // Populate categories
    const categorySelect = row.querySelector('.row-category');
    populateCategoriesByType(categorySelect, sectionType);
    
    // Add to state
    addScreenState.monthlyRows[sectionType].push(rowId);
    
    // Add input listeners
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', updateSaveButtonState);
        input.addEventListener('change', updateSaveButtonState);
    });
    updateSaveButtonState();
    
    console.log('[ADD_SCREEN] Added monthly row:', sectionType, rowId);
}

/**
 * Remove monthly row
 */
function removeMonthlyRow(rowId, sectionType) {
    const row = document.querySelector(`.monthly-row[data-row-id="${rowId}"]`);
    if (row) {
        row.remove();
        addScreenState.monthlyRows[sectionType] = addScreenState.monthlyRows[sectionType].filter(id => id !== rowId);
        updateSaveButtonState();
        console.log('[ADD_SCREEN] Removed monthly row:', sectionType, rowId);
    }
}

/**
 * Populate categories by type
 */
function populateCategoriesByType(selectElement, type) {
    if (!selectElement) {
        console.warn('[ADD_SCREEN] selectElement is null');
        return;
    }
    
    if (!appState.categories || appState.categories.length === 0) {
        console.warn('[ADD_SCREEN] appState.categories is empty or undefined', appState.categories);
        selectElement.innerHTML = '<option value="">Loading categories...</option>';
        return;
    }
    
    selectElement.innerHTML = '<option value="">Select category</option>';
    
    // Log all available types
    const availableTypes = [...new Set(appState.categories.map(cat => cat.type))];
    console.log(`[ADD_SCREEN] Available category types in appState:`, availableTypes);
    console.log(`[ADD_SCREEN] Looking for type: "${type}"`);
    console.log(`[ADD_SCREEN] All categories:`, appState.categories);
    
    const filtered = appState.categories.filter(cat => {
        const catType = cat.type ? cat.type.toLowerCase() : '';
        const typeMatch = catType === type.toLowerCase();
        console.log(`[ADD_SCREEN] Category "${cat.name}" has type "${cat.type}" (lowercase: "${catType}") - Match? ${typeMatch}`);
        return typeMatch;
    });
    
    console.log(`[ADD_SCREEN] RESULT: Found ${filtered.length} categories for type "${type}"`, filtered);
    
    filtered.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        selectElement.appendChild(option);
    });
    
    if (filtered.length === 0) {
        console.warn(`[ADD_SCREEN] ⚠️  NO categories found for type: ${type}`);
    }
}

/**
 * Update save button state
 */
/**
 * Update save button state
 */
function updateSaveButtonState() {
    console.log('[ADD_SCREEN] updateSaveButtonState called, currentTab:', addScreenState.currentTab);
    
    if (addScreenState.currentTab === 'expenses') {
        const saveBtn = document.getElementById('expensesSaveBtn');
        
        // Check based on current expense mode
        let hasValidRow = false;
        if (addScreenState.expenseMode === 'byCategory') {
            hasValidRow = hasValidExpenseRowByCategory();
        } else {
            hasValidRow = hasValidExpenseRow();
        }
        
        console.log('[ADD_SCREEN] Expenses tab (mode=' + addScreenState.expenseMode + '): hasValidRow =', hasValidRow);
        if (saveBtn) {
            saveBtn.disabled = !hasValidRow;
            console.log('[ADD_SCREEN] expensesSaveBtn disabled =', saveBtn.disabled);
        }
    } else {
        const saveBtn = document.getElementById('monthlySaveBtn');
        const hasValidRow = hasValidMonthlyRow();
        console.log('[ADD_SCREEN] Monthly tab: hasValidRow =', hasValidRow);
        if (saveBtn) {
            saveBtn.disabled = !hasValidRow;
            console.log('[ADD_SCREEN] monthlySaveBtn disabled =', saveBtn.disabled);
        }
    }
}

/**
 * Check if there's at least one valid expense row by category
 */
function hasValidExpenseRowByCategory() {
    const rows = document.querySelectorAll('.expense-row-by-category');
    console.log('[ADD_SCREEN] hasValidExpenseRowByCategory: Checking', rows.length, 'category rows');
    
    // Also need to check if category is selected
    const categorySelect = document.getElementById('expensesCategorySelect');
    const category = categorySelect ? categorySelect.value : '';
    
    if (!category) {
        console.log('[ADD_SCREEN] hasValidExpenseRowByCategory: No category selected');
        return false;
    }
    
    for (let row of rows) {
        const dateInput = row.querySelector('.row-date');
        const amountInput = row.querySelector('.row-amount');
        
        if (!dateInput || !amountInput) {
            console.log('[ADD_SCREEN] hasValidExpenseRowByCategory: Missing elements');
            continue;
        }
        
        const date = dateInput.value;
        const amount = parseFloat(amountInput.value);
        
        console.log('[ADD_SCREEN] hasValidExpenseRowByCategory: date="' + date + '", amount=' + amount + ', valid=' + (date && !isNaN(amount) && amount >= 0));
        
        if (date && !isNaN(amount) && amount >= 0) {
            console.log('[ADD_SCREEN] hasValidExpenseRowByCategory: Found valid row! Returning true');
            return true;
        }
    }
    
    console.log('[ADD_SCREEN] hasValidExpenseRowByCategory: No valid rows found');
    return false;
}
function hasValidExpenseRow() {
    const rows = document.querySelectorAll('.expense-row');
    console.log('[ADD_SCREEN] hasValidExpenseRow: Checking', rows.length, 'expense rows');
    
    for (let row of rows) {
        const categorySelect = row.querySelector('.row-category');
        const amountInput = row.querySelector('.row-amount');
        
        if (!categorySelect || !amountInput) {
            console.log('[ADD_SCREEN] hasValidExpenseRow: Missing elements');
            continue;
        }
        
        const category = categorySelect.value;
        const amount = parseFloat(amountInput.value);
        
        console.log('[ADD_SCREEN] hasValidExpenseRow: category="' + category + '", amount=' + amount + ', valid=' + (category && !isNaN(amount) && amount >= 0));
        
        if (category && !isNaN(amount) && amount >= 0) {
            console.log('[ADD_SCREEN] hasValidExpenseRow: Found valid row! Returning true');
            return true;
        }
    }
    
    console.log('[ADD_SCREEN] hasValidExpenseRow: No valid rows found');
    return false;
}

/**
 * Check if there's at least one valid monthly row
 */
function hasValidMonthlyRow() {
    const rows = document.querySelectorAll('.monthly-row');
    
    for (let row of rows) {
        const categorySelect = row.querySelector('.row-category');
        const amountInput = row.querySelector('.row-amount');
        
        if (!categorySelect || !amountInput) continue;
        
        const category = categorySelect.value;
        const amount = parseFloat(amountInput.value);
        
        if (category && !isNaN(amount) && amount >= 0) {
            return true;
        }
    }
    
    return false;
}

/**
 * Save expenses
 */
async function saveExpenses() {
    console.log('[ADD_SCREEN] saveExpenses called with mode:', addScreenState.expenseMode);
    
    if (addScreenState.expenseMode === 'byDate') {
        await saveExpensesByDate();
    } else {
        await saveExpensesByCategory();
    }
}

/**
 * Save expenses with By Date mode
 */
async function saveExpensesByDate() {
    console.log('[ADD_SCREEN] saveExpensesByDate called');
    
    const dateInput = document.getElementById('expensesDate');
    const date = dateInput.value;
    
    console.log('[ADD_SCREEN] Date:', date);
    
    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }
    
    // Collect all valid rows
    const rows = document.querySelectorAll('.expense-row');
    const expenses = [];
    
    console.log('[ADD_SCREEN] Found expense rows:', rows.length);
    
    rows.forEach((row, index) => {
        const categorySelect = row.querySelector('.row-category');
        const amountInput = row.querySelector('.row-amount');
        const notesInput = row.querySelector('.row-notes');
        
        console.log(`[ADD_SCREEN] Row ${index}:`, {
            categorySelect: !!categorySelect,
            amountInput: !!amountInput,
            notesInput: !!notesInput
        });
        
        if (!categorySelect || !amountInput || !notesInput) {
            console.warn(`[ADD_SCREEN] Row ${index} missing elements`);
            return;
        }
        
        const category = categorySelect.value;
        const amount = parseFloat(amountInput.value);
        const notes = notesInput.value;
        
        console.log(`[ADD_SCREEN] Row ${index} data:`, { category, amount, notes });
        
        if (category && !isNaN(amount) && amount >= 0) {
            expenses.push({
                type: 'Expense',
                category: category,
                amount: amount,
                notes: notes || ''
            });
        }
    });
    
    console.log('[ADD_SCREEN] Collected expenses:', expenses);
    
    if (expenses.length === 0) {
        showToast('Please add at least one valid expense', 'error');
        return;
    }
    
    console.log('[ADD_SCREEN] Saving expenses:', expenses);
    
    // Save using existing API
    try {
        const saveBtn = document.getElementById('expensesSaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const payload = {
            action: 'saveExpenses',
            date: date,
            expenses: expenses
        };
        
        console.log('[ADD_SCREEN] Sending payload:', JSON.stringify(payload, null, 2));
        
        const result = await callAppsScript(payload);
        
        console.log('[ADD_SCREEN] Save response status: API call completed');
        
        if (!checkApiAuthorization(result)) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
            return;
        }
        
        console.log('[ADD_SCREEN] Result success?', result.success);
        console.log('[ADD_SCREEN] Result message:', result.message);
        console.log('[ADD_SCREEN] Full result object:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            showToast(`${expenses.length} expense(s) saved successfully`, 'success');
            setTimeout(() => {
                resetAddScreen();
                if (appState.homeSelectedMonth) {
                    loadHomeData();
                }
            }, 1500);
        } else {
            showToast('Failed to save. Please try again.', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
        }
    } catch (error) {
        console.error('[ADD_SCREEN] Error saving expenses:', error);
        showToast('Failed to save. Please try again.', 'error');
        const saveBtn = document.getElementById('expensesSaveBtn');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

/**
 * Save expenses with By Category mode
 */
async function saveExpensesByCategory() {
    console.log('[ADD_SCREEN] saveExpensesByCategory called');
    
    const categorySelect = document.getElementById('expensesCategorySelect');
    const category = categorySelect.value;
    
    console.log('[ADD_SCREEN] Category:', category);
    
    if (!category) {
        showToast('Please select a category', 'error');
        return;
    }
    
    // Collect all valid rows
    const rows = document.querySelectorAll('.expense-row-by-category');
    const expenses = [];
    
    console.log('[ADD_SCREEN] Found expense rows by category:', rows.length);
    
    rows.forEach((row, index) => {
        const dateInput = row.querySelector('.row-date');
        const amountInput = row.querySelector('.row-amount');
        const notesInput = row.querySelector('.row-notes');
        
        console.log(`[ADD_SCREEN] Category row ${index}:`, {
            dateInput: !!dateInput,
            amountInput: !!amountInput,
            notesInput: !!notesInput
        });
        
        if (!dateInput || !amountInput || !notesInput) {
            console.warn(`[ADD_SCREEN] Category row ${index} missing elements`);
            return;
        }
        
        const date = dateInput.value;
        const amount = parseFloat(amountInput.value);
        const notes = notesInput.value;
        
        console.log(`[ADD_SCREEN] Category row ${index} data:`, { date, amount, notes });
        
        if (date && !isNaN(amount) && amount >= 0) {
            expenses.push({
                type: 'Expense',
                category: category,
                amount: amount,
                notes: notes || '',
                date: date
            });
        }
    });
    
    console.log('[ADD_SCREEN] Collected expenses by category:', expenses);
    
    if (expenses.length === 0) {
        showToast('Please add at least one valid entry', 'error');
        return;
    }
    
    console.log('[ADD_SCREEN] Saving expenses by category:', expenses);
    
    // Save using existing API with multiple dates
    try {
        const saveBtn = document.getElementById('expensesSaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        // Group expenses by date and save
        const expensesByDate = {};
        expenses.forEach(exp => {
            if (!expensesByDate[exp.date]) {
                expensesByDate[exp.date] = [];
            }
            expensesByDate[exp.date].push({
                type: 'Expense',
                category: exp.category,
                amount: exp.amount,
                notes: exp.notes
            });
        });
        
        // Send each date's expenses separately to API
        let totalSaved = 0;
        for (const [date, dateExpenses] of Object.entries(expensesByDate)) {
            const payload = {
                action: 'saveExpenses',
                date: date,
                expenses: dateExpenses
            };
            
            console.log('[ADD_SCREEN] Sending payload for date', date, ':', JSON.stringify(payload, null, 2));
            
            const result = await callAppsScript(payload);
            
            if (!checkApiAuthorization(result)) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
                return;
            }
            
            if (result.success) {
                totalSaved += dateExpenses.length;
            } else {
                throw new Error(`Failed to save for date ${date}`);
            }
        }
        
        showToast(`${totalSaved} expense(s) saved successfully`, 'success');
        setTimeout(() => {
            resetAddScreen();
            if (appState.homeSelectedMonth) {
                loadHomeData();
            }
        }, 1500);
    } catch (error) {
        console.error('[ADD_SCREEN] Error saving expenses by category:', error);
        showToast('Failed to save. Please try again.', 'error');
        const saveBtn = document.getElementById('expensesSaveBtn');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

/**
 * Save monthly transactions
 */
async function saveMonthly() {
    console.log('[ADD_SCREEN] saveMonthly called');
    
    const monthPicker = document.getElementById('monthlyMonthPicker');
    const monthValue = monthPicker.value;
    
    console.log('[ADD_SCREEN] Month:', monthValue);
    
    if (!monthValue) {
        showToast('Please select a month', 'error');
        return;
    }
    
    const [year, month] = monthValue.split('-');
    const date = `${year}-${month}-01`;
    
    // Collect all valid rows
    const rows = document.querySelectorAll('.monthly-row');
    const transactions = [];
    
    console.log('[ADD_SCREEN] Found monthly rows:', rows.length);
    
    rows.forEach((row, index) => {
        const categorySelect = row.querySelector('.row-category');
        const amountInput = row.querySelector('.row-amount');
        const notesInput = row.querySelector('.row-notes');
        const type = row.dataset.type;
        
        console.log(`[ADD_SCREEN] Monthly row ${index}:`, {
            categorySelect: !!categorySelect,
            amountInput: !!amountInput,
            notesInput: !!notesInput,
            type: type
        });
        
        if (!categorySelect || !amountInput || !notesInput) {
            console.warn(`[ADD_SCREEN] Monthly row ${index} missing elements`);
            return;
        }
        
        const category = categorySelect.value;
        const amount = parseFloat(amountInput.value);
        const notes = notesInput.value;
        
        console.log(`[ADD_SCREEN] Monthly row ${index} data:`, { category, amount, notes, type });
        
        if (category && !isNaN(amount) && amount >= 0) {
            // Capitalize first letter of type
            const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
            
            transactions.push({
                type: typeCapitalized,
                category: category,
                amount: amount,
                notes: notes || ''
            });
        }
    });
    
    console.log('[ADD_SCREEN] Collected transactions:', transactions);
    
    if (transactions.length === 0) {
        showToast('Please add at least one valid transaction', 'error');
        return;
    }
    
    console.log('[ADD_SCREEN] Saving monthly transactions:', transactions);
    
    // Save using existing API
    try {
        const saveBtn = document.getElementById('monthlySaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const payload = {
            action: 'saveExpenses',
            date: date,
            expenses: transactions
        };
        
        console.log('[ADD_SCREEN] Sending monthly payload:', JSON.stringify(payload, null, 2));
        
        const result = await callAppsScript(payload);
        
        console.log('[ADD_SCREEN] Monthly save response status: API call completed');
        
        if (!checkApiAuthorization(result)) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
            return;
        }
        
        console.log('[ADD_SCREEN] Result success?', result.success);
        console.log('[ADD_SCREEN] Result message:', result.message);
        console.log('[ADD_SCREEN] Full result object:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            showToast(`${transactions.length} transaction(s) saved successfully`, 'success');
            setTimeout(() => {
                resetAddScreen();
                if (appState.homeSelectedMonth) {
                    loadHomeData();
                }
            }, 1500);
        } else {
            showToast('Failed to save. Please try again.', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save';
        }
    } catch (error) {
        console.error('[ADD_SCREEN] Error saving transactions:', error);
        showToast('Failed to save. Please try again.', 'error');
        const saveBtn = document.getElementById('monthlySaveBtn');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// ====================================================
// BUDGET PAGE FUNCTIONALITY
// ====================================================

/**
 * Initialize Budget Page
 */
function initBudgetPage() {
    console.log('[BUDGET] Initializing budget page...');
    console.log('[BUDGET] Categories available:', appState.categories);
    
    // Check if categories are loaded, if not fetch them first
    if (!appState.categories || appState.categories.length === 0) {
        console.log('[BUDGET] Categories not loaded, fetching...');
        fetchCategories().then(() => {
            populateBudgetTable();
            loadBudgetData();
        });
    } else {
        // Populate budget table from categories
        populateBudgetTable();
        loadBudgetData();
    }
    
    // Setup form submission
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetSubmit);
    }
}

/**
 * Populate budget tables by type
 */
function populateBudgetTable() {
    const incomeTableBody = document.getElementById('incomeTableBody');
    const expenseTableBody = document.getElementById('expenseTableBody');
    const payoffTableBody = document.getElementById('payoffTableBody');
    const savingsTableBody = document.getElementById('savingsTableBody');
    
    // Clear existing
    if (incomeTableBody) incomeTableBody.innerHTML = '';
    if (expenseTableBody) expenseTableBody.innerHTML = '';
    if (payoffTableBody) payoffTableBody.innerHTML = '';
    if (savingsTableBody) savingsTableBody.innerHTML = '';
    
    console.log('[BUDGET] All categories:', appState.categories);
    
    // Debug: Show unique type values
    const uniqueTypes = [...new Set(appState.categories.map(c => c.type))];
    console.log('[BUDGET] Unique type values found:', uniqueTypes);
    console.log('[BUDGET] Sample categories:', appState.categories.slice(0, 3));
    
    // Group categories by type
    const incomeCategories = appState.categories.filter(c => c.type === 'Income').sort((a, b) => a.name.localeCompare(b.name));
    const expenseCategories = appState.categories.filter(c => c.type === 'Expense').sort((a, b) => a.name.localeCompare(b.name));
    const payoffCategories = appState.categories.filter(c => c.type === 'Payoff').sort((a, b) => a.name.localeCompare(b.name));
    const savingsCategories = appState.categories.filter(c => c.type === 'Savings').sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('[BUDGET] Income:', incomeCategories.length, 'Expense:', expenseCategories.length, 'Payoff:', payoffCategories.length, 'Savings:', savingsCategories.length);
    
    // Populate each table
    incomeCategories.forEach(cat => {
        if (incomeTableBody) {
            const row = createBudgetTableRow(cat.name, cat.type);
            incomeTableBody.appendChild(row);
        }
    });
    
    expenseCategories.forEach(cat => {
        if (expenseTableBody) {
            const row = createBudgetTableRow(cat.name, cat.type);
            expenseTableBody.appendChild(row);
        }
    });
    
    payoffCategories.forEach(cat => {
        if (payoffTableBody) {
            const row = createBudgetTableRow(cat.name, cat.type);
            payoffTableBody.appendChild(row);
        }
    });
    
    savingsCategories.forEach(cat => {
        if (savingsTableBody) {
            const row = createBudgetTableRow(cat.name, cat.type);
            savingsTableBody.appendChild(row);
        }
    });
    
    // Setup collapsible sections
    setupBudgetSectionToggle();
}

/**
 * Setup collapsible sections for budget tables
 */
function setupBudgetSectionToggle() {
    const sectionHeaders = document.querySelectorAll('.budget-type-header');
    
    sectionHeaders.forEach(header => {
        // Remove existing listeners
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', (e) => {
            e.preventDefault();
            const section = newHeader.closest('.budget-type-section');
            
            // Get all budget sections
            const allSections = document.querySelectorAll('.budget-type-section');
            
            // Close all sections except the clicked one
            allSections.forEach(s => {
                if (s !== section) {
                    s.classList.add('collapsed');
                }
            });
            
            // Toggle the clicked section
            section.classList.toggle('collapsed');
        });
    });
}

/**
 * Create budget table row for a category
 */
function createBudgetTableRow(categoryName, type) {
    const tr = document.createElement('tr');
    tr.dataset.category = categoryName;
    tr.dataset.type = type;
    
    // Category column
    const categoryCell = document.createElement('td');
    categoryCell.textContent = categoryName;
    tr.appendChild(categoryCell);
    
    // Monthly budget input column
    const monthlyCell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `budget-${type}-${categoryName}`;
    input.name = `budget-${type}-${categoryName}`;
    input.step = '0.01';
    input.min = '0';
    input.placeholder = '0.00';
    input.dataset.category = categoryName;
    input.dataset.type = type;
    input.addEventListener('input', (e) => updateYearlyAmount(e.target));
    monthlyCell.appendChild(input);
    tr.appendChild(monthlyCell);
    
    // Yearly budget column (auto-calculated)
    const yearlyCell = document.createElement('td');
    yearlyCell.className = 'yearly-amount';
    yearlyCell.id = `yearly-${type}-${categoryName}`;
    yearlyCell.textContent = '0.00';
    tr.appendChild(yearlyCell);
    
    return tr;
}

/**
 * Update yearly amount when monthly budget changes
 */
function updateYearlyAmount(input) {
    const monthlyAmount = parseFloat(input.value) || 0;
    const yearlyAmount = monthlyAmount * 12;
    const type = input.dataset.type;
    const category = input.dataset.category;
    const yearlyCell = document.getElementById(`yearly-${type}-${category}`);
    if (yearlyCell) {
        yearlyCell.textContent = yearlyAmount.toFixed(2);
    }
    
    // Update summary cards
    updateBudgetSummary();
}

/**
 * Update budget summary cards with totals for each type
 */
function updateBudgetSummary() {
    const incomeHeaderSummary = document.getElementById('incomeHeaderSummary');
    const savingsHeaderSummary = document.getElementById('savingsHeaderSummary');
    const payoffHeaderSummary = document.getElementById('payoffHeaderSummary');
    const expenseHeaderSummary = document.getElementById('expenseHeaderSummary');
    
    let incomeTotal = 0;
    let savingsTotal = 0;
    let payoffTotal = 0;
    let expenseTotal = 0;
    
    // Sum up all input values by type
    const inputs = document.querySelectorAll('#budgetForm input[type="number"]');
    inputs.forEach(input => {
        const amount = parseFloat(input.value) || 0;
        const type = input.dataset.type;
        
        if (type === 'Income') {
            incomeTotal += amount;
        } else if (type === 'Savings') {
            savingsTotal += amount;
        } else if (type === 'Payoff') {
            payoffTotal += amount;
        } else if (type === 'Expense') {
            expenseTotal += amount;
        }
    });
    
    // Update header displays
    if (incomeHeaderSummary) incomeHeaderSummary.textContent = `₹${incomeTotal.toFixed(2)}`;
    if (savingsHeaderSummary) savingsHeaderSummary.textContent = `₹${savingsTotal.toFixed(2)}`;
    if (payoffHeaderSummary) payoffHeaderSummary.textContent = `₹${payoffTotal.toFixed(2)}`;
    if (expenseHeaderSummary) expenseHeaderSummary.textContent = `₹${expenseTotal.toFixed(2)}`;
}

/**
 * Load saved budget data from localStorage
 */
/**
 * Load budget data from categories
 */
function loadBudgetData() {
    console.log('[BUDGET] Loading budget data from categories...');
    
    // Populate inputs with budget values from categories
    if (appState.categories && appState.categories.length > 0) {
        appState.categories.forEach(cat => {
            if (cat.budget && cat.budget > 0) {
                const inputId = `budget-${cat.type}-${cat.name}`;
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = cat.budget;
                    // Update yearly amount
                    updateYearlyAmount(input);
                }
            }
        });
    }
    
    // Update summary cards
    updateBudgetSummary();
}

/**
 * Handle budget form submission
 */
async function handleBudgetSubmit(event) {
    event.preventDefault();
    
    const budgets = [];
    const form = document.getElementById('budgetForm');
    const inputs = form.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        const monthlyBudget = parseFloat(input.value) || 0;
        if (monthlyBudget > 0) {
            const category = input.dataset.category;
            const type = input.dataset.type;
            const yearlyBudget = monthlyBudget * 12;
            
            budgets.push({
                category: category,
                type: type,
                monthlyBudget: monthlyBudget,
                yearlyBudget: yearlyBudget
            });
        }
    });
    
    console.log('[BUDGET] Saving budget data:', budgets);
    
    // Save to Google Sheets
    try {
        const saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }
        
        const result = await callAppsScript({
            action: 'saveBudget',
            budgets: budgets
        });
        
        if (!checkApiAuthorization(result)) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Budget';
            return;
        }
        
        if (result.success) {
            showToast('Budget saved successfully!', 'success');
            // Update categories to reflect new budget values
            fetchCategories().then(() => {
                loadBudgetData();
            });
        } else {
            showToast(`Failed to save budget: ${result.message}`, 'error');
        }
        
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Budget';
        }
    } catch (error) {
        console.error('[BUDGET] Error saving budget:', error);
        showToast('Error saving budget. Please try again.', 'error');
        const saveBtn = form.querySelector('button[type="submit"]');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Budget';
        }
    }
}
