-- ===================================================================
-- VIEW: vw_custos_por_cliente
-- Agrega custos da tabela llm_costs por location_name
-- Resolve o problema do limite de 1000 registros do Supabase
-- ===================================================================

-- Dropar view se existir
DROP VIEW IF EXISTS vw_custos_por_cliente;

-- Criar view com custos agregados
CREATE VIEW vw_custos_por_cliente AS
SELECT
  LOWER(TRIM(location_name)) AS cliente_nome,
  location_name AS cliente_nome_original,
  COUNT(*) AS total_chamadas,
  COALESCE(SUM(tokens_input), 0) + COALESCE(SUM(tokens_output), 0) AS total_tokens,
  ROUND(COALESCE(SUM(custo_usd), 0)::numeric, 4) AS custo_total_usd
FROM llm_costs
WHERE location_name IS NOT NULL
  AND TRIM(location_name) != ''
GROUP BY LOWER(TRIM(location_name)), location_name
ORDER BY custo_total_usd DESC;

-- Habilitar acesso público (RLS)
-- A view herda as políticas da tabela base, mas vamos garantir acesso
GRANT SELECT ON vw_custos_por_cliente TO anon, authenticated;

-- ===================================================================
-- VERIFICAÇÃO: Execute após criar a view
-- ===================================================================
-- SELECT * FROM vw_custos_por_cliente;
--
-- Resultado esperado:
-- | cliente_nome     | total_chamadas | total_tokens | custo_total_usd |
-- |------------------|----------------|--------------|-----------------|
-- | marina couto     | 4553           | ~xxx         | 68.78           |
-- | dr. luiz augusto | 2282           | ~xxx         | 33.96           |
-- | lappe finances   | 1839           | ~xxx         | 27.88           |
-- | ...              | ...            | ...          | ...             |
-- ===================================================================
