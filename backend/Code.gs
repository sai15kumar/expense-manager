/* ====================================================
   EXPENSE MANAGER - GOOGLE APPS SCRIPT BACKEND
   ==================================================== */

// ====================================================
// CONFIGURATION & GLOBAL VARIABLES
// ====================================================

/**
 * Replace with your actual Google Sheet ID
 * Get this from the URL: docs.google.com/spreadsheets/d/{SHEET_ID}/edit
 */
// TODO: Replace with your actual Sheet ID before deploying
const SHEET_ID = '1yeXItfT47WxpcYCff-F8uBWeMIuvN52PrGl1B4AmaFc';

/**
 * Allowed user emails for API access
 * Only these users can call the backend APIs
 */
const ALLOWED_USERS = [
  "sai15kumar@gmail.com",
  "rubijohn88@gmail.com"
];

/**
 * Check if a user email is authorized
 * @param {string} email - User email to check
 * @returns {boolean} - True if authorized
 */
function isAuthorized(email) {
  return ALLOWED_USERS.includes(email);
}

/**
 * Extract ID token from request object
 * Handles both POST (JSON body) and GET (query params) requests
 * @param {Object} e - Request object from Apps Script
 * @returns {string|null} - ID token or null if not found
 */
function getIdToken(e) {
    if (!e) {
        Logger.log('getIdToken: Request object is null');
        return null;
    }

    // Try POST body first
    if (e.postData && e.postData.contents) {
        try {
            const data = JSON.parse(e.postData.contents);
            if (data.idToken) {
                Logger.log('getIdToken: Found token in POST body');
                return data.idToken;
            }
        } catch (parseError) {
            Logger.log('getIdToken: Failed to parse POST body - ' + parseError.message);
        }
    }

    // Try GET query parameters
    if (e.parameter && e.parameter.idToken) {
        Logger.log('getIdToken: Found token in query params');
        return e.parameter.idToken;
    }

    Logger.log('getIdToken: No token found in request');
    return null;
}

/**
 * Your OAuth 2.0 Client ID from Google Cloud Console
 * This must match the client_id used in the frontend
 */
const OAUTH_CLIENT_ID = '443549607958-j392cki6rankqqi597sav782hg80adon.apps.googleusercontent.com';

/**
 * Verify a Google ID token and return the associated email.
 * Uses Google's tokeninfo endpoint; rejects expired or invalid tokens.
 * @param {string} idToken - Google ID token from client
 * @returns {{ email: string, payload: Object }} - Verified email and raw payload
 */
function verifyGoogleIdToken(idToken) {
    if (!idToken) {
        Logger.log('verifyGoogleIdToken: Missing ID token');
        throw new Error('Missing ID token');
    }

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    Logger.log('verifyGoogleIdToken: Calling tokeninfo endpoint');
    
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const status = response.getResponseCode();
    const body = response.getContentText();

    Logger.log('verifyGoogleIdToken: Response status = ' + status);

    let tokenInfo = {};
    try {
        tokenInfo = JSON.parse(body);
    } catch (parseError) {
        Logger.log('verifyGoogleIdToken: Failed to parse response - ' + parseError.message);
        throw new Error('Invalid tokeninfo response');
    }

    if (status !== 200) {
        const description = tokenInfo.error_description || tokenInfo.error || 'Token verification failed';
        Logger.log('verifyGoogleIdToken: Verification failed - ' + description);
        throw new Error(description);
    }

    // Log critical fields for debugging
    Logger.log('verifyGoogleIdToken: tokenInfo.aud = "' + tokenInfo.aud + '"');
    Logger.log('verifyGoogleIdToken: tokenInfo.email = "' + tokenInfo.email + '"');
    Logger.log('verifyGoogleIdToken: tokenInfo.email_verified = "' + tokenInfo.email_verified + '" (type: ' + typeof tokenInfo.email_verified + ')');

    // Check expiration
    const exp = parseInt(tokenInfo.exp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!exp || nowSeconds >= exp) {
        Logger.log('verifyGoogleIdToken: Token expired (exp=' + exp + ', now=' + nowSeconds + ')');
        throw new Error('Token expired');
    }

    // Check email exists
    const email = tokenInfo.email;
    if (!email) {
        Logger.log('verifyGoogleIdToken: FAIL - Email missing in token payload');
        throw new Error('Email missing in token payload');
    }

    // Check email is verified - tokeninfo returns string "true", not boolean
    const emailVerified = tokenInfo.email_verified;
    if (emailVerified !== 'true') {
        Logger.log('verifyGoogleIdToken: FAIL - Email not verified. email_verified="' + emailVerified + '" (expected string "true")');
        throw new Error('Email not verified');
    }

    // Check audience (aud) matches our OAuth client ID exactly
    const aud = tokenInfo.aud;
    if (aud !== OAUTH_CLIENT_ID) {
        Logger.log('verifyGoogleIdToken: FAIL - Audience mismatch');
        Logger.log('  Expected: "' + OAUTH_CLIENT_ID + '"');
        Logger.log('  Got:      "' + aud + '"');
        Logger.log('  Match:    ' + (aud === OAUTH_CLIENT_ID));
        throw new Error('Invalid audience');
    }

    Logger.log('verifyGoogleIdToken: SUCCESS - Verified token for ' + email);
    return { email, payload: tokenInfo };
}

