-- ============================================================================
-- Migration 075: Health Score - Tabelas base
-- Obsessao: Entrega Extraordinaria
-- ============================================================================

-- Tabela para inputs manuais de satisfacao e pagamento
CREATE TABLE IF NOT EXISTS client_health_manual_inputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('satisfaction', 'payment')),
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rapida por location
CREATE INDEX IF NOT EXISTS idx_health_manual_location
  ON client_health_manual_inputs(location_id, dimension, recorded_at DESC);

-- RLS: restrito a locations do usuario via user_locations
ALTER TABLE client_health_manual_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read health inputs for their locations"
  ON client_health_manual_inputs FOR SELECT
  TO authenticated USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_locations ul
      WHERE ul.user_id = auth.uid() AND ul.role = 'admin'
    )
  );

-- INSERT somente via RPC save_health_manual_input (SECURITY DEFINER)
-- Nao ha policy de INSERT direto — forcamos uso da RPC

-- Tabela para snapshots diarios do health score (cache)
CREATE TABLE IF NOT EXISTS client_health_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score_overall NUMERIC(5,2) NOT NULL,
  score_engagement NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_scheduling NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_satisfaction NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_activity NUMERIC(5,2) NOT NULL DEFAULT 0,
  score_payment NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'healthy' CHECK (risk_level IN ('critical', 'at_risk', 'healthy', 'excellent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_location
  ON client_health_snapshots(location_id, snapshot_date DESC);

ALTER TABLE client_health_snapshots ENABLE ROW LEVEL SECURITY;

-- SELECT restrito a locations do usuario (admins veem tudo)
CREATE POLICY "Users can read health snapshots for their locations"
  ON client_health_snapshots FOR SELECT
  TO authenticated USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul WHERE ul.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_locations ul
      WHERE ul.user_id = auth.uid() AND ul.role = 'admin'
    )
  );

-- INSERT somente via RPC/backend (sem policy de INSERT direto)
