-- Migration: Add theme_overrides JSONB to brand_configs
-- Purpose: Structured CSS variable overrides for whitelabel theming
-- Rollback: ALTER TABLE public.brand_configs DROP COLUMN IF EXISTS theme_overrides;

ALTER TABLE public.brand_configs
  ADD COLUMN IF NOT EXISTS theme_overrides JSONB DEFAULT '{}';

COMMENT ON COLUMN public.brand_configs.theme_overrides IS
  'CSS variable overrides for whitelabel theming. Keys map to --color-* vars (e.g. accent-primary → --color-accent-primary). Special keys: favicon-url, page-title.';

-- Seed existing brands: use primary_color as accent-primary
UPDATE public.brand_configs
  SET theme_overrides = jsonb_build_object('accent-primary', primary_color)
  WHERE primary_color IS NOT NULL
    AND (theme_overrides IS NULL OR theme_overrides = '{}'::jsonb);
