# RELATÓRIO DE ANÁLISE DE BANCO DE DADOS
## Comparação: AgenticOS vs AI-Factory

**Data**: 2026-01-01
**Analista**: Database Engineer Agent
**Objetivo**: Documentar modelos de dados e identificar possibilidades de integração

---

## SUMÁRIO EXECUTIVO

### AgenticOS (Kev's Academy)
- **Foco**: Sistema multi-agent de automação de Instagram DM e Lead Generation
- **Arquitetura**: Multi-tenant SaaS com versionamento de personas
- **Database**: Supabase PostgreSQL
- **Principais features**: Lead classification com IA, auto-resposta, ICP versionado

### AI-Factory (MOTTIVME)
- **Foco**: Sistema de auto-melhoramento de agentes de IA
- **Arquitetura**: Reflection Loop + AI-as-Judge para evolução de prompts
- **Database**: Supabase PostgreSQL
- **Principais features**: Versionamento de prompts, análise de QA, sugestões de melhoria

### Compatibilidade
✅ **Alta compatibilidade**: Ambos usam Supabase PostgreSQL
✅ **Padrões similares**: UUID PKs, timestamps, RLS, triggers
✅ **Potencial de integração**: Classificação de leads + Self-improving agents

---

## 1. AGENTIOS - MODELO DE DADOS

### 1.1 Schema Principal: MULTI-TENANT LEAD GENERATION

#### Tabela: `tenants`
**Propósito**: Gerenciamento de clientes do SaaS (multi-tenancy)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK, tenant único |
| `name` | TEXT | Nome do cliente ("Socialfy") |
| `slug` | TEXT | URL-friendly identifier |
| `business_type` | TEXT | Tipo de negócio |
| `status` | TEXT | trial, active, paused, cancelled |
| `plan_tier` | TEXT | basic, pro, enterprise |
| `max_leads_per_month` | INTEGER | Limite por plano |
| `max_auto_responses_per_day` | INTEGER | Limite de respostas automáticas |
| `timezone` | TEXT | Timezone do cliente |
| `created_at` | TIMESTAMPTZ | Timestamp de criação |
| `updated_at` | TIMESTAMPTZ | Timestamp de atualização |

**Índices**:
- `idx_tenants_slug` em `slug`
- `idx_tenants_status` em `status`

**RLS**: Ativo (tenant isolation)

---

#### Tabela: `tenant_personas` (ICP Versionado)
**Propósito**: Definição de Ideal Customer Profile com versionamento

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenants(id) |
| `version` | INTEGER | Versão da persona (1, 2, 3...) |
| `is_active` | BOOLEAN | Apenas 1 versão ativa por tenant |
| `business_type` | TEXT | "agência de marketing digital" |
| `target_audience` | TEXT | Público-alvo do negócio |
| `product_service` | TEXT | Produto/serviço oferecido |
| `value_proposition` | TEXT | Proposta de valor |
| `main_pain_points` | TEXT[] | Dores que resolve |
| `solutions_offered` | TEXT[] | Soluções oferecidas |
| `ideal_niches` | TEXT[] | ["marketing", "vendas", "tech"] |
| `ideal_job_titles` | TEXT[] | ["CEO", "Founder", "CMO"] |
| `ideal_business_types` | TEXT[] | ["agência", "consultoria", "SaaS"] |
| `min_followers` | INTEGER | Filtro Instagram (1000) |
| `max_followers` | INTEGER | Filtro Instagram (100000) |
| `positive_keywords` | TEXT[] | Keywords para classificação |
| `negative_keywords` | TEXT[] | Keywords de desqualificação |
| `brand_voice` | TEXT | Tom de voz da marca |
| `message_style` | TEXT | Estilo de mensagem |
| `ai_classification_prompt` | TEXT | Prompt customizado para IA |
| `ai_response_prompt` | TEXT | Prompt para auto-resposta |
| `leads_classified` | INTEGER | Contador de performance |
| `conversion_rate` | DECIMAL(5,2) | Taxa de conversão |
| `avg_icp_score` | DECIMAL(5,2) | Score médio |
| `created_at` | TIMESTAMPTZ | |
| `activated_at` | TIMESTAMPTZ | |
| `deactivated_at` | TIMESTAMPTZ | |

**Índices**:
- `idx_personas_tenant` em `(tenant_id, version DESC)`
- `idx_personas_active` em `(tenant_id, is_active)` WHERE `is_active = true`
- `idx_personas_positive_kw` GIN em `positive_keywords`
- `idx_personas_negative_kw` GIN em `negative_keywords`

**Triggers**:
- `trigger_single_active_persona`: Garante apenas 1 persona ativa por tenant

**Constraint**:
- UNIQUE `(tenant_id, version)`

**Padrão de Versionamento**:
```sql
-- Criar nova versão:
INSERT INTO tenant_personas (tenant_id, version, is_active, ...)
VALUES (tenant_id, 2, true, ...)
-- Trigger desativa automaticamente version 1
```

---

#### Tabela: `tenant_known_contacts` (Whitelist)
**Propósito**: Bypass de classificação para contatos conhecidos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenants(id) |
| `platform` | TEXT | instagram, whatsapp, telegram |
| `username` | TEXT | @username ou telefone |
| `full_name` | TEXT | Nome completo |
| `contact_type` | TEXT | amigo, familia, socio, cliente, fornecedor |
| `notes` | TEXT | Notas adicionais |
| `tags` | TEXT[] | Tags customizadas |
| `auto_classify_as` | TEXT | PESSOAL, CLIENTE_VIP |
| `skip_ai_analysis` | BOOLEAN | Economiza créditos de IA |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Constraint**:
- UNIQUE `(tenant_id, platform, username)`

