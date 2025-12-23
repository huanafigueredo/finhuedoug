-- Add column to save the value input mode (total or installment)
ALTER TABLE public.transactions 
ADD COLUMN modo_valor_informado text DEFAULT 'total';