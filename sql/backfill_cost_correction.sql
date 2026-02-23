-- backfill_cost_correction.sql
-- Correcao de acuracia de custos LLM
-- Problema: tokens estimados por chars/3.4 vs tokens reais da API Gemini
-- Gap: ~$36 USD trackado vs ~$345 USD cobrado pelo Google Cloud (~10x)
-- Causa raiz: gemini-2.5-pro tem "thinking tokens" cobrados como output mas invisiveis no texto
--
-- Abordagem:
--   1. Adicionar colunas de backup (rastreabilidade)
--   2. Salvar valores originais
--   3. Corrigir tokens por modelo:
--      - gemini-2.5-pro: input*3 + 8000 thinking tokens no output (media estimada)
--      - gemini-2.0-flash: input*3.5, output*3.5 (chars/3.4 subestima)
--      - gemini-1.5-pro: input*3, output*3
--      - groq/claude/gpt: ja corretos (tokens vem da API)
--   4. Recalcular custo_usd com tokens corrigidos
--   5. Adicionar coluna tokens_source para futuro (api vs estimated)
--
-- Rollback: valores originais em *_original columns
-- Validacao: SUM(custo_usd) deve ficar entre $250-$400 (vs ~$345 Google Cloud)
--
-- Data: 2026-02-23
-- Autor: Claude + Marcos Daniels
-- ============================================================================

-- ============================================================================
-- PASSO 1: Adicionar colunas de backup + tokens_source
-- ============================================================================
ALTER TABLE llm_costs ADD COLUMN IF NOT EXISTS tokens_input_original INTEGER;
ALTER TABLE llm_costs ADD COLUMN IF NOT EXISTS tokens_output_original INTEGER;
ALTER TABLE llm_costs ADD COLUMN IF NOT EXISTS custo_usd_original NUMERIC;
ALTER TABLE llm_costs ADD COLUMN IF NOT EXISTS correction_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE llm_costs ADD COLUMN IF NOT EXISTS tokens_source TEXT DEFAULT 'estimated';

-- ============================================================================
-- PASSO 2: Salvar valores originais (apenas se ainda nao corrigidos)
-- ============================================================================
UPDATE llm_costs SET
  tokens_input_original = tokens_input,
  tokens_output_original = tokens_output,
  custo_usd_original = custo_usd
WHERE correction_applied IS NOT TRUE;

-- ============================================================================
-- PASSO 3: Corrigir tokens por modelo
-- ============================================================================

-- 3a. gemini-2.5-pro (sem +flash)
-- Input: *3 (system prompt + historico subestimados)
-- Output: + 8000 thinking tokens por request (media estimada do billing Google Cloud)
-- Justificativa: avg_out=30 tokens estimados vs ~8000 tokens reais com thinking
UPDATE llm_costs SET
  tokens_input = tokens_input * 3,
  tokens_output = tokens_output + 8000,
  correction_applied = TRUE
WHERE modelo_ia = 'gemini-2.5-pro'
  AND correction_applied IS NOT TRUE;

-- 3b. gemini-2.5-pro+flash (modelo combinado)
-- Mesma logica: thinking tokens do pro + flash parser
UPDATE llm_costs SET
  tokens_input = tokens_input * 3,
  tokens_output = tokens_output + 8000,
  correction_applied = TRUE
WHERE modelo_ia = 'gemini-2.5-pro+flash'
  AND correction_applied IS NOT TRUE;

-- 3c. gemini-2.0-flash (sem thinking tokens)
-- Input: *3.5 (prompt fixo 750 vs real ~2500+)
-- Output: *3.5 (chars/3.4 subestima tokenizacao real)
UPDATE llm_costs SET
  tokens_input = ROUND(tokens_input * 3.5)::integer,
  tokens_output = ROUND(tokens_output * 3.5)::integer,
  correction_applied = TRUE
WHERE modelo_ia = 'gemini-2.0-flash'
  AND correction_applied IS NOT TRUE;

-- 3d. gemini-1.5-pro e gemini-1.5-flash
-- Input: *3, Output: *3 (similar, sem thinking tokens)
UPDATE llm_costs SET
  tokens_input = tokens_input * 3,
  tokens_output = tokens_output * 3,
  correction_applied = TRUE
WHERE modelo_ia ILIKE 'gemini-1.5%'
  AND correction_applied IS NOT TRUE;

-- 3e. Modelos nao-Gemini (groq, claude, gpt) — tokens ja vem corretos
-- Apenas marcar como corrigidos e tokens_source = 'api'
UPDATE llm_costs SET
  correction_applied = TRUE,
  tokens_source = 'api'
WHERE modelo_ia NOT ILIKE 'gemini%'
  AND correction_applied IS NOT TRUE;

-- ============================================================================
-- PASSO 4: Recalcular custo_usd com tokens corrigidos (precos oficiais)
-- ============================================================================
UPDATE llm_costs SET
  custo_usd = CASE
    WHEN modelo_ia = 'gemini-2.5-pro'
      THEN (tokens_input * 1.25 + tokens_output * 10.00) / 1000000
    WHEN modelo_ia = 'gemini-2.5-pro+flash'
      THEN (tokens_input * 1.40 + tokens_output * 10.60) / 1000000
    WHEN modelo_ia = 'gemini-2.0-flash'
      THEN (tokens_input * 0.10 + tokens_output * 0.40) / 1000000
    WHEN modelo_ia ILIKE 'gemini-1.5-pro%'
      THEN (tokens_input * 1.25 + tokens_output * 5.00) / 1000000
    WHEN modelo_ia ILIKE 'gemini-1.5-flash%'
      THEN (tokens_input * 0.075 + tokens_output * 0.30) / 1000000
    ELSE custo_usd  -- nao-Gemini: manter custo original (ja correto)
  END
WHERE correction_applied = TRUE
  AND modelo_ia ILIKE 'gemini%';

-- ============================================================================
-- PASSO 5: Validacao
-- ============================================================================
-- Rodar apos aplicar para verificar:
-- SELECT
--   ROUND(SUM(custo_usd)::numeric, 2) AS total_corrigido_usd,
--   ROUND(SUM(custo_usd_original)::numeric, 2) AS total_original_usd,
--   ROUND(SUM(custo_usd)::numeric / NULLIF(SUM(custo_usd_original)::numeric, 0), 1) AS fator_medio,
--   COUNT(*) FILTER (WHERE correction_applied = TRUE) AS registros_corrigidos,
--   COUNT(*) AS total_registros
-- FROM llm_costs;
--
-- Esperado: total_corrigido_usd entre $250-$400 (vs ~$345 Google Cloud)

-- ============================================================================
-- ROLLBACK (se necessario):
-- ============================================================================
-- UPDATE llm_costs SET
--   tokens_input = tokens_input_original,
--   tokens_output = tokens_output_original,
--   custo_usd = custo_usd_original,
--   correction_applied = FALSE
-- WHERE correction_applied = TRUE
--   AND tokens_input_original IS NOT NULL;
