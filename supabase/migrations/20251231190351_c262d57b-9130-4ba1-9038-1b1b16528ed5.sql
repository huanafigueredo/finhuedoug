-- Add custom split percentage columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS custom_person1_percentage integer,
ADD COLUMN IF NOT EXISTS custom_person2_percentage integer;

-- Add a constraint to ensure percentages sum to 100 when both are set
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_custom_split_sum_100 
CHECK (
  (custom_person1_percentage IS NULL AND custom_person2_percentage IS NULL) OR
  (custom_person1_percentage IS NOT NULL AND custom_person2_percentage IS NOT NULL AND custom_person1_percentage + custom_person2_percentage = 100)
);

-- Add a comment explaining the columns
COMMENT ON COLUMN public.transactions.custom_person1_percentage IS 'Custom split percentage for person 1 (overrides global/category rules)';
COMMENT ON COLUMN public.transactions.custom_person2_percentage IS 'Custom split percentage for person 2 (overrides global/category rules)';