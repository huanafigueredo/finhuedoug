-- Create category_splits table for category-specific expense splitting rules
CREATE TABLE public.category_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  subcategory_name text, -- NULL = applies to entire category
  person1_percentage integer NOT NULL DEFAULT 50,
  person2_percentage integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_name, subcategory_name)
);

-- Enable Row Level Security
ALTER TABLE public.category_splits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "category_splits_select_owner" ON public.category_splits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "category_splits_insert_owner" ON public.category_splits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "category_splits_update_owner" ON public.category_splits
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "category_splits_delete_owner" ON public.category_splits
  FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_category_splits_updated_at
  BEFORE UPDATE ON public.category_splits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();