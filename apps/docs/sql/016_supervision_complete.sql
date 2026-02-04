-- =====================================================
-- SUPERVISION COMPLETE - Consolidacao Final
-- =====================================================
-- Este arquivo atualiza a view vw_supervision_conversations_v2
-- para incluir quality_issues_count do sistema de quality flags.
--
-- PRE-REQUISITOS: Executar ANTES deste arquivo:
-- - 013_supervision_filters.sql (cria supervision_states e view inicial)
-- - 014_quality_flags.sql (cria conversation_quality_flags e vw_conversation_quality_summary)
-- =====================================================

-- 1. ATUALIZAR VIEW: vw_supervision_conversations_v2
-- Adiciona campo quality_issues_count via LEFT JOIN com vw_conversation_quality_summary
DROP VIEW IF EXISTS public.vw_supervision_conversations_v2;

CREATE OR REPLACE VIEW public.vw_supervision_conversations_v2 AS
SELECT
    -- Identificadores
    m.session_id,
    m.location_id,
    m.id::text as conversation_id,

    -- Dados do Contato
    COALESCE(
        m.message->'additional_kwargs'->>'full_name',
        m.message->'additional_kwargs'->>'name',
        m.message->'additional_kwargs'->>'username',
        'Desconhecido'
    ) as contact_name,
    m.message->'additional_kwargs'->>'phone' as contact_phone,
    m.message->'additional_kwargs'->>'email' as contact_email,

    -- Dados do Cliente (location)
    (
        SELECT location_name
        FROM vw_client_costs_summary
        WHERE location_id = m.location_id
        LIMIT 1
    ) as client_name,

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

    -- Contagem de mensagens
    (
        SELECT COUNT(*)
        FROM public.n8n_historico_mensagens n
        WHERE n.session_id = m.session_id
    ) as message_count,

    -- ===== QUALITY FLAGS (Fase 3) =====
    -- Contagem de problemas de qualidade nao resolvidos
    COALESCE(q.total_unresolved, 0) as quality_issues_count,
    q.max_severity as quality_max_severity,
    q.critical_count as quality_critical_count,
    q.high_count as quality_high_count

FROM public.n8n_historico_mensagens m

-- Join com supervision_states usando session_id
LEFT JOIN public.supervision_states s ON m.session_id = s.session_id

-- Join com quality summary para contagem de problemas
LEFT JOIN public.vw_conversation_quality_summary q ON m.session_id = q.session_id

-- Pega apenas a ultima mensagem de cada session
WHERE m.id IN (
    SELECT DISTINCT ON (session_id) id
    FROM public.n8n_historico_mensagens
    WHERE session_id IS NOT NULL
    ORDER BY session_id, created_at DESC
)

ORDER BY m.created_at DESC;

-- 2. GRANTS
GRANT SELECT ON public.vw_supervision_conversations_v2 TO authenticated, anon, service_role;

-- 3. COMENTARIO
COMMENT ON VIEW public.vw_supervision_conversations_v2 IS 
'View expandida de supervisao com filtros de canal, quality flags e contagem de problemas';

-- =====================================================
-- VERIFICACAO
-- =====================================================
-- Para testar, execute:
-- SELECT session_id, contact_name, supervision_status, quality_issues_count, quality_max_severity
-- FROM vw_supervision_conversations_v2
-- WHERE quality_issues_count > 0
-- LIMIT 10;
