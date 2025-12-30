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
    BACKEND_URL: 'https://script.google.com/macros/s/AKfycbwMgMozPe55sRL8b0_om3GCwnyERUoxFpEWfF8eMNoo-4z-QAGCAADsn616d-K_vnkQog/exec',
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
    activeEntryType: 'Expense'
};

// ====================================================
// DOM ELEMENT REFERENCES
// ====================================================

// Calendar elements
const monthYearDisplay = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarDatesContainer = document.getElementById('calendarDates');

// Expense form elements
const expenseFormSection = document.getElementById('expenseForm');
const selectedDateDisplay = document.getElementById('selectedDateDisplay');
const expenseEntryForm = document.getElementById('expenseEntryForm');
const expenseRowsContainer = document.getElementById('expenseRows');
const closeFormBtn = document.getElementById('closeForm');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtnForm = document.getElementById('saveBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const statusMessage = document.getElementById('statusMessage');

// View expenses elements
const viewExpensesSection = document.getElementById('viewExpenses');
const closeViewBtn = document.getElementById('closeViewBtn');
const viewDateDisplay = document.getElementById('viewDateDisplay');
const expensesList = document.getElementById('expensesList');

// ====================================================
// INITIALIZATION
// ====================================================

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
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('App initialized successfully');
}

/**
 * Setup all event listeners for buttons and form
 */
function setupEventListeners() {
    // Calendar navigation
    prevMonthBtn.addEventListener('click', goToPreviousMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);
    
    // Expense form
    closeFormBtn.addEventListener('click', closeExpenseForm);
    cancelBtn.addEventListener('click', closeExpenseForm);
    expenseEntryForm.addEventListener('submit', saveExpenses);
    addExpenseBtn.addEventListener('click', addExpenseRow);

    // Entry type tabs
    document.querySelectorAll('.entry-tab').forEach(btn => {
        btn.addEventListener('click', () => setEntryType(btn.dataset.type));
    });
    
    // View expenses
    closeViewBtn.addEventListener('click', closeViewExpenses);
}

// ====================================================
// CALENDAR FUNCTIONS
// ====================================================

/**
 * Render the calendar for the current month
 * Creates calendar grid with dates, navigation, and indicators
 */
function renderCalendar() {
    const year = appState.currentDate.getFullYear();
    const month = appState.currentDate.getMonth();
    
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
        
        const dateDiv = createDateCell(day, false, dateString, isToday, hasExpense);
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
}

/**
 * Create a single date cell for the calendar
 * @param {number} day - The day number
 * @param {boolean} isOtherMonth - Whether date is from another month
 * @param {string} dateString - Full date string (YYYY-MM-DD)
 * @param {boolean} isToday - Whether this is today's date
 * @param {boolean} hasExpense - Whether this date has expenses
 * @returns {HTMLElement} - The date cell element
 */
function createDateCell(day, isOtherMonth = false, dateString = null, isToday = false, hasExpense = false) {
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
 * Opens the expense entry form
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {HTMLElement} dateCell - The clicked date cell
 */
function selectDate(dateString, dateCell) {
    // Remove previous selection highlight
    document.querySelectorAll('.calendar-date.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // Add selection to clicked cell
    dateCell.classList.add('selected');
    
    // Update app state
    appState.selectedDate = dateString;
    
    // Update form display
    selectedDateDisplay.textContent = `Date: ${formatDateForDisplay(dateString)}`;
    
    // Fetch existing expenses for this date
    fetchExpensesForDate(dateString);
    
    // Show expense form
    openExpenseForm();
    
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
    amountTd.appendChild(amountInput);
    
    // Notes Cell
    const notesTd = document.createElement('td');
    const notesInput = document.createElement('textarea');
    notesInput.name = `notes-${rowNumber}`;
    notesInput.placeholder = 'Notes';
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
 * Open the expense entry form
 */
function openExpenseForm() {
    expenseFormSection.classList.remove('hidden');
    // Scroll to form (for mobile UX)
    expenseFormSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

/**
 * Close the expense entry form
 */
function closeExpenseForm() {
    expenseFormSection.classList.add('hidden');
    clearFormSelection();
}

/**
 * Clear form selection and reset UI
 */
function clearFormSelection() {
    document.querySelectorAll('.calendar-date.selected').forEach(cell => {
        cell.classList.remove('selected');
    });
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
    const expenseRows = document.querySelectorAll('.expense-table tbody tr');
    
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
            
            // Close form after 2 seconds
            setTimeout(() => {
                closeExpenseForm();
            }, 2000);
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
 * Fetch expenses for a specific date
 * @param {string} dateString - Date in YYYY-MM-DD format
 */
async function fetchExpensesForDate(dateString) {
    try {
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
        
        if (result.success && result.expenses) {
            appState.expensesByDate[dateString] = result.expenses;
            appState.hasExpensesByDate[dateString] = result.expenses.length > 0;
            console.log(`Expenses loaded for ${dateString}:`, result.expenses);
        }
    } catch (error) {
        console.error('Error fetching expenses:', error);
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
async function fetchExpensesForMonth(year, month) {
    try {
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
        
        if (result.success && result.expensesByDate) {
            // Update cache with month data
            Object.assign(appState.expensesByDate, result.expensesByDate);
            
            // Mark dates with expenses
            Object.keys(result.expensesByDate).forEach(dateString => {
                if (result.expensesByDate[dateString].length > 0) {
                    appState.hasExpensesByDate[dateString] = true;
                }
            });
            
            console.log(`Expenses loaded for ${month}/${year}`);
        }
    } catch (error) {
        console.error('Error fetching month expenses:', error);
    }
}

// ====================================================
// APP START
// ====================================================

/**
 * Start the application when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', initializeApp);

// Log app initialization for debugging
console.log('Expense Manager app script loaded');
