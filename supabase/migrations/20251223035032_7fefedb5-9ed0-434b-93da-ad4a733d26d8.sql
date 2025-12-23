-- Create user_settings table for storing editable person names
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  person_1_name TEXT NOT NULL DEFAULT 'Huana',
  person_2_name TEXT NOT NULL DEFAULT 'Douglas',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);