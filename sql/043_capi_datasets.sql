-- migration: 043_capi_datasets.sql
-- autor: supabase-dba agent
-- data: 2026-02-27
-- descricao: Adiciona campos CAPI (Conversions API) ao brand_configs
--            para armazenar dataset_id e access_token do Meta Events Manager.
--            Cada location com ads ativo precisa de 1 dataset no Meta.
--
-- LGPD: meta_capi_access_token e system user token (nao expira).
--        Nunca expor em client-side. Apenas service_role acessa.

-- ============================================================
-- UP
-- ============================================================

ALTER TABLE brand_configs
  ADD COLUMN IF NOT EXISTS meta_dataset_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_capi_access_token TEXT;

-- Comentarios
COMMENT ON COLUMN brand_configs.meta_dataset_id IS 'Dataset ID do Meta Events Manager para CAPI (1 por ad account)';
COMMENT ON COLUMN brand_configs.meta_capi_access_token IS 'System User Token do Meta para CAPI (nao expira). NAO expor em client-side.';

-- RLS: meta_capi_access_token NAO deve ser retornado via REST API anon.
-- Como brand_configs ja tem RLS configurado, o token so e acessivel via service_role.
-- Reforcar: NUNCA criar policy SELECT anon que inclua meta_capi_access_token.

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- ALTER TABLE brand_configs DROP COLUMN IF EXISTS meta_dataset_id;
-- ALTER TABLE brand_configs DROP COLUMN IF EXISTS meta_capi_access_token;
-- COMMIT;
