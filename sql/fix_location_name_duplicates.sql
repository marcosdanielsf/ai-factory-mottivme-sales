-- ===================================================================
-- FIX: Location Name Duplicates + Workflow Costs View
-- Corrige location_names que receberam location_id bruto ao inves do nome
-- Cria view de custos por workflow
-- ===================================================================
-- CUIDADO: vw_client_costs_summary tem 7 views dependentes
-- Usar CREATE OR REPLACE (NUNCA DROP)
-- ===================================================================

-- 1. Criar tabela de mapeamento location_id → nome canonico
CREATE TABLE IF NOT EXISTS location_name_map (
  location_id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar acesso (apenas authenticated — dados internos)
GRANT SELECT ON location_name_map TO authenticated;

-- 2. Povoar com mapeamentos conhecidos
INSERT INTO location_name_map (location_id, canonical_name) VALUES
  ('XNjmi1DpvqoF09y1mip9', 'Social Business'),
  ('Bgi2hFMgiLLoRlOO0K5b', 'Marina Couto'),
  ('8GedMLMaF26jIkHq50XG', 'Flavia Leal'),
  ('xliub5H5pQ4QcDeKHc6F', 'Dra. Gabriela Rossmam'),
  ('Rre0WqSlmAPmIrURgiMf', 'Dr Thauan'),
  ('cd1uyzpJox6XPt4Vct8Y', 'Mottivme Sales'),
  ('pFHwENFUxjtiON94jn2k', 'Eline Lobo'),
  ('sNwLyynZWP6jEtBy1ubf', 'Dr. Luiz Augusto'),
  ('GT77iGk2WDneoHwtuq6D', 'Alberto Correia'),
  ('mHuN6v75KQc3lwmBd6mV', 'LEGACY AGENCY'),
  ('uSwkCg4V1rfpvk4tG6zP', 'Dra Heloise')
ON CONFLICT (location_id) DO NOTHING;

-- 3. Corrigir dados existentes na llm_costs
-- (atualiza registros onde location_name contem um location_id bruto)
UPDATE llm_costs
SET location_name = m.canonical_name
FROM location_name_map m
WHERE llm_costs.location_name = m.location_id;

-- 4. Recriar vw_client_costs_summary com LEFT JOIN ao mapeamento
-- Usa CREATE OR REPLACE para nao quebrar as 7 views dependentes
CREATE OR REPLACE VIEW vw_client_costs_summary AS
SELECT
  COALESCE(m.canonical_name, COALESCE(lc.location_name, 'Desconhecido')) AS location_name,

  -- Usa MAX para evitar subquery correlacionada N+1
  MAX(lc.location_id) AS location_id,

  ROUND(COALESCE(SUM(lc.custo_usd), 0)::numeric, 4) AS total_cost_usd,
  COALESCE(SUM(lc.tokens_input), 0) AS total_tokens_input,
  COALESCE(SUM(lc.tokens_output), 0) AS total_tokens_output,
  COUNT(*) AS total_requests,

  ROUND(
    CASE
      WHEN COUNT(*) > 0 THEN (SUM(lc.custo_usd) / COUNT(*))::numeric
      ELSE 0
    END,
    6
  ) AS avg_cost_per_request,

  ARRAY_AGG(DISTINCT lc.modelo_ia) FILTER (WHERE lc.modelo_ia IS NOT NULL) AS models_used,
  COUNT(DISTINCT lc.contact_id) FILTER (WHERE lc.contact_id IS NOT NULL) AS total_conversations,
  ARRAY_AGG(DISTINCT lc.canal) FILTER (WHERE lc.canal IS NOT NULL) AS canais_used,
  MAX(lc.created_at) AS last_activity,
  ARRAY_AGG(DISTINCT lc.location_id) FILTER (WHERE lc.location_id IS NOT NULL) AS location_ids

FROM llm_costs lc
LEFT JOIN location_name_map m ON lc.location_name = m.location_id
WHERE lc.location_name IS NOT NULL
  AND TRIM(lc.location_name) != ''
GROUP BY COALESCE(m.canonical_name, COALESCE(lc.location_name, 'Desconhecido'))
ORDER BY SUM(lc.custo_usd) DESC;

-- 5. Criar view de custos por workflow (NOVA)
CREATE OR REPLACE VIEW vw_workflow_costs_summary AS
SELECT
  workflow_name,
  workflow_id,
  ROUND(COALESCE(SUM(custo_usd), 0)::numeric, 4) AS total_cost_usd,
  COALESCE(SUM(tokens_input), 0) AS total_tokens_input,
  COALESCE(SUM(tokens_output), 0) AS total_tokens_output,
  COUNT(*) AS total_requests,
  ROUND(SUM(custo_usd) / NULLIF(COUNT(*), 0), 6) AS avg_cost_per_request,
  ARRAY_AGG(DISTINCT modelo_ia) FILTER (WHERE modelo_ia IS NOT NULL) AS models_used,
  ARRAY_AGG(DISTINCT COALESCE(m.canonical_name, location_name)) FILTER (WHERE location_name IS NOT NULL) AS clients_using,
  COUNT(DISTINCT COALESCE(m.canonical_name, location_name)) AS total_clients,
  MAX(created_at) AS last_activity
FROM llm_costs
LEFT JOIN location_name_map m ON llm_costs.location_name = m.location_id
WHERE workflow_name IS NOT NULL
  AND TRIM(workflow_name) != ''
GROUP BY workflow_name, workflow_id
ORDER BY SUM(custo_usd) DESC;

-- Habilitar acesso
GRANT SELECT ON vw_workflow_costs_summary TO anon, authenticated;

-- ===================================================================
-- VERIFICACAO: Execute apos aplicar
-- ===================================================================
-- SELECT location_name, total_cost_usd, total_requests FROM vw_client_costs_summary LIMIT 10;
-- SELECT * FROM vw_workflow_costs_summary LIMIT 10;
-- SELECT * FROM location_name_map;
-- ===================================================================
