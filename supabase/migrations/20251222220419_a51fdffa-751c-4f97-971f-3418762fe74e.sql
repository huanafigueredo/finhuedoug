-- Storage bucket para comprovantes (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false);

-- Políticas de storage para comprovantes
CREATE POLICY "Users can upload own comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own comprovantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own comprovantes"
ON storage.objects FOR DELETE
USING (bucket_id = 'comprovantes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tabela comprovantes_lancamento
CREATE TABLE public.comprovantes_lancamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  nfe_qr_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para comprovantes_lancamento
ALTER TABLE public.comprovantes_lancamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comprovantes_select_owner"
ON public.comprovantes_lancamento FOR SELECT
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "comprovantes_insert_owner"
ON public.comprovantes_lancamento FOR INSERT
WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "comprovantes_delete_owner"
ON public.comprovantes_lancamento FOR DELETE
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

-- Tabela itens_lancamento
CREATE TABLE public.itens_lancamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nome_item TEXT NOT NULL,
  quantidade NUMERIC,
  valor NUMERIC,
  categoria_item TEXT,
  confirmado BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para itens_lancamento
ALTER TABLE public.itens_lancamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itens_select_owner"
ON public.itens_lancamento FOR SELECT
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "itens_insert_owner"
ON public.itens_lancamento FOR INSERT
WITH CHECK ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "itens_update_owner"
ON public.itens_lancamento FOR UPDATE
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

CREATE POLICY "itens_delete_owner"
ON public.itens_lancamento FOR DELETE
USING ((user_id = auth.uid()) AND is_allowed_user(auth.uid()));

-- Adicionar campos na tabela transactions
ALTER TABLE public.transactions
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN resumo_curto TEXT,
ADD COLUMN status_extracao TEXT DEFAULT 'nao_iniciado';