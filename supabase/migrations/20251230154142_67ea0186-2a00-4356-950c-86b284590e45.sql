-- Tabela para histórico de rankings mensais
CREATE TABLE public.monthly_financial_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Dados financeiros pessoa 1
  person1_expenses INTEGER NOT NULL DEFAULT 0,
  person1_savings INTEGER NOT NULL DEFAULT 0,
  person1_balance INTEGER NOT NULL DEFAULT 0,
  
  -- Dados financeiros pessoa 2
  person2_expenses INTEGER NOT NULL DEFAULT 0,
  person2_savings INTEGER NOT NULL DEFAULT 0,
  person2_balance INTEGER NOT NULL DEFAULT 0,
  
  -- Vencedores por categoria
  spending_winner TEXT, -- 'person1', 'person2', 'tie'
  savings_winner TEXT,
  balance_winner TEXT,
  overall_winner TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_financial_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "monthly_financial_rankings_select_owner" 
ON public.monthly_financial_rankings 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "monthly_financial_rankings_insert_owner" 
ON public.monthly_financial_rankings 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_financial_rankings_update_owner" 
ON public.monthly_financial_rankings 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_monthly_financial_rankings_updated_at
BEFORE UPDATE ON public.monthly_financial_rankings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();