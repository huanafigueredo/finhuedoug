-- Remove the redundant transactions_delete_owner policy
-- All access should go through account_members for consistency
DROP POLICY IF EXISTS "transactions_delete_owner" ON public.transactions;

-- Verify the remaining policies are correctly configured
-- The account_members-based policies already cover all operations:
-- - transactions_select_for_members (SELECT)
-- - transactions_insert_for_members (INSERT)
-- - transactions_update_for_members (UPDATE)
-- - transactions_delete_for_members (DELETE)