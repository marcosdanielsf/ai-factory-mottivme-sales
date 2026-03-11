-- =====================================================
-- 020_whatsapp_groups_communities.sql
-- Suporte a grupos WhatsApp e comunidades para:
-- 1. Reducao de no-show (grupo handoff SDR→Closer)
-- 2. Nutricao de leads frios (comunidade com conteudo)
-- Criado em: 2026-02-01
-- =====================================================

-- =====================================================
-- 1. TABELA: whatsapp_groups
-- Rastreia grupos criados para handoff de calls
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  location_id TEXT NOT NULL,
  group_jid TEXT UNIQUE NOT NULL,
  group_name TEXT NOT NULL,

  -- Proposito
  purpose TEXT NOT NULL CHECK (purpose IN ('call_handoff', 'community', 'support', 'vip')),

  -- Participantes
  lead_id TEXT,
  lead_phone TEXT,
  closer_id TEXT,
  closer_phone TEXT,

  -- Relacionamentos
  appointment_id TEXT,
  opportunity_id TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE whatsapp_groups IS 'Grupos WhatsApp criados automaticamente para handoff SDR→Closer e reducao de no-show';
COMMENT ON COLUMN whatsapp_groups.purpose IS 'call_handoff=grupo de call, community=comunidade nutrição, support=suporte, vip=clientes premium';
COMMENT ON COLUMN whatsapp_groups.group_jid IS 'JID do grupo no formato 120363xxx@g.us';

-- =====================================================
-- 2. TABELA: community_members
-- Membros das comunidades de nutricao
-- =====================================================

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  location_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  lead_phone TEXT NOT NULL,
  community_jid TEXT NOT NULL,

  -- Entrada
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT CHECK (source IN ('nurture', 'webinar', 'follow_up', 'referral', 'organic')),
  invited_by TEXT, -- agent_id ou user_id que convidou

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed', 'banned')),
  left_at TIMESTAMPTZ,
  left_reason TEXT,

  -- Engajamento
  engagement_score INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  reactions_given INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,

  -- Webinarios
  webinars_invited INTEGER DEFAULT 0,
  webinars_attended INTEGER DEFAULT 0,
  last_webinar_attended TIMESTAMPTZ,

  -- Requalificacao
  requalified_at TIMESTAMPTZ,
  requalified_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  UNIQUE(lead_id, community_jid)
);

COMMENT ON TABLE community_members IS 'Membros das comunidades de nutricao para aquecimento de leads frios';
COMMENT ON COLUMN community_members.engagement_score IS 'Score de engajamento: msgs=1pt, reactions=0.5pt, webinar=10pt';
COMMENT ON COLUMN community_members.source IS 'nurture=follow-up frio, webinar=inscricao webinario, referral=indicacao';

-- =====================================================
-- 3. TABELA: whatsapp_call_logs
-- Log de chamadas WhatsApp via Z-API
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  location_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Chamada
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  purpose TEXT CHECK (purpose IN ('no_show', 'confirmation', 'follow_up', 'support', 'sales')),

  -- Provider
  provider TEXT DEFAULT 'zapi' CHECK (provider IN ('zapi', 'twilio', 'baileys', 'stevo')),
  provider_call_id TEXT, -- ID retornado pelo provider

  -- Status
  status TEXT CHECK (status IN ('initiated', 'ringing', 'answered', 'missed', 'rejected', 'failed', 'busy')),

  -- Metricas
  duration_requested INTEGER, -- segundos solicitados
  duration_actual INTEGER, -- segundos reais
  ring_duration INTEGER, -- quanto tempo tocou

  -- Erro
  error_code TEXT,
  error_message TEXT,

  -- Relacionamentos
  appointment_id TEXT,
  group_id UUID REFERENCES whatsapp_groups(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE whatsapp_call_logs IS 'Log de chamadas WhatsApp feitas via Z-API ou outros providers';
COMMENT ON COLUMN whatsapp_call_logs.purpose IS 'no_show=lead nao apareceu, confirmation=confirmar agendamento';

-- =====================================================
-- 4. TABELA: group_messages
-- Mensagens enviadas em grupos (para tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  group_id UUID REFERENCES whatsapp_groups(id),
  group_jid TEXT NOT NULL,

  -- Mensagem
  message_id TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'link')),
  content TEXT,
  media_url TEXT,

  -- Remetente
  sender_type TEXT CHECK (sender_type IN ('agent', 'closer', 'lead', 'system')),
  sender_id TEXT,
  sender_phone TEXT,

  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