/**
 * Sheet names in the Google Spreadsheet
 * Must match exactly with the actual sheet names
 */
const SHEET_NAMES = {
    EXPENSE_LOG: 'Expense_Log',
    EXPENSE_MASTER: 'Expense_Master'
};

/**
 * Column indices in sheets (1-based)
 * Expense_Log columns: Date, Type, Category, Amount, Notes, Timestamp
 */
const COLUMNS = {
    expenseLog: {
        DATE: 1,
        TYPE: 2,
        CATEGORY: 3,
        AMOUNT: 4,
        NOTES: 5,
        TIMESTAMP: 6
    },
    expenseMaster: {
        CATEGORY: 1,
        TYPE: 2,
        BUDGET_MONTHLY: 3,
        BUDGET_YEARLY: 4
    }
};

// ====================================================
// MAIN ENDPOINT HANDLER
// ====================================================

/**
 * Main doPost function that handles all incoming requests
 * Acts as a router for different actions
 * 
 * @param {Object} e - Request object from Google Apps Script
 * @returns {TextOutput} - JSON response
 * 
 * Expected request body:
 * {
 *   "action": "getCategories" | "saveExpenses" | "getExpenses" | "getExpensesByMonth",
 *   ... additional parameters based on action
 * }
 */
function doPost(e) {
    try {
        Logger.log('=== AUTH DEBUG START ===');
        Logger.log('doPost: Raw POST body = ' + (e && e.postData && e.postData.contents));
        Logger.log('doPost: Request received');
        
        if (!e || !e.postData || !e.postData.contents) {
            Logger.log('doPost: Missing POST body');
            Logger.log('=== AUTH FAILURE ===');
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                message: 'Missing POST body'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Parse incoming request
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        Logger.log('doPost: Action = ' + action);

        // Extract and verify ID token
        const idToken = getIdToken(e);
        if (!idToken) {
            Logger.log('doPost: No ID token provided');
            Logger.log('=== AUTH FAILURE ===');
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'UNAUTHORIZED'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Authorization: verify ID token and enforce allowlist
        let verifiedEmail;
        try {
            const verification = verifyGoogleIdToken(idToken);
            verifiedEmail = verification.email;
        } catch (authError) {
            Logger.log('doPost: Token verification failed - ' + authError.message);
            Logger.log('=== AUTH FAILURE ===');
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'UNAUTHORIZED'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        if (!isAuthorized(verifiedEmail)) {
            Logger.log('doPost: Email not in allowlist - ' + verifiedEmail);
            Logger.log('=== AUTH FAILURE ===');
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'UNAUTHORIZED'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        Logger.log('doPost: Authorized request from ' + verifiedEmail + ' for action: ' + action);
        
        // Route to appropriate handler
        let response;
        switch (action) {
            case 'getCategories':
                response = handleGetCategories();
                break;
            case 'saveExpenses':
                response = handleSaveExpenses(data);
                break;
            case 'getExpenses':
                response = handleGetExpenses(data);
                break;
            case 'getExpensesByMonth':
                response = handleGetExpensesByMonth(data);
                break;
            case 'getBudgets':
                response = handleGetBudgets();
                break;
            case 'saveBudget':
                response = handleSaveBudget(data);
                break;
            default:
                response = {
                    success: false,
                    message: `Unknown action: ${action}`
                };
        }
        
        // Return response as JSON
        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        Logger.log('doPost: Error - ' + error.message);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            message: `Server error: ${error.message}`
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// Lightweight health check for GET requests
function doGet(e) {
    try {
        Logger.log('doGet: Request received');
        
        // Extract and verify ID token
        const idToken = getIdToken(e);
        if (!idToken) {
            Logger.log('doGet: No ID token provided');
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'UNAUTHORIZED'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        // Authorization: verify ID token and enforce allowlist
        let verifiedEmail;
        try {
            const verification = verifyGoogleIdToken(idToken);
            verifiedEmail = verification.email;
        } catch (authError) {
            Logger.log('doGet: Token verification failed - ' + authError.message);
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'UNAUTHORIZED'
            })).setMimeType(ContentService.MimeType.JSON);
        }

        if (!isAuthorized(verifiedEmail)) {
            Logger.log('doGet: Email not in allowlist - ' + verifiedEmail);
            return ContentService.createTextOutput(JSON.stringify({
                success: false,
                error: 'UNAUTHORIZED'
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        Logger.log('doGet: Authorized request from ' + verifiedEmail);
        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'Expense Manager backend is running'
        })).setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
        Logger.log('doGet: Error - ' + error.message);
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: 'Server error'
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// ====================================================
// ACTION HANDLERS
// ====================================================

/**
 * Handle GET CATEGORIES action
 * Fetches all available categories with their types from Expense_Master sheet
 * 
 * @returns {Object} - Response with categories array
 * Response format:
 * {
 *   "success": true,
 *   "categories": [
 *     {"name": "Food", "type": "Expense"},
 *     {"name": "Salary", "type": "Income"}
 *   ]
 * }
 */
function handleGetCategories() {
    try {
        console.log('handleGetCategories: Starting...');
        const ss = SpreadsheetApp.openById(SHEET_ID);
        console.log('handleGetCategories: Opened sheet');
        const masterSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_MASTER);
        console.log('handleGetCategories: Got sheet:', SHEET_NAMES.EXPENSE_MASTER, 'Sheet exists:', !!masterSheet);

        if (!masterSheet) {
            return {
                success: false,
                message: `Sheet ${SHEET_NAMES.EXPENSE_MASTER} not found`
            };
        }

        const range = masterSheet.getDataRange();
        const values = range.getValues();
        console.log('handleGetCategories: Got values, count:', values.length);

        const categories = [];
        const normalizeType = (t) => {
            const map = {
                'expenses': 'Expense',
                'expense': 'Expense',
                'income': 'Income',
                'payoff': 'Payoff',
                'payoffs': 'Payoff',
                'savings': 'Savings',
                'saving': 'Savings'
            };
            const key = (t || '').toString().trim().toLowerCase();
            return map[key] || (t || '').toString().trim() || 'Expense';
        };

        // Sheet layout:
        // Column A = Type (Income/Expense/Payoff), Column B = Category name, Column C = Monthly Budget
        for (let i = 1; i < values.length; i++) {
            const rawType = values[i][0];     // Column A = Type
            const rawCategory = values[i][1]; // Column B = Category name
            const monthlyBudget = parseFloat(values[i][2]) || 0; // Column C = Monthly Budget
            const type = normalizeType(rawType);
            const name = (rawCategory || '').toString().trim();

            console.log(`Row ${i}: rawType="${rawType}", rawCategory="${rawCategory}", budget="${monthlyBudget}", type="${type}", name="${name}"`);
            if (name) {
                categories.push({ 
                    name, 
                    type,
                    budget: monthlyBudget
                });
            }
        }

        console.log('handleGetCategories: Final categories:', categories);
        return {
            success: true,
            categories
        };

    } catch (error) {
        console.log('handleGetCategories: Error caught:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Handle SAVE EXPENSES action
 * Saves one or more expenses to the Expense_Log sheet
 * 
 * @param {Object} data - Request data containing:
 *   - date (YYYY-MM-DD format)
 *   - expenses (array of {type, category, amount, notes})
 * 
 * @returns {Object} - Response indicating success/failure
 * Response format:
 * {
 *   "success": true,
 *   "message": "Saved 2 expenses",
 *   "count": 2
 * }
 */
function handleSaveExpenses(data) {
    try {
        data = data || {};
        if (!data.date || !data.expenses || !Array.isArray(data.expenses)) {
            return {
                success: false,
                message: 'Missing required fields: date and expenses array'
            };
        }
        
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const logSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_LOG);
        
        if (!logSheet) {
            return {
                success: false,
                message: `Sheet ${SHEET_NAMES.EXPENSE_LOG} not found`
            };
        }
        
        let savedCount = 0;
        const now = new Date();
        
        // Save each expense to the sheet
        for (const expense of data.expenses) {
            if (!expense.category || !expense.amount) {
                continue; // Skip invalid entries
            }
            
            const row = [
                data.date,                              // Date
                expense.type || 'Expense',              // Type
                expense.category,                       // Category
                parseFloat(expense.amount),             // Amount
                expense.notes || '',                    // Notes
                now.toISOString()                       // Timestamp
            ];
            
            logSheet.appendRow(row);
            savedCount++;
        }
        
        return {
            success: true,
            message: `Saved ${savedCount} expenses`,
            count: savedCount
        };
        
    } catch (error) {
        console.error(`Error saving expenses: ${error.message}`);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Handle GET EXPENSES action
 * Fetches expenses for a specific date
 * 
 * @param {Object} data - Request data containing:
 *   - date (YYYY-MM-DD format)
 * 
 * @returns {Object} - Response with expenses array
 * Response format:
 * {
 *   "success": true,
 *   "expenses": [
 *     {"category": "Food", "amount": 250, "notes": "Lunch"},
 *     ...
 *   ]
 * }
 */
function handleGetExpenses(data) {
    try {
        data = data || {};
        if (!data.date) {
            return {
                success: false,
                message: 'Missing required field: date'
            };
        }
        
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const logSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_LOG);
        
        if (!logSheet) {
            return {
                success: false,
                message: `Sheet ${SHEET_NAMES.EXPENSE_LOG} not found`
            };
        }
        
        // Get all data from Expense_Log
        const range = logSheet.getDataRange();
        const values = range.getValues();
        
        // Filter expenses by date
        const expenses = [];
        for (let i = 1; i < values.length; i++) {
            const rowDate = values[i][COLUMNS.expenseLog.DATE - 1];
            
            // Convert date to string format (YYYY-MM-DD)
            const dateString = formatDateToString(rowDate);
            
            if (dateString === data.date) {
                expenses.push({
                    type: values[i][COLUMNS.expenseLog.TYPE - 1],
                    category: values[i][COLUMNS.expenseLog.CATEGORY - 1],
                    amount: parseFloat(values[i][COLUMNS.expenseLog.AMOUNT - 1]),
                    notes: values[i][COLUMNS.expenseLog.NOTES - 1] || '',
                    timestamp: values[i][COLUMNS.expenseLog.TIMESTAMP - 1]
                });
            }
        }
        
        return {
            success: true,
            date: data.date,
            expenses: expenses,
            count: expenses.length
        };
        
    } catch (error) {
        console.error(`Error fetching expenses: ${error.message}`);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Handle GET EXPENSES BY MONTH action
 * Fetches all expenses for a specific month
 * Returns expenses grouped by date
 * 
 * @param {Object} data - Request data containing:
 *   - year (4-digit year)
 *   - month (1-12)
 * 
 * @returns {Object} - Response with expenses grouped by date
 * Response format:
 * {
 *   "success": true,
 *   "expensesByDate": {
 *     "2025-12-01": [...],
 *     "2025-12-15": [...],
 *     ...
 *   }
 * }
 */
function handleGetExpensesByMonth(data) {
    try {
        data = data || {};
        if (!data.year || !data.month) {
            return {
                success: false,
                message: 'Missing required fields: year and month'
            };
        }
        
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const logSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_LOG);
        
        if (!logSheet) {
            return {
                success: false,
                message: `Sheet ${SHEET_NAMES.EXPENSE_LOG} not found`
            };
        }
        
        // Get all data from Expense_Log
        const range = logSheet.getDataRange();
        const values = range.getValues();
        
        // Organize expenses by date
        const expensesByDate = {};
        const year = parseInt(data.year);
        const month = parseInt(data.month);
        
        for (let i = 1; i < values.length; i++) {
            const rowDate = values[i][COLUMNS.expenseLog.DATE - 1];
            const dateString = formatDateToString(rowDate);
            
            // Check if date is in requested month
            const [dateYear, dateMonth] = dateString.split('-').map(Number);
            
            if (dateYear === year && dateMonth === month) {
                if (!expensesByDate[dateString]) {
                    expensesByDate[dateString] = [];
                }
                
                expensesByDate[dateString].push({
                    type: values[i][COLUMNS.expenseLog.TYPE - 1],
                    category: values[i][COLUMNS.expenseLog.CATEGORY - 1],
                    amount: parseFloat(values[i][COLUMNS.expenseLog.AMOUNT - 1]),
                    notes: values[i][COLUMNS.expenseLog.NOTES - 1] || '',
                    timestamp: values[i][COLUMNS.expenseLog.TIMESTAMP - 1]
                });
            }
        }
        
        return {
            success: true,
            year: year,
            month: month,
            expensesByDate: expensesByDate
        };
        
    } catch (error) {
        console.error(`Error fetching month expenses: ${error.message}`);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Handle GET BUDGETS action
 * Fetches all budgets for each category from Expense_Master sheet
 * 
 * @returns {Object} - Response with budgets array
 * Response format:
 * {
 *   "success": true,
 *   "budgets": [
 *     {"category": "Groceries", "monthlyBudget": 5000, "yearlyBudget": 60000},
 *     ...
 *   ]
 * }
 */
function handleGetBudgets() {
    try {
        console.log('handleGetBudgets: Starting...');
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const masterSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_MASTER);
        
        if (!masterSheet) {
            return {
                success: false,
                message: `Sheet ${SHEET_NAMES.EXPENSE_MASTER} not found`
            };
        }
        
        const range = masterSheet.getDataRange();
        const values = range.getValues();
        console.log('handleGetBudgets: Got values, count:', values.length);
        
        const budgets = [];
        
        // Row 0 is header, data starts from row 1
        // Column B (index 1) = Category name, Column C (index 2) = Budget Monthly, Column D (index 3) = Budget Yearly
        for (let i = 1; i < values.length; i++) {
            const category = (values[i][1] || '').toString().trim();
            const monthlyBudget = parseFloat(values[i][COLUMNS.expenseMaster.BUDGET_MONTHLY - 1]) || 0;
            const yearlyBudget = parseFloat(values[i][COLUMNS.expenseMaster.BUDGET_YEARLY - 1]) || 0;
            
            if (category) {
                budgets.push({
                    category: category,
                    monthlyBudget: monthlyBudget,
                    yearlyBudget: yearlyBudget
                });
                console.log(`handleGetBudgets: Found category "${category}" - Monthly: ${monthlyBudget}, Yearly: ${yearlyBudget}`);
            }
        }
        
        console.log('handleGetBudgets: Final budgets:', budgets.length);
        return {
            success: true,
            budgets: budgets
        };
        
    } catch (error) {
        console.log('handleGetBudgets: Error caught:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Handle SAVE BUDGET action
 * Saves/updates budgets for categories in Expense_Master sheet
 * 
 * @param {Object} data - Request data containing:
 *   - budgets (array of {category, monthlyBudget, yearlyBudget})
 * 
 * @returns {Object} - Response indicating success/failure
 * Response format:
 * {
 *   "success": true,
 *   "message": "Saved 5 budgets",
 *   "count": 5
 * }
 */
function handleSaveBudget(data) {
    try {
        data = data || {};
        if (!data.budgets || !Array.isArray(data.budgets)) {
            return {
                success: false,
                message: 'Missing required field: budgets array'
            };
        }
        
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const masterSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_MASTER);
        
        if (!masterSheet) {
            return {
                success: false,
                message: `Sheet ${SHEET_NAMES.EXPENSE_MASTER} not found`
            };
        }
        
        const range = masterSheet.getDataRange();
        const values = range.getValues();
        
        console.log(`handleSaveBudget: Received ${data.budgets.length} budgets to save`);
        console.log(`handleSaveBudget: Sheet has ${values.length - 1} rows of data`);
        
        let updateCount = 0;
        
        // Create a map of sheet categories (trimmed lowercase) to row index for faster lookup
        // NOTE: Column B (index 1) contains the actual category names like "Sai-Income", "Car Loan", etc.
        const categoryMap = {};
        for (let i = 1; i < values.length; i++) {
            // Column B (index 1) has the category name
            const rowCategory = (values[i][1] || '').toString().trim();
            if (rowCategory) {
                categoryMap[rowCategory.toLowerCase()] = i;
                console.log(`handleSaveBudget: Found category in sheet: "${rowCategory}" at row ${i + 1}`);
            }
        }
        
        console.log(`handleSaveBudget: Category map has ${Object.keys(categoryMap).length} entries`);
        
        // For each budget in the request
        for (const budget of data.budgets) {
            if (!budget.category) {
                continue;
            }
            
            const incomingCat = (budget.category || '').toString().trim();
            const rowIndex = categoryMap[incomingCat.toLowerCase()];
            
            if (rowIndex !== undefined) {
                // Update the budget columns in this row
                // Column C = Budget Monthly, Column D = Budget Yearly
                masterSheet.getRange(rowIndex + 1, COLUMNS.expenseMaster.BUDGET_MONTHLY).setValue(budget.monthlyBudget || 0);
                masterSheet.getRange(rowIndex + 1, COLUMNS.expenseMaster.BUDGET_YEARLY).setValue(budget.yearlyBudget || 0);
                updateCount++;
                console.log(`handleSaveBudget: Updated "${incomingCat}" (row ${rowIndex + 1}) - Monthly: ${budget.monthlyBudget}, Yearly: ${budget.yearlyBudget}`);
            } else {
                console.log(`handleSaveBudget: No match for category "${incomingCat}". Available: ${Object.keys(categoryMap).join(', ')}`);
            }
        }
        
        console.log(`handleSaveBudget: Updated ${updateCount} out of ${data.budgets.length} budgets`);
        return {
            success: true,
            message: `Saved ${updateCount} budgets`,
            count: updateCount
        };
        
    } catch (error) {
        console.error(`Error saving budget: ${error.message}`);
        return {
            success: false,
            message: error.message
        };
    }
}

// ====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format date object or value to YYYY-MM-DD string
 * Handles Date objects, strings, and serial numbers from Google Sheets
 * 
 * @param {*} dateValue - Date to format (Date object, string, or sheet serial)
 * @returns {string} - Formatted date string (YYYY-MM-DD)
 */
function formatDateToString(dateValue) {
    let dateObj;
    
    // Handle different date input types
    if (dateValue instanceof Date) {
        dateObj = dateValue;
    } else if (typeof dateValue === 'string') {
        // If already a string, validate and return if valid
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        dateObj = new Date(dateValue);
    } else if (typeof dateValue === 'number') {
        // Handle Google Sheets serial date format
        // Serial date starts from Dec 30, 1899
        dateObj = new Date((dateValue - 25569) * 86400 * 1000);
    } else {
        return '';
    }
    
    // Format as YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Create default sheet structure if sheets don't exist
 * Run this once during initial setup via Apps Script editor's Run menu
 * 
 * Call: createDefaultSheets()
 */
function createDefaultSheets() {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Create Expense_Log sheet if it doesn't exist
    let expenseLogSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_LOG);
    if (!expenseLogSheet) {
        expenseLogSheet = ss.insertSheet(SHEET_NAMES.EXPENSE_LOG);
        expenseLogSheet.appendRow(['Date', 'Type', 'Category', 'Amount', 'Notes', 'Timestamp']);
        // Format header row
        const headerRange = expenseLogSheet.getRange(1, 1, 1, 6);
        headerRange.setBackground('#667eea');
        headerRange.setFontColor('#ffffff');
        headerRange.setFontWeight('bold');
    }
    
    // Create Expense_Master sheet if it doesn't exist
    let masterSheet = ss.getSheetByName(SHEET_NAMES.EXPENSE_MASTER);
    if (!masterSheet) {
        masterSheet = ss.insertSheet(SHEET_NAMES.EXPENSE_MASTER);
        masterSheet.appendRow(['Category', 'Type', 'Budget (Monthly)', 'Budget (Yearly)']);
        
        // Add default categories aligned with Expense / Income / Payoff
        const defaultCategories = [
            ['Groceries', 'Expense', 0, 0],
            ['Transport', 'Expense', 0, 0],
            ['Rent', 'Expense', 0, 0],
            ['Utilities', 'Expense', 0, 0],
            ['Dining Out', 'Expense', 0, 0],
            ['Salary', 'Income', 0, 0],
            ['Bonus', 'Income', 0, 0],
            ['Interest', 'Income', 0, 0],
            ['Debt Payment', 'Payoff', 0, 0],
            ['Credit Card', 'Payoff', 0, 0]
        ];
        
        defaultCategories.forEach(cat => {
            masterSheet.appendRow(cat);
        });
        
        // Format header row
        const headerRange = masterSheet.getRange(1, 1, 1, 4);
        headerRange.setBackground('#667eea');
        headerRange.setFontColor('#ffffff');
        headerRange.setFontWeight('bold');
    }
    
    console.log('Default sheets created successfully');
}

/**
 * Test function to verify backend is working
 * Run this via Apps Script editor's Run menu to test
 */
function testBackend() {
    Logger.log('Testing Expense Manager Backend...');
    
    try {
        // Test getCategories
        const categories = handleGetCategories();
        Logger.log('getCategories result:', categories);
        
        // Test saveExpenses
        const saveResult = handleSaveExpenses({
            date: '2025-12-30',
            expenses: [
                { category: 'Food', amount: 250, notes: 'Lunch' },
                { category: 'Transport', amount: 100, notes: 'Cab' }
            ]
        });
        Logger.log('saveExpenses result:', saveResult);
        
        // Test getExpenses
        const getResult = handleGetExpenses({ date: '2025-12-30' });
        Logger.log('getExpenses result:', getResult);
        
        Logger.log('All tests completed');
    } catch (error) {
        Logger.log('Test failed:', error);
    }
}

// ====================================================
// DEPLOYMENT NOTES
// ====================================================

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Google Sheet with ID: SHEET_ID
 *    - Update SHEET_ID constant in this file
 * 
 * 2. Create two sheets:
 *    - Expense_Log (columns: Date, Type, Category, Amount, Notes, Timestamp)
 *    - Expense_Master (columns: Category, Type)
 *    - OR run createDefaultSheets() function via Script Editor
 * 
 * 3. Deploy as Web App:
 *    a) In Script Editor, click Deploy > New Deployment
 *    b) Select type: Web App
 *    c) Execute as: [Your Email]
 *    d) Who has access: Anyone
 *    e) Click Deploy
 *    f) Copy the deployment URL
 * 
 * 4. Update frontend (app.js):
 *    - Replace BACKEND_URL with the deployment URL
 *    - Format: https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercopy?v=1
 * 
 * 5. Host frontend files:
 *    - Use Firebase Hosting, GitHub Pages, or any web server
 *    - Ensure CORS is enabled for Apps Script
 * 
 * CORS CONFIGURATION:
 * - Google Apps Script automatically allows POST requests
 * - No additional CORS setup needed
 * 
 * TROUBLESHOOTING:
 * - Check browser console for detailed error messages
 * - Check Apps Script execution logs for backend errors
 * - Verify Sheet ID and sheet names match exactly
 * - Ensure date format is YYYY-MM-DD
 */
