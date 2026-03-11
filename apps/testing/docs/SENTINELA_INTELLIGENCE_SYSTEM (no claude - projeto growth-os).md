# SENTINELA - Sistema de Inteligência Operacional

> **De gravador de mensagens → Cérebro operacional da MOTTIVME**

---

## ⚠️ IMPORTANTE: Migrations

| Migration | Status | Descrição |
|-----------|--------|-----------|
| `011_sentinel_intelligence_system.sql` | ❌ **DEPRECADA** | Criava tabelas duplicadas |
| `012_sentinel_expansion_corrected.sql` | ✅ **USAR ESTA** | Expande sem duplicar |

A migration 012 foi criada para **respeitar o schema existente** no projeto MIS-Sentinel.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SENTINELA INTELLIGENCE SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          CAMADA DE COLETA                                │   │
│   │                                                                          │   │
│   │   WhatsApp ──► Evolution API ──► n8n Webhook ──► messages               │   │
│   │   GHL      ──► Webhook       ──► n8n Process ──► messages               │   │
│   │   Slack    ──► Webhook       ──► n8n Process ──► messages               │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                           │
│                                      ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        CAMADA DE ANÁLISE (AI)                            │   │
│   │                                                                          │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │   │
│   │   │  Sentiment   │   │   Problem    │   │  Automation  │                │   │
│   │   │  Analysis    │   │  Detection   │   │  Detection   │                │   │
│   │   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │   │
│   │          │                  │                  │                         │   │
│   │          ▼                  ▼                  ▼                         │   │
│   │   urgency_score        problems         automation_opportunities        │   │
│   │   sentiment                                                              │   │
│   │   keywords                                                               │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                           │
│                                      ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        CAMADA DE INTELIGÊNCIA                            │   │
│   │                                                                          │   │
│   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │   │
│   │   │    SOPs      │   │   Agentes    │   │   Knowledge  │                │   │
│   │   │  Gerados     │   │  Treinados   │   │    Base      │                │   │
│   │   └──────────────┘   └──────────────┘   └──────────────┘                │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                           │
│                                      ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         CAMADA DE AÇÃO                                   │   │
│   │                                                                          │   │
│   │   alerts ──► Notificações WhatsApp/Slack                                │   │
│   │   problems ──► Tickets no Monday.com                                    │   │
│   │   SOPs ──► Execução automática por agentes                              │   │
│   │   metrics ──► Dashboard em tempo real                                   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Tabelas do Sistema

### 1. MENSAGENS (Coleta)

```sql
mottivme_intelligence_system.messages
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL | ID único |
| `source` | VARCHAR | Fonte (ghl, evolution, manual) |
| `sender_name` | VARCHAR | Nome do remetente |
| `sender_phone` | VARCHAR | Telefone |
| `sender_type` | VARCHAR | Tipo (team, client, prospect) |
| `message_body` | TEXT | Conteúdo da mensagem |
| `sentiment` | VARCHAR | Análise de sentimento |
| `urgency_score` | INTEGER | 0-10 |
| `keywords` | TEXT[] | Palavras-chave extraídas |
| `needs_attention` | BOOLEAN | Precisa de atenção humana? |
| `is_group_message` | BOOLEAN | É mensagem de grupo? |
| `group_type` | VARCHAR | internal, client, unknown |
| `team_analysis` | JSONB | Análise do membro do time |

---

### 2. PROBLEMAS (Detecção)

```sql
mottivme_intelligence_system.problems
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `problem_type_code` | VARCHAR | Tipo do problema (FK) |
| `title` | VARCHAR | Título do problema |
| `description` | TEXT | Descrição detalhada |
| `source_message_id` | INTEGER | Mensagem que originou |
| `status` | VARCHAR | open, investigating, resolved |
| `priority` | VARCHAR | low, medium, high, critical |
| `assigned_to` | VARCHAR | Responsável |
| `ai_analysis` | TEXT | Análise da AI |
| `ai_suggested_solution` | TEXT | Solução sugerida |
| `detected_at` | TIMESTAMPTZ | Quando foi detectado |
| `resolved_at` | TIMESTAMPTZ | Quando foi resolvido |
| `time_to_resolution_minutes` | INTEGER | Tempo de resolução |

**Tipos de Problemas Pré-configurados:**

| Código | Nome | Categoria | SLA |
|--------|------|-----------|-----|
| `ai_malfunction` | IA com mal funcionamento | technical | 60min |
| `ai_wrong_response` | IA deu resposta errada | technical | 30min |
| `missing_process` | Processo não documentado | process | 8h |
| `client_complaint` | Reclamação de cliente | client | 60min |
| `client_churn_risk` | Risco de churn | client | 4h |
| `payment_overdue` | Pagamento atrasado | financial | 24h |
| `team_overload` | Membro sobrecarregado | people | 4h |
| `ads_blocked` | Conta de anúncios bloqueada | technical | 30min |

---

### 3. SOPs (Processos)

```sql
mottivme_intelligence_system.sops
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `code` | VARCHAR | Código (SOP-SALES-001) |
| `title` | VARCHAR | Título do SOP |
| `description` | TEXT | O que esse processo faz |
| `category_code` | VARCHAR | Categoria (vendas, cs, etc) |
| `objective` | TEXT | Objetivo do processo |
| `triggers` | TEXT[] | O que dispara esse processo |
| `steps` | JSONB | Passos estruturados |
| `tools_needed` | TEXT[] | Ferramentas necessárias |
| `status` | VARCHAR | draft, published, deprecated |
| `origin` | VARCHAR | manual, ai_generated, problem_derived |
| `usage_count` | INTEGER | Quantas vezes foi usado |
| `effectiveness_score` | DECIMAL | 0-1 |

**Categorias de Processos:**

- `sales_prospecting` - Prospecção de Vendas
- `sales_closing` - Fechamento de Vendas
- `client_onboarding` - Onboarding de Clientes
- `client_support` - Suporte ao Cliente
- `tech_automation` - Automações
- `tech_ai_agents` - Agentes de IA

---

### 4. AGENTES (IA)

```sql
mottivme_intelligence_system.agents
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `code` | VARCHAR | Código único |
| `name` | VARCHAR | Nome do agente |
| `agent_type_code` | VARCHAR | Tipo (sdr_inbound, cs_support) |
| `location_id` | VARCHAR | Location do GHL |
| `persona` | JSONB | Tom, estilo, regras |
| `system_prompt` | TEXT | Prompt do sistema |
| `status` | VARCHAR | active, paused, testing |
| `total_conversations` | INTEGER | Total de conversas |
| `conversion_rate` | DECIMAL | Taxa de conversão |
| `satisfaction_score` | DECIMAL | Score de satisfação |
| `sops_used` | UUID[] | SOPs que o agente usa |

**Tipos de Agentes:**

| Código | Nome | Categoria |
|--------|------|-----------|
| `sdr_inbound` | SDR Inbound | sdr |
| `sdr_outbound` | SDR Outbound | sdr |
| `cs_onboarding` | CS Onboarding | cs |
| `cs_support` | CS Suporte | cs |
| `cs_retention` | CS Retenção | cs |
| `ops_scheduler` | Scheduler | ops |
| `ops_followup` | Follow Up | ops |
| `analyst_sentinel` | Sentinel Observer | analyst |

---

### 5. ÁREAS DE NEGÓCIO (Métricas)

```sql
mottivme_intelligence_system.business_areas
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `code` | VARCHAR | sales, cs, ops, etc |
| `name` | VARCHAR | Nome da área |
| `responsible` | VARCHAR | Responsável |
| `team_members` | TEXT[] | Membros do time |
| `health_score` | INTEGER | 0-100 |
| `automation_level` | INTEGER | 0-100 |

**Áreas Configuradas:**

| Área | Responsável | Time |
|------|-------------|------|
| Vendas | Marcos Daniel | Isabella |
| CS | Isabella | Isabella |
| Operações | Allesson | Allesson |
| Marketing | Arthur | Arthur |
| Tecnologia | Marcos | Marcos, Allesson |
| Financeiro | Hallen | Hallen |

---

### 6. OPORTUNIDADES DE AUTOMAÇÃO

```sql
mottivme_intelligence_system.automation_opportunities
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `title` | VARCHAR | Título da oportunidade |
| `current_process` | TEXT | Como é feito hoje |
| `proposed_automation` | TEXT | Como automatizar |
| `estimated_time_saved_weekly_minutes` | INTEGER | Tempo economizado |
| `complexity` | VARCHAR | low, medium, high |
| `impact_score` | INTEGER | 0-100 |
| `status` | VARCHAR | identified, approved, implemented |

---

### 7. ALERTAS

```sql
mottivme_intelligence_system.alerts
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID único |
| `alert_type` | VARCHAR | Tipo do alerta |
| `severity` | VARCHAR | low, medium, high, critical |
| `title` | VARCHAR | Título |
| `ai_analysis` | TEXT | Análise da AI |
| `suggested_actions` | TEXT[] | Ações sugeridas |
| `status` | VARCHAR | active, acknowledged, resolved |

---

## Views Prontas

### Problemas Abertos por Prioridade
```sql
SELECT * FROM mottivme_intelligence_system.v_open_problems;
```
Retorna todos os problemas abertos, ordenados por prioridade, com flag de SLA breached.

### Saúde das Áreas
```sql
SELECT * FROM mottivme_intelligence_system.v_area_health;
```
Retorna health score atual de cada área.

### Agentes Ativos com Performance
```sql
SELECT * FROM mottivme_intelligence_system.v_active_agents;
```
Retorna agentes ativos com métricas do dia.

### Mensagens que Precisam Atenção
```sql
SELECT * FROM mottivme_intelligence_system.v_needs_attention;
```
Retorna mensagens urgentes não processadas.

### Backlog de Automações
```sql
SELECT * FROM mottivme_intelligence_system.v_automation_backlog;
```
Retorna oportunidades de automação pendentes.

---

## Funções Úteis

### Criar Problema a partir de Mensagem
```sql
SELECT mottivme_intelligence_system.create_problem_from_message(
  123,                    -- message_id
  'ai_malfunction',       -- problem_type_code
  'IA respondeu errado',  -- title
  'Descrição detalhada',  -- description (opcional)
  'Isabella'              -- assigned_to (opcional)
);
```

### Calcular Health Score da Área
```sql
SELECT mottivme_intelligence_system.calculate_area_health('sales');
```
Retorna e atualiza o health score da área.

---

## Fluxo de Dados

```
1. MENSAGEM CHEGA
   │
   ├──► Webhook n8n recebe
   │
   ├──► Processa com Code node
   │    ├── Detecta grupo (interno/cliente)
   │    ├── Identifica membro do time
   │    ├── Analisa sentimento
   │    ├── Extrai keywords
   │    └── Calcula urgency_score
   │
   ├──► Salva em messages
   │
   └──► Se needs_attention = true
        │
        ▼
