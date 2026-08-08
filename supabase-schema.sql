-- Commission Shop: agricultural inventory and accounting foundation
-- This file creates a NEW schema. To replace the incorrect empty automobile
-- schema already in Supabase, run supabase-reset-and-schema.sql instead.

create extension if not exists pgcrypto;

create type public.quantity_unit as enum ('maund', 'kg', 'bag');
create type public.party_role as enum ('farmer', 'buyer', 'supplier', 'lender', 'labourer', 'employee', 'market_committee', 'other');
create type public.stock_source as enum ('own_harvest', 'farmer_purchase', 'consignment', 'opening_balance', 'return_in', 'adjustment_in');
create type public.cash_direction as enum ('in', 'out');
create type public.party_balance_type as enum ('receivable', 'payable');
create type public.balance_effect as enum ('increase', 'decrease');
create type public.account_type as enum ('asset', 'liability', 'equity', 'income', 'expense');

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles public.party_role[] not null default '{}',
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, phone)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'crop',
  default_unit public.quantity_unit not null default 'maund',
  maund_weight_kg numeric(12, 3) not null default 40 check (maund_weight_kg > 0),
  bag_weight_kg numeric(12, 3),
  minimum_stock_kg numeric(14, 3) not null default 0 check (minimum_stock_kg >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bag_weight_kg is null or bag_weight_kg > 0)
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  account_code text not null unique,
  is_cash_in_hand boolean not null default false,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  account_type public.account_type not null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number bigint generated always as identity unique,
  receipt_date date not null default current_date,
  source public.stock_source not null,
  party_id uuid references public.parties(id) on delete restrict,
  market_id uuid references public.markets(id) on delete set null,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_amount <= total_amount)
);

create table public.stock_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.stock_receipts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit public.quantity_unit not null,
  quantity_kg numeric(14, 3) not null check (quantity_kg > 0),
  rate_per_unit numeric(14, 2) not null default 0 check (rate_per_unit >= 0),
  line_total numeric(14, 2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.crop_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity unique,
  sale_date date not null default current_date,
  buyer_id uuid not null references public.parties(id) on delete restrict,
  market_id uuid references public.markets(id) on delete set null,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  received_amount numeric(14, 2) not null default 0 check (received_amount >= 0),
  commission_amount numeric(14, 2) not null default 0 check (commission_amount >= 0),
  commission_note text,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (received_amount <= total_amount)
);

create table public.crop_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.crop_sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit public.quantity_unit not null,
  quantity_kg numeric(14, 3) not null check (quantity_kg > 0),
  rate_per_unit numeric(14, 2) not null default 0 check (rate_per_unit >= 0),
  line_total numeric(14, 2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null default current_date,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_in_kg numeric(14, 3) not null default 0 check (quantity_in_kg >= 0),
  quantity_out_kg numeric(14, 3) not null default 0 check (quantity_out_kg >= 0),
  unit_cost_per_kg numeric(14, 4) check (unit_cost_per_kg is null or unit_cost_per_kg >= 0),
  source_type text not null,
  source_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  check (
    (quantity_in_kg > 0 and quantity_out_kg = 0)
    or (quantity_out_kg > 0 and quantity_in_kg = 0)
  )
);

create table public.party_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  party_id uuid not null references public.parties(id) on delete restrict,
  balance_type public.party_balance_type not null,
  effect public.balance_effect not null,
  amount numeric(14, 2) not null check (amount > 0),
  entry_type text not null,
  source_type text,
  source_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  entry_number bigint generated always as identity unique,
  narration text not null,
  source_type text,
  source_id uuid,
  is_posted boolean not null default true,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  party_id uuid references public.parties(id) on delete restrict,
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  notes text,
  created_at timestamptz not null default now(),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create table public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  cash_account_id uuid not null references public.cash_accounts(id) on delete restrict,
  direction public.cash_direction not null,
  amount numeric(14, 2) not null check (amount > 0),
  party_id uuid references public.parties(id) on delete restrict,
  transaction_type text not null,
  source_type text,
  source_id uuid,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text not null check (category in ('labour', 'salary', 'market_fee', 'transport', 'loading', 'utilities', 'rent', 'other')),
  party_id uuid references public.parties(id) on delete restrict,
  market_id uuid references public.markets(id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_amount <= amount)
);

