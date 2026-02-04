-- =====================================================
-- FIX: vw_supervision_messages para usar n8n_historico_mensagens
-- =====================================================
-- Executa isso no Supabase SQL Editor

-- Drop view antiga se existir
DROP VIEW IF EXISTS public.vw_supervision_messages;

-- Criar view correta usando n8n_historico_mensagens
CREATE OR REPLACE VIEW public.vw_supervision_messages AS
SELECT
    m.id::text as message_id,
    m.session_id,
    m.location_id,

    -- Extrair role do JSONB message
    CASE
        WHEN m.message->>'type' = 'human' THEN 'user'
        WHEN m.message->>'type' = 'ai' THEN 'assistant'
        ELSE 'system'
    END as role,

    -- Extrair content do JSONB message
    COALESCE(m.message->>'content', '') as content,

    -- Extrair channel/source
    m.message->'additional_kwargs'->>'source' as channel,

    -- Sentiment score (null por enquanto)
    NULL::numeric as sentiment_score,

    m.created_at,

    -- Info do contato
    m.message->'additional_kwargs'->>'full_name' as contact_name,
    NULL::text as contact_phone,

    -- Nome do cliente (location)
    l.location_name as agent_name

FROM public.n8n_historico_mensagens m
LEFT JOIN public.vw_client_costs_summary l ON m.location_id = l.location_id

ORDER BY m.created_at ASC;

-- Grant access
GRANT SELECT ON public.vw_supervision_messages TO authenticated, anon;

-- Comentario
COMMENT ON VIEW public.vw_supervision_messages IS 'Mensagens de conversa para painel de supervisao';
