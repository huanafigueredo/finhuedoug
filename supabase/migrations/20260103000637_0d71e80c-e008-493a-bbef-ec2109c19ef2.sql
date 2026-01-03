-- Create a simple table for user theme settings (replacing gamification dependency)
CREATE TABLE public.user_theme_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  equipped_theme text NOT NULL DEFAULT 'theme_default',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_theme_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "user_theme_settings_select_owner"
ON public.user_theme_settings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "user_theme_settings_insert_owner"
ON public.user_theme_settings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_theme_settings_update_owner"
ON public.user_theme_settings
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_user_theme_settings_updated_at
BEFORE UPDATE ON public.user_theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();