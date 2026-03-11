-- =============================================================
-- migration: 011_brand_fix_rls_public_bucket.sql
-- descricao: Fix integracao Brand Portal ↔ AI Factory
--   1. Torna bucket brandpacks PUBLICO (getPublicUrl precisa)
--   2. Adiciona RLS permissiva para usuarios autenticados
--      (brand assets sao identidade visual, nao dados sensiveis)
--   3. Garante location_id existe (migration 010 pode nao ter sido aplicada)
-- rollback: ver secao DOWN no final
-- =============================================================

BEGIN;

-- ============================================================
-- 1. BUCKET PUBLICO
-- ============================================================
-- O bucket foi criado como private no 001_schema.sql.
-- getPublicUrl (usado no AI Factory client-side) precisa de bucket publico.
UPDATE storage.buckets
  SET public = true
  WHERE id = 'brandpacks';

-- ============================================================
-- 2. RLS — POLICIES PERMISSIVAS PARA AUTENTICADOS
-- ============================================================
-- O AI Factory usa Supabase Auth (anon key + user session).
-- Policies originais exigem brand_users, mas AI Factory admins
-- nao estao nessa tabela. Solucao: qualquer autenticado le brands.

-- brand_configs: qualquer autenticado pode ler
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_configs'
      AND policyname = 'brand_configs: authenticated read all'
  ) THEN
    CREATE POLICY "brand_configs: authenticated read all"
      ON public.brand_configs FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- brand_assets: qualquer autenticado pode ler
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_assets'
      AND policyname = 'brand_assets: authenticated read all'
  ) THEN
    CREATE POLICY "brand_assets: authenticated read all"
      ON public.brand_assets FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- brand_users: manter policy original (so ve suas proprias linhas)
-- Nao precisa de mudanca aqui

-- ============================================================
-- 3. LOCATION_ID (idempotente — caso 010 nao tenha sido aplicada)
-- ============================================================
ALTER TABLE public.brand_configs
  ADD COLUMN IF NOT EXISTS location_id TEXT;

CREATE INDEX IF NOT EXISTS idx_brand_configs_location_id
  ON public.brand_configs(location_id);

-- Atualizar brands existentes com location_ids do GHL (idempotente)
UPDATE public.brand_configs SET location_id = 'cd1uyzpJox6XPt4Vct8Y' WHERE client_slug = 'socialfy'          AND location_id IS NULL;
UPDATE public.brand_configs SET location_id = 'GT77iGk2WDneoHwtuq6D' WHERE client_slug = 'dr-alberto-correia' AND location_id IS NULL;
UPDATE public.brand_configs SET location_id = 'pFHwENFUxjtiON94jn2k' WHERE client_slug = 'dra-eline-lobo'     AND location_id IS NULL;
UPDATE public.brand_configs SET location_id = 'ehlHgDeJS3sr8rCDcZtA' WHERE client_slug = 'vss'                AND location_id IS NULL;
UPDATE public.brand_configs SET location_id = '4ncGXJgs8EC5zOplK3mT' WHERE client_slug = 'lumar'              AND location_id IS NULL;

COMMIT;

-- ============================================================
-- VALIDACAO POS-EXECUCAO
-- ============================================================
-- Rodar apos aplicar:
--
-- -- Bucket agora publico?
-- SELECT id, name, public FROM storage.buckets WHERE id = 'brandpacks';
--
-- -- Policies novas criadas?
-- SELECT policyname, cmd FROM pg_policies
-- WHERE tablename IN ('brand_configs','brand_assets')
-- ORDER BY tablename, policyname;
--
-- -- Brands com location_id?
-- SELECT client_slug, client_name, location_id FROM brand_configs;
--
-- -- Testar URL publica (colar no browser):
-- -- https://bfumywvwubvernvhjehk.supabase.co/storage/v1/object/public/brandpacks/socialfy/logos/svg/Logo_socialfy_Primary.svg

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- UPDATE storage.buckets SET public = false WHERE id = 'brandpacks';
-- DROP POLICY IF EXISTS "brand_configs: authenticated read all" ON public.brand_configs;
-- DROP POLICY IF EXISTS "brand_assets: authenticated read all" ON public.brand_assets;
-- COMMIT;
