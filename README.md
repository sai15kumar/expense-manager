# 💰 Expense Manager

A beautiful, mobile-first personal expense tracking web application built with vanilla technologies.

## Features

✨ **Calendar-First Interface**
- Monthly calendar view with intuitive date selection
- Visual indicators for dates with recorded expenses
- Smooth month navigation

📝 **Quick Expense Entry**
- 5 rows for entering expenses per day
- Dynamic category dropdown (from Google Sheets)
- Amount and optional notes fields
- Single-click save functionality

📊 **Cloud-Powered Storage**
- All data stored securely in your Google Sheet
- No account signup required
- Real-time synchronization
- Complete data ownership

📱 **Mobile-First Design**
- Optimized for all screen sizes (320px - 1920px)
- Touch-friendly interface (44px+ buttons)
- Smooth animations and transitions
- Fast loading and responsive interactions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3 (Mobile-First), Vanilla JavaScript |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Hosting | Firebase / GitHub Pages / Any static host |

## Quick Start

### Prerequisites
- Google Account (for Google Sheets & Apps Script)
- Any modern web browser
- A web hosting service (Firebase/GitHub Pages recommended)

### Step-by-Step Setup

**1. Google Sheet Setup (5 minutes)**
- Create a Google Sheet with two tabs: `Expense_Log` and `Expense_Master`
- Copy the Sheet ID

**2. Google Apps Script Setup (5 minutes)**
- Go to Tools → Script Editor in your Google Sheet
- Paste code from `backend/Code.gs`
- Update `SHEET_ID` constant
- Deploy as Web App
- Copy deployment URL

**3. Frontend Configuration (2 minutes)**
- Edit `js/app.js`
- Update `CONFIG.BACKEND_URL` with deployment URL

**4. Deploy Frontend (5 minutes)**
- Use Firebase Hosting or GitHub Pages
- Upload the files
- Get your live URL

**5. Start Tracking! (Ongoing)**
- Open your app in browser
- Click any date
- Enter expenses
- Click Save

⏱️ **Total setup time: ~20 minutes**

For detailed step-by-step instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## File Structure

```
Expense Manager/
├── index.html                    # Main application page
├── css/
│   └── styles.css               # Mobile-first responsive styles
├── js/
│   └── app.js                    # Frontend logic (vanilla JS)
├── backend/
│   └── Code.gs                   # Google Apps Script backend
├── .gitignore                    # Git configuration
├── DEPLOYMENT_GUIDE.md           # Complete deployment instructions
└── README.md                     # This file
```

## Architecture

### Data Flow

```
User Input (Browser)
        ↓
Frontend (app.js)
        ↓
HTTP POST Request (JSON)
        ↓
Google Apps Script (Code.gs)
        ↓
Google Sheets
```

### API Endpoints

The backend provides 4 main endpoints (all POST to same URL with `action` parameter):

1. **getCategories** - Fetch available expense categories
2. **saveExpenses** - Save new expenses for a date
3. **getExpenses** - Retrieve expenses for a specific date
4. **getExpensesByMonth** - Get all expenses for a month

## Customization

### Change Colors
Edit `css/styles.css` - look for `#667eea` (main color) and `#764ba2` (secondary)

### Add Categories
Edit your Google Sheet's `Expense_Master` tab - add new rows

### Modify Expense Count
Edit `js/app.js` line 12: `CONFIG.EXPENSE_ROWS: 5` → change 5 to desired number

### Change Currency
Search for `₹` in `js/app.js` and replace with your currency symbol

## Google Sheets Schema

### Expense_Log Sheet
| Date | Category | Amount | Notes | Timestamp |
|------|----------|--------|-------|-----------|
| 2025-12-30 | Food | 250 | Lunch | [auto] |

### Expense_Master Sheet
| Category | Type |
|----------|------|
| Food | Essential |
| Transport | Essential |
| Entertainment | Discretionary |

## Deployment Options

- **Firebase Hosting** (Recommended) - Free, fast, built-in CI/CD
- **GitHub Pages** - Free, integrates with git
- **Netlify** - Drag-and-drop deployment
- **Traditional Hosting** - FTP upload to any server

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions for each option.

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile: iOS Safari 14+, Chrome Mobile 88+

## Performance

- **Load time**: < 2 seconds
- **First interaction**: < 500ms
- **Offline capable**: Works without internet (cached data)
- **Data sync**: Automatic when online

## Security

- ✅ All data stored in your personal Google Drive
- ✅ No third-party data collection
- ✅ HTTPS encrypted transmission
- ✅ Your Google Account authentication
- ✅ Open source - audit the code yourself

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Categories not loading | Add rows to `Expense_Master` sheet |
| Cannot save expenses | Verify deployment URL in `app.js` |
| CORS errors | Deploy to web server (local testing issue) |
| Wrong dates | Ensure date format is `YYYY-MM-DD` |

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for more troubleshooting.

## Future Enhancements

Potential features for v2.0+:
- 📈 Monthly/yearly analytics and charts
- 💸 Budget tracking and alerts
- 📤 Export to CSV/PDF
- 🔄 Recurring expenses
- 👥 Multi-user support
- 🎯 Spending goals
- 🏷️ Expense tags
- 📞 Expense history and editing

## Code Quality

- ✅ Well-documented with comments
- ✅ Beginner-friendly code structure
- ✅ No framework dependencies
- ✅ Follows best practices
- ✅ Modular functions
- ✅ Error handling

## Contributing

Feel free to fork, modify, and improve this project for your personal use. If you create improvements, consider sharing them back!

## License

MIT License - Free to use and modify

## Support

- 📖 See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive setup instructions
- 🐛 Check browser console (F12) for error messages
- 📋 Check Google Apps Script logs for backend errors
- 🔗 Visit [developers.google.com/apps-script](https://developers.google.com/apps-script) for API docs

## Credits

Built with ❤️ using:
- HTML5 & CSS3
- Vanilla JavaScript (no frameworks)
- Google Apps Script
- Google Sheets

---

**Ready to track your expenses? Follow the [Quick Start](#quick-start) or read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions!**

💰 Start spending wisely today!
