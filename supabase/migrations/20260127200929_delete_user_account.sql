-- Create a function to securely delete a user account and all related data
-- This runs in a transaction, so if anything fails, nothing is deleted
create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_account_id uuid;
begin
  -- Get the ID of the executing user
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Get the account_id associated with the user profile (if any)
  select account_id into v_account_id
  from profiles
  where id = v_user_id;

  -- Delete data in order of dependency (child tables first)

  -- 1. Transaction related items
  delete from itens_lancamento where user_id = v_user_id;
  delete from comprovantes_lancamento where user_id = v_user_id;
  
  -- 2. Savings related
  delete from savings_deposits where user_id = v_user_id;
  delete from savings_goals where user_id = v_user_id;
  
  -- 3. Recurring and scheduled
  delete from contas_agendadas where user_id = v_user_id;
  delete from recorrencias where user_id = v_user_id;
  
  -- 4. Budgets and Limits config
  delete from category_splits where user_id = v_user_id;
  delete from category_budgets where user_id = v_user_id;
  delete from split_settings where user_id = v_user_id;
  
  -- 5. Gamification (if exists)
  delete from user_rewards where user_id = v_user_id;
  delete from user_challenges where user_id = v_user_id;
  delete from user_achievements where user_id = v_user_id;
  delete from user_gamification where user_id = v_user_id;
  delete from monthly_xp where user_id = v_user_id;
  delete from monthly_financial_rankings where user_id = v_user_id;
  
  -- 6. User settings and configuration
  delete from couple_members where user_id = v_user_id;
  delete from banks where user_id = v_user_id;
  delete from payment_methods where user_id = v_user_id;
  delete from recipients where user_id = v_user_id;
  delete from user_settings where user_id = v_user_id;
  
  -- 7. Account level data (if account_exists)
  -- Note: This assumes 1:1 user-account or that the user deleting is the owner
  -- Adjust logic if multi-user accounts are fully implemented
  if v_account_id is not null then
    delete from transactions where account_id = v_account_id;
    delete from account_members where account_id = v_account_id;
    delete from accounts where id = v_account_id;
  end if;

  -- 8. Profile (this usually triggers auth.users deletion if cascading is set up, but let's be explicit about app data)
  delete from profiles where id = v_user_id;

  -- Note: We cannot delete from auth.users directly from a function unless we use supabase admin API
  -- The client side should handle signOut();
end;
$$;
