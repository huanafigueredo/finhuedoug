-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela de recorrências (regras de contas recorrentes)
CREATE TABLE public.recorrencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'expense',
  categoria TEXT,
  subcategoria TEXT,
  pessoa TEXT,
  para_quem TEXT,
  valor_padrao NUMERIC NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  data_inicio DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao_padrao TEXT,
  lembrete_7_dias BOOLEAN NOT NULL DEFAULT false,
  lembrete_3_dias BOOLEAN NOT NULL DEFAULT false,
  lembrete_1_dia BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recorrencias ENABLE ROW LEVEL SECURITY;

-- RLS policies for recorrencias
CREATE POLICY "recorrencias_select_owner" ON public.recorrencias
FOR SELECT USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "recorrencias_insert_owner" ON public.recorrencias
FOR INSERT WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "recorrencias_update_owner" ON public.recorrencias
FOR UPDATE USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()))
WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "recorrencias_delete_owner" ON public.recorrencias
FOR DELETE USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_recorrencias_updated_at
BEFORE UPDATE ON public.recorrencias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de contas agendadas (instâncias mensais)
CREATE TABLE public.contas_agendadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorrencia_id UUID NOT NULL REFERENCES public.recorrencias(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  data_vencimento DATE NOT NULL,
  valor NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'ignorado')),
  confirmado_em TIMESTAMP WITH TIME ZONE,
  lancamento_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contas_agendadas ENABLE ROW LEVEL SECURITY;

-- RLS policies for contas_agendadas
CREATE POLICY "contas_agendadas_select_owner" ON public.contas_agendadas
FOR SELECT USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "contas_agendadas_insert_owner" ON public.contas_agendadas
FOR INSERT WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "contas_agendadas_update_owner" ON public.contas_agendadas
FOR UPDATE USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()))
WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "contas_agendadas_delete_owner" ON public.contas_agendadas
FOR DELETE USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_contas_agendadas_updated_at
BEFORE UPDATE ON public.contas_agendadas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos na tabela transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS conta_agendada_id UUID REFERENCES public.contas_agendadas(id) ON DELETE SET NULL;

-- Index para performance
CREATE INDEX idx_contas_agendadas_status ON public.contas_agendadas(status);
CREATE INDEX idx_contas_agendadas_data_vencimento ON public.contas_agendadas(data_vencimento);
CREATE INDEX idx_contas_agendadas_recorrencia ON public.contas_agendadas(recorrencia_id);
CREATE INDEX idx_recorrencias_ativo ON public.recorrencias(ativo);