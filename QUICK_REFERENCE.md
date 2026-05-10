# Expense Manager Quick Reference

## Active Runtime

| Area | Current Source |
|------|----------------|
| Auth | Google Identity Services |
| API | Supabase Edge Function `expense-api` |
| Data | Supabase Postgres |
| Budget source | `category_master` |

## Important Files

| File | Purpose |
|------|---------|
| `js/app.js` | Main UI and budget footer logic |
| `js/auth.js` | Sign-in flow |
| `js/deployment-config.js` | Public runtime configuration |
| `supabase/functions/expense-api/index.ts` | API handlers |
| `supabase/migrations/001_initial_schema.sql` | Schema |

## Budget Notes

- `getBudgets` reads from `category_master`
- `saveBudget` updates `budget_monthly`, `budget_yearly`, and `updated_at`
- Budget rows are resolved by `type` plus either `detail` or fallback `category`
- The footer timestamp uses the latest returned `updatedAt` value

## Common Checks

| Issue | Check |
|-------|-------|
| Categories missing | Verify `category_master.active = true` |
| Budget not saving | Verify the row exists for the selected `type` and `detail/category` |
| Unauthorized | Verify the email exists in `allowed_users` |
| Function failure | Check Supabase function logs |
