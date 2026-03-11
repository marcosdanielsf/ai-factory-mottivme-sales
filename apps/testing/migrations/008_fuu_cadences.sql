-- ============================================================
-- Migration 008: FUU Cadences com Regras de Canal e Suporte a Áudio/Tag
-- ============================================================
--
-- Funcionalidades:
-- 1. Cadências por canal (WhatsApp, Instagram, SMS, Email)
-- 2. Limite de tempo por canal (Instagram 24h)
-- 3. Tipos de mensagem: ai_text, tag, template
-- 4. Horários permitidos para envio
-- 5. Integração com GHL via tags para áudio
--
-- ============================================================

-- ============================================================
-- TABELA: fuu_cadences
-- Cadências de follow-up por location, tipo e canal
-- ============================================================

CREATE TABLE IF NOT EXISTS fuu_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  location_id VARCHAR(100) NOT NULL,
  follow_up_type VARCHAR(50) NOT NULL DEFAULT 'sdr_inbound',
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',  -- 'whatsapp', 'instagram', 'sms', 'email'
  attempt_number INTEGER NOT NULL,

  -- Intervalo
  interval_minutes INTEGER NOT NULL,                 -- Minutos desde última tentativa

  -- Regras de Canal
  channel_max_hours INTEGER,                         -- Instagram: 24, NULL = sem limite

  -- Tipo de Mensagem
  message_type VARCHAR(20) NOT NULL DEFAULT 'ai_text',  -- 'ai_text', 'tag', 'template'
  tag_to_add VARCHAR(100),                           -- Tag a adicionar se message_type = 'tag'
  template_id VARCHAR(100),                          -- Template ID se message_type = 'template'

  -- Horários Permitidos (opcional)
  allowed_hours_start TIME DEFAULT '08:00',
  allowed_hours_end TIME DEFAULT '21:00',
  allowed_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6], -- 0=dom, 1=seg, ..., 6=sab

  -- Controle
  max_attempts INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(location_id, follow_up_type, channel, attempt_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_fuu_cadences_location ON fuu_cadences(location_id);
CREATE INDEX IF NOT EXISTS idx_fuu_cadences_type_channel ON fuu_cadences(follow_up_type, channel);
CREATE INDEX IF NOT EXISTS idx_fuu_cadences_active ON fuu_cadences(is_active) WHERE is_active = true;

-- ============================================================
-- TABELA: fuu_channel_rules
-- Regras globais por canal
-- ============================================================

CREATE TABLE IF NOT EXISTS fuu_channel_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(20) UNIQUE NOT NULL,

  -- Limites
  max_hours_after_last_interaction INTEGER,  -- Instagram: 24
  min_interval_minutes INTEGER DEFAULT 30,   -- Mínimo entre mensagens
  max_daily_messages INTEGER DEFAULT 10,     -- Máximo por dia por lead

  -- Horários default
  default_hours_start TIME DEFAULT '08:00',
  default_hours_end TIME DEFAULT '21:00',
  default_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6],

  -- Descrição
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DADOS INICIAIS: Regras de Canal
-- ============================================================

INSERT INTO fuu_channel_rules (channel, max_hours_after_last_interaction, min_interval_minutes, max_daily_messages, description)
VALUES
  ('instagram', 24, 30, 5, 'Instagram DM - limite de 24h após última interação do lead'),
  ('whatsapp', NULL, 30, 10, 'WhatsApp - sem limite de tempo, mas cuidado com spam'),
  ('sms', NULL, 60, 3, 'SMS - mais restritivo, horário comercial'),
  ('email', NULL, 120, 5, 'Email - sem limite, pode ir para spam')
ON CONFLICT (channel) DO UPDATE SET
  max_hours_after_last_interaction = EXCLUDED.max_hours_after_last_interaction,
  min_interval_minutes = EXCLUDED.min_interval_minutes,
  description = EXCLUDED.description;

-- ============================================================
-- DADOS INICIAIS: Cadências Instituto Amar (WhatsApp)
-- ============================================================

INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, message_type, tag_to_add)
VALUES
  -- WhatsApp: 5 tentativas, áudio na 3ª
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'whatsapp', 1, 35, 'ai_text', NULL),
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'whatsapp', 2, 120, 'ai_text', NULL),
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'whatsapp', 3, 360, 'tag', 'enviar-audio-fup'),
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'whatsapp', 4, 1440, 'ai_text', NULL),
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'whatsapp', 5, 2880, 'ai_text', NULL)
ON CONFLICT (location_id, follow_up_type, channel, attempt_number) DO UPDATE SET
  interval_minutes = EXCLUDED.interval_minutes,
  message_type = EXCLUDED.message_type,
  tag_to_add = EXCLUDED.tag_to_add;

-- ============================================================
-- DADOS INICIAIS: Cadências Instituto Amar (Instagram)
-- ============================================================

INSERT INTO fuu_cadences (location_id, follow_up_type, channel, attempt_number, interval_minutes, channel_max_hours, message_type, tag_to_add)
VALUES
  -- Instagram: 3 tentativas rápidas (limite 24h), áudio na 2ª
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'instagram', 1, 30, 24, 'ai_text', NULL),
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'instagram', 2, 120, 24, 'tag', 'enviar-audio-fup-ig'),
  ('cd1uyzpJox6XPt4Vct8Y', 'sdr_inbound', 'instagram', 3, 360, 24, 'ai_text', NULL)
