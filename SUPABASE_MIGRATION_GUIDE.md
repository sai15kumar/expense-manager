# Supabase Cutover Notes

The migration is complete. Supabase is now the only supported backend.

## Current State

- Frontend provider is set to `supabase`
- Categories and budgets are stored in `category_master`
- Transactions are stored in `transactions`
- Allowed users are stored in `allowed_users`
- Budget timestamps come from `category_master.updated_at`

## What to Keep

- [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql)
- [supabase/functions/expense-api/index.ts](./supabase/functions/expense-api/index.ts)
- [js/deployment-config.js](./js/deployment-config.js)

## What Changed in the Budget Flow

- `getBudgets` returns row-level `updated_at`
- The Budget page derives the latest saved/updated time from those rows
- `saveBudget` resolves rows in `category_master` using `type` plus either `detail` or fallback `category`

## Operational Guidance

- Do not reintroduce the legacy backend as a fallback path
- Keep `category_master` as the source of truth for budgets
- If old exported data still exists, import it into Supabase rather than wiring the legacy backend back in
