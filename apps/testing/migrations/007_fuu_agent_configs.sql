-- ================================================
-- Migration 007: Follow Up Universal - Agent Configs
-- ================================================
-- Configura agentes de follow-up por location
-- Suporta múltiplos tipos: SDR, Concierge, Closer, etc.

-- Tabela de tipos de follow-up
CREATE TABLE IF NOT EXISTS fuu_follow_up_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,           -- 'sdr_inbound', 'concierge', 'closer', 'clinic_reminder'
  category VARCHAR(30) NOT NULL,              -- 'sales', 'clinic', 'finance', 'experience'
  name VARCHAR(100) NOT NULL,                 -- Nome amigável
  description TEXT,
  default_prompt_template TEXT,               -- Prompt base para este tipo
  requires_ai BOOLEAN DEFAULT true,           -- Se precisa de IA ou só template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração de agente por location (PRINCIPAL)
CREATE TABLE IF NOT EXISTS fuu_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id VARCHAR(100) NOT NULL,
  follow_up_type VARCHAR(50) NOT NULL DEFAULT 'sdr_inbound',  -- Tipo de follow-up

  -- Identidade do agente
  agent_name VARCHAR(100) NOT NULL,           -- 'Julia', 'Isabella', 'Carlos'
  company_name VARCHAR(200) NOT NULL,         -- 'Five Rings Financial', 'Instituto Amar'
  company_description TEXT,                   -- O que a empresa faz
  agent_role VARCHAR(100),                    -- 'SDR', 'Concierge', 'Closer', 'Atendente'

  -- Comunicação
  language VARCHAR(10) DEFAULT 'pt-BR',       -- 'pt-BR', 'en-US', 'es'
  tone VARCHAR(50) DEFAULT 'casual',          -- 'casual', 'formal', 'friendly', 'professional'
  use_slang BOOLEAN DEFAULT true,             -- Se usa gírias/abreviações
  use_emoji BOOLEAN DEFAULT true,             -- Se usa emojis
  max_emoji_per_message INTEGER DEFAULT 1,

  -- Comportamento
  max_message_lines INTEGER DEFAULT 3,        -- Máximo de linhas por mensagem
  offer_value_attempt INTEGER DEFAULT 3,      -- Em qual tentativa oferece valor
  breakup_attempt INTEGER DEFAULT 5,          -- Tentativa de encerramento

  -- Prompts customizados (JSON)
  custom_prompts JSONB DEFAULT '{}',          -- Prompts específicos por situação

  -- Exemplos de mensagens (JSON array)
  message_examples JSONB DEFAULT '[]',        -- Exemplos para few-shot

  -- Regras específicas (JSON array)
  custom_rules JSONB DEFAULT '[]',            -- Regras adicionais

  -- Metadados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(location_id, follow_up_type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fuu_agent_configs_location ON fuu_agent_configs(location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_agent_configs_active ON fuu_agent_configs(is_active) WHERE is_active = true;

-- Dados iniciais: Tipos de Follow-up
INSERT INTO fuu_follow_up_types (code, category, name, description) VALUES
('sdr_inbound', 'sales', 'SDR Inbound', 'Follow-up de leads que não responderam após contato inicial'),
('sdr_proposal', 'sales', 'Proposta Enviada', 'Follow-up após envio de proposta comercial'),
('closer', 'sales', 'Closer', 'Follow-up para fechamento de venda'),
('concierge', 'service', 'Concierge', 'Acompanhamento pós-venda e suporte'),
('clinic_reminder', 'clinic', 'Lembrete Consulta', 'Lembrete de consulta/procedimento'),
('clinic_noshow', 'clinic', 'No-show', 'Follow-up após não comparecimento'),
('clinic_reschedule', 'clinic', 'Remarcar', 'Auxiliar no reagendamento'),
('finance_reminder', 'finance', 'Lembrete Pagamento', 'Lembrete de pagamento próximo'),
('finance_overdue', 'finance', 'Cobrança', 'Cobrança de pagamento atrasado'),
('reactivation', 'sales', 'Reativação', 'Reativar leads frios/inativos')
ON CONFLICT (code) DO NOTHING;

-- Exemplo de configuração: Instituto Amar (Clínica)
INSERT INTO fuu_agent_configs (
  location_id,
  follow_up_type,
  agent_name,
  company_name,
  company_description,
  agent_role,
  language,
  tone,
  use_slang,
  use_emoji,
  custom_prompts,
  message_examples
) VALUES (
  'cd1uyzpJox6XPt4Vct8Y',
  'sdr_inbound',
  'Isabella',
  'Instituto Amar',
  'Clínica de estética e bem-estar especializada em procedimentos faciais e corporais',
  'Atendente',
  'pt-BR',
  'friendly',
  true,
  true,
  '{
    "if_lead_asked_question": "Responda a pergunta de forma breve e retome o agendamento",
    "if_no_context": "Use mensagem de reengajamento leve",
    "breakup_message": "Vou dar uma pausa pra não incomodar. Fico à disposição!"
  }',
  '[
    {"situation": "lead_perguntou_sobre_preco", "message": "Oi {{nome}}! Sobre valores que vc perguntou - temos condições especiais. Quer que eu te passe?"},
    {"situation": "lead_sumiu", "message": "Oi {{nome}}! Sumiu rs tudo bem por aí?"},
    {"situation": "voce_perguntou_horario", "message": "E aí {{nome}}, conseguiu ver qual horário fica bom? Tenho terça ou quinta"}
  ]'
) ON CONFLICT (location_id, follow_up_type) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  company_name = EXCLUDED.company_name,
  company_description = EXCLUDED.company_description,
  updated_at = NOW();

