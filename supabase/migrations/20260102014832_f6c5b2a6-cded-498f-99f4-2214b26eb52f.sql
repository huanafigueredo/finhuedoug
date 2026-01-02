-- Drop existing INSERT/UPDATE/DELETE policies that don't protect system records
DROP POLICY IF EXISTS "Users can insert own payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update own payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment_methods" ON public.payment_methods;

-- Recreate policies with proper protection for system records (user_id IS NULL)

-- INSERT: Ensure user_id is always set to the current user (prevents inserting system records)
CREATE POLICY "Users can insert own payment_methods"
ON public.payment_methods FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Only allow updating records owned by the current user (not system records)
CREATE POLICY "Users can update own payment_methods"
ON public.payment_methods FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Only allow deleting records owned by the current user (not system records)
CREATE POLICY "Users can delete own payment_methods"
ON public.payment_methods FOR DELETE
USING (user_id = auth.uid());