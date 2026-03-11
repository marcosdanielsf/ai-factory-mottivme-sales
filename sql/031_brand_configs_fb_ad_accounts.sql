-- ============================================================
-- 031: Adicionar coluna facebook_ad_account_ids em brand_configs
-- Para mapear ad accounts do Facebook por cliente (location)
-- ============================================================

ALTER TABLE brand_configs
ADD COLUMN IF NOT EXISTS facebook_ad_account_ids TEXT[];

COMMENT ON COLUMN brand_configs.facebook_ad_account_ids IS 'Array de IDs de contas de anuncio do Facebook (ex: act_123456789). Usados pelo workflow n8n Metricas Ads para puxar dados por cliente.';
