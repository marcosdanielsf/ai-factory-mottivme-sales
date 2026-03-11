-- ============================================
-- FUU - Tabelas Restantes (fuu_templates, fuu_queue, fuu_contact_dates, fuu_execution_log)
-- Data: 2026-01-09
-- ============================================
-- NOTA: fuu_follow_up_types e fuu_cadences já existem!

-- ============================================
-- 1. TEMPLATES DE MENSAGEM
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vinculo
    follow_up_type VARCHAR(50) NOT NULL,
    location_id VARCHAR(50),

    -- Conteudo
    name VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    subject VARCHAR(200),
    body TEXT NOT NULL,

    -- Variacoes (para A/B testing)
    variation_group VARCHAR(50),
    variation_weight INT DEFAULT 100,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuu_templates_type ON fuu_templates(follow_up_type);
CREATE INDEX IF NOT EXISTS idx_fuu_templates_location ON fuu_templates(location_id);

COMMENT ON TABLE fuu_templates IS 'Templates de mensagem para follow-ups';


-- ============================================
-- 2. FILA DE FOLLOW-UPS
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificacao do contato
    contact_id VARCHAR(50) NOT NULL,
    location_id VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(200),
    contact_name VARCHAR(200),

    -- Tipo de follow-up
    follow_up_type VARCHAR(50) NOT NULL,

    -- Estado atual
    current_attempt INT DEFAULT 0,
    max_attempts INT DEFAULT 7,
    status VARCHAR(20) DEFAULT 'pending',

    -- Agendamento
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,

    -- Contexto (JSON flexivel)
    context JSONB DEFAULT '{}',

    -- Resultado
    completed_at TIMESTAMPTZ,
    completion_reason VARCHAR(50),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fuu_queue_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'responded', 'cancelled', 'failed', 'paused'))
);

CREATE INDEX IF NOT EXISTS idx_fuu_queue_status ON fuu_queue(status);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_scheduled ON fuu_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fuu_queue_contact ON fuu_queue(contact_id, location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_type ON fuu_queue(follow_up_type);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_location ON fuu_queue(location_id);

COMMENT ON TABLE fuu_queue IS 'Fila principal de follow-ups pendentes';
COMMENT ON COLUMN fuu_queue.status IS 'pending, in_progress, completed, responded, cancelled, failed, paused';
COMMENT ON COLUMN fuu_queue.context IS 'JSON com dados extras: nome_lead, ultimo_assunto, etc';


-- ============================================
-- 3. DATAS ESPECIAIS DO CONTATO
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_contact_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificacao
    contact_id VARCHAR(50) NOT NULL,
    location_id VARCHAR(50) NOT NULL,

    -- Data especial
    date_type VARCHAR(30) NOT NULL,
    date_value DATE NOT NULL,
    year_matters BOOLEAN DEFAULT true,

    -- Dados extras
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(contact_id, location_id, date_type)
);

