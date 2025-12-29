-- Criar tabela de metas de economia
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_amount INTEGER NOT NULL, -- em centavos
  current_amount INTEGER NOT NULL DEFAULT 0, -- em centavos
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- Policies de segurança
CREATE POLICY "savings_goals_select_owner" ON public.savings_goals
  FOR SELECT USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "savings_goals_insert_owner" ON public.savings_goals
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "savings_goals_update_owner" ON public.savings_goals
  FOR UPDATE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "savings_goals_delete_owner" ON public.savings_goals
  FOR DELETE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_savings_goals_updated_at
  BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();