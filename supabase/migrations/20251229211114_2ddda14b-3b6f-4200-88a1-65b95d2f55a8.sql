-- Create couple_members table for dynamic people management
CREATE TABLE public.couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, position)
);

-- Enable RLS
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "couple_members_select_owner" ON public.couple_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "couple_members_insert_owner" ON public.couple_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "couple_members_update_owner" ON public.couple_members
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "couple_members_delete_owner" ON public.couple_members
  FOR DELETE USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_couple_members_updated_at
  BEFORE UPDATE ON public.couple_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from user_settings to couple_members
INSERT INTO public.couple_members (user_id, name, avatar_url, position)
SELECT 
  user_id,
  person_1_name,
  person_1_avatar_url,
  1
FROM public.user_settings
WHERE person_1_name IS NOT NULL;

INSERT INTO public.couple_members (user_id, name, avatar_url, position)
SELECT 
  user_id,
  person_2_name,
  person_2_avatar_url,
  2
FROM public.user_settings
WHERE person_2_name IS NOT NULL;