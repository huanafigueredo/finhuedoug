-- Add NOT NULL constraint to account_id to ensure it's always set
-- This prevents any possibility of transactions without proper account association
-- The trigger set_transaction_account_id already populates this from user profile

-- First verify all existing records have account_id (they do - 179/179)
-- Then add the NOT NULL constraint
ALTER TABLE public.transactions 
ALTER COLUMN account_id SET NOT NULL;