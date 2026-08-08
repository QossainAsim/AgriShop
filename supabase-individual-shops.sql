-- INDIVIDUAL PRIVATE SHOPS
-- Run this once in Supabase SQL Editor AFTER the base schema and workflow SQL files.
-- This intentionally clears the current test business records and system accounts.
-- It does NOT delete Supabase Auth users.

delete from public.journal_lines;
delete from public.cash_transactions;
delete from public.party_ledger_entries;
delete from public.inventory_movements;
delete from public.crop_sale_items;
delete from public.crop_sales;
delete from public.stock_receipt_items;
delete from public.stock_receipts;
delete from public.expense_entries;
delete from public.income_entries;
delete from public.journal_entries;
delete from public.parties;
delete from public.products;
delete from public.markets;
delete from public.cash_accounts;
delete from public.chart_of_accounts;

alter table public.parties add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.products add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.markets add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.cash_accounts add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.chart_of_accounts add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.stock_receipts add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.stock_receipt_items add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.crop_sales add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.crop_sale_items add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.inventory_movements add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.party_ledger_entries add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.journal_entries add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.journal_lines add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.cash_transactions add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.expense_entries add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.income_entries add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.parties alter column owner_id set default auth.uid();
alter table public.products alter column owner_id set default auth.uid();
alter table public.markets alter column owner_id set default auth.uid();
alter table public.cash_accounts alter column owner_id set default auth.uid();
alter table public.chart_of_accounts alter column owner_id set default auth.uid();
alter table public.stock_receipts alter column owner_id set default auth.uid();
alter table public.stock_receipt_items alter column owner_id set default auth.uid();
alter table public.crop_sales alter column owner_id set default auth.uid();
alter table public.crop_sale_items alter column owner_id set default auth.uid();
alter table public.inventory_movements alter column owner_id set default auth.uid();
alter table public.party_ledger_entries alter column owner_id set default auth.uid();
alter table public.journal_entries alter column owner_id set default auth.uid();
alter table public.journal_lines alter column owner_id set default auth.uid();
alter table public.cash_transactions alter column owner_id set default auth.uid();
alter table public.expense_entries alter column owner_id set default auth.uid();
alter table public.income_entries alter column owner_id set default auth.uid();

alter table public.parties alter column owner_id set not null;
alter table public.products alter column owner_id set not null;
alter table public.markets alter column owner_id set not null;
alter table public.cash_accounts alter column owner_id set not null;
alter table public.chart_of_accounts alter column owner_id set not null;
alter table public.stock_receipts alter column owner_id set not null;
alter table public.stock_receipt_items alter column owner_id set not null;
alter table public.crop_sales alter column owner_id set not null;
alter table public.crop_sale_items alter column owner_id set not null;
alter table public.inventory_movements alter column owner_id set not null;
alter table public.party_ledger_entries alter column owner_id set not null;
alter table public.journal_entries alter column owner_id set not null;
alter table public.journal_lines alter column owner_id set not null;
alter table public.cash_transactions alter column owner_id set not null;
alter table public.expense_entries alter column owner_id set not null;
alter table public.income_entries alter column owner_id set not null;

alter table public.parties drop constraint if exists parties_name_phone_key;
alter table public.products drop constraint if exists products_name_key;
alter table public.markets drop constraint if exists markets_name_key;
alter table public.cash_accounts drop constraint if exists cash_accounts_name_key;
alter table public.cash_accounts drop constraint if exists cash_accounts_account_code_key;
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_code_key;
alter table public.chart_of_accounts drop constraint if exists chart_of_accounts_name_key;
alter table public.parties add constraint parties_owner_name_phone_key unique (owner_id, name, phone);
alter table public.products add constraint products_owner_name_key unique (owner_id, name);
alter table public.markets add constraint markets_owner_name_key unique (owner_id, name);
alter table public.cash_accounts add constraint cash_accounts_owner_name_key unique (owner_id, name);
alter table public.cash_accounts add constraint cash_accounts_owner_code_key unique (owner_id, account_code);
alter table public.chart_of_accounts add constraint chart_accounts_owner_code_key unique (owner_id, code);
alter table public.chart_of_accounts add constraint chart_accounts_owner_name_key unique (owner_id, name);

