-- Remove is_allowed_user() restriction from all RLS policies
-- This allows any authenticated user to use the app

-- ============ BANKS ============
DROP POLICY IF EXISTS "Allowed users can delete own banks" ON public.banks;
DROP POLICY IF EXISTS "Allowed users can insert own banks" ON public.banks;
DROP POLICY IF EXISTS "Allowed users can read own banks" ON public.banks;
DROP POLICY IF EXISTS "Allowed users can update own banks" ON public.banks;

CREATE POLICY "Users can delete own banks" ON public.banks
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own banks" ON public.banks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own banks" ON public.banks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own banks" ON public.banks
  FOR UPDATE USING (user_id = auth.uid());

-- ============ PAYMENT_METHODS ============
DROP POLICY IF EXISTS "Allowed users can delete own payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allowed users can insert own payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allowed users can read own payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allowed users can update own payment_methods" ON public.payment_methods;

CREATE POLICY "Users can delete own payment_methods" ON public.payment_methods
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment_methods" ON public.payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own payment_methods" ON public.payment_methods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own payment_methods" ON public.payment_methods
  FOR UPDATE USING (user_id = auth.uid());

-- ============ RECIPIENTS ============
DROP POLICY IF EXISTS "Allowed users can delete own recipients" ON public.recipients;
DROP POLICY IF EXISTS "Allowed users can insert own recipients" ON public.recipients;
DROP POLICY IF EXISTS "Allowed users can read own recipients" ON public.recipients;
DROP POLICY IF EXISTS "Allowed users can update own recipients" ON public.recipients;

CREATE POLICY "Users can delete own recipients" ON public.recipients
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recipients" ON public.recipients
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own recipients" ON public.recipients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own recipients" ON public.recipients
  FOR UPDATE USING (user_id = auth.uid());

-- ============ CATEGORY_BUDGETS ============
DROP POLICY IF EXISTS "budget_delete_owner" ON public.category_budgets;
DROP POLICY IF EXISTS "budget_insert_owner" ON public.category_budgets;
DROP POLICY IF EXISTS "budget_select_owner" ON public.category_budgets;
DROP POLICY IF EXISTS "budget_update_owner" ON public.category_budgets;

CREATE POLICY "budget_delete_owner" ON public.category_budgets
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "budget_insert_owner" ON public.category_budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "budget_select_owner" ON public.category_budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "budget_update_owner" ON public.category_budgets
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ SAVINGS_GOALS ============
DROP POLICY IF EXISTS "savings_goals_delete_owner" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert_owner" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_select_owner" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_update_owner" ON public.savings_goals;

CREATE POLICY "savings_goals_delete_owner" ON public.savings_goals
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "savings_goals_insert_owner" ON public.savings_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "savings_goals_select_owner" ON public.savings_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "savings_goals_update_owner" ON public.savings_goals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ SAVINGS_DEPOSITS ============
DROP POLICY IF EXISTS "savings_deposits_delete_owner" ON public.savings_deposits;
DROP POLICY IF EXISTS "savings_deposits_insert_owner" ON public.savings_deposits;
DROP POLICY IF EXISTS "savings_deposits_select_owner" ON public.savings_deposits;
DROP POLICY IF EXISTS "savings_deposits_update_owner" ON public.savings_deposits;

CREATE POLICY "savings_deposits_delete_owner" ON public.savings_deposits
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "savings_deposits_insert_owner" ON public.savings_deposits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "savings_deposits_select_owner" ON public.savings_deposits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "savings_deposits_update_owner" ON public.savings_deposits
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ RECORRENCIAS ============
DROP POLICY IF EXISTS "recorrencias_delete_owner" ON public.recorrencias;
DROP POLICY IF EXISTS "recorrencias_insert_owner" ON public.recorrencias;
DROP POLICY IF EXISTS "recorrencias_select_owner" ON public.recorrencias;
DROP POLICY IF EXISTS "recorrencias_update_owner" ON public.recorrencias;

CREATE POLICY "recorrencias_delete_owner" ON public.recorrencias
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "recorrencias_insert_owner" ON public.recorrencias
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "recorrencias_select_owner" ON public.recorrencias
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "recorrencias_update_owner" ON public.recorrencias
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ CONTAS_AGENDADAS ============
DROP POLICY IF EXISTS "contas_agendadas_delete_owner" ON public.contas_agendadas;
DROP POLICY IF EXISTS "contas_agendadas_insert_owner" ON public.contas_agendadas;
DROP POLICY IF EXISTS "contas_agendadas_select_owner" ON public.contas_agendadas;
DROP POLICY IF EXISTS "contas_agendadas_update_owner" ON public.contas_agendadas;

CREATE POLICY "contas_agendadas_delete_owner" ON public.contas_agendadas
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "contas_agendadas_insert_owner" ON public.contas_agendadas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "contas_agendadas_select_owner" ON public.contas_agendadas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "contas_agendadas_update_owner" ON public.contas_agendadas
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ COMPROVANTES_LANCAMENTO ============
DROP POLICY IF EXISTS "comprovantes_delete_owner" ON public.comprovantes_lancamento;
DROP POLICY IF EXISTS "comprovantes_insert_owner" ON public.comprovantes_lancamento;
DROP POLICY IF EXISTS "comprovantes_select_owner" ON public.comprovantes_lancamento;

CREATE POLICY "comprovantes_delete_owner" ON public.comprovantes_lancamento
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "comprovantes_insert_owner" ON public.comprovantes_lancamento
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "comprovantes_select_owner" ON public.comprovantes_lancamento
  FOR SELECT USING (user_id = auth.uid());

-- ============ ITENS_LANCAMENTO ============
DROP POLICY IF EXISTS "itens_delete_owner" ON public.itens_lancamento;
DROP POLICY IF EXISTS "itens_insert_owner" ON public.itens_lancamento;
DROP POLICY IF EXISTS "itens_select_owner" ON public.itens_lancamento;
DROP POLICY IF EXISTS "itens_update_owner" ON public.itens_lancamento;

CREATE POLICY "itens_delete_owner" ON public.itens_lancamento
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "itens_insert_owner" ON public.itens_lancamento
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "itens_select_owner" ON public.itens_lancamento
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "itens_update_owner" ON public.itens_lancamento
  FOR UPDATE USING (user_id = auth.uid());

-- ============ CATEGORIES ============
DROP POLICY IF EXISTS "Allowed users can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Allowed users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allowed users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can read categories" ON public.categories;

CREATE POLICY "Authenticated users can read categories" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories" ON public.categories
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories" ON public.categories
  FOR DELETE USING (auth.uid() IS NOT NULL);