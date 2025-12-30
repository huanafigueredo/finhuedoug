-- Inserir novas conquistas
INSERT INTO achievements (code, name, description, category, requirement_type, requirement_value, xp_reward, icon) VALUES
-- Spending (mais conquistas)
('budget_master', 'Mestre do Orçamento', 'Fique abaixo do orçamento em todas as categorias por 3 meses', 'spending', 'budget_under_3_months', 1, 300, '🎓'),
('frugal_king', 'Rei da Frugalidade', 'Reduza gastos em 20% comparado ao mês anterior', 'spending', 'reduce_spending_20', 1, 200, '👑'),
('cash_is_king', 'Dinheiro é Rei', 'Faça 50 transações sem usar cartão de crédito', 'spending', 'transactions_no_credit', 50, 150, '💵'),
('essentials_only', 'Só o Essencial', 'Passe um mês sem gastos em entretenimento', 'spending', 'no_entertainment_month', 1, 250, '🎯'),

-- Saving (mais conquistas)  
('super_saver', 'Super Poupador', 'Guarde R$ 500 em um único depósito', 'saving', 'single_deposit_500', 1, 150, '💪'),
('consistent_saver', 'Poupança Consistente', 'Faça depósitos por 6 meses consecutivos', 'saving', 'deposit_streak_6', 1, 400, '📈'),
('goal_crusher', 'Destruidor de Metas', 'Complete 5 metas de economia', 'saving', 'goals_completed_5', 5, 500, '💥'),
('emergency_fund', 'Fundo de Emergência', 'Tenha R$ 3.000 guardados em metas', 'saving', 'total_saved_3000', 1, 350, '🛡️'),

-- Revenue (mais conquistas)
('side_hustle', 'Renda Paralela', 'Registre 3 fontes diferentes de receita', 'revenue', 'income_sources_3', 3, 200, '🚀'),
('double_income', 'Renda Duplicada', 'Dobre sua receita em relação ao mês anterior', 'revenue', 'double_income_month', 1, 400, '✨'),
('passive_income', 'Renda Passiva', 'Tenha receitas de investimentos por 3 meses', 'revenue', 'investment_income_3', 3, 300, '🏦'),

-- Consistency (mais conquistas)
('early_bird', 'Madrugador', 'Registre transações antes das 8h por 7 dias', 'consistency', 'early_transactions_7', 7, 150, '🌅'),
('night_owl', 'Coruja', 'Registre transações após 22h por 7 dias', 'consistency', 'night_transactions_7', 7, 150, '🦉'),
('complete_month', 'Mês Completo', 'Registre pelo menos uma transação todo dia do mês', 'consistency', 'daily_30', 30, 500, '📅'),
('transaction_500', '500 Lançamentos', 'Registre 500 transações no total', 'consistency', 'total_transactions', 500, 400, '🎯'),
('year_streak', 'Veterano Anual', 'Mantenha streak de 365 dias', 'consistency', 'streak_365', 365, 1000, '🏆')

ON CONFLICT (code) DO NOTHING;

-- Inserir novos desafios
INSERT INTO challenges (code, name, description, type, requirement_type, requirement_value, xp_reward, icon) VALUES
-- Weekly challenges
('zero_waste', 'Desperdício Zero', 'Não gaste em categorias supérfluas esta semana', 'weekly', 'no_superfluous', 7, 100, '♻️'),
('double_saver', 'Poupador Duplo', 'Faça 2 depósitos em metas esta semana', 'weekly', 'deposits_week', 2, 80, '💰'),
('register_all', 'Registrador', 'Registre todas as transações diariamente por 7 dias', 'weekly', 'daily_streak', 7, 120, '📝'),
('couple_sync', 'Sincronizados', 'Ambos registrem transações todo dia da semana', 'weekly', 'both_daily', 7, 150, '💕'),
('budget_check', 'Conferência', 'Não ultrapasse nenhum orçamento esta semana', 'weekly', 'under_budget_week', 1, 90, '✅'),

-- Monthly challenges  
('big_saver', 'Grande Poupador', 'Guarde R$ 1.000 este mês', 'monthly', 'save_1000', 1, 300, '🎯'),
('expense_tracker', 'Rastreador', 'Registre 50 transações este mês', 'monthly', 'transactions_50', 50, 200, '📊'),
('category_master', 'Mestre das Categorias', 'Use pelo menos 10 categorias diferentes', 'monthly', 'categories_10', 10, 150, '🗂️'),
('couple_goal', 'Meta do Casal', 'Completem uma meta de economia juntos', 'monthly', 'couple_goal_complete', 1, 250, '❤️'),
('income_boost', 'Impulso de Receita', 'Tenha 3 fontes de receita diferentes', 'monthly', 'income_sources', 3, 180, '💵'),
('streak_master', 'Mestre do Streak', 'Mantenha streak de 30 dias', 'monthly', 'streak_30', 30, 350, '🔥')

ON CONFLICT (code) DO NOTHING;