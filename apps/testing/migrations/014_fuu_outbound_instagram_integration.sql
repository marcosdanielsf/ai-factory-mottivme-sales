-- ============================================================================
-- MIGRATION 014: FUU Outbound Instagram Integration
-- ============================================================================
-- Descricao: Integra o sistema FUU (Follow-Up Universal) com prospeccao
--            outbound via Instagram DM
-- Data: 2026-01-25
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: NOVO TIPO DE FOLLOW-UP
-- ============================================================================

INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, is_active)
VALUES (
    'sdr_outbound_instagram',
    'Outbound Instagram - Prospeccao DM',
    'sdr',
    'Follow-up para leads prospectados via Instagram DM. Cadencia agressiva nas primeiras 24h.',
    4,
    true
) ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    default_max_attempts = EXCLUDED.default_max_attempts,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO fuu_follow_up_types (code, name, category, description, default_max_attempts, is_active)
VALUES (
    'sdr_outbound_instagram_reactivation',
    'Outbound Instagram - Reativacao',
    'sdr',
    'Reativacao de leads prospectados via Instagram apos 7+ dias.',
    3,
    true
) ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    default_max_attempts = EXCLUDED.default_max_attempts,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================================================
-- PARTE 2: CADENCIAS
-- ============================================================================

DELETE FROM fuu_cadences
WHERE follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
  AND location_id = 'DEFAULT_CONFIG';

-- T1: Micro-ping (15 min)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'instagram', 1, 15, 24, 'ai_text', '09:00', '20:00', ARRAY[1,2,3,4,5], 4, true);

-- T2: Hook (5h)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'instagram', 2, 300, 24, 'ai_text', '09:00', '20:00', ARRAY[1,2,3,4,5], 4, true);

-- T3: Meme (18h)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, tag_to_add, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'instagram', 3, 780, 24, 'tag', 'enviar-meme-ig', '09:00', '20:00', ARRAY[1,2,3,4,5], 4, true);

-- T4: Urgencia (23h)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'instagram', 4, 300, 24, 'ai_text', '09:00', '21:00', ARRAY[1,2,3,4,5,6], 4, true);

-- Reativacao R1 (7d)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram_reactivation', 'instagram', 1, 10080, NULL, 'ai_text', '10:00', '18:00', ARRAY[2,3,4], 3, true);

-- Reativacao R2 (14d)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram_reactivation', 'instagram', 2, 10080, NULL, 'ai_text', '10:00', '18:00', ARRAY[2,3,4], 3, true);

-- Reativacao R3 Breakup (28d)
INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, tag_to_add, allowed_hours_start, allowed_hours_end, allowed_days, max_attempts, is_active)
VALUES ('DEFAULT_CONFIG', 'sdr_outbound_instagram_reactivation', 'instagram', 3, 20160, NULL, 'ai_text', 'breakup-final', '10:00', '18:00', ARRAY[2,3,4], 3, true);

-- ============================================================================
-- PARTE 3: AGENT CONFIGS
-- ============================================================================

INSERT INTO fuu_agent_configs (location_id, follow_up_type, agent_name, company_name, company_description, agent_role, language, tone, use_slang, use_emoji, max_emoji_per_message, max_message_lines, offer_value_attempt, breakup_attempt, custom_prompts, message_examples, custom_rules, is_active)
VALUES (
    'DEFAULT_CONFIG',
    'sdr_outbound_instagram',
    'BDR Virtual',
    '{{company_name}}',
    '{{company_description}}',
    'BDR de Prospeccao Outbound',
    'pt-BR',
    'casual-curioso',
    true, true, 1, 2, 3, 4,
    '{"prime_directive": "PROSPECCAO ATIVA. Lead NAO te conhece. Seja breve e curioso.", "attempt_1": "Micro-ping: Conseguiu ver?", "attempt_2": "Hook com contexto do perfil", "attempt_3": "Meme/GIF divertido", "attempt_4": "Urgencia: pedir WhatsApp"}'::jsonb,
    '[{"attempt": 1, "example": "Conseguiu ver?"}, {"attempt": 2, "example": "Vi que vc trabalha com X. Como ta o mercado?"}, {"attempt": 3, "example": "[GIF] O Insta comeu minha msg? rs"}, {"attempt": 4, "example": "Chat vai fechar. Qual teu WA?"}]'::jsonb,
    ARRAY['NUNCA venda na primeira msg', 'Max 2 linhas', 'Max 1 emoji'],
    true
) ON CONFLICT (location_id, follow_up_type) DO UPDATE SET
    custom_prompts = EXCLUDED.custom_prompts,
    message_examples = EXCLUDED.message_examples,
    updated_at = NOW();

