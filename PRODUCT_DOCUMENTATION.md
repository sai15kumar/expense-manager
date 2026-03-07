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

- **Dashboard-First Design**: Monthly/yearly summary and transaction feed are the primary entry points
- **Google Sign-In Required**: Access is restricted to an allowlisted set of users via Google Identity Services
- **Cloud Storage**: Data stored securely in your personal Google Sheet
- **Mobile-First**: Optimized UI for smartphone use
- **Zero Dependencies**: Pure HTML/CSS/JavaScript - no frameworks
- **Free & Open Source**: Complete data ownership and full transparency

### Target Users

- Individuals tracking personal finances
- Small household expense monitoring
- Users wanting simple, fast expense entry
- People who want quick entry and summary views without complex setup
- Those seeking Google Sheets integration

---

## 2. ARCHITECTURE

### High-Level Architecture

The application is a serverless web app. The frontend runs entirely in the user's browser and communicates with a Google Apps Script backend via JSON POST requests. Authentication is handled via Google Identity Services and request access is restricted by an allowlist in the backend.

```
┌──────────────────────┐
│  User Browser (UI)   │
│  • Google Sign-In    │
│  • Dashboard + Forms │
└──────────┬───────────┘
           │ HTTPS JSON
           ▼
┌──────────────────────┐
│ Google Apps Script   │
│  (Code.gs)           │
│  • Auth & allowlist  │
│  • API router        │
│  • Sheets I/O        │
└──────────┬───────────┘
           │ Sheets API
           ▼
┌──────────────────────┐
│ Google Sheets        │
│  • Expense_Log       │
│  • Expense_Master    │
└──────────────────────┘
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
├── index.html                  # Main app UI + page layout
├── css/
│   └── styles.css              # Mobile-first styling and responsive layout
├── js/
│   ├── app.js                  # Core UI logic, state, API integration
│   └── auth.js                 # Google Sign-In and session management
├── backend/
│   └── Code.gs                 # Google Apps Script backend API
├── README.md                   # Project overview and quick start
├── DEPLOYMENT_GUIDE.md         # Setup & deployment instructions
├── SETUP_CHECKLIST.md          # Setup checklist
├── QUICK_REFERENCE.md          # Quick reference guide
├── PRODUCT_DOCUMENTATION.md    # This file
```

### Code Organization

#### index.html Structure
- **Auth Gate**: Google Sign-In prompt (shown until authentication succeeds)
- **Header**: App title, notifications, logout
- **Navigation Rail**: Dashboard, Budget, Settings
- **Floating Action Button (FAB)**: Quick access to Add entry screen
- **Main Content**: Four page containers (Dashboard, Add, Budget, Settings)

#### app.js Structure (≈3000 lines)
1. **Configuration**: Constants, backend URL, UI defaults
2. **State Management**: `appState` holds categories, budgets, selections, and UI mode state
3. **Auth Integration**: Token handling and API auth checks
4. **Home / Dashboard**: Monthly/yearly summary rendering, filtering, and transaction list
5. **Add Screen**: Dual entry modes (By Date / By Category), row management, save logic
6. **Budget Page**: Budget table rendering, input handling, and save flow
7. **Settings & Helpers**: Logout, toast notifications, UI helpers
8. **API Integration**: `callAppsScript` wrapper + response handling

#### auth.js Structure
- **Google Identity Services Integration** (sign-in button, token handling)
- **Session Storage** (ID token, email, name)
- **UI Gate**: Show/hide app content based on auth state
- **Logout & Token Revocation**

#### Code.gs Structure (≈960 lines)
1. **Configuration**: Sheet IDs, allowlist, column constants
2. **Auth Helpers**: Validate incoming user email against allowlist
3. **Main handler**: `doPost` router for actions
4. **Core actions**:
   - `getCategories` (fetch categories + budget fields)
   - `saveExpenses` (append transactions)
   - `getExpenses` (by date)
   - `getExpensesByMonth` (batch fetch by month)
   - `getMonthlyBudget` (aggregate by type)
   - `saveBudget` (update budget fields)