CREATE INDEX IF NOT EXISTS idx_fuu_dates_contact ON fuu_contact_dates(contact_id, location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_dates_type ON fuu_contact_dates(date_type);
CREATE INDEX IF NOT EXISTS idx_fuu_dates_value ON fuu_contact_dates(date_value);

COMMENT ON TABLE fuu_contact_dates IS 'Datas especiais do contato (aniversarios, etc)';


-- ============================================
-- 4. LOG DE EXECUCOES
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vinculo
    queue_id UUID REFERENCES fuu_queue(id) ON DELETE CASCADE,

    -- Detalhes da execucao
    attempt_number INT NOT NULL,
    channel VARCHAR(20) NOT NULL,
    template_id UUID,
    message_sent TEXT,

    -- Resultado
    status VARCHAR(20) NOT NULL,
    error_message TEXT,

    -- IDs externos
    external_message_id VARCHAR(100),

    -- Timestamps
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    CONSTRAINT fuu_log_status_check CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'skipped', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_fuu_log_queue ON fuu_execution_log(queue_id);
CREATE INDEX IF NOT EXISTS idx_fuu_log_executed ON fuu_execution_log(executed_at);
CREATE INDEX IF NOT EXISTS idx_fuu_log_status ON fuu_execution_log(status);

COMMENT ON TABLE fuu_execution_log IS 'Historico de execucoes de follow-up';


-- ============================================
-- 5. VIEW - Proximos Follow-ups
-- ============================================
CREATE OR REPLACE VIEW fuu_next_followups AS
SELECT
    q.id,
    q.contact_id,
    q.location_id,
    q.phone,
    q.email,
    q.contact_name,
    q.follow_up_type,
    t.name as follow_up_name,
    t.category,
    q.current_attempt,
    q.max_attempts,
    q.scheduled_at,
    q.context,
    q.status,
    c.channel,
    c.template_id,
    c.allowed_hours_start,
    c.allowed_hours_end,
    c.allowed_days
FROM fuu_queue q
LEFT JOIN fuu_follow_up_types t ON q.follow_up_type = t.code
LEFT JOIN fuu_cadences c ON c.follow_up_type = q.follow_up_type
    AND c.location_id = q.location_id
    AND c.attempt_number = q.current_attempt + 1
WHERE q.status = 'pending'
  AND q.scheduled_at <= NOW()
ORDER BY q.scheduled_at;

COMMENT ON VIEW fuu_next_followups IS 'View dos proximos follow-ups a serem executados';


-- ============================================
-- 6. VIEW - Metricas por Location
-- ============================================
CREATE OR REPLACE VIEW fuu_metrics_by_location AS
SELECT
    q.location_id,
    q.follow_up_type,
    COUNT(*) FILTER (WHERE q.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE q.status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE q.status = 'responded') as responded_count,
    COUNT(*) FILTER (WHERE q.status = 'failed') as failed_count,
    COUNT(*) as total_count,
    ROUND(
        COUNT(*) FILTER (WHERE q.status = 'responded')::numeric /
        NULLIF(COUNT(*) FILTER (WHERE q.status IN ('completed', 'responded')), 0) * 100,
        2
    ) as response_rate
FROM fuu_queue q
GROUP BY q.location_id, q.follow_up_type
ORDER BY q.location_id;

COMMENT ON VIEW fuu_metrics_by_location IS 'Metricas agregadas por location';


-- ============================================
-- 7. FUNCAO - Agendar Follow-up
-- ============================================
CREATE OR REPLACE FUNCTION fuu_schedule_followup(
    p_contact_id VARCHAR(50),
    p_location_id VARCHAR(50),
    p_follow_up_type VARCHAR(50),
    p_phone VARCHAR(20) DEFAULT NULL,
    p_email VARCHAR(200) DEFAULT NULL,
    p_contact_name VARCHAR(200) DEFAULT NULL,
    p_context JSONB DEFAULT '{}',
    p_scheduled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    v_max_attempts INT;
    v_queue_id UUID;
BEGIN
    -- Busca max_attempts da cadencia
    SELECT COALESCE(MAX(max_attempts), 7)
    INTO v_max_attempts
    FROM fuu_cadences
    WHERE follow_up_type = p_follow_up_type
      AND location_id = p_location_id
      AND is_active = true;

    -- Verifica se ja existe follow-up ativo
    SELECT id INTO v_queue_id
    FROM fuu_queue
    WHERE contact_id = p_contact_id
      AND location_id = p_location_id
      AND follow_up_type = p_follow_up_type
      AND status IN ('pending', 'in_progress')
    LIMIT 1;

    IF v_queue_id IS NOT NULL THEN
        RETURN v_queue_id;
    END IF;

    -- Insere na fila
    INSERT INTO fuu_queue (
        contact_id, location_id, phone, email, contact_name,
        follow_up_type, max_attempts, scheduled_at, started_at, context
    ) VALUES (
        p_contact_id, p_location_id, p_phone, p_email, p_contact_name,
        p_follow_up_type, v_max_attempts, p_scheduled_at, NOW(), p_context
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fuu_schedule_followup IS 'Agenda um novo follow-up na fila';


-- ============================================
-- 8. FUNCAO - Cancelar Follow-up
-- ============================================
CREATE OR REPLACE FUNCTION fuu_cancel_followup(
    p_contact_id VARCHAR(50),
    p_location_id VARCHAR(50),
    p_follow_up_type VARCHAR(50) DEFAULT NULL,
    p_reason VARCHAR(50) DEFAULT 'manual_cancel'
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE fuu_queue
    SET
        status = 'cancelled',
        completed_at = NOW(),
        completion_reason = p_reason,
        updated_at = NOW()
    WHERE contact_id = p_contact_id
      AND location_id = p_location_id
      AND (p_follow_up_type IS NULL OR follow_up_type = p_follow_up_type)
      AND status IN ('pending', 'in_progress');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fuu_cancel_followup IS 'Cancela follow-ups ativos de um contato';


-- ============================================
-- 9. FUNCAO - Marcar como Respondido
-- ============================================
CREATE OR REPLACE FUNCTION fuu_mark_responded(
    p_contact_id VARCHAR(50),
    p_location_id VARCHAR(50)
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE fuu_queue
    SET
        status = 'responded',
        completed_at = NOW(),
        completion_reason = 'responded',
        updated_at = NOW()
    WHERE contact_id = p_contact_id
      AND location_id = p_location_id
      AND status IN ('pending', 'in_progress');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fuu_mark_responded IS 'Marca follow-ups como respondidos';


-- ============================================
-- 10. TRIGGER - Updated_at automatico
-- ============================================
CREATE OR REPLACE FUNCTION fuu_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fuu_templates_updated ON fuu_templates;
CREATE TRIGGER fuu_templates_updated
    BEFORE UPDATE ON fuu_templates
    FOR EACH ROW EXECUTE FUNCTION fuu_update_timestamp();

DROP TRIGGER IF EXISTS fuu_queue_updated ON fuu_queue;
CREATE TRIGGER fuu_queue_updated
    BEFORE UPDATE ON fuu_queue
    FOR EACH ROW EXECUTE FUNCTION fuu_update_timestamp();


-- ============================================
-- FIM - Verificacao
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'FUU Tabelas Restantes criadas!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Criadas: fuu_templates, fuu_queue, fuu_contact_dates, fuu_execution_log';
    RAISE NOTICE 'Views: fuu_next_followups, fuu_metrics_by_location';
    RAISE NOTICE 'Funcoes: fuu_schedule_followup, fuu_cancel_followup, fuu_mark_responded';
END $$;
