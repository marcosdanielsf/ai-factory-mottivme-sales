-- ============================================
-- DASHBOARD METRICS VIEWS
-- Data: 2026-01-09
-- ============================================
-- Views para alimentar o AI Factory Dashboard
-- Baseado em: fuu_queue, fuu_execution_log, n8n_historico_mensagens, agent_conversations
-- ============================================

-- ============================================
-- 1. FUNIL DE LEADS POR PERÍODO
-- ============================================
CREATE OR REPLACE VIEW dashboard_funnel AS
WITH lead_stages AS (
    SELECT
        location_id,
        contact_id,
        -- Lead novo = entrou na fila de follow-up
        1 as is_lead,
        -- Respondeu = status 'responded' em algum follow-up
        CASE WHEN EXISTS (
            SELECT 1 FROM fuu_queue q2
            WHERE q2.contact_id = fuu_queue.contact_id
            AND q2.status = 'responded'
        ) THEN 1 ELSE 0 END as respondeu,
        -- Agendou = tem contexto com etapa 'agendamento' ou tag 'agendou'
        CASE WHEN context->>'etapa' ILIKE '%agend%'
             OR context->>'status' = 'agendado' THEN 1 ELSE 0 END as agendou,
        -- Compareceu = contexto com 'compareceu' ou 'atendido'
        CASE WHEN context->>'status' IN ('compareceu', 'atendido', 'presente') THEN 1 ELSE 0 END as compareceu,
        -- Fechou = status 'won' ou contexto com 'fechou'
        CASE WHEN context->>'status' IN ('won', 'fechou', 'vendido', 'converted') THEN 1 ELSE 0 END as fechou,
        created_at
    FROM fuu_queue
)
SELECT
    location_id,
    DATE_TRUNC('day', created_at) as data,
    COUNT(DISTINCT contact_id) as leads_novos,
    SUM(respondeu) as responderam,
    SUM(agendou) as agendaram,
    SUM(compareceu) as compareceram,
    SUM(fechou) as fecharam,
    -- Taxas
    ROUND(SUM(respondeu)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as taxa_resposta,
    ROUND(SUM(agendou)::numeric / NULLIF(SUM(respondeu), 0) * 100, 1) as taxa_agendamento,
    ROUND(SUM(compareceu)::numeric / NULLIF(SUM(agendou), 0) * 100, 1) as taxa_comparecimento,
    ROUND(SUM(fechou)::numeric / NULLIF(SUM(compareceu), 0) * 100, 1) as taxa_fechamento,
    ROUND(SUM(fechou)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversao_geral
FROM lead_stages
GROUP BY location_id, DATE_TRUNC('day', created_at)
ORDER BY data DESC;

COMMENT ON VIEW dashboard_funnel IS 'Funil de conversão por dia e location';


-- ============================================
-- 2. MÉTRICAS DE FOLLOW-UP POR LEAD
-- ============================================
CREATE OR REPLACE VIEW dashboard_followup_metrics AS
SELECT
    q.location_id,
    q.contact_id,
    q.contact_name,
    q.follow_up_type,
    q.status,
    q.current_attempt,
    q.max_attempts,
    -- Quantos follow-ups foram enviados
    (SELECT COUNT(*) FROM fuu_execution_log el WHERE el.queue_id = q.id) as followups_enviados,
    -- Em qual tentativa respondeu (se respondeu)
    CASE
        WHEN q.status = 'responded' THEN q.current_attempt
        ELSE NULL
    END as tentativa_resposta,
    -- Tempo até responder (se respondeu)
    CASE
        WHEN q.status = 'responded' THEN
            EXTRACT(EPOCH FROM (q.completed_at - q.started_at)) / 3600
        ELSE NULL
    END as horas_ate_resposta,
    q.context,
    q.created_at,
    q.completed_at
FROM fuu_queue q
ORDER BY q.created_at DESC;

COMMENT ON VIEW dashboard_followup_metrics IS 'Métricas de follow-up por lead individual';


-- ============================================
-- 3. PERFORMANCE DE FOLLOW-UP AGREGADA
-- ============================================
CREATE OR REPLACE VIEW dashboard_followup_performance AS
SELECT
    location_id,
    follow_up_type,
    -- Totais
    COUNT(*) as total_followups,
    COUNT(*) FILTER (WHERE status = 'pending') as pendentes,
    COUNT(*) FILTER (WHERE status = 'responded') as responderam,
    COUNT(*) FILTER (WHERE status = 'completed') as completados,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelados,
    COUNT(*) FILTER (WHERE status = 'failed') as falharam,
    -- Taxa de resposta
    ROUND(
        COUNT(*) FILTER (WHERE status = 'responded')::numeric /
        NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'responded')), 0) * 100,
        1
    ) as taxa_resposta,
    -- Média de tentativas até resposta
    ROUND(AVG(current_attempt) FILTER (WHERE status = 'responded'), 1) as media_tentativas_resposta,
    -- Tempo médio até resposta (horas)
    ROUND(
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)
        FILTER (WHERE status = 'responded'),
        1
    ) as media_horas_resposta