ON CONFLICT (location_id, follow_up_type, channel, attempt_number) DO UPDATE SET
  interval_minutes = EXCLUDED.interval_minutes,
  channel_max_hours = EXCLUDED.channel_max_hours,
  message_type = EXCLUDED.message_type,
  tag_to_add = EXCLUDED.tag_to_add;

-- ============================================================
-- FUNÇÃO: get_fuu_cadence
-- Retorna a cadência para uma tentativa específica
-- ============================================================

CREATE OR REPLACE FUNCTION get_fuu_cadence(
  p_location_id VARCHAR,
  p_follow_up_type VARCHAR DEFAULT 'sdr_inbound',
  p_channel VARCHAR DEFAULT 'whatsapp',
  p_attempt INTEGER DEFAULT 1
)
RETURNS TABLE (
  interval_minutes INTEGER,
  channel_max_hours INTEGER,
  message_type VARCHAR,
  tag_to_add VARCHAR,
  template_id VARCHAR,
  max_attempts INTEGER,
  allowed_hours_start TIME,
  allowed_hours_end TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.interval_minutes,
    COALESCE(c.channel_max_hours, r.max_hours_after_last_interaction) as channel_max_hours,
    c.message_type,
    c.tag_to_add,
    c.template_id,
    c.max_attempts,
    COALESCE(c.allowed_hours_start, r.default_hours_start) as allowed_hours_start,
    COALESCE(c.allowed_hours_end, r.default_hours_end) as allowed_hours_end
  FROM fuu_cadences c
  LEFT JOIN fuu_channel_rules r ON r.channel = c.channel
  WHERE c.location_id = p_location_id
    AND c.follow_up_type = p_follow_up_type
    AND c.channel = p_channel
    AND c.attempt_number = p_attempt
    AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNÇÃO: check_channel_limit
-- Verifica se o lead ainda está dentro do limite do canal
-- ============================================================

CREATE OR REPLACE FUNCTION check_channel_limit(
  p_channel VARCHAR,
  p_last_lead_interaction TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_hours INTEGER;
  v_hours_since_interaction NUMERIC;
BEGIN
  -- Buscar limite do canal
  SELECT max_hours_after_last_interaction INTO v_max_hours
  FROM fuu_channel_rules
  WHERE channel = p_channel AND is_active = true;

  -- Se não tem limite, retorna true
  IF v_max_hours IS NULL THEN
    RETURN true;
  END IF;

  -- Calcular horas desde última interação
  v_hours_since_interaction := EXTRACT(EPOCH FROM (NOW() - p_last_lead_interaction)) / 3600;

  -- Retorna true se ainda está dentro do limite
  RETURN v_hours_since_interaction <= v_max_hours;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNÇÃO: is_within_allowed_hours
-- Verifica se está dentro do horário permitido
-- ============================================================

CREATE OR REPLACE FUNCTION is_within_allowed_hours(
  p_location_id VARCHAR,
  p_follow_up_type VARCHAR DEFAULT 'sdr_inbound',
  p_channel VARCHAR DEFAULT 'whatsapp',
  p_attempt INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_start TIME;
  v_end TIME;
  v_allowed_days INTEGER[];
  v_current_time TIME;
  v_current_day INTEGER;
BEGIN
  -- Buscar configuração
  SELECT
    COALESCE(c.allowed_hours_start, '08:00'::TIME),
    COALESCE(c.allowed_hours_end, '21:00'::TIME),
    COALESCE(c.allowed_days, ARRAY[1,2,3,4,5,6])
  INTO v_start, v_end, v_allowed_days
  FROM fuu_cadences c
  WHERE c.location_id = p_location_id
    AND c.follow_up_type = p_follow_up_type
    AND c.channel = p_channel
    AND c.attempt_number = p_attempt
    AND c.is_active = true;

  -- Se não encontrou, usar defaults
  IF v_start IS NULL THEN
    v_start := '08:00'::TIME;
    v_end := '21:00'::TIME;
    v_allowed_days := ARRAY[1,2,3,4,5,6];
  END IF;

  -- Pegar hora e dia atual (timezone São Paulo)
  v_current_time := (NOW() AT TIME ZONE 'America/Sao_Paulo')::TIME;
  v_current_day := EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Sao_Paulo')::INTEGER;

  -- Verificar dia permitido
  IF NOT (v_current_day = ANY(v_allowed_days)) THEN
    RETURN false;
  END IF;

  -- Verificar horário
  RETURN v_current_time >= v_start AND v_current_time <= v_end;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE fuu_cadences IS 'Cadências de follow-up por location, tipo e canal';
COMMENT ON TABLE fuu_channel_rules IS 'Regras globais por canal (limites, horários)';
COMMENT ON COLUMN fuu_cadences.message_type IS 'Tipo: ai_text (IA gera), tag (adiciona tag GHL), template (usa template fixo)';
COMMENT ON COLUMN fuu_cadences.tag_to_add IS 'Tag a adicionar no GHL quando message_type = tag (dispara áudio)';
COMMENT ON COLUMN fuu_cadences.channel_max_hours IS 'Limite de horas após última interação (Instagram: 24h)';
COMMENT ON FUNCTION get_fuu_cadence IS 'Retorna configuração de cadência para uma tentativa';
COMMENT ON FUNCTION check_channel_limit IS 'Verifica se lead ainda está dentro do limite do canal';
COMMENT ON FUNCTION is_within_allowed_hours IS 'Verifica se está dentro do horário permitido para envio';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
