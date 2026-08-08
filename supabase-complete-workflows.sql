-- Final operational workflows. Run once after the earlier cash and crop SQL files.
create or replace function public.record_crop_sale(p_date date, p_buyer_id uuid, p_product_id uuid, p_quantity numeric, p_unit public.quantity_unit, p_quantity_kg numeric, p_rate numeric, p_received numeric default 0, p_cash_account_id uuid default null, p_notes text default null) returns uuid language plpgsql as $$
declare v_total numeric := p_quantity*p_rate; v_sale uuid; v_item uuid; v_journal uuid; v_cash_code text; v_cash_account uuid; v_sales uuid; v_ar uuid; v_inventory uuid; v_cogs uuid; v_cost numeric;
begin
 if p_quantity<=0 or p_quantity_kg<=0 or p_rate<0 or p_received<0 or p_received>v_total then raise exception 'Check quantity, rate, and received amount'; end if;
 if coalesce((select stock_kg from public.v_inventory_stock where product_id=p_product_id),0)<p_quantity_kg then raise exception 'Not enough crop in stock'; end if;
 insert into public.crop_sales(sale_date,buyer_id,total_amount,received_amount,notes) values(p_date,p_buyer_id,v_total,p_received,p_notes) returning id into v_sale;
 insert into public.crop_sale_items(sale_id,product_id,quantity,unit,quantity_kg,rate_per_unit,line_total) values(v_sale,p_product_id,p_quantity,p_unit,p_quantity_kg,p_rate,v_total) returning id into v_item;
 select coalesce(sum(quantity_in_kg*unit_cost_per_kg)/nullif(sum(quantity_in_kg),0),0) into v_cost from public.inventory_movements where product_id=p_product_id and quantity_in_kg>0;
 insert into public.inventory_movements(movement_date,product_id,quantity_out_kg,unit_cost_per_kg,source_type,source_id,notes) values(p_date,p_product_id,p_quantity_kg,v_cost,'crop_sale',v_item,p_notes);
 select id into v_sales from public.chart_of_accounts where code='4000'; select id into v_ar from public.chart_of_accounts where code='1200'; select id into v_inventory from public.chart_of_accounts where code='1100'; select id into v_cogs from public.chart_of_accounts where code='5000';
 if p_received>0 then select account_code into v_cash_code from public.cash_accounts where id=p_cash_account_id; select id into v_cash_account from public.chart_of_accounts where code=v_cash_code; end if;
 insert into public.journal_entries(entry_date,narration,source_type,source_id) values(p_date,coalesce(p_notes,'Crop sale'),'crop_sale',v_sale) returning id into v_journal;
 if p_received>0 then insert into public.journal_lines(journal_entry_id,account_id,party_id,debit,credit) values(v_journal,v_cash_account,p_buyer_id,p_received,0); insert into public.cash_transactions(transaction_date,cash_account_id,direction,amount,party_id,transaction_type,journal_entry_id,notes) values(p_date,p_cash_account_id,'in',p_received,p_buyer_id,'crop_sale',v_journal,p_notes); end if;
 if v_total-p_received>0 then insert into public.journal_lines(journal_entry_id,account_id,party_id,debit,credit) values(v_journal,v_ar,p_buyer_id,v_total-p_received,0); insert into public.party_ledger_entries(entry_date,party_id,balance_type,effect,amount,entry_type,source_type,source_id,notes) values(p_date,p_buyer_id,'receivable','increase',v_total-p_received,'crop_sale','crop_sale',v_sale,p_notes); end if;
 insert into public.journal_lines(journal_entry_id,account_id,credit) values(v_journal,v_sales,v_total); insert into public.journal_lines(journal_entry_id,account_id,debit) values(v_journal,v_cogs,p_quantity_kg*v_cost); insert into public.journal_lines(journal_entry_id,account_id,credit) values(v_journal,v_inventory,p_quantity_kg*v_cost); return v_sale;
end; $$;

