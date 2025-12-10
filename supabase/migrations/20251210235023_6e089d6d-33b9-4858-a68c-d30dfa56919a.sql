-- Add type column to categories table
ALTER TABLE public.categories 
ADD COLUMN type text NOT NULL DEFAULT 'expense';

-- Update existing categories to be expense type (they already have the default)
-- No update needed since default is 'expense'

-- Insert income categories
INSERT INTO public.categories (name, type) VALUES
  ('Salário', 'income'),
  ('Freelancer', 'income'),
  ('Pix', 'income'),
  ('Juros', 'income'),
  ('Cashback', 'income'),
  ('Presentes', 'income'),
  ('Reembolso', 'income'),
  ('Investimentos', 'income'),
  ('Outros Rendimentos', 'income');