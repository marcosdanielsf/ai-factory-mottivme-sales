-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO: Quais agentes estão ATIVOS para o Dr. Alberto?
-- Location ID: GT77iGk2WDneoHwtuq6D
-- Data: 2026-01-20
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. LISTAR TODOS OS AGENTES ATIVOS DESTE LOCATION
SELECT
  id,
  agent_name,
  version,
  is_active,
  status,
  created_at,
  updated_at
FROM agent_versions
WHERE location_id = 'GT77iGk2WDneoHwtuq6D'
ORDER BY created_at DESC;

-- 2. VERIFICAR SE TEM MAIS DE UM ATIVO
SELECT
  COUNT(*) as total_ativos,
  string_agg(agent_name, ', ') as agentes_ativos
FROM agent_versions
WHERE location_id = 'GT77iGk2WDneoHwtuq6D'
  AND is_active = true;

-- 3. VER O PROMPT DO AGENTE ATIVO (pra confirmar se é Alberto ou Isabella)
SELECT
  agent_name,
  version,
  LEFT(system_prompt, 500) as inicio_prompt
FROM agent_versions
WHERE location_id = 'GT77iGk2WDneoHwtuq6D'
  AND is_active = true;

-- 4. BUSCAR "ISABELLA" EM QUALQUER AGENTE ATIVO DESTE LOCATION
SELECT
  agent_name,
  version,
  is_active,
  CASE
    WHEN system_prompt ILIKE '%isabella%' THEN '⚠️ CONTÉM ISABELLA!'
    ELSE '✅ OK'
  END as tem_isabella
FROM agent_versions
WHERE location_id = 'GT77iGk2WDneoHwtuq6D'
  AND is_active = true;

-- 5. CORRIGIR: DESATIVAR TUDO E DEIXAR SÓ O v5
-- (RODAR APENAS SE CONFIRMAR O PROBLEMA)
/*
UPDATE agent_versions
SET is_active = false, status = 'deprecated', updated_at = NOW()
WHERE location_id = 'GT77iGk2WDneoHwtuq6D';

-- Depois rodar o dr_alberto_v5_CORRIGIDO.sql
*/
