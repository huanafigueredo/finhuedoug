-- Restaurar configurações de divisão para a conta huanaafig@hotmail.com
INSERT INTO public.split_settings (user_id, mode, person1_percentage, person2_percentage)
VALUES ('6a8e4ace-4bbc-4ddf-86d8-71fc833e090f', '50-50', 50, 50)
ON CONFLICT DO NOTHING;