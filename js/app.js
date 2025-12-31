/* ====================================================
   EXPENSE MANAGER - VANILLA JAVASCRIPT APP
   ==================================================== */

// ====================================================
// CONFIGURATION & CONSTANTS
// ====================================================

/**
 * Configuration object for the application
 * Update BACKEND_URL with your deployed Google Apps Script URL
 */
const CONFIG = {
    // Replace with your deployed Apps Script Web App URL
    BACKEND_URL: 'https://script.google.com/macros/s/AKfycbxAGyg-FWbRqEpGoJozCWWeIqP4xfWGBxuxEykseJkuOkXLu1oZyc3wBBO5yqvOPbMFoQ/exec',
    MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'],
    EXPENSE_ROWS: 5,
    DATE_FORMAT: 'YYYY-MM-DD' // Format: 2025-12-30
};

// ====================================================
// STATE MANAGEMENT
// ====================================================

/**
 * Application state object
 * Stores current month/year, selected date, and expenses data
 */
let appState = {
    currentDate: new Date(),
    selectedDate: null,
    categories: [], // [{name, type}]
    expensesByDate: {}, // Store fetched expenses in cache
    hasExpensesByDate: {}, // Quick lookup for which dates have expenses
    expenseRowCount: 2, // Track number of expense rows
    activeEntryType: 'Expense',
    isFetchingMonth: false // Flag to prevent duplicate month fetches
};

// ====================================================
// DOM ELEMENT REFERENCES
// ====================================================

// Header/Menu elements
const notificationBtn = document.getElementById('notificationBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Expense Management (Split View)
const expenseDetailsSection = document.getElementById('expenseDetailsSection');
const detailsTitle = document.getElementById('detailsTitle');
const existingExpensesList = document.getElementById('existingExpensesList');
const noExpensesMsg = document.getElementById('noExpensesMsg');

// Calendar elements
const monthYearDisplay = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarDatesContainer = document.getElementById('calendarDates');

// Expense form elements
const expenseEntryForm = document.getElementById('expenseEntryForm');
const expenseRowsContainer = document.getElementById('expenseRows');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtnForm = document.getElementById('saveBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const statusMessage = document.getElementById('statusMessage');
const detailsTabs = document.querySelectorAll('.details-tab');
const detailsPanels = document.querySelectorAll('.details-panel');


// ====================================================
// INITIALIZATION
// ====================================================

/**
 * Toggle menu dropdown visibility
 */
function toggleMenu() {
    menuDropdown.classList.toggle('hidden');
}

/**
 * Close menu when clicking outside
 */
function closeMenuOnClickOutside(event) {
    if (!menuBtn.contains(event.target) && !menuDropdown.contains(event.target)) {
        menuDropdown.classList.add('hidden');
    }
}

/**
 * Toggle panel collapse/expand
 */
function togglePanelCollapse(event) {
    const header = event.currentTarget;
    const panelType = header.dataset.panel;
    const panel = header.closest('.details-panel');
    const content = panel.querySelector('.panel-content');
    const icon = header.querySelector('.collapse-icon');
    
    // Toggle hidden class
    content.classList.toggle('hidden');
    
    // Update icon and collapsed state
    if (content.classList.contains('hidden')) {
        icon.textContent = '▶';
        panel.classList.remove('expanded');
        panel.classList.add('collapsed');
    } else {
        icon.textContent = '▼';
        panel.classList.add('expanded');
        panel.classList.remove('collapsed');
    }
}

// Switch between Add and Existing tabs
function setDetailsTab(panel) {
    detailsTabs.forEach(tab => {
        const isActive = tab.dataset.panel === panel;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });

    detailsPanels.forEach(p => {
        const isActive = p.dataset.panel === panel;
        p.classList.toggle('hidden-panel', !isActive);
    });

    // When switching to existing, load expenses for selected date
    if (panel === 'view' && appState.selectedDate) {
        loadExistingExpenses(appState.selectedDate);
    }
}

/**
 * Open Expense Details (No Modal - Permanent Split View)
 * Updates the right side panel with selected date's details
 */
function openExpenseManagement(dateString) {
    appState.selectedDate = dateString;
    const dateDisplay = formatDateForDisplay(dateString);
    detailsTitle.textContent = `Manage Expenses - ${dateDisplay}`;
    
    // Clear previous expenses display
    existingExpensesList.innerHTML = '';
    noExpensesMsg.style.display = 'none';
    
    // Load and display existing expenses for THIS specific date only
    loadExistingExpenses(dateString);
    
    // Reset form for new entries
    resetExpenseForm();

    // Default to Add tab when a date is selected
    setDetailsTab('entry');
    
    console.log(`Displaying expense details for ${dateString}`);
}

/**
 * Close Expense Details (No-op for permanent split view)
 */
function closeExpenseManagement() {
    // No-op: Details section is always visible
}

/**
 * Load existing expenses for a specific date
 */
function loadExistingExpenses(dateString) {
    // Check cache first
    if (appState.expensesByDate[dateString]) {
        displayExistingExpenses(appState.expensesByDate[dateString]);
    } else {
        // Fetch from backend
        fetchExpensesForDate(dateString);
    }
}

/**
 * Fetch expenses for a specific date from backend
 */
async function fetchExpensesForDate(dateString) {
    try {
        // Show loading state
        const expenseCountBadge = document.getElementById('expenseCountBadge');
        const existingExpensesList = document.getElementById('existingExpensesList');
        const noExpensesMsg = document.getElementById('noExpensesMsg');
        
        existingExpensesList.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">Loading...</td></tr>';
        
        console.log(`Fetching expenses for ${dateString}...`);
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'getExpenses',
                date: dateString
            })
        });
        
        const result = await response.json();
        console.log('Fetch result:', result);
        
        if (result.success && result.expenses) {
            appState.expensesByDate[dateString] = result.expenses;
            appState.hasExpensesByDate[dateString] = result.expenses.length > 0;
            displayExistingExpenses(result.expenses);
            
            // Update calendar to show indicator
            renderCalendar();
            console.log(`Successfully loaded ${result.expenses.length} expenses for ${dateString}`);
        } else {
            console.warn('Fetch failed or no expenses:', result.message);
            displayExistingExpenses([]);
        }
    } catch (error) {
        console.error('Error fetching expenses:', error);
        noExpensesMsg.style.display = 'block';
        noExpensesMsg.textContent = 'Error loading expenses';
    }
}

