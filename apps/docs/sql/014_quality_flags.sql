-- =====================================================
-- QUALITY FLAGS - Sistema de Deteccao de Problemas Real-Time
-- =====================================================
-- Detecta em tempo real: fuga do prompt, erros, bugs, timeouts

-- 1. ENUM: Tipos de problema de qualidade
DO $$ BEGIN
    CREATE TYPE public.quality_flag_type AS ENUM (
        'FUGA_PROMPT',      -- Resposta fora do escopo/guardrails
        'ERRO_INFO',        -- Informacao incorreta sobre negocio
        'TOM_INADEQUADO',   -- Tom ou linguagem inapropriada
        'NAO_RESPONDEU',    -- Timeout ou sem resposta
        'REPETITIVO',       -- Loop/resposta duplicada
        'BUG_TECNICO'       -- Resposta truncada ou erro tecnico
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ENUM: Severidade do problema
DO $$ BEGIN
    CREATE TYPE public.quality_severity AS ENUM (
        'low',       -- Apenas observacao
        'medium',    -- Requer atencao
        'high',      -- Requer intervencao
        'critical'   -- Intervencao imediata
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA: conversation_quality_flags
-- Armazena flags de problemas detectados nas mensagens
CREATE TABLE IF NOT EXISTS public.conversation_quality_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Referencia a mensagem
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    location_id TEXT,

    -- Tipo e severidade
    flag_type public.quality_flag_type NOT NULL,
    severity public.quality_severity NOT NULL DEFAULT 'medium',

    -- Detalhes
    description TEXT NOT NULL,
    evidence TEXT,                    -- Trecho da mensagem que causou o flag
    expected_behavior TEXT,           -- O que deveria ter acontecido

    -- Analise
    analyzed_by TEXT DEFAULT 'ai',    -- 'ai' ou user_id
    analysis_model TEXT,              -- Modelo que detectou (gpt-4o, claude, etc)
    confidence_score NUMERIC(3,2),    -- 0.00 a 1.00

    -- Resolucao
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_notes TEXT,

    -- Auto-improvement link
    improvement_suggestion_id UUID,   -- Link para sugestao no self-improving

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDICES para performance
CREATE INDEX IF NOT EXISTS idx_quality_flags_session
    ON public.conversation_quality_flags(session_id);
CREATE INDEX IF NOT EXISTS idx_quality_flags_location
    ON public.conversation_quality_flags(location_id);
CREATE INDEX IF NOT EXISTS idx_quality_flags_type
    ON public.conversation_quality_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_quality_flags_severity
    ON public.conversation_quality_flags(severity);
CREATE INDEX IF NOT EXISTS idx_quality_flags_unresolved
    ON public.conversation_quality_flags(is_resolved) WHERE NOT is_resolved;
CREATE INDEX IF NOT EXISTS idx_quality_flags_created
    ON public.conversation_quality_flags(created_at DESC);

-- 5. TRIGGER para updated_at
CREATE OR REPLACE FUNCTION update_quality_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quality_flags_updated_at ON public.conversation_quality_flags;
CREATE TRIGGER trg_quality_flags_updated_at
    BEFORE UPDATE ON public.conversation_quality_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_quality_flags_updated_at();

-- 6. VIEW: vw_conversation_quality_summary
-- Resumo de flags por conversa para o painel de supervisao
CREATE OR REPLACE VIEW public.vw_conversation_quality_summary AS
SELECT
    session_id,
    location_id,

    -- Contadores por severidade
    COUNT(*) FILTER (WHERE NOT is_resolved) as total_unresolved,
    COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_resolved) as critical_count,
    COUNT(*) FILTER (WHERE severity = 'high' AND NOT is_resolved) as high_count,
    COUNT(*) FILTER (WHERE severity = 'medium' AND NOT is_resolved) as medium_count,
    COUNT(*) FILTER (WHERE severity = 'low' AND NOT is_resolved) as low_count,

    -- Contadores por tipo
    COUNT(*) FILTER (WHERE flag_type = 'FUGA_PROMPT' AND NOT is_resolved) as fuga_count,
    COUNT(*) FILTER (WHERE flag_type = 'ERRO_INFO' AND NOT is_resolved) as erro_count,
    COUNT(*) FILTER (WHERE flag_type = 'NAO_RESPONDEU' AND NOT is_resolved) as timeout_count,
    COUNT(*) FILTER (WHERE flag_type = 'BUG_TECNICO' AND NOT is_resolved) as bug_count,

    -- Severidade maxima (para badge)
    CASE
        WHEN COUNT(*) FILTER (WHERE severity = 'critical' AND NOT is_resolved) > 0 THEN 'critical'
        WHEN COUNT(*) FILTER (WHERE severity = 'high' AND NOT is_resolved) > 0 THEN 'high'
        WHEN COUNT(*) FILTER (WHERE severity = 'medium' AND NOT is_resolved) > 0 THEN 'medium'
        WHEN COUNT(*) FILTER (WHERE severity = 'low' AND NOT is_resolved) > 0 THEN 'low'
        ELSE null
    END as max_severity,

    -- Ultimo flag
    MAX(created_at) as last_flag_at,

    -- Total historico
    COUNT(*) as total_flags,
    COUNT(*) FILTER (WHERE is_resolved) as total_resolved

FROM public.conversation_quality_flags
GROUP BY session_id, location_id;

-- 7. VIEW: vw_quality_flags_detail
-- Detalhes dos flags para modal de investigacao
CREATE OR REPLACE VIEW public.vw_quality_flags_detail AS
SELECT
    f.id,
    f.session_id,
    f.message_id,
    f.location_id,
    f.flag_type,
    f.severity,
    f.description,
    f.evidence,
    f.expected_behavior,
    f.analyzed_by,
    f.analysis_model,
    f.confidence_score,
    f.is_resolved,
    f.resolved_at,
    f.resolved_by,
    f.resolution_notes,
    f.created_at,

    -- Nome do cliente (usa location_id como fallback)
    COALESCE(f.location_id, 'Cliente') as client_name

FROM public.conversation_quality_flags f
ORDER BY f.created_at DESC;

-- 8. FUNCAO: fn_create_quality_flag
-- Cria um novo flag de qualidade
CREATE OR REPLACE FUNCTION public.fn_create_quality_flag(
    p_session_id TEXT,
    p_message_id TEXT,
    p_location_id TEXT,
    p_flag_type public.quality_flag_type,
    p_severity public.quality_severity,
    p_description TEXT,
    p_evidence TEXT DEFAULT NULL,
    p_expected_behavior TEXT DEFAULT NULL,
    p_analysis_model TEXT DEFAULT NULL,
    p_confidence_score NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_flag_id UUID;
BEGIN
    INSERT INTO public.conversation_quality_flags (
        session_id,
        message_id,
        location_id,
        flag_type,
        severity,
        description,
        evidence,
        expected_behavior,
        analysis_model,
        confidence_score
    )
    VALUES (
        p_session_id,
        p_message_id,
        p_location_id,
        p_flag_type,
        p_severity,
        p_description,
        p_evidence,
        p_expected_behavior,
        p_analysis_model,
        p_confidence_score
    )
    RETURNING id INTO v_flag_id;

    RETURN v_flag_id;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNCAO: fn_resolve_quality_flag
-- Marca um flag como resolvido
CREATE OR REPLACE FUNCTION public.fn_resolve_quality_flag(
    p_flag_id UUID,
    p_resolved_by TEXT,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.conversation_quality_flags
    SET
        is_resolved = true,
        resolved_at = NOW(),
        resolved_by = p_resolved_by,
        resolution_notes = p_resolution_notes
    WHERE id = p_flag_id AND NOT is_resolved;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 10. RLS - Seguranca
ALTER TABLE public.conversation_quality_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read quality_flags"
    ON public.conversation_quality_flags FOR SELECT USING (true);

CREATE POLICY "Authenticated write quality_flags"
    ON public.conversation_quality_flags FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated update quality_flags"
    ON public.conversation_quality_flags FOR UPDATE
    USING (true);

-- 11. GRANTS
GRANT SELECT ON public.vw_conversation_quality_summary TO authenticated, anon;
GRANT SELECT ON public.vw_quality_flags_detail TO authenticated, anon;
GRANT ALL ON public.conversation_quality_flags TO authenticated, anon;

-- 12. REALTIME - Habilitar para atualizacoes em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_quality_flags;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE public.conversation_quality_flags IS 'Flags de problemas de qualidade detectados nas mensagens da IA';
COMMENT ON VIEW public.vw_conversation_quality_summary IS 'Resumo de flags por conversa para badges no painel';
COMMENT ON VIEW public.vw_quality_flags_detail IS 'Detalhes dos flags para investigacao';
COMMENT ON FUNCTION public.fn_create_quality_flag IS 'Cria novo flag de qualidade';
COMMENT ON FUNCTION public.fn_resolve_quality_flag IS 'Marca flag como resolvido';