2. SENTINEL OBSERVER (CRON 5min)
   │
   ├──► SELECT * FROM v_needs_attention
   │
   ├──► Para cada mensagem:
   │    ├── AI analisa contexto
   │    ├── Detecta tipo de problema
   │    ├── Sugere solução
   │    └── Identifica oportunidade de automação
   │
   ├──► Se problema detectado:
   │    │
   │    ├──► INSERT INTO problems
   │    │
   │    └──► Se crítico:
   │         │
   │         └──► INSERT INTO alerts
   │              │
   │              └──► Notifica WhatsApp
   │
   └──► Se oportunidade de automação:
        │
        └──► INSERT INTO automation_opportunities

3. PROCESS BUILDER (CRON 6h)
   │
   ├──► Analisa problemas recorrentes
   │
   ├──► Gera SOPs automaticamente
   │
   └──► Sugere novos agentes/subagentes

4. METRICS AGGREGATOR (CRON diário)
   │
   ├──► Calcula métricas por área
   │
   ├──► Atualiza health_scores
   │
   └──► Gera relatório executivo
```

---

## Como Usar

### 1. Rodar a Migration
```bash
# Via Supabase CLI
supabase db push

# Ou diretamente no SQL Editor do Supabase
# Cole o conteúdo de migrations/012_sentinel_expansion_corrected.sql
# ⚠️ NÃO usar a 011, ela foi deprecada!
```

### 2. Atualizar Workflow n8n
O workflow atual salva apenas em `messages`. Agora precisa:
1. Continuar salvando em `messages`
2. Adicionar nó para verificar `needs_attention`
3. Se true, chamar Sentinel Observer

### 3. Criar Sentinel Observer Workflow
Novo workflow que:
1. Roda a cada 5 minutos
2. Busca `v_needs_attention`
3. Analisa com AI
4. Cria problemas/alertas automaticamente

### 4. Dashboard de Monitoramento
Usar as views para criar dashboards:
- `v_open_problems` → Lista de problemas
- `v_area_health` → Saúde das áreas
- `v_active_agents` → Performance dos agentes
- `v_automation_backlog` → Backlog de automações

---

## Próximos Passos

1. [ ] Rodar migration **012** no Supabase (NÃO a 011!)
2. [ ] Criar workflow Sentinel Observer
3. [ ] Criar workflow Process Builder
4. [ ] Criar workflow Metrics Aggregator
5. [ ] Integrar dashboard MIS-Sentinel
6. [ ] Configurar notificações WhatsApp

---

## Tabelas Existentes vs Novas

### ✅ Já Existiam (apenas expandidas)
| Tabela | Colunas Adicionadas |
|--------|---------------------|
| `messages` | sender_phone, sender_type, needs_attention, team_analysis, etc |
| `issues` | problem_type_code, ai_analysis, sla tracking, etc |

### 🆕 Criadas pela Migration 012
| Tabela | Propósito |
|--------|-----------|
| `problem_types` | Tipificação de problemas com SLAs |
| `process_categories` | Categorias de processos/SOPs |
| `sops` | SOPs estruturados com steps |
| `sop_executions` | Tracking de execução de SOPs |
| `agent_types` | Tipificação de agentes |
| `agents` | Cadastro de agentes de IA |
| `subagents` | Subagentes especializados |
| `agent_performance` | Métricas de performance |
| `business_areas` | Áreas do negócio |
| `area_metrics` | Métricas diárias por área |
| `group_sessions` | Sessões de conversa em grupo |

### ⚠️ Não Alteradas (já existiam no MIS-Sentinel)
- `alerts`
- `process_maps`
- `automation_opportunities`
- `sales_metrics`
- `customer_engagement`
- `sentinel_insights`
- `knowledge_base`

---

*Documento criado em 2026-01-09*
*Projeto: MOTTIVME Intelligence System / Sentinela*
