-- Tabela de Bancos
CREATE TABLE public.banks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Formas de Pagamento
CREATE TABLE public.payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Destinatários (Para Quem)
CREATE TABLE public.recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (app com senha compartilhada)
CREATE POLICY "Allow all access to banks" ON public.banks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to recipients" ON public.recipients FOR ALL USING (true) WITH CHECK (true);

-- Inserir Bancos
INSERT INTO public.banks (name, color) VALUES
  ('Inter', '#FF7F00'),
  ('Mercado Pago', '#00BCFF'),
  ('Nubank', '#9B59B6'),
  ('Itaú', '#003399');

-- Inserir Formas de Pagamento
INSERT INTO public.payment_methods (name) VALUES
  ('Débito'),
  ('Crédito'),
  ('Pix'),
  ('Dinheiro'),
  ('Transferência'),
  ('Linha de Crédito');

-- Inserir Destinatários
INSERT INTO public.recipients (name) VALUES
  ('Huana'),
  ('Douglas'),
  ('Casal'),
  ('Empresa');