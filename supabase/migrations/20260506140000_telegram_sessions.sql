-- Tabela para armazenar o estado das conversas do Telegram
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    step TEXT NOT NULL DEFAULT 'initial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas (Service Role terá acesso total, mas vamos adicionar políticas básicas)
CREATE POLICY "Service role has full access to telegram_sessions"
ON public.telegram_sessions
FOR ALL
TO service_role
USING (true);
