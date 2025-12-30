# EXPENSE MANAGER - DEPLOYMENT & INTEGRATION GUIDE

## Project Overview

**Expense Manager** is a mobile-first personal expense tracking web application that uses:
- **Frontend**: HTML, CSS (mobile-first), Vanilla JavaScript
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Deployment**: Firebase Hosting (recommended) or any static web host

---

## Folder Structure

```
Expense Manager/
├── index.html              # Main app UI
├── css/
│   └── styles.css          # Mobile-first responsive styles
├── js/
│   └── app.js              # Vanilla JavaScript app logic
├── backend/
│   └── Code.gs             # Google Apps Script backend
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## PART 1: Google Sheets Setup

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ New"** → **"Blank spreadsheet"**
3. Name it **"Expense Manager Data"**
4. Copy the Sheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Save the `SHEET_ID` value

### Step 2: Create Sheet Tabs

Create two sheets/tabs in your spreadsheet (use the "+" icon at bottom):

#### Sheet 1: `Expense_Log` (for storing expenses)

**Headers (Row 1):**
| Date | Category | Amount | Notes | Timestamp |
|------|----------|--------|-------|-----------|

**Format:**
- Date: YYYY-MM-DD format
- Category: Text
- Amount: Number (2 decimal places)
- Notes: Text
- Timestamp: Auto-populate when saving

#### Sheet 2: `Expense_Master` (for category definitions)

**Headers (Row 1):**
| Category | Type |
|----------|------|

**Sample Data:**
```
Food         | Essential
Transport    | Essential
Entertainment| Discretionary
Shopping     | Discretionary
Utilities    | Essential
Healthcare   | Essential
Personal     | Discretionary
Gifts        | Discretionary
```

### Step 3: Set Column Formats (Optional but Recommended)

For `Expense_Log`:
- Select column A (Date) → Format as `YYYY-MM-DD`
- Select column C (Amount) → Format as Currency (₹)

---

## PART 2: Google Apps Script Setup

### Step 1: Create Apps Script Project

1. In your Google Sheet, go to **Tools** → **Script Editor**
2. Delete any existing code and replace with content from `backend/Code.gs`
3. At the top, update the `SHEET_ID` constant:
   ```javascript
   const SHEET_ID = 'YOUR_ACTUAL_SHEET_ID_HERE';
   ```

### Step 2: Initialize Sheet Structure (Optional)

If you haven't created the sheets manually:
1. In the Script Editor, paste the code
2. Select the `createDefaultSheets` function
3. Click **▶ Run**
4. Authorize the script when prompted
5. This creates the two sheets automatically with headers

### Step 3: Test the Backend

1. Select the `testBackend` function
2. Click **▶ Run**
3. Check the logs (**View** → **Execution Log**) for any errors
4. If no errors, backend is ready!

### Step 4: Deploy as Web App

1. In Script Editor, click **Deploy** (top-right) → **New Deployment**
2. Select:
   - **Type**: Web App
   - **Execute as**: Your Google Account email
   - **Who has access**: Anyone
3. Click **Deploy**
4. Copy the deployment URL (looks like: `https://script.google.com/macros/d/DEPLOYMENT_ID/usercopy?v=1`)
5. Save this URL - you'll need it next

---

## PART 3: Frontend Setup & Configuration

### Step 1: Update Backend URL

Edit `js/app.js` line ~13:

**Before:**
```javascript
const CONFIG = {
    BACKEND_URL: 'https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercopy?v=1',
    ...
};
```

**After:**
```javascript
const CONFIG = {
    BACKEND_URL: 'https://script.google.com/macros/d/YOUR_ACTUAL_DEPLOYMENT_ID/usercopy?v=1',
    ...
};
```

Replace `YOUR_ACTUAL_DEPLOYMENT_ID` with the ID from your deployed Apps Script URL.

### Step 2: Test Locally (Optional)

To test the frontend before deploying:
1. Open `index.html` in a browser (double-click the file)
2. Browser console might show CORS errors - this is expected during local testing
3. Once deployed to a web server, CORS issues will be resolved

---

## PART 4: Frontend Deployment

### Option A: Firebase Hosting (Recommended)

**Prerequisites:** Google account, npm installed

**Steps:**

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase in your project:**
   ```bash
   firebase login
   firebase init hosting
   ```
   - Choose: Create a new Firebase project (or select existing)
   - Public directory: `.` (current folder)
   - Single-page app: No
   - Overwrite: No