5. **Utility helpers**: Date formatting, sheet helpers, validation

---

## 4. PAGES & FEATURES

### Page 1: Dashboard (📊)

**Purpose**: Provide an at-a-glance financial summary and quick access to transactions.

**Key Components**:
- **Month + Year Selector**: Switch between months or jump to a year
- **Period Toggle**: Monthly / Yearly views
- **Summary Cards**: Total Expenses, Income, Savings, Payoffs
- **Filter by Type**: Tap a card to filter transaction list
- **View Toggle**: Switch between Summary and Transaction list
- **Transaction List**: Detailed list of transactions for the selected period
- **Floating Action Button (FAB)**: Open add screen to log new transactions

**Current Status**:
- ✅ Fully implemented
- ✅ Data loaded from backend
- ✅ Filters and view toggles work
- ✅ Monthly/yearly budget aggregation

---

### Page 2: Add Transaction (➕)

**Purpose**: Quickly add new expenses/transfers using flexible entry modes.

**Modes**:
- **Expenses (default)**: Add multiple expenses in one go.
- **Monthly**: Add recurring/monthly transactions (Income, Savings, Payoff).

#### Expenses Mode

**Sub-modes**:
- **By Date**: Add multiple categories for the same date
- **By Category**: Add the same category across multiple dates

**Key Features**:
- Dynamic row addition (up to 5 active rows per session)
- Validation on required fields (date/category/amount)
- Save button becomes active only when valid data exists
- Success toast and automatic refresh of dashboard data

#### Monthly Mode

**Purpose**: Add a batch of monthly transactions in a single save.

**Key Features**:
- Month picker (for selecting the target month)
- Sections for Income, Savings, Payoff
- Collapsible sections for cleaner UX
- Adds multiple rows per section
- Save persists all data in a single API call

---

### Page 3: Budget Configuration (💰)

**Purpose**: Configure budget targets per category.

**Key Components**:
- Budget table grouped by type (Income / Expense / Savings / Payoff)
- Monthly budget input per category
- Auto-calculated yearly budget (monthly × 12)
- Total budgets shown on section headers

**Behavior**:
- Loads categories from backend (Expense_Master)
- Inputs persist on save via backend `saveBudget` API
- Budget values are used to generate the monthly summary totals

**Current Status**:
- ✅ Fully implemented
- ✅ Categories and budgets load correctly
- ✅ Budget save works (updates Expense_Master)

---

### Page 4: Settings (⚙️)

**Purpose**: Application settings and information.

**Sections**:
1. **Data Management**
   - Export data (placeholder)
   - Clear all data (placeholder)
2. **About**
   - App version and last updated
   - Links to documentation

