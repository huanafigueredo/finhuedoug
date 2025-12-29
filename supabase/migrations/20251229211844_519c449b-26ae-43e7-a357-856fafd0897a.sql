-- Insert Huana and Douglas for user huanaafig@hotmail.com
INSERT INTO public.couple_members (user_id, name, avatar_url, position)
VALUES 
  ('6a8e4ace-4bbc-4ddf-86d8-71fc833e090f', 'Huana', NULL, 1),
  ('6a8e4ace-4bbc-4ddf-86d8-71fc833e090f', 'Douglas', NULL, 2)
ON CONFLICT (user_id, position) DO NOTHING;