/**
 * Display existing expenses for the selected date
 * Only shows expenses from appState.selectedDate
 */
function displayExistingExpenses(expenses) {
    // Verify we're showing expenses for the correct date
    const displayDate = appState.selectedDate;
    const expenseCountBadge = document.getElementById('expenseCountBadge');
    
    if (!expenses || expenses.length === 0) {
        noExpensesMsg.style.display = 'block';
        existingExpensesList.innerHTML = '';
        expenseCountBadge.style.display = 'none';
        console.log(`No expenses found for ${displayDate}`);
        return;
    }
    
    // Mark this date as having expenses (for yellow dot indicator)
    // selectedDate is already a string like "2025-12-31"
    const selectedDateStr = typeof appState.selectedDate === 'string' 
        ? appState.selectedDate 
        : appState.selectedDate.toISOString().split('T')[0];
    appState.hasExpensesByDate[selectedDateStr] = true;
    console.log(`[DISPLAY_EXPENSES] Marked ${selectedDateStr} as having expenses`);
    
    noExpensesMsg.style.display = 'none';
    
    // Show badge with count
    expenseCountBadge.textContent = expenses.length;
    expenseCountBadge.style.display = 'inline-flex';
    
    // Build table rows with only this date's expenses
    const rows = expenses.map((expense, index) => `
        <tr>
            <td>${expense.type || 'Expense'}</td>
            <td>${expense.category || '-'}</td>
            <td>₹${parseFloat(expense.amount).toFixed(2)}</td>
            <td>${expense.notes || '-'}</td>
        </tr>
    `).join('');
    
    existingExpensesList.innerHTML = rows;
    console.log(`Displaying ${expenses.length} expenses for ${displayDate}`);
}

/**
 * Close menu when clicking outside
 */
function closeMenuOnClickOutside(event) {
    if (!menuBtn.contains(event.target) && !menuDropdown.contains(event.target)) {
        menuDropdown.classList.add('hidden');
    }
}

/**
 * Initialize the application
 * Called when DOM is ready
 */
function initializeApp() {
    console.log('Initializing Expense Manager...');
    
    // Fetch categories from backend
    fetchCategories();
    
    // Render the calendar for the current month
    renderCalendar();
    
    // Initialize Home page
    initializeHomePage();
    
    // Initialize Add screen
    initializeAddScreen();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('App initialized successfully');
}

/**
 * Handle notification button click
 */
function handleNotificationClick() {
    console.log('[HEADER] Notifications clicked');
    alert('🔔 No new notifications');
}

/**
 * Handle logout button click
 */
function handleLogout() {
    console.log('[HEADER] Logout clicked');
    if (confirm('Are you sure you want to logout?')) {
        // TODO: Clear user session and redirect to login
        alert('Logout functionality coming soon with Google Authentication');
    }
}

/**
 * Setup all event listeners for buttons and form
 */
