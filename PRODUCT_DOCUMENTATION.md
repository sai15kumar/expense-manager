# Expense Manager Product Documentation

## Overview

Expense Manager is a personal finance application for tracking expenses, income, savings, and payoffs.

## Architecture

- Frontend: browser-rendered UI in [js/app.js](./js/app.js)
- Auth: Google Identity Services in [js/auth.js](./js/auth.js)
- API: Supabase Edge Function in [supabase/functions/expense-api/index.ts](./supabase/functions/expense-api/index.ts)
- Database: Supabase Postgres tables created by [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql)

## Core Tables

### `category_master`

Stores:
- transaction type
- main category
- optional detail
- monthly budget
- yearly budget
- active flag
- update timestamp

### `transactions`

Stores transaction entries shown across dashboard, transactions, and analytics views.

### `allowed_users`

Restricts access to approved signed-in users.

## Budget Flow

1. The Budget page requests `getBudgets`.
2. The API reads rows from `category_master`.
3. The UI renders editable budget values by type and sub-category.
4. Saving sends `saveBudget`.
5. The API updates matching `category_master` rows and refreshes `updated_at`.
6. The UI reloads budgets and shows the latest saved/updated time in the footer.

## Operational Notes

- `category_master` is the source of truth for budgets.
- The app no longer depends on any legacy spreadsheet backend.
- Historical data should be imported into Supabase rather than routed through a legacy backend.
