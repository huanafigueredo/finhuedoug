-- Add more achievements (20 total agora)
INSERT INTO public.achievements (code, name, description, category, xp_reward, icon, requirement_type, requirement_value) VALUES
  -- More Consistency
  ('century_streak', 'Centenário', '100 dias de registro consecutivo', 'consistency', 500, '💯', 'streak_days', 100),
  ('couple_sync', 'Casal Organizado', 'Ambos registraram transações na mesma semana', 'consistency', 40, '💑', 'couple_weekly', 1),
  ('transaction_50', '50 Lançamentos', 'Registrou 50 transações no total', 'consistency', 60, '📊', 'transactions_count', 50),
  ('transaction_200', '200 Lançamentos', 'Registrou 200 transações no total', 'consistency', 150, '📈', 'transactions_count', 200),
  
  -- More Saving
  ('saved_5000', 'Cinco Mil Guardados', 'Acumulou R$ 5.000 em metas', 'saving', 300, '💎', 'total_saved', 5000),
  ('saved_10000', 'Dez Mil Guardados', 'Acumulou R$ 10.000 em metas', 'saving', 500, '🏅', 'total_saved', 10000),
  ('goal_speed', 'Meta Relâmpago', 'Atingiu uma meta antes do prazo', 'saving', 120, '⚡', 'goal_early', 1),
  ('goal_3', 'Colecionador de Metas', 'Completou 3 metas', 'saving', 200, '🎯', 'goals_completed', 3),
  ('deposit_streak', 'Guardião Consistente', 'Fez depósitos em metas por 4 semanas seguidas', 'saving', 80, '🛡️', 'deposit_weeks', 4),
  
  -- More Spending
  ('no_impulse_7', 'Resistência Total', '7 dias sem gastar em uma categoria específica', 'spending', 50, '💪', 'no_category_days', 7),
  ('no_delivery_30', 'Sem Tentação', '30 dias sem gastos em Delivery/Fast Food', 'spending', 200, '🚫', 'no_delivery_days', 30),
  ('deal_hunter', 'Caçador de Ofertas', 'Registrou 10 transações com tag promoção', 'spending', 30, '🏷️', 'promo_transactions', 10),
  
  -- More Revenue
  ('income_diverse', 'Diversificação', 'Registrou receitas de 3+ fontes diferentes', 'revenue', 100, '🌈', 'income_sources', 3),
  ('income_growth', 'Renda Crescente', 'Receita do mês maior que do mês anterior', 'revenue', 80, '📊', 'income_growth', 1);

-- Create rewards/unlockables table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'theme', 'avatar_frame', 'badge', 'emoji_pack'
  xp_required INTEGER NOT NULL DEFAULT 0,
  level_required INTEGER NOT NULL DEFAULT 1,
  preview_data JSONB, -- stores theme colors, frame URL, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user unlocked rewards table
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, reward_id)
);

-- Add monthly XP tracking for couple ranking
CREATE TABLE public.monthly_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL, -- 'person1' or 'person2'
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  achievements_count INTEGER NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, person_name, month, year)
);

-- Add equipped theme/frame to user_gamification
ALTER TABLE public.user_gamification 
ADD COLUMN equipped_theme VARCHAR(50) DEFAULT 'default',
ADD COLUMN equipped_frame VARCHAR(50) DEFAULT 'default';

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_xp ENABLE ROW LEVEL SECURITY;

-- RLS for rewards (read-only for authenticated)
CREATE POLICY "rewards_select_authenticated" ON public.rewards
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS for user_rewards
CREATE POLICY "user_rewards_select_owner" ON public.user_rewards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_rewards_insert_owner" ON public.user_rewards
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_rewards_update_owner" ON public.user_rewards
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS for monthly_xp
CREATE POLICY "monthly_xp_select_owner" ON public.monthly_xp
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "monthly_xp_insert_owner" ON public.monthly_xp
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_xp_update_owner" ON public.monthly_xp
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger for monthly_xp updated_at
CREATE TRIGGER update_monthly_xp_updated_at
  BEFORE UPDATE ON public.monthly_xp
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial rewards (themes and frames)
INSERT INTO public.rewards (code, name, description, type, xp_required, level_required, preview_data) VALUES
  -- Themes
  ('theme_default', 'Padrão', 'Tema padrão do Together Finanças', 'theme', 0, 1, '{"primary": "330 75% 55%", "background": "60 20% 96%"}'),
  ('theme_ocean', 'Oceano', 'Tons de azul e ciano relaxantes', 'theme', 100, 2, '{"primary": "200 80% 50%", "background": "200 30% 96%"}'),
  ('theme_forest', 'Floresta', 'Tons de verde e natureza', 'theme', 300, 3, '{"primary": "145 60% 42%", "background": "145 20% 96%"}'),
  ('theme_sunset', 'Pôr do Sol', 'Tons quentes de laranja e rosa', 'theme', 600, 4, '{"primary": "20 90% 55%", "background": "30 30% 96%"}'),
  ('theme_galaxy', 'Galáxia', 'Tons de roxo e azul espacial', 'theme', 1000, 5, '{"primary": "280 70% 55%", "background": "280 20% 96%"}'),
  ('theme_gold', 'Ouro', 'Tema dourado exclusivo', 'theme', 2500, 7, '{"primary": "45 90% 50%", "background": "45 30% 96%"}'),
  
  -- Avatar Frames
  ('frame_default', 'Sem Moldura', 'Avatar sem moldura especial', 'avatar_frame', 0, 1, '{"border": "none"}'),
  ('frame_bronze', 'Moldura Bronze', 'Moldura de conquista iniciante', 'avatar_frame', 100, 2, '{"border": "bronze", "glow": false}'),
  ('frame_silver', 'Moldura Prata', 'Moldura intermediária elegante', 'avatar_frame', 500, 4, '{"border": "silver", "glow": false}'),
  ('frame_gold', 'Moldura Dourada', 'Moldura dourada brilhante', 'avatar_frame', 1500, 6, '{"border": "gold", "glow": true}'),
  ('frame_diamond', 'Moldura Diamante', 'A moldura mais exclusiva', 'avatar_frame', 4000, 8, '{"border": "diamond", "glow": true, "animated": true}'),
  
  -- Special Badges
  ('badge_early_adopter', 'Early Adopter', 'Um dos primeiros usuários', 'badge', 0, 1, '{"icon": "🌟", "color": "amber"}'),
  ('badge_saver', 'Poupador Master', 'Especialista em guardar dinheiro', 'badge', 500, 4, '{"icon": "💰", "color": "green"}'),
  ('badge_streak_master', 'Mestre dos Streaks', 'Alcançou streak de 30 dias', 'badge', 300, 3, '{"icon": "🔥", "color": "orange"}'),
  ('badge_couple_champion', 'Campeão do Casal', 'Venceu 3 meses consecutivos no ranking', 'badge', 1000, 5, '{"icon": "🏆", "color": "gold"}');