3. **Deploy:**
   ```bash
   firebase deploy
   ```
   - Your app gets a URL: `https://YOUR_PROJECT.web.app`

4. **Access your app:**
   - Open the Firebase hosting URL in your browser

### Option B: GitHub Pages

**Prerequisites:** GitHub account, git installed

**Steps:**

1. **Create a GitHub repository:**
   - Go to [github.com/new](https://github.com/new)
   - Name: `expense-manager`
   - Make it Public
   - Click "Create repository"

2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Expense Manager app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/expense-manager.git
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Branch: main, folder: / (root)
   - Click Save

4. **Access your app:**
   - URL: `https://YOUR_USERNAME.github.io/expense-manager/`

### Option C: Other Static Hosting

Any of these alternatives work:
- **Netlify**: Drag-and-drop deploy
- **Vercel**: Deploy from GitHub
- **AWS S3 + CloudFront**
- **Heroku** (supports static content)
- **Traditional Hosting**: Upload files via FTP

---

## PART 5: How Frontend Connects to Backend

### Architecture Flow

```
┌─────────────────┐
│   Mobile Phone  │
│   (Browser)     │
└────────┬────────┘
         │
    1. User selects date
    2. Clicks "Save Expenses"
         │
         ↓
┌─────────────────────────────────┐
│   Frontend (js/app.js)          │
│                                 │
│  - Builds JSON payload          │
│  - Makes POST request           │
│  - Handles response             │
└────────┬────────────────────────┘
         │
    POST JSON via HTTPS
         │
         ↓
┌─────────────────────────────────┐
│   Google Apps Script            │
│   (backend/Code.gs)             │
│                                 │
│  - Validates data               │
│  - Parses JSON                  │
│  - Routes to handlers           │
│  - Executes business logic      │
└────────┬────────────────────────┘
         │
    Direct API calls
         │
         ↓
┌─────────────────────────────────┐
│   Google Sheets                 │
│   (Expense Manager Data)        │
│                                 │
│  - Expense_Log                  │
│  - Expense_Master               │
└─────────────────────────────────┘
```

### API Endpoints Overview

All requests are POST to the same URL with different `action` parameters:

#### 1. Get Categories

**Request:**
```json
{
  "action": "getCategories"
}
```

**Response:**
```json
{
  "success": true,
  "categories": ["Food", "Transport", "Entertainment", ...]
}
```

**Frontend usage:**
```javascript
await fetch(CONFIG.BACKEND_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'getCategories' })
});
```

#### 2. Save Expenses

**Request:**
```json
{
  "action": "saveExpenses",
  "date": "2025-12-30",
  "expenses": [
    { "category": "Food", "amount": 250, "notes": "Lunch" },
    { "category": "Transport", "amount": 100, "notes": "" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Saved 2 expense(s)",
  "rowsAdded": 2
}
```

#### 3. Get Expenses for Date

**Request:**
```json
{
  "action": "getExpenses",
  "date": "2025-12-30"
}
```

**Response:**
```json
{
  "success": true,
  "date": "2025-12-30",
  "expenses": [
    { "category": "Food", "amount": 250, "notes": "Lunch", "timestamp": "..." },
    { "category": "Transport", "amount": 100, "notes": "", "timestamp": "..." }
  ],
  "count": 2
}
```

#### 4. Get Expenses for Month

**Request:**
```json
{
  "action": "getExpensesByMonth",
  "year": 2025,
  "month": 12
}
```

**Response:**
```json
{
  "success": true,
  "year": 2025,
  "month": 12,
  "expensesByDate": {
    "2025-12-01": [...],
    "2025-12-15": [...],
    "2025-12-30": [...]
  }
}
```

---

## PART 6: Key Features Explained

### 1. Calendar-First UI
- Monthly calendar grid with day headers
- Click any date to enter expenses for that day
- Red dots appear on dates with recorded expenses
- Previous/Next month navigation

### 2. Expense Entry Form
- Shows selected date clearly
- 5 rows for expenses (configurable in `CONFIG.EXPENSE_ROWS`)
- Category dropdown (auto-populated from Google Sheets)
- Amount input with validation
- Optional notes field for each expense

### 3. Mobile-First Design
- Optimized for screens 320px to 1920px wide
- Touch-friendly buttons (44x44px minimum)
- Swipe-up animations for forms
- Responsive grid layouts

### 4. Data Security
- Direct connection between frontend and Google Apps Script
- No intermediate servers
- Google Sheets provides built-in data backup
- All data encrypted in transit (HTTPS)

---

## PART 7: Customization Guide

### Add More Expense Categories

**In Google Sheets:**
1. Open your Expense_Master sheet
2. Add new rows with Category and Type
3. Save - frontend automatically fetches on next load

**Example:**
```
Shopping     | Discretionary
Books        | Discretionary
Fitness      | Health
```

### Change Color Scheme

Edit `css/styles.css`:
```css
/* Main brand color */
#667eea  →  Your primary color
#764ba2  →  Your secondary color
#51cf66  →  Your accent color
```

### Modify Expense Row Count

Edit `js/app.js` line ~12:
```javascript
CONFIG.EXPENSE_ROWS: 5  →  CONFIG.EXPENSE_ROWS: 10  // For 10 rows
```

### Change Currency Symbol

Edit `js/app.js` search for `₹` and replace with your currency symbol:
```javascript
amountDiv.textContent = `$${expense.amount.toFixed(2)}`;  // For USD
```

### Add New Features

**Future improvements can include:**
- Monthly/yearly reports
- Expense analytics and charts
- Budget alerts
- Export to CSV
- Multiple user accounts
- Recurring expenses
- Expense categories with colors

---

## PART 8: Troubleshooting

### Problem: "CORS error" in browser console

**Solution:**
- This occurs during local testing. Deploy to a web server to fix.
- Google Apps Script automatically allows cross-origin requests.

### Problem: "Categories not loading"

**Solution:**
1. Check if `Expense_Master` sheet exists and has data
2. Verify sheet name spelling exactly matches `SHEET_ID` constant
3. Check Apps Script execution logs for errors

### Problem: "Cannot save expenses"

**Solution:**
1. Verify deployment URL in `app.js` is correct
2. Check that `Expense_Log` sheet exists with correct headers
3. Run `testBackend()` in Apps Script editor
4. Check browser network tab (F12) for request/response details

### Problem: "Wrong dates showing"

**Solution:**
1. Ensure all dates in Google Sheets are in `YYYY-MM-DD` format
2. Check browser's timezone settings
3. Verify date formatting in `formatDateToString()` function

### Problem: "Categories dropdown empty"

**Solution:**
1. Add categories to `Expense_Master` sheet
2. Reload the webpage (Ctrl+F5 for hard refresh)
3. Check browser console for error messages

---

## PART 9: Performance Tips

1. **Cache data locally**: The app caches fetched expenses in memory
2. **Batch requests**: Multiple expenses per day reduces API calls
3. **Pagination**: For months with many expenses, add pagination
4. **Lazy loading**: Load month data only when viewing that month

---

## PART 10: Security Best Practices

1. **Protect your Google Sheet:**
   - Share only with trusted people
   - Don't publish Sheet ID publicly
   - Use Sheets' revision history feature

2. **Apps Script Deployment:**
   - Review who has access before deploying
   - Monitor Apps Script execution logs
   - Update deployment if you make backend changes

3. **Data Privacy:**
   - All data stays in your Google Drive
   - No third-party data collection
   - HTTPS encryption for all transmissions

---

## PART 11: Version Control

### Initialize Git Repository

```bash
cd "d:\Sai\Expense Manager"
git init
git add .
git commit -m "Initial commit: Expense Manager v1.0"
```

### Never commit:
- `.env` files with API keys
- `appsscript.json` with deployment IDs
- Local configuration files

These are already in `.gitignore`

---

## PART 12: Monitoring & Maintenance

### Weekly Tasks:
- Check if Google Sheets has grown too large
- Review any error patterns in Apps Script logs

### Monthly Tasks:
- Export expense data for backup
- Review spending patterns
- Update budget categories if needed

### Backup Strategy:
1. Google Sheets auto-backs up daily
2. Export sheet as CSV monthly
3. Use GitHub for code version control

---

## Support & Resources

- **Google Apps Script Documentation**: https://developers.google.com/apps-script
- **Google Sheets API**: https://developers.google.com/sheets
- **Firebase Hosting**: https://firebase.google.com/docs/hosting
- **MDN Web Docs**: https://developer.mozilla.org

---

## License

This project is open source and free to modify for personal use.

---

## Next Steps

1. ✅ Set up Google Sheet with ID
2. ✅ Deploy Google Apps Script
3. ✅ Update frontend with deployment URL
4. ✅ Deploy frontend to web host
5. ✅ Test the complete flow
6. Start tracking your expenses!

**Happy Expense Tracking! 💰**