function setupEventListeners() {
    // Calendar navigation
    prevMonthBtn.addEventListener('click', goToPreviousMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);
    
    // Header actions
    notificationBtn.addEventListener('click', handleNotificationClick);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Expense form
    cancelBtn.addEventListener('click', resetExpenseForm);
    expenseEntryForm.addEventListener('submit', saveExpenses);
    addExpenseBtn.addEventListener('click', addExpenseRow);

    // Entry type tabs
    document.querySelectorAll('.entry-tab').forEach(btn => {
        btn.addEventListener('click', () => setEntryType(btn.dataset.type));
    });

    // Details tabs (Add vs Existing)
    detailsTabs.forEach(tab => {
        tab.addEventListener('click', () => setDetailsTab(tab.dataset.panel));
    });

    // Default tab
    setDetailsTab('entry');
}

// ====================================================
// CALENDAR FUNCTIONS
// ====================================================

/**
 * Fetch all expenses for the current month to show indicators
 * Falls back to fetching expenses for each date individually
 */
async function fetchExpensesForMonth() {
    console.log('[MONTH_FETCH] Function called - starting execution');
    try {
        const year = appState.currentDate.getFullYear();
        const month = appState.currentDate.getMonth() + 1; // 1-12
        
        console.log(`[MONTH_FETCH] Starting fetch for month: ${year}-${String(month).padStart(2, '0')}`);
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'getExpensesByMonth',
                year: year,
                month: month
            })
        });
        
        const result = await response.json();
        console.log('[MONTH_FETCH] Response:', result);
        
        if (result.success && result.expensesByDate && typeof result.expensesByDate === 'object') {
            console.log(`[MONTH_FETCH] Got expensesByDate from backend`);
            // Backend returns object with dates as keys: {"2025-12-30": [...], "2025-12-31": [...]}
            Object.keys(result.expensesByDate).forEach(dateKey => {
                const expenses = result.expensesByDate[dateKey];
                if (Array.isArray(expenses) && expenses.length > 0) {
                    appState.hasExpensesByDate[dateKey] = true;
                    console.log(`[MONTH_FETCH] Marked ${dateKey} as having ${expenses.length} expenses`);
                }
            });
            console.log(`[MONTH_FETCH] Updated hasExpensesByDate:`, appState.hasExpensesByDate);
            
            // Update dots on existing calendar cells without re-rendering entire calendar
            updateCalendarDots();
        } else if (result.success && result.expenses && Array.isArray(result.expenses)) {
            console.log(`[MONTH_FETCH] Found ${result.expenses.length} total expenses`);
            // Group by date and update hasExpensesByDate
            result.expenses.forEach(expense => {
                const dateKey = expense.date || expense.Date;
                if (dateKey) {
                    appState.hasExpensesByDate[dateKey] = true;
                }
            });
            console.log(`[MONTH_FETCH] Updated hasExpensesByDate:`, appState.hasExpensesByDate);
            updateCalendarDots();
        } else {
            console.warn('[MONTH_FETCH] getExpensesByMonth not available. Falling back to individual date fetch...');
            await fallbackFetchAllDates();
        }
    } catch (error) {
        console.error('[MONTH_FETCH] Error fetching month expenses:', error);
        console.log('[MONTH_FETCH] Falling back to individual date fetch...');
        await fallbackFetchAllDates();
    }
}

/**
 * Fallback: Fetch expenses for each date in the current month (parallel)
 */
async function fallbackFetchAllDates() {
    const year = appState.currentDate.getFullYear();
    const month = appState.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    console.log(`[FALLBACK_FETCH] Fetching all dates in ${year}-${String(month + 1).padStart(2, '0')} (${daysInMonth} days)`);
    
    // Create array of all dates to fetch
    const datesToFetch = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        datesToFetch.push(dateStr);
    }
    
    // Fetch all dates in parallel (max 5 at a time to avoid overwhelming backend)
    const batchSize = 5;
    for (let i = 0; i < datesToFetch.length; i += batchSize) {
        const batch = datesToFetch.slice(i, i + batchSize);
        const promises = batch.map(dateStr => 
            fetch(CONFIG.BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    action: 'getExpenses',
                    date: dateStr
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success && result.expenses && result.expenses.length > 0) {
                    appState.hasExpensesByDate[dateStr] = true;
                    console.log(`[FALLBACK_FETCH] Date ${dateStr} has ${result.expenses.length} expenses`);
                }
            })
            .catch(error => console.error(`[FALLBACK_FETCH] Error fetching ${dateStr}:`, error))
        );
        
        await Promise.all(promises);
    }
    
    // Re-render calendar once after all data is loaded to show all dots
    console.log('[FALLBACK_FETCH] Completed. Rendering calendar with all dots...');
    renderCalendar();
}

