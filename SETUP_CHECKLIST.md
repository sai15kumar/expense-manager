# Expense Manager Setup Checklist

## Supabase Setup

- [ ] Create the Supabase project
- [ ] Save the project URL
- [ ] Save the anon key
- [ ] Save the service role key
- [ ] Run [supabase/migrations/001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql)

## Data Setup

- [ ] Insert approved users into `allowed_users`
- [ ] Insert active categories into `category_master`
- [ ] Populate `budget_monthly` and `budget_yearly` where required

## API Setup

- [ ] Install the Supabase CLI
- [ ] Deploy `expense-api`
- [ ] Set `SUPABASE_URL`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `GOOGLE_CLIENT_ID`

## Frontend Setup

- [ ] Update [js/deployment-config.js](./js/deployment-config.js)
- [ ] Verify provider is set to `supabase`
- [ ] Publish the static frontend

## Validation

- [ ] Sign-in works
- [ ] Categories load
- [ ] Transactions save and reload
- [ ] Budgets save and reload
- [ ] Budget footer shows the latest saved/updated time