FROM fuu_queue
GROUP BY location_id, follow_up_type
ORDER BY location_id, total_followups DESC;

COMMENT ON VIEW dashboard_followup_performance IS 'Performance agregada de follow-ups por tipo';


-- ============================================
-- 4. CONVERSAS POR LEAD (histórico de mensagens)
-- ============================================
CREATE OR REPLACE VIEW dashboard_conversas_por_lead AS
SELECT
    session_id as contact_id,
    COUNT(*) as total_mensagens,
    COUNT(*) FILTER (WHERE message->>'type' = 'human') as mensagens_lead,
    COUNT(*) FILTER (WHERE message->>'type' = 'ai') as mensagens_ia,
    MIN(created_at) as primeira_mensagem,
    MAX(created_at) as ultima_mensagem,
    EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600 as duracao_conversa_horas
FROM n8n_historico_mensagens
GROUP BY session_id
ORDER BY total_mensagens DESC;

COMMENT ON VIEW dashboard_conversas_por_lead IS 'Volume de conversas por lead';


-- ============================================
-- 5. ALERTAS URGENTES (para dashboard)
-- ============================================
CREATE OR REPLACE VIEW dashboard_alertas_urgentes AS
SELECT
    location_id,
    -- Leads sem resposta há mais de 24h
    COUNT(*) FILTER (
        WHERE status = 'pending'
        AND scheduled_at < NOW() - INTERVAL '24 hours'
    ) as leads_sem_resposta_24h,
    -- Follow-ups falhados
    COUNT(*) FILTER (WHERE status = 'failed') as followups_falhados,
    -- Leads esfriando (pending há mais de 48h)
    COUNT(*) FILTER (
        WHERE status = 'pending'
        AND scheduled_at < NOW() - INTERVAL '48 hours'
    ) as leads_esfriando,
    -- No-shows (baseado em contexto)
    COUNT(*) FILTER (
        WHERE context->>'status' IN ('no_show', 'noshow', 'faltou')
    ) as no_shows
FROM fuu_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY location_id;

COMMENT ON VIEW dashboard_alertas_urgentes IS 'Alertas urgentes para o dashboard';


-- ============================================
-- 6. TAXA DE RESPOSTA POR TENTATIVA
-- ============================================
CREATE OR REPLACE VIEW dashboard_resposta_por_tentativa AS
WITH tentativas AS (
    SELECT
        location_id,
        follow_up_type,
        current_attempt as tentativa,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'responded') as responderam
    FROM fuu_queue
    WHERE status IN ('responded', 'completed', 'cancelled')
    GROUP BY location_id, follow_up_type, current_attempt
)
SELECT
    location_id,
    follow_up_type,
    tentativa,
    total,
    responderam,
    ROUND(responderam::numeric / NULLIF(total, 0) * 100, 1) as taxa_resposta
FROM tentativas
ORDER BY location_id, follow_up_type, tentativa;

COMMENT ON VIEW dashboard_resposta_por_tentativa IS 'Taxa de resposta por número da tentativa de follow-up';


-- ============================================
-- 7. TOKENS E CUSTOS POR LEAD
-- ============================================
CREATE OR REPLACE VIEW dashboard_custos_por_lead AS
SELECT
    lc.location_id,
    lc.location_name,
    lc.contact_name,
    lc.modelo_ia,
    SUM(lc.tokens_input) as total_input_tokens,
    SUM(lc.tokens_output) as total_output_tokens,
    SUM(lc.tokens_input + lc.tokens_output) as total_tokens,
    SUM(lc.custo_usd) as custo_total_usd,
    COUNT(*) as total_chamadas_ia,
    MIN(lc.created_at) as primeira_chamada,
    MAX(lc.created_at) as ultima_chamada
FROM llm_costs lc
GROUP BY lc.location_id, lc.location_name, lc.contact_name, lc.modelo_ia
ORDER BY custo_total_usd DESC;

COMMENT ON VIEW dashboard_custos_por_lead IS 'Tokens e custos de IA por lead';


-- ============================================
-- 8. PERFORMANCE POR AGENTE (por location)
-- ============================================
CREATE OR REPLACE VIEW dashboard_performance_agentes AS
SELECT
    lc.location_id,
    lc.location_name as agent_name,
    -- Métricas de custos
    COUNT(*) as total_execucoes,
    SUM(lc.tokens_input + lc.tokens_output) as total_tokens,
    SUM(lc.custo_usd) as custo_total,
    AVG(lc.custo_usd) as custo_medio_chamada,
    -- Métricas de follow-up (subquery)
    (SELECT COUNT(*) FROM fuu_queue fq WHERE fq.location_id = lc.location_id) as total_followups,
    (SELECT COUNT(*) FROM fuu_queue fq WHERE fq.location_id = lc.location_id AND fq.status = 'responded') as leads_responderam,
    -- Taxa de resposta
    (SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'responded')::numeric /
        NULLIF(COUNT(*), 0) * 100, 1
    ) FROM fuu_queue fq WHERE fq.location_id = lc.location_id) as taxa_resposta
