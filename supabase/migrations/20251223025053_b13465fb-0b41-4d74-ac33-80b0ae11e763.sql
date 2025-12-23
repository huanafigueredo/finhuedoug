-- Adicionar campos de forma de pagamento e instituição financeira na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS forma_pagamento text,
ADD COLUMN IF NOT EXISTS instituicao text,
ADD COLUMN IF NOT EXISTS cartao text;

-- Criar índices para melhor performance nas consultas do chat
CREATE INDEX IF NOT EXISTS idx_transactions_forma_pagamento ON public.transactions(forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_transactions_instituicao ON public.transactions(instituicao);

-- Comentários para documentação
COMMENT ON COLUMN public.transactions.forma_pagamento IS 'Forma de pagamento: credito, debito, pix, dinheiro, boleto';
COMMENT ON COLUMN public.transactions.instituicao IS 'Instituição financeira: nubank, inter, itau, etc';
COMMENT ON COLUMN public.transactions.cartao IS 'Nome do cartão (opcional)';