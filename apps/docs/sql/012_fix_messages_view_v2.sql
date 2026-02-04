-- =====================================================
-- FIX v2: vw_supervision_messages - Remove duplicatas e adiciona mais dados
-- =====================================================

DROP VIEW IF EXISTS public.vw_supervision_messages;

CREATE OR REPLACE VIEW public.vw_supervision_messages AS
SELECT DISTINCT ON (m.id)
    m.id::text as message_id,
    m.session_id,
    m.location_id,

    -- Role (user/assistant)
    CASE
        WHEN m.message->>'type' = 'human' THEN 'user'
        WHEN m.message->>'type' = 'ai' THEN 'assistant'
        ELSE 'system'
    END as role,

    -- Conteudo da mensagem
    COALESCE(m.message->>'content', '') as content,

    -- Canal (instagram, whatsapp, etc)
    COALESCE(
        m.message->'additional_kwargs'->>'source',
        m.message->'additional_kwargs'->>'channel',
        'unknown'
    ) as channel,

    -- Sentiment score
    NULL::numeric as sentiment_score,

    m.created_at,

    -- Nome do contato (extrair de varios campos possiveis)
    COALESCE(
        m.message->'additional_kwargs'->>'full_name',
        m.message->'additional_kwargs'->>'name',
        m.message->'additional_kwargs'->>'username',
        'Desconhecido'
    ) as contact_name,

    -- Telefone (se disponivel)
    m.message->'additional_kwargs'->>'phone' as contact_phone,

    -- Nome do cliente (location)
    (
        SELECT location_name
        FROM vw_client_costs_summary
        WHERE location_id = m.location_id
        LIMIT 1
    ) as client_name

FROM public.n8n_historico_mensagens m
ORDER BY m.id, m.created_at ASC;

-- Grant access
GRANT SELECT ON public.vw_supervision_messages TO authenticated, anon, service_role;

COMMENT ON VIEW public.vw_supervision_messages IS 'Mensagens de conversa para painel de supervisao - v2 sem duplicatas';
