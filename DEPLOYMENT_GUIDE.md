# Expense Manager Deployment Guide

This project runs in Supabase-only mode.

## 1. Create the Supabase Project

1. Create a new Supabase project.
2. Save the project URL, anon key, and service role key.

## 2. Apply the Schema

1. Open the SQL editor.
2. Run [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql).
3. Confirm these tables exist:
   - `allowed_users`
   - `category_master`
   - `transactions`

## 3. Seed Core Data

Populate:

- `allowed_users` with approved email addresses
- `category_master` with active category rows and budget values

Important `category_master` columns:

- `type`
- `category`
- `detail`
- `budget_monthly`
- `budget_yearly`
- `updated_at`
- `active`

## 4. Deploy the Edge Function

```bash
supabase functions deploy expense-api
```

Set the required secrets:

```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set GOOGLE_CLIENT_ID=your-google-client-id
```

## 5. Configure the Frontend

Update [js/deployment-config.js](./js/deployment-config.js):

```javascript
window.EXPENSE_BACKEND_PROVIDER = 'supabase';
window.EXPENSE_SUPABASE_URL = 'https://your-project.supabase.co';
window.EXPENSE_SUPABASE_ANON_KEY = 'your-anon-key';
window.EXPENSE_SUPABASE_FUNCTION_NAME = 'expense-api';
```

Do not place the service role key in frontend files.

## 6. Deploy the Frontend

Publish the static files on any host that can serve `index.html`, `css`, and `js` assets.

## 7. Validate

1. Google sign-in works.
2. Authorized users can access the app.
3. Categories load from `category_master`.
4. Transactions save and reload correctly.
5. Budgets save and reload correctly.
6. The Budget footer shows the latest saved/updated timestamp.
