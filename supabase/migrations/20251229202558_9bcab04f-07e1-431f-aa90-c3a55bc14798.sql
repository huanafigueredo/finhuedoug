-- Adicionar campo owner para identificar a quem pertence a meta (person1, person2, couple)
ALTER TABLE public.savings_goals 
ADD COLUMN owner TEXT NOT NULL DEFAULT 'couple';

-- Criar tabela para registrar depósitos individuais nas metas
CREATE TABLE public.savings_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- em centavos
  deposited_by TEXT NOT NULL, -- 'person1' ou 'person2'
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_deposits ENABLE ROW LEVEL SECURITY;

-- Policies para savings_deposits
CREATE POLICY "savings_deposits_select_owner" 
ON public.savings_deposits 
FOR SELECT 
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "savings_deposits_insert_owner" 
ON public.savings_deposits 
FOR INSERT 
WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "savings_deposits_update_owner" 
ON public.savings_deposits 
FOR UPDATE 
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()))
WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "savings_deposits_delete_owner" 
ON public.savings_deposits 
FOR DELETE 
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));