-- =====================================================
-- SUPERVISION CONVERSATIONS V3 - View Otimizada
-- =====================================================
-- Substitui vw_supervision_conversations_v2 com melhor performance
-- 
-- OTIMIZACOES:
-- 1. CTEs em vez de subqueries correlacionadas
-- 2. DISTINCT ON movido para CTE (usa indice)
-- 3. message_count pre-calculado via GROUP BY
-- 4. client_name via JOIN em vez de subquery
-- 
-- PRE-REQUISITOS:
-- - 017_performance_indexes.sql (indices criticos)
-- - 013_supervision_filters.sql (supervision_states)
-- - 014_quality_flags.sql (conversation_quality_flags)
-- =====================================================

-- 1. DROP VIEW ANTIGA V2 (sera substituida pela V3)
-- Comentado por seguranca - execute manualmente se quiser substituir
-- DROP VIEW IF EXISTS public.vw_supervision_conversations_v2;

-- 2. CRIAR VIEW V3 OTIMIZADA
DROP VIEW IF EXISTS public.vw_supervision_conversations_v3;

CREATE OR REPLACE VIEW public.vw_supervision_conversations_v3 AS
WITH 
-- CTE 1: Ultima mensagem de cada session (usa indice idx_n8n_hist_session_created)
latest_messages AS (
    SELECT DISTINCT ON (session_id)
        id,
        session_id,
        location_id,
        message,
        created_at
    FROM public.n8n_historico_mensagens
    WHERE session_id IS NOT NULL
    ORDER BY session_id, created_at DESC
),

-- CTE 2: Contagem de mensagens por session (usa indice idx_n8n_hist_session_id)
message_counts AS (
    SELECT 
        session_id,
        COUNT(*) as total_messages
    FROM public.n8n_historico_mensagens
    WHERE session_id IS NOT NULL
    GROUP BY session_id
),

-- CTE 3: Mapeamento location_id -> client_name (evita subquery por linha)
client_names AS (
    SELECT DISTINCT
        location_id,
        location_name as client_name
    FROM public.vw_client_costs_summary
    WHERE location_id IS NOT NULL
)

-- Query principal com JOINs eficientes
SELECT
    -- Identificadores
    m.session_id,
    m.location_id,
    m.id::text as conversation_id,

    -- Dados do Contato (extraidos do JSON)
    COALESCE(
        m.message->'additional_kwargs'->>'full_name',
        m.message->'additional_kwargs'->>'name',
        m.message->'additional_kwargs'->>'username',
        'Desconhecido'
    ) as contact_name,
    m.message->'additional_kwargs'->>'phone' as contact_phone,
    m.message->'additional_kwargs'->>'email' as contact_email,

    -- Nome do Cliente (via JOIN - muito mais rapido!)
    c.client_name,

    -- Ultima mensagem
    COALESCE(m.message->>'content', '') as last_message,
    CASE
        WHEN m.message->>'type' = 'human' THEN 'user'
        WHEN m.message->>'type' = 'ai' THEN 'assistant'
        ELSE 'system'
    END as last_message_role,
    m.created_at as last_message_at,

    -- Estado de Supervisao (com fallback)
    COALESCE(s.status, 'ai_active') as supervision_status,
    COALESCE(s.ai_enabled, true) as ai_enabled,
    s.notes as supervision_notes,
    s.scheduled_at,
    s.converted_at,
    s.updated_at as supervision_updated_at,

    -- ===== CAMPOS PARA FILTROS =====

    -- Canal (instagram, whatsapp, sms, etc)
    COALESCE(
        m.message->'additional_kwargs'->>'source',
        m.message->'additional_kwargs'->>'channel',
        'unknown'
    ) as channel,

    -- Instagram username (para link direto)
    COALESCE(
        m.message->'additional_kwargs'->>'instagram',
        m.message->'additional_kwargs'->>'username',
        CASE
            WHEN m.message->'additional_kwargs'->>'source' = 'instagram'
            THEN m.message->'additional_kwargs'->>'name'
            ELSE NULL
        END
    ) as instagram_username,

    -- Campos reservados para futura integracao
    NULL::text as etapa_funil,
    NULL::text as usuario_responsavel,

    -- Contagem de mensagens (via JOIN - muito mais rapido!)
    COALESCE(mc.total_messages, 0) as message_count,

    -- ===== QUALITY FLAGS =====
    COALESCE(q.total_unresolved, 0) as quality_issues_count,
    q.max_severity as quality_max_severity,
    COALESCE(q.critical_count, 0) as quality_critical_count,
    COALESCE(q.high_count, 0) as quality_high_count

FROM latest_messages m

-- JOIN com contagem de mensagens
LEFT JOIN message_counts mc ON mc.session_id = m.session_id

-- JOIN com nome do cliente
LEFT JOIN client_names c ON c.location_id = m.location_id

-- JOIN com supervision_states
LEFT JOIN public.supervision_states s ON s.session_id = m.session_id

-- JOIN com quality summary
LEFT JOIN public.vw_conversation_quality_summary q ON q.session_id = m.session_id

-- Ordenacao final
ORDER BY m.created_at DESC;

-- 3. VIEW DE ESTATISTICAS (calcular no banco em vez do cliente)
DROP VIEW IF EXISTS public.vw_supervision_stats;

