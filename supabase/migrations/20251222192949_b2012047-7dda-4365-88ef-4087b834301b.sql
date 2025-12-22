-- Add observacao column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN observacao TEXT;

-- Add a check constraint for max length (1500 characters)
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_observacao_max_length 
CHECK (char_length(observacao) <= 1500);