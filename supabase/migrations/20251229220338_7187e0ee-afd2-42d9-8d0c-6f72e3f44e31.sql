-- Convert system recipients to belong to the main account (huanaafig@hotmail.com)
-- This ensures other accounts won't see these items and must create their own

UPDATE public.recipients 
SET user_id = '6a8e4ace-4bbc-4ddf-86d8-71fc833e090f'
WHERE user_id IS NULL 
AND name IN ('Huana', 'Douglas', 'Casal', 'Empresa');