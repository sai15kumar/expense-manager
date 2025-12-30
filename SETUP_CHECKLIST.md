# 🚀 EXPENSE MANAGER - SETUP CHECKLIST

Use this checklist to track your setup progress. Check off each item as you complete it.

---

## PHASE 1: Google Sheet Setup ⬜

- [ ] **Create Google Sheet**
  - Go to [sheets.google.com](https://sheets.google.com)
  - Create new spreadsheet named "Expense Manager Data"
  - Copy and save the Sheet ID (from URL)

- [ ] **Create Expense_Log Sheet**
  - Rename first sheet to `Expense_Log`
  - Headers: Date | Category | Amount | Notes | Timestamp
  - Format Date column as YYYY-MM-DD
  - Format Amount column as Currency (₹)

- [ ] **Create Expense_Master Sheet**
  - Add new sheet named `Expense_Master`
  - Headers: Category | Type
  - Add categories (Food, Transport, Entertainment, etc.)
  - Examples: Food|Essential, Shopping|Discretionary

---

## PHASE 2: Google Apps Script Setup ⬜

- [ ] **Copy Code to Apps Script**
  - In your Google Sheet: Tools → Script Editor
  - Delete default code
  - Copy entire content from `backend/Code.gs`
  - Paste into Script Editor

- [ ] **Update SHEET_ID**
  - Find line: `const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';`
  - Replace with your actual Sheet ID
  - Save the script

- [ ] **Initialize Sheets (Optional)**
  - If you didn't create sheets manually:
    - Select function: `createDefaultSheets`
    - Click Run
    - Authorize when prompted
    - Check that sheets were created

- [ ] **Test Backend**
  - Select function: `testBackend`
  - Click Run
  - View logs: View → Execution Log
  - Verify no errors appear

- [ ] **Deploy as Web App**
  - Click Deploy → New Deployment
  - Type: Web App
  - Execute as: Your email
  - Who has access: Anyone
  - Click Deploy
  - Copy deployment URL
  - Save it (format: `https://script.google.com/macros/d/.../usercopy?v=1`)

---

## PHASE 3: Frontend Configuration ⬜

- [ ] **Update Backend URL**
  - Open `js/app.js` in VS Code
  - Find line ~13: `BACKEND_URL: 'https://script.google.com/macros/d/...'`
  - Replace with your deployment URL from Phase 2
  - Save the file

- [ ] **Test Locally (Optional)**
  - Open `index.html` in your browser
  - Check browser console (F12) for errors
  - Note: CORS errors are expected locally, will be fixed after deployment

---

## PHASE 4: Frontend Deployment ⬜

**Choose ONE deployment option:**

### Option A: Firebase Hosting
- [ ] Install Node.js
- [ ] Run: `npm install -g firebase-tools`
- [ ] In project folder: `firebase login`
- [ ] Run: `firebase init hosting`
- [ ] Select "Create new project" or existing
- [ ] Public directory: `.` (current folder)
- [ ] Single-page app: No
- [ ] Run: `firebase deploy`
- [ ] Copy hosting URL
- [ ] Test in browser

### Option B: GitHub Pages
- [ ] Create GitHub account (if needed)
- [ ] Create new public repository: `expense-manager`
- [ ] Push code to repository
- [ ] Go to repository Settings → Pages
- [ ] Branch: main, Folder: / (root)
- [ ] Wait 1-2 minutes
- [ ] Copy GitHub Pages URL
- [ ] Test in browser

### Option C: Traditional Hosting
- [ ] Upload all files to your web host via FTP
- [ ] Get the hosting URL from your provider
- [ ] Test in browser

---

## PHASE 5: Integration Testing ⬜

- [ ] **Test App Load**
  - Open deployed URL
  - Verify no console errors
  - Check if calendar renders

- [ ] **Test Categories Load**
  - Calendar should display
  - Check browser console for any errors
  - Refresh page

- [ ] **Test Date Selection**
  - Click any date on calendar
  - Expense form should appear
  - Selected date should display at top
  - Category dropdown should show categories

- [ ] **Test Save Expense**
  - Select a date
  - Enter: Category (Food), Amount (250)
  - Click Save
  - Wait for "Expenses saved successfully" message
  - Refresh page and select same date
  - Previously saved expense should appear

- [ ] **Test Calendar Indicator**
  - After saving an expense, date should show a red dot
  - Navigate away (next month) and back
  - Red dot should still be visible

---

## PHASE 6: Data Verification ⬜

- [ ] **Check Google Sheet**
  - Open your Google Sheet
  - Go to Expense_Log sheet
  - Verify your test expense appears with:
    - Correct date
    - Correct category
    - Correct amount
    - Timestamp auto-populated

- [ ] **Test Multiple Expenses**
  - Enter 3 expenses in same day
  - All should appear in Google Sheet
  - Timestamps should be recorded

- [ ] **Test Navigation**
  - Click Previous/Next month
  - Calendar should update
  - Select different dates
  - Form should update selected date

---

## PHASE 7: Performance Checks ⬜

- [ ] **Load Time**
  - Open app in browser
  - Should load in < 3 seconds
  - No blank screens or loading delays

- [ ] **Responsiveness**
  - Open on mobile phone or tablet
  - All buttons touchable (not too small)
  - Form fits on screen without extreme scrolling
  - Text is readable

- [ ] **Offline Handling**
  - Turn off internet
  - Calendar should still display
  - Try to save expense
  - Should show error message (expected)

---

## PHASE 8: Documentation ⬜

- [ ] **Read Documentation**
  - Read through `README.md`
  - Skim `DEPLOYMENT_GUIDE.md`
  - Understand architecture and API endpoints

- [ ] **Code Comments**
  - Review code comments in:
    - `index.html` - Structure comments
    - `css/styles.css` - Style sections
    - `js/app.js` - JavaScript functions
    - `backend/Code.gs` - Apps Script handlers

- [ ] **Setup Your Own Notes**
  - Document your deployment URL
  - Document your Google Sheet ID
  - Save these in a secure place

---

## PHASE 9: Customization (Optional) ⬜

- [ ] **Change App Title**
  - Edit `index.html` line 8
  - Change `<title>` and header

- [ ] **Add More Categories**
  - Open Google Sheet
  - Add rows to Expense_Master
  - Refresh app - new categories appear

- [ ] **Change Color Theme**
  - Edit `css/styles.css`
  - Replace #667eea with your primary color
  - Replace #764ba2 with your secondary color

- [ ] **Change Currency Symbol**
  - Search for `₹` in `js/app.js`
  - Replace with `$`, `€`, `£`, etc.

- [ ] **Increase Expense Rows**
  - Edit `js/app.js` line 12
  - Change `CONFIG.EXPENSE_ROWS: 5` to desired number

---

## PHASE 10: Version Control (Optional) ⬜

- [ ] **Initialize Git**
  - Open terminal in project folder
  - Run: `git init`

- [ ] **Create .gitignore**
  - File already created
  - Review `.gitignore` contents

- [ ] **First Commit**
  - Run: `git add .`
  - Run: `git commit -m "Initial commit: Expense Manager v1.0"`

- [ ] **Push to GitHub (Optional)**
  - Create GitHub repo
  - Run: `git remote add origin <github-url>`
  - Run: `git push -u origin main`

---

## PHASE 11: Ongoing Maintenance ⬜

- [ ] **Bookmark Your App**
  - Save deployed URL as bookmark
  - Or add to mobile home screen

- [ ] **Set Reminders**
  - Daily: Record expenses
  - Weekly: Review spending
  - Monthly: Check totals

- [ ] **Backup Your Data**
  - Monthly: Download Google Sheet as CSV
  - Store backup in secure location

- [ ] **Monitor Logs**
  - Check Apps Script logs monthly
  - Look for any errors or issues

---

## TROUBLESHOOTING ⬜

**If something doesn't work:**

- [ ] Check Browser Console
  - Open F12 → Console tab
  - Look for red error messages
  - Take note of error text

- [ ] Check Apps Script Logs
  - Google Sheet → Tools → Script Editor
  - View → Execution Log
  - Look for error entries

- [ ] Verify Connections
  - Check deployment URL is correct in `app.js`
  - Check Sheet ID is correct in `Code.gs`
  - Check sheet names are spelled exactly

- [ ] Hard Refresh
  - Press Ctrl+F5 (or Cmd+Shift+R on Mac)
  - Clear browser cache
  - Try again

- [ ] See DEPLOYMENT_GUIDE.md
  - Section "PART 8: Troubleshooting"
  - Has solutions for common issues

---

## Success Criteria ✅

Your setup is complete when:

- ✅ App opens without errors
- ✅ Calendar displays correctly
- ✅ Can select dates
- ✅ Expense form appears on date click
- ✅ Can enter and save expenses
- ✅ Data appears in Google Sheet
- ✅ Red dots appear on dates with expenses
- ✅ Can navigate between months
- ✅ App works on mobile and desktop

---

## 🎉 Congratulations!

You've successfully set up Expense Manager!

**Next steps:**
1. Start recording your daily expenses
2. Monitor your spending patterns
3. Customize the app to your needs
4. Consider adding more features

---

## 📞 Need Help?

**Resources:**
- `DEPLOYMENT_GUIDE.md` - Comprehensive setup guide
- `README.md` - Project overview
- Browser Console (F12) - Error messages
- Apps Script Logs - Backend errors
- Google Docs - Search for specific issues

**Common Issues:**
- See "PART 8: Troubleshooting" in DEPLOYMENT_GUIDE.md

---

**Last Updated:** December 30, 2025
**Version:** 1.0