create table public.income_entries (
  id uuid primary key default gen_random_uuid(),
  income_date date not null default current_date,
  category text not null check (category in ('commission', 'service_charge', 'other')),
  party_id uuid references public.parties(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  received_amount numeric(14, 2) not null default 0 check (received_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (received_amount <= amount)
);

create index parties_name_idx on public.parties (name);
create index products_name_idx on public.products (name);
create index stock_receipts_date_idx on public.stock_receipts (receipt_date desc);
create index crop_sales_date_idx on public.crop_sales (sale_date desc);
create index inventory_movements_product_date_idx on public.inventory_movements (product_id, movement_date desc);
create index party_ledger_party_date_idx on public.party_ledger_entries (party_id, entry_date desc);
create index cash_transactions_account_date_idx on public.cash_transactions (cash_account_id, transaction_date desc);
create index journal_lines_account_idx on public.journal_lines (account_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_user_profile();

create trigger parties_set_updated_at before update on public.parties for each row execute procedure public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute procedure public.set_updated_at();
create trigger markets_set_updated_at before update on public.markets for each row execute procedure public.set_updated_at();
create trigger cash_accounts_set_updated_at before update on public.cash_accounts for each row execute procedure public.set_updated_at();
create trigger chart_accounts_set_updated_at before update on public.chart_of_accounts for each row execute procedure public.set_updated_at();
create trigger stock_receipts_set_updated_at before update on public.stock_receipts for each row execute procedure public.set_updated_at();
create trigger crop_sales_set_updated_at before update on public.crop_sales for each row execute procedure public.set_updated_at();
create trigger journal_entries_set_updated_at before update on public.journal_entries for each row execute procedure public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expense_entries for each row execute procedure public.set_updated_at();
create trigger income_set_updated_at before update on public.income_entries for each row execute procedure public.set_updated_at();

insert into public.cash_accounts (name, account_code, is_cash_in_hand)
values ('Cash in Hand', '1000', true)
on conflict (account_code) do nothing;

insert into public.chart_of_accounts (code, name, account_type, is_system)
values
  ('1000', 'Cash in Hand', 'asset', true),
  ('1010', 'Bank', 'asset', true),
  ('1100', 'Crop Inventory', 'asset', true),
  ('1200', 'Accounts Receivable', 'asset', true),
  ('1210', 'Advances to Parties', 'asset', true),
  ('2000', 'Accounts Payable', 'liability', true),
  ('2100', 'Borrowings Payable', 'liability', true),
  ('3000', 'Owner Capital', 'equity', true),
  ('4000', 'Crop Sales', 'income', true),
  ('4100', 'Commission Income', 'income', true),
  ('4200', 'Other Income', 'income', true),
  ('5000', 'Cost of Goods Sold', 'expense', true),
  ('5100', 'Labour Expense', 'expense', true),
  ('5200', 'Salary Expense', 'expense', true),
  ('5300', 'Market Fee Expense', 'expense', true),
  ('5400', 'Operating Expense', 'expense', true)
on conflict (code) do nothing;

create or replace view public.v_cash_balances as
select
  account.id as cash_account_id,
  account.name as cash_account,
  coalesce(sum(case when transaction.direction = 'in' then transaction.amount else -transaction.amount end), 0) as balance
from public.cash_accounts account
left join public.cash_transactions transaction on transaction.cash_account_id = account.id
group by account.id, account.name;

create or replace view public.v_party_balances as
select
  party.id as party_id,
  party.name as party_name,
  coalesce(sum(case when entry.balance_type = 'receivable' and entry.effect = 'increase' then entry.amount when entry.balance_type = 'receivable' then -entry.amount else 0 end), 0) as amount_to_receive,
  coalesce(sum(case when entry.balance_type = 'payable' and entry.effect = 'increase' then entry.amount when entry.balance_type = 'payable' then -entry.amount else 0 end), 0) as amount_to_pay
from public.parties party
left join public.party_ledger_entries entry on entry.party_id = party.id
group by party.id, party.name;

create or replace view public.v_inventory_stock as
select
  product.id as product_id,
  product.name as product_name,
  coalesce(sum(movement.quantity_in_kg - movement.quantity_out_kg), 0) as stock_kg,
  product.minimum_stock_kg
from public.products product
left join public.inventory_movements movement on movement.product_id = product.id
group by product.id, product.name, product.minimum_stock_kg;

create or replace view public.v_trial_balance as
select
  account.code,
  account.name,
  account.account_type,
  coalesce(sum(line.debit), 0) as total_debit,
  coalesce(sum(line.credit), 0) as total_credit,
  coalesce(sum(line.debit - line.credit), 0) as net_balance
from public.chart_of_accounts account
left join public.journal_lines line on line.account_id = account.id
group by account.id, account.code, account.name, account.account_type;

alter table public.user_profiles enable row level security;
alter table public.parties enable row level security;
alter table public.products enable row level security;
alter table public.markets enable row level security;
alter table public.cash_accounts enable row level security;
alter table public.chart_of_accounts enable row level security;
alter table public.stock_receipts enable row level security;
alter table public.stock_receipt_items enable row level security;
alter table public.crop_sales enable row level security;
alter table public.crop_sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.party_ledger_entries enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.expense_entries enable row level security;
alter table public.income_entries enable row level security;

create policy "Users can view their own profile" on public.user_profiles for select to authenticated using (id = auth.uid());
create policy "Users can update their own profile" on public.user_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Authenticated shop users manage parties" on public.parties for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage products" on public.products for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage markets" on public.markets for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage cash accounts" on public.cash_accounts for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage chart accounts" on public.chart_of_accounts for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage stock receipts" on public.stock_receipts for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage receipt items" on public.stock_receipt_items for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage crop sales" on public.crop_sales for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage sale items" on public.crop_sale_items for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage inventory movements" on public.inventory_movements for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage party ledger" on public.party_ledger_entries for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage journals" on public.journal_entries for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage journal lines" on public.journal_lines for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage cash transactions" on public.cash_transactions for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage expenses" on public.expense_entries for all to authenticated using (true) with check (true);
create policy "Authenticated shop users manage income" on public.income_entries for all to authenticated using (true) with check (true);

grant select on public.v_cash_balances, public.v_party_balances, public.v_inventory_stock, public.v_trial_balance to authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- See supabase-finance-update.sql for the cash-posting function used by the app.