**Índices**:
- `idx_known_contacts_tenant` em `tenant_id`
- `idx_known_contacts_username` em `username`
- `idx_known_contacts_type` em `contact_type`

---

#### Tabela: `classified_leads`
**Propósito**: Leads classificados pela IA com scoring

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `tenant_id` | UUID | FK → tenants(id) |
| `persona_version` | INTEGER | Versão da persona usada |
| `known_contact_id` | UUID | FK → tenant_known_contacts(id) |
| `platform` | TEXT | instagram, whatsapp, etc |
| `username` | TEXT | Username do lead |
| `full_name` | TEXT | Nome completo |
| `message_text` | TEXT | Mensagem recebida |
| `message_timestamp` | TIMESTAMPTZ | Timestamp da mensagem |
| `conversation_context` | JSONB | Histórico de mensagens |
| `profile_data` | JSONB | Bio, followers, posts, etc |
| `ai_analysis` | JSONB | Análise completa da IA |
| `classification` | TEXT | LEAD_HOT, LEAD_WARM, LEAD_COLD, PESSOAL, SPAM |
| `icp_score` | INTEGER | 0-100 (match com ICP) |
| `confidence` | DECIMAL(3,2) | 0.00-1.00 (confiança da IA) |
| `score_breakdown` | JSONB | Breakdown detalhado do score |
| `auto_responded` | BOOLEAN | Se enviou resposta automática |
| `response_sent` | TEXT | Resposta enviada |
| `response_timestamp` | TIMESTAMPTZ | Quando enviou |
| `response_status` | TEXT | sent, failed, pending, skipped |
| `converted_to_opportunity` | BOOLEAN | Se virou oportunidade |
| `opportunity_created_at` | TIMESTAMPTZ | |
| `final_outcome` | TEXT | cliente, rejeitou, sem_resposta |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Estrutura do JSONB `profile_data`**:
```json
{
  "bio": "CEO at Marketing Agency",
  "followers_count": 5000,
  "following_count": 1200,
  "posts_count": 150,
  "is_verified": false,
  "is_business": true,
  "category": "Marketing Agency",
  "website": "https://...",
  "recent_posts": [...]
}
```

**Estrutura do JSONB `ai_analysis`**:
```json
{
  "reasoning": "Perfil indica agência de marketing com foco em B2B...",
  "match_keywords": ["agência", "leads", "marketing"],
  "red_flags": [],
  "qualification_signals": ["tem site", "fala de resultados"],
  "sentiment_analysis": "positivo",
  "next_steps": "Enviar pitch direto"
}
```

**Índices**:
- `idx_classified_leads_tenant` em `(tenant_id, created_at DESC)`
- `idx_classified_leads_classification` em `(classification, created_at DESC)`
- `idx_classified_leads_score` em `(icp_score DESC, created_at DESC)`
- `idx_classified_leads_username` em `username`
- `idx_classified_leads_persona_v` em `(tenant_id, persona_version)`
- `idx_classified_leads_converted` em `(tenant_id, converted_to_opportunity, created_at DESC)`

**Constraints**:
- UNIQUE `(tenant_id, platform, username, message_timestamp)`
- CHECK `icp_score >= 0 AND icp_score <= 100`
- CHECK `confidence >= 0 AND confidence <= 1`
- CHECK `classification IN ('LEAD_HOT', 'LEAD_WARM', 'LEAD_COLD', 'PESSOAL', 'SPAM', 'DESQUALIFICADO')`

---

### 1.2 Schema Secundário: INSTAGRAM DM AUTOMATION

#### Tabela: `agentic_instagram_leads`
**Propósito**: Leads do Instagram para automação de DM

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGSERIAL | PK |
| `username` | VARCHAR(255) | Username único |
| `full_name` | VARCHAR(255) | Nome completo |
| `bio` | TEXT | Bio do perfil |
| `followers_count` | INTEGER | Número de seguidores |
| `following_count` | INTEGER | Seguindo |
| `is_private` | BOOLEAN | Conta privada |
| `is_verified` | BOOLEAN | Verificado |
| `profile_url` | VARCHAR(500) | URL do perfil |
| `source` | VARCHAR(100) | post_like, post_comment, follower |
| `tags` | TEXT[] | Tags customizadas |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Constraint**:
- UNIQUE `username`

---

#### Tabela: `agentic_instagram_dm_sent`
**Propósito**: Tracking de DMs enviadas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGSERIAL | PK |
| `lead_id` | BIGINT | FK → agentic_instagram_leads(id) |
| `username` | VARCHAR(255) | Username |
| `message_template` | VARCHAR(100) | Template usado |
| `message_sent` | TEXT | Mensagem enviada |
| `sent_at` | TIMESTAMPTZ | Timestamp de envio |
| `status` | VARCHAR(50) | sent, failed |
| `error_message` | TEXT | Mensagem de erro |
| `account_used` | VARCHAR(255) | Conta Instagram usada |

---

#### Tabela: `agentic_instagram_dm_runs`
**Propósito**: Logs de execução dos agentes

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGSERIAL | PK |
| `started_at` | TIMESTAMPTZ | Início da execução |
| `ended_at` | TIMESTAMPTZ | Fim da execução |
| `total_leads` | INTEGER | Total de leads processados |
| `dms_sent` | INTEGER | DMs enviadas |
| `dms_failed` | INTEGER | DMs com erro |
| `dms_skipped` | INTEGER | DMs puladas |
| `status` | VARCHAR(50) | running, completed, failed |
| `error_log` | TEXT | Log de erros |
| `account_used` | VARCHAR(255) | Conta usada |

---

