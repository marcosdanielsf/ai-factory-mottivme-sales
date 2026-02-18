-- ================================================
-- Agent Improvement Logs Table
-- ================================================
-- Stores weekly quality analysis from workflow 20-Improver-Semanal
-- Tracks scores (PNL, Neurovendas, Pessoas) to skip locations with 3x >= 85

CREATE TABLE IF NOT EXISTS agent_improvement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('weekly', 'manual')),
  
  -- Scores (0-100)
  score_pnl INTEGER CHECK (score_pnl >= 0 AND score_pnl <= 100),
  score_neurovendas INTEGER CHECK (score_neurovendas >= 0 AND score_neurovendas <= 100),
  score_pessoas INTEGER CHECK (score_pessoas >= 0 AND score_pessoas <= 100),
  score_media INTEGER CHECK (score_media >= 0 AND score_media <= 100),
  
  -- Issues e improvements (JSONB arrays)
  issues_found JSONB DEFAULT '[]',
  improvements_applied JSONB DEFAULT '[]',
  
  -- Se foi gerada uma nova versao
  version_improved BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for CTE performance
CREATE INDEX IF NOT EXISTS idx_improvement_logs_location ON agent_improvement_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_improvement_logs_created ON agent_improvement_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_improvement_logs_score_media ON agent_improvement_logs(score_media);
CREATE INDEX IF NOT EXISTS idx_improvement_logs_location_created ON agent_improvement_logs(location_id, created_at DESC);

-- RLS (service_role bypasses, but good practice)
ALTER TABLE agent_improvement_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_agent_improvement_logs ON agent_improvement_logs;
CREATE POLICY service_role_agent_improvement_logs ON agent_improvement_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Comments
COMMENT ON TABLE agent_improvement_logs IS 'Weekly agent quality analysis logs from 20-Improver-Semanal workflow';
COMMENT ON COLUMN agent_improvement_logs.score_media IS 'Average of 3 scores (PNL, Neurovendas, Pessoas)';
COMMENT ON COLUMN agent_improvement_logs.version_improved IS 'TRUE if a new agent version was generated';

