create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(120) not null unique,
  username varchar(60) unique,
  password_hash text not null,
  display_name varchar(80) not null,
  role varchar(20) not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  currency varchar(3) not null default 'PHP',
  monthly_budget numeric(14,2) not null default 30000,
  display_name varchar(80) not null default 'FinTrack User',
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type varchar(20) not null check (type in ('income','expense')),
  description varchar(200) not null,
  category varchar(80) not null,
  amount numeric(14,2) not null check (amount >= 0),
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_transactions_user_date on transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_user_type on transactions(user_id, type);

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(160) not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists savings_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references savings_goals(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type varchar(20) not null check (type in ('add','withdraw')),
  amount numeric(14,2) not null check (amount > 0),
  entry_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(160) not null,
  investment_type varchar(80) not null default 'Investment',
  capital numeric(14,2) not null check (capital >= 0),
  current_value numeric(14,2) not null check (current_value >= 0),
  investment_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists protection_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(120) not null,
  protection_type varchar(80) not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  status varchar(40) not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, protection_type)
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(120) not null,
  account_type varchar(60) not null default 'Cash',
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name varchar(160) not null,
  balance numeric(14,2) not null default 0,
  interest_rate numeric(8,4) not null default 0,
  monthly_payment numeric(14,2) not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  description varchar(200) not null,
  type varchar(20) not null check (type in ('Income','Expense')),
  amount numeric(14,2) not null check (amount > 0),
  frequency varchar(40) not null,
  next_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action varchar(160) not null,
  details text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs(created_at desc);
create index if not exists idx_audit_user on audit_logs(user_id, created_at desc);

create or replace view admin_financial_summary as
select
  (select count(*) from users where role='user') as total_users,
  (select count(*) from users where role='admin') as admin_accounts,
  (select count(*) from transactions) as total_transactions,
  (select coalesce(sum(amount),0) from transactions where type='income') as total_income,
  (select coalesce(sum(amount),0) from transactions where type='expense') as total_spending,
  (select count(*) from audit_logs) as total_audit_events;