-- Exemplo de configuração: Five Rings Financial (Vendas US)
INSERT INTO fuu_agent_configs (
  location_id,
  follow_up_type,
  agent_name,
  company_name,
  company_description,
  agent_role,
  language,
  tone,
  use_slang,
  use_emoji,
  max_emoji_per_message,
  custom_prompts,
  message_examples
) VALUES (
  'five_rings_location_id',  -- Substituir pelo ID real
  'sdr_inbound',
  'Julia',
  'Five Rings Financial',
  'Consultoria financeira para brasileiros nos EUA - planejamento tributário, investimentos e seguros',
  'SDR',
  'pt-BR',
  'casual',
  true,
  false,
  0,
  '{
    "if_lead_asked_question": "Responda sobre o tema financeiro e ofereça uma conversa rápida",
    "if_no_context": "Mencione que tem novidades sobre o tema que ele demonstrou interesse",
    "breakup_message": "Sei que a correria tá grande. Se precisar, fico à disposição!"
  }',
  '[
    {"situation": "lead_perguntou_sobre_investimentos", "message": "E aí {{nome}}! Sobre investimentos que vc perguntou - tem umas opções ótimas pra quem tá aqui. Quer que eu explique?"},
    {"situation": "lead_perguntou_sobre_impostos", "message": "Oi {{nome}}! Sobre a dúvida de impostos - sim, dá pra otimizar bastante. Posso te mostrar como?"},
    {"situation": "voce_perguntou_horario", "message": "E aí {{nome}}, conseguiu pensar no horário? Tenho terça 18h ou quinta 20h"}
  ]'
) ON CONFLICT (location_id, follow_up_type) DO NOTHING;

-- Função para buscar config do agente
CREATE OR REPLACE FUNCTION get_fuu_agent_config(p_location_id VARCHAR, p_follow_up_type VARCHAR DEFAULT 'sdr_inbound')
RETURNS TABLE (
  agent_name VARCHAR,
  company_name VARCHAR,
  company_description TEXT,
  agent_role VARCHAR,
  language VARCHAR,
  tone VARCHAR,
  use_slang BOOLEAN,
  use_emoji BOOLEAN,
  max_emoji_per_message INTEGER,
  max_message_lines INTEGER,
  offer_value_attempt INTEGER,
  breakup_attempt INTEGER,
  custom_prompts JSONB,
  message_examples JSONB,
  custom_rules JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.agent_name,
    c.company_name,
    c.company_description,
    c.agent_role,
    c.language,
    c.tone,
    c.use_slang,
    c.use_emoji,
    c.max_emoji_per_message,
    c.max_message_lines,
    c.offer_value_attempt,
    c.breakup_attempt,
    c.custom_prompts,
    c.message_examples,
    c.custom_rules
  FROM fuu_agent_configs c
  WHERE c.location_id = p_location_id
    AND c.follow_up_type = p_follow_up_type
    AND c.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE fuu_agent_configs IS 'Configuração de agentes de follow-up por location - suporta múltiplos tipos';
COMMENT ON COLUMN fuu_agent_configs.follow_up_type IS 'Tipo: sdr_inbound, closer, concierge, clinic_reminder, etc';
COMMENT ON COLUMN fuu_agent_configs.tone IS 'Tom: casual, formal, friendly, professional';
COMMENT ON COLUMN fuu_agent_configs.custom_prompts IS 'Prompts específicos por situação (JSON)';
COMMENT ON COLUMN fuu_agent_configs.message_examples IS 'Exemplos de mensagens para few-shot learning (JSON array)';
