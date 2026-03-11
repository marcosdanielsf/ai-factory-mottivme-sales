-- ============================================================================
-- MIGRATION 015: FUU Core Functions
-- ============================================================================
-- Funções base do sistema FUU (Follow-Up Universal)
-- Execute no Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- FUNÇÃO 1: fuu_schedule_followup
-- Agenda um novo follow-up na fila
-- ============================================================================
CREATE OR REPLACE FUNCTION fuu_schedule_followup(
    p_contact_id VARCHAR(100),
    p_location_id VARCHAR(100),
    p_follow_up_type VARCHAR(100),
    p_phone VARCHAR(50) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_contact_name VARCHAR(255) DEFAULT NULL,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_scheduled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_max_attempts INT;
    v_type_exists BOOLEAN;
BEGIN
    -- Verificar se o tipo de follow-up existe e está ativo
    SELECT EXISTS (
        SELECT 1 FROM fuu_follow_up_types
        WHERE code = p_follow_up_type AND is_active = true
    ) INTO v_type_exists;

    IF NOT v_type_exists THEN
        RAISE EXCEPTION 'Follow-up type "%" not found or inactive', p_follow_up_type;
    END IF;

    -- Buscar max_attempts do tipo
    SELECT COALESCE(default_max_attempts, 5)
    INTO v_max_attempts
    FROM fuu_follow_up_types
    WHERE code = p_follow_up_type;

    -- Verificar se já existe follow-up ativo para este contato/tipo
    IF EXISTS (
        SELECT 1 FROM fuu_queue
        WHERE contact_id = p_contact_id
        AND location_id = p_location_id
        AND follow_up_type = p_follow_up_type
        AND status IN ('pending', 'in_progress')
    ) THEN
        -- Retornar o ID existente ao invés de criar duplicado
        SELECT id INTO v_id
        FROM fuu_queue
        WHERE contact_id = p_contact_id
        AND location_id = p_location_id
        AND follow_up_type = p_follow_up_type
        AND status IN ('pending', 'in_progress')
        LIMIT 1;

        RETURN v_id;
    END IF;

    -- Inserir novo follow-up na fila
    INSERT INTO fuu_queue (
        contact_id,
        location_id,
        follow_up_type,
        phone,
        email,
        contact_name,
        context,
        scheduled_at,
        max_attempts,
        current_attempt,
        status
    ) VALUES (
        p_contact_id,
        p_location_id,
        p_follow_up_type,
        p_phone,
        p_email,
        p_contact_name,
        p_context,
        p_scheduled_at,
        v_max_attempts,
        0,
        'pending'
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO 2: fuu_cancel_followup
-- Cancela follow-ups ativos de um contato
-- ============================================================================
CREATE OR REPLACE FUNCTION fuu_cancel_followup(
    p_contact_id VARCHAR(100),
    p_location_id VARCHAR(100),
    p_follow_up_type VARCHAR(100) DEFAULT NULL,
    p_reason VARCHAR(100) DEFAULT 'manual_cancel'
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    -- Atualizar todos os follow-ups ativos para 'completed'
    UPDATE fuu_queue
    SET
        status = 'completed',
        completion_reason = p_reason,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE contact_id = p_contact_id
    AND location_id = p_location_id
    AND status IN ('pending', 'in_progress')
    AND (p_follow_up_type IS NULL OR follow_up_type = p_follow_up_type);

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO 3: fuu_advance_attempt
-- Avança para a próxima tentativa de follow-up
-- ============================================================================
CREATE OR REPLACE FUNCTION fuu_advance_attempt(
    p_queue_id UUID,
    p_result VARCHAR(50) DEFAULT 'sent'
)
RETURNS JSONB AS $$
DECLARE
    v_queue RECORD;
    v_next_cadence RECORD;
    v_result JSONB;
BEGIN
    -- Buscar o item da fila
    SELECT * INTO v_queue
    FROM fuu_queue
    WHERE id = p_queue_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Queue item not found');
    END IF;

    -- Incrementar tentativa
    UPDATE fuu_queue
    SET
        current_attempt = current_attempt + 1,
        status = 'in_progress',
        started_at = COALESCE(started_at, NOW()),
        updated_at = NOW()
    WHERE id = p_queue_id;

    -- Verificar se atingiu max_attempts
    IF v_queue.current_attempt + 1 >= v_queue.max_attempts THEN
        UPDATE fuu_queue
        SET
            status = 'completed',
            completion_reason = 'max_attempts',
            completed_at = NOW()
        WHERE id = p_queue_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'completed',
            'reason', 'max_attempts',
            'attempt', v_queue.current_attempt + 1
        );
    END IF;

    -- Buscar próxima cadência
    SELECT * INTO v_next_cadence
    FROM fuu_cadences
    WHERE follow_up_type = v_queue.follow_up_type
    AND (location_id = v_queue.location_id OR location_id = 'DEFAULT_CONFIG')
    AND attempt_number = v_queue.current_attempt + 2
    AND is_active = true
    ORDER BY
        CASE WHEN location_id = v_queue.location_id THEN 0 ELSE 1 END
    LIMIT 1;

    IF FOUND THEN
        -- Agendar próxima tentativa
        UPDATE fuu_queue
        SET scheduled_at = NOW() + (v_next_cadence.interval_minutes || ' minutes')::INTERVAL
        WHERE id = p_queue_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'in_progress',
            'attempt', v_queue.current_attempt + 1,
            'next_attempt', v_queue.current_attempt + 2,
            'next_scheduled', NOW() + (v_next_cadence.interval_minutes || ' minutes')::INTERVAL
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true,
            'status', 'in_progress',
            'attempt', v_queue.current_attempt + 1,
            'next_cadence', 'not_found'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO 4: fuu_mark_responded
-- Marca um follow-up como respondido pelo lead
-- ============================================================================
CREATE OR REPLACE FUNCTION fuu_mark_responded(
    p_contact_id VARCHAR(100),
    p_location_id VARCHAR(100),
    p_follow_up_type VARCHAR(100) DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE fuu_queue
    SET
        status = 'responded',
        completion_reason = 'lead_responded',
        completed_at = NOW(),
        updated_at = NOW()
    WHERE contact_id = p_contact_id
    AND location_id = p_location_id
    AND status IN ('pending', 'in_progress')
    AND (p_follow_up_type IS NULL OR follow_up_type = p_follow_up_type);

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO 5: fuu_get_pending
-- Retorna follow-ups pendentes prontos para execução
-- ============================================================================
CREATE OR REPLACE FUNCTION fuu_get_pending(
    p_location_id VARCHAR(100) DEFAULT NULL,
    p_follow_up_type VARCHAR(100) DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    contact_id VARCHAR(100),
    location_id VARCHAR(100),
    follow_up_type VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_name VARCHAR(255),
    context JSONB,
    current_attempt INT,
    max_attempts INT,
    scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fq.id,
        fq.contact_id,
        fq.location_id,
        fq.follow_up_type,
        fq.phone,
        fq.email,
        fq.contact_name,
        fq.context,
        fq.current_attempt,
        fq.max_attempts,
        fq.scheduled_at
    FROM fuu_queue fq
    WHERE fq.status IN ('pending', 'in_progress')
    AND fq.scheduled_at <= NOW()
    AND (p_location_id IS NULL OR fq.location_id = p_location_id)
    AND (p_follow_up_type IS NULL OR fq.follow_up_type = p_follow_up_type)
    ORDER BY fq.scheduled_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
