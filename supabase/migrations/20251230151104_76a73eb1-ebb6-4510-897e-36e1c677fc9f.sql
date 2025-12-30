-- Create enum for achievement categories
CREATE TYPE public.achievement_category AS ENUM ('spending', 'saving', 'revenue', 'consistency');

-- Create enum for challenge types
CREATE TYPE public.challenge_type AS ENUM ('weekly', 'monthly');

-- Tabela de gamificação do usuário
CREATE TABLE public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT true,
  streak_freeze_used_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de conquistas disponíveis (sistema)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category achievement_category NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(10) NOT NULL DEFAULT '🏆',
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de conquistas do usuário
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Tabela de desafios
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type challenge_type NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  icon VARCHAR(10) NOT NULL DEFAULT '🎯',
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de progresso de desafios do usuário
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, period_start)
);

-- Enable RLS on all tables
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_gamification
CREATE POLICY "user_gamification_select_owner" ON public.user_gamification
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_gamification_insert_owner" ON public.user_gamification
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_gamification_update_owner" ON public.user_gamification
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS policies for achievements (read-only for all authenticated users)
CREATE POLICY "achievements_select_authenticated" ON public.achievements
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS policies for user_achievements
CREATE POLICY "user_achievements_select_owner" ON public.user_achievements
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_achievements_insert_owner" ON public.user_achievements
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for challenges (read-only for all authenticated users)
CREATE POLICY "challenges_select_authenticated" ON public.challenges
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS policies for user_challenges
CREATE POLICY "user_challenges_select_owner" ON public.user_challenges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_challenges_insert_owner" ON public.user_challenges
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_challenges_update_owner" ON public.user_challenges
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at on user_gamification
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial achievements (10 for MVP)
INSERT INTO public.achievements (code, name, description, category, xp_reward, icon, requirement_type, requirement_value) VALUES
  -- Consistency
  ('first_transaction', 'Primeiro Registro', 'Adicionou sua primeira transação', 'consistency', 10, '🎉', 'transactions_count', 1),
  ('week_streak', 'Registro Diário', 'Registrou transações por 7 dias seguidos', 'consistency', 50, '🔥', 'streak_days', 7),
  ('month_streak', 'Maratonista', 'Registrou transações por 30 dias seguidos', 'consistency', 150, '🏃', 'streak_days', 30),
  
  -- Saving
  ('first_goal', 'Primeira Meta', 'Criou sua primeira meta de economia', 'saving', 20, '🎯', 'goals_count', 1),
  ('goal_achieved', 'Meta Atingida', 'Completou 100% de uma meta', 'saving', 100, '🏆', 'goals_completed', 1),
  ('saved_1000', 'Mil Guardados', 'Acumulou R$ 1.000 em metas', 'saving', 150, '💰', 'total_saved', 1000),
  
  -- Spending
  ('budget_ninja', 'Orçamento Ninja', 'Ficou abaixo do orçamento em todas as categorias no mês', 'spending', 100, '🥷', 'budget_under_all', 1),
  ('lean_month', 'Mês Enxuto', 'Gastou 20% menos que o mês anterior', 'spending', 150, '📉', 'spending_reduction', 20),
  
  -- Revenue
  ('extra_income', 'Renda Extra', 'Registrou primeira receita além do salário', 'revenue', 30, '💵', 'income_sources', 2),
  ('surplus_streak', 'Superávit do Casal', 'Saldo positivo por 3 meses consecutivos', 'revenue', 200, '📈', 'surplus_months', 3);

-- Insert initial challenges
INSERT INTO public.challenges (code, name, description, type, xp_reward, icon, requirement_type, requirement_value) VALUES
  -- Weekly
  ('no_delivery', 'Sem Delivery', 'Nenhum gasto em delivery esta semana', 'weekly', 30, '🍕', 'no_category_spending', 1),
  ('saver_express', 'Poupador Express', 'Deposite em metas 3x esta semana', 'weekly', 40, '💨', 'goal_deposits', 3),
  ('perfect_week', 'Semana Perfeita', 'Registre todas as transações por 7 dias', 'weekly', 50, '✨', 'daily_transactions', 7),
  
  -- Monthly
  ('budget_zero', 'Orçamento Zero', 'Não estoure nenhum orçamento no mês', 'monthly', 120, '🎯', 'budgets_respected', 1),
  ('surplus_month', 'Mês Superavitário', 'Termine o mês com saldo positivo', 'monthly', 80, '💚', 'positive_balance', 1),
  ('guardian', 'Guardião do Mês', 'Guarde 20%+ da renda em metas', 'monthly', 150, '🛡️', 'savings_rate', 20);