-- ============================================
-- GHL Snapshot - Client Configs Migration
-- ============================================
-- Tabela para parametrizacao de clientes/locations
-- Permite personalizar agentes IA por cliente
--
-- Uso: Rodar via Supabase SQL Editor ou migration
-- Versao: 1.0.0
-- Criado: Janeiro 2026
-- ============================================

-- Habilitar extensao para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: client_configs
-- ============================================
-- Armazena configuracoes por location/cliente
-- para personalizar comportamento dos agentes IA

CREATE TABLE IF NOT EXISTS client_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- === IDENTIFICACAO ===
  location_id VARCHAR(50) NOT NULL UNIQUE,
  client_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- === DADOS DO NEGOCIO ===
  nome_empresa VARCHAR(255),
  tipo_negocio VARCHAR(100), -- mentor, consultor, terapeuta, etc
  nicho VARCHAR(100), -- marketing, vendas, negocios, saude, etc
  oferta_principal TEXT, -- descricao da oferta principal
  ticket_medio DECIMAL(10,2),

  -- === PERFIL DO CLIENTE ===
  dor_principal TEXT, -- dor que resolve
  publico_alvo TEXT, -- descricao do ICP
  diferenciais TEXT[], -- array de diferenciais

  -- === CONFIGURACAO DO AGENTE ===
  tom_agente VARCHAR(50) DEFAULT 'profissional', -- profissional, amigavel, consultivo
  nome_agente VARCHAR(100) DEFAULT 'Assistente',
  emoji_por_mensagem INTEGER DEFAULT 2,
  assinatura_agente VARCHAR(255),

  -- === FUNIS ATIVOS ===
  funis_ativos TEXT[] DEFAULT ARRAY[
    'social-selling',
    'webinario',
    'aplicacao',
    'diagnostico'
  ],

  -- === CANAIS ===
  canais_ativos TEXT[] DEFAULT ARRAY['whatsapp', 'instagram'],
  telefone_whatsapp VARCHAR(20),
  instagram_username VARCHAR(100),

  -- === HORARIOS ===
  horario_inicio TIME DEFAULT '09:00',
  horario_fim TIME DEFAULT '18:00',
  dias_ativos INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=dom, 1=seg, etc
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',

  -- === CALENDARIOS ===
  calendario_discovery_url TEXT,
  calendario_estrategica_url TEXT,
  calendario_proposta_url TEXT,
  calendario_onboarding_url TEXT,

  -- === LIMITES DE AUTOMACAO ===
  max_followups INTEGER DEFAULT 5,
  max_noshow_attempts INTEGER DEFAULT 3,
  delay_entre_mensagens_min INTEGER DEFAULT 60, -- segundos
  delay_entre_mensagens_max INTEGER DEFAULT 180, -- segundos

  -- === ESCALACAO HUMANA ===
  telefone_humano VARCHAR(20),
  email_humano VARCHAR(255),
  webhook_escalacao TEXT,

  -- === WEBHOOKS N8N ===
  webhook_new_lead TEXT,
  webhook_message TEXT,
  webhook_appointment TEXT,
  webhook_classify TEXT,

  -- === PROMPTS PERSONALIZADOS ===
  prompt_abertura TEXT,
  prompt_qualificacao TEXT,
  prompt_objecoes TEXT,
  prompt_agendamento TEXT,

  -- === RESPOSTAS PADRAO ===
  resposta_fora_horario TEXT DEFAULT 'Oi! Estamos fora do horario de atendimento. Retornaremos amanha das 9h as 18h.',
  resposta_spam TEXT DEFAULT 'Desculpe, nao consegui entender sua mensagem.',

  -- === BANT CONFIG ===
  bant_peso_budget INTEGER DEFAULT 25,
  bant_peso_authority INTEGER DEFAULT 25,
  bant_peso_need INTEGER DEFAULT 25,
  bant_peso_timeline INTEGER DEFAULT 25,
  bant_threshold_hot INTEGER DEFAULT 70,
  bant_threshold_warm INTEGER DEFAULT 40,

  -- === TIMESTAMPS ===
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_configs_location ON client_configs(location_id);
CREATE INDEX IF NOT EXISTS idx_client_configs_active ON client_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_client_configs_tipo ON client_configs(tipo_negocio);

-- ============================================
-- TRIGGER: updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_configs_updated_at ON client_configs;
CREATE TRIGGER update_client_configs_updated_at
  BEFORE UPDATE ON client_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE client_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role tem acesso total
CREATE POLICY "Service role has full access" ON client_configs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Usuarios autenticados podem ver configs ativas
CREATE POLICY "Authenticated users can view active configs" ON client_configs
  FOR SELECT
  USING (is_active = true);

-- ============================================
-- DADOS INICIAIS (Exemplo)
-- ============================================

-- Inserir config de exemplo para teste
INSERT INTO client_configs (
  location_id,
  client_name,
  nome_empresa,
  tipo_negocio,
  nicho,
  oferta_principal,
  ticket_medio,
  dor_principal,
  publico_alvo,
  diferenciais,
  tom_agente,
  nome_agente,
  telefone_whatsapp,
  calendario_discovery_url,
  calendario_estrategica_url
) VALUES (
  'hHTtB7iZ4EUqQ3L2yQZK',
  'Marcos Daniels F Test',
  'MOTTIVME',
  'mentor',
  'vendas',
  'Mentoria de vendas high-ticket para mentores e consultores',
  5000.00,
  'Dificuldade em captar clientes de alto valor',
  'Mentores, coaches e consultores que faturam entre 30k-300k/mes',
  ARRAY['Metodologia comprovada', 'Resultados em 90 dias', 'Suporte personalizado'],
  'consultivo',
  'Maya',
  '+5511999999999',
  'https://calendar.app/discovery',
  'https://calendar.app/estrategica'
) ON CONFLICT (location_id) DO NOTHING;

