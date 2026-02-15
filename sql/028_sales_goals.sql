-- ============================================================================
-- 028: Tabela de Metas de Vendas (Sales Goals)
-- Feature: Planejamento vs Realizado
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,

  -- Periodo
  period_type TEXT NOT NULL DEFAULT 'monthly'
    CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'custom')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metas por bucket de origem
  goal_leads_social_selling INTEGER DEFAULT 0,
  goal_leads_trafego INTEGER DEFAULT 0,
  goal_leads_organico INTEGER DEFAULT 0,
  goal_leads_total INTEGER DEFAULT 0,

  -- Metas de funil
  goal_responderam INTEGER DEFAULT 0,
  goal_agendamentos INTEGER DEFAULT 0,
  goal_comparecimentos INTEGER DEFAULT 0,
  goal_vendas INTEGER DEFAULT 0,

  -- Metas financeiras
  goal_revenue_brl DECIMAL(12,2) DEFAULT 0,
  ticket_medio_estimado DECIMAL(10,2) DEFAULT 0,
  goal_conversion_rate DECIMAL(5,2) DEFAULT 0,

  -- Inputs da calculadora (persistir pra reproduzir cenario)
  calc_daily_investment DECIMAL(10,2) DEFAULT 0,
  calc_cpl DECIMAL(10,2) DEFAULT 0,
  calc_qualification_rate DECIMAL(5,2) DEFAULT 0,
  calc_scheduling_rate DECIMAL(5,2) DEFAULT 0,
  calc_attendance_rate DECIMAL(5,2) DEFAULT 0,
  calc_conversion_rate DECIMAL(5,2) DEFAULT 0,
  calc_average_ticket DECIMAL(10,2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT period_valid CHECK (period_end >= period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_goals_location_period
  ON sales_goals(location_id, period_start, period_end)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_sales_goals_active
  ON sales_goals(is_active, period_start, period_end);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sales_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_goals_updated_at ON sales_goals;
CREATE TRIGGER trg_sales_goals_updated_at
  BEFORE UPDATE ON sales_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_goals_updated_at();
