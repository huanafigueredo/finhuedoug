-- Add INSERT policy for profiles table (defense-in-depth alongside trigger)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());