-- =====================================================
-- SUPERVISION V5 - Com dados completos do cliente
-- =====================================================
-- Adiciona os 8 campos da tabela clients na view de supervisao
-- JOIN via location_id = metadata->>'ghl_location_id'
-- =====================================================

DROP VIEW IF EXISTS public.vw_supervision_conversations_v5;

CREATE OR REPLACE VIEW public.vw_supervision_conversations_v5 AS
SELECT
    -- Identificadores
    m.session_id,
    m.location_id,
    m.id::text as conversation_id,

    -- Dados do Contato (lead)
    COALESCE(
        m.message->'additional_kwargs'->>'full_name',
        m.message->'additional_kwargs'->>'name',
        m.message->'additional_kwargs'->>'username',
        'Desconhecido'
    ) as contact_name,
    m.message->'additional_kwargs'->>'phone' as contact_phone,
    m.message->'additional_kwargs'->>'email' as contact_email,

    -- ===== DADOS DO CLIENTE (8 campos) =====
    c.id as client_id,
    c.nome as client_nome,
    c.empresa as client_empresa,
    c.telefone as client_telefone,
    c.email as client_email,
    c.vertical as client_vertical,
    c.status as client_status,
    c.ghl_contact_id as client_ghl_contact_id,
    c.metadata->>'ghl_location_id' as client_ghl_location_id,
    
    -- Nome do cliente para exibicao (fallback)
    COALESCE(c.nome, c.empresa, 
        (SELECT location_name FROM vw_client_costs_summary WHERE location_id = m.location_id LIMIT 1),
        'Cliente'
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

    -- Canal
    COALESCE(
        m.message->'additional_kwargs'->>'source',
        m.message->'additional_kwargs'->>'channel',
        'unknown'
    ) as channel,

    -- Instagram username
    COALESCE(
        m.message->'additional_kwargs'->>'instagram',
        m.message->'additional_kwargs'->>'username',
        CASE
            WHEN m.message->'additional_kwargs'->>'source' = 'instagram'
            THEN m.message->'additional_kwargs'->>'name'
            ELSE NULL
        END
    ) as instagram_username,

    -- Campos reservados
    NULL::text as etapa_funil,
    NULL::text as usuario_responsavel,

    -- Contagem de mensagens
    (
        SELECT COUNT(*)
        FROM public.n8n_historico_mensagens n
        WHERE n.session_id = m.session_id
    ) as message_count,

    -- Quality flags
    COALESCE(q.total_unresolved, 0) as quality_issues_count,
    q.max_severity as quality_max_severity,
    q.critical_count as quality_critical_count,
    q.high_count as quality_high_count

FROM public.n8n_historico_mensagens m

-- Join com clients via location_id = metadata->>'ghl_location_id'
LEFT JOIN public.clients c ON m.location_id = c.metadata->>'ghl_location_id'

-- Join com supervision_states
LEFT JOIN public.supervision_states s ON m.session_id = s.session_id

-- Join com quality summary
LEFT JOIN public.vw_conversation_quality_summary q ON m.session_id = q.session_id

-- Pega apenas a ultima mensagem de cada session
WHERE m.id IN (
    SELECT DISTINCT ON (session_id) id
    FROM public.n8n_historico_mensagens
    WHERE session_id IS NOT NULL
    ORDER BY session_id, created_at DESC
)

ORDER BY m.created_at DESC;

-- GRANTS
GRANT SELECT ON public.vw_supervision_conversations_v5 TO authenticated, anon, service_role;

-- ALIAS para v4 (compatibilidade)
DROP VIEW IF EXISTS public.vw_supervision_conversations_v4;
CREATE OR REPLACE VIEW public.vw_supervision_conversations_v4 AS
SELECT * FROM public.vw_supervision_conversations_v5;

GRANT SELECT ON public.vw_supervision_conversations_v4 TO authenticated, anon, service_role;

COMMENT ON VIEW public.vw_supervision_conversations_v5 IS 
'View de supervisao com dados completos do cliente (8 campos da tabela clients)';
