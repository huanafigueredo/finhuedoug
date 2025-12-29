-- Add bank_id column to savings_goals table
ALTER TABLE public.savings_goals
ADD COLUMN bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL;