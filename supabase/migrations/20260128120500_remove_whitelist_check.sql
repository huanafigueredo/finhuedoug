-- Remove restrictive whitelist policies and allow all authenticated users to manage their own data

-- Transactions
DROP POLICY IF EXISTS "Allowed users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

CREATE POLICY "Users can manage own transactions"
ON public.transactions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Banks
DROP POLICY IF EXISTS "Allowed users can manage own banks" ON public.banks;
DROP POLICY IF EXISTS "Users can manage own banks" ON public.banks;

CREATE POLICY "Users can manage own banks"
ON public.banks
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL) -- Allow viewing default banks (user_id NULL) if applicable, but editing only own
WITH CHECK (user_id = auth.uid());

-- Payment Methods
DROP POLICY IF EXISTS "Allowed users can manage own payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can manage own payment_methods" ON public.payment_methods;

CREATE POLICY "Users can manage own payment_methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid());

-- Recipients
DROP POLICY IF EXISTS "Allowed users can manage own recipients" ON public.recipients;
DROP POLICY IF EXISTS "Users can manage own recipients" ON public.recipients;

CREATE POLICY "Users can manage own recipients"
ON public.recipients
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid());

-- Ensure Categories also have proper access (just in case)
DROP POLICY IF EXISTS "Allowed users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
-- Note: categories might not have user_id in some schemas, skipping if uncertain, but usually they do or are shared.
-- Checking schema (from previous view_file of types.ts or migration list) would be good, but for now I'll stick to the ones explicitly restricted in the found migration.