INSERT INTO fuu_agent_configs (location_id, follow_up_type, agent_name, company_name, company_description, agent_role, language, tone, use_slang, use_emoji, max_emoji_per_message, max_message_lines, offer_value_attempt, breakup_attempt, custom_prompts, message_examples, custom_rules, is_active)
VALUES (
    'DEFAULT_CONFIG',
    'sdr_outbound_instagram_reactivation',
    'BDR Virtual',
    '{{company_name}}',
    '{{company_description}}',
    'BDR de Reativacao',
    'pt-BR',
    'casual-amigavel',
    true, true, 1, 3, 2, 3,
    '{"prime_directive": "Reativacao leve. Ofereca valor primeiro."}'::jsonb,
    '[{"attempt": 1, "example": "Oi! Tinha te mandado msg. Vi algo sobre X que lembrei de vc"}, {"attempt": 2, "example": "Tenho um material sobre Y. Quer?"}, {"attempt": 3, "example": "Vou parar por aqui. Qualquer coisa, me chama!"}]'::jsonb,
    ARRAY['Nunca cobre resposta', 'Ofereca valor antes'],
    true
) ON CONFLICT (location_id, follow_up_type) DO UPDATE SET
    custom_prompts = EXCLUDED.custom_prompts,
    message_examples = EXCLUDED.message_examples,
    updated_at = NOW();

-- ============================================================================
-- PARTE 4: TEMPLATES
-- ============================================================================

DELETE FROM fuu_templates WHERE follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation') AND location_id = 'DEFAULT_CONFIG';

INSERT INTO fuu_templates (location_id, follow_up_type, template_key, body, channel, is_active) VALUES
    ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'micro_ping_1', 'Conseguiu ver?', 'instagram', true),
    ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'micro_ping_2', 'Viu?', 'instagram', true),
    ('DEFAULT_CONFIG', 'sdr_outbound_instagram', 'urgency_wa', '{{nome}}, chat vai fechar. Qual teu WA?', 'instagram', true),
    ('DEFAULT_CONFIG', 'sdr_outbound_instagram_reactivation', 'breakup', 'Vou parar por aqui. Se fizer sentido, me chama!', 'instagram', true);

-- ============================================================================
-- PARTE 5: VIEW LEADS PENDENTES
-- ============================================================================

CREATE OR REPLACE VIEW vw_growth_leads_pending_fuu AS
SELECT
    gl.id as growth_lead_id,
    gl.location_id,
    gl.ghl_contact_id as contact_id,
    gl.name as contact_name,
    gl.phone, gl.email, gl.instagram_username,
    gl.source_channel, gl.funnel_stage, gl.lead_temperature, gl.lead_score,
    gl.last_contact_at, gl.last_response_at, gl.total_messages_sent,
    ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(gl.last_contact_at, gl.created_at))) / 3600, 2) as hours_since_contact,
    CASE WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(gl.last_contact_at, gl.created_at))) / 3600 < 24
        THEN 'sdr_outbound_instagram' ELSE 'sdr_outbound_instagram_reactivation' END as suggested_followup_type,
    EXISTS (SELECT 1 FROM fuu_queue fq WHERE fq.contact_id = gl.ghl_contact_id AND fq.location_id = gl.location_id
        AND fq.follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
        AND fq.status IN ('pending', 'in_progress')) as has_active_followup
FROM growth_leads gl
WHERE gl.source_channel = 'instagram_dm' AND gl.last_response_at IS NULL AND gl.total_messages_sent >= 1
    AND gl.funnel_stage NOT IN ('won', 'lost', 'no_show', 'converted') AND gl.ghl_contact_id IS NOT NULL
    AND EXTRACT(EPOCH FROM (NOW() - COALESCE(gl.last_contact_at, gl.created_at))) / 60 >= 15;

-- ============================================================================
-- PARTE 6: FUNCAO SYNC
-- ============================================================================

CREATE OR REPLACE FUNCTION fuu_sync_outbound_instagram_leads(p_location_id VARCHAR(100) DEFAULT NULL, p_limit INT DEFAULT 50)
RETURNS TABLE (synced_count INT, leads_synced UUID[], errors TEXT[]) AS $$
DECLARE
    v_count INT := 0; v_synced_ids UUID[] := '{}'; v_errors TEXT[] := '{}'; v_lead RECORD; v_fuu_id UUID;
BEGIN
    FOR v_lead IN SELECT * FROM vw_growth_leads_pending_fuu WHERE has_active_followup = false
        AND (p_location_id IS NULL OR location_id = p_location_id) ORDER BY hours_since_contact ASC LIMIT p_limit
    LOOP
        BEGIN
            SELECT fuu_schedule_followup(v_lead.contact_id, v_lead.location_id, v_lead.suggested_followup_type,
                v_lead.phone, v_lead.email, v_lead.contact_name,
                jsonb_build_object('source', 'growth_leads_auto_sync', 'growth_lead_id', v_lead.growth_lead_id,
                    'instagram_username', v_lead.instagram_username, 'lead_temperature', v_lead.lead_temperature),
                NOW()) INTO v_fuu_id;
            v_count := v_count + 1;
            v_synced_ids := array_append(v_synced_ids, v_lead.growth_lead_id);
        EXCEPTION WHEN OTHERS THEN
            v_errors := array_append(v_errors, format('Lead %s: %s', v_lead.growth_lead_id, SQLERRM));
        END;
    END LOOP;
    RETURN QUERY SELECT v_count, v_synced_ids, v_errors;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 7: TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION fuu_cancel_on_lead_response() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_response_at IS NOT NULL AND OLD.last_response_at IS NULL AND NEW.source_channel = 'instagram_dm' THEN
        PERFORM fuu_cancel_followup(NEW.ghl_contact_id, NEW.location_id, NULL, 'lead_responded');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fuu_cancel_on_response ON growth_leads;
