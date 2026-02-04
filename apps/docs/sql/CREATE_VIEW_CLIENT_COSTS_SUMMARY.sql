-- ===================================================================
-- VIEW: vw_client_costs_summary
-- Agrega custos da tabela llm_costs por location_name
-- Com todos os campos necessários para a página ClientCosts
-- ===================================================================

-- Dropar view se existir
DROP VIEW IF EXISTS vw_client_costs_summary;

-- Criar view com custos agregados completos
CREATE VIEW vw_client_costs_summary AS
SELECT
  -- Identificação
  COALESCE(location_name, 'Desconhecido') AS location_name,

  -- Pegar um location_id representativo (o mais recente)
  (
    SELECT lc2.location_id
    FROM llm_costs lc2
    WHERE lc2.location_name = llm_costs.location_name
    ORDER BY lc2.created_at DESC
    LIMIT 1
  ) AS location_id,

  -- Métricas de custo
  ROUND(COALESCE(SUM(custo_usd), 0)::numeric, 4) AS total_cost_usd,
  COALESCE(SUM(tokens_input), 0) AS total_tokens_input,
  COALESCE(SUM(tokens_output), 0) AS total_tokens_output,
  COUNT(*) AS total_requests,

  -- Custo médio por requisição
  ROUND(
    CASE
      WHEN COUNT(*) > 0 THEN (SUM(custo_usd) / COUNT(*))::numeric
      ELSE 0
    END,
    6
  ) AS avg_cost_per_request,

  -- Modelos usados (array)
  ARRAY_AGG(DISTINCT modelo_ia) FILTER (WHERE modelo_ia IS NOT NULL) AS models_used,

  -- Última atividade
  MAX(created_at) AS last_activity,

  -- Lista de location_ids únicos (para clientes com múltiplos IDs)
  ARRAY_AGG(DISTINCT location_id) FILTER (WHERE location_id IS NOT NULL) AS location_ids

FROM llm_costs
WHERE location_name IS NOT NULL
  AND TRIM(location_name) != ''
GROUP BY location_name
ORDER BY SUM(custo_usd) DESC;

-- Habilitar acesso
GRANT SELECT ON vw_client_costs_summary TO anon, authenticated;

-- ===================================================================
-- VIEW: vw_global_cost_summary
-- Resumo global de custos (para o card "Resumo Global")
-- ===================================================================

DROP VIEW IF EXISTS vw_global_cost_summary;

CREATE VIEW vw_global_cost_summary AS
SELECT
  ROUND(COALESCE(SUM(custo_usd), 0)::numeric, 4) AS total_cost_usd,
  COALESCE(SUM(tokens_input), 0) + COALESCE(SUM(tokens_output), 0) AS total_tokens,
  COUNT(*) AS total_requests,
  COUNT(DISTINCT location_name) AS total_clients,
  ROUND(
    CASE
      WHEN COUNT(DISTINCT location_name) > 0
      THEN (SUM(custo_usd) / COUNT(DISTINCT location_name))::numeric
      ELSE 0
    END,
    4
  ) AS avg_cost_per_client,
  (
    SELECT modelo_ia
    FROM llm_costs
    WHERE modelo_ia IS NOT NULL
    GROUP BY modelo_ia
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) AS top_model
FROM llm_costs;

-- Habilitar acesso
GRANT SELECT ON vw_global_cost_summary TO anon, authenticated;

-- ===================================================================
-- VERIFICAÇÃO: Execute após criar as views
-- ===================================================================
-- SELECT * FROM vw_client_costs_summary LIMIT 5;
-- SELECT * FROM vw_global_cost_summary;
-- ===================================================================
