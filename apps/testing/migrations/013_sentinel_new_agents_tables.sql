-- Migration 013: Tabelas para novos agentes SENTINEL
-- Criado em: 2026-01-10
-- Propósito: Suporte aos workflows 07-11 do MIS-Sentinel

-- =====================================================
-- 1. SYSTEM HEALTH CHECKS (para 08-system-health-monitor)
-- =====================================================
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.system_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_name VARCHAR(100) NOT NULL,
    endpoint_url TEXT NOT NULL,
    endpoint_type VARCHAR(50) NOT NULL, -- api, n8n, crm, database, llm
    is_critical BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL, -- healthy, down, error, slow, warning
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_health_checks_endpoint
    ON mottivme_intelligence_system.system_health_checks(endpoint_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status
    ON mottivme_intelligence_system.system_health_checks(status) WHERE status != 'healthy';

-- =====================================================
-- 2. SCHEDULING VALIDATIONS (para 10-scheduling-validator)
-- =====================================================
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.scheduling_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_type VARCHAR(50) NOT NULL, -- double_booking, potential_no_show, unconfirmed_upcoming
    severity VARCHAR(20) NOT NULL, -- critical, high, medium, low
    appointment_id UUID,
    appointment_ids UUID[],
    contact_name VARCHAR(255),
    assigned_to VARCHAR(255),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scheduling_validations_type
    ON mottivme_intelligence_system.scheduling_validations(issue_type, validated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduling_validations_unresolved
    ON mottivme_intelligence_system.scheduling_validations(resolved) WHERE resolved = false;

-- =====================================================
-- 3. FOLLOW UP ANALYSIS (para 09-smart-follow-up)
-- =====================================================
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.follow_up_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    contact_id VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- interested, hesitant, cold, lost, unknown
    interest_score INTEGER CHECK (interest_score >= 0 AND interest_score <= 100),
    main_objection TEXT,
    recommended_action VARCHAR(50) NOT NULL, -- follow_up, wait, close_elegantly
    follow_up_message TEXT,
    best_time VARCHAR(20), -- morning, afternoon, evening
    reasoning TEXT,
    should_send_now BOOLEAN DEFAULT false,
    message_sent BOOLEAN DEFAULT false,
    message_sent_at TIMESTAMPTZ,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_follow_up_contact
    ON mottivme_intelligence_system.follow_up_analysis(contact_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_up_pending
    ON mottivme_intelligence_system.follow_up_analysis(should_send_now, message_sent)
    WHERE should_send_now = true AND message_sent = false;

-- =====================================================
-- 4. PROSPECTING METRICS (para 11-prospecting-metrics)
-- =====================================================
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.prospecting_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    period VARCHAR(20) NOT NULL, -- manhã, tarde, noite

    -- DM Automation Metrics
    dm_sent INTEGER DEFAULT 0,
    dm_responses INTEGER DEFAULT 0,
    dm_response_rate DECIMAL(5,2) DEFAULT 0,

    -- Manual Prospecting Metrics
    manual_contacts INTEGER DEFAULT 0,
    manual_responses INTEGER DEFAULT 0,
    manual_response_rate DECIMAL(5,2) DEFAULT 0,
    manual_appointments INTEGER DEFAULT 0,

    -- Pipeline Metrics
    new_leads INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    qualification_rate DECIMAL(5,2) DEFAULT 0,

    -- Combined Metrics
    total_prospections INTEGER DEFAULT 0,
    total_responses INTEGER DEFAULT 0,
    overall_response_rate DECIMAL(5,2) DEFAULT 0,

    -- Top Performer
    top_performer VARCHAR(255),
    top_performer_contacts INTEGER DEFAULT 0,

    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint per date/period
    UNIQUE(date, period)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prospecting_metrics_date
    ON mottivme_intelligence_system.prospecting_metrics(date DESC);

-- =====================================================
-- 5. MESSAGE QUEUE (para envio de follow-ups)
-- =====================================================
CREATE TABLE IF NOT EXISTS mottivme_intelligence_system.message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- follow_up, notification, alert
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    source VARCHAR(100), -- which agent/workflow created it
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_message_queue_pending
    ON mottivme_intelligence_system.message_queue(status, priority DESC, created_at)
    WHERE status = 'pending';

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE mottivme_intelligence_system.system_health_checks IS 'Histórico de health checks das APIs e serviços (workflow 08)';
COMMENT ON TABLE mottivme_intelligence_system.scheduling_validations IS 'Validações de agendamentos: conflitos, no-shows (workflow 10)';
COMMENT ON TABLE mottivme_intelligence_system.follow_up_analysis IS 'Análise de leads para follow-up inteligente (workflow 09)';
COMMENT ON TABLE mottivme_intelligence_system.prospecting_metrics IS 'Métricas consolidadas de prospecção (workflow 11)';
COMMENT ON TABLE mottivme_intelligence_system.message_queue IS 'Fila de mensagens para envio automatizado';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON ALL TABLES IN SCHEMA mottivme_intelligence_system TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA mottivme_intelligence_system TO service_role;
