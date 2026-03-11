-- ============================================
-- OPS HUB: Tabela de workflows e recursos
-- Permite persistir categorizacao, notas e
-- recursos extras editaveis pelo dashboard
-- ============================================

-- Tabela principal
CREATE TABLE IF NOT EXISTS ops_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,                    -- ID do n8n (ex: IawOpB56MTFoEP3M)
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'workflow', -- workflow | link | file | api_key
  status TEXT DEFAULT 'on',             -- on | off
  sector TEXT NOT NULL,                 -- marketing | comercial | administrativo | operacoes | ai-factory | clientes
  sub_sector TEXT NOT NULL,             -- ex: pre-vendas, financeiro, conteudo
  url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',          -- dados extras flexiveis
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de recursos (links, docs, API keys por sub-setor)
CREATE TABLE IF NOT EXISTS ops_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  sub_sector TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT,
  type TEXT DEFAULT 'link',              -- doc | dashboard | api | tool | repo
  is_sensitive BOOLEAN DEFAULT false,    -- true para API keys (ocultar valor)
  value_encrypted TEXT,                  -- valor encriptado para API keys
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ops_workflows_sector ON ops_workflows(sector);
CREATE INDEX IF NOT EXISTS idx_ops_workflows_sub_sector ON ops_workflows(sub_sector);
CREATE INDEX IF NOT EXISTS idx_ops_workflows_external_id ON ops_workflows(external_id);
CREATE INDEX IF NOT EXISTS idx_ops_workflows_pinned ON ops_workflows(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_ops_resources_sector ON ops_resources(sector, sub_sector);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION ops_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ops_workflows_updated ON ops_workflows;
CREATE TRIGGER trg_ops_workflows_updated
  BEFORE UPDATE ON ops_workflows
  FOR EACH ROW EXECUTE FUNCTION ops_workflows_updated_at();

-- RLS
ALTER TABLE ops_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_resources ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_ops_workflows_all" ON ops_workflows
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "admin_ops_resources_all" ON ops_resources
  FOR ALL USING (auth.role() = 'authenticated');

-- View resumo por setor
CREATE OR REPLACE VIEW vw_ops_hub_summary AS
SELECT
  sector,
  sub_sector,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'on') as active,
  COUNT(*) FILTER (WHERE is_pinned) as pinned,
  MAX(updated_at) as last_updated
FROM ops_workflows
GROUP BY sector, sub_sector
ORDER BY sector, sub_sector;

-- ROLLBACK:
-- DROP VIEW IF EXISTS vw_ops_hub_summary;
-- DROP TRIGGER IF EXISTS trg_ops_workflows_updated ON ops_workflows;
-- DROP FUNCTION IF EXISTS ops_workflows_updated_at();
-- DROP TABLE IF EXISTS ops_resources;
-- DROP TABLE IF EXISTS ops_workflows;
