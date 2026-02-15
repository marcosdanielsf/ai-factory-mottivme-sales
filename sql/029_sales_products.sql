-- ============================================================================
-- 029: Tabela sales_products + ALTER sales_goals
-- Suporta wizard de planejamento: Produtos + Marketing + Vendas
-- ============================================================================

-- Tabela de produtos por cliente
CREATE TABLE IF NOT EXISTS sales_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ticket DECIMAL(10,2) NOT NULL DEFAULT 1000,
  sales_cycle_days INTEGER DEFAULT 30,
  target_units INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_products_location
  ON sales_products(location_id) WHERE is_active = TRUE;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_sales_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_products_updated_at ON sales_products;
CREATE TRIGGER trg_sales_products_updated_at
  BEFORE UPDATE ON sales_products
  FOR EACH ROW EXECUTE FUNCTION update_sales_products_updated_at();

-- Novos campos no sales_goals para snapshot do wizard
ALTER TABLE sales_goals ADD COLUMN IF NOT EXISTS products_snapshot JSONB DEFAULT '[]';
ALTER TABLE sales_goals ADD COLUMN IF NOT EXISTS marketing_config JSONB DEFAULT '{}';
ALTER TABLE sales_goals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