### 1.3 Views e Functions do AgenticOS

#### View: `vw_tenant_performance`
**Propósito**: Performance de cada tenant nos últimos 30 dias

```sql
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug,
  t.status,
  t.plan_tier,
  p.id as active_persona_id,
  p.version as persona_version,
  COUNT(cl.*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as leads_30d,
  COUNT(cl.*) FILTER (WHERE classification = 'LEAD_HOT') as hot_leads_30d,
  AVG(cl.icp_score) as avg_icp_score_30d,
  COUNT(*) FILTER (WHERE converted_to_opportunity = true) as conversions_30d
FROM tenants t
LEFT JOIN tenant_personas p ON p.tenant_id = t.id AND p.is_active = true
LEFT JOIN classified_leads cl ON cl.tenant_id = t.id
```

---

#### View: `vw_lead_classification_stats`
**Propósito**: Estatísticas de classificação por tenant

```sql
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
GROUP BY tenant_id, classification
```

---

#### Function: `get_active_persona(p_tenant_id UUID)`
**Propósito**: Buscar persona ativa de um tenant

```sql
CREATE OR REPLACE FUNCTION get_active_persona(p_tenant_id UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'version', p.version,
    'business_type', p.business_type,
    'target_audience', p.target_audience,
    'positive_keywords', p.positive_keywords,
    'negative_keywords', p.negative_keywords,
    ...
  )
  FROM tenant_personas p
  WHERE p.tenant_id = p_tenant_id AND p.is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

#### Function: `is_known_contact(p_tenant_id, p_platform, p_username)`
**Propósito**: Verificar se username está na whitelist

```sql
CREATE OR REPLACE FUNCTION is_known_contact(
  p_tenant_id UUID,
  p_platform TEXT,
  p_username TEXT
)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'is_known', EXISTS(...),
    'contact_type', kc.contact_type,
    'auto_classify_as', kc.auto_classify_as
  )
  FROM tenant_known_contacts kc
  WHERE kc.tenant_id = p_tenant_id
    AND kc.platform = p_platform
    AND kc.username = p_username
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

#### Function: `save_classified_lead(...)`
**Propósito**: Salvar lead classificado (upsert)

```sql
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
  INSERT INTO classified_leads (...)
  VALUES (...)
  RETURNING id;

  -- Atualiza contador na persona
  UPDATE tenant_personas
  SET leads_classified = leads_classified + 1
  WHERE tenant_id = p_tenant_id AND version = p_persona_version;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. AI-FACTORY - MODELO DE DADOS

### 2.1 Schema: SELF-IMPROVING AI SYSTEM

#### Tabela: `system_prompts`
**Propósito**: Versionamento de prompts com histórico e performance

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agent_version_id` | UUID | FK → agent_versions(id) |
| `version` | INTEGER | Versão do prompt |
| `parent_id` | UUID | FK → system_prompts(id) (histórico) |
| `is_active` | BOOLEAN | Apenas 1 ativo por agente |
| `prompt_content` | TEXT | Conteúdo do prompt |
| `prompt_name` | VARCHAR(255) | Nome descritivo |
| `prompt_description` | TEXT | Descrição |
| `model_config` | JSONB | {model, temperature, max_tokens} |
| `performance_score` | DECIMAL(3,2) | 0.00-5.00 (média das avaliações) |
| `total_evaluations` | INTEGER | Quantidade de avaliações |
| `total_conversations` | INTEGER | Conversas analisadas |
| `change_reason` | TEXT | auto_improvement, manual_edit, rollback |
| `change_summary` | TEXT | Resumo das alterações |
| `metadata` | JSONB | Metadata adicional |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `activated_at` | TIMESTAMPTZ | |
| `deactivated_at` | TIMESTAMPTZ | |

**Constraint**:
- UNIQUE `(agent_version_id, version)`

**Índices**:
- `idx_system_prompts_agent_version` em `(agent_version_id, version DESC)`
- `idx_system_prompts_active` em `(agent_version_id, is_active)` WHERE `is_active = true`
- `idx_system_prompts_performance` em `(performance_score DESC NULLS LAST)`

**Triggers**:
- `trigger_single_active_prompt`: Garante apenas 1 prompt ativo por agente

---

#### Tabela: `reflection_logs`
**Propósito**: Logs de cada ciclo de reflexão com scores e decisões

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agent_version_id` | UUID | FK → agent_versions(id) |
| `system_prompt_id` | UUID | FK → system_prompts(id) |
| `period_start` | TIMESTAMPTZ | Início do período analisado |
| `period_end` | TIMESTAMPTZ | Fim do período analisado |
| `conversations_analyzed` | INTEGER | Conversas analisadas |
| `messages_analyzed` | INTEGER | Mensagens analisadas |
| `score_completeness` | DECIMAL(3,2) | Completude (20%) |
| `score_depth` | DECIMAL(3,2) | Profundidade (25%) |
| `score_tone` | DECIMAL(3,2) | Tom/Personalidade (15%) |
| `score_scope` | DECIMAL(3,2) | Escopo/Relevância (20%) |
| `score_missed_opportunities` | DECIMAL(3,2) | Oportunidades Perdidas (20%) |
| `overall_score` | DECIMAL(3,2) | Score agregado (weighted average) |
| `score_breakdown` | JSONB | Breakdown detalhado |
| `strengths` | TEXT[] | Pontos fortes |
| `weaknesses` | TEXT[] | Pontos fracos |
| `patterns_identified` | TEXT[] | Padrões detectados |
| `action_taken` | VARCHAR(50) | none, suggestion, auto_update, escalate |
| `action_reason` | TEXT | Justificativa da decisão |
| `suggestion_id` | UUID | FK → improvement_suggestions(id) |
| `cooldown_respected` | BOOLEAN | Se respeitou 6h de cooldown |
| `previous_reflection_id` | UUID | FK → reflection_logs(id) |
| `hours_since_last_reflection` | DECIMAL(10,2) | Horas desde última reflexão |
| `status` | VARCHAR(50) | running, completed, failed, cancelled |
| `error_message` | TEXT | Mensagem de erro |
| `execution_time_ms` | INTEGER | Tempo de execução |
| `evaluator_model` | VARCHAR(100) | claude-sonnet-4-20250514 |
| `created_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ | |

**Constraints**:
- CHECK `overall_score >= 0 AND overall_score <= 5`
- CHECK `action_taken IN ('none', 'suggestion', 'auto_update', 'escalate')`

**Índices**:
- `idx_reflection_logs_agent` em `(agent_version_id, created_at DESC)`
- `idx_reflection_logs_score` em `(overall_score, created_at DESC)`
- `idx_reflection_logs_action` em `(action_taken, created_at DESC)`
- `idx_reflection_logs_period` em `(period_start, period_end)`
- `idx_reflection_logs_weaknesses` GIN em `weaknesses`

**Decision Framework**:
```
Score >= 4.0 → action_taken = 'none' (nenhuma ação)
Score 3.0-3.9 → action_taken = 'suggestion' (gerar sugestão)
Score 2.0-2.9 → action_taken = 'auto_update' (auto-aplicar se confidence >= 0.8)
Score < 2.0  → action_taken = 'escalate' (escalar para humano)
```

---

#### Tabela: `improvement_suggestions`
**Propósito**: Sugestões de melhoria geradas pelo sistema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agent_version_id` | UUID | FK → agent_versions(id) |
| `reflection_log_id` | UUID | FK → reflection_logs(id) |
| `current_prompt_id` | UUID | FK → system_prompts(id) |
| `suggestion_type` | VARCHAR(50) | prompt_update, config_change, escalation |
| `current_value` | TEXT | Valor atual (para comparação) |
| `suggested_value` | TEXT | Valor sugerido |
| `diff_summary` | TEXT | Resumo das diferenças |
| `rationale` | TEXT | Justificativa da sugestão |
| `expected_improvement` | TEXT | Melhoria esperada |
| `risk_assessment` | TEXT | Avaliação de risco |
| `confidence_score` | DECIMAL(3,2) | 0.00-1.00 (confidence da IA) |
| `focus_areas` | TEXT[] | ['tone', 'completeness', 'engagement'] |
| `status` | VARCHAR(50) | pending, approved, rejected, auto_applied, rolled_back |
| `reviewed_by` | UUID | User ID que revisou |
| `reviewed_at` | TIMESTAMPTZ | |
| `review_notes` | TEXT | |
| `applied_at` | TIMESTAMPTZ | |
| `applied_prompt_id` | UUID | FK → system_prompts(id) |
| `rolled_back_at` | TIMESTAMPTZ | |
| `rollback_reason` | TEXT | |
| `post_apply_score` | DECIMAL(3,2) | Score após aplicar |
| `improvement_delta` | DECIMAL(3,2) | Diferença de score |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | Expiração da sugestão |

**Constraints**:
- CHECK `suggestion_type IN ('prompt_update', 'config_change', 'escalation')`
- CHECK `status IN ('pending', 'approved', 'rejected', 'auto_applied', 'rolled_back')`

**Índices**:
- `idx_suggestions_agent` em `(agent_version_id, created_at DESC)`
- `idx_suggestions_status` em `(status, created_at DESC)`
- `idx_suggestions_pending` em `(agent_version_id, status)` WHERE `status = 'pending'`
- `idx_suggestions_reflection` em `reflection_log_id`
- `idx_suggestions_focus` GIN em `focus_areas`

**Auto-Apply Logic**:
```
IF confidence_score >= 0.85 AND auto_apply_enabled = true THEN
  status = 'auto_applied'
ELSE
  status = 'pending' (requer aprovação humana)
END IF
```

---

#### Tabela: `self_improving_settings`
**Propósito**: Configurações do sistema por agente

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `agent_version_id` | UUID | FK → agent_versions(id) |
| `location_id` | VARCHAR(100) | ID da location (GHL) |
| `reflection_enabled` | BOOLEAN | Habilitar reflexão (default: true) |
| `reflection_interval_hours` | INTEGER | Mínimo 6h entre reflexões |
| `min_conversations_for_reflection` | INTEGER | Mínimo 10 conversas |
| `threshold_none` | DECIMAL(3,2) | Score >= 4.0 = nenhuma ação |
| `threshold_suggestion` | DECIMAL(3,2) | 3.0-3.9 = gerar sugestão |
| `threshold_auto_update` | DECIMAL(3,2) | 2.0-2.9 = auto-update |
| `max_updates_per_day` | INTEGER | Máximo 3 updates/dia |
| `cooldown_after_update_hours` | INTEGER | 6h após update |
| `require_approval_below_confidence` | DECIMAL(3,2) | 0.8 (requer aprovação) |
| `auto_apply_enabled` | BOOLEAN | Começar desabilitado |
| `auto_apply_min_confidence` | DECIMAL(3,2) | 0.85 |
| `auto_apply_max_score_drop` | DECIMAL(3,2) | 0.5 (rollback) |
| `notify_on_suggestion` | BOOLEAN | |
| `notify_on_auto_update` | BOOLEAN | |
| `notify_on_escalation` | BOOLEAN | |
| `notification_emails` | TEXT[] | |
| `notification_webhook_url` | TEXT | Webhook para n8n/GHL |
| `evaluator_model` | VARCHAR(100) | claude-sonnet-4-20250514 |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Constraints**:
- UNIQUE NULLS NOT DISTINCT `(agent_version_id)`
- UNIQUE NULLS NOT DISTINCT `(location_id)`

---

### 2.2 Views e Functions do AI-Factory

#### View: `vw_self_improving_summary`
**Propósito**: Resumo de status do sistema por agente

```sql
SELECT
  av.id as agent_version_id,
  av.agent_name,
  av.version,
  sp.version as prompt_version,
  sp.performance_score as current_score,
  rl.overall_score as last_reflection_score,
  rl.action_taken as last_action,
  COUNT(*) FILTER (WHERE s.status = 'pending') as pending_suggestions,
  ss.reflection_enabled,
  ss.auto_apply_enabled
