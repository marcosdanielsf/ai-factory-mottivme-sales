-- Migration 074: Views de evolucao MRR e projecao de runway
-- Obsessao: Caixa Extraordinario

-- View: evolucao MRR mes a mes
CREATE OR REPLACE VIEW vw_mrr_evolution AS
WITH monthly AS (
    SELECT
        month,
        SUM(revenue_brl) AS mrr_brl,
        COUNT(DISTINCT location_id) AS active_clients,
        AVG(revenue_brl) AS avg_ticket_brl
    FROM client_billing
    WHERE is_active = true OR (churn_date IS NOT NULL AND month <= churn_date)
    GROUP BY month
),
with_growth AS (
    SELECT
        month,
        mrr_brl,
        active_clients,
        avg_ticket_brl,
        LAG(mrr_brl) OVER (ORDER BY month) AS prev_mrr_brl,
        LAG(active_clients) OVER (ORDER BY month) AS prev_active_clients
    FROM monthly
)
SELECT
    month,
    ROUND(mrr_brl::numeric, 2) AS mrr_brl,
    ROUND((mrr_brl * 12)::numeric, 2) AS arr_brl,
    active_clients,
    ROUND(avg_ticket_brl::numeric, 2) AS avg_ticket_brl,
    ROUND(prev_mrr_brl::numeric, 2) AS prev_mrr_brl,
    CASE
        WHEN prev_mrr_brl > 0
        THEN ROUND(((mrr_brl - prev_mrr_brl) / prev_mrr_brl * 100)::numeric, 1)
        ELSE NULL
    END AS mrr_growth_pct,
    -- Net new MRR
    ROUND((mrr_brl - COALESCE(prev_mrr_brl, 0))::numeric, 2) AS net_new_mrr_brl,
    active_clients - COALESCE(prev_active_clients, 0) AS net_new_clients
FROM with_growth
ORDER BY month DESC;

-- View: churn mensal detalhado
CREATE OR REPLACE VIEW vw_monthly_churn AS
WITH churned AS (
    SELECT
        DATE_TRUNC('month', churn_date)::date AS churn_month,
        COUNT(*) AS churned_clients,
        SUM(avg_monthly_revenue_brl) AS churned_mrr_brl
    FROM vw_unit_economics_clients
    WHERE NOT is_active AND churn_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', churn_date)
),
total AS (
    SELECT
        month,
        COUNT(DISTINCT location_id) AS total_clients_at_month
    FROM client_billing
    GROUP BY month
)
SELECT
    COALESCE(c.churn_month, t.month) AS month,
    COALESCE(c.churned_clients, 0) AS churned_clients,
    COALESCE(c.churned_mrr_brl, 0) AS churned_mrr_brl,
    t.total_clients_at_month,
    CASE
        WHEN t.total_clients_at_month > 0
        THEN ROUND((COALESCE(c.churned_clients, 0)::numeric / t.total_clients_at_month * 100), 1)
        ELSE 0
    END AS churn_rate_pct
FROM total t
LEFT JOIN churned c ON c.churn_month = t.month
ORDER BY month DESC;

-- View: projecao de runway
CREATE OR REPLACE VIEW vw_runway_projection AS
WITH current_metrics AS (
    SELECT
        mrr_brl,
        active_clients,
        avg_ticket_brl
    FROM vw_mrr_evolution
    ORDER BY month DESC
    LIMIT 1
),
monthly_costs AS (
    -- Custo medio mensal (total / meses distintos) em vez de custo acumulado
    SELECT
        COALESCE(
            SUM(total_cost_usd) * 5.5 / NULLIF(
                (SELECT COUNT(DISTINCT DATE_TRUNC('month', created_at)) FROM llm_costs), 0
            ),
            0
        ) AS monthly_cost_brl
),
burn_rate AS (
    SELECT
        cm.mrr_brl AS monthly_revenue_brl,
        cm.active_clients,
        cm.avg_ticket_brl,
        COALESCE(mc.monthly_cost_brl, 0) AS monthly_cost_brl,
        cm.mrr_brl - COALESCE(mc.monthly_cost_brl, 0) AS monthly_net_brl,
        -- Estimativa de custos operacionais (30% da receita como regra geral)
        cm.mrr_brl * 0.30 AS estimated_opex_brl,
        cm.mrr_brl - COALESCE(mc.monthly_cost_brl, 0) - (cm.mrr_brl * 0.30) AS monthly_free_cash_brl
    FROM current_metrics cm
    CROSS JOIN monthly_costs mc
)
SELECT
    monthly_revenue_brl,
    active_clients,
    avg_ticket_brl,
    monthly_cost_brl AS monthly_ai_cost_brl,
    estimated_opex_brl,
    monthly_net_brl AS monthly_gross_profit_brl,
    monthly_free_cash_brl,
    -- Meses de free cash acumulado ate atingir 6x despesa mensal
    -- (quanto tempo levaria para construir reserva de 6 meses)
    CASE
        WHEN monthly_free_cash_brl > 0
        THEN ROUND(((monthly_cost_brl + (monthly_revenue_brl * 0.30)) * 6 / monthly_free_cash_brl)::numeric, 1)
        ELSE 0
    END AS months_to_6mo_runway,
    -- Margem operacional
    CASE
        WHEN monthly_revenue_brl > 0
        THEN ROUND((monthly_free_cash_brl / monthly_revenue_brl * 100)::numeric, 1)
        ELSE 0
    END AS operating_margin_pct
FROM burn_rate;

COMMENT ON VIEW vw_mrr_evolution IS 'Evolucao MRR mes a mes com growth rate e net new MRR';
COMMENT ON VIEW vw_monthly_churn IS 'Churn mensal: clientes perdidos e MRR perdido';
COMMENT ON VIEW vw_runway_projection IS 'Projecao de runway baseada em receita vs custos';
