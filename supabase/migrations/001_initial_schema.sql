-- Expense Manager - Supabase initial schema
-- Safe first-release schema preserving current app behavior while allowing future Category -> Detail simplification.

create extension if not exists pgcrypto;

create table if not exists public.allowed_users (
    email text primary key,
    role text not null default 'user',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.category_master (
    id uuid primary key default gen_random_uuid(),
    type text not null,
    category text not null,
    detail text,
    budget_monthly numeric(12,2) not null default 0,
    budget_yearly numeric(12,2) not null default 0,
    active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_category_master_type on public.category_master (lower(type));
create index if not exists idx_category_master_category on public.category_master (lower(category));
create index if not exists idx_category_master_active on public.category_master (active);

create table if not exists public.transactions (
    id text primary key,
    entry_date date not null,
    type text not null,
    category text not null,
    detail text,
    amount numeric(12,2) not null check (amount >= 0),
    notes text not null default '',
    created_by_email text,
    status text not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_entry_date on public.transactions (entry_date);
create index if not exists idx_transactions_type on public.transactions (lower(type));
create index if not exists idx_transactions_category on public.transactions (lower(category));
create index if not exists idx_transactions_status on public.transactions (status);
create index if not exists idx_transactions_created_by on public.transactions (lower(created_by_email));

insert into public.allowed_users (email, role, active)
values
    ('sai15kumar@gmail.com', 'admin', true),
    ('rubijohn88@gmail.com', 'admin', true)
on conflict (email) do update
set role = excluded.role,
    active = excluded.active,
    updated_at = now();

comment on table public.category_master is 'Master list of supported entry categories and optional details for expense, income, savings, and payoff flows.';
comment on table public.transactions is 'Transaction log migrated from Google Sheets Expense_Log.';
comment on column public.transactions.detail is 'Optional fine-grained descriptor such as Electricity Bill or Internet. Leave blank for legacy records.';
comment on column public.category_master.detail is 'Optional dependent dropdown value used after the broad category is selected.';