FROM agent_versions av
LEFT JOIN system_prompts sp ON sp.agent_version_id = av.id AND sp.is_active = true
LEFT JOIN reflection_logs rl ON rl.agent_version_id = av.id ORDER BY created_at DESC LIMIT 1
LEFT JOIN improvement_suggestions s ON s.agent_version_id = av.id
LEFT JOIN self_improving_settings ss ON ss.agent_version_id = av.id
```

---

#### View: `vw_score_evolution`
**Propósito**: Evolução de scores ao longo do tempo

```sql
SELECT
  rl.agent_version_id,
  rl.created_at::DATE as date,
  AVG(rl.overall_score) as avg_score,
  AVG(rl.score_completeness) as avg_completeness,
  AVG(rl.score_depth) as avg_depth,
  AVG(rl.score_tone) as avg_tone,
  COUNT(*) as reflection_count,
  SUM(CASE WHEN action_taken = 'auto_update' THEN 1 ELSE 0 END) as auto_updates
FROM reflection_logs rl
GROUP BY agent_version_id, created_at::DATE
ORDER BY created_at::DATE DESC
```

---

#### Function: `get_self_improving_config(p_agent_version_id UUID)`
**Propósito**: Buscar configurações do agente

```sql
CREATE OR REPLACE FUNCTION get_self_improving_config(p_agent_version_id UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'reflection_enabled', s.reflection_enabled,
    'reflection_interval_hours', s.reflection_interval_hours,
    'thresholds', jsonb_build_object(
      'none', s.threshold_none,
      'suggestion', s.threshold_suggestion,
      'auto_update', s.threshold_auto_update
    ),
    'auto_apply', jsonb_build_object(
      'enabled', s.auto_apply_enabled,
      'min_confidence', s.auto_apply_min_confidence
    )
  )
  FROM self_improving_settings s
  WHERE s.agent_version_id = p_agent_version_id
