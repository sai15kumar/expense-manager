# Expense Manager

Expense Manager is a personal finance tracker with a Supabase-backed API, Google Sign-In, and responsive views for dashboard, transactions, budgets, and analytics.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, vanilla JavaScript, in-browser React UMD/Babel |
| Auth | Google Identity Services |
| API | Supabase Edge Function |
| Database | Supabase Postgres |
| Hosting | Any static host |

## Source of Truth

- Transactions: `transactions`
- Categories and budgets: `category_master`
- Allowed users: `allowed_users`

The Budget page reads and saves budget values through `category_master`, and the footer timestamp is derived from the latest returned `updated_at` value.

## Setup Summary

1. Create a Supabase project.
2. Run [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql).
3. Seed `allowed_users` and `category_master`.
4. Deploy [supabase/functions/expense-api/index.ts](./supabase/functions/expense-api/index.ts).
5. Set the public runtime values in [js/deployment-config.js](./js/deployment-config.js).
6. Host the frontend files.

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for the full flow.

## Project Structure

```text
Expense Manager/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── auth.js
│   └── deployment-config.js
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── functions/
├── README.md
├── DEPLOYMENT_GUIDE.md
├── QUICK_REFERENCE.md
├── SETUP_CHECKLIST.md
└── PRODUCT_DOCUMENTATION.md
```
