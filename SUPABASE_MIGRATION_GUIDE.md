# Supabase Migration Guide

This guide covers the first safe migration from Google Sheets to Supabase without breaking the current app flow.

## What has already been implemented

1. The frontend now supports a provider switch and still defaults to the current Apps Script backend.
2. A Supabase schema has been added in `supabase/migrations/001_initial_schema.sql`.
3. A Supabase Edge Function compatibility API has been added in `supabase/functions/expense-api/index.ts`.
4. The app can be rolled back instantly by switching the provider back to `appscript`.

## Goal of this release

Keep the current app behavior the same while moving data reads and writes from Google Sheets to Supabase.

## Step 1 - Create the Supabase project

1. Sign in to Supabase.
2. Create a new project.
3. Save these values:
   - Project URL
   - Anon key
   - Service role key

## Step 2 - Run the SQL schema

1. Open the SQL editor in Supabase.
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`.
3. Run the script.
4. Confirm that these tables exist:
   - `allowed_users`
   - `category_master`
   - `transactions`

## Step 3 - Load current master data

Populate `category_master` with your existing category rows from Google Sheets.

Suggested mapping:
- Type -> type
- Category -> category
- Fine-grained description -> detail
- Budget monthly -> budget_monthly
- Budget yearly -> budget_yearly

For the first cutover, you can leave `detail` blank for legacy rows.

## Step 4 - Import old transactions

Export the current Google Sheet tabs as CSV and import them into Supabase.

Suggested mapping from Expense_Log:
- ID -> id
- Date -> entry_date
- Type -> type
- Category -> category
- Amount -> amount
- Notes -> notes
- Timestamp -> created_at
- Status -> status

Set `created_by_email` to the email of the original owner where known, or leave it blank.

## Step 5 - Deploy the Edge Function

1. Install the Supabase CLI.
2. Log in.
3. Link the project.
4. Deploy the function:

   supabase functions deploy expense-api

5. Set the required secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`

Example:

supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set GOOGLE_CLIENT_ID=your-google-client-id

## Step 6 - Switch the frontend to Supabase

Before `js/app.js` is loaded, set these global values in the page:

<script>
  window.EXPENSE_BACKEND_PROVIDER = 'supabase';
  window.EXPENSE_SUPABASE_URL = 'https://your-project.supabase.co';
  window.EXPENSE_SUPABASE_ANON_KEY = 'your-anon-key';
  window.EXPENSE_SUPABASE_FUNCTION_NAME = 'expense-api';
</script>

If these values are not set, the app will continue using Apps Script.

## Step 7 - Verify parity

Test the following before retiring the old backend:

- Sign-in and auth gate still work
- Categories load correctly
- Dashboard totals match the old system for at least two real months
- Save new expense works
- Delete expense works
- Budget save works
- Yearly and monthly views both load correctly

## Rollback plan

If anything looks wrong after switching:

1. Set `window.EXPENSE_BACKEND_PROVIDER = 'appscript'`
2. Reload the site
3. The app immediately returns to the old Google Sheets backend

## Recommended next release after cutover

Once the Supabase cutover is stable, update the entry flow to:

- Type
- Main category
- Detail
- Amount
- Notes

This is where the simplified data entry model should be introduced.
