-- =====================================================
-- 035: Adiciona contact_photo_url na view de supervisao
-- =====================================================
-- Extrai photoUrl do additional_kwargs (campo do GHL Contact)
-- Fontes possiveis: GHL API, Instagram profile pic, manual
--
-- Para popular os dados:
-- 1. GHL: O n8n workflow ja salva additional_kwargs do contato.
--    Basta incluir photoUrl no payload do webhook.
--    GET /contacts/{contactId} retorna contact.photoUrl
--
-- 2. Instagram: JOIN com new_followers_detected.follower_profile_pic
--    (match via instagram_username)
--
-- 3. Manual: Adicionar campo photo_url na tabela de leads/contacts
-- =====================================================

-- Recriar view V3 com campo contact_photo_url
DROP VIEW IF EXISTS public.vw_supervision_stats_by_location;
DROP VIEW IF EXISTS public.vw_supervision_stats;
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

    -- Foto do contato (GHL photoUrl ou Instagram profile pic)
    COALESCE(
        m.message->'additional_kwargs'->>'photoUrl',
        m.message->'additional_kwargs'->>'photo_url',
        m.message->'additional_kwargs'->>'profile_pic_url',
        m.message->'additional_kwargs'->>'avatar'
    ) as contact_photo_url,

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

-- Recriar views dependentes
CREATE OR REPLACE VIEW public.vw_supervision_stats AS
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE supervision_status = 'ai_active') as ai_active,
    COUNT(*) FILTER (WHERE supervision_status = 'ai_paused') as ai_paused,
    COUNT(*) FILTER (WHERE supervision_status = 'manual_takeover') as manual_takeover,
    COUNT(*) FILTER (WHERE supervision_status = 'scheduled') as scheduled,
    COUNT(*) FILTER (WHERE supervision_status = 'converted') as converted,
    COUNT(*) FILTER (WHERE supervision_status = 'archived') as archived,
    COUNT(*) FILTER (WHERE quality_issues_count > 0) as with_quality_issues,
    COUNT(*) FILTER (WHERE quality_critical_count > 0) as with_critical_issues
FROM public.vw_supervision_conversations_v3;

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

-- Grants
GRANT SELECT ON public.vw_supervision_conversations_v3 TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_supervision_stats TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_supervision_stats_by_location TO authenticated, anon, service_role;
