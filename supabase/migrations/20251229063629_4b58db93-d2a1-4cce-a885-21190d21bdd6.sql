-- Criar tabela de orçamentos por categoria
CREATE TABLE public.category_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  budget_amount INTEGER NOT NULL, -- em centavos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Habilitar RLS
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

-- Policies de segurança
CREATE POLICY "budget_select_owner" ON public.category_budgets
  FOR SELECT USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "budget_insert_owner" ON public.category_budgets
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "budget_update_owner" ON public.category_budgets
  FOR UPDATE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "budget_delete_owner" ON public.category_budgets
  FOR DELETE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_category_budgets_updated_at
  BEFORE UPDATE ON public.category_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();