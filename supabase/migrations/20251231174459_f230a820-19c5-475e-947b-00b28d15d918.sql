-- Add monthly_income_cents to couple_members
ALTER TABLE couple_members 
ADD COLUMN IF NOT EXISTS monthly_income_cents integer DEFAULT 0;

-- Create split_settings table
CREATE TABLE IF NOT EXISTS split_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL DEFAULT '50-50' CHECK (mode IN ('50-50', 'proporcional', 'personalizado')),
  person1_percentage integer DEFAULT 50,
  person2_percentage integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE split_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for split_settings
CREATE POLICY "split_settings_select_owner" ON split_settings 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "split_settings_insert_owner" ON split_settings 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "split_settings_update_owner" ON split_settings 
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "split_settings_delete_owner" ON split_settings 
FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_split_settings_updated_at
BEFORE UPDATE ON split_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();