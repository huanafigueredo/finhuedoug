-- Corrigir valores de transações de depósitos de metas que estão em centavos
UPDATE public.transactions 
SET total_value = total_value / 100
WHERE savings_deposit_id IS NOT NULL 
  AND total_value >= 100; -- Apenas valores que parecem estar em centavos