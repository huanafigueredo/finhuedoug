-- Block all INSERT operations on account_members
-- Account membership is created automatically by handle_new_user() trigger
CREATE POLICY "block_direct_insert_account_members"
ON public.account_members
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Block all UPDATE operations on account_members
CREATE POLICY "block_direct_update_account_members"
ON public.account_members
FOR UPDATE
TO authenticated
USING (false);

-- Block all DELETE operations on account_members
CREATE POLICY "block_direct_delete_account_members"
ON public.account_members
FOR DELETE
TO authenticated
USING (false);