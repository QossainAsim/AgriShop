-- Run this once in Supabase SQL Editor after supabase-schema.sql.
-- It records one cash action and its matching ledger/journal entries together.
create or replace function public.record_cash_movement(
  p_date date,
  p_cash_account_id uuid,
  p_direction public.cash_direction,
  p_amount numeric,
  p_party_id uuid default null,
  p_transaction_type text default 'cash_adjustment',
  p_counter_account_code text default '3000',
  p_balance_type public.party_balance_type default null,
  p_balance_effect public.balance_effect default null,
  p_notes text default null
) returns uuid language plpgsql as $$
declare
  v_cash_code text;
  v_cash_account uuid;
  v_counter_account uuid;
  v_journal_id uuid;
  v_cash_transaction_id uuid;
begin
  if p_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  select account_code into v_cash_code from public.cash_accounts where id = p_cash_account_id and is_active;
  if v_cash_code is null then raise exception 'Choose an active cash account'; end if;
  select id into v_cash_account from public.chart_of_accounts where code = v_cash_code;
  select id into v_counter_account from public.chart_of_accounts where code = p_counter_account_code;
  if v_cash_account is null or v_counter_account is null then raise exception 'Required accounting account is missing'; end if;
  if (p_balance_type is null) <> (p_balance_effect is null) then raise exception 'Ledger balance type and effect must be used together'; end if;
  insert into public.journal_entries (entry_date, narration, source_type) values (p_date, coalesce(p_notes, p_transaction_type), 'cash_transaction') returning id into v_journal_id;
  insert into public.journal_lines (journal_entry_id, account_id, party_id, debit, credit)
  values
    (v_journal_id, case when p_direction = 'in' then v_cash_account else v_counter_account end, p_party_id, case when p_direction = 'in' then p_amount else 0 end, case when p_direction = 'out' then p_amount else 0 end),
    (v_journal_id, case when p_direction = 'in' then v_counter_account else v_cash_account end, p_party_id, case when p_direction = 'out' then p_amount else 0 end, case when p_direction = 'in' then p_amount else 0 end);
  insert into public.cash_transactions (transaction_date, cash_account_id, direction, amount, party_id, transaction_type, journal_entry_id, notes)
  values (p_date, p_cash_account_id, p_direction, p_amount, p_party_id, p_transaction_type, v_journal_id, p_notes) returning id into v_cash_transaction_id;
  if p_party_id is not null and p_balance_type is not null then
    insert into public.party_ledger_entries (entry_date, party_id, balance_type, effect, amount, entry_type, source_type, source_id, notes)
    values (p_date, p_party_id, p_balance_type, p_balance_effect, p_amount, p_transaction_type, 'cash_transaction', v_cash_transaction_id, p_notes);
  end if;
  return v_cash_transaction_id;
end;
$$;
grant execute on function public.record_cash_movement(date, uuid, public.cash_direction, numeric, uuid, text, text, public.party_balance_type, public.balance_effect, text) to authenticated;
