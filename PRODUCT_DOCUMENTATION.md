# EXPENSE MANAGER - MASTER PRODUCT DOCUMENTATION

**Version:** 1.1  
**Last Updated:** Jan 11, 2026  
**Status:** Production Ready

---

## TABLE OF CONTENTS

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Application Structure](#3-application-structure)
4. [Pages & Features](#4-pages--features)
5. [Data Models](#5-data-models)
6. [Backend API](#6-backend-api)
7. [Frontend Components](#7-frontend-components)
8. [State Management](#8-state-management)
9. [Core Functions](#9-core-functions)
10. [User Workflows](#10-user-workflows)
11. [Technical Specifications](#11-technical-specifications)
12. [Known Limitations](#12-known-limitations)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. PRODUCT OVERVIEW

### What is Expense Manager?

A lightweight, cloud-powered personal finance tracker that helps users record and monitor daily transactions across four categories:
- **Expenses** - Money going out
- **Income** - Money coming in
- **Savings** - Money set aside
- **Payoffs** - Debt repayments

### Key Characteristics

- **Calendar-First Design**: All transactions are tied to specific dates
- **No Authentication Required**: Ready to use immediately
- **Cloud Storage**: Data stored in your personal Google Sheet
- **Mobile-First**: Optimized for smartphone use
- **Zero Dependencies**: Pure HTML/CSS/JavaScript - no frameworks
- **Free & Open Source**: Complete data ownership

### Target Users

- Individuals tracking personal finances
- Small household expense monitoring
- Users wanting simple, fast expense entry
- People who prefer calendar-based organization
- Those seeking Google Sheets integration

---

## 2. ARCHITECTURE

### High-Level Architecture

```
┌─────────────────┐
│   User Browser  │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP POST (JSON)
         ▼
┌─────────────────┐
│ Google Apps     │
│ Script Backend  │
│   (Code.gs)     │
└────────┬────────┘
         │ Read/Write
         ▼
┌─────────────────┐
│ Google Sheets   │
│   (Database)    │
└─────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5 | Structure |
| | CSS3 (Mobile-First) | Styling |
| | Vanilla JavaScript | Logic |
| **Backend** | Google Apps Script | Server-side logic |
| **Database** | Google Sheets | Data persistence |
| **Hosting** | Static hosting (Firebase, GitHub Pages, etc.) | Deployment |

### Data Flow

1. **User Input** → Browser captures form data
2. **Frontend** → JavaScript validates and packages data as JSON
3. **HTTP Request** → POST request sent to Apps Script URL
4. **Backend Processing** → Apps Script parses request and executes action
5. **Database Operation** → Read/write to Google Sheets
6. **Response** → JSON response returned to frontend
7. **UI Update** → JavaScript updates DOM with new data

---

## 3. APPLICATION STRUCTURE

### File Structure

```
Expense Manager/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css         # All styling (mobile-first)
├── js/
│   └── app.js            # All application logic
├── backend/
│   └── Code.gs           # Google Apps Script backend
├── README.md             # Project overview
├── DEPLOYMENT_GUIDE.md   # Setup instructions
├── SETUP_CHECKLIST.md    # Step-by-step checklist
├── QUICK_REFERENCE.md    # Quick reference guide
└── PRODUCT_DOCUMENTATION.md  # This file
```

### Code Organization

#### index.html Structure
- **Header**: App title, notifications, logout
- **Navigation**: 4-page tabs (Dashboard, Calendar, Budget, Settings)
- **Main Content**: 4 page containers (only one visible at a time)
- **Scripts**: Single app.js file

#### app.js Structure (1108 lines)
1. **Configuration** (Lines 1-20): Constants, backend URL
2. **State Management** (Lines 22-39): appState object
3. **DOM References** (Lines 41-72): Element selectors
4. **Initialization** (Lines 74-135): Setup functions
5. **Expense Management** (Lines 137-357): CRUD operations
6. **Calendar Functions** (Lines 359-608): Rendering, navigation
7. **Form Functions** (Lines 610-744): Row management, validation
8. **Save/Fetch Operations** (Lines 746-918): API calls
9. **Utilities** (Lines 920-1071): Date formatting, helpers
10. **Page Navigation** (Lines 1073-1108): Page switching

#### Code.gs Structure (602 lines)
1. **Configuration** (Lines 1-40): Sheet IDs, constants
2. **Main Handler** (Lines 42-112): doPost router
3. **Get Categories** (Lines 114-148): Fetch Expense_Master
4. **Save Expenses** (Lines 150-254): Write to Expense_Log
5. **Get Expenses** (Lines 256-344): Fetch by date
6. **Get Expenses by Month** (Lines 346-488): Fetch entire month
7. **Utilities** (Lines 490-602): Validation, formatting

---

## 4. PAGES & FEATURES

### Page 1: Dashboard (📊)

**Purpose**: Visual overview of financial status

**Components**:
- Month selector dropdown (Current/Last/YTD/Custom)
- Monthly summary cards (Income, Expenses, Payoffs, Savings)
- Budget vs Actual comparison bars
- Category breakdown chart placeholder
- Annual summary cards (YTD Income/Expenses/Payoffs/Savings)

**Current Status**: 
- ✅ HTML structure complete
- ⚠️ JavaScript implementation pending
- 🔴 No data visualization yet

**Features**:
- Summary aggregation (not yet implemented)
- Budget comparison (not yet implemented)
- Visual charts (placeholder only)

---

### Page 2: Calendar (📅) - PRIMARY PAGE

**Purpose**: Core expense entry and management interface

**Layout**: Two-tab interface for Expenses and Monthly transactions

#### Tab 1: Expenses

**NEW: Dual Entry Mode**

Users can choose between two expense entry modes:

**Mode 1: By Date (Default)**
- Select a date first
- Add multiple category expenses for that date
- Best for entering all expenses for a specific day

**Mode 2: By Category**
- Select a category first
- Add multiple date entries for that category
- Best for entering the same recurring expense across multiple dates

**Components - Date Mode**:
- Mode selector (radio buttons: Date | Category)
- Date input field
- Expense rows table:
  - Category dropdown (filtered to Expense types)
  - Amount input (number, required)
  - Notes input (text, optional)
  - Remove button (✕)
- "+ Add another expense" button
- Save button

**Components - Category Mode**:
- Mode selector (radio buttons: Date | Category)
- Category dropdown (filtered to Expense types)
- Date entry rows table:
  - Date input (pre-filled with today)
  - Amount input (number, required)
  - Notes input (text, optional)
  - Remove button (✕)
- "+ Add another date" button
- Save button

**Behavior**:
- Mode selector allows switching between Date and Category modes
- Switching modes resets the form
- Category dropdown automatically filters Expense-type categories
- Save button enables only when valid data is entered
- Form stays on Add screen after save (resets for next entry)
- Success message shows expense count saved
- Dashboard updates in background
- First row cannot be deleted (at least one row required)

**Tab 2: Monthly**

**Tab 2: Monthly**

**Components**:
- Month selector (current month default)
- Three collapsible sections:
  - Income entries
  - Savings entries  
  - Payoff entries
- Each section has:
  - Category dropdown
  - Amount input
  - Notes input
  - "+ Add row" button
- Save button

**Behavior**:
- All monthly transactions saved together
- Form stays on Add screen after save (resets for next entry)
- Dashboard updates in background

**Features**:
- ✅ Dual entry mode (Date or Category)
- ✅ Multi-row batch entry
- ✅ Type-specific category filtering
- ✅ Real-time validation
- ✅ Stay on screen after save
- ✅ Form reset after successful save
- ❌ Edit/delete existing expenses (future)

---

### Page 3: Budget (💰)

**Purpose**: Set monthly budget targets for each category

**Components**:
- Section headers for each type (Income, Expense, Savings, Payoff)
- Budget input fields for each category
- Save button
- Status message area

**Behavior**:
- Categories auto-populated from Expense_Master
- Budget values saved per category
- Used for Dashboard comparisons (future)

**Current Status**:
- ✅ Form structure complete
- ✅ Categories populated dynamically
- ⚠️ Save functionality basic (no validation)
- 🔴 No budget vs actual comparison yet

---

### Page 4: Settings (⚙️)

**Purpose**: App configuration and information

**Sections**:

1. **Data Management**
   - Export data button (future)
   - Clear all data button (future)
   - Backup reminder

2. **Display Preferences**
   - Currency selection (future)
   - Date format (future)
   - Theme toggle (future)

3. **About**
   - App version
   - Links to documentation
   - Credits

**Current Status**:
- ✅ HTML structure
- 🔴 All features pending implementation

---

## 5. DATA MODELS

### Google Sheets Structure

#### Sheet 1: Expense_Log

**Purpose**: Stores all transactions

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Date | Date | Yes | YYYY-MM-DD format |
| Type | Text | Yes | Expense/Income/Savings/Payoff |
| Category | Text | Yes | From Expense_Master |
| Amount | Number | Yes | Positive number |
| Notes | Text | No | Optional description |
| Timestamp | DateTime | Yes | Auto-generated on save |

**Example Row**:
```
2025-12-31 | Expense | Food | 250 | Lunch at restaurant | 2025-12-31 14:30:00
```

**Constraints**:
- Date must be valid date
- Type must match one of 4 types
- Category must exist in Expense_Master
- Amount must be positive number
- One row per expense (no aggregation)

#### Sheet 2: Expense_Master

**Purpose**: Defines available categories

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Category | Text | Yes | Unique category name |
| Type | Text | Yes | Expense/Income/Savings/Payoff |

**Example Rows**:
```
Food       | Expense
Transport  | Expense
Salary     | Income
Savings    | Savings
Loan       | Payoff
```

**Constraints**:
- Category names must be unique
- Type must match one of 4 types
- No empty categories
- Case-sensitive matching

---

### Frontend Data Structures

#### appState Object

```javascript
appState = {
    currentDate: Date,           // Currently displayed month
    selectedDate: String,         // Selected date (YYYY-MM-DD)
    categories: Array,            // [{name, type}, ...]
    expensesByDate: Object,       // {"YYYY-MM-DD": [expenses]}
    hasExpensesByDate: Object,    // {"YYYY-MM-DD": true/false}
    expenseRowCount: Number,      // Current visible rows (2-5)
    activeEntryType: String,      // "Expense"|"Income"|"Savings"|"Payoff"
    isFetchingMonth: Boolean      // Prevents duplicate fetches
}
```

#### Category Object

```javascript
{
    name: "Food",      // Category name
    type: "Expense"    // Type classification
}
```

#### Expense Object

```javascript
{
    date: "2025-12-31",          // YYYY-MM-DD
    type: "Expense",             // Entry type
    category: "Food",            // Category name
    amount: 250,                 // Number
    notes: "Lunch at restaurant", // Optional string
    timestamp: "2025-12-31 14:30:00"  // Auto-generated
}
```

---

## 6. BACKEND API

### Endpoint Configuration

**URL**: Single Apps Script Web App URL  
**Method**: POST (all requests)  
**Content-Type**: `application/json` or `text/plain;charset=utf-8`

### Request Format

All requests use same URL with different `action` parameter:

```json
{
    "action": "actionName",
    ...additional parameters
}
```

---

### API 1: Get Categories

**Purpose**: Fetch all available categories from Expense_Master

**Request**:
```json
{
    "action": "getCategories"
}
```

**Response (Success)**:
```json
{
    "success": true,
    "categories": [
        {"name": "Food", "type": "Expense"},
        {"name": "Transport", "type": "Expense"},
        {"name": "Salary", "type": "Income"}
    ]
}
```

**Response (Error)**:
```json
{
    "success": false,
    "message": "Error description"
}
```

**Frontend Usage**:
- Called on app initialization
- Populates category dropdowns
- Cached in `appState.categories`

---

### API 2: Save Expenses

**Purpose**: Save one or more expenses for a specific date

**Request**:
```json
{
    "action": "saveExpenses",
    "date": "2025-12-31",
    "expenses": [
        {
            "type": "Expense",
            "category": "Food",
            "amount": 250,
            "notes": "Lunch"
        },
        {
            "type": "Expense",
            "category": "Transport",
            "amount": 50,
            "notes": ""
        }
    ]
}
```

**Response (Success)**:
```json
{
    "success": true,
    "saved": 2,
    "date": "2025-12-31",
    "message": "2 expense(s) saved for 2025-12-31"
}
```

**Response (Error)**:
```json
{
    "success": false,
    "message": "Invalid data: amount must be positive"
}
```

**Backend Processing**:
1. Validates date format
2. Validates each expense object
3. Adds timestamp to each expense
4. Appends rows to Expense_Log sheet
5. Returns confirmation

---

### API 3: Get Expenses

**Purpose**: Retrieve all expenses for a specific date

**Request**:
```json
{
    "action": "getExpenses",
    "date": "2025-12-31"
}
```

**Response (Success)**:
```json
{
    "success": true,
    "date": "2025-12-31",
    "expenses": [
        {
            "date": "2025-12-31",
            "type": "Expense",
            "category": "Food",
            "amount": 250,
            "notes": "Lunch",
            "timestamp": "2025-12-31 14:30:00"
        }
    ]
}
```

**Response (No Data)**:
```json
{
    "success": true,
    "date": "2025-12-31",
    "expenses": []
}
```

**Frontend Usage**:
- Called when user selects a date
- Updates "Existing Expenses" tab
- Cached in `appState.expensesByDate[date]`

---

### API 4: Get Expenses by Month

**Purpose**: Fetch all expenses for an entire month (optimized for calendar indicators)

**Request**:
```json
{
    "action": "getExpensesByMonth",
    "year": 2025,
    "month": 12
}
```

**Response (Success)**:
```json
{
    "success": true,
    "year": 2025,
    "month": 12,
    "expensesByDate": {
        "2025-12-01": [expense1, expense2],
        "2025-12-15": [expense3],
        "2025-12-31": [expense4, expense5, expense6]
    }
}
```

**Response (No Data)**:
```json
{
    "success": true,
    "year": 2025,
    "month": 12,
    "expensesByDate": {}
}
```

**Frontend Usage**:
- Called when month changes in calendar
- Updates red dots on calendar dates
- Populates `appState.hasExpensesByDate`
- Deferred/background execution to avoid blocking

---

## 7. FRONTEND COMPONENTS

### Header Component

**Elements**:
- App title (h1)
- Notification button (🔔)
- Logout button (🚪)

**Behavior**:
- Notifications: Shows alert (placeholder)
- Logout: Confirms before action (placeholder)

---

### Page Navigation

**Elements**:
- 4 tab buttons: Dashboard | Calendar | Budget | Settings

**Behavior**:
- Click → Hides all pages, shows target page
- Active tab gets `.active` class (blue background)
- Default: Dashboard active on load
- Calendar page hidden by default (display: none)

**Implementation**:
```javascript
// setupPageNavigation() function
// Listens to data-page attribute
// Toggles display: block/none
```

---

### Calendar Component

**Structure**:
```
calendar-section
  ├── calendar-header (Month/Year + Nav buttons)
  └── calendar-container
      └── calendar-grid
          ├── day-header x 7 (Sun-Sat)
          └── calendar-dates (42 date cells)
```

**Date Cell States**:
- `.calendar-date` - Base class
- `.today` - Blue border + bold
- `.has-expense` - Red dot (::after pseudo-element)
- `.selected` - Gray background
- `.other-month` - Light gray text, not clickable

**Rendering Process**:
1. Clear previous dates
2. Calculate first day of month
3. Add padding from previous month
4. Add current month dates (1-31)
5. Add padding for next month
6. Total 42 cells (6 rows × 7 days)

---

### Expense Form Component

**Structure**:
```
expense-entry-panel
  ├── entry-tabs (Expense/Income/Savings/Payoff)
  └── form
      ├── expense-rows (table)
      │   └── row (Category | Amount | Notes)
      ├── add-row button
      └── action buttons (Save | Cancel)
```

**Row Management**:
- Default: 2 rows visible
- Click "Add Row": Shows up to 5 rows total
- Each row has unique index (data-row-index)
- Hidden input stores current entry type

**Validation**:
- Category: Required, must exist in categories
- Amount: Required, must be positive number
- Notes: Optional
- At least one complete row required to save

**Save Process**:
1. Gather all rows with data
2. Validate each row
3. Package as JSON
4. POST to backend
5. Show status message
6. Reset form on success
7. Reload existing expenses
8. Update calendar indicator

---

### Existing Expenses List

**Structure**:
```
expenses-list-table
  ├── thead (Type | Category | Amount | Notes)
  └── tbody (populated dynamically)
```

**Display Logic**:
- If no expenses: Show "No expenses recorded"
- Else: Render table rows
- Badge counter shows total count

---

## 8. STATE MANAGEMENT

### appState Object (Global)

**Purpose**: Single source of truth for application state

#### Properties

**currentDate** (Date object)
- Current month being viewed in calendar
- Updated by prev/next month buttons
- Default: new Date() (today)

**selectedDate** (String | null)
- Currently selected date in YYYY-MM-DD format
- Drives expense form and display
- Null when no date selected

**categories** (Array of Objects)
- All available categories from Expense_Master
- Structure: `[{name: "Food", type: "Expense"}, ...]`
- Populated on app initialization
- Used to populate dropdowns

**expensesByDate** (Object)
- Cache of fetched expenses
- Key: date string (YYYY-MM-DD)
- Value: array of expense objects
- Example: `{"2025-12-31": [exp1, exp2]}`
- Prevents redundant API calls

**hasExpensesByDate** (Object)
- Quick lookup for calendar indicators
- Key: date string
- Value: boolean (true if expenses exist)
- Example: `{"2025-12-31": true}`
- Updated when month fetched

**expenseRowCount** (Number)
- Number of currently visible expense rows (2-5)
- Starts at 2, increases with "Add Row"
- Resets to 2 on form reset

**activeEntryType** (String)
- Currently selected entry type
- Values: "Expense" | "Income" | "Savings" | "Payoff"
- Default: "Expense"
- Filters category dropdown

**isFetchingMonth** (Boolean)
- Prevents duplicate month fetch requests
- Set to true during fetch
- Reset to false after completion

---

### State Update Patterns

#### Date Selection Flow
```
User clicks calendar date
  → selectDate() updates appState.selectedDate
  → openExpenseManagement() triggered
  → fetchExpensesForDate() called
  → expensesByDate[date] cached
  → UI updates with expense data
```

#### Month Navigation Flow
```
User clicks prev/next month
  → goToPreviousMonth/NextMonth()
  → appState.currentDate updated
  → renderCalendar() called
  → fetchExpensesForMonth() triggered (deferred)
  → hasExpensesByDate updated
  → Calendar dots appear
```

#### Save Expense Flow
```
User submits form
  → saveExpenses() validates data
  → POST to backend
  → On success:
     - Status message shown
     - expensesByDate[date] invalidated
     - fetchExpensesForDate() refresh
     - hasExpensesByDate[date] = true
     - Calendar dot appears
```

---

## 9. CORE FUNCTIONS

### Initialization Functions

#### initializeApp()
**Purpose**: Bootstrap application on page load  
**Called By**: DOMContentLoaded event  
**Actions**:
1. Fetch categories from backend
2. Render calendar for current month
3. Setup event listeners
4. Log success

```javascript
function initializeApp() {
    console.log('Initializing Expense Manager...');
    fetchCategories();
    renderCalendar();
    setupEventListeners();
    console.log('App initialized successfully');
}
```

---

#### setupEventListeners()
**Purpose**: Attach all event listeners  
**Listeners**:
- Calendar navigation (prev/next month)
- Header actions (notifications, logout)
- Form buttons (save, cancel, add row)
- Entry type tabs
- Details tabs (Add/Existing)
- Budget form submit

---

#### setupPageNavigation()
**Purpose**: Handle page tab switching  
**Logic**:
- Get all `.page-nav-btn` and `.page` elements
- Listen for tab clicks
- Hide all pages, show target page
- Update active class on buttons

---

### Calendar Functions

#### renderCalendar()
**Purpose**: Render calendar grid for current month  
**Complexity**: High (180+ lines)

**Process**:
1. Get year/month from appState.currentDate
2. Update month/year display
3. Clear previous calendar dates
4. Calculate first day of month (0-6)
5. Calculate last day of month (28-31)
6. Add previous month padding dates
7. Add current month dates (with indicators)
8. Add next month padding dates
9. Append all cells to container
10. Trigger deferred fetchExpensesForMonth()

**Date Cell Creation**:
```javascript
createDateCell(day, isOtherMonth, dateString, isToday, hasExpense, isSelected)
```

---

#### fetchExpensesForMonth()
**Purpose**: Fetch all expenses for current month (background)  
**Async**: Yes  
**Deferred**: Yes (called 100ms after calendar render)

**Process**:
1. Check isFetchingMonth flag (prevent duplicates)
2. Get year/month from appState.currentDate
3. POST to backend with getExpensesByMonth action
4. Parse response
5. Update hasExpensesByDate for each date with expenses
6. Re-render calendar to show dots

**Fallback**: If backend doesn't support month fetch, falls back to individual date fetches

---

#### selectDate(dateString, dateCell)
**Purpose**: Handle user clicking a calendar date  
**Actions**:
1. Update appState.selectedDate
2. Remove previous selection highlight
3. Add selection to clicked cell
4. Open expense management panel

---

#### goToPreviousMonth() / goToNextMonth()
**Purpose**: Navigate calendar months  
**Actions**:
1. Increment/decrement appState.currentDate
2. Call renderCalendar()
3. Clear form selection

---

### Expense Management Functions

#### openExpenseManagement(dateString)
**Purpose**: Open right-side expense panel for selected date  
**Actions**:
1. Update appState.selectedDate
2. Update panel title with formatted date
3. Load existing expenses
4. Reset form for new entries
5. Switch to "Add Expenses" tab

---

#### loadExistingExpenses(dateString)
**Purpose**: Load and display expenses for a specific date  
**Async**: Yes  
**Process**:
1. Check cache (appState.expensesByDate)
2. If not cached, call fetchExpensesForDate()
3. Display in "Existing Expenses" tab table
4. Update badge counter

---

#### fetchExpensesForDate(dateString)
**Purpose**: Fetch expenses from backend for specific date  
**Async**: Yes  
**Process**:
1. POST to backend with getExpenses action
2. Parse response
3. Cache in appState.expensesByDate[date]
4. Update hasExpensesByDate
5. Call displayExistingExpenses()

---

#### displayExistingExpenses(expenses)
**Purpose**: Render expenses in table  
**Process**:
1. Clear existing table rows
2. If no expenses, show "no data" message
3. Else, create table row for each expense
4. Update badge counter

---

### Form Functions

#### createExpenseRows()
**Purpose**: Initialize expense form with empty rows  
**Actions**:
1. Clear existing rows
2. Set expenseRowCount to 2
3. Create 2 empty rows

---

#### createAndAppendExpenseRow(rowNumber)
**Purpose**: Create single expense row  
**Components**:
- Hidden type input
- Category select (populated from appState.categories)
- Amount input (type="number", min="0", step="0.01")
- Notes input (type="text")

---

#### addExpenseRow()
**Purpose**: Add one more row to form (max 5)  
**Process**:
1. Check if < 5 rows
2. Increment expenseRowCount
3. Create new row

---

#### setEntryType(type)
**Purpose**: Switch between Expense/Income/Savings/Payoff tabs  
**Actions**:
1. Update activeEntryType
2. Update tab active classes
3. Update all hidden type inputs in rows
4. Filter category dropdowns by type

---

#### updateCategoryDropdowns()
**Purpose**: Filter categories based on active entry type  
**Process**:
1. Get all category selects
2. Clear options
3. Add filtered categories matching activeEntryType
4. Add "Select Category" placeholder

---

#### resetExpenseForm()
**Purpose**: Clear all form inputs  
**Actions**:
1. Clear all select/input values
2. Hide status message
3. Reset to 2 rows

---

### Save/Fetch Functions

#### saveExpenses(event)
**Purpose**: Save form data to backend  
**Async**: Yes  
**Process**:
1. Prevent form default
2. Validate selectedDate exists
3. Gather all rows with data
4. Validate each row (category + amount required)
5. Package as JSON
6. POST to backend
7. Show success/error status
8. On success:
   - Reset form
   - Invalidate cache
   - Refresh existing expenses
   - Update calendar indicator

---

#### fetchCategories()
**Purpose**: Load categories from backend  
**Async**: Yes  
**Process**:
1. POST to backend with getCategories action
2. Parse response
3. Store in appState.categories
4. Call createExpenseRows() to populate dropdowns

---

### Utility Functions

#### formatDateToString(dateObj)
**Purpose**: Convert Date object to YYYY-MM-DD  
**Returns**: String

```javascript
"2025-12-31"
```

---

#### formatDateForDisplay(dateString)
**Purpose**: Format date for user-friendly display  
**Returns**: String

```javascript
"Tuesday, Dec 31, 2025"
```

---

#### showStatus(message, type)
**Purpose**: Display status message  
**Types**: 'success' | 'error'  
**Duration**: 3 seconds auto-hide

---

## 10. USER WORKFLOWS

### Workflow 1: First Time Setup

1. User deploys backend to Google Apps Script
2. User configures Google Sheet with Expense_Master data
3. User updates BACKEND_URL in app.js
4. User hosts frontend files
5. User opens app URL
6. Categories load automatically
7. Calendar renders with current month
8. User ready to enter expenses

---

### Workflow 2: Daily Expense Entry (Date Mode)

1. User clicks FAB (+) button or navigates to Add page
2. "Expenses" tab is active by default
3. "Date" mode is selected by default
4. Date field shows today's date
5. User selects category from dropdown
6. User enters amount
7. User optionally adds notes
8. User can click "+ Add another expense" to add more categories
9. User clicks "Save"
10. Success message appears
11. Form resets (stays on Add screen)
12. Dashboard updates in background
13. User can immediately add more expenses

---

### Workflow 2b: Recurring Expense Entry (Category Mode)

1. User clicks FAB (+) button or navigates to Add page
2. "Expenses" tab is active by default
3. User clicks "Category" mode selector
4. User selects category from dropdown (e.g., "Rent")
5. First row shows today's date
6. User enters amount for first date
7. User clicks "+ Add another date" to add same expense for different dates
8. User enters amounts for each date
9. User clicks "Save"
10. Success message shows total expenses saved
11. Form resets (stays on Add screen)
12. Dashboard updates in background

---

### Workflow 3: Viewing Past Expenses

1. User navigates to desired month (prev/next buttons)
2. User clicks date with red dot indicator
3. User switches to "Existing Expenses" tab
4. All expenses for that date displayed in table
5. User can see Type, Category, Amount, Notes

---

### Workflow 4: Budget Configuration

1. User clicks "Budget" tab in navigation
2. Budget form loads with all categories
3. User enters monthly budget for each category
4. User clicks "Save Budget"
5. Success message appears
6. Budget data saved for future comparisons

---

### Workflow 5: Month Navigation

1. User clicks "❮" previous month button
2. Calendar re-renders with previous month
3. Background fetch loads expense indicators
4. Red dots appear on dates with expenses
5. User can click any date to view/add expenses

---

## 11. TECHNICAL SPECIFICATIONS

### Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Recommended |
| Firefox | 88+ | Fully supported |
| Safari | 14+ | iOS/macOS |
| Edge | 90+ | Chromium-based |
| Opera | 76+ | Chromium-based |

**Required Features**:
- ES6+ JavaScript (const, let, arrow functions, async/await)
- CSS Grid & Flexbox
- Fetch API
- JSON parsing
- localStorage (future use)

---

### Performance Characteristics

**Load Time**:
- Initial load: < 2 seconds (on 3G)
- Calendar render: < 100ms
- Form interaction: Instant

**Data Caching**:
- Categories: Loaded once per session
- Expenses by date: Cached after first fetch
- Month indicators: Fetched on month change

**API Call Frequency**:
- Page load: 1 call (getCategories)
- Month change: 1 call (getExpensesByMonth)
- Date select: 1 call if not cached
- Save: 1 call (saveExpenses)

---

### Responsive Breakpoints

```css
/* Mobile First - Base Styles (320px+) */

/* Small Tablets (576px+) */
@media (min-width: 576px) { ... }

/* Tablets (768px+) */
@media (min-width: 768px) {
    /* Calendar switches to split layout */
}

/* Desktop (992px+) */
@media (min-width: 992px) { ... }

/* Large Desktop (1200px+) */
@media (min-width: 1200px) { ... }
```

---

### Code Metrics

**Frontend**:
- HTML: ~380 lines
- CSS: ~1800 lines
- JavaScript: ~1108 lines
- Total: ~3288 lines

**Backend**:
- Google Apps Script: ~602 lines

**Documentation**:
- README: ~250 lines
- Deployment Guide: ~520 lines
- Setup Checklist: ~280 lines
- Quick Reference: ~240 lines
- This document: ~1500+ lines

---

## 12. KNOWN LIMITATIONS

### Current Version Limitations

1. **No Data Visualization**: Dashboard charts are placeholders
2. **No Edit/Delete**: Can't modify existing expenses
3. **No Bulk Operations**: Can't delete/export multiple at once
4. **No Search/Filter**: Can't search by category/amount
5. **No Recurring Expenses**: Must enter manually each time
6. **No Multi-Currency**: Single currency only
7. **No Offline Mode**: Requires internet connection
8. **No User Authentication**: No login/security
9. **No Data Export**: Can't download as CSV/PDF
10. **No Budget Alerts**: Budget tracking not implemented
11. **No Expense Editing**: After save, can't change
12. **No Attachment Support**: Can't attach receipts
13. **No Categories Management**: Must edit Google Sheet directly
14. **No Undo/Redo**: Permanent actions

### Technical Limitations

1. **Google Apps Script Quotas**:
   - 20,000 URL Fetch calls/day
   - 6 minute execution timeout
   - 50 MB daily bandwidth

2. **Browser Storage**:
   - State lost on page refresh
   - No persistent cache (yet)

3. **Single User**:
   - No multi-user support
   - No data sync between devices

4. **Date Range**:
   - Limited to JavaScript Date() range
   - No BC dates

---

## 13. FUTURE ROADMAP

### Version 1.1 (Q1 2026) - Analytics

**Features**:
- ✨ Dashboard implementation
  - Monthly summary calculations
  - Budget vs Actual comparison
  - Category breakdown charts
- ✨ Spending trends visualization
- ✨ Export to CSV
- ✨ Search & filter expenses

**Effort**: Medium (2-3 weeks)

---

### Version 1.2 (Q2 2026) - Enhanced UX

**Features**:
- ✨ Edit existing expenses
- ✨ Delete expenses
- ✨ Bulk operations
- ✨ Keyboard shortcuts
- ✨ Dark mode toggle
- ✨ Custom categories (from UI)
- ✨ Receipt attachment (Google Drive links)

**Effort**: High (4-6 weeks)

---

### Version 2.0 (Q3 2026) - Advanced Features

**Features**:
- ✨ Recurring expenses
- ✨ Budget alerts & notifications
- ✨ Multi-currency support
- ✨ Offline mode (PWA)
- ✨ Mobile app wrapper
- ✨ Goal tracking
- ✨ Reports & insights
- ✨ Data backup/restore

**Effort**: Very High (8-12 weeks)

---

### Version 3.0 (2027) - Collaboration

**Features**:
- ✨ User authentication
- ✨ Multi-user households
- ✨ Shared budgets
- ✨ Expense splitting
- ✨ Real-time sync
- ✨ Permissions management
- ✨ Audit logs

**Effort**: Extensive (6+ months, requires backend rewrite)

---

## APPENDIX A: Configuration Reference

### Backend Configuration (Code.gs)

```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';

const SHEET_NAMES = {
    EXPENSE_LOG: 'Expense_Log',
    EXPENSE_MASTER: 'Expense_Master'
};
```

### Frontend Configuration (app.js)

```javascript
const CONFIG = {
    BACKEND_URL: 'YOUR_APPS_SCRIPT_URL',
    MONTH_NAMES: [...],
    EXPENSE_ROWS: 5,
    DATE_FORMAT: 'YYYY-MM-DD'
};
```

---

## APPENDIX B: Google Sheet Setup

### Expense_Master Sheet Structure

| A (Category) | B (Type) |
|-------------|----------|
| Food | Expense |
| Transport | Expense |
| Utilities | Expense |
| Salary | Income |
| Bonus | Income |
| Emergency Fund | Savings |
| Investment | Savings |
| Credit Card | Payoff |
| Loan | Payoff |

**Requirements**:
- Header row must be: Category | Type
- No empty rows
- Unique category names
- Type must be one of: Expense, Income, Savings, Payoff

---

### Expense_Log Sheet Structure

| A (Date) | B (Type) | C (Category) | D (Amount) | E (Notes) | F (Timestamp) |
|----------|----------|-------------|-----------|-----------|---------------|
| 2025-12-31 | Expense | Food | 250 | Lunch | 2025-12-31 14:30:00 |
| 2025-12-31 | Income | Salary | 50000 | Monthly | 2025-12-31 09:00:00 |

**Requirements**:
- Header row must match exactly
- Date format: YYYY-MM-DD
- Amount: Numbers only (no currency symbols)
- Timestamp: Auto-generated by backend

---

## APPENDIX C: Deployment Checklist

### Backend Deployment

- [ ] Create Google Sheet with 2 sheets
- [ ] Add categories to Expense_Master
- [ ] Copy SHEET_ID
- [ ] Open Apps Script editor
- [ ] Paste Code.gs content
- [ ] Update SHEET_ID constant
- [ ] Save project
- [ ] Deploy as Web App
- [ ] Set "Execute as: Me"
- [ ] Set "Who has access: Anyone"
- [ ] Copy deployment URL

### Frontend Deployment

- [ ] Download frontend files
- [ ] Open app.js
- [ ] Update BACKEND_URL with deployment URL
- [ ] Save file
- [ ] Upload to hosting (Firebase/GitHub Pages/etc)
- [ ] Test deployed URL
- [ ] Bookmark for daily use

---

## APPENDIX D: Troubleshooting Guide

### Categories Not Loading

**Symptoms**: Empty dropdown, console errors  
**Causes**:
- Backend URL incorrect
- Expense_Master sheet missing/renamed
- CORS issues (local testing)

**Solutions**:
1. Check BACKEND_URL in app.js
2. Verify Expense_Master sheet exists
3. Check browser console for errors
4. Test backend URL directly in browser

---

### Expenses Not Saving

**Symptoms**: Save button does nothing, error message  
**Causes**:
- Backend URL incorrect
- Date not selected
- Invalid data (negative amount, empty category)
- Apps Script execution error

**Solutions**:
1. Check browser console for errors
2. Verify date is selected
3. Check Apps Script execution logs
4. Test with simple expense first

---

### Calendar Dots Not Appearing

**Symptoms**: Expenses saved but no red dots  
**Causes**:
- getExpensesByMonth not implemented
- Month fetch failing
- Date format mismatch

**Solutions**:
1. Check console for month fetch errors
2. Verify date format in sheet (YYYY-MM-DD)
3. Navigate away and back to month
4. Refresh page

---

## APPENDIX E: API Request Examples

### Using cURL

```bash
# Get Categories
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getCategories"}'

# Save Expenses
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"saveExpenses",
    "date":"2025-12-31",
    "expenses":[
      {"type":"Expense","category":"Food","amount":250,"notes":"Lunch"}
    ]
  }'

# Get Expenses for Date
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getExpenses","date":"2025-12-31"}'

# Get Expenses for Month
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getExpensesByMonth","year":2025,"month":12}'
```

---

## DOCUMENT VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-31 | Initial comprehensive documentation |

---

## MAINTENANCE NOTES

This document should be updated when:
- New features are added
- API changes occur
- New pages are implemented
- User workflows change
- Bug fixes affect documented behavior

**Last Reviewed**: Dec 31, 2025  
**Next Review**: When v1.1 features are implemented

---

**End of Documentation**
