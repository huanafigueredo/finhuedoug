-- Make user_id nullable to allow system-wide defaults
ALTER TABLE public.banks ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.payment_methods ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.recipients ALTER COLUMN user_id DROP NOT NULL;

-- Insert system-wide banks (user_id = null means available to all)
INSERT INTO public.banks (name, color, user_id) VALUES
  ('Inter', '#FF7A00', null),
  ('Mercado Pago', '#00BCFF', null),
  ('Nubank', '#820AD1', null),
  ('Itaú', '#003399', null);

-- Insert system-wide payment methods
INSERT INTO public.payment_methods (name, user_id) VALUES
  ('Cartão de Crédito', null),
  ('Cartão de Débito', null),
  ('PIX', null),
  ('Dinheiro', null),
  ('Boleto', null),
  ('Transferência', null),
  ('Linha de Crédito', null);

-- Insert system-wide recipients (para quem)
INSERT INTO public.recipients (name, user_id) VALUES
  ('Empresa', null),
  ('Huana', null),
  ('Douglas', null),
  ('Casal', null);

-- Update RLS policies to allow reading system-wide items (where user_id is null)

-- Banks: drop existing policy and create separate read + manage policies
DROP POLICY IF EXISTS "Allowed users can manage own banks" ON public.banks;

CREATE POLICY "Anyone can read system banks" ON public.banks
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Allowed users can read own banks" ON public.banks
  FOR SELECT USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can insert own banks" ON public.banks
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can update own banks" ON public.banks
  FOR UPDATE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can delete own banks" ON public.banks
  FOR DELETE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

-- Payment methods: drop existing policy and create separate read + manage policies
DROP POLICY IF EXISTS "Allowed users can manage own payment_methods" ON public.payment_methods;

CREATE POLICY "Anyone can read system payment_methods" ON public.payment_methods
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Allowed users can read own payment_methods" ON public.payment_methods
  FOR SELECT USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can insert own payment_methods" ON public.payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can update own payment_methods" ON public.payment_methods
  FOR UPDATE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can delete own payment_methods" ON public.payment_methods
  FOR DELETE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

-- Recipients: drop existing policy and create separate read + manage policies
DROP POLICY IF EXISTS "Allowed users can manage own recipients" ON public.recipients;

CREATE POLICY "Anyone can read system recipients" ON public.recipients
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Allowed users can read own recipients" ON public.recipients
  FOR SELECT USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can insert own recipients" ON public.recipients
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can update own recipients" ON public.recipients
  FOR UPDATE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can delete own recipients" ON public.recipients
  FOR DELETE USING (user_id = auth.uid() AND is_allowed_user(auth.uid()));