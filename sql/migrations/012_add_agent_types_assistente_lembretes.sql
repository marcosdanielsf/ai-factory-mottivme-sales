-- =====================================================
-- MIGRATION 012: Adicionar novos agent_types
--
-- Novos tipos: assistente_interno, lembretes
-- Baseado na análise de workflows 08, 11
--
-- Data: Janeiro 2026
-- =====================================================

-- ============================================
-- 1. DOCUMENTAÇÃO DOS NOVOS TIPOS
-- ============================================

/*
AGENT_TYPES EXISTENTES:
- head-vendas: Análise de calls de vendas, diagnósticos
- sdr: SDR/prospecção automatizada
- qa: Quality Assurance de conversas
- general: Prompts genéricos

NOVOS AGENT_TYPES:

1. assistente_interno
   - Origem: Workflow 08 (Agente Assistente Interno)
   - Propósito: Assistente para gestores/profissionais (não clientes)
   - Capacidades: Gmail, Google Tasks, Calendar, Asaas, desmarcar agendamentos
   - Trigger: Chatwoot com label "gestor"

2. lembretes
   - Origem: Workflow 11 (Agente de Lembretes de Agendamento)
   - Propósito: Enviar lembretes automáticos de consultas/agendamentos
   - Capacidades: Verificar eventos próximos, enviar WhatsApp, marcar lembrete enviado
   - Trigger: Schedule (1 min)
*/


-- ============================================
-- 2. VERIFICAR TIPOS EXISTENTES (diagnóstico)
-- ============================================

-- Executar ANTES da migration para ver estado atual:
-- SELECT DISTINCT unnest(agent_types) as agent_type FROM prompt_catalog ORDER BY 1;


-- ============================================
-- 3. TABELA DE REFERÊNCIA DE AGENT_TYPES
-- ============================================

-- Criar tabela de referência para documentar os tipos válidos
-- Isso facilita manutenção e validação futura

CREATE TABLE IF NOT EXISTS agent_type_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  type_key VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Categorização
  category VARCHAR(50) DEFAULT 'operational', -- 'sales', 'operational', 'support', 'internal'
  icon VARCHAR(10) DEFAULT '🤖',
  color VARCHAR(20) DEFAULT '#6b7280',

  -- Configuração
  default_tools JSONB DEFAULT '[]', -- Tools padrão para este tipo
  default_model VARCHAR(50) DEFAULT 'gpt-4o-mini',

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_agent_type_definitions_key ON agent_type_definitions(type_key);
CREATE INDEX IF NOT EXISTS idx_agent_type_definitions_active ON agent_type_definitions(is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_agent_type_definitions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agent_type_definitions_updated ON agent_type_definitions;
CREATE TRIGGER trigger_agent_type_definitions_updated
  BEFORE UPDATE ON agent_type_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_type_definitions_timestamp();


-- ============================================
-- 4. POPULAR TIPOS EXISTENTES
-- ============================================

INSERT INTO agent_type_definitions (type_key, display_name, description, category, icon, color, default_tools)
VALUES
  -- Tipos existentes
  ('head-vendas', 'Head de Vendas', 'Análise de calls de vendas, diagnósticos, follow-ups estratégicos', 'sales', '💼', '#10b981',
   '["analisar_call", "buscar_contexto_lead", "gerar_followup"]'::jsonb),

  ('sdr', 'SDR', 'Prospecção automatizada, qualificação de leads, agendamento', 'sales', '📞', '#3b82f6',
   '["buscar_agenda", "agendar_compromisso", "qualificar_lead"]'::jsonb),

  ('qa', 'Quality Assurance', 'Avaliação de qualidade de atendimentos e conversas', 'support', '✅', '#8b5cf6',
   '["avaliar_conversa", "gerar_feedback", "criar_report"]'::jsonb),

  ('general', 'Geral', 'Prompts de uso geral sem especialização', 'operational', '📝', '#6b7280',
   '[]'::jsonb),

  -- NOVOS TIPOS (workflows 08 e 11)
  ('assistente_interno', 'Assistente Interno',
   'Assistente para gestores e profissionais internos. Gerencia emails, tarefas, agenda e finanças. Não atende clientes externos.',
   'internal', '🏢', '#f59e0b',
   '["ler_emails", "criar_tarefa", "buscar_eventos", "desmarcar_agendamento", "buscar_saldo", "buscar_extrato", "estatisticas_cobrancas"]'::jsonb),

  ('lembretes', 'Agente de Lembretes',
   'Envia lembretes automáticos de agendamentos via WhatsApp. Verifica eventos próximos e marca lembretes como enviados.',
   'operational', '⏰', '#ef4444',
   '["buscar_eventos_proximos", "enviar_mensagem_chatwoot", "marcar_lembrete_enviado", "buscar_contato"]'::jsonb)

ON CONFLICT (type_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  default_tools = EXCLUDED.default_tools,
  updated_at = NOW();


-- ============================================
-- 5. FUNÇÃO HELPER PARA VALIDAR AGENT_TYPE
-- ============================================

CREATE OR REPLACE FUNCTION is_valid_agent_type(p_type VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agent_type_definitions
    WHERE type_key = p_type AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 6. FUNÇÃO PARA LISTAR TIPOS ATIVOS
-- ============================================

CREATE OR REPLACE FUNCTION get_active_agent_types()
RETURNS TABLE (
  type_key VARCHAR,
  display_name VARCHAR,
  description TEXT,
  category VARCHAR,
  icon VARCHAR,
  color VARCHAR,
  default_tools JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    atd.type_key,
    atd.display_name,
    atd.description,
    atd.category,
    atd.icon,
    atd.color,
    atd.default_tools
  FROM agent_type_definitions atd
  WHERE atd.is_active = true
  ORDER BY
    CASE atd.category
      WHEN 'sales' THEN 1
      WHEN 'operational' THEN 2
      WHEN 'support' THEN 3
      WHEN 'internal' THEN 4
      ELSE 5
    END,
    atd.display_name;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 7. VIEW PARA CONSULTA RÁPIDA
-- ============================================

CREATE OR REPLACE VIEW v_agent_types AS
SELECT
  type_key,
  display_name,
  description,
  category,
  icon,
  color,
  default_tools,
  created_at
FROM agent_type_definitions
WHERE is_active = true
ORDER BY category, display_name;


-- ============================================
-- 8. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE agent_type_definitions IS 'Tabela de referência com todos os tipos de agentes válidos no sistema';
COMMENT ON COLUMN agent_type_definitions.type_key IS 'Chave única do tipo (usada em prompt_catalog.agent_types)';
COMMENT ON COLUMN agent_type_definitions.category IS 'Categoria: sales, operational, support, internal';
COMMENT ON COLUMN agent_type_definitions.default_tools IS 'Array JSON com tools padrão recomendadas para este tipo';


-- ============================================
-- VERIFICAÇÃO PÓS-MIGRATION
-- ============================================

-- Executar após a migration para confirmar:
-- SELECT * FROM v_agent_types;
-- SELECT * FROM get_active_agent_types();
-- SELECT is_valid_agent_type('assistente_interno');  -- deve retornar true
-- SELECT is_valid_agent_type('lembretes');           -- deve retornar true
-- SELECT is_valid_agent_type('tipo_invalido');       -- deve retornar false


-- =====================================================
-- FIM DA MIGRATION 012
-- =====================================================
