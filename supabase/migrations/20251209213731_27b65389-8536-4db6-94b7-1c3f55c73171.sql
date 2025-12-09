-- Create transactions table with installment support
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Basic data
  date DATE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  subcategory TEXT,
  
  -- Values
  total_value DECIMAL(12,2) NOT NULL,
  value_per_person DECIMAL(12,2),
  is_couple BOOLEAN DEFAULT FALSE,
  
  -- Relationships
  paid_by TEXT,
  for_who TEXT,
  bank_id UUID REFERENCES public.banks(id),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  recipient_id UUID REFERENCES public.recipients(id),
  
  -- Income fields
  receiving_bank_id UUID REFERENCES public.banks(id),
  income_origin TEXT,
  
  -- Installment fields
  is_installment BOOLEAN DEFAULT FALSE,
  installment_number INTEGER,
  total_installments INTEGER,
  installment_value DECIMAL(12,2),
  parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  is_generated_installment BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (adjust later for user-specific access)
CREATE POLICY "Allow all access to transactions"
ON public.transactions
FOR ALL
USING (true)
WITH CHECK (true);