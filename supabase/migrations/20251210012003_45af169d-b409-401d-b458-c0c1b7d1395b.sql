-- Tabela de categorias
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de subcategorias
CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(category_id, name)
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para usuários autenticados
CREATE POLICY "Authenticated users can read categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read subcategories"
ON public.subcategories FOR SELECT
TO authenticated
USING (true);

-- Inserir categorias
INSERT INTO public.categories (name) VALUES
('Moradia'),
('Mercado e Alimentação'),
('Transporte'),
('Alimentação Fora de Casa'),
('Saúde'),
('Pets'),
('Lazer e Vida Social'),
('Assinaturas e Serviços'),
('Trabalho / Estudos'),
('Finanças e Obrigações'),
('Casa e Decoração'),
('Outros');

-- Inserir subcategorias (Moradia)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Aluguel', 'Condomínio', 'Luz', 'Água', 'Internet', 'Gás', 'Manutenção da casa', 'Seguro residencial'])
FROM public.categories WHERE name = 'Moradia';

-- Inserir subcategorias (Mercado e Alimentação)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Supermercado', 'Hortifruti', 'Açougue', 'Padaria', 'Feira', 'Compras do mês', 'Compras rápidas'])
FROM public.categories WHERE name = 'Mercado e Alimentação';

-- Inserir subcategorias (Transporte)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Gasolina', 'Uber / Táxi', 'Estacionamento', 'Manutenção do carro', 'Seguro do carro', 'IPVA', 'Transportes públicos'])
FROM public.categories WHERE name = 'Transporte';

-- Inserir subcategorias (Alimentação Fora de Casa)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Restaurante', 'Lanches', 'Delivery', 'Cafeteria'])
FROM public.categories WHERE name = 'Alimentação Fora de Casa';

-- Inserir subcategorias (Saúde)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Farmácia', 'Médico', 'Exames', 'Terapia', 'Plano de saúde'])
FROM public.categories WHERE name = 'Saúde';

-- Inserir subcategorias (Pets)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Ração', 'Pet shop', 'Veterinário', 'Remédios'])
FROM public.categories WHERE name = 'Pets';

-- Inserir subcategorias (Lazer e Vida Social)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Viagens', 'Passeios', 'Festas', 'Cinema / Shows', 'Presentes'])
FROM public.categories WHERE name = 'Lazer e Vida Social';

-- Inserir subcategorias (Assinaturas e Serviços)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Streaming', 'Academia', 'Apps pagos', 'Armazenamento em nuvem'])
FROM public.categories WHERE name = 'Assinaturas e Serviços';

-- Inserir subcategorias (Trabalho / Estudos)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Material de trabalho', 'Cursos', 'Mensalidades', 'Ferramentas'])
FROM public.categories WHERE name = 'Trabalho / Estudos';

-- Inserir subcategorias (Finanças e Obrigações)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Cartão de crédito', 'Banco / taxas', 'Impostos', 'Investimentos', 'Reserva de emergência'])
FROM public.categories WHERE name = 'Finanças e Obrigações';

-- Inserir subcategorias (Casa e Decoração)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Móveis', 'Eletrodomésticos', 'Utensílios domésticos', 'Decoração'])
FROM public.categories WHERE name = 'Casa e Decoração';

-- Inserir subcategorias (Outros)
INSERT INTO public.subcategories (category_id, name)
SELECT id, unnest(ARRAY['Diversos', 'Sem categoria'])
FROM public.categories WHERE name = 'Outros';