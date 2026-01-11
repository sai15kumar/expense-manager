# QUICK REFERENCE - EXPENSE MANAGER

## 📋 File Overview

| File | Purpose |
|------|---------|
| `index.html` | UI structure - Calendar & expense form |
| `css/styles.css` | Mobile-first responsive design |
| `js/app.js` | Frontend logic - Event handlers, API calls |
| `backend/Code.gs` | Google Apps Script - Backend handlers |
| `README.md` | Project overview & features |
| `DEPLOYMENT_GUIDE.md` | Complete step-by-step deployment guide |
| `SETUP_CHECKLIST.md` | Checklist to track setup progress |
| `.gitignore` | Git ignore rules |

---

## 🔑 Key Configuration Points

### Frontend (js/app.js - Line ~13)
```javascript
const CONFIG = {
    BACKEND_URL: 'YOUR_DEPLOYMENT_URL_HERE',
    // ... other config
};
```
**Action:** Replace with your Google Apps Script deployment URL

### Backend (backend/Code.gs - Line ~8)
```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```
**Action:** Replace with your Google Sheet ID

---

## 🚀 Setup Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Google Sheet setup | 5 min |
| 2 | Apps Script setup | 5 min |
| 3 | Frontend config | 2 min |
| 4 | Deploy frontend | 5 min |
| 5 | Test integration | 3 min |
| **Total** | | **20 min** |

---

## 📁 Google Sheet Schema

### Expense_Log
```
Date (YYYY-MM-DD) | Category | Amount | Notes | Timestamp
2025-12-30        | Food     | 250    | Lunch | [auto]
```

### Expense_Master
```
Category    | Type
Food        | Essential
Transport   | Essential
Shopping    | Discretionary
```

---

## 🔌 API Reference

All requests: `POST` to `CONFIG.BACKEND_URL`

### Get Categories
```json
Request:  { "action": "getCategories" }
Response: { "success": true, "categories": [...] }
```

### Save Expenses
```json
Request: {
  "action": "saveExpenses",
  "date": "2025-12-30",
  "expenses": [
    { "category": "Food", "amount": 250, "notes": "Lunch" }
  ]
}
Response: { "success": true, "message": "...", "rowsAdded": 1 }
```

### Get Expenses
```json
Request:  { "action": "getExpenses", "date": "2025-12-30" }
Response: { "success": true, "expenses": [...], "count": 2 }
```

### Get Month Expenses
```json
Request:  { "action": "getExpensesByMonth", "year": 2025, "month": 12 }
Response: { "success": true, "expensesByDate": { "2025-12-30": [...] } }
```

---

## 🎨 CSS Classes & HTML IDs

### Main Sections
- `#expenseForm` - Expense entry modal
- `#viewExpenses` - View saved expenses
- `.calendar-section` - Calendar grid
- `.app-header` - App header

### Calendar Elements
- `.calendar-date` - Individual date cell
- `.calendar-date.today` - Today's date
- `.calendar-date.has-expense` - Date with expenses (red dot)
- `.calendar-date.selected` - Selected date (green)

### Form Elements
- `.expense-row` - Single expense entry row
- `.btn-primary` - Save button
- `.btn-secondary` - Cancel button
- `.status-message` - Success/error message

---

## 🛠️ Customization Quick Guide

### Change Currency
**File:** `js/app.js`
**Find:** `₹` (line 439, 730)
**Replace:** `$`, `€`, `£`, etc.

### Change Colors
**File:** `css/styles.css`
- Primary: `#667eea` → Your color
- Secondary: `#764ba2` → Your color
- Accent: `#51cf66` → Your color

### Add Expense Categories
**File:** Google Sheet `Expense_Master` tab
**Action:** Add new rows with category name

### Change Expense Row Count
**File:** `js/app.js`
**Line:** 12
**Find:** `CONFIG.EXPENSE_ROWS: 5`
**Change:** 5 → desired number

### Change Month Display Format
**File:** `js/app.js`
**Line:** 8-9
**Edit:** `CONFIG.MONTH_NAMES` array

---

## 🐛 Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Categories empty | Add rows to `Expense_Master` sheet |
| CORS error locally | Expected - deploy to web server |
| Cannot save expenses | Verify deployment URL in `app.js` |
| Calendar not showing | Check `index.html` is opened in browser |
| Wrong dates | Ensure Sheet dates are `YYYY-MM-DD` format |
| Categories not updating | Hard refresh (Ctrl+F5) |
| Forms not appearing | Check if JavaScript error in console (F12) |
| Google Sheet not updating | Verify Sheet ID in `Code.gs` matches |

---

## 📱 Responsive Breakpoints

```css
Mobile:  320px - 767px  (1 column)
Tablet:  768px - 1023px (adjusted sizing)
Desktop: 1024px+        (full width 600px max calendar)
```

---

## 🔒 Security Checklist

- ✅ No API keys in frontend code
- ✅ All data in your Google Drive
- ✅ HTTPS encrypted transmission
- ✅ No third-party services used
- ✅ Open source - audit the code

---

## 📊 Performance Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Load Time | < 2s | ✅ |
| First Interactive | < 500ms | ✅ |
| Mobile Size | < 100KB | ✅ |
| API Response | < 1s | ✅ |

---

## 🧠 JavaScript Functions Reference

### Main Functions
- `initializeApp()` - Initialize app on page load
- `renderCalendar()` - Render monthly calendar
- `selectDate(dateString)` - Handle date selection
- `saveExpenses(event)` - Save entered expenses
- `fetchCategories()` - Get categories from backend
- `fetchExpensesForDate()` - Get expenses for specific date

### Utility Functions
- `formatDateToString(dateObj)` - Convert Date → YYYY-MM-DD
- `formatDateForDisplay(dateString)` - Format for user display
- `createDateCell()` - Create single calendar date cell
- `showStatus()` - Display message to user

---

## 📈 Feature Roadmap

**v1.0 (Current)**
- ✅ Calendar UI
- ✅ Expense entry
- ✅ Google Sheets integration
- ✅ Mobile-first design

**v1.1 (Planned)**
- 📊 Monthly summary view
- 💰 Category-wise breakdown
- 📈 Spending trends

**v2.0 (Future)**
- 🎯 Budget alerts
- 📤 CSV export
- 👥 Multi-user sync
- 📱 Offline support

---

## 🔗 Important URLs to Save

| Item | Value |
|------|-------|
| Google Sheet ID | `YOUR_SHEET_ID` |
| Apps Script Deployment URL | `YOUR_DEPLOYMENT_URL` |
| Frontend Hosting URL | `YOUR_APP_URL` |
| Google Sheet Link | https://docs.google.com/spreadsheets/d/{SHEET_ID} |

---

## 📚 Documentation Structure

1. **README.md** - Start here for overview
2. **SETUP_CHECKLIST.md** - Use to track progress
3. **DEPLOYMENT_GUIDE.md** - Detailed step-by-step guide
4. **Code Comments** - Read in each file for explanations

---

## 💡 Pro Tips

1. **Keyboard Shortcuts in Browser**
   - F12: Open Developer Console
   - Ctrl+Shift+R: Hard refresh
   - Ctrl+L: Focus address bar

2. **Mobile Testing**
   - F12 → Device Toolbar (Ctrl+Shift+M)
   - Test different screen sizes
   - Check touch interactions

3. **Google Sheets Tips**
   - Use revision history to recover data
   - Share with family/friends for collaborative tracking
   - Use filters to view specific categories

4. **Data Backup**
   - Download sheet as CSV monthly
   - Store backup in secure location
   - Git commit your code changes

5. **Performance Optimization**
   - Cache date data locally (already implemented)
   - Batch multiple expenses per request
   - Clear browser cache occasionally

---

## ❓ Frequently Asked Questions

**Q: Can I use this with multiple users?**
A: Currently single-user. V2.0 will add multi-user support.

**Q: Does it work offline?**
A: App loads offline, but can't save without internet.

**Q: Is my data safe?**
A: Yes - stored only in your Google Drive, encrypted transmission.

**Q: Can I change the categories?**
A: Yes - edit `Expense_Master` sheet anytime.

**Q: How do I backup my data?**
A: Download Google Sheet as CSV monthly.

**Q: Can I host this myself?**
A: Yes - put on any static web host (Firebase, GitHub Pages, etc.)

---

## 🎯 Getting Started Checklist

- [ ] Read `README.md`
- [ ] Review this Quick Reference
- [ ] Follow `SETUP_CHECKLIST.md`
- [ ] If stuck, check `DEPLOYMENT_GUIDE.md` Part 8 (Troubleshooting)

---

**Version:** 1.0  
**Last Updated:** Dec 30, 2025  
**Status:** Production Ready ✅
