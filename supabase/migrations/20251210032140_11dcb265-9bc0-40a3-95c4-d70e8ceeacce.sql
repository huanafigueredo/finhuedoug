-- Adicionar Huana e Douglas à lista de usuários permitidos
INSERT INTO public.allowed_users (user_id) VALUES 
  ('6a8e4ace-4bbc-4ddf-86d8-71fc833e090f'),  -- Huana (huanaafig@hotmail.com)
  ('15243e2e-e2e3-4ca6-bff3-5ca051c93003')   -- Douglas (douglas-carvalhokapiva@hotmail.com)
ON CONFLICT (user_id) DO NOTHING;