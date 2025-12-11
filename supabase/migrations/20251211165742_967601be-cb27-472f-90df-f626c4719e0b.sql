-- Remove the INSERT policy on profiles table
-- Profile creation should only happen through the SECURITY DEFINER trigger (handle_new_user)
-- This prevents users from manually creating profile records and bypassing the trigger

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;