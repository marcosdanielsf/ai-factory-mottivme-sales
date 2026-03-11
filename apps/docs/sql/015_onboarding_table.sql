-- ============================================
-- ONBOARDING TABLE
-- Armazena respostas do onboarding de novos clientes
-- ============================================

-- Tabela principal de onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,

  -- Respostas das 7 perguntas
  q1_product TEXT,              -- Qual é o seu produto?
  q1_product_audio TEXT,        -- Audio base64 (opcional)

  q2_how_it_works TEXT,         -- Como funciona?
  q2_how_it_works_audio TEXT,

  q3_what_not_do TEXT,          -- O que NÃO faz?
  q3_what_not_do_audio TEXT,

  q4_benefits TEXT,             -- Principais benefícios
  q4_benefits_audio TEXT,

  q5_ideal_client TEXT,         -- Cliente ideal
  q5_ideal_client_audio TEXT,

  q6_ticket_value TEXT,         -- Ticket médio
  q6_ticket_value_audio TEXT,

  q7_daily_goal TEXT,           -- Meta de lucro diária
  q7_daily_goal_audio TEXT,

  -- Metadados
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Configurações geradas
  generated_config JSONB,        -- Configuração gerada pela IA

  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON public.onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_created_at ON public.onboarding_sessions(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER onboarding_updated_at
  BEFORE UPDATE ON public.onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- ============================================
-- VIEW: Último onboarding por usuário
-- ============================================
CREATE OR REPLACE VIEW public.vw_latest_onboarding AS
SELECT
  id,
  user_id,
  client_name,
  q1_product,
  q2_how_it_works,
  q3_what_not_do,
  q4_benefits,
  q5_ideal_client,
  q6_ticket_value,
  q7_daily_goal,
  status,
  completed_at,
  created_at,
  generated_config
FROM public.onboarding_sessions o
WHERE o.created_at = (
  SELECT MAX(created_at)
  FROM public.onboarding_sessions
  WHERE user_id = o.user_id
);

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE public.onboarding_sessions IS 'Sessões de onboarding para configuração do time de vendas com IA';
COMMENT ON COLUMN public.onboarding_sessions.user_id IS 'ID do usuário (opcional para onboarding anônimo)';
COMMENT ON COLUMN public.onboarding_sessions.client_name IS 'Nome do cliente/empresa';
COMMENT ON COLUMN public.onboarding_sessions.q1_product IS 'Pergunta 1: Qual é o seu produto?';
COMMENT ON COLUMN public.onboarding_sessions.q1_product_audio IS 'Áudio da resposta em base64';
COMMENT ON COLUMN public.onboarding_sessions.generated_config IS 'Configuração gerada pela IA (prompts, agentes, etc.)';
COMMENT ON COLUMN public.onboarding_sessions.status IS 'pending: aguardando processamento, processing: em processamento, completed: concluído, failed: erro';