-- ============================================
-- FUNCOES AUXILIARES
-- ============================================

-- Funcao para buscar config por location
CREATE OR REPLACE FUNCTION get_client_config(p_location_id VARCHAR)
RETURNS SETOF client_configs AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM client_configs
  WHERE location_id = p_location_id
  AND is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para verificar horario de atendimento
CREATE OR REPLACE FUNCTION is_within_business_hours(p_location_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  config client_configs;
  current_time_local TIME;
  current_day INTEGER;
BEGIN
  SELECT * INTO config FROM client_configs WHERE location_id = p_location_id;

  IF config IS NULL THEN
    RETURN false;
  END IF;

  -- Converter para timezone do cliente
  current_time_local := (NOW() AT TIME ZONE config.timezone)::TIME;
  current_day := EXTRACT(DOW FROM NOW() AT TIME ZONE config.timezone);

  -- Verificar se dia esta ativo
  IF NOT (current_day = ANY(config.dias_ativos)) THEN
    RETURN false;
  END IF;

  -- Verificar horario
  RETURN current_time_local >= config.horario_inicio
     AND current_time_local <= config.horario_fim;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABELA: conversation_state
-- ============================================
-- Armazena estado da conversa para continuidade

CREATE TABLE IF NOT EXISTS conversation_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificacao
  location_id VARCHAR(50) NOT NULL,
  contact_id VARCHAR(50) NOT NULL,
  conversation_id VARCHAR(50),

  -- Estado atual
  current_stage VARCHAR(50) DEFAULT 'new', -- new, qualifying, scheduling, nurturing, etc
  agent_version VARCHAR(50),

  -- Contexto BANT
  bant_budget INTEGER DEFAULT 0,
  bant_authority INTEGER DEFAULT 0,
  bant_need INTEGER DEFAULT 0,
  bant_timeline INTEGER DEFAULT 0,
  bant_total INTEGER GENERATED ALWAYS AS (bant_budget + bant_authority + bant_need + bant_timeline) STORED,

  -- Contadores
  message_count INTEGER DEFAULT 0,
  followup_count INTEGER DEFAULT 0,
  noshow_count INTEGER DEFAULT 0,

  -- Flags
  ia_ativa BOOLEAN DEFAULT true,
  qualificado BOOLEAN DEFAULT false,
  agendado BOOLEAN DEFAULT false,

  -- Ultima interacao
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_direction VARCHAR(10), -- inbound, outbound

  -- Metadados
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint unica
  UNIQUE(location_id, contact_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_conv_state_location ON conversation_state(location_id);
CREATE INDEX IF NOT EXISTS idx_conv_state_contact ON conversation_state(contact_id);
CREATE INDEX IF NOT EXISTS idx_conv_state_stage ON conversation_state(current_stage);
CREATE INDEX IF NOT EXISTS idx_conv_state_last_msg ON conversation_state(last_message_at);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_conversation_state_updated_at ON conversation_state;
CREATE TRIGGER update_conversation_state_updated_at
  BEFORE UPDATE ON conversation_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to conv state" ON conversation_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TABELA: message_log
-- ============================================
-- Log de mensagens para auditoria e treinamento

CREATE TABLE IF NOT EXISTS message_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identificacao
  location_id VARCHAR(50) NOT NULL,
  contact_id VARCHAR(50) NOT NULL,
  conversation_id VARCHAR(50),

  -- Mensagem
  direction VARCHAR(10) NOT NULL, -- inbound, outbound
  channel VARCHAR(20) NOT NULL, -- whatsapp, sms, email
  content TEXT NOT NULL,

  -- Processamento IA
  classification VARCHAR(50), -- LEAD_HOT, LEAD_WARM, etc
  intent VARCHAR(50), -- scheduling, objection, question, etc
  sentiment VARCHAR(20), -- positive, neutral, negative
  agent_version VARCHAR(50),

  -- Metricas
  response_time_ms INTEGER,
  tokens_used INTEGER,

  -- Metadados
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_msg_log_location ON message_log(location_id);
CREATE INDEX IF NOT EXISTS idx_msg_log_contact ON message_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_msg_log_created ON message_log(created_at);
CREATE INDEX IF NOT EXISTS idx_msg_log_classification ON message_log(classification);

-- RLS
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to msg log" ON message_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VIEW: active_conversations
-- ============================================
-- View para visualizar conversas ativas

CREATE OR REPLACE VIEW active_conversations AS
SELECT
  cs.location_id,
  cs.contact_id,
  cs.current_stage,
  cs.bant_total,
  cs.message_count,
  cs.followup_count,
  cs.ia_ativa,
  cs.last_message_at,
  cs.last_message_direction,
  cc.client_name,
  cc.nome_agente,
  CASE
    WHEN cs.bant_total >= cc.bant_threshold_hot THEN 'HOT'
    WHEN cs.bant_total >= cc.bant_threshold_warm THEN 'WARM'
    ELSE 'COLD'
  END as temperature
FROM conversation_state cs
JOIN client_configs cc ON cs.location_id = cc.location_id
WHERE cs.ia_ativa = true
  AND cs.last_message_at > NOW() - INTERVAL '7 days';

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE client_configs IS 'Configuracoes por location/cliente para personalizar agentes IA';
COMMENT ON TABLE conversation_state IS 'Estado da conversa para continuidade entre mensagens';
COMMENT ON TABLE message_log IS 'Log de mensagens para auditoria e treinamento';
COMMENT ON VIEW active_conversations IS 'View de conversas ativas com temperatura calculada';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
