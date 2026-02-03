-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (best effort guess at names, or just ignore errors in DO block)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create comprehensive policies
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );

CREATE POLICY "Users can select their own profile"
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- Grant permissions just in case
GRANT ALL ON public.profiles TO authenticated;
