-- Add onboarding_completed_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_completed_at timestamp with time zone DEFAULT NULL;