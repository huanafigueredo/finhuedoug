-- 1. Adicionar categoria "Reservas e Metas" (type: expense)
INSERT INTO categories (name, type) VALUES ('Reservas e Metas', 'expense')
ON CONFLICT DO NOTHING;

-- 2. Adicionar subcategorias para "Reservas e Metas"
INSERT INTO subcategories (name, category_id)
SELECT 'Meta de Economia', id FROM categories WHERE name = 'Reservas e Metas'
ON CONFLICT DO NOTHING;

INSERT INTO subcategories (name, category_id)
SELECT 'Reserva de Emergência', id FROM categories WHERE name = 'Reservas e Metas'
ON CONFLICT DO NOTHING;

INSERT INTO subcategories (name, category_id)
SELECT 'Investimentos', id FROM categories WHERE name = 'Reservas e Metas'
ON CONFLICT DO NOTHING;

-- 3. Adicionar coluna savings_deposit_id na tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS savings_deposit_id uuid REFERENCES savings_deposits(id) ON DELETE CASCADE;

-- 4. Adicionar coluna transaction_id na tabela savings_deposits
ALTER TABLE savings_deposits 
ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL;