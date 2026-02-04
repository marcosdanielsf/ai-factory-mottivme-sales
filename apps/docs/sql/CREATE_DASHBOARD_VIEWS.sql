-- ===================================================================
-- CRIAR VIEWS DO DASHBOARD - EXECUTE NO SUPABASE SQL EDITOR
-- Fonte de dados: app_dash_principal (42.087 registros GHL)
-- Atualizado: 2026-01-17 - Corrigido lógica do funil
-- ===================================================================

-- 1. View de performance agregada por vendedor/responsável
DROP VIEW IF EXISTS dashboard_ranking_clientes CASCADE;
DROP VIEW IF EXISTS dashboard_performance_ghl CASCADE;

CREATE OR REPLACE VIEW dashboard_performance_ghl AS
SELECT
    lead_usuario_responsavel as agent_name,
    lead_usuario_responsavel as location_id,
    COUNT(*) as total_leads,
    -- Responderam: todos que não são new_lead
    COUNT(*) FILTER (WHERE LOWER(status::TEXT) NOT IN ('new_lead', 'new', 'novo')) as leads_responderam,
    -- Agendaram: booked + completed + won (quem compareceu/fechou teve que agendar)
    COUNT(*) FILTER (WHERE LOWER(status::TEXT) IN ('booked', 'scheduled', 'agendado', 'completed', 'attended', 'compareceu', 'won', 'fechado', 'converted')) as leads_agendaram,
    -- Compareceram: completed + won (quem fechou teve que comparecer)
    COUNT(*) FILTER (WHERE LOWER(status::TEXT) IN ('completed', 'attended', 'compareceu', 'won', 'fechado', 'converted')) as leads_compareceram,
    -- Fecharam
    COUNT(*) FILTER (WHERE LOWER(status::TEXT) IN ('won', 'fechado', 'converted')) as leads_fecharam,
    COUNT(*) FILTER (WHERE LOWER(status::TEXT) IN ('no_show', 'nao_compareceu')) as leads_no_show,
    COUNT(*) FILTER (WHERE LOWER(status::TEXT) IN ('lost', 'perdido')) as leads_lost,
    ROUND(
        CASE WHEN COUNT(*) > 0
        THEN COUNT(*) FILTER (WHERE LOWER(status::TEXT) NOT IN ('new_lead', 'new', 'novo'))::numeric / COUNT(*) * 100
        ELSE 0 END, 1
    ) as taxa_resposta,
    ROUND(
        CASE WHEN COUNT(*) > 0
        THEN COUNT(*) FILTER (WHERE LOWER(status::TEXT) IN ('won', 'fechado', 'converted'))::numeric / COUNT(*) * 100
        ELSE 0 END, 1
    ) as taxa_conversao_geral,
    0::numeric as custo_total_usd,
    0::numeric as avg_score_overall
FROM app_dash_principal
WHERE lead_usuario_responsavel IS NOT NULL
  AND lead_usuario_responsavel != ''
GROUP BY lead_usuario_responsavel;

-- 2. View de ranking de clientes (usada por Control Tower e Performance)
CREATE OR REPLACE VIEW dashboard_ranking_clientes AS
SELECT
    location_id,
    agent_name,
    total_leads,
    leads_responderam,
    leads_agendaram,
    leads_compareceram,
    leads_fecharam,
    leads_no_show,
    leads_lost,
    taxa_resposta,
    taxa_conversao_geral,
    custo_total_usd,
    avg_score_overall as score_medio,
    ROW_NUMBER() OVER (ORDER BY taxa_conversao_geral DESC NULLS LAST) AS rank_conversao,
    ROW_NUMBER() OVER (ORDER BY total_leads DESC NULLS LAST) AS rank_volume,
    ROW_NUMBER() OVER (ORDER BY taxa_resposta DESC NULLS LAST) AS rank_resposta
FROM dashboard_performance_ghl
WHERE total_leads > 0;

-- 3. Verificar resultados
SELECT '=== VIEWS CRIADAS COM SUCESSO ===' as info;

SELECT
    'dashboard_ranking_clientes' as view_name,
    COUNT(*) as total_clientes,
    SUM(total_leads) as total_leads,
    SUM(leads_responderam) as total_responderam,
    SUM(leads_agendaram) as total_agendaram,
    SUM(leads_compareceram) as total_compareceram,
    SUM(leads_fecharam) as total_fecharam
FROM dashboard_ranking_clientes;

-- Resultado esperado do funil:
-- total: 39353 → responderam: 14389 → agendaram: 1819 → compareceram: 970 → fecharam: 114