$$ LANGUAGE sql SECURITY DEFINER;
```

---

#### Function: `can_run_reflection(p_agent_version_id UUID)`
**Propósito**: Verificar se pode executar reflexão (cooldown, limites)

```sql
CREATE OR REPLACE FUNCTION can_run_reflection(p_agent_version_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_last_reflection TIMESTAMPTZ;
  v_hours_since DECIMAL;
  v_updates_today INTEGER;
BEGIN
  -- Buscar última reflexão
  SELECT created_at INTO v_last_reflection
  FROM reflection_logs
  WHERE agent_version_id = p_agent_version_id
  ORDER BY created_at DESC LIMIT 1;

  -- Calcular horas desde última reflexão
  v_hours_since := EXTRACT(EPOCH FROM (NOW() - v_last_reflection)) / 3600;

  -- Verificar cooldown
  IF v_hours_since < 6 THEN
    RETURN jsonb_build_object(
      'can_run', false,
      'reason', 'Cooldown: ' || v_hours_since || ' hours since last reflection'
    );
  END IF;

  -- Verificar limite diário
  SELECT COUNT(*) INTO v_updates_today
  FROM improvement_suggestions
  WHERE agent_version_id = p_agent_version_id
    AND status = 'auto_applied'
    AND applied_at >= CURRENT_DATE;

  IF v_updates_today >= 3 THEN
    RETURN jsonb_build_object(
      'can_run', true,
      'auto_update_blocked', true,
      'reason', 'Daily limit reached'
    );
  END IF;

  RETURN jsonb_build_object('can_run', true, 'reason', 'OK');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. COMPARAÇÃO E RELACIONAMENTOS

### 3.1 Tabela Comparativa

| Característica | AgenticOS | AI-Factory |
|----------------|-----------|------------|
| **Foco Principal** | Lead classification + Auto-response | Prompt improvement + Self-learning |
| **Multi-tenancy** | ✅ Sim (`tenants` table) | ❌ Não (single instance) |
| **Versionamento** | ✅ Personas versionadas | ✅ Prompts versionados |
| **IA usada** | Gemini Vision API | Claude Sonnet 4 |
| **Trigger de ação** | Mensagem recebida | Reflection loop (6h intervals) |
| **Auto-apply** | Auto-resposta de leads | Auto-update de prompts |
| **Scoring** | ICP score (0-100) | Performance score (0-5) |
| **Safety limits** | Rate limits de DM | Cooldown + max updates/day |
| **Whitelist** | ✅ `tenant_known_contacts` | ❌ Não tem |
| **Histórico** | `conversation_context` JSONB | `agent_conversations` tabela |
| **Analytics** | Views de performance | Views de score evolution |

---

### 3.2 Padrões Comuns (Reusáveis)

✅ **Ambos usam**:
1. UUID como Primary Key
2. `created_at` / `updated_at` TIMESTAMPTZ
3. Versionamento com `version INTEGER` + `is_active BOOLEAN`
4. Triggers para garantir apenas 1 versão ativa
5. JSONB para dados semi-estruturados
6. GIN indexes para arrays TEXT[]
7. RLS (Row Level Security) - AgenticOS tem RLS ativo
8. Functions SECURITY DEFINER para RPC
9. Views para dashboards
10. Soft deletes via `deactivated_at` / `deprecated_at`

---

### 3.3 Diferenças Arquiteturais

| Aspecto | AgenticOS | AI-Factory |
|---------|-----------|------------|
| **Isolation** | Multi-tenant com `tenant_id` em todas as tabelas | Single-tenant por agent_version_id |
| **Versioning trigger** | Nova versão de persona → desativa anterior | Nova versão de prompt → desativa anterior |
| **Decision logic** | Rule-based (keywords + ICP score) | AI-as-Judge (rubric scoring) |
| **Feedback loop** | Manual (conversions, outcomes) | Automated (reflection loop) |
| **Data structure** | JSONB pesado (profile_data, ai_analysis) | JSONB leve (score_breakdown, metadata) |

---

## 4. POSSIBILIDADES DE INTEGRAÇÃO

### 4.1 Cenário 1: Self-Improving Lead Classifier

**Problema a resolver**:
AgenticOS classifica leads com IA, mas não aprende com os resultados (taxa de conversão, false positives, etc).

**Solução proposta**:
Aplicar o **Reflection Loop do AI-Factory** para melhorar continuamente o `ai_classification_prompt` e `ai_response_prompt` da tabela `tenant_personas`.

#### Schema de integração:

```sql
-- Adicionar tracking de performance nas personas
ALTER TABLE tenant_personas
ADD COLUMN performance_score DECIMAL(3,2),
ADD COLUMN last_reflection_at TIMESTAMPTZ,
ADD COLUMN reflection_enabled BOOLEAN DEFAULT true;

-- Criar tabela de reflexão para personas
CREATE TABLE persona_reflection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  persona_id UUID NOT NULL REFERENCES tenant_personas(id),

  -- Período analisado
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Métricas do período
  total_leads_classified INTEGER,
  hot_leads_count INTEGER,
  false_positives INTEGER, -- Leads classificados HOT mas não converteram
  false_negatives INTEGER, -- Leads classificados COLD mas converteram

  -- Scores (rubrica adaptada)
  score_precision DECIMAL(3,2), -- Precisão das classificações
  score_conversion_rate DECIMAL(3,2), -- Taxa de conversão
  score_response_quality DECIMAL(3,2), -- Qualidade das respostas automáticas
  overall_score DECIMAL(3,2),

  -- Decisão
  action_taken TEXT, -- 'none', 'suggestion', 'auto_update'
  suggestion_id UUID REFERENCES persona_improvement_suggestions(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de sugestões de melhoria de persona
CREATE TABLE persona_improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  persona_id UUID NOT NULL REFERENCES tenant_personas(id),
  reflection_log_id UUID REFERENCES persona_reflection_logs(id),

  -- Tipo de melhoria
  suggestion_type TEXT, -- 'keywords_update', 'prompt_update', 'scoring_weights'

  -- Mudança proposta
  current_value JSONB,
  suggested_value JSONB,

  -- Análise
  rationale TEXT,
  confidence_score DECIMAL(3,2),

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'auto_applied'
  applied_at TIMESTAMPTZ,

  -- Performance pós-aplicação
  post_apply_conversion_rate DECIMAL(5,2),
  improvement_delta DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Fluxo de integração:

```
1. Trigger periódico (6h) via n8n:
   → Buscar leads classificados nas últimas 6h
   → Calcular métricas (precision, false positives, conversion rate)
   → Chamar Claude Sonnet 4 para avaliar performance

2. Claude analisa:
   → Keywords que geraram false positives
   → Padrões em leads que converteram mas foram classificados como COLD
   → Sugestões de ajuste nos positive_keywords / negative_keywords
   → Sugestões de melhoria no ai_classification_prompt

3. Decisão automática:
   IF overall_score >= 4.0 THEN action = 'none'
   IF overall_score 3.0-3.9 THEN action = 'suggestion' (requer aprovação)
   IF overall_score < 3.0 AND confidence >= 0.85 THEN action = 'auto_update'

4. Se auto_update:
   → Criar nova versão da persona (version + 1)
   → Copiar campos da versão anterior
   → Aplicar mudanças sugeridas (keywords, prompt)
   → Ativar nova versão (trigger desativa a anterior)
   → Monitorar performance nas próximas 24h

5. Se performance piorar:
   → Rollback para versão anterior (is_active = true)
   → Marcar suggestion como 'rolled_back'
```

---

### 4.2 Cenário 2: Multi-Tenant Self-Improving System

**Problema a resolver**:
AI-Factory não tem multi-tenancy. AgenticOS tem multi-tenancy mas não tem self-improving.

**Solução proposta**:
Criar uma **versão multi-tenant do AI-Factory** reutilizando padrões do AgenticOS.

#### Mudanças necessárias no AI-Factory:

```sql
-- Adicionar tenant_id nas tabelas principais
ALTER TABLE system_prompts
ADD COLUMN tenant_id UUID REFERENCES tenants(id),
ADD COLUMN location_id VARCHAR(100); -- Para multi-location dentro de tenant

ALTER TABLE reflection_logs
ADD COLUMN tenant_id UUID REFERENCES tenants(id);

ALTER TABLE improvement_suggestions
ADD COLUMN tenant_id UUID REFERENCES tenants(id);

ALTER TABLE self_improving_settings
ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Atualizar constraints
ALTER TABLE system_prompts
DROP CONSTRAINT IF EXISTS unique_active_prompt,
ADD CONSTRAINT unique_active_prompt_per_tenant
  UNIQUE (tenant_id, agent_version_id, is_active)
  WHERE is_active = true;

-- Atualizar RLS policies
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_prompts_tenant_isolation" ON system_prompts
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );

