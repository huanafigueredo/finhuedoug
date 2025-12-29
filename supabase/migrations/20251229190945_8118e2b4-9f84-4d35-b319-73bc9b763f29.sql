-- Update profiles that have account_members but no account_id set
UPDATE public.profiles p
SET account_id = (
  SELECT am.account_id 
  FROM public.account_members am 
  WHERE am.user_id = p.id 
  LIMIT 1
)
WHERE p.account_id IS NULL 
AND EXISTS (
  SELECT 1 FROM public.account_members am WHERE am.user_id = p.id
);