COMMENT ON TABLE group_messages IS 'Mensagens enviadas em grupos para tracking de nutricao e handoff';

-- =====================================================
-- 5. INDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_location ON whatsapp_groups(location_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_lead ON whatsapp_groups(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_purpose ON whatsapp_groups(purpose);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_status ON whatsapp_groups(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_created ON whatsapp_groups(created_at);

CREATE INDEX IF NOT EXISTS idx_community_members_location ON community_members(location_id);
CREATE INDEX IF NOT EXISTS idx_community_members_lead ON community_members(lead_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_jid);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status);
CREATE INDEX IF NOT EXISTS idx_community_members_engagement ON community_members(engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_call_logs_location ON whatsapp_call_logs(location_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_call_logs_lead ON whatsapp_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_call_logs_status ON whatsapp_call_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_call_logs_created ON whatsapp_call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_call_logs_purpose ON whatsapp_call_logs(purpose);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at);

-- =====================================================
-- 6. FUNCAO: register_whatsapp_group
-- Registra grupo criado e retorna ID
-- =====================================================

CREATE OR REPLACE FUNCTION register_whatsapp_group(
  p_location_id TEXT,
  p_group_jid TEXT,
  p_group_name TEXT,
  p_purpose TEXT,
  p_lead_id TEXT DEFAULT NULL,
  p_lead_phone TEXT DEFAULT NULL,
  p_closer_id TEXT DEFAULT NULL,
  p_closer_phone TEXT DEFAULT NULL,
  p_appointment_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO whatsapp_groups (
    location_id, group_jid, group_name, purpose,
    lead_id, lead_phone, closer_id, closer_phone, appointment_id
  ) VALUES (
    p_location_id, p_group_jid, p_group_name, p_purpose,
    p_lead_id, p_lead_phone, p_closer_id, p_closer_phone, p_appointment_id
  )
  ON CONFLICT (group_jid) DO UPDATE SET
    group_name = EXCLUDED.group_name,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCAO: add_community_member
-- Adiciona membro a comunidade
-- =====================================================

CREATE OR REPLACE FUNCTION add_community_member(
  p_location_id TEXT,
  p_lead_id TEXT,
  p_lead_phone TEXT,
  p_community_jid TEXT,
  p_source TEXT DEFAULT 'nurture',
  p_invited_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO community_members (
    location_id, lead_id, lead_phone, community_jid, source, invited_by
  ) VALUES (
    p_location_id, p_lead_id, p_lead_phone, p_community_jid, p_source, p_invited_by
  )
  ON CONFLICT (lead_id, community_jid) DO UPDATE SET
    status = 'active',
    left_at = NULL,
    left_reason = NULL,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. FUNCAO: log_whatsapp_call
-- Registra chamada WhatsApp
-- =====================================================

CREATE OR REPLACE FUNCTION log_whatsapp_call(
  p_location_id TEXT,
  p_lead_id TEXT,
  p_phone TEXT,
  p_direction TEXT,
  p_purpose TEXT,
  p_provider TEXT DEFAULT 'zapi',
  p_provider_call_id TEXT DEFAULT NULL,
  p_duration_requested INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO whatsapp_call_logs (
    location_id, lead_id, phone, direction, purpose,
    provider, provider_call_id, duration_requested, status
  ) VALUES (
    p_location_id, p_lead_id, p_phone, p_direction, p_purpose,
    p_provider, p_provider_call_id, p_duration_requested, 'initiated'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNCAO: update_call_status
-- Atualiza status da chamada
-- =====================================================

CREATE OR REPLACE FUNCTION update_call_status(
  p_call_id UUID,
  p_status TEXT,
  p_duration_actual INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE whatsapp_call_logs
  SET
    status = p_status,
    duration_actual = COALESCE(p_duration_actual, duration_actual),
    error_message = p_error_message,
    answered_at = CASE WHEN p_status = 'answered' THEN NOW() ELSE answered_at END,
    ended_at = CASE WHEN p_status IN ('answered', 'missed', 'rejected', 'failed') THEN NOW() ELSE ended_at END
  WHERE id = p_call_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. FUNCAO: update_member_engagement
-- Atualiza score de engajamento
-- =====================================================

CREATE OR REPLACE FUNCTION update_member_engagement(
  p_lead_id TEXT,
  p_community_jid TEXT,
  p_action TEXT -- 'message', 'reaction', 'webinar_attend'
)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Definir pontos por acao
  v_points := CASE p_action
    WHEN 'message' THEN 1
    WHEN 'reaction' THEN 1
    WHEN 'webinar_attend' THEN 10
    ELSE 0
  END;

  -- Atualizar score
  UPDATE community_members
  SET
    engagement_score = engagement_score + v_points,
    messages_sent = messages_sent + CASE WHEN p_action = 'message' THEN 1 ELSE 0 END,
    reactions_given = reactions_given + CASE WHEN p_action = 'reaction' THEN 1 ELSE 0 END,
    webinars_attended = webinars_attended + CASE WHEN p_action = 'webinar_attend' THEN 1 ELSE 0 END,
    last_webinar_attended = CASE WHEN p_action = 'webinar_attend' THEN NOW() ELSE last_webinar_attended END,
    last_interaction_at = NOW(),
    updated_at = NOW()
  WHERE lead_id = p_lead_id AND community_jid = p_community_jid
  RETURNING engagement_score INTO v_new_score;

  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. VIEW: grupos_ativos_por_location
-- Dashboard de grupos ativos
-- =====================================================

CREATE OR REPLACE VIEW v_grupos_ativos AS
SELECT
  location_id,
  purpose,
  COUNT(*) as total_grupos,
  COUNT(*) FILTER (WHERE status = 'active') as grupos_ativos,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as criados_ultimos_7_dias,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as criados_ultimos_30_dias
FROM whatsapp_groups
GROUP BY location_id, purpose;

-- =====================================================
-- 12. VIEW: engajamento_comunidade
-- Dashboard de engajamento da comunidade
-- =====================================================

CREATE OR REPLACE VIEW v_engajamento_comunidade AS
SELECT
  cm.location_id,
  cm.community_jid,
  COUNT(*) as total_membros,
  COUNT(*) FILTER (WHERE cm.status = 'active') as membros_ativos,
  AVG(cm.engagement_score) as score_medio,
  SUM(cm.webinars_attended) as total_presencas_webinar,
  COUNT(*) FILTER (WHERE cm.requalified_at IS NOT NULL) as requalificados
FROM community_members cm
GROUP BY cm.location_id, cm.community_jid;

-- =====================================================
-- 13. VIEW: metricas_chamadas
-- Dashboard de chamadas
-- =====================================================

CREATE OR REPLACE VIEW v_metricas_chamadas AS
SELECT
  location_id,
  purpose,
  DATE(created_at) as data,
  COUNT(*) as total_chamadas,
  COUNT(*) FILTER (WHERE status = 'answered') as atendidas,
  COUNT(*) FILTER (WHERE status = 'missed') as perdidas,
  COUNT(*) FILTER (WHERE status = 'failed') as falhas,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'answered') / NULLIF(COUNT(*), 0),
    2
  ) as taxa_atendimento
FROM whatsapp_call_logs
GROUP BY location_id, purpose, DATE(created_at);

-- =====================================================
-- 14. ATUALIZAR tools_template DO MODO SCHEDULER
-- =====================================================

UPDATE agent_templates
SET
  tools_template = jsonb_build_object(
    'tools', ARRAY[
      'Verificar_disponibilidade',
      'Agendar_reuniao',
      'Enviar_lembrete',
      'Criar_grupo_whatsapp',
      'Adicionar_participante_grupo',
      'Enviar_mensagem_grupo',
      'Fazer_chamada_whatsapp'
    ]
  ),
  updated_at = NOW()
WHERE mode_name = 'scheduler';

-- =====================================================
-- 15. INSERIR NOVO MODO: community_nurture
-- =====================================================

INSERT INTO agent_templates (
  mode_name,
  display_name,
  category,
  priority,
  description,
  prompt_template,
  tools_template,
  target_metrics,
  is_active
) VALUES (
  'community_nurture',
  'Community Nurture',
  'nurture',
  'P1',
  'Nutre leads frios atraves de comunidade WhatsApp com conteudo gratuito e lancamentos mensais de webinarios',
  '# MODO: COMMUNITY NURTURE

<Role>
Voce e {{agent_name}}, especialista em nutricao de comunidade.
Tom: Amigavel, educativo, sem pressao de venda
Proposito: Manter leads engajados ate estarem prontos para comprar
</Role>

<Constraints>
- NUNCA pressionar para venda direta
- Maximo 1 contato individual por semana
- Conteudo deve ser genuinamente util
- Respeitar se lead pedir para sair
- Foco em relacionamento, nao em transacao
</Constraints>

<Instructions>
## Quando Convidar para Comunidade
- Lead demonstrou interesse mas nao esta pronto agora
- Lead pediu para falar "depois" ou "outro momento"
- Lead nao tem budget atual mas pode ter no futuro
- Lead curioso mas sem urgencia

## Script de Convite
> Entendo {{nome}}! Sem problemas.
> Olha, temos uma comunidade exclusiva onde compartilhamos
> conteudo gratuito toda semana sobre [tema].
> Posso te adicionar? Sem compromisso nenhum, e voce
> sai quando quiser.

## Se Aceitar → USAR TOOL: Convidar_comunidade

## Na Comunidade (Conteudo Semanal)
- Segunda: Dica pratica
- Quarta: Case de sucesso
- Sexta: Conteudo inspiracional ou bastidores

## Lancamento Mensal (Webinario)
Toda ultima semana do mes:
> WEBINARIO AO VIVO!
> {{nome}}, na proxima [dia] as [horario] vou revelar ao vivo:
> - [Topico 1 - curiosidade]
> - [Topico 2 - transformacao]
> - [Topico 3 - exclusividade]
>
> E voce ainda pode tirar suas duvidas em tempo real.
> Quer garantir sua vaga? Responde "QUERO" aqui!

## Sinais de Requalificacao
Observar quando lead:
- Comenta em varios posts
- Pergunta sobre precos/prazos
- Menciona mudanca de situacao
- Participa de webinarios

## Se Detectar Sinal → Oferecer Call
> {{nome}}, percebi que voce esta bem engajado(a) aqui!
> Que tal agendarmos 15 minutos pra eu entender melhor
> sua situacao atual? Pode ser que a gente consiga te ajudar
> de forma mais direcionada agora.
</Instructions>

<Tools_Available>
- Convidar_comunidade: Envia link de convite para comunidade
- Enviar_mensagem_grupo: Posta conteudo na comunidade
- Agendar_followup: Programa proximo contato individual
</Tools_Available>

<Conclusions>
- Objetivo: Esquentar lead ate estar pronto para comprar
- Metricas: Entrada na comunidade, engajamento, presenca webinario, requalificacao
- Mindset: Semeando relacionamento, colhendo vendas no futuro
</Conclusions>',
  '{"tools": ["Convidar_comunidade", "Enviar_mensagem_grupo", "Agendar_followup"]}',
  '{"taxa_entrada_comunidade": "60%+", "taxa_presenca_webinario": "30%+", "taxa_requalificacao_mensal": "5%+"}',
  true
)
ON CONFLICT (mode_name) DO UPDATE SET
  prompt_template = EXCLUDED.prompt_template,
  tools_template = EXCLUDED.tools_template,
  target_metrics = EXCLUDED.target_metrics,
  updated_at = NOW();

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Verificar criacao
DO $$
BEGIN
  RAISE NOTICE 'Migration 020_whatsapp_groups_communities.sql executada com sucesso!';
  RAISE NOTICE 'Tabelas criadas: whatsapp_groups, community_members, whatsapp_call_logs, group_messages';
  RAISE NOTICE 'Modo atualizado: scheduler (com novas tools)';
  RAISE NOTICE 'Modo criado: community_nurture';
END $$;