CREATE OR REPLACE VIEW public.vw_supervision_stats AS
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE supervision_status = 'ai_active') as ai_active,
    COUNT(*) FILTER (WHERE supervision_status = 'ai_paused') as ai_paused,
    COUNT(*) FILTER (WHERE supervision_status = 'manual_takeover') as manual_takeover,
    COUNT(*) FILTER (WHERE supervision_status = 'scheduled') as scheduled,
    COUNT(*) FILTER (WHERE supervision_status = 'converted') as converted,
    COUNT(*) FILTER (WHERE supervision_status = 'archived') as archived,
    -- Stats de quality
    COUNT(*) FILTER (WHERE quality_issues_count > 0) as with_quality_issues,
    COUNT(*) FILTER (WHERE quality_critical_count > 0) as with_critical_issues
FROM public.vw_supervision_conversations_v3;

-- 4. VIEW DE ESTATISTICAS POR CLIENTE (location)
DROP VIEW IF EXISTS public.vw_supervision_stats_by_location;

CREATE OR REPLACE VIEW public.vw_supervision_stats_by_location AS
SELECT
    location_id,
    client_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE supervision_status = 'ai_active') as ai_active,
    COUNT(*) FILTER (WHERE supervision_status = 'ai_paused') as ai_paused,
    COUNT(*) FILTER (WHERE supervision_status = 'scheduled') as scheduled,
    COUNT(*) FILTER (WHERE supervision_status = 'converted') as converted,
    COUNT(*) FILTER (WHERE quality_issues_count > 0) as with_quality_issues
FROM public.vw_supervision_conversations_v3
WHERE location_id IS NOT NULL
GROUP BY location_id, client_name
ORDER BY total DESC;

-- 5. GRANTS
GRANT SELECT ON public.vw_supervision_conversations_v3 TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_supervision_stats TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_supervision_stats_by_location TO authenticated, anon, service_role;

-- 6. COMENTARIOS
COMMENT ON VIEW public.vw_supervision_conversations_v3 IS 
'View otimizada de supervisao - usa CTEs e JOINs em vez de subqueries correlacionadas';
COMMENT ON VIEW public.vw_supervision_stats IS 
'Estatisticas agregadas do painel de supervisao - calcular no banco e mais rapido';
COMMENT ON VIEW public.vw_supervision_stats_by_location IS 
'Estatisticas por cliente/location para filtros e resumos';

-- =====================================================
-- FUNCAO: Buscar conversas com paginacao
-- =====================================================
-- Para performance em grandes volumes, usar funcao com LIMIT/OFFSET

CREATE OR REPLACE FUNCTION public.fn_get_supervision_conversations(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT NULL,
    p_location_id TEXT DEFAULT NULL,
    p_channel TEXT DEFAULT NULL,
    p_has_quality_issues BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    session_id TEXT,
    location_id TEXT,
    conversation_id TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    client_name TEXT,
    last_message TEXT,
    last_message_role TEXT,
    last_message_at TIMESTAMPTZ,
    supervision_status VARCHAR,
    ai_enabled BOOLEAN,
    supervision_notes TEXT,
    scheduled_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    channel TEXT,
    instagram_username TEXT,
    message_count BIGINT,
    quality_issues_count BIGINT,
    quality_max_severity TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered AS (
        SELECT 
            v.*,
            COUNT(*) OVER() as total_count
        FROM public.vw_supervision_conversations_v3 v
        WHERE 
            (p_status IS NULL OR v.supervision_status = p_status)
            AND (p_location_id IS NULL OR v.location_id = p_location_id)
            AND (p_channel IS NULL OR v.channel = p_channel)
            AND (p_has_quality_issues IS NULL OR 
                 (p_has_quality_issues = true AND v.quality_issues_count > 0) OR
                 (p_has_quality_issues = false AND v.quality_issues_count = 0))
        ORDER BY v.last_message_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT 
        f.session_id,
        f.location_id,
        f.conversation_id,
        f.contact_name,
        f.contact_phone,
        f.contact_email,
        f.client_name,
        f.last_message,
        f.last_message_role,
        f.last_message_at,
        f.supervision_status,
        f.ai_enabled,
        f.supervision_notes,
        f.scheduled_at,
        f.converted_at,
        f.channel,
        f.instagram_username,
        f.message_count,
        f.quality_issues_count,
        f.quality_max_severity,
        f.total_count
    FROM filtered f;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.fn_get_supervision_conversations TO authenticated, anon, service_role;

COMMENT ON FUNCTION public.fn_get_supervision_conversations IS 
'Busca paginada de conversas com filtros - mais eficiente que SELECT direto';

-- =====================================================
-- VERIFICACAO E COMPARACAO DE PERFORMANCE
-- =====================================================
-- 
-- Testar V2 (antiga):
-- EXPLAIN ANALYZE SELECT * FROM vw_supervision_conversations_v2 LIMIT 50;
--
-- Testar V3 (nova):  
-- EXPLAIN ANALYZE SELECT * FROM vw_supervision_conversations_v3 LIMIT 50;
--
-- Testar funcao paginada:
-- EXPLAIN ANALYZE SELECT * FROM fn_get_supervision_conversations(50, 0, NULL, NULL, NULL, NULL);
--
-- Comparar tempos de execucao!