FROM llm_costs lc
WHERE lc.location_id IS NOT NULL
GROUP BY lc.location_id, lc.location_name
ORDER BY total_execucoes DESC;

COMMENT ON VIEW dashboard_performance_agentes IS 'Performance consolidada por location/agente';


-- ============================================
-- 9. RESUMO DIÁRIO PARA KPIs
-- ============================================
CREATE OR REPLACE VIEW dashboard_resumo_diario AS
SELECT
    DATE_TRUNC('day', created_at) as data,
    -- Follow-ups
    COUNT(DISTINCT CASE WHEN status = 'pending' THEN contact_id END) as leads_ativos,
    COUNT(*) as followups_na_fila,
    COUNT(*) FILTER (WHERE status = 'responded') as responderam_hoje,
    COUNT(*) FILTER (WHERE context->>'etapa' ILIKE '%agend%') as agendaram_hoje,
    -- Taxa de conversão
    ROUND(
        COUNT(*) FILTER (WHERE status = 'responded')::numeric /
        NULLIF(COUNT(*), 0) * 100,
        1
    ) as taxa_conversao
FROM fuu_queue
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY data DESC;

COMMENT ON VIEW dashboard_resumo_diario IS 'Resumo diário para KPIs do dashboard';


-- ============================================
-- 10. FUNÇÃO: Buscar dados do funil por período
-- ============================================
CREATE OR REPLACE FUNCTION dashboard_get_funnel(
    p_location_id VARCHAR(50),
    p_periodo VARCHAR(10) DEFAULT '30d'
)
RETURNS TABLE (
    stage VARCHAR,
    count BIGINT,
    taxa_conversao NUMERIC
) AS $$
DECLARE
    v_interval INTERVAL;
BEGIN
    -- Converter período para interval
    v_interval := CASE p_periodo
        WHEN 'hoje' THEN INTERVAL '1 day'
        WHEN '7d' THEN INTERVAL '7 days'
        WHEN '30d' THEN INTERVAL '30 days'
        WHEN '90d' THEN INTERVAL '90 days'
        ELSE INTERVAL '30 days'
    END;

    RETURN QUERY
    WITH totais AS (
        SELECT
            COUNT(DISTINCT contact_id) as leads_novos,
            COUNT(DISTINCT contact_id) FILTER (WHERE status = 'responded') as responderam,
            COUNT(DISTINCT contact_id) FILTER (WHERE context->>'etapa' ILIKE '%agend%') as agendaram,
            COUNT(DISTINCT contact_id) FILTER (WHERE context->>'status' IN ('compareceu', 'atendido')) as compareceram,
            COUNT(DISTINCT contact_id) FILTER (WHERE context->>'status' IN ('won', 'fechou', 'vendido')) as fecharam
        FROM fuu_queue
        WHERE location_id = p_location_id
          AND created_at > NOW() - v_interval
    )
    SELECT 'Leads Novos'::VARCHAR, leads_novos, 100.0::NUMERIC FROM totais
    UNION ALL
    SELECT 'Responderam'::VARCHAR, responderam, ROUND(responderam::numeric / NULLIF(leads_novos, 0) * 100, 1) FROM totais
    UNION ALL
    SELECT 'Agendaram'::VARCHAR, agendaram, ROUND(agendaram::numeric / NULLIF(responderam, 0) * 100, 1) FROM totais
    UNION ALL
    SELECT 'Compareceram'::VARCHAR, compareceram, ROUND(compareceram::numeric / NULLIF(agendaram, 0) * 100, 1) FROM totais
    UNION ALL
    SELECT 'Fecharam'::VARCHAR, fecharam, ROUND(fecharam::numeric / NULLIF(compareceram, 0) * 100, 1) FROM totais;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION dashboard_get_funnel IS 'Retorna dados do funil por location e período';


-- ============================================
-- FIM
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Dashboard Metrics Views criadas!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Views: dashboard_funnel, dashboard_followup_metrics, dashboard_followup_performance';
    RAISE NOTICE 'Views: dashboard_conversas_por_lead, dashboard_alertas_urgentes';
    RAISE NOTICE 'Views: dashboard_resposta_por_tentativa, dashboard_custos_por_lead';
    RAISE NOTICE 'Views: dashboard_performance_agentes, dashboard_resumo_diario';
    RAISE NOTICE 'Função: dashboard_get_funnel(location_id, periodo)';
END $$;