CREATE TRIGGER trigger_fuu_cancel_on_response AFTER UPDATE OF last_response_at ON growth_leads
    FOR EACH ROW EXECUTE FUNCTION fuu_cancel_on_lead_response();

CREATE OR REPLACE FUNCTION fuu_schedule_on_dm_sent() RETURNS TRIGGER AS $$
DECLARE v_fuu_id UUID; v_hours_since NUMERIC;
BEGIN
    IF NEW.source_channel != 'instagram_dm' THEN RETURN NEW; END IF;
    IF NEW.last_contact_at IS NOT NULL AND NEW.last_response_at IS NULL AND NEW.ghl_contact_id IS NOT NULL AND NEW.total_messages_sent >= 1 THEN
        v_hours_since := EXTRACT(EPOCH FROM (NOW() - NEW.last_contact_at)) / 3600;
        IF NOT EXISTS (SELECT 1 FROM fuu_queue WHERE contact_id = NEW.ghl_contact_id AND location_id = NEW.location_id
            AND follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation') AND status IN ('pending', 'in_progress')) THEN
            SELECT fuu_schedule_followup(NEW.ghl_contact_id, NEW.location_id,
                CASE WHEN v_hours_since < 24 THEN 'sdr_outbound_instagram' ELSE 'sdr_outbound_instagram_reactivation' END,
                NEW.phone, NEW.email, NEW.name,
                jsonb_build_object('source', 'growth_leads_trigger', 'growth_lead_id', NEW.id, 'instagram_username', NEW.instagram_username),
                NEW.last_contact_at + INTERVAL '15 minutes') INTO v_fuu_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_fuu_schedule_on_dm_sent ON growth_leads;
CREATE TRIGGER trigger_fuu_schedule_on_dm_sent AFTER INSERT OR UPDATE OF last_contact_at, total_messages_sent ON growth_leads
    FOR EACH ROW EXECUTE FUNCTION fuu_schedule_on_dm_sent();

-- ============================================================================
-- PARTE 8: FUNCAO ESCALACAO
-- ============================================================================

CREATE OR REPLACE FUNCTION fuu_escalate_to_reactivation() RETURNS INT AS $$
DECLARE v_count INT := 0; v_lead RECORD;
BEGIN
    FOR v_lead IN
        SELECT DISTINCT ON (fq.contact_id) fq.contact_id, fq.location_id, fq.phone, fq.contact_name, fq.context,
            gl.email, gl.instagram_username
        FROM fuu_queue fq LEFT JOIN growth_leads gl ON gl.ghl_contact_id = fq.contact_id
        WHERE fq.follow_up_type = 'sdr_outbound_instagram' AND fq.status = 'completed' AND fq.completion_reason = 'max_attempts'
            AND fq.completed_at > NOW() - INTERVAL '7 days'
            AND NOT EXISTS (SELECT 1 FROM fuu_queue fq2 WHERE fq2.contact_id = fq.contact_id
                AND fq2.follow_up_type = 'sdr_outbound_instagram_reactivation' AND fq2.status IN ('pending', 'in_progress'))
            AND (gl.last_response_at IS NULL OR gl.last_response_at < fq.created_at)
        ORDER BY fq.contact_id, fq.completed_at DESC
    LOOP
        PERFORM fuu_schedule_followup(v_lead.contact_id, v_lead.location_id, 'sdr_outbound_instagram_reactivation',
            v_lead.phone, v_lead.email, v_lead.contact_name,
            v_lead.context || jsonb_build_object('escalated_from', 'sdr_outbound_instagram'), NOW() + INTERVAL '7 days');
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 9: INDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_growth_leads_instagram_pending ON growth_leads (location_id, source_channel, last_response_at, funnel_stage)
    WHERE source_channel = 'instagram_dm' AND last_response_at IS NULL AND funnel_stage NOT IN ('won', 'lost', 'no_show');

CREATE INDEX IF NOT EXISTS idx_fuu_queue_outbound_active ON fuu_queue (contact_id, location_id, follow_up_type, status)
    WHERE follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation') AND status IN ('pending', 'in_progress');

-- ============================================================================
-- PARTE 10: VIEW METRICAS
-- ============================================================================

CREATE OR REPLACE VIEW vw_fuu_outbound_instagram_metrics AS
SELECT fq.location_id, fq.follow_up_type, DATE(fq.created_at) as date,
    COUNT(*) as total, COUNT(*) FILTER (WHERE fq.status = 'responded') as responded,
    ROUND(COUNT(*) FILTER (WHERE fq.status = 'responded')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0) * 100, 2) as response_rate_pct
FROM fuu_queue fq WHERE fq.follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
GROUP BY fq.location_id, fq.follow_up_type, DATE(fq.created_at) ORDER BY date DESC;

COMMIT;