create or replace function public.record_expense(p_date date,p_category text,p_party_id uuid,p_market_id uuid,p_amount numeric,p_paid numeric default 0,p_cash_account_id uuid default null,p_notes text default null) returns uuid language plpgsql as $$
declare v_expense uuid; v_journal uuid; v_cash_code text; v_cash_account uuid; v_expense_account uuid; v_payable uuid;
begin
 if p_amount<=0 or p_paid<0 or p_paid>p_amount then raise exception 'Check expense amounts'; end if;
 insert into public.expense_entries(expense_date,category,party_id,market_id,amount,paid_amount,notes) values(p_date,p_category,p_party_id,p_market_id,p_amount,p_paid,p_notes) returning id into v_expense;
 select id into v_expense_account from public.chart_of_accounts where code=case p_category when 'labour' then '5100' when 'salary' then '5200' when 'market_fee' then '5300' else '5400' end; select id into v_payable from public.chart_of_accounts where code='2000';
 if p_paid>0 then select account_code into v_cash_code from public.cash_accounts where id=p_cash_account_id; select id into v_cash_account from public.chart_of_accounts where code=v_cash_code; end if;
 insert into public.journal_entries(entry_date,narration,source_type,source_id) values(p_date,coalesce(p_notes,p_category),'expense',v_expense) returning id into v_journal; insert into public.journal_lines(journal_entry_id,account_id,debit) values(v_journal,v_expense_account,p_amount);
 if p_paid>0 then insert into public.journal_lines(journal_entry_id,account_id,credit) values(v_journal,v_cash_account,p_paid); insert into public.cash_transactions(transaction_date,cash_account_id,direction,amount,party_id,transaction_type,journal_entry_id,notes) values(p_date,p_cash_account_id,'out',p_paid,p_party_id,p_category,v_journal,p_notes); end if;
 if p_amount-p_paid>0 then insert into public.journal_lines(journal_entry_id,account_id,party_id,credit) values(v_journal,v_payable,p_party_id,p_amount-p_paid); if p_party_id is not null then insert into public.party_ledger_entries(entry_date,party_id,balance_type,effect,amount,entry_type,source_type,source_id,notes) values(p_date,p_party_id,'payable','increase',p_amount-p_paid,p_category,'expense',v_expense,p_notes); end if; end if; return v_expense;
end; $$;
grant execute on function public.record_crop_sale(date,uuid,uuid,numeric,public.quantity_unit,numeric,numeric,numeric,uuid,text) to authenticated;
grant execute on function public.record_expense(date,text,uuid,uuid,numeric,numeric,uuid,text) to authenticated;

create or replace function public.record_income(p_date date,p_category text,p_party_id uuid,p_amount numeric,p_received numeric default 0,p_cash_account_id uuid default null,p_notes text default null) returns uuid language plpgsql as $$
declare v_income uuid; v_journal uuid; v_cash_code text; v_cash_account uuid; v_income_account uuid; v_ar uuid;
begin
 if p_amount<=0 or p_received<0 or p_received>p_amount then raise exception 'Check income amounts'; end if;
 insert into public.income_entries(income_date,category,party_id,amount,received_amount,notes) values(p_date,p_category,p_party_id,p_amount,p_received,p_notes) returning id into v_income;
 select id into v_income_account from public.chart_of_accounts where code=case p_category when 'commission' then '4100' else '4200' end; select id into v_ar from public.chart_of_accounts where code='1200';
 if p_received>0 then select account_code into v_cash_code from public.cash_accounts where id=p_cash_account_id; select id into v_cash_account from public.chart_of_accounts where code=v_cash_code; end if;
 insert into public.journal_entries(entry_date,narration,source_type,source_id) values(p_date,coalesce(p_notes,p_category),'income',v_income) returning id into v_journal;
 if p_received>0 then insert into public.journal_lines(journal_entry_id,account_id,debit) values(v_journal,v_cash_account,p_received); insert into public.cash_transactions(transaction_date,cash_account_id,direction,amount,party_id,transaction_type,journal_entry_id,notes) values(p_date,p_cash_account_id,'in',p_received,p_party_id,p_category,v_journal,p_notes); end if;
 if p_amount-p_received>0 then insert into public.journal_lines(journal_entry_id,account_id,party_id,debit) values(v_journal,v_ar,p_party_id,p_amount-p_received); if p_party_id is not null then insert into public.party_ledger_entries(entry_date,party_id,balance_type,effect,amount,entry_type,source_type,source_id,notes) values(p_date,p_party_id,'receivable','increase',p_amount-p_received,p_category,'income',v_income,p_notes); end if; end if;
 insert into public.journal_lines(journal_entry_id,account_id,credit) values(v_journal,v_income_account,p_amount); return v_income;
end; $$;
grant execute on function public.record_income(date,text,uuid,numeric,numeric,uuid,text) to authenticated;
