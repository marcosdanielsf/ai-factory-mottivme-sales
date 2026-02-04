-- ===================================================================
-- DISCOVERY: Comparar nomes entre llm_costs e app_dash_principal
-- Execute no Supabase SQL Editor e cole a saída aqui
-- ===================================================================

-- 1. Valores únicos de location_name em llm_costs (com contagem e custo total)
SELECT '=== LLM_COSTS - location_name ===' AS info;
SELECT
  location_name,
  COUNT(*) AS total_registros,
  ROUND(SUM(custo_usd)::numeric, 2) AS custo_total_usd
FROM llm_costs
WHERE location_name IS NOT NULL
GROUP BY location_name
ORDER BY custo_total_usd DESC;

-- 2. Valores únicos de lead_usuario_responsavel em app_dash_principal (com contagem)
SELECT '=== APP_DASH_PRINCIPAL - lead_usuario_responsavel ===' AS info;
SELECT
  lead_usuario_responsavel,
  COUNT(*) AS total_leads
FROM app_dash_principal
WHERE lead_usuario_responsavel IS NOT NULL
GROUP BY lead_usuario_responsavel
ORDER BY total_leads DESC;

-- 3. Estrutura da tabela llm_costs
SELECT '=== ESTRUTURA llm_costs ===' AS info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'llm_costs'
ORDER BY ordinal_position;

-- 4. Sample de llm_costs (5 registros)
SELECT '=== SAMPLE llm_costs ===' AS info;
SELECT location_name, location_id, custo_usd, tokens_input, tokens_output, created_at
FROM llm_costs
LIMIT 5;

-- 5. Custos específicos de "Marina Couto" (case insensitive)
SELECT '=== CUSTOS MARINA COUTO ===' AS info;
SELECT
  location_name,
  COUNT(*) AS registros,
  ROUND(SUM(custo_usd)::numeric, 4) AS custo_total
FROM llm_costs
WHERE LOWER(location_name) LIKE '%marina%'
GROUP BY location_name;

-- 6. Total geral de custos
SELECT '=== TOTAIS GERAIS ===' AS info;
SELECT
  COUNT(*) AS total_registros,
  COUNT(DISTINCT location_name) AS clientes_unicos,
  ROUND(SUM(custo_usd)::numeric, 2) AS custo_total_usd
FROM llm_costs;
