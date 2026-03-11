-- migration: 047_meta_audiences.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: Tabela para armazenar Custom Audiences e Lookalike Audiences
--            criadas automaticamente no Meta Ads via n8n workflow semanal.
--
-- Fluxo: Buscar leads qualificados → hash SHA-256 → POST /act_{id}/customaudiences
--        Apos 100+ leads: criar Lookalike (1% BR, similarity mode)

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS meta_custom_audiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Contexto
  location_id TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,        -- act_XXXXX

  -- Audience Meta
  audience_id TEXT NOT NULL,           -- ID retornado pelo Meta
  audience_name TEXT NOT NULL,
  audience_type TEXT NOT NULL DEFAULT 'custom',  -- custom, lookalike
  subtype TEXT,                        -- CUSTOM, LOOKALIKE, etc.

  -- Config
  source_audience_id TEXT,             -- Para lookalike: audience base
  lookalike_spec JSONB,                -- ratio, country, type
  rule JSONB,                          -- Regras de inclusao (para custom audiences baseadas em regras)

  -- Status
  approximate_count INTEGER,           -- Tamanho estimado da audience
  delivery_status TEXT,                -- ready, too_small, etc.
  operation_status TEXT,               -- NORMAL, IN_PROGRESS, etc.

  -- Sync
  last_synced_at TIMESTAMPTZ,
  leads_count INTEGER DEFAULT 0,       -- Qtd de leads na ultima sync

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique: 1 audience por tipo por location
  UNIQUE(location_id, audience_name)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_meta_audiences_location ON meta_custom_audiences(location_id);
CREATE INDEX IF NOT EXISTS idx_meta_audiences_type ON meta_custom_audiences(audience_type);
CREATE INDEX IF NOT EXISTS idx_meta_audiences_account ON meta_custom_audiences(ad_account_id);

-- Permissoes
GRANT SELECT ON meta_custom_audiences TO authenticated;

-- Comentarios
COMMENT ON TABLE meta_custom_audiences IS 'Custom Audiences e Lookalike Audiences criadas automaticamente no Meta Ads';
COMMENT ON COLUMN meta_custom_audiences.audience_id IS 'ID da audience retornado pela Meta API';
COMMENT ON COLUMN meta_custom_audiences.audience_type IS 'custom (leads hasheados) ou lookalike (1% similarity)';
COMMENT ON COLUMN meta_custom_audiences.leads_count IS 'Quantidade de leads incluidos na ultima sincronizacao';

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP TABLE IF EXISTS meta_custom_audiences;
-- COMMIT;
