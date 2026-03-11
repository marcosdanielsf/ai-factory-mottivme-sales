-- migration: 049_agent_conversation_audits.sql
-- autor: supabase-dba agent
-- data: 2026-02-28
-- descricao: Tabela de auditoria de conversas de agentes IA.
--            Armazena health score, scores por dimensao (8 dimensoes),
--            achados, metricas e recomendacoes por auditoria diaria.
--            Views: vw_agent_audit_scorecard (ultima + trend) e
--                   vw_agent_audit_history (evolucao temporal).
--
-- Depende de: agent_versions (FK conceitual via agent_version_id)

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_conversation_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_version_id UUID NOT NULL,  -- FK conceitual para agent_versions
  location_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_version TEXT NOT NULL,  -- ex: "v3.12.0"

  -- Janela da auditoria
  conversations_count INTEGER NOT NULL DEFAULT 0,
  messages_count INTEGER NOT NULL DEFAULT 0,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,

  -- Scores
  health_score NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0-100, media ponderada
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,      -- 8 dimensoes: {"tool_calls": 8.5, "phase_flow": 7.0, ...}

  -- Achados
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,          -- array [{severity, dimension, title, evidence, recommendation}]
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,            -- {scheduling_rate, qualification_rate, avg_messages, ...}
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,    -- array [{priority, action, expected_impact}]

  -- Meta
  audited_by TEXT NOT NULL DEFAULT 'claude',
  model_used TEXT,
  notes TEXT,
  audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coluna gerada para UNIQUE constraint (DATE() nao e IMMUTABLE em PG)
ALTER TABLE agent_conversation_audits
  ADD COLUMN IF NOT EXISTS audited_at_date DATE
  GENERATED ALWAYS AS ((audited_at AT TIME ZONE 'America/Sao_Paulo')::date) STORED;

-- Constraint: maxima 1 auditoria por agente por dia
ALTER TABLE agent_conversation_audits
  ADD CONSTRAINT uq_aca_version_day
  UNIQUE (agent_version_id, audited_at_date);

-- Indices
CREATE INDEX IF NOT EXISTS idx_aca_location
  ON agent_conversation_audits (location_id);

CREATE INDEX IF NOT EXISTS idx_aca_audited_at
  ON agent_conversation_audits (audited_at DESC);

CREATE INDEX IF NOT EXISTS idx_aca_health_score
  ON agent_conversation_audits (health_score);

CREATE INDEX IF NOT EXISTS idx_aca_version
  ON agent_conversation_audits (agent_version_id);

-- RLS
ALTER TABLE agent_conversation_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_location_audits"
  ON agent_conversation_audits
  FOR SELECT TO authenticated
  USING (
    location_id IN (
      SELECT location_id FROM user_locations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "insert_own_location_audits"
  ON agent_conversation_audits
  FOR INSERT TO authenticated
  WITH CHECK (
    location_id IN (
      SELECT location_id FROM user_locations
      WHERE user_id = auth.uid()
    )
  );

-- GRANTs tabela
GRANT SELECT, INSERT ON agent_conversation_audits TO authenticated;

-- Comentario na tabela
COMMENT ON TABLE agent_conversation_audits IS
  'Auditoria de conversas de agentes IA: health score (0-100), scores por 8 dimensoes, achados e recomendacoes. Max 1 registro por agente por dia.';

-- ============================================================
-- Views
-- ============================================================

-- View: ultima auditoria por agente + trend (media 3 ultimas) + health_status
CREATE OR REPLACE VIEW vw_agent_audit_scorecard AS
WITH latest AS (
  SELECT DISTINCT ON (agent_version_id) *
  FROM agent_conversation_audits
  ORDER BY agent_version_id, audited_at DESC
),
trend AS (
  SELECT
    agent_version_id,
    AVG(health_score) AS avg_health_3,
    COUNT(*) AS audit_count
  FROM (
    SELECT
      agent_version_id,
      health_score,
      ROW_NUMBER() OVER (
        PARTITION BY agent_version_id
        ORDER BY audited_at DESC
      ) AS rn
    FROM agent_conversation_audits
  ) sub
  WHERE rn <= 3
  GROUP BY agent_version_id
)
SELECT
  l.*,
  t.avg_health_3   AS trend_health,
  t.audit_count    AS total_audits,
  CASE
    WHEN l.health_score >= 80 THEN 'healthy'
    WHEN l.health_score >= 60 THEN 'warning'
    ELSE 'critical'
  END AS health_status
FROM latest l
LEFT JOIN trend t ON t.agent_version_id = l.agent_version_id;

-- View: historico completo para grafico de evolucao
CREATE OR REPLACE VIEW vw_agent_audit_history AS
SELECT
  id,
  agent_version_id,
  agent_name,
  agent_version,
  location_id,
  health_score,
  scores,
  conversations_count,
  messages_count,
  findings,
  audited_at
FROM agent_conversation_audits
ORDER BY audited_at DESC;

-- GRANTs views
GRANT SELECT ON vw_agent_audit_scorecard TO authenticated;
GRANT SELECT ON vw_agent_audit_history TO authenticated;

-- Comentarios nas views
COMMENT ON VIEW vw_agent_audit_scorecard IS
  'Ultima auditoria por agente com trend (media health_score das 3 ultimas) e health_status derivado: healthy (>=80), warning (60-79), critical (<60).';

COMMENT ON VIEW vw_agent_audit_history IS
  'Historico completo de auditorias de agentes para grafico de evolucao temporal do health_score.';

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP VIEW IF EXISTS vw_agent_audit_history;
-- DROP VIEW IF EXISTS vw_agent_audit_scorecard;
-- DROP TABLE IF EXISTS agent_conversation_audits;
-- COMMIT;