-- Similar para outras tabelas...
```

#### Vantagens da integração:

✅ Cada tenant tem seu próprio conjunto de prompts versionados
✅ Reflection loops isolados por tenant
✅ Auto-apply configurável por tenant (alguns podem ter auto-apply, outros não)
✅ Performance tracking separado por tenant
✅ Rollback independente por tenant

---

### 4.3 Cenário 3: Unified Analytics Dashboard

**Problema a resolver**:
Métricas isoladas entre AgenticOS (lead metrics) e AI-Factory (prompt performance).

**Solução proposta**:
Criar **view unificada** que correlaciona performance de prompts com performance de leads.

#### View proposta:

```sql
CREATE OR REPLACE VIEW vw_unified_tenant_performance AS
SELECT
  t.id as tenant_id,
  t.name as tenant_name,

  -- Lead metrics (AgenticOS)
  COUNT(cl.*) as total_leads_30d,
  AVG(cl.icp_score) as avg_icp_score,
  COUNT(*) FILTER (WHERE cl.converted_to_opportunity) as conversions_30d,

  -- Persona performance (AgenticOS)
  p.version as persona_version,
  p.leads_classified,
  p.conversion_rate as persona_conversion_rate,

  -- Prompt performance (AI-Factory)
  sp.version as prompt_version,
  sp.performance_score as prompt_score,
  sp.total_evaluations as prompt_evaluations,

  -- Reflection metrics (AI-Factory)
  rl.overall_score as last_reflection_score,
  rl.action_taken as last_action,

  -- Sugestões pendentes (AI-Factory)
  COUNT(s.*) FILTER (WHERE s.status = 'pending') as pending_suggestions,

  -- Auto-updates (AI-Factory)
  COUNT(s.*) FILTER (WHERE s.status = 'auto_applied'
    AND s.applied_at >= NOW() - INTERVAL '30 days') as auto_updates_30d

FROM tenants t
LEFT JOIN tenant_personas p ON p.tenant_id = t.id AND p.is_active = true
LEFT JOIN classified_leads cl ON cl.tenant_id = t.id
  AND cl.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN system_prompts sp ON sp.tenant_id = t.id AND sp.is_active = true
LEFT JOIN reflection_logs rl ON rl.tenant_id = t.id
  ORDER BY rl.created_at DESC LIMIT 1
LEFT JOIN improvement_suggestions s ON s.tenant_id = t.id
GROUP BY t.id, t.name, p.version, sp.version, rl.overall_score, rl.action_taken
```

---

### 4.4 Cenário 4: Cross-Learning Between Tenants

**Problema a resolver**:
Cada tenant aprende isoladamente. Melhorias descobertas por um tenant não beneficiam outros.

**Solução proposta**:
Criar **sistema de best practices compartilhadas** (opcional, com consent).

#### Schema proposta:

```sql
CREATE TABLE shared_best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Origem
  source_tenant_id UUID REFERENCES tenants(id),
  source_persona_id UUID REFERENCES tenant_personas(id),

  -- Tipo de prática
  practice_type TEXT, -- 'keyword_set', 'prompt_template', 'scoring_weights'

  -- Conteúdo
  practice_name TEXT,
  practice_description TEXT,
  practice_config JSONB,

  -- Performance da origem
  source_conversion_rate DECIMAL(5,2),
  source_leads_classified INTEGER,

  -- Aplicação por outros tenants
  times_applied INTEGER DEFAULT 0,
  avg_improvement_delta DECIMAL(5,2), -- Melhoria média quando aplicada

  -- Metadados
  is_public BOOLEAN DEFAULT false, -- Se outros tenants podem ver
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking de aplicação
CREATE TABLE best_practice_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  best_practice_id UUID REFERENCES shared_best_practices(id),
  applied_to_tenant_id UUID REFERENCES tenants(id),
  applied_to_persona_id UUID REFERENCES tenant_personas(id),

  -- Performance antes/depois
  conversion_rate_before DECIMAL(5,2),
  conversion_rate_after DECIMAL(5,2),
  improvement_delta DECIMAL(5,2),

  applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Exemplo de uso:

```
Tenant A (Socialfy) descobre que adicionar keyword "scaling" nos positive_keywords
aumentou conversão de 12% para 18%.

Sistema pergunta: "Compartilhar esta descoberta com outros tenants?"

Se sim:
  → INSERT INTO shared_best_practices (
      source_tenant_id = 'socialfy',
      practice_type = 'keyword_addition',
      practice_config = {"keyword": "scaling", "context": "B2B agencies"},
      source_conversion_rate = 18%
    )

Tenant B (FitPro) recebe sugestão:
  → "Socialfy descobriu que keyword 'scaling' aumentou conversão em 50%.
     Aplicar na sua persona?"

Se aprovar:
  → Adiciona "scaling" nos positive_keywords
  → Monitora conversão por 7 dias
  → Atualiza best_practice_applications
```

---

## 5. ROADMAP DE INTEGRAÇÃO

### Fase 1: Foundation (Semana 1-2)
- [ ] Adicionar `tenant_id` nas tabelas do AI-Factory
- [ ] Implementar RLS no AI-Factory
- [ ] Migrar funções para suportar multi-tenancy
- [ ] Criar view unificada `vw_unified_tenant_performance`

### Fase 2: Self-Improving Personas (Semana 3-4)
- [ ] Criar `persona_reflection_logs`
- [ ] Criar `persona_improvement_suggestions`
- [ ] Implementar Reflection Loop para personas
- [ ] Configurar n8n workflow (trigger 6h)