/**
 * Update expense indicator dots on existing calendar cells
 * (without re-rendering the entire calendar)
 */
function updateCalendarDots() {
    console.log('[UPDATE_DOTS] Updating calendar dots...');
    
    const dateCells = document.querySelectorAll('.calendar-date');
    
    dateCells.forEach(cell => {
        const dateStr = cell.dataset.date;
        if (dateStr && appState.hasExpensesByDate[dateStr]) {
            // Add indicator if it doesn't exist
            if (!cell.querySelector('.expense-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'expense-indicator';
                cell.appendChild(indicator);
                console.log(`[UPDATE_DOTS] Added dot for ${dateStr}`);
            }
        }
    });
}

/**
 * Render the calendar for the current month
 * Creates calendar grid with dates, navigation, and indicators
 */
async function renderCalendar() {
    const year = appState.currentDate.getFullYear();
    const month = appState.currentDate.getMonth();
    
    console.log(`[RENDER_CALENDAR] Starting render for ${CONFIG.MONTH_NAMES[month]} ${year}`);
    
    // Update month/year display
    monthYearDisplay.textContent = `${CONFIG.MONTH_NAMES[month]} ${year}`;
    
    // Clear previous calendar dates
    calendarDatesContainer.innerHTML = '';
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Get last day of previous month (for padding)
    const prevLastDay = new Date(year, month, 0).getDate();
    
    // Create array to hold all date cells
    const dateElements = [];
    
    // Add previous month's dates (grayed out)
    for (let i = firstDay; i > 0; i--) {
        const dateDiv = createDateCell(prevLastDay - i + 1, true, null);
        dateElements.push(dateDiv);
    }
    
    // Add current month's dates
    const today = new Date();
    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(year, month, day);
        const dateString = formatDateToString(dateObj);
        const isToday = dateObj.toDateString() === today.toDateString();
        const hasExpense = appState.hasExpensesByDate[dateString] || false;
        const isSelected = appState.selectedDate === dateString;
        
        const dateDiv = createDateCell(day, false, dateString, isToday, hasExpense, isSelected);
        dateElements.push(dateDiv);
    }
    
    // Add next month's dates (grayed out)
    const remainingCells = 42 - dateElements.length; // 6 rows x 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dateDiv = createDateCell(day, true, null);
        dateElements.push(dateDiv);
    }
    
    // Append all date elements to the calendar
    dateElements.forEach(dateDiv => {
        calendarDatesContainer.appendChild(dateDiv);
    });
    
    console.log(`Calendar rendered for ${CONFIG.MONTH_NAMES[month]} ${year}`);
    
    // Fetch all month's expenses in the background
    setTimeout(() => {
        console.log('[RENDER_CALENDAR] Starting deferred background fetch for expenses...');
        console.log('[RENDER_CALENDAR] fetchExpensesForMonth function exists?', typeof fetchExpensesForMonth);
        const result = fetchExpensesForMonth();
        console.log('[RENDER_CALENDAR] Function returned:', result);
    }, 100);
}

/**
 * Create a single date cell for the calendar
 * @param {number} day - The day number
 * @param {boolean} isOtherMonth - Whether date is from another month
 * @param {string} dateString - Full date string (YYYY-MM-DD)
 * @param {boolean} isToday - Whether this is today's date
 * @param {boolean} hasExpense - Whether this date has expenses
 * @param {boolean} isSelected - Whether this date is selected by user
 * @returns {HTMLElement} - The date cell element
 */
function createDateCell(day, isOtherMonth = false, dateString = null, isToday = false, hasExpense = false, isSelected = false) {
    const dateDiv = document.createElement('div');
    dateDiv.className = 'calendar-date';
    dateDiv.textContent = day;
    
    // Add CSS classes based on state
    if (isOtherMonth) {
        dateDiv.classList.add('other-month');
    }
    if (isToday) {
        dateDiv.classList.add('today');
    }
    if (hasExpense && !isOtherMonth) {
        dateDiv.classList.add('has-expense');
    }
    if (isSelected) {
        dateDiv.classList.add('selected');
    }
    
    // Add click handler for selecting dates (only for current month)
    if (!isOtherMonth) {
        dateDiv.addEventListener('click', () => {
            selectDate(dateString, dateDiv);
        });
    }
    
    return dateDiv;
}

/**
 * Select a date from the calendar
 * Opens the expense management (split/tabbed view)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {HTMLElement} dateCell - The clicked date cell
 */
function selectDate(dateString, dateCell) {
    // Update app state with selected date
    appState.selectedDate = dateString;
    
    // Remove previous selection highlight (except today which keeps its style)
    document.querySelectorAll('.calendar-date.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // Add selection to clicked cell
    dateCell.classList.add('selected');
    
    // Open expense management view (split/tabbed)
    openExpenseManagement(dateString);
    
    console.log(`Date selected: ${dateString}`);
}

/**
 * Navigate to previous month
 */
function goToPreviousMonth() {
    appState.currentDate.setMonth(appState.currentDate.getMonth() - 1);
    renderCalendar();
    clearFormSelection();
}

/**
 * Navigate to next month
 */
function goToNextMonth() {
    appState.currentDate.setMonth(appState.currentDate.getMonth() + 1);
    renderCalendar();
    clearFormSelection();
}

// ====================================================
// EXPENSE FORM FUNCTIONS
// ====================================================

/**
 * Create empty expense entry rows in the form
 * Creates 2 rows by default, user can add more
 */
function createExpenseRows() {
    expenseRowsContainer.innerHTML = '';
    appState.expenseRowCount = 2;
    
    for (let i = 1; i <= appState.expenseRowCount; i++) {
        createAndAppendExpenseRow(i);
    }
}

/**
 * Create a single expense row and append it to the table
 * @param {number} rowNumber - Row number for identification
 */
function createAndAppendExpenseRow(rowNumber) {
    const tr = document.createElement('tr');
    tr.dataset.rowIndex = rowNumber;
    
    // Hidden type (value controlled by tabs)
    const typeInput = document.createElement('input');
    typeInput.type = 'hidden';
    typeInput.name = `type-${rowNumber}`;
    typeInput.className = 'entry-type-hidden';
    typeInput.value = appState.activeEntryType;

    // Category Cell
    const categoryTd = document.createElement('td');
    const categorySelect = document.createElement('select');
    categorySelect.name = `category-${rowNumber}`;
    categorySelect.className = 'expense-row';
    populateCategoryOptions(categorySelect);
    categoryTd.appendChild(categorySelect);
    
    // Amount Cell
    const amountTd = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.name = `amount-${rowNumber}`;
    amountInput.placeholder = 'Amount';
    amountInput.step = '0.01';
    amountInput.min = '0';
    amountInput.className = 'expense-row';
    amountTd.appendChild(amountInput);
    
    // Notes Cell
    const notesTd = document.createElement('td');
    const notesInput = document.createElement('textarea');
    notesInput.name = `notes-${rowNumber}`;
    notesInput.placeholder = 'Notes';
    notesInput.className = 'expense-row';
    notesTd.appendChild(notesInput);
    
    // Delete Cell
    const deleteTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'expense-table-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = (e) => {
        e.preventDefault();
        tr.remove();
    };
    deleteTd.appendChild(deleteBtn);
    deleteTd.appendChild(typeInput);
    
        // Append cells to row
        tr.appendChild(categoryTd);
    tr.appendChild(amountTd);
    tr.appendChild(notesTd);
    tr.appendChild(deleteTd);
    
    expenseRowsContainer.appendChild(tr);
}

/**
 * Add a new expense row
 */
function addExpenseRow(event) {
    event.preventDefault();
    appState.expenseRowCount++;
    createAndAppendExpenseRow(appState.expenseRowCount);
}

/**
 * Delete an expense row
 * @param {HTMLElement} rowElement - The row element to delete
 */
function deleteExpenseRow(rowElement) {
    rowElement.remove();
}

/**
 * Reset expense form for new entries
 */
function resetExpenseForm() {
    expenseEntryForm.reset();
    document.querySelectorAll('select').forEach(select => select.value = '');
    setEntryType('Expense');
    createExpenseRows();
}

/**
 * Clear only the calendar visual selection (not the app state)
 */
function clearCalendarSelection() {
    document.querySelectorAll('.calendar-date.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
}

/**
 * Clear form selection and reset app state (used on cancel)
 */
function clearFormSelection() {
    clearCalendarSelection();
    appState.selectedDate = null;
}

/**
 * Save expenses to the backend (Google Sheets via Apps Script)
 * @param {Event} event - Form submission event
 */
async function saveExpenses(event) {
    event.preventDefault();
    
    // Validate that a date is selected
    if (!appState.selectedDate) {
        showStatus('Please select a date first', 'error');
        return;
    }
    
    // Collect form data from all table rows
    const expenses = [];
    const expenseRows = document.querySelectorAll('.expense-entry-table tbody tr');
    
    expenseRows.forEach((row, index) => {
        const rowNum = index + 1;
        const type = row.querySelector(`input[name="type-${rowNum}"]`)?.value || 'Expense';
        const category = row.querySelector(`select[name="category-${rowNum}"]`)?.value || '';
        const amount = row.querySelector(`input[name="amount-${rowNum}"]`)?.value || '';
        const notes = row.querySelector(`textarea[name="notes-${rowNum}"]`)?.value || '';
        
        // Only save non-empty rows
        if (category && amount) {
            expenses.push({
            type: type,
                category: category,
                amount: parseFloat(amount),
                notes: notes
            });
        }
    });
    
    // Validate that at least one expense was entered
    if (expenses.length === 0) {
        showStatus('Please enter at least one expense', 'error');
        return;
    }
    
    // Disable save button to prevent double submission
    saveBtnForm.disabled = true;
    showStatus('Saving expenses...', 'info');
    
    try {
        // Send expenses to backend
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'saveExpenses',
                date: appState.selectedDate,
                expenses: expenses
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('✓ Expenses saved successfully!', 'success');
            
            // Update hasExpensesByDate cache
            appState.hasExpensesByDate[appState.selectedDate] = true;
            
            // Refresh calendar to show expense indicators
            renderCalendar();
            
            // Clear form
            document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
            document.querySelectorAll('textarea').forEach(textarea => textarea.value = '');
            document.querySelectorAll('select').forEach(select => select.value = '');
            
            // Reset to 2 rows
            createExpenseRows();
            
            // Reload expenses for current date
            if (appState.selectedDate) {
                loadExistingExpenses(appState.selectedDate);
            }
        } else {
            showStatus(`Error: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error saving expenses:', error);
        showStatus(`Network error: ${error.message}`, 'error');
    } finally {
        // Re-enable save button
        saveBtnForm.disabled = false;
    }
}

// Populate a category select with options for the active entry type
function populateCategoryOptions(selectEl) {
    selectEl.innerHTML = '<option value="">-- Select --</option>';
    const normalized = appState.categories.map(c => {
        const name = (c.name || '').toString().trim();
        const type = (c.type || '').toString().trim();
        // Fallback: if backend sent flipped shape (name holds type), swap
        if ((name === 'Expense' || name === 'Income' || name === 'Payoff') && type) {
            return { name: type, type: name };
        }
        return { name, type };
    });
    const filtered = normalized.filter(c => c.type === appState.activeEntryType);

    // Debug logs to trace category mapping
    console.log('populateCategoryOptions -> activeEntryType:', appState.activeEntryType);
    console.log('populateCategoryOptions -> normalized categories:', normalized);
    console.log('populateCategoryOptions -> filtered categories:', filtered);
    filtered.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        selectEl.appendChild(option);
    });
}

/**
 * Display status message to user
 * @param {string} message - The message to display
 * @param {string} type - Type: 'success', 'error', or 'info'
 */
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
}

// ====================================================
// FETCH DATA FUNCTIONS (Backend API Calls)
// ====================================================

/**
 * Fetch all expense categories from backend
 * Called during app initialization
 */
async function fetchCategories() {
    try {
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'getCategories'
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.categories) {
            appState.categories = result.categories;
            console.log('Categories loaded:', appState.categories);
            
            // Create expense rows once categories are loaded
            createExpenseRows();
        } else {
            console.error('Failed to load categories:', result.message);
            showStatus('Unable to load categories. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        showStatus('Unable to load categories. Please try again.', 'error');
    }
}


/**
 * Display existing expenses for the selected date
 * (This would be expanded in future versions for viewing/editing)
 */
function openViewExpenses() {
    if (!appState.selectedDate) return;
    
    const expenses = appState.expensesByDate[appState.selectedDate] || [];
    viewDateDisplay.textContent = formatDateForDisplay(appState.selectedDate);
    
    expensesList.innerHTML = '';

    // Optionally show an info/error bar (example, can be customized)
    const infoBar = document.getElementById('expensesInfoBar');
    if (infoBar) infoBar.remove();

    // Example: show a red error bar if no expenses
    if (expenses.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" class="no-expenses">No expenses recorded for this date</td>';
        expensesList.appendChild(tr);
    } else {
        let total = 0;
        expenses.forEach((expense, idx) => {
            const tr = document.createElement('tr');
            // Type
            const tdType = document.createElement('td');
            tdType.textContent = expense.type || 'Expense';
            // Category
            const tdCategory = document.createElement('td');
            tdCategory.textContent = expense.category;
            // Amount
            const tdAmount = document.createElement('td');
            tdAmount.textContent = `₹${expense.amount.toFixed(2)}`;
            // Notes
            const tdNotes = document.createElement('td');
            tdNotes.textContent = expense.notes || '-';
            // Date
            const tdDate = document.createElement('td');
            tdDate.textContent = appState.selectedDate;
            // Delete button
            const tdDelete = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.className = 'view-delete-btn';
            delBtn.type = 'button';
            delBtn.title = 'Delete';
            delBtn.innerHTML = '✕';
            delBtn.onclick = () => deleteExpense(idx);
            tdDelete.appendChild(delBtn);

            tr.appendChild(tdType);
            tr.appendChild(tdCategory);
            tr.appendChild(tdAmount);
            tr.appendChild(tdNotes);
            tr.appendChild(tdDate);
            tr.appendChild(tdDelete);
            expensesList.appendChild(tr);
            total += parseFloat(expense.amount);
        });
        // Optionally, add a total row
        const totalTr = document.createElement('tr');
        totalTr.innerHTML = `<td colspan="6" style="text-align:right;font-weight:bold;padding-top:1rem;">Total: ₹${total.toFixed(2)}</td>`;
        expensesList.appendChild(totalTr);
    }

    viewExpensesSection.classList.remove('hidden');
}

// Set active entry type and sync all row type selects
function setEntryType(type) {
    appState.activeEntryType = type;
    document.querySelectorAll('.entry-tab').forEach(btn => {
        const isActive = btn.dataset.type === type;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.entry-type-hidden').forEach(input => {
        input.value = type;
    });
    document.querySelectorAll('.expense-table select[name^="category-"]').forEach(sel => {
        populateCategoryOptions(sel);
    });
}

// Delete expense from current date
function deleteExpense(idx) {
    if (!appState.selectedDate) return;
    const arr = appState.expensesByDate[appState.selectedDate];
    if (!arr) return;
    arr.splice(idx, 1);
    if (arr.length === 0) {
        delete appState.expensesByDate[appState.selectedDate];
        delete appState.hasExpensesByDate[appState.selectedDate];
    }
    openViewExpenses();
}
/**
 * Close the view expenses section
 */
function closeViewExpenses() {
    viewExpensesSection.classList.add('hidden');
}

// ====================================================
// UTILITY FUNCTIONS
// ====================================================

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
    
    // Set initial picker value
    updateMonthPicker();
    
    // Load Home data
    loadHomeData();
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
    if (monthPicker) {
        const { year, month } = appState.homeSelectedMonth;
        monthPicker.value = `${year}-${String(month).padStart(2, '0')}`;
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
    const { year, month } = appState.homeSelectedMonth;
    
    // Update month/year display
    const monthYearDisplay = document.getElementById('homeMonthYear');
    if (monthYearDisplay) {
        monthYearDisplay.textContent = `${CONFIG.MONTH_NAMES[month - 1]} ${year}`;
    }
    
    // Fetch expenses for the month
    await fetchHomeExpensesForMonth(year, month);
    
    // Calculate and display summary
    calculateAndDisplayMonthlySummary(year, month);
    
    // Display transaction list
    renderMonthlyTransactionList(year, month);
}

/**
 * Fetch expenses for a specific month for Home page
 */
async function fetchHomeExpensesForMonth(year, month) {
    try {
        console.log(`[HOME] Fetching expenses for ${year}-${String(month).padStart(2, '0')}`);
        
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'getExpensesByMonth',
                year: year,
                month: month
            })
        });
        
        const result = await response.json();
        console.log('[HOME] Fetch result:', result);
        
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
 * Calculate and display monthly summary totals
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
}

/**
 * Render monthly transaction list
 */
function renderMonthlyTransactionList(year, month) {
    const listContainer = document.getElementById('homeTransactionList');
    
    if (!listContainer) return;
    
    // Collect all transactions
    const allTransactions = [];
    if (appState.homeExpensesByDate) {
        Object.entries(appState.homeExpensesByDate).forEach(([date, expenses]) => {
            expenses.forEach(expense => {
                allTransactions.push({
                    date: date,
                    type: expense.type || expense.Type || 'Expense',
                    category: expense.category || expense.Category || 'Uncategorized',
                    amount: parseFloat(expense.amount || expense.Amount || 0),
                    notes: expense.notes || expense.Notes || ''
                });
            });
        });
    }
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render
    if (allTransactions.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>No transactions for this month</p>
            </div>
        `;
    } else {
        listContainer.innerHTML = allTransactions.map(txn => {
            const displayDate = formatDateForDisplay(txn.date);
            return `
                <div class="transaction-card">
                    <div class="transaction-card-left">
                        <div class="transaction-date">${displayDate}</div>
                        <div class="transaction-category">${txn.category}</div>
                        <span class="transaction-type-badge ${txn.type.toLowerCase()}">${txn.type}</span>
                    </div>
                    <div class="transaction-amount">₹${txn.amount.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }
}

// ====================================================
// PAGE NAVIGATION HANDLER
// ====================================================

function setupPageNavigation() {
    const pageNavBtns = document.querySelectorAll('.page-nav-btn');
    const pages = document.querySelectorAll('.page');
    
    console.log('[PAGE_NAV] Found buttons:', pageNavBtns.length);
    console.log('[PAGE_NAV] Found pages:', pages.length);

    pageNavBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = btn.getAttribute('data-page');
            console.log('[PAGE_NAV] Button clicked, target page:', targetPage);

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
            } else {
                console.error('[PAGE_NAV] Page not found:', `${targetPage}-page`);
            }

            // Update active button
            pageNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            console.log(`[PAGE_NAV] Switched to page: ${targetPage}`);
        });
    });

    // Show dashboard by default on initial load
    const dashboardPage = document.getElementById('dashboard-page');
    const dashboardBtn = document.querySelector('.page-nav-btn[data-page="dashboard"]');
    
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

/**
 * Start the application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupPageNavigation();
});

// Log app initialization for debugging
console.log('Expense Manager app script loaded');

// ====================================================
// ADD SCREEN FUNCTIONS (REFACTORED)
// ====================================================

let addScreenState = {
    currentTab: 'expenses',
    expenseRows: [],
    monthlyRows: {
        income: [],
        savings: [],
        payoff: []
    },
    rowCounter: 0
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
    
    // Expenses tab buttons
    const addExpenseRowBtn = document.getElementById('addExpenseRowBtn');
    if (addExpenseRowBtn) {
        addExpenseRowBtn.addEventListener('click', addExpenseRow);
    }
    
    const expensesSaveBtn = document.getElementById('expensesSaveBtn');
    if (expensesSaveBtn) {
        expensesSaveBtn.addEventListener('click', saveExpenses);
    }
    
    // Monthly tab buttons
    const monthlySaveBtn = document.getElementById('monthlySaveBtn');
    if (monthlySaveBtn) {
        monthlySaveBtn.addEventListener('click', saveMonthly);
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
    const homeNavBtn = document.querySelector('.page-nav-btn[data-page="dashboard"]');
    if (homeNavBtn) {
        homeNavBtn.click();
    }
}

/**
 * Reset Add Screen
 */
function resetAddScreen() {
    console.log('[ADD_SCREEN] Resetting...');
    
    // Reset state
    addScreenState.expenseRows = [];
    addScreenState.monthlyRows = {
        income: [],
        savings: [],
        payoff: []
    };
    addScreenState.rowCounter = 0;
    
    // Set default dates
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    document.getElementById('expensesDate').value = dateStr;
    document.getElementById('monthlyMonthPicker').value = monthStr;
    
    // Clear and initialize expenses tab (1 row)
    document.getElementById('expenseRowsContainer').innerHTML = '';
    addExpenseRow();
    
    // Clear and initialize monthly sections (1 row each)
    document.getElementById('incomeMonthlyRows').innerHTML = '';
    document.getElementById('savingsMonthlyRows').innerHTML = '';
    document.getElementById('payoffMonthlyRows').innerHTML = '';
    
    addMonthlyRow('income');
    addMonthlyRow('savings');
    addMonthlyRow('payoff');
    
    // Expand Income section by default
    expandSection('income');
    
    // Update save buttons
    updateSaveButtonState();
}

/**
 * Switch tabs
 */
function switchAddTab(tabName) {
    console.log('[ADD_SCREEN] Switching to tab:', tabName);
    
    addScreenState.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.add-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.add-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'TabContent');
    });
    
    // Update save button state
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
        const hasValidRow = hasValidExpenseRow();
        console.log('[ADD_SCREEN] Expenses tab: hasValidRow =', hasValidRow);
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
 * Check if there's at least one valid expense row
 */
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
    console.log('[ADD_SCREEN] saveExpenses called');
    
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
        
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        console.log('[ADD_SCREEN] Save response status:', response.status);
        console.log('[ADD_SCREEN] Save result:', result);
        console.log('[ADD_SCREEN] Result success?', result.success);
        console.log('[ADD_SCREEN] Result message:', result.message);
        console.log('[ADD_SCREEN] Full result object:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            showToast(`${expenses.length} expense(s) saved successfully`, 'success');
            setTimeout(() => {
                closeAddScreen();
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
        
        const response = await fetch(CONFIG.BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        console.log('[ADD_SCREEN] Monthly save response status:', response.status);
        console.log('[ADD_SCREEN] Monthly save result:', result);
        console.log('[ADD_SCREEN] Result success?', result.success);
        console.log('[ADD_SCREEN] Result message:', result.message);
        console.log('[ADD_SCREEN] Full result object:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            showToast(`${transactions.length} transaction(s) saved successfully`, 'success');
            setTimeout(() => {
                closeAddScreen();
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

