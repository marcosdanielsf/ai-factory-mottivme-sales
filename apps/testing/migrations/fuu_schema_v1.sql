-- ============================================
-- FOLLOW UP UNIVERSAL (FUU) - Schema v1.0
-- Data: 2026-01-09
-- Projeto: MOTTIVME Sales / Socialfy
-- ============================================

-- ============================================
-- 1. TIPOS DE FOLLOW-UP (Master)
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_follow_up_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificacao
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    description TEXT,

    -- Configuracao padrao
    default_max_attempts INT DEFAULT 7,
    default_interval_hours INT DEFAULT 24,
    default_channel VARCHAR(20) DEFAULT 'whatsapp',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_fuu_types_category ON fuu_follow_up_types(category);
CREATE INDEX IF NOT EXISTS idx_fuu_types_code ON fuu_follow_up_types(code);

-- Comentarios
COMMENT ON TABLE fuu_follow_up_types IS 'Tipos master de follow-up do sistema FUU';
COMMENT ON COLUMN fuu_follow_up_types.code IS 'Codigo unico do tipo (ex: sdr_inbound, clinic_reminder)';
COMMENT ON COLUMN fuu_follow_up_types.category IS 'Categoria: sdr, clinic, finance, experience, success, ops';


-- ============================================
-- 2. CADENCIAS (Configuracao por cliente)
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_cadences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vinculo
    follow_up_type_id UUID REFERENCES fuu_follow_up_types(id) ON DELETE CASCADE,
    location_id VARCHAR(50) NOT NULL,

    -- Configuracao da cadencia
    attempt_number INT NOT NULL,
    interval_hours INT NOT NULL,
    channel VARCHAR(20) NOT NULL,
    template_id UUID,

    -- Horarios permitidos
    send_after_hour INT DEFAULT 8,
    send_before_hour INT DEFAULT 21,
    send_on_weekends BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(follow_up_type_id, location_id, attempt_number)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_fuu_cadences_location ON fuu_cadences(location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_cadences_type ON fuu_cadences(follow_up_type_id);

-- Comentarios
COMMENT ON TABLE fuu_cadences IS 'Cadencias de follow-up configuradas por cliente/location';
COMMENT ON COLUMN fuu_cadences.attempt_number IS 'Numero da tentativa (1, 2, 3...)';
COMMENT ON COLUMN fuu_cadences.interval_hours IS 'Horas ate esta tentativa desde a anterior';


-- ============================================
-- 3. TEMPLATES DE MENSAGEM
-- ============================================
CREATE TABLE IF NOT EXISTS fuu_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Vinculo
    follow_up_type_id UUID REFERENCES fuu_follow_up_types(id) ON DELETE SET NULL,
    location_id VARCHAR(50),

    -- Conteudo
    name VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(200),
    body TEXT NOT NULL,

    -- Variacoes (para A/B testing ou rotacao)
    variation_group VARCHAR(50),
    variation_weight INT DEFAULT 100,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_fuu_templates_type ON fuu_templates(follow_up_type_id);
CREATE INDEX IF NOT EXISTS idx_fuu_templates_location ON fuu_templates(location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_templates_channel ON fuu_templates(channel);

-- Comentarios
COMMENT ON TABLE fuu_templates IS 'Templates de mensagem para follow-ups';
COMMENT ON COLUMN fuu_templates.body IS 'Corpo da mensagem com variaveis: {{nome}}, {{empresa}}, etc';
COMMENT ON COLUMN fuu_templates.variation_weight IS 'Peso para selecao aleatoria em A/B testing';


-- ============================================
-- 4. FILA DE FOLLOW-UPS (Coracao do sistema)
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
    follow_up_type_id UUID REFERENCES fuu_follow_up_types(id) ON DELETE SET NULL,
    follow_up_code VARCHAR(50),

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

    -- Constraint para status valido
    CONSTRAINT fuu_queue_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'responded', 'cancelled', 'failed', 'paused'))
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_fuu_queue_status ON fuu_queue(status);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_scheduled ON fuu_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fuu_queue_contact ON fuu_queue(contact_id, location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_type ON fuu_queue(follow_up_type_id);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_location ON fuu_queue(location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_queue_code ON fuu_queue(follow_up_code);

-- Comentarios
COMMENT ON TABLE fuu_queue IS 'Fila principal de follow-ups pendentes e em execucao';
COMMENT ON COLUMN fuu_queue.status IS 'pending, in_progress, completed, responded, cancelled, failed, paused';
COMMENT ON COLUMN fuu_queue.context IS 'JSON com dados extras: nome_lead, ultimo_assunto, produto_interesse, etc';
COMMENT ON COLUMN fuu_queue.completion_reason IS 'responded, max_attempts, manual_cancel, converted, appointment_scheduled';


-- ============================================
-- 5. DATAS ESPECIAIS DO CONTATO
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

-- Indices
CREATE INDEX IF NOT EXISTS idx_fuu_dates_contact ON fuu_contact_dates(contact_id, location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_dates_type ON fuu_contact_dates(date_type);
CREATE INDEX IF NOT EXISTS idx_fuu_dates_value ON fuu_contact_dates(date_value);

-- Comentarios
COMMENT ON TABLE fuu_contact_dates IS 'Datas especiais do contato para follow-ups de experiencia';
COMMENT ON COLUMN fuu_contact_dates.date_type IS 'birthday, wedding_anniversary, company_anniversary, etc';
COMMENT ON COLUMN fuu_contact_dates.year_matters IS 'Se false, repete todo ano (ex: aniversario)';


-- ============================================
-- 6. LOG DE EXECUCOES
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

    -- Constraint para status valido
    CONSTRAINT fuu_log_status_check CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'skipped', 'blocked'))
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_fuu_log_queue ON fuu_execution_log(queue_id);
CREATE INDEX IF NOT EXISTS idx_fuu_log_executed ON fuu_execution_log(executed_at);
CREATE INDEX IF NOT EXISTS idx_fuu_log_status ON fuu_execution_log(status);

-- Comentarios
COMMENT ON TABLE fuu_execution_log IS 'Historico de todas as execucoes de follow-up';
COMMENT ON COLUMN fuu_execution_log.status IS 'sent, delivered, read, failed, skipped, blocked';


-- ============================================
-- 7. VIEW - Proximos Follow-ups
-- ============================================
CREATE OR REPLACE VIEW fuu_next_followups AS
SELECT
    q.id,
    q.contact_id,
    q.location_id,
    q.phone,
    q.email,
    q.contact_name,
    t.code as follow_up_type,
    t.name as follow_up_name,
    t.category,
    q.current_attempt,
    q.max_attempts,
    q.scheduled_at,
    q.context,
    q.status,
    c.channel,
    c.template_id,
    c.send_after_hour,
    c.send_before_hour,
    c.send_on_weekends
FROM fuu_queue q
JOIN fuu_follow_up_types t ON q.follow_up_type_id = t.id
LEFT JOIN fuu_cadences c ON c.follow_up_type_id = t.id
    AND c.location_id = q.location_id
    AND c.attempt_number = q.current_attempt + 1
WHERE q.status = 'pending'
  AND q.scheduled_at <= NOW()
  AND t.is_active = true
ORDER BY q.scheduled_at;

COMMENT ON VIEW fuu_next_followups IS 'View dos proximos follow-ups a serem executados';


-- ============================================
-- 8. VIEW - Metricas por Location
-- ============================================
CREATE OR REPLACE VIEW fuu_metrics_by_location AS
SELECT
    q.location_id,
    t.category,
    t.code as follow_up_type,
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
JOIN fuu_follow_up_types t ON q.follow_up_type_id = t.id
GROUP BY q.location_id, t.category, t.code
ORDER BY q.location_id, t.category;

COMMENT ON VIEW fuu_metrics_by_location IS 'Metricas de follow-up agregadas por location e tipo';


-- ============================================
-- 9. FUNCAO - Agendar Follow-up
-- ============================================
CREATE OR REPLACE FUNCTION fuu_schedule_followup(
    p_contact_id VARCHAR(50),
    p_location_id VARCHAR(50),
    p_follow_up_code VARCHAR(50),
    p_phone VARCHAR(20) DEFAULT NULL,
    p_email VARCHAR(200) DEFAULT NULL,
    p_contact_name VARCHAR(200) DEFAULT NULL,
    p_context JSONB DEFAULT '{}',
    p_scheduled_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    v_type_id UUID;
    v_max_attempts INT;
    v_queue_id UUID;
BEGIN
    -- Busca o tipo de follow-up
    SELECT id, default_max_attempts
    INTO v_type_id, v_max_attempts
    FROM fuu_follow_up_types
    WHERE code = p_follow_up_code AND is_active = true;

    IF v_type_id IS NULL THEN
        RAISE EXCEPTION 'Follow-up type % not found or inactive', p_follow_up_code;
    END IF;

    -- Verifica se ja existe follow-up ativo para este contato/tipo
    SELECT id INTO v_queue_id
    FROM fuu_queue
    WHERE contact_id = p_contact_id
      AND location_id = p_location_id
      AND follow_up_code = p_follow_up_code
      AND status IN ('pending', 'in_progress')
    LIMIT 1;

    IF v_queue_id IS NOT NULL THEN
        -- Ja existe, retorna o existente
        RETURN v_queue_id;
    END IF;

    -- Insere na fila
    INSERT INTO fuu_queue (
        contact_id,
        location_id,
        phone,
        email,
        contact_name,
        follow_up_type_id,
        follow_up_code,
        max_attempts,
        scheduled_at,
        started_at,
        context
    ) VALUES (
        p_contact_id,
        p_location_id,
        p_phone,
        p_email,
        p_contact_name,
        v_type_id,
        p_follow_up_code,
        v_max_attempts,
        p_scheduled_at,
        NOW(),
        p_context
    )
    RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fuu_schedule_followup IS 'Agenda um novo follow-up na fila (ou retorna existente se ja houver)';


-- ============================================
-- 10. FUNCAO - Cancelar Follow-up
-- ============================================
CREATE OR REPLACE FUNCTION fuu_cancel_followup(
    p_contact_id VARCHAR(50),
    p_location_id VARCHAR(50),
    p_follow_up_code VARCHAR(50) DEFAULT NULL,
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
      AND (p_follow_up_code IS NULL OR follow_up_code = p_follow_up_code)
      AND status IN ('pending', 'in_progress');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fuu_cancel_followup IS 'Cancela follow-ups ativos de um contato';


-- ============================================
-- 11. FUNCAO - Marcar como Respondido
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

COMMENT ON FUNCTION fuu_mark_responded IS 'Marca todos os follow-ups ativos de um contato como respondidos';


-- ============================================
-- 12. TRIGGER - Updated_at automatico
-- ============================================
CREATE OR REPLACE FUNCTION fuu_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplica trigger em todas as tabelas FUU
DROP TRIGGER IF EXISTS fuu_types_updated ON fuu_follow_up_types;
CREATE TRIGGER fuu_types_updated
    BEFORE UPDATE ON fuu_follow_up_types
    FOR EACH ROW EXECUTE FUNCTION fuu_update_timestamp();

DROP TRIGGER IF EXISTS fuu_cadences_updated ON fuu_cadences;
CREATE TRIGGER fuu_cadences_updated
    BEFORE UPDATE ON fuu_cadences
    FOR EACH ROW EXECUTE FUNCTION fuu_update_timestamp();

DROP TRIGGER IF EXISTS fuu_templates_updated ON fuu_templates;
CREATE TRIGGER fuu_templates_updated
    BEFORE UPDATE ON fuu_templates
    FOR EACH ROW EXECUTE FUNCTION fuu_update_timestamp();

DROP TRIGGER IF EXISTS fuu_queue_updated ON fuu_queue;
CREATE TRIGGER fuu_queue_updated
    BEFORE UPDATE ON fuu_queue
    FOR EACH ROW EXECUTE FUNCTION fuu_update_timestamp();


-- ============================================
-- 13. INSERIR TIPOS PRE-CADASTRADOS
-- ============================================

-- SDR (Vendas)
INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, default_interval_hours) VALUES
('sdr_inbound', 'Follow-up Inbound', 'sdr', 'Lead que veio por trafego/organico e parou de responder', 7, 24),
('sdr_proposal', 'Follow-up Proposta', 'sdr', 'Proposta enviada aguardando retorno', 5, 48),
('sdr_demo', 'Follow-up Demo', 'sdr', 'Apos demonstracao, aguardando decisao', 5, 24),
('sdr_cold', 'Follow-up Cold', 'sdr', 'Prospeccao ativa sem resposta', 4, 72),
('sdr_reactivation', 'Reativacao de Base', 'sdr', 'Lead antigo para reativacao', 3, 168)
ON CONFLICT (code) DO NOTHING;

-- Clinic (Saude)
INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, default_interval_hours) VALUES
('clinic_welcome', 'Boas-vindas Clinica', 'clinic', 'Primeiro contato pos-cadastro', 1, 1),
('clinic_reminder_24h', 'Lembrete 24h', 'clinic', 'Lembrete 24h antes da consulta', 1, 0),
('clinic_reminder_2h', 'Lembrete 2h', 'clinic', 'Lembrete 2h antes da consulta', 1, 0),
('clinic_noshow', 'No-show Consulta', 'clinic', 'Paciente nao compareceu', 3, 24),
('clinic_post_procedure', 'Pos-procedimento', 'clinic', 'Acompanhamento apos procedimento', 3, 24),
('clinic_medication', 'Lembrete Medicacao', 'clinic', 'Lembrete para tomar/renovar medicacao', 1, 0),
('clinic_exam', 'Lembrete Exame', 'clinic', 'Lembrete de exames pendentes', 2, 72),
('clinic_return', 'Retorno Consulta', 'clinic', 'Agendar retorno', 3, 168)
ON CONFLICT (code) DO NOTHING;

-- Finance (Pagamentos)
INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, default_interval_hours) VALUES
('finance_reminder_3d', 'Lembrete 3 dias', 'finance', 'Lembrete 3 dias antes do vencimento', 1, 0),
('finance_reminder_1d', 'Lembrete 1 dia', 'finance', 'Lembrete 1 dia antes do vencimento', 1, 0),
('finance_overdue', 'Cobranca Atrasado', 'finance', 'Pagamento em atraso', 5, 72),
('finance_thanks', 'Agradecimento', 'finance', 'Agradecimento apos pagamento', 1, 1),
('finance_renewal', 'Renovacao', 'finance', 'Lembrete de renovacao proxima', 3, 168)
ON CONFLICT (code) DO NOTHING;