create or replace function public.bootstrap_personal_shop(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.cash_accounts (owner_id, name, account_code, is_cash_in_hand)
  values (p_user_id, 'Cash in Hand', '1000', true)
  on conflict (owner_id, account_code) do nothing;
  insert into public.chart_of_accounts (owner_id, code, name, account_type, is_system)
  values
    (p_user_id,'1000','Cash in Hand','asset',true),(p_user_id,'1010','Bank','asset',true),
    (p_user_id,'1100','Crop Inventory','asset',true),(p_user_id,'1200','Accounts Receivable','asset',true),
    (p_user_id,'1210','Advances to Parties','asset',true),(p_user_id,'2000','Accounts Payable','liability',true),
    (p_user_id,'2100','Borrowings Payable','liability',true),(p_user_id,'3000','Owner Capital','equity',true),
    (p_user_id,'4000','Crop Sales','income',true),(p_user_id,'4100','Commission Income','income',true),
    (p_user_id,'4200','Other Income','income',true),(p_user_id,'5000','Cost of Goods Sold','expense',true),
    (p_user_id,'5100','Labour Expense','expense',true),(p_user_id,'5200','Salary Expense','expense',true),
    (p_user_id,'5300','Market Fee Expense','expense',true),(p_user_id,'5400','Operating Expense','expense',true)
  on conflict (owner_id, code) do nothing;
end;
$$;

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', '')) on conflict (id) do nothing;
  perform public.bootstrap_personal_shop(new.id);
  return new;
end;
$$;

insert into public.user_profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', '') from auth.users
on conflict (id) do nothing;
select public.bootstrap_personal_shop(id) from auth.users;

drop policy if exists "Authenticated shop users manage parties" on public.parties;
drop policy if exists "Authenticated shop users manage products" on public.products;
drop policy if exists "Authenticated shop users manage markets" on public.markets;
drop policy if exists "Authenticated shop users manage cash accounts" on public.cash_accounts;
drop policy if exists "Authenticated shop users manage chart accounts" on public.chart_of_accounts;
drop policy if exists "Authenticated shop users manage stock receipts" on public.stock_receipts;
drop policy if exists "Authenticated shop users manage receipt items" on public.stock_receipt_items;
drop policy if exists "Authenticated shop users manage crop sales" on public.crop_sales;
drop policy if exists "Authenticated shop users manage sale items" on public.crop_sale_items;
drop policy if exists "Authenticated shop users manage inventory movements" on public.inventory_movements;
drop policy if exists "Authenticated shop users manage party ledger" on public.party_ledger_entries;
drop policy if exists "Authenticated shop users manage journals" on public.journal_entries;
drop policy if exists "Authenticated shop users manage journal lines" on public.journal_lines;
drop policy if exists "Authenticated shop users manage cash transactions" on public.cash_transactions;
drop policy if exists "Authenticated shop users manage expenses" on public.expense_entries;
drop policy if exists "Authenticated shop users manage income" on public.income_entries;

do $$ declare t text; begin
  foreach t in array array['parties','products','markets','cash_accounts','chart_of_accounts','stock_receipts','stock_receipt_items','crop_sales','crop_sale_items','inventory_movements','party_ledger_entries','journal_entries','journal_lines','cash_transactions','expense_entries','income_entries'] loop
    execute format('create policy "Users manage their own %s" on public.%I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t, t);
  end loop;
end $$;

create or replace view public.v_cash_balances with (security_invoker = true) as
select account.id as cash_account_id, account.name as cash_account, coalesce(sum(case when transaction.direction = 'in' then transaction.amount else -transaction.amount end), 0) as balance
from public.cash_accounts account left join public.cash_transactions transaction on transaction.cash_account_id = account.id
group by account.id, account.name;
create or replace view public.v_party_balances with (security_invoker = true) as
select party.id as party_id, party.name as party_name, coalesce(sum(case when entry.balance_type='receivable' and entry.effect='increase' then entry.amount when entry.balance_type='receivable' then -entry.amount else 0 end),0) as amount_to_receive, coalesce(sum(case when entry.balance_type='payable' and entry.effect='increase' then entry.amount when entry.balance_type='payable' then -entry.amount else 0 end),0) as amount_to_pay
from public.parties party left join public.party_ledger_entries entry on entry.party_id=party.id group by party.id,party.name;
create or replace view public.v_inventory_stock with (security_invoker = true) as
select product.id as product_id, product.name as product_name, coalesce(sum(movement.quantity_in_kg-movement.quantity_out_kg),0) as stock_kg, product.minimum_stock_kg
from public.products product left join public.inventory_movements movement on movement.product_id=product.id group by product.id,product.name,product.minimum_stock_kg;
