-- =====================================================
-- SUPERVISION PANEL - Painel de Supervisao da Gestora de IA
-- =====================================================
-- MVP: Monitorar conversas, pausar IA, marcar leads

-- 1. TABELA: supervision_states
-- Armazena o estado de supervisao de cada conversa
CREATE TABLE IF NOT EXISTS public.supervision_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL,
    lead_id UUID REFERENCES public.leads(id),
    agent_id UUID REFERENCES public.agents(id),

    -- Estado da supervisao
    status VARCHAR(50) DEFAULT 'ai_active',
    -- Valores: ai_active, ai_paused, manual_takeover, scheduled, converted, archived

    ai_enabled BOOLEAN DEFAULT true,
    notes TEXT,

    -- Marcacoes de conversao
    scheduled_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,

    -- Metadata
    updated_by TEXT, -- user_id ou 'system'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para buscas rapidas
CREATE INDEX IF NOT EXISTS idx_supervision_states_conversation
    ON public.supervision_states(conversation_id);
CREATE INDEX IF NOT EXISTS idx_supervision_states_status
    ON public.supervision_states(status);
CREATE INDEX IF NOT EXISTS idx_supervision_states_lead
    ON public.supervision_states(lead_id);

-- Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION update_supervision_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supervision_states_updated_at ON public.supervision_states;
CREATE TRIGGER trg_supervision_states_updated_at
    BEFORE UPDATE ON public.supervision_states
    FOR EACH ROW
    EXECUTE FUNCTION update_supervision_states_updated_at();

-- 2. VIEW: vw_supervision_conversations
-- Une dados de conversas com leads e estados de supervisao
CREATE OR REPLACE VIEW public.vw_supervision_conversations AS
SELECT
    -- Identificadores
    c.id as conversation_id,
    c.lead_id,
    c.agent_id,

    -- Dados do Lead
    l.name as contact_name,
    l.phone as contact_phone,
    l.email as contact_email,
    l.status as lead_status,

    -- Dados do Agente
    a.name as agent_name,
    a.slug as agent_slug,

    -- Ultima mensagem
    c.content as last_message,
    c.role as last_message_role,
    c.created_at as last_message_at,
    c.sentiment_score,

    -- Estado de Supervisao (com fallback)
    COALESCE(s.status, 'ai_active') as supervision_status,
    COALESCE(s.ai_enabled, true) as ai_enabled,
    s.notes as supervision_notes,
    s.scheduled_at,
    s.converted_at,
    s.updated_at as supervision_updated_at,

    -- Contagem de mensagens (subquery)
    (
        SELECT COUNT(*)
        FROM public.agent_conversations ac
        WHERE ac.lead_id = c.lead_id
    ) as message_count

FROM public.agent_conversations c
LEFT JOIN public.leads l ON c.lead_id = l.id
LEFT JOIN public.agents a ON c.agent_id = a.id
LEFT JOIN public.supervision_states s ON c.id = s.conversation_id

-- Pega apenas a ultima mensagem de cada lead
WHERE c.id IN (
    SELECT DISTINCT ON (lead_id) id
    FROM public.agent_conversations
    WHERE lead_id IS NOT NULL
    ORDER BY lead_id, created_at DESC
)

ORDER BY c.created_at DESC;

-- 3. VIEW: vw_supervision_messages
-- Mensagens de uma conversa especifica (para o chat detail)
CREATE OR REPLACE VIEW public.vw_supervision_messages AS
SELECT
    c.id as message_id,
    c.lead_id,
    c.agent_id,
    c.role,
    c.content,
    c.channel,
    c.sentiment_score,
    c.created_at,

    -- Info do lead para header
    l.name as contact_name,
    l.phone as contact_phone,

    -- Info do agente
    a.name as agent_name

FROM public.agent_conversations c
LEFT JOIN public.leads l ON c.lead_id = l.id
LEFT JOIN public.agents a ON c.agent_id = a.id

ORDER BY c.created_at ASC;

-- 4. FUNCAO: fn_update_supervision_state
-- Atualiza ou cria estado de supervisao
CREATE OR REPLACE FUNCTION public.fn_update_supervision_state(
    p_conversation_id UUID,
    p_lead_id UUID DEFAULT NULL,
    p_agent_id UUID DEFAULT NULL,
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
    -- Tenta encontrar estado existente
    SELECT id INTO v_state_id
    FROM public.supervision_states
    WHERE conversation_id = p_conversation_id;

    IF v_state_id IS NULL THEN
        -- Cria novo
        INSERT INTO public.supervision_states (
            conversation_id, lead_id, agent_id, status, ai_enabled,
            notes, scheduled_at, converted_at, updated_by
        )
        VALUES (
            p_conversation_id, p_lead_id, p_agent_id,
            COALESCE(p_status, 'ai_active'),
            COALESCE(p_ai_enabled, true),
            p_notes, p_scheduled_at, p_converted_at, p_updated_by
        )
        RETURNING id INTO v_state_id;
    ELSE
        -- Atualiza existente
        UPDATE public.supervision_states
        SET
            status = COALESCE(p_status, status),
            ai_enabled = COALESCE(p_ai_enabled, ai_enabled),
            notes = COALESCE(p_notes, notes),
            scheduled_at = COALESCE(p_scheduled_at, scheduled_at),
            converted_at = COALESCE(p_converted_at, converted_at),
            updated_by = p_updated_by
        WHERE id = v_state_id;
    END IF;

    RETURN v_state_id;
END;
$$ LANGUAGE plpgsql;

-- 5. POLITICAS RLS
ALTER TABLE public.supervision_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access supervision_states"
    ON public.supervision_states FOR ALL USING (true);

-- 6. GRANT para views
GRANT SELECT ON public.vw_supervision_conversations TO authenticated, anon;
GRANT SELECT ON public.vw_supervision_messages TO authenticated, anon;
GRANT ALL ON public.supervision_states TO authenticated, anon;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE public.supervision_states IS 'Estado de supervisao das conversas da gestora de IA';
COMMENT ON VIEW public.vw_supervision_conversations IS 'View unificada para painel de supervisao';
COMMENT ON VIEW public.vw_supervision_messages IS 'Mensagens de uma conversa para visualizacao';
COMMENT ON FUNCTION public.fn_update_supervision_state IS 'Upsert do estado de supervisao';
