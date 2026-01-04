-- ============================================
-- MULTI-TENANT INBOX CLASSIFIER - MIGRATION 005
-- ============================================
-- Description: Sistema multi-tenant de classificação de leads
--              com versionamento de personas e ICP
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-31
-- Integrates with: Self-Improving System (001-004)
-- ============================================

-- ============================================
-- TABELA 1: TENANTS (Clientes do SaaS)
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informações básicas
  name TEXT NOT NULL,                    -- "Socialfy", "FitPro Academy"
  slug TEXT UNIQUE NOT NULL,             -- "socialfy", "fitpro" (URL-friendly)

  -- Metadata
  business_type TEXT,                    -- "agência de marketing", "consultoria fitness"
  company_size TEXT,                     -- "solo", "pequeno", "médio", "grande"

  -- Status da conta
  status TEXT DEFAULT 'trial',           -- "trial", "active", "paused", "cancelled"
  plan_tier TEXT DEFAULT 'basic',        -- "basic", "pro", "enterprise"

  -- Limites por plano
  max_leads_per_month INTEGER DEFAULT 100,
  max_auto_responses_per_day INTEGER DEFAULT 10,

  -- Configurações
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,

  CONSTRAINT valid_status CHECK (status IN ('trial', 'active', 'paused', 'cancelled')),
  CONSTRAINT valid_plan CHECK (plan_tier IN ('basic', 'pro', 'enterprise'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

COMMENT ON TABLE tenants IS
  '[Multi-Tenant] Clientes do SaaS - cada um com configuração isolada';


-- ============================================
-- TABELA 2: TENANT_PERSONAS (ICP Versionado)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Versionamento (CRÍTICO para histórico)
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT false,      -- Apenas 1 versão ativa por tenant

  -- PERSONA DO NEGÓCIO DO CLIENTE
  business_type TEXT NOT NULL,          -- "agência de marketing digital"
  target_audience TEXT NOT NULL,        -- "donos de negócio que precisam de leads"
  product_service TEXT NOT NULL,        -- "automação de prospecção no Instagram"
  value_proposition TEXT,               -- "Gere 10-30 leads qualificados/mês no automático"

  -- DORES QUE RESOLVE
  main_pain_points TEXT[] DEFAULT '{}', -- ["falta de leads", "processo manual", "baixa conversão"]
  solutions_offered TEXT[] DEFAULT '{}', -- ["automação", "qualificação IA", "follow-up"]

  -- ICP - IDEAL CUSTOMER PROFILE
  ideal_niches TEXT[] DEFAULT '{}',      -- ["marketing", "vendas", "tech", "ecommerce"]
  ideal_job_titles TEXT[] DEFAULT '{}',  -- ["CEO", "Founder", "Diretor Comercial", "CMO"]
  ideal_business_types TEXT[] DEFAULT '{}', -- ["agência", "consultoria", "SaaS"]

  -- Filtros de perfil Instagram
  min_followers INTEGER DEFAULT 1000,
  max_followers INTEGER DEFAULT 100000,
  min_following INTEGER,
  max_following INTEGER,
  min_posts INTEGER DEFAULT 10,

  -- KEYWORDS para classificação
  positive_keywords TEXT[] DEFAULT '{}', -- ["agência", "marketing", "leads", "vendas", "escala"]
  negative_keywords TEXT[] DEFAULT '{}', -- ["personal", "fitness", "coach de vida", "afiliado"]

  -- Indicadores de qualificação
  qualification_signals TEXT[] DEFAULT '{}', -- ["tem site", "tem equipe", "fala de ROI"]
  disqualification_signals TEXT[] DEFAULT '{}', -- ["afiliado iniciante", "revenda"]

  -- TOM DE VOZ e COMUNICAÇÃO
  brand_voice TEXT DEFAULT 'profissional',  -- "profissional", "descontraído", "consultivo"
  message_style TEXT DEFAULT 'direto',      -- "direto", "consultivo", "educativo"
  communication_guidelines TEXT,            -- Orientações gerais de comunicação

  -- Prompt base para IA (pode ser sobrescrito)
  ai_classification_prompt TEXT,
  ai_response_prompt TEXT,

  -- Metadata de performance (será atualizado pelo sistema)
  leads_classified INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  avg_icp_score DECIMAL(5,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(tenant_id, version),
  CONSTRAINT positive_followers CHECK (min_followers >= 0 AND max_followers > min_followers)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_personas_tenant ON tenant_personas(tenant_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_personas_active ON tenant_personas(tenant_id, is_active) WHERE is_active = true;

-- Índice GIN para arrays (busca rápida em keywords)
CREATE INDEX IF NOT EXISTS idx_personas_positive_kw ON tenant_personas USING gin(positive_keywords);
CREATE INDEX IF NOT EXISTS idx_personas_negative_kw ON tenant_personas USING gin(negative_keywords);

COMMENT ON TABLE tenant_personas IS
  '[Multi-Tenant] Personas/ICP versionados por tenant - permite histórico e A/B test';


-- ============================================
-- TABELA 3: TENANT_KNOWN_CONTACTS (Whitelist)
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_known_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamento
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identificação
  platform TEXT NOT NULL DEFAULT 'instagram', -- "instagram", "whatsapp", "telegram"
  username TEXT NOT NULL,                     -- "@fulano" ou número de telefone
  full_name TEXT,

  -- Tipo de contato
  contact_type TEXT NOT NULL,  -- "amigo", "familia", "socio", "cliente", "fornecedor", "parceiro"

  -- Metadados
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Auto-classificação
  auto_classify_as TEXT DEFAULT 'PESSOAL', -- "PESSOAL", "CLIENTE_VIP", etc
  skip_ai_analysis BOOLEAN DEFAULT true,   -- Pula análise de IA para economizar

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint
  UNIQUE(tenant_id, platform, username),
  CONSTRAINT valid_contact_type CHECK (
    contact_type IN ('amigo', 'familia', 'socio', 'cliente', 'fornecedor', 'parceiro', 'outro')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_known_contacts_tenant ON tenant_known_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_known_contacts_username ON tenant_known_contacts(username);
CREATE INDEX IF NOT EXISTS idx_known_contacts_type ON tenant_known_contacts(contact_type);

COMMENT ON TABLE tenant_known_contacts IS
  '[Multi-Tenant] Whitelist de contatos conhecidos - bypass na classificação';


-- ============================================
-- TABELA 4: CLASSIFIED_LEADS (Leads + Classificação)
-- ============================================
CREATE TABLE IF NOT EXISTS classified_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_version INTEGER NOT NULL,  -- Qual versão da persona foi usada
  known_contact_id UUID REFERENCES tenant_known_contacts(id), -- Se for conhecido

  -- Identificação do lead
  platform TEXT NOT NULL DEFAULT 'instagram',
  username TEXT NOT NULL,
  full_name TEXT,

  -- Mensagem recebida
  message_text TEXT,
  message_timestamp TIMESTAMPTZ,
  conversation_context JSONB, -- Histórico de mensagens se houver

  -- DADOS DO PERFIL (scraped)
  profile_data JSONB, -- Bio, followers, posts, etc
  -- Estrutura esperada:
  -- {
  --   "bio": "...",
  --   "followers_count": 5000,
  --   "following_count": 1200,
  --   "posts_count": 150,
  --   "is_verified": false,
  --   "is_business": true,
  --   "category": "Marketing Agency",
  --   "website": "https://...",
  --   "recent_posts": [...]
  -- }

  -- ANÁLISE DA IA
  ai_analysis JSONB, -- Análise completa do Gemini/Claude
  -- Estrutura esperada:
  -- {
  --   "reasoning": "Perfil indica...",
  --   "match_keywords": ["agência", "leads"],
  --   "red_flags": [],
  --   "qualification_signals": ["tem site", "fala de resultados"],
  --   "sentiment_analysis": "positivo",
  --   "next_steps": "Enviar pitch direto"
  -- }

  -- CLASSIFICAÇÃO FINAL
  classification TEXT NOT NULL,  -- "LEAD_HOT", "LEAD_WARM", "LEAD_COLD", "PESSOAL", "SPAM"
  icp_score INTEGER,             -- 0-100 (match com ICP)
  confidence DECIMAL(3,2),       -- 0.00-1.00 (confiança da IA)

  -- Breakdown do score (opcional)
  score_breakdown JSONB,
  -- {
  --   "niche_match": 35,
  --   "follower_range": 20,
  --   "bio_keywords": 25,
  --   "engagement": 15,
  --   "business_signals": 5
  -- }

  -- RESPOSTA AUTOMÁTICA
  auto_responded BOOLEAN DEFAULT false,
  response_sent TEXT,
  response_timestamp TIMESTAMPTZ,
  response_status TEXT, -- "sent", "failed", "pending", "skipped"

  -- TRACKING
  converted_to_opportunity BOOLEAN DEFAULT false,
  opportunity_created_at TIMESTAMPTZ,
  final_outcome TEXT, -- "cliente", "rejeitou", "sem_resposta", "desqualificado"

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, platform, username, message_timestamp),
  CONSTRAINT valid_classification CHECK (
    classification IN ('LEAD_HOT', 'LEAD_WARM', 'LEAD_COLD', 'PESSOAL', 'SPAM', 'DESQUALIFICADO')
  ),
  CONSTRAINT valid_icp_score CHECK (icp_score >= 0 AND icp_score <= 100),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_classified_leads_tenant ON classified_leads(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_leads_classification ON classified_leads(classification, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_leads_score ON classified_leads(icp_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classified_leads_username ON classified_leads(username);
CREATE INDEX IF NOT EXISTS idx_classified_leads_persona_v ON classified_leads(tenant_id, persona_version);

-- Índice para conversões
CREATE INDEX IF NOT EXISTS idx_classified_leads_converted
  ON classified_leads(tenant_id, converted_to_opportunity, created_at DESC);

COMMENT ON TABLE classified_leads IS
  '[Multi-Tenant] Leads classificados com IA - versionado por persona';


-- ============================================
-- TRIGGERS E FUNCTIONS
-- ============================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_multi_tenant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de timestamp
CREATE TRIGGER trigger_tenants_timestamp
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_tenant_timestamp();

CREATE TRIGGER trigger_personas_timestamp
  BEFORE UPDATE ON tenant_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_tenant_timestamp();

CREATE TRIGGER trigger_known_contacts_timestamp
  BEFORE UPDATE ON tenant_known_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_tenant_timestamp();

CREATE TRIGGER trigger_classified_leads_timestamp
  BEFORE UPDATE ON classified_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_tenant_timestamp();


-- Function para garantir apenas 1 persona ativa por tenant
CREATE OR REPLACE FUNCTION ensure_single_active_persona()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Desativa todas as outras personas do mesmo tenant
    UPDATE tenant_personas
    SET is_active = false, deactivated_at = NOW()
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id
      AND is_active = true;

    NEW.activated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_persona
  BEFORE INSERT OR UPDATE ON tenant_personas
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_persona();


-- ============================================
-- VIEWS PARA DASHBOARD
-- ============================================

-- View: Performance por Tenant
CREATE OR REPLACE VIEW vw_tenant_performance AS
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug,
  t.status,
  t.plan_tier,

  -- Persona ativa
  p.id as active_persona_id,
  p.version as persona_version,
  p.business_type,

  -- Métricas de leads (últimos 30 dias)
  (SELECT COUNT(*) FROM classified_leads cl
   WHERE cl.tenant_id = t.id
   AND cl.created_at >= NOW() - INTERVAL '30 days') as leads_30d,

  (SELECT COUNT(*) FROM classified_leads cl
   WHERE cl.tenant_id = t.id
   AND cl.classification = 'LEAD_HOT'
   AND cl.created_at >= NOW() - INTERVAL '30 days') as hot_leads_30d,

  (SELECT AVG(icp_score) FROM classified_leads cl
   WHERE cl.tenant_id = t.id
   AND cl.created_at >= NOW() - INTERVAL '30 days') as avg_icp_score_30d,

  -- Conversões
  (SELECT COUNT(*) FROM classified_leads cl
   WHERE cl.tenant_id = t.id
   AND cl.converted_to_opportunity = true
   AND cl.created_at >= NOW() - INTERVAL '30 days') as conversions_30d,

  -- Auto responses
  (SELECT COUNT(*) FROM classified_leads cl
   WHERE cl.tenant_id = t.id
   AND cl.auto_responded = true
   AND cl.created_at >= NOW() - INTERVAL '30 days') as auto_responses_30d

FROM tenants t
LEFT JOIN tenant_personas p ON p.tenant_id = t.id AND p.is_active = true;

COMMENT ON VIEW vw_tenant_performance IS
  '[Multi-Tenant] Performance de cada tenant nos últimos 30 dias';


-- View: Classificação de Leads por Tenant
CREATE OR REPLACE VIEW vw_lead_classification_stats AS
SELECT
  tenant_id,
  classification,
  COUNT(*) as total_leads,
  AVG(icp_score) as avg_score,
  AVG(confidence) as avg_confidence,
  SUM(CASE WHEN auto_responded THEN 1 ELSE 0 END) as auto_responded_count,
  SUM(CASE WHEN converted_to_opportunity THEN 1 ELSE 0 END) as converted_count
FROM classified_leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id, classification;

COMMENT ON VIEW vw_lead_classification_stats IS
  '[Multi-Tenant] Estatísticas de classificação por tenant';


-- ============================================
-- RPC FUNCTIONS PARA N8N/API
-- ============================================

-- Function: Buscar persona ativa de um tenant
CREATE OR REPLACE FUNCTION get_active_persona(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_persona JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'tenant_id', p.tenant_id,
    'version', p.version,
    'business_type', p.business_type,
    'target_audience', p.target_audience,
    'product_service', p.product_service,
    'value_proposition', p.value_proposition,
    'main_pain_points', p.main_pain_points,
    'ideal_niches', p.ideal_niches,
    'ideal_job_titles', p.ideal_job_titles,
    'min_followers', p.min_followers,
    'max_followers', p.max_followers,
    'positive_keywords', p.positive_keywords,
    'negative_keywords', p.negative_keywords,
    'brand_voice', p.brand_voice,
    'message_style', p.message_style
  ) INTO v_persona
  FROM tenant_personas p
  WHERE p.tenant_id = p_tenant_id
    AND p.is_active = true
  LIMIT 1;

  RETURN v_persona;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Verificar se username está na whitelist
CREATE OR REPLACE FUNCTION is_known_contact(
  p_tenant_id UUID,
  p_platform TEXT,
  p_username TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_contact JSONB;
BEGIN
  SELECT jsonb_build_object(
    'is_known', true,
    'id', kc.id,
    'contact_type', kc.contact_type,
    'auto_classify_as', kc.auto_classify_as,
    'skip_ai_analysis', kc.skip_ai_analysis,
    'notes', kc.notes
  ) INTO v_contact
  FROM tenant_known_contacts kc
  WHERE kc.tenant_id = p_tenant_id
    AND kc.platform = p_platform
    AND kc.username = p_username
  LIMIT 1;

  IF v_contact IS NULL THEN
    RETURN jsonb_build_object('is_known', false);
  END IF;

  RETURN v_contact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: Salvar lead classificado
CREATE OR REPLACE FUNCTION save_classified_lead(
  p_tenant_id UUID,
  p_persona_version INTEGER,
  p_platform TEXT,
  p_username TEXT,
  p_message TEXT,
  p_profile_data JSONB,
  p_ai_analysis JSONB,
  p_classification TEXT,
  p_icp_score INTEGER,
  p_confidence DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  INSERT INTO classified_leads (
    tenant_id,
    persona_version,
    platform,
    username,
    message_text,
    message_timestamp,
    profile_data,
    ai_analysis,
    classification,
    icp_score,
    confidence
  ) VALUES (
    p_tenant_id,
    p_persona_version,
    p_platform,
    p_username,
    p_message,
    NOW(),
    p_profile_data,
    p_ai_analysis,
    p_classification,
    p_icp_score,
    p_confidence
  )
  RETURNING id INTO v_lead_id;

  -- Atualizar contador de leads na persona
  UPDATE tenant_personas
  SET leads_classified = leads_classified + 1
  WHERE tenant_id = p_tenant_id
    AND version = p_persona_version;

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- DADOS INICIAIS (EXEMPLO)
-- ============================================

-- Inserir tenant de exemplo: Socialfy
INSERT INTO tenants (name, slug, business_type, status, plan_tier)
VALUES (
  'Socialfy',
  'socialfy',
  'Agência de Marketing Digital',
  'active',
  'pro'
) ON CONFLICT (slug) DO NOTHING;

-- Inserir persona de exemplo para Socialfy
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'socialfy';

  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO tenant_personas (
      tenant_id,
      version,
      is_active,
      business_type,
      target_audience,
      product_service,
      value_proposition,
      main_pain_points,
      ideal_niches,
      ideal_job_titles,
      min_followers,
      max_followers,
      positive_keywords,
      negative_keywords,
      brand_voice,
      message_style
    ) VALUES (
      v_tenant_id,
      1,
      true,
      'Agência de Automação de Prospecção',
      'Donos de agências de marketing e vendedores B2B',
      'Automação de prospecção no Instagram com IA',
      'Gere 10-30 leads qualificados por mês no automático',
      ARRAY['falta de leads qualificados', 'processo manual de prospecção', 'baixa taxa de conversão'],
      ARRAY['marketing digital', 'vendas B2B', 'agências', 'consultorias', 'SaaS'],
      ARRAY['CEO', 'Founder', 'Diretor Comercial', 'Gerente de Marketing'],
      1000,
      50000,
      ARRAY['agência', 'marketing', 'leads', 'vendas', 'prospecção', 'automação', 'clientes', 'escala'],
      ARRAY['personal trainer', 'fitness', 'coach de vida', 'afiliado', 'revenda'],
      'profissional mas acessível',
      'direto ao ponto, consultivo'
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MULTI-TENANT INBOX CLASSIFIER - Migration Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - tenants (clientes do SaaS)';
  RAISE NOTICE '  - tenant_personas (ICP versionado)';
  RAISE NOTICE '  - tenant_known_contacts (whitelist)';
  RAISE NOTICE '  - classified_leads (leads + classificação)';
  RAISE NOTICE '';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - vw_tenant_performance';
  RAISE NOTICE '  - vw_lead_classification_stats';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - get_active_persona(tenant_id)';
  RAISE NOTICE '  - is_known_contact(tenant_id, platform, username)';
  RAISE NOTICE '  - save_classified_lead(...)';
  RAISE NOTICE '';
  RAISE NOTICE 'Inserted example tenant: Socialfy';
  RAISE NOTICE '============================================';
END $$;