-- Experience (Relacionamento)
INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, default_interval_hours) VALUES
('exp_birthday', 'Aniversario', 'experience', 'Parabens de aniversario', 1, 0),
('exp_wedding_anniversary', 'Bodas', 'experience', 'Aniversario de casamento', 1, 0),
('exp_holidays', 'Datas Comemorativas', 'experience', 'Natal, Ano Novo, etc', 1, 0),
('exp_company_anniversary', 'Aniversario Empresa', 'experience', 'Cliente ha X anos', 1, 0)
ON CONFLICT (code) DO NOTHING;

-- Success (Pos-venda)
INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, default_interval_hours) VALUES
('success_onboarding_1', 'Onboarding Dia 1', 'success', 'Primeiro dia do onboarding', 1, 24),
('success_onboarding_3', 'Onboarding Dia 3', 'success', 'Terceiro dia do onboarding', 1, 72),
('success_onboarding_7', 'Onboarding Dia 7', 'success', 'Setimo dia do onboarding', 1, 168),
('success_nps', 'NPS', 'success', 'Pesquisa de satisfacao', 2, 168),
('success_review', 'Review', 'success', 'Pedir avaliacao Google/Instagram', 2, 72),
('success_upsell', 'Upsell', 'success', 'Oferta de upgrade', 2, 336),
('success_churn', 'Prevencao Churn', 'success', 'Cliente com sinais de abandono', 3, 72)
ON CONFLICT (code) DO NOTHING;

-- Ops (Operacional)
INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, default_interval_hours) VALUES
('ops_document', 'Documento Pendente', 'ops', 'Solicitar documento faltante', 3, 48),
('ops_form', 'Formulario Pendente', 'ops', 'Lembrete para preencher formulario', 3, 24),
('ops_contract', 'Contrato Pendente', 'ops', 'Aguardando assinatura', 3, 48),
('ops_warranty', 'Garantia', 'ops', 'Aviso de vencimento de garantia', 2, 720)
ON CONFLICT (code) DO NOTHING;


-- ============================================
-- FIM DO SCHEMA FUU v1.0
-- ============================================

-- Verificacao final
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'FUU Schema v1.0 criado com sucesso!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Tabelas: fuu_follow_up_types, fuu_cadences, fuu_templates, fuu_queue, fuu_contact_dates, fuu_execution_log';
    RAISE NOTICE 'Views: fuu_next_followups, fuu_metrics_by_location';
    RAISE NOTICE 'Funcoes: fuu_schedule_followup, fuu_cancel_followup, fuu_mark_responded';
    RAISE NOTICE 'Tipos pre-cadastrados: %', (SELECT COUNT(*) FROM fuu_follow_up_types);
END $$;