**Current Status**:
- ✅ UI implemented
- 🔴 Export/clear features are placeholders

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
    id: "txn_171000234234_kd2",   // Unique transaction ID
    date: "2025-12-31",          // YYYY-MM-DD
    type: "Expense",             // Entry type
    category: "Food",            // Category name
    amount: 250,                 // Number
    notes: "Lunch at restaurant", // Optional string
    timestamp: "2025-12-31 14:30:00",  // Auto-generated
    status: "ACTIVE"             // ACTIVE or DELETED
}
```

---

## 6. BACKEND API

### Endpoint Configuration

**URL**: Single Google Apps Script Web App URL (configured in `js/app.js`)
**Method**: POST (all requests)
**Content-Type**: `application/json`

> 📌 **Authentication**: All requests must include a valid signed-in Google user email. The frontend automatically adds `userEmail` (from the ID token) to each request.
>
> ✅ **Important:** Requests are sent without custom headers to avoid CORS preflight. The backend validates access using the provided `userEmail` and the allowlist in `Code.gs`.

### Request Format

All requests use the same URL and are differentiated by an `action` parameter:

```json
{
  "action": "getCategories",
  "userEmail": "user@example.com",
  ...additional parameters depending on action
}
```

### Common Error Response (Unauthorized)

```json
{
  "success": false,
  "error": "UNAUTHORIZED"
}
```

---

### API: getCategories

**Purpose**: Fetch all categories (including budget targets) from `Expense_Master`.

**Request**:
```json
{
  "action": "getCategories",
  "userEmail": "user@example.com"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "categories": [
    {"name": "Food", "type": "Expense", "budget": 5000},
    {"name": "Salary", "type": "Income", "budget": 0}
  ]
}
```

**Frontend Usage**:
- Called during initialization
- Populates dropdowns and budget tables

---

### API: saveExpenses

**Purpose**: Save one or more expenses for a given date.

**Request**:
```json
{
  "action": "saveExpenses",
  "userEmail": "user@example.com",
  "date": "2025-12-31",
  "expenses": [
    {"type": "Expense", "category": "Food", "amount": 250, "notes": "Lunch"},
    {"type": "Expense", "category": "Transport", "amount": 50, "notes": ""}
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

---

### API: getExpenses

**Purpose**: Retrieve all expenses for a specific date.

**Request**:
```json
{
  "action": "getExpenses",
  "userEmail": "user@example.com",
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

---

### API: getExpensesByMonth

**Purpose**: Fetch all expenses for a month (grouped by date).

**Request**:
```json
{
  "action": "getExpensesByMonth",
  "userEmail": "user@example.com",
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
    "2025-12-01": [/* expenses */],
    "2025-12-15": [/* expenses */]
  }
}
```

---

### API: getMonthlyBudget

**Purpose**: Aggregate monthly budgets by type (Expense/Income/Savings/Payoff).

**Request**:
```json
{
  "action": "getMonthlyBudget",
  "userEmail": "user@example.com",
  "year": 2025,
  "month": 12
}
```

**Response (Success)**:
```json
{
  "success": true,
  "budget": {
    "expense": 50000,
    "income": 120000,
    "savings": 20000,
    "payoff": 15000
  }
}
```

---

### API: saveBudget

**Purpose**: Update monthly & yearly budget values for categories in `Expense_Master`.

**Request**:
```json
{
  "action": "saveBudget",
  "userEmail": "user@example.com",
  "budgets": [
    {"category": "Food", "type": "Expense", "monthlyBudget": 5000, "yearlyBudget": 60000},
    {"category": "Salary", "type": "Income", "monthlyBudget": 50000, "yearlyBudget": 600000}
  ]
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Saved 2 budgets",
  "count": 2
}
```

---

### API: deleteExpense

**Purpose**: Soft-delete an expense by setting its Status to `DELETED` (it will no longer appear in queries).

**Request**:
```json
{
  "action": "deleteExpense",
  "userEmail": "user@example.com",
  "id": "txn_171000234234_kd2"
}
```

**Response (Success)**:
```json
{
  "success": true
}
```

## 7. FRONTEND COMPONENTS

### Authentication Gate

Before the app loads, users must sign in with Google:
- Sign-in is handled by **Google Identity Services** (GSI)
- The UI shows an auth gate until a valid ID token is available
- Upon successful sign-in, the app fetches categories and initializes the dashboard

### Header

**Elements**:
- Application title (Expense Manager)
- Notification button (placeholder)
- Logout button

**Behavior**:
- **Logout** clears session storage and hides the app UI
- **Notifications** are currently placeholders (can be extended)

---

### Navigation Rail

**Elements**:
- Dashboard
- Budget
- Settings

**Behavior**:
- Click switches the visible page
- Active item gets `.active` class for highlight
- The floating action button (FAB) opens the Add screen regardless of current page

---

### Dashboard (Home) Components

**Summary Cards**:
- Expense / Income / Savings / Payoff cards
- Tap a card to filter the transaction list

**Period Controls**:
- Month picker + year input
- Toggle between monthly and yearly views

**Transaction List**:
- Shows a list of transactions for the selected period
- Supports filtering by type (via summary cards)

---

### Add Transaction Screen

**Tab Structure**:
- **Expenses**: Default tab for logging expense transactions
- **Monthly**: For recording recurring transactions (income/savings/payoff)

**Expenses Tab**:
- **Mode toggle**: By Date or By Category
- Dynamic rows with category, amount, and notes
- Save button enables when valid rows exist

**Monthly Tab**:
- Month picker
- Collapsible sections for Income, Savings, Payoff
- Each section contains dynamic rows (category + amount)
- Save persists all entered rows in one operation

---

### Budget Page

**Purpose**: Configure monthly & yearly budgets per category.

**Components**:
- Table per type (Income, Expense, Savings, Payoff)
- Monthly budget input (number)
- Auto-calculated yearly budget (monthly × 12)
- Summary totals displayed in section headers

**Behavior**:
- Loads categories/budgets from backend
- Saves user-entered budgets via API
- Updates dashboard summary totals after saving

---

### Settings Page

**Sections**:
- Data management (export/clear placeholders)
- About & version info

**Behavior**:
- Logout is available via header button
- Link placeholders for privacy and terms


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

### Primary State Stores

The app uses two primary state objects:

#### `appState`
Stored globally in `js/app.js`, `appState` holds data used across the entire application.

- `categories` – Loaded from backend (`getCategories`); each item includes `name`, `type`, and `budget`
- `categoryBudgets` – Mapping for quick budget lookup: `{ "Food|Expense": 5000 }`
- `homeSelectedMonth` – `{ year: 2026, month: 3 }` (1–12)
- `homeSelectedYear` – Current year used in yearly view
- `homeExpensesByDate` – Expenses grouped by date in the current period
- `homeSelectedType` – Filter selection: `"all"|"expense"|"income"|"savings"|"payoff"`
- `homeViewMode` – UI mode: `"summary"` or `"transactions"`
- `homeViewPeriod` – Time window: `"month"` or `"year"`
- `expandedCategories` – Set of category keys expanded in summary view
- `monthlyBudget` – Aggregated budget totals by type (expense/income/savings/payoff)

#### `addScreenState`
Controls state for the Add screen:

- `currentTab` – `"expenses"` or `"monthly"`
- `expenseMode` – `"byDate"` or `"byCategory"`
- `expenseRows` / `expenseRowsByCategory` – Arrays of row metadata
- `monthlyRows` – Grouped by type (income, savings, payoff)

---

### State Update Patterns

#### Dashboard Refresh
- User changes month/year or toggles period
- `loadHomeData()` fetches budgets and expenses
- Summary cards and transaction list are re-rendered

#### Transaction Filtering
- Tapping a summary card updates `homeSelectedType`
- Transaction list is re-rendered with the selected type filter

#### Add Screen Saves
- When transactions are saved, the app reloads dashboard data via `loadHomeData()`
- This keeps dashboard totals and transaction lists in sync

---

## 9. CORE FUNCTIONS

### Application Initialization

#### `initializeAppAfterAuth()`
**Purpose**: Initialize the app only after authentication is confirmed.

**Process**:
1. Validates that an ID token exists in session storage
2. Calls `initializeHomePage()` and `initializeAddScreen()`
3. Sets up navigation (page switching and FAB)
4. Fetches categories (including budgets) from backend

#### `initializeHomePage()`
**Purpose**: Setup the dashboard view.

**Actions**:
- Initialize month/year pickers and navigation buttons
- Set up summary card filters and view toggles
- Load initial monthly data (`loadHomeData()`)

#### `initializeAddScreen()`
**Purpose**: Setup the Add Transaction screen.

**Actions**:
- Setup tab navigation (Expenses / Monthly)
- Setup expense mode selector (By Date / By Category)
- Attach listeners to add-row buttons and save buttons
- Reset form state when opening

---

### Dashboard / Home Functions

#### `loadHomeData()`
**Purpose**: Load dashboard data for the selected period.

**Behaviour**:
- Shows loading overlay
- For monthly view:
  - Fetches monthly budget (`getMonthlyBudget`)
  - Fetches expenses by month (`getExpensesByMonth`)
  - Calculates summary totals and updates UI
- For yearly view:
  - Fetches all months for the year
  - Aggregates totals and renders yearly summary

#### `fetchHomeExpensesForMonth(year, month)`
**Purpose**: Load all expenses for a given month (grouped by date).

**Details**:
- Calls backend `getExpensesByMonth`
- Stores results in `appState.homeExpensesByDate`

#### `renderHomeTransactionList()`
**Purpose**: Render the transaction list based on state and filters.

**Behaviour**:
- Uses `homeSelectedType` and `homeViewMode` to determine list contents
- Renders either a compact summary view or detailed transaction list

---

### Add Screen Functions

#### `saveExpenses()`
**Purpose**: Save entered expenses (either by date or by category).

**Flow**:
- Validates the current mode (`byDate` or `byCategory`)
- Collects valid rows and constructs one or more API payloads
- Calls backend `saveExpenses` for each affected date
- On success, resets the form and reloads dashboard data

#### `resetAddScreen()`
**Purpose**: Clear form inputs and reset internal state for the Add screen.

---

### Budget Page Functions

#### `initBudgetPage()`
**Purpose**: Initialize budget UI for the Budget page.

**Flow**:
- Ensures categories are loaded
- Builds budget table rows grouped by type
- Loads existing budget values into inputs
- Attaches form submit handler

#### `handleBudgetSubmit()`
**Purpose**: Save budget values to the backend.

**Flow**:
- Collects budget values from inputs
- Sends to backend `saveBudget`
- On success, reloads categories and updates UI

---

### API Utilities

#### `callAppsScript(payload)`
**Purpose**: Send a JSON request to the backend API.

**Behavior**:
- Adds `userEmail` from session storage (if available)
- Sends POST request with JSON body
- Returns parsed JSON response
- Avoids CORS preflight by omitting custom headers

#### `checkApiAuthorization(result)`
**Purpose**: Detect and handle unauthorized API responses.

**Behavior**:
- Checks for `result.error === 'UNAUTHORIZED'`
- Triggers auth logout and user notification if unauthorized

---

### Formatting & UI Helpers

#### `formatDateToString(dateObj)`
**Purpose**: Convert a Date object to `YYYY-MM-DD` string.

#### `formatDateForDisplay(dateString)`
**Purpose**: Convert a `YYYY-MM-DD` string into a user-friendly format (e.g., “Tue, Mar 03, 2026”).

#### `showToast(message, type)`
**Purpose**: Display a temporary toast message.

**Types**: `success`, `error`

---

### Category Helpers

#### `getCategoryIcon(category, type)`
**Purpose**: Return a small emoji icon based on category/type.

---

## 10. USER WORKFLOWS

### Workflow 1: First Time Setup

1. Configure your Google Sheet with two tabs: `Expense_Master` and `Expense_Log` (see schema in section 5)
2. Copy the Google Sheet ID and update `SHEET_ID` in `backend/Code.gs`
3. Deploy the Apps Script project as a Web App (execute as: Me, access: Anyone)
4. Copy the deployment URL and set `CONFIG.BACKEND_URL` in `js/app.js`
5. Deploy the frontend files to a static host (GitHub Pages, Firebase, etc.)
6. Open the app URL and sign in with an authorized Google account
7. The app loads categories and shows the dashboard

---

### Workflow 2: Logging Expenses (By Date)

1. Click the **+ (FAB)** button or navigate to the **Add** screen
2. Confirm the **Expenses** tab is selected
3. Ensure **Date** mode is selected
4. Pick a date and fill in category, amount, and optional notes
5. Add extra rows as needed
6. Click **Save**
7. A success toast appears and the dashboard refreshes

---

### Workflow 3: Logging Multiple Dates for One Category (By Category)

1. Open the **Add** screen and select **Expenses**
2. Switch to **Category** mode
3. Pick a category and fill in date/amount/notes rows
4. Click **Save**
5. The app saves entries for each date, then refreshes the dashboard

---

### Workflow 4: Budget Configuration

1. Navigate to the **Budget** page
2. Enter monthly budget amounts for each category
3. Optionally review the auto-calculated yearly totals
4. Click **Save Budget**
5. The app saves values to the sheet and updates the dashboard totals

---

### Workflow 5: Signing Out

1. Click the **Logout** button in the header
2. The session is cleared and the auth gate is shown
3. (Optional) Re-sign in with another authorized account

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
- Dashboard render: < 100ms
- Form interaction: Instant

**Data Caching**:
- Categories: Loaded once per session
- Expenses by date: Cached after first fetch
- Month indicators: Fetched on month change

**API Call Frequency**:
- Page load: 2–3 calls (getCategories + getMonthlyBudget + getExpensesByMonth)
- Month/year change: 2 calls (getMonthlyBudget + getExpensesByMonth)
- Save expense: 1 call (saveExpenses)
- Save budget: 1 call (saveBudget)

---

### Responsive Breakpoints

```css
/* Mobile First - Base Styles (320px+) */

/* Small Tablets (576px+) */
@media (min-width: 576px) { ... }

/* Tablets (768px+) */
@media (min-width: 768px) {
    /* Layout adjustments for wider screens */
}

/* Desktop (992px+) */
@media (min-width: 992px) { ... }

/* Large Desktop (1200px+) */
@media (min-width: 1200px) { ... }
```

---

### Code Metrics

**Frontend**:
- HTML: ~620 lines
- CSS: ~3300 lines
- JavaScript: ~2770 lines
- Total: ~6690 lines

**Backend**:
- Google Apps Script: ~925 lines

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
8. **No per-user data isolation**: App uses allowlist-based Google Sign-In (secure), but all users share the same data sheet.
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

| A (ID) | B (Date) | C (Type) | D (Category) | E (Amount) | F (Notes) | G (Timestamp) | H (Status) |
|--------|----------|----------|-------------|-----------|-----------|---------------|------------|
| txn_171000234234_kd2 | 2025-12-31 | Expense | Food | 250 | Lunch | 2025-12-31 14:30:00 | ACTIVE |
| txn_171000234235_abc | 2025-12-31 | Income | Salary | 50000 | Monthly | 2025-12-31 09:00:00 | ACTIVE |

**Requirements**:
- Header row must match exactly (ID first, Status last)
- Date format: YYYY-MM-DD
- Amount: Numbers only (no currency symbols)
- Timestamp: Auto-generated by backend
- Status can be `ACTIVE` or `DELETED` (blank is treated as ACTIVE)

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

### Dashboard Data Not Updating

**Symptoms**: Dashboard totals do not update after saving expenses or budgets.

**Causes**:
- API call failed (network or authorization)
- Backend returned an error
- Data format mismatch in the sheet

**Solutions**:
1. Open browser console and check for API errors
2. Ensure the signed-in email is allowlisted in the backend (`ALLOWED_USERS`)
3. Verify date format in the sheet is `YYYY-MM-DD`
4. Refresh the page after making sheet changes

---

## APPENDIX E: API Request Examples

### Using cURL

```bash
# Get Categories
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getCategories","userEmail":"you@example.com"}'

# Save Expenses
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"saveExpenses",
    "userEmail":"you@example.com",
    "date":"2025-12-31",
    "expenses":[
      {"type":"Expense","category":"Food","amount":250,"notes":"Lunch"}
    ]
  }'

# Get Expenses for Date
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getExpenses","userEmail":"you@example.com","date":"2025-12-31"}'

# Get Expenses for Month
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getExpensesByMonth","userEmail":"you@example.com","year":2025,"month":12}'

# Get Monthly Budget
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"getMonthlyBudget","userEmail":"you@example.com","year":2025,"month":12}'

# Save Budget
curl -X POST "YOUR_DEPLOYMENT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"saveBudget",
    "userEmail":"you@example.com",
    "budgets":[
      {"category":"Food","type":"Expense","monthlyBudget":5000,"yearlyBudget":60000}
    ]
  }'
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
