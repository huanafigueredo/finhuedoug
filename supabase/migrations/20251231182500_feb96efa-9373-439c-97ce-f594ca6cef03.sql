-- Update handle_new_user to create account and link profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_account_id uuid;
BEGIN
  -- Create a new account for the user
  INSERT INTO public.accounts (name)
  VALUES (COALESCE(new.raw_user_meta_data ->> 'full_name', new.email))
  RETURNING id INTO new_account_id;
  
  -- Create account membership
  INSERT INTO public.account_members (user_id, account_id, role)
  VALUES (new.id, new_account_id, 'owner');
  
  -- Create profile with account_id
  INSERT INTO public.profiles (id, email, full_name, account_id)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new_account_id);
  
  -- Create default couple members for new account
  INSERT INTO public.couple_members (user_id, name, position)
  VALUES 
    (new.id, 'Pessoa 1', 1),
    (new.id, 'Pessoa 2', 2);
  
  RETURN new;
END;
$$;

-- Fix existing users without account_id
DO $$
DECLARE
  profile_record RECORD;
  new_account_id uuid;
BEGIN
  FOR profile_record IN 
    SELECT p.id, p.email, p.full_name 
    FROM public.profiles p 
    WHERE p.account_id IS NULL
  LOOP
    -- Create account
    INSERT INTO public.accounts (name)
    VALUES (COALESCE(profile_record.full_name, profile_record.email))
    RETURNING id INTO new_account_id;
    
    -- Create membership
    INSERT INTO public.account_members (user_id, account_id, role)
    VALUES (profile_record.id, new_account_id, 'owner')
    ON CONFLICT DO NOTHING;
    
    -- Update profile
    UPDATE public.profiles
    SET account_id = new_account_id
    WHERE id = profile_record.id;
    
    -- Create default couple members if not exist
    INSERT INTO public.couple_members (user_id, name, position)
    VALUES 
      (profile_record.id, 'Pessoa 1', 1),
      (profile_record.id, 'Pessoa 2', 2)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;