-- Migration 073: View de Unit Economics por cliente
-- Junta billing (receita) com custos para calcular margem, LTV, etc.

-- View principal: metricas por cliente
CREATE OR REPLACE VIEW vw_unit_economics_clients AS
WITH billing_summary AS (
    SELECT
        location_id,
        location_name,
        is_active,
        acquisition_date,
        acquisition_cost_brl,
        churn_date,
        COUNT(DISTINCT month) AS months_active,
        SUM(revenue_brl) AS total_revenue_brl,
        AVG(revenue_brl) AS avg_monthly_revenue_brl,
        MAX(month) AS last_billing_month,
        MIN(month) AS first_billing_month
    FROM client_billing
    WHERE revenue_brl > 0
    GROUP BY location_id, location_name, is_active, acquisition_date, acquisition_cost_brl, churn_date
),
cost_summary AS (
    SELECT
        location_name,
        SUM(total_cost_usd) AS total_cost_usd,
        SUM(total_cost_usd) * 5.5 AS total_cost_brl -- conversao USD->BRL aproximada
    FROM vw_client_costs_summary
    GROUP BY location_name
)
SELECT
    b.location_id,
    b.location_name,
    b.is_active,
    b.acquisition_date,
    b.churn_date,
    b.months_active,
    b.total_revenue_brl,
    b.avg_monthly_revenue_brl,
    COALESCE(c.total_cost_brl, 0) AS total_cost_brl,
    COALESCE(c.total_cost_usd, 0) AS total_cost_usd,
    -- Margem
    b.total_revenue_brl - COALESCE(c.total_cost_brl, 0) AS gross_profit_brl,
    CASE
        WHEN b.total_revenue_brl > 0
        THEN ROUND(((b.total_revenue_brl - COALESCE(c.total_cost_brl, 0)) / b.total_revenue_brl * 100)::numeric, 1)
        ELSE 0
    END AS margin_pct,
    -- LTV (receita media mensal * meses ativos)
    b.total_revenue_brl AS ltv_brl,
    -- CAC
    COALESCE(b.acquisition_cost_brl, 0) AS cac_brl,
    -- LTV/CAC ratio
    CASE
        WHEN COALESCE(b.acquisition_cost_brl, 0) > 0
        THEN ROUND((b.total_revenue_brl / b.acquisition_cost_brl)::numeric, 1)
        ELSE NULL
    END AS ltv_cac_ratio,
    -- Margem mensal
    b.avg_monthly_revenue_brl - (COALESCE(c.total_cost_brl, 0) / NULLIF(b.months_active, 0)) AS avg_monthly_margin_brl,
    b.last_billing_month,
    b.first_billing_month
FROM billing_summary b
LEFT JOIN cost_summary c ON b.location_name = c.location_name
ORDER BY b.avg_monthly_revenue_brl DESC;

-- View: resumo global de unit economics
CREATE OR REPLACE VIEW vw_unit_economics_summary AS
SELECT
    COUNT(*) FILTER (WHERE is_active) AS active_clients,
    COUNT(*) FILTER (WHERE NOT is_active) AS churned_clients,
    COUNT(*) AS total_clients,
    ROUND(SUM(avg_monthly_revenue_brl) FILTER (WHERE is_active)::numeric, 2) AS mrr_brl,
    ROUND(SUM(avg_monthly_revenue_brl) FILTER (WHERE is_active)::numeric * 12, 2) AS arr_brl,
    ROUND(AVG(margin_pct) FILTER (WHERE is_active)::numeric, 1) AS avg_margin_pct,
    ROUND(AVG(avg_monthly_revenue_brl) FILTER (WHERE is_active)::numeric, 2) AS avg_ticket_brl,
    ROUND(AVG(ltv_brl) FILTER (WHERE is_active)::numeric, 2) AS avg_ltv_brl,
    ROUND(AVG(cac_brl) FILTER (WHERE is_active AND cac_brl > 0)::numeric, 2) AS avg_cac_brl,
    ROUND(AVG(ltv_cac_ratio) FILTER (WHERE is_active AND ltv_cac_ratio IS NOT NULL)::numeric, 1) AS avg_ltv_cac_ratio,
    -- Churn rate (clientes que churnaram / total)
    CASE
        WHEN COUNT(*) > 0
        THEN ROUND((COUNT(*) FILTER (WHERE NOT is_active)::numeric / COUNT(*)::numeric * 100), 1)
        ELSE 0
    END AS churn_rate_pct
FROM vw_unit_economics_clients;

COMMENT ON VIEW vw_unit_economics_clients IS 'Unit economics por cliente: margem, LTV, CAC, LTV/CAC ratio';
COMMENT ON VIEW vw_unit_economics_summary IS 'Resumo global: MRR, ARR, margem media, churn rate, LTV/CAC medio';
