-- =====================================================
-- SUPERVISION FILTERS - Fase 2: Filtros Avancados
-- =====================================================
-- Adiciona campos para filtros: cliente, canal, instagram

-- 0. CRIAR TABELA supervision_states SE NAO EXISTIR
CREATE TABLE IF NOT EXISTS public.supervision_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    location_id TEXT,

    -- Estado da supervisao
    status VARCHAR(50) DEFAULT 'ai_active',
    -- Valores: ai_active, ai_paused, manual_takeover, scheduled, converted, archived

    ai_enabled BOOLEAN DEFAULT true,
    notes TEXT,

    -- Marcacoes de conversao
    scheduled_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,

    -- Metadata
    updated_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint para evitar duplicatas
    UNIQUE(session_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_supervision_states_session ON public.supervision_states(session_id);
CREATE INDEX IF NOT EXISTS idx_supervision_states_status ON public.supervision_states(status);
CREATE INDEX IF NOT EXISTS idx_supervision_states_location ON public.supervision_states(location_id);

-- RLS
ALTER TABLE public.supervision_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access supervision_states" ON public.supervision_states;
CREATE POLICY "Public Access supervision_states" ON public.supervision_states FOR ALL USING (true);

GRANT ALL ON public.supervision_states TO authenticated, anon, service_role;

-- 1. VIEW EXPANDIDA: vw_supervision_conversations_v2
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
    ) as message_count

FROM public.n8n_historico_mensagens m

-- Join com supervision_states usando session_id
LEFT JOIN public.supervision_states s ON m.session_id = s.session_id

-- Pega apenas a ultima mensagem de cada session
WHERE m.id IN (
    SELECT DISTINCT ON (session_id) id
    FROM public.n8n_historico_mensagens
    WHERE session_id IS NOT NULL
    ORDER BY session_id, created_at DESC
)

ORDER BY m.created_at DESC;

-- 2. VIEW: vw_filter_options
DROP VIEW IF EXISTS public.vw_filter_options;

CREATE OR REPLACE VIEW public.vw_filter_options AS
-- Clientes (locations)
SELECT
    'location' as filter_type,
    location_id as value,
    location_name as label,
    COUNT(*)::integer as count
FROM vw_client_costs_summary
WHERE location_id IS NOT NULL
GROUP BY location_id, location_name

UNION ALL

-- Canais (extraidos de n8n_historico_mensagens)
SELECT
    'channel' as filter_type,
    channel_value as value,
    channel_label as label,
    count::integer as count
FROM (
    SELECT
        COALESCE(
            message->'additional_kwargs'->>'source',
            message->'additional_kwargs'->>'channel',
            'unknown'
        ) as channel_value,
        CASE
            WHEN message->'additional_kwargs'->>'source' = 'instagram' THEN 'Instagram'
            WHEN message->'additional_kwargs'->>'source' = 'whatsapp' THEN 'WhatsApp'
            WHEN message->'additional_kwargs'->>'source' = 'sms' THEN 'SMS'
            WHEN message->'additional_kwargs'->>'source' = 'facebook' THEN 'Facebook'
            WHEN message->'additional_kwargs'->>'source' = 'email' THEN 'Email'
            ELSE COALESCE(
                message->'additional_kwargs'->>'source',
                message->'additional_kwargs'->>'channel',
                'Outro'
            )
        END as channel_label,
        COUNT(*) as count
    FROM public.n8n_historico_mensagens
    WHERE session_id IS NOT NULL
    GROUP BY
        COALESCE(
            message->'additional_kwargs'->>'source',
            message->'additional_kwargs'->>'channel',
            'unknown'
        ),
        CASE
            WHEN message->'additional_kwargs'->>'source' = 'instagram' THEN 'Instagram'
            WHEN message->'additional_kwargs'->>'source' = 'whatsapp' THEN 'WhatsApp'
            WHEN message->'additional_kwargs'->>'source' = 'sms' THEN 'SMS'
            WHEN message->'additional_kwargs'->>'source' = 'facebook' THEN 'Facebook'
            WHEN message->'additional_kwargs'->>'source' = 'email' THEN 'Email'
            ELSE COALESCE(
                message->'additional_kwargs'->>'source',
                message->'additional_kwargs'->>'channel',
                'Outro'
            )
        END
) channels_subquery;

-- 3. FUNCAO: fn_upsert_supervision_state
-- Atualiza ou cria estado de supervisao
CREATE OR REPLACE FUNCTION public.fn_upsert_supervision_state(
    p_session_id TEXT,
    p_location_id TEXT DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_ai_enabled BOOLEAN DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
    p_converted_at TIMESTAMPTZ DEFAULT NULL,
    p_updated_by TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
    v_state_id UUID;
BEGIN
    INSERT INTO public.supervision_states (
        session_id, location_id, status, ai_enabled,
        notes, scheduled_at, converted_at, updated_by
    )
    VALUES (
        p_session_id, p_location_id,
        COALESCE(p_status, 'ai_active'),
        COALESCE(p_ai_enabled, true),
        p_notes, p_scheduled_at, p_converted_at, p_updated_by
    )
    ON CONFLICT (session_id) DO UPDATE SET
        status = COALESCE(p_status, supervision_states.status),
        ai_enabled = COALESCE(p_ai_enabled, supervision_states.ai_enabled),
        notes = COALESCE(p_notes, supervision_states.notes),
        scheduled_at = COALESCE(p_scheduled_at, supervision_states.scheduled_at),
        converted_at = COALESCE(p_converted_at, supervision_states.converted_at),
        updated_by = p_updated_by,
        updated_at = NOW()
    RETURNING id INTO v_state_id;

    RETURN v_state_id;
END;
$$ LANGUAGE plpgsql;

-- 4. GRANTS
GRANT SELECT ON public.vw_supervision_conversations_v2 TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_filter_options TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.fn_upsert_supervision_state TO authenticated, anon, service_role;

-- 5. COMENTARIOS
COMMENT ON TABLE public.supervision_states IS 'Estado de supervisao das conversas - vinculado por session_id';
COMMENT ON VIEW public.vw_supervision_conversations_v2 IS 'View expandida com campos de filtro: canal, instagram';
COMMENT ON VIEW public.vw_filter_options IS 'Opcoes disponiveis para filtros do painel de supervisao';
COMMENT ON FUNCTION public.fn_upsert_supervision_state IS 'Upsert do estado de supervisao por session_id';
