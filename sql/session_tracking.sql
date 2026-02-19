-- Session Tracking: logs de tempo e uso do Claude Code
-- Tabela: session_events (INSERT only, append-only log)
-- View: vw_session_summary (agregacao por sessao)
-- Rollback: DROP VIEW + DROP TABLE no final

-- ============================================
-- TABLE: session_events
-- ============================================
CREATE TABLE IF NOT EXISTS session_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id    UUID NOT NULL,
  event_type    TEXT NOT NULL CHECK (event_type IN ('session_start', 'tool_use', 'session_end')),
  tool_name     TEXT,
  agent_type    TEXT,
  file_path     TEXT,
  prompt_preview TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes para queries rapidas
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events (session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_created_at ON session_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_events_event_type ON session_events (event_type);

-- RLS: service role pode tudo, anon pode ler
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_events_anon_select"
  ON session_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "session_events_service_insert"
  ON session_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "session_events_service_select"
  ON session_events FOR SELECT
  TO service_role
  USING (true);

-- ============================================
-- VIEW: vw_session_summary
-- ============================================
CREATE OR REPLACE VIEW vw_session_summary AS
SELECT
  s.session_id,
  MIN(s.created_at) FILTER (WHERE s.event_type = 'session_start') AS started_at,
  MAX(s.created_at) FILTER (WHERE s.event_type = 'session_end') AS ended_at,
  ROUND(
    EXTRACT(EPOCH FROM (
      COALESCE(
        MAX(s.created_at) FILTER (WHERE s.event_type = 'session_end'),
        MAX(s.created_at)
      ) -
      MIN(s.created_at) FILTER (WHERE s.event_type = 'session_start')
    )) / 60.0, 1
  ) AS duration_min,
  COUNT(*) FILTER (WHERE s.event_type = 'tool_use') AS tool_count,
  (
    SELECT jsonb_object_agg(tool_name, cnt)
    FROM (
      SELECT tool_name, COUNT(*) AS cnt
      FROM session_events
      WHERE session_id = s.session_id AND event_type = 'tool_use' AND tool_name IS NOT NULL
      GROUP BY tool_name
    ) t
  ) AS tool_counts,
  ARRAY_AGG(DISTINCT s.agent_type) FILTER (WHERE s.agent_type IS NOT NULL) AS agents_used,
  ARRAY_AGG(DISTINCT s.file_path) FILTER (WHERE s.file_path IS NOT NULL) AS files_modified,
  (MIN(s.prompt_preview) FILTER (WHERE s.event_type = 'session_start')) AS first_prompt
FROM session_events s
GROUP BY s.session_id
ORDER BY MIN(s.created_at) DESC;

-- ============================================
-- ROLLBACK (descomente se precisar reverter)
-- ============================================
-- DROP VIEW IF EXISTS vw_session_summary;
-- DROP TABLE IF EXISTS session_events;