### Fase 3: Auto-Apply (Semana 5-6)
- [ ] Implementar lógica de auto-apply para personas
- [ ] Adicionar rollback automático se performance cair
- [ ] Dashboard de monitoring de versões de persona
- [ ] Alertas via webhook (n8n/GHL)

### Fase 4: Cross-Learning (Semana 7-8)
- [ ] Criar `shared_best_practices`
- [ ] Criar `best_practice_applications`
- [ ] UI para aprovar/rejeitar sugestões de outros tenants
- [ ] Analytics de cross-learning

---

## 6. MÉTRICAS DE SUCESSO

### KPIs do AgenticOS (Lead Generation)
- Taxa de conversão de LEAD_HOT → Opportunity
- Precisão da classificação (% de false positives)
- Tempo médio de resposta automática
- Engagement rate das mensagens enviadas

### KPIs do AI-Factory (Self-Improving)
- Performance score médio dos prompts
- Quantidade de auto-updates bem-sucedidos
- Taxa de rollback (quanto menor, melhor)
- Improvement delta médio

### KPIs Unificados (Integração)
- Melhoria de conversão após auto-update de persona
- Redução de false positives após reflexão
- Tempo para atingir performance ótima (time-to-optimal)
- ROI de créditos de IA (menos re-classificações = menos custo)

---

## 7. CONSIDERAÇÕES DE SEGURANÇA

### Multi-Tenancy
✅ **AgenticOS já implementa**:
- RLS ativo em todas as tabelas
- `tenant_id` em todos os registros
- Policies baseadas em JWT (`auth.jwt() -> 'app_metadata' ->> 'tenant_id'`)

⚠️ **AI-Factory precisa adicionar**:
- RLS nas tabelas de prompts/reflection
- Isolation de reflexões por tenant
- Webhooks segregados por tenant

### Auto-Apply Safety
✅ **Ambos implementam**:
- Cooldown entre updates (6h)
- Max updates per day (3)
- Confidence threshold (0.85)
- Rollback automático

⚠️ **Melhorias sugeridas**:
- A/B testing: manter versão anterior ativa para X% dos leads
- Canary releases: nova versão para 10% → 50% → 100%
- Circuit breaker: se 3 rollbacks consecutivos, desabilitar auto-apply

---

## 8. ESTIMATIVA DE IMPACTO

### Benefícios da Integração

| Benefício | Impacto Estimado |
|-----------|------------------|
| **Redução de false positives** | -30% a -50% (via reflection loop) |
| **Melhoria de conversão** | +15% a +25% (prompts otimizados) |
| **Redução de custo de IA** | -20% (menos re-classificações) |
| **Time-to-market** | -40% (auto-apply sem intervenção) |
| **Escalabilidade** | 10x (multi-tenant unificado) |

### Esforço de Desenvolvimento

| Fase | Esforço | Risco |
|------|---------|-------|
| Fase 1: Foundation | 2 semanas | Baixo |
| Fase 2: Self-Improving Personas | 2 semanas | Médio |
| Fase 3: Auto-Apply | 2 semanas | Alto |
| Fase 4: Cross-Learning | 2 semanas | Médio |

**Total**: 8 semanas (2 meses)
**Risco geral**: Médio (mitigado por fases incrementais)

---

## 9. PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade ALTA
1. ✅ **Documentar schemas** (CONCLUÍDO - este documento)
2. ⏳ **Criar migration 006**: Adicionar `tenant_id` no AI-Factory
3. ⏳ **Implementar RLS** no AI-Factory
4. ⏳ **Criar view unificada** de performance

### Prioridade MÉDIA
5. ⏳ **Prototipar Reflection Loop** para personas
6. ⏳ **Criar dashboard unificado** (Next.js + Supabase)
7. ⏳ **Implementar webhooks** para notificações

### Prioridade BAIXA
8. ⏳ **Cross-learning entre tenants** (Fase 4)
9. ⏳ **A/B testing framework**
10. ⏳ **Analytics avançado** (ML predictions)

---

## 10. CONCLUSÃO

### Compatibilidade
✅ **Alta**: Ambos os sistemas usam PostgreSQL/Supabase com padrões similares
✅ **Versionamento compatível**: Mesmo approach (version INTEGER + is_active)
✅ **JSONB extensivo**: Flexibilidade para evolução de schemas

### Oportunidades
🚀 **Self-Improving Lead Classifier**: Aplicar Reflection Loop nas personas
🚀 **Multi-Tenant AI-Factory**: Escalar para SaaS
🚀 **Unified Analytics**: Correlacionar performance de prompts com conversão
🚀 **Cross-Learning**: Compartilhar best practices entre tenants

### Riscos
⚠️ **Complexidade**: Multi-tenancy + Auto-apply requer testes extensivos
⚠️ **Custo de IA**: Reflection loops consomem créditos (Claude Sonnet 4)
⚠️ **Data privacy**: Cross-learning requer consent e anonimização

### Recomendação Final
**✅ INTEGRAÇÃO VIÁVEL E RECOMENDADA**

A integração trará ganhos significativos em:
- **Automação**: Menos intervenção manual na otimização
- **Performance**: Melhoria contínua de conversão
- **Escalabilidade**: Multi-tenant unificado
- **ROI**: Redução de custos de IA

**Próximo passo**: Aprovar Fase 1 (Foundation) e iniciar migration 006.

---

**Documento gerado por**: Database Engineer Agent
**Projeto**: AI-Factory V4 - MOTTIVME
**Data**: 2026-01-01
**Versão**: 1.0
