-- ============================================
-- SELF-IMPROVING AI SYSTEM - MIGRATION 005
-- ============================================
-- Description: Integra as tabelas existentes do fluxo principal
--              com o sistema de auto-melhoria (Reflection Loop)
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-30
-- ============================================
--
-- PROBLEMA IDENTIFICADO:
-- - Fluxo principal usa: crm_historico_mensagens, n8n_historico_mensagens
-- - Reflection Loop espera: agent_conversations, agent_conversation_messages
--
-- SOLUCAO:
-- - Opcao 1: VIEW que adapta dados existentes para o Reflection Loop
-- - Opcao 3: Tabelas de destino + Trigger para sincronizacao automatica
-- ============================================


-- ============================================
-- PARTE 1: CRIAR TABELAS DE DESTINO
-- (agent_conversations e agent_conversation_messages)
-- ============================================

-- Tabela principal de conversas para o Reflection Loop
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento com agente
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE SET NULL,

  -- Identificadores da conversa
  contact_id VARCHAR(255) NOT NULL, -- lead_id do GHL
  conversation_id VARCHAR(255), -- ID da conversa no GHL (opcional)
  session_id VARCHAR(255), -- session_id do n8n_historico_mensagens

  -- Metadata do contato
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),

  -- Canal e contexto
  channel VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, instagram, sms, etc
  source VARCHAR(100), -- fonte original (anuncio, organico, etc)
  location_id VARCHAR(100),

  -- Status da conversa
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned
  outcome VARCHAR(50), -- scheduled, lost, warmed, converted, no_response

  -- Metricas
  mensagens_total INTEGER DEFAULT 0,
  mensagens_lead INTEGER DEFAULT 0,
  mensagens_agente INTEGER DEFAULT 0,
  tempo_resposta_medio_ms INTEGER, -- tempo medio de resposta do agente
  duracao_total_minutos INTEGER,

  -- Analise de qualidade (preenchido pelo Reflection Loop)
  qa_analyzed BOOLEAN DEFAULT false,
  qa_score DECIMAL(3,2), -- 0.00 a 10.00
  qa_analyzed_at TIMESTAMPTZ,
  qa_feedback TEXT,

  -- Scores detalhados (preenchido pelo AI-as-Judge)
  score_completeness DECIMAL(3,2),
  score_depth DECIMAL(3,2),
  score_tone DECIMAL(3,2),
  score_scope DECIMAL(3,2),
  score_missed_opportunities DECIMAL(3,2),

  -- Metadata adicional
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSTRAINT UNIQUE para permitir ON CONFLICT no fluxo principal
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_conversations_contact_unique
  ON agent_conversations(contact_id);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent
  ON agent_conversations(agent_version_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_session
  ON agent_conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_status
  ON agent_conversations(status, outcome);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_qa
  ON agent_conversations(qa_analyzed, created_at DESC)
  WHERE qa_analyzed = false;

CREATE INDEX IF NOT EXISTS idx_agent_conversations_period
  ON agent_conversations(started_at, ended_at);

COMMENT ON TABLE agent_conversations IS
  '[Self-Improving AI] Conversas do agente para analise pelo Reflection Loop';


-- Tabela de mensagens individuais
CREATE TABLE IF NOT EXISTS agent_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento com conversa
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,

  -- Conteudo da mensagem
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, document

  -- Quem enviou
  is_from_lead BOOLEAN NOT NULL, -- true = lead, false = agente/IA
  sender_name VARCHAR(255),

  -- Metadata da mensagem original
  original_message_id VARCHAR(255), -- ID da mensagem no sistema origem
  original_source VARCHAR(100), -- n8n_historico, crm_historico, ghl, etc

  -- Analise (preenchido pelo AI-as-Judge)
  sentiment VARCHAR(50), -- positive, negative, neutral
  intent VARCHAR(100), -- question, objection, interest, closing, etc
  topics TEXT[], -- topicos identificados

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation
  ON agent_conversation_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conv_messages_sender
  ON agent_conversation_messages(conversation_id, is_from_lead);

CREATE INDEX IF NOT EXISTS idx_conv_messages_source
  ON agent_conversation_messages(original_source);

COMMENT ON TABLE agent_conversation_messages IS
  '[Self-Improving AI] Mensagens individuais das conversas para analise detalhada';


-- ============================================
-- PARTE 2: VIEWS DE ADAPTACAO
-- (Opcao 1 - Permite o Reflection Loop ler dados existentes)
-- ============================================

-- View que adapta crm_historico_mensagens para o formato esperado
CREATE OR REPLACE VIEW vw_crm_messages_for_reflection AS
SELECT
  -- Geramos um UUID baseado no lead_id + datetime para ter um ID unico
  md5(crm.lead_id || crm.datetime::TEXT)::UUID as id,

  -- Tentamos encontrar o agent_version_id
  av.id as agent_version_id,

  -- Identificadores
  crm.lead_id as contact_id,
  crm.lead_id as session_id,

  -- Metadata do contato
  crm.full_name as contact_name,

  -- Canal
  COALESCE(crm.source, 'whatsapp') as channel,
  crm.source,

  -- Conteudo
  crm.mensagem as message_text,

  -- Determinamos se e do lead baseado em heuristicas
  -- (mensagens do lead geralmente nao tem prefixo de IA)
  CASE
    WHEN crm.mensagem ILIKE 'Oi!%' OR crm.mensagem ILIKE 'Ola!%'
         OR crm.mensagem ILIKE 'Claro!%' OR crm.mensagem ILIKE 'Perfeito!%'
         OR crm.mensagem ILIKE 'Entendo%' OR crm.mensagem ILIKE 'Otimo!%'
    THEN false -- Provavelmente do agente
    ELSE true -- Provavelmente do lead
  END as is_from_lead,

  -- Timestamps
  crm.datetime as created_at,
  crm.datetime as started_at

FROM crm_historico_mensagens crm
LEFT JOIN agent_versions av ON av.is_active = true
ORDER BY crm.datetime;

COMMENT ON VIEW vw_crm_messages_for_reflection IS
  '[Self-Improving AI] Adapta crm_historico_mensagens para formato do Reflection Loop';


-- View que adapta n8n_historico_mensagens para o formato esperado
CREATE OR REPLACE VIEW vw_n8n_messages_for_reflection AS
SELECT
  nhm.id,
  nhm.session_id,
  nhm.session_id as contact_id,

  -- Extrair tipo da mensagem do JSON
  (nhm.message->>'type') as message_type,

  -- Extrair conteudo da mensagem do JSON
  (nhm.message->>'content') as message_text,

  -- Determinar se e do lead
  CASE
    WHEN (nhm.message->>'type') = 'human' THEN true
    WHEN (nhm.message->>'type') = 'ai' THEN false
    ELSE null
  END as is_from_lead,

  -- Timestamps
  nhm.created_at

FROM n8n_historico_mensagens nhm
ORDER BY nhm.session_id, nhm.created_at;

COMMENT ON VIEW vw_n8n_messages_for_reflection IS
  '[Self-Improving AI] Adapta n8n_historico_mensagens para formato do Reflection Loop';


-- View unificada que combina ambas as fontes
CREATE OR REPLACE VIEW vw_unified_messages_for_reflection AS
SELECT
  'crm' as source_table,
  id,
  contact_id,
  session_id,
  contact_name,
  channel,
  message_text,
  is_from_lead,
  created_at
FROM vw_crm_messages_for_reflection

UNION ALL

SELECT
  'n8n' as source_table,
  id::UUID,
  contact_id,
  session_id,
  null as contact_name,
  'n8n_memory' as channel,
  message_text,
  is_from_lead,
  created_at
FROM vw_n8n_messages_for_reflection

ORDER BY created_at;

COMMENT ON VIEW vw_unified_messages_for_reflection IS
  '[Self-Improving AI] View unificada de todas as mensagens para o Reflection Loop';


-- View de conversas agregadas (agrupa mensagens por session_id)
CREATE OR REPLACE VIEW vw_conversations_for_reflection AS
SELECT
  md5(session_id)::UUID as id,
  av.id as agent_version_id,
  session_id as contact_id,
  session_id,
  MAX(contact_name) as contact_name,
  MAX(channel) as channel,
  'completed' as status, -- Assumimos completa se tem mensagens
  COUNT(*) as mensagens_total,
  SUM(CASE WHEN is_from_lead THEN 1 ELSE 0 END) as mensagens_lead,
  SUM(CASE WHEN NOT is_from_lead THEN 1 ELSE 0 END) as mensagens_agente,
  MIN(created_at) as started_at,
  MAX(created_at) as ended_at,
  MAX(created_at) as last_message_at,
  false as qa_analyzed
FROM vw_unified_messages_for_reflection um
LEFT JOIN agent_versions av ON av.is_active = true
GROUP BY session_id, av.id
ORDER BY MAX(created_at) DESC;

COMMENT ON VIEW vw_conversations_for_reflection IS
  '[Self-Improving AI] View de conversas agregadas para o Reflection Loop';


-- ============================================
-- PARTE 3: FUNCOES DE SINCRONIZACAO
-- (Opcao 3 - Sincroniza automaticamente)
-- ============================================

-- Funcao para sincronizar uma mensagem do CRM para agent_conversation_messages
CREATE OR REPLACE FUNCTION sync_crm_message_to_reflection()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_agent_version_id UUID;
  v_is_from_lead BOOLEAN;
BEGIN
  -- Buscar agent_version ativo
  SELECT id INTO v_agent_version_id
  FROM agent_versions
  WHERE is_active = true
  LIMIT 1;

  -- Determinar se e do lead (heuristica simples)
  v_is_from_lead := NOT (
    NEW.mensagem ILIKE 'Oi!%' OR NEW.mensagem ILIKE 'Ola!%'
    OR NEW.mensagem ILIKE 'Claro!%' OR NEW.mensagem ILIKE 'Perfeito!%'
    OR NEW.mensagem ILIKE 'Entendo%' OR NEW.mensagem ILIKE 'Otimo!%'
    OR NEW.mensagem ILIKE 'Bom dia!%' OR NEW.mensagem ILIKE 'Boa tarde!%'
  );

  -- Buscar ou criar conversa
  SELECT id INTO v_conversation_id
  FROM agent_conversations
  WHERE contact_id = NEW.lead_id
    AND (ended_at IS NULL OR ended_at > NOW() - INTERVAL '30 minutes')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se nao existe conversa ativa, criar uma nova
  IF v_conversation_id IS NULL THEN
    INSERT INTO agent_conversations (
      agent_version_id,
      contact_id,
      session_id,
      contact_name,
      channel,
      source,
      status,
      started_at
    ) VALUES (
      v_agent_version_id,
      NEW.lead_id,
      NEW.lead_id,
      NEW.full_name,
      COALESCE(NEW.source, 'whatsapp'),
      NEW.source,
      'in_progress',
      COALESCE(NEW.datetime, NOW())
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  -- Inserir mensagem
  INSERT INTO agent_conversation_messages (
    conversation_id,
    message_text,
    is_from_lead,
    sender_name,
    original_source,
    created_at
  ) VALUES (
    v_conversation_id,
    NEW.mensagem,
    v_is_from_lead,
    CASE WHEN v_is_from_lead THEN NEW.full_name ELSE 'Agente IA' END,
    'crm_historico_mensagens',
    COALESCE(NEW.datetime, NOW())
  );

  -- Atualizar contadores da conversa
  UPDATE agent_conversations
  SET
    mensagens_total = mensagens_total + 1,
    mensagens_lead = mensagens_lead + CASE WHEN v_is_from_lead THEN 1 ELSE 0 END,
    mensagens_agente = mensagens_agente + CASE WHEN NOT v_is_from_lead THEN 1 ELSE 0 END,
    last_message_at = COALESCE(NEW.datetime, NOW()),
    updated_at = NOW()
  WHERE id = v_conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Funcao para sincronizar n8n_historico_mensagens
CREATE OR REPLACE FUNCTION sync_n8n_message_to_reflection()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_agent_version_id UUID;
  v_is_from_lead BOOLEAN;
  v_message_text TEXT;
  v_message_type TEXT;
BEGIN
  -- Extrair dados do JSON
  v_message_type := NEW.message->>'type';
  v_message_text := NEW.message->>'content';

  -- Ignorar se nao tem conteudo
  IF v_message_text IS NULL OR v_message_text = '' THEN
    RETURN NEW;
  END IF;

  -- Determinar se e do lead
  v_is_from_lead := (v_message_type = 'human');

  -- Buscar agent_version ativo
  SELECT id INTO v_agent_version_id
  FROM agent_versions
  WHERE is_active = true
  LIMIT 1;

  -- Buscar ou criar conversa
  SELECT id INTO v_conversation_id
  FROM agent_conversations
  WHERE session_id = NEW.session_id
    AND (ended_at IS NULL OR ended_at > NOW() - INTERVAL '30 minutes')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Se nao existe conversa ativa, criar uma nova
  IF v_conversation_id IS NULL THEN
    INSERT INTO agent_conversations (
      agent_version_id,
      contact_id,
      session_id,
      channel,
      status,
      started_at
    ) VALUES (
      v_agent_version_id,
      NEW.session_id,
      NEW.session_id,
      'n8n_memory',
      'in_progress',
      NEW.created_at
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  -- Inserir mensagem
  INSERT INTO agent_conversation_messages (
    conversation_id,
    message_text,
    is_from_lead,
    original_source,
    created_at,
    metadata
  ) VALUES (
    v_conversation_id,
    v_message_text,
    v_is_from_lead,
    'n8n_historico_mensagens',
    NEW.created_at,
    jsonb_build_object('original_message', NEW.message)
  )
  ON CONFLICT DO NOTHING;

  -- Atualizar contadores da conversa
  UPDATE agent_conversations
  SET
    mensagens_total = mensagens_total + 1,
    mensagens_lead = mensagens_lead + CASE WHEN v_is_from_lead THEN 1 ELSE 0 END,
    mensagens_agente = mensagens_agente + CASE WHEN NOT v_is_from_lead THEN 1 ELSE 0 END,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = v_conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- PARTE 4: TRIGGERS DE SINCRONIZACAO
-- ============================================

-- Trigger para crm_historico_mensagens
DROP TRIGGER IF EXISTS trigger_sync_crm_to_reflection ON crm_historico_mensagens;
CREATE TRIGGER trigger_sync_crm_to_reflection
  AFTER INSERT ON crm_historico_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION sync_crm_message_to_reflection();

COMMENT ON TRIGGER trigger_sync_crm_to_reflection ON crm_historico_mensagens IS
  '[Self-Improving AI] Sincroniza mensagens do CRM para agent_conversation_messages';


-- Trigger para n8n_historico_mensagens
DROP TRIGGER IF EXISTS trigger_sync_n8n_to_reflection ON n8n_historico_mensagens;
CREATE TRIGGER trigger_sync_n8n_to_reflection
  AFTER INSERT ON n8n_historico_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION sync_n8n_message_to_reflection();

COMMENT ON TRIGGER trigger_sync_n8n_to_reflection ON n8n_historico_mensagens IS
  '[Self-Improving AI] Sincroniza mensagens do n8n para agent_conversation_messages';


-- ============================================
-- PARTE 5: FUNCAO PARA MIGRAR DADOS HISTORICOS
-- ============================================

-- Funcao para migrar dados existentes (executar uma vez)
CREATE OR REPLACE FUNCTION migrate_existing_messages_to_reflection()
RETURNS TABLE(
  crm_migrated INTEGER,
  n8n_migrated INTEGER,
  conversations_created INTEGER
) AS $$
DECLARE
  v_crm_count INTEGER := 0;
  v_n8n_count INTEGER := 0;
  v_conv_count INTEGER := 0;
  v_record RECORD;
BEGIN
  -- Migrar do crm_historico_mensagens
  FOR v_record IN
    SELECT * FROM crm_historico_mensagens
    WHERE lead_id NOT IN (
      SELECT DISTINCT contact_id FROM agent_conversations
    )
    ORDER BY datetime
  LOOP
    -- Trigger vai cuidar da insercao
    -- Apenas contamos
    v_crm_count := v_crm_count + 1;
  END LOOP;

  -- Contar conversas criadas
  SELECT COUNT(*) INTO v_conv_count FROM agent_conversations;

  RETURN QUERY SELECT v_crm_count, v_n8n_count, v_conv_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- PARTE 6: FUNCAO PARA O REFLECTION LOOP
-- ============================================

-- Funcao que retorna conversas para analise
CREATE OR REPLACE FUNCTION get_conversations_for_reflection(
  p_agent_version_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_only_unanalyzed BOOLEAN DEFAULT true
)
RETURNS TABLE(
  conversation_id UUID,
  agent_version_id UUID,
  contact_id VARCHAR,
  contact_name VARCHAR,
  channel VARCHAR,
  status VARCHAR,
  outcome VARCHAR,
  mensagens_total INTEGER,
  qa_analyzed BOOLEAN,
  qa_score DECIMAL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id as conversation_id,
    ac.agent_version_id,
    ac.contact_id,
    ac.contact_name,
    ac.channel,
    ac.status,
    ac.outcome,
    ac.mensagens_total,
    ac.qa_analyzed,
    ac.qa_score,
    ac.started_at,
    ac.ended_at,
    -- Agregar mensagens como JSON array
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', acm.id,
          'message_text', acm.message_text,
          'is_from_lead', acm.is_from_lead,
          'sender_name', acm.sender_name,
          'created_at', acm.created_at
        ) ORDER BY acm.created_at
      )
      FROM agent_conversation_messages acm
      WHERE acm.conversation_id = ac.id
    ) as messages
  FROM agent_conversations ac
  WHERE
    (p_agent_version_id IS NULL OR ac.agent_version_id = p_agent_version_id)
    AND (NOT p_only_unanalyzed OR ac.qa_analyzed = false)
    AND ac.mensagens_total > 0
  ORDER BY ac.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- VERIFICACAO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'INTEGRATION MIGRATION 005 - Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TABELAS CRIADAS:';
  RAISE NOTICE '  - agent_conversations (conversas para Reflection Loop)';
  RAISE NOTICE '  - agent_conversation_messages (mensagens individuais)';
  RAISE NOTICE '';
  RAISE NOTICE 'VIEWS CRIADAS:';
  RAISE NOTICE '  - vw_crm_messages_for_reflection';
  RAISE NOTICE '  - vw_n8n_messages_for_reflection';
  RAISE NOTICE '  - vw_unified_messages_for_reflection';
  RAISE NOTICE '  - vw_conversations_for_reflection';
  RAISE NOTICE '';
  RAISE NOTICE 'TRIGGERS CRIADOS:';
  RAISE NOTICE '  - trigger_sync_crm_to_reflection (crm_historico_mensagens)';
  RAISE NOTICE '  - trigger_sync_n8n_to_reflection (n8n_historico_mensagens)';
  RAISE NOTICE '';
  RAISE NOTICE 'FUNCOES CRIADAS:';
  RAISE NOTICE '  - sync_crm_message_to_reflection()';
  RAISE NOTICE '  - sync_n8n_message_to_reflection()';
  RAISE NOTICE '  - get_conversations_for_reflection()';
  RAISE NOTICE '  - migrate_existing_messages_to_reflection()';
  RAISE NOTICE '';
  RAISE NOTICE 'PROXIMOS PASSOS:';
  RAISE NOTICE '  1. Execute no Supabase SQL Editor';
  RAISE NOTICE '  2. Novas mensagens serao sincronizadas automaticamente';
  RAISE NOTICE '  3. Reflection Loop pode usar get_conversations_for_reflection()';
  RAISE NOTICE '============================================';
END $$;
