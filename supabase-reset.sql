-- WARNING: Run this only in the newly created, EMPTY Supabase project.
-- It permanently removes the incorrect automobile tables. Immediately after it
-- succeeds, run supabase-schema.sql in a new SQL Editor query.

drop table if exists public.sales cascade;
drop table if exists public.parts cascade;
drop table if exists public.suppliers cascade;
drop table if exists public.categories cascade;

drop table if exists public.income_entries cascade;
drop table if exists public.expense_entries cascade;
drop table if exists public.cash_transactions cascade;
drop table if exists public.journal_lines cascade;
drop table if exists public.journal_entries cascade;
drop table if exists public.party_ledger_entries cascade;
drop table if exists public.inventory_movements cascade;
drop table if exists public.crop_sale_items cascade;
drop table if exists public.crop_sales cascade;
drop table if exists public.stock_receipt_items cascade;
drop table if exists public.stock_receipts cascade;
drop table if exists public.chart_of_accounts cascade;
drop table if exists public.cash_accounts cascade;
drop table if exists public.markets cascade;
drop table if exists public.products cascade;
drop table if exists public.parties cascade;
drop table if exists public.user_profiles cascade;

drop type if exists public.account_type cascade;
drop type if exists public.balance_effect cascade;
drop type if exists public.party_balance_type cascade;
drop type if exists public.cash_direction cascade;
drop type if exists public.stock_source cascade;
drop type if exists public.party_role cascade;
drop type if exists public.quantity_unit cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.create_user_profile();
drop function if exists public.set_updated_at();
