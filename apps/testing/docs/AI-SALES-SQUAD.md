# AI SALES SQUAD - Arquitetura & Checklist v2.0

> Arquitetura multi-tenant para escalar vendas com IA
> Ultima atualizacao: 2026-01-25

---

## PRINCIPIO FUNDAMENTAL

```
ERRADO: 37 agentes separados por cliente
CERTO:  1 agente por cliente com 37 modos em prompts_by_mode
```

---

## ARQUITETURA

### Modelo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                      agent_templates                             │
│  (biblioteca de modos - compartilhado entre todos os clientes)  │
├─────────────────────────────────────────────────────────────────┤
│ id │ mode_name │ category │ prompt_template │ tools_template    │
├─────────────────────────────────────────────────────────────────┤
│ 1  │ sdr_inbound │ acquisition │ "# SDR..." │ {...}            │
│ 2  │ closer      │ closing     │ "# CLOSER.." │ {...}          │
│ 37 │ ...         │ ...         │ ...          │ ...             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ herda
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      agent_versions                              │
│           (1 agente por cliente/location_id)                     │
├─────────────────────────────────────────────────────────────────┤
│ id │ location_id │ agent_name │ prompts_by_mode │ modos_ativos  │
├─────────────────────────────────────────────────────────────────┤
│ 1  │ flavia-leal │ Diana      │ {sdr, closer..} │ [5 modos]     │
│ 2  │ isabella    │ Isabella   │ {sdr, social..} │ [7 modos]     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ configura
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    agent_mode_config                             │
│         (configuracao especifica por modo por cliente)          │
├─────────────────────────────────────────────────────────────────┤
│ id │ agent_id │ mode_name │ enabled │ overrides                 │
├─────────────────────────────────────────────────────────────────┤
│ 1  │ 1        │ sdr_inbound │ true  │ {"tom": "acolhedor"}      │
│ 2  │ 1        │ closer      │ true  │ {"desconto_max": 10}      │
│ 3  │ 1        │ collections │ false │ null                      │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Criacao

```
1. Admin cria templates em agent_templates (1x)
2. Para cada cliente:
   a. Cria 1 registro em agent_versions
   b. Seleciona modos em agent_mode_config
   c. Personaliza overrides se necessario
3. Deploy: monta prompts_by_mode dinamicamente
```

---

## CATALOGO DE MODOS (37 total)

### AQUISICAO (7 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 1 | `social_seller` | Engaja redes sociais, DM | P0 |
| 2 | `cold_outreach` | Email frio, cadencias outbound | P0 |
| 3 | `sdr_outbound` | Ligacao fria, prospeccao ativa | P0 |
| 4 | `linkedin_outreach` | Prospeccao LinkedIn, InMail | P1 |
| 5 | `bdr_partnerships` | Parcerias, afiliados, canais | P2 |
| 6 | `ads_responder` | Responde comentarios em anuncios | P1 |
| 7 | `chatbot_inbound` | Atendimento inicial no site | P1 |

### QUALIFICACAO (3 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 8 | `sdr_inbound` | Qualifica leads, BANT | P0 |
| 9 | `lead_scorer` | Pontua leads (MQL→SQL) | P1 |
| 10 | `data_enrichment` | Enriquece dados empresa/cargo | P2 |

### NUTRICAO (4 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 11 | `email_nurture` | Sequencias drip automaticas | P0 |
| 12 | `email_marketing` | Campanhas, newsletters | P1 |
| 13 | `email_copy` | Escreve emails (subject, body) | P1 |
| 14 | `webinar_host` | Apresenta webinars de vendas | P2 |

### AGENDAMENTO (2 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 15 | `scheduler` | Agenda visitas, reduz no-shows | P0 |
| 16 | `demo_specialist` | Apresenta demos do produto | P2 |

### FECHAMENTO (3 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 17 | `closer` | Fecha vendas, SPIN Selling | P0 |
| 18 | `objection_handler` | Trata objecoes, tecnica 3F | P0 |
| 19 | `proposal_writer` | Escreve propostas comerciais | P1 |

### POS-VENDA (8 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 20 | `onboarder` | Ativa cliente primeiros 30 dias | P0 |
| 21 | `concierge` | Suporte pos-venda tier 1 | P0 |
| 22 | `cs_manager` | Customer Success, health score | P1 |
| 23 | `account_manager` | Gestao contas grandes | P2 |
| 24 | `upseller` | Vende upgrade, produtos extras | P1 |
| 25 | `referral_manager` | Programa de indicacao | P1 |
| 26 | `review_collector` | Coleta depoimentos e reviews | P2 |
| 27 | `survey_bot` | NPS, CSAT, pesquisas | P2 |

### RECUPERACAO (5 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 28 | `followuper` | Retoma leads que esfriaram | P0 |
| 29 | `reativador` | Reconquista leads inativos | P0 |
| 30 | `collections` | Recupera inadimplencia | P0 |
| 31 | `email_winback` | Email para recuperar churned | P1 |
| 32 | `churn_predictor` | Preve quem vai cancelar | P2 |

### GESTAO (5 modos)

| # | mode_name | Funcao | Prioridade |
|---|-----------|--------|------------|
| 33 | `sales_manager` | Supervisiona, aprova descontos | P1 |
| 34 | `sales_ops` | Metricas, reports, forecasting | P1 |
| 35 | `qa_sales` | Audita conversas, qualidade | P2 |
| 36 | `crm_hygiene` | Limpa, deduplica, organiza | P2 |
| 37 | `competitive_intel` | Monitora concorrencia | P3 |

---

## CHECKLIST DE IMPLEMENTACAO

### FASE 1: Infraestrutura (P0)

| # | Task | Status | Arquivo |
|---|------|--------|---------|
| 1.1 | Criar tabela `agent_templates` | [ ] | `migrations/agent_templates.sql` |
| 1.2 | Criar tabela `agent_mode_config` | [ ] | `migrations/agent_mode_config.sql` |
| 1.3 | Migrar agentes existentes | [ ] | `migrations/migrate_existing.sql` |
| 1.4 | API CRUD templates | [ ] | `api/templates.ts` |
| 1.5 | API CRUD mode_config | [ ] | `api/mode-config.ts` |

### FASE 2: Templates P0 (13 modos core)

| # | mode_name | Status | Prompt | Tools |
|---|-----------|--------|--------|-------|
| 2.1 | `sdr_inbound` | [x] | OK | OK |
| 2.2 | `social_seller` | [x] | OK | OK |
| 2.3 | `scheduler` | [x] | OK | OK |
| 2.4 | `closer` | [x] | OK | OK |
| 2.5 | `objection_handler` | [x] | OK | OK |
| 2.6 | `followuper` | [x] | OK | OK |
| 2.7 | `reativador` | [x] | OK | OK |
| 2.8 | `concierge` | [x] | OK | OK |
| 2.9 | `cold_outreach` | [ ] | - | - |
| 2.10 | `sdr_outbound` | [ ] | - | - |
| 2.11 | `email_nurture` | [ ] | - | - |
| 2.12 | `onboarder` | [ ] | - | - |
| 2.13 | `collections` | [ ] | - | - |

### FASE 3: Templates P1 (13 modos)

| # | mode_name | Status |
|---|-----------|--------|
| 3.1 | `linkedin_outreach` | [ ] |
| 3.2 | `ads_responder` | [ ] |
| 3.3 | `chatbot_inbound` | [ ] |
| 3.4 | `lead_scorer` | [ ] |
| 3.5 | `email_marketing` | [ ] |
| 3.6 | `email_copy` | [ ] |
| 3.7 | `proposal_writer` | [ ] |
| 3.8 | `cs_manager` | [ ] |
| 3.9 | `upseller` | [ ] |
| 3.10 | `referral_manager` | [ ] |
| 3.11 | `email_winback` | [ ] |
| 3.12 | `sales_manager` | [ ] |
| 3.13 | `sales_ops` | [ ] |

### FASE 4: Templates P2/P3 (11 modos)

| # | mode_name | Status |
|---|-----------|--------|
| 4.1 | `bdr_partnerships` | [ ] |
| 4.2 | `data_enrichment` | [ ] |
| 4.3 | `webinar_host` | [ ] |
| 4.4 | `demo_specialist` | [ ] |
| 4.5 | `account_manager` | [ ] |
| 4.6 | `review_collector` | [ ] |
| 4.7 | `survey_bot` | [ ] |
| 4.8 | `churn_predictor` | [ ] |
| 4.9 | `qa_sales` | [ ] |
| 4.10 | `crm_hygiene` | [ ] |
| 4.11 | `competitive_intel` | [ ] |

### FASE 5: Dashboard

| # | Task | Status |
|---|------|--------|
| 5.1 | Tela lista clientes | [ ] |
| 5.2 | Tela config modos por cliente | [ ] |
| 5.3 | Tela metricas tempo real | [ ] |
| 5.4 | Tela editar templates | [ ] |
| 5.5 | Deploy automatizado | [ ] |

---

## DASHBOARD SPECS

### Tela Principal

```
┌─────────────────────────────────────────────────────────────────┐
│  AI FACTORY                                    [+ Novo Cliente] │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Clientes │ │ Modos    │ │ Conversas│ │ Conversao│           │
│  │    24    │ │  37      │ │   1.2k   │ │  23.4%   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Cliente         │ Agente │ Modos │ Score │ Status │ Acoes     │
│  ────────────────┼────────┼───────┼───────┼────────┼────────── │
│  Flavia Leal     │ Diana  │ 5/37  │ 97%   │ Ativo  │ [Config]  │
│  Isabella Amare  │ Julia  │ 7/37  │ 92%   │ Ativo  │ [Config]  │
│  Dra. Eline      │ Ana    │ 6/37  │ 95%   │ Ativo  │ [Config]  │
└─────────────────────────────────────────────────────────────────┘
```

### Tela Config Modos

```
┌─────────────────────────────────────────────────────────────────┐
│  CONFIGURAR: Flavia Leal Beauty School          [Salvar] [X]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AQUISICAO                              QUALIFICACAO            │
│  ┌─────────────────────────────┐       ┌─────────────────────┐ │
│  │ [x] social_seller           │       │ [x] sdr_inbound     │ │
│  │ [ ] cold_outreach           │       │ [ ] lead_scorer     │ │
│  │ [ ] sdr_outbound            │       │ [ ] data_enrichment │ │
│  │ [ ] linkedin_outreach       │       └─────────────────────┘ │
│  │ [ ] ads_responder           │                               │
│  │ [ ] chatbot_inbound         │       NUTRICAO                │
│  │ [ ] bdr_partnerships        │       ┌─────────────────────┐ │
│  └─────────────────────────────┘       │ [ ] email_nurture   │ │
│                                        │ [ ] email_marketing │ │
│  FECHAMENTO                            │ [ ] email_copy      │ │
│  ┌─────────────────────────────┐       │ [ ] webinar_host    │ │
│  │ [x] closer                  │       └─────────────────────┘ │
│  │ [x] objection_handler       │                               │
│  │ [ ] proposal_writer         │       AGENDAMENTO             │
│  └─────────────────────────────┘       ┌─────────────────────┐ │
│                                        │ [x] scheduler       │ │
│  POS-VENDA                             │ [ ] demo_specialist │ │
│  ┌─────────────────────────────┐       └─────────────────────┘ │
│  │ [x] concierge               │                               │
│  │ [ ] onboarder               │       RECUPERACAO             │
│  │ [ ] cs_manager              │       ┌─────────────────────┐ │
│  │ [ ] upseller                │       │ [x] followuper      │ │
│  │ [ ] account_manager         │       │ [x] reativador      │ │
│  │ [ ] referral_manager        │       │ [ ] collections     │ │
│  │ [ ] review_collector        │       │ [ ] email_winback   │ │
│  │ [ ] survey_bot              │       │ [ ] churn_predictor │ │
│  └─────────────────────────────┘       └─────────────────────┘ │
│                                                                 │
│  GESTAO                                                         │
│  ┌─────────────────────────────┐                               │
│  │ [ ] sales_manager           │                               │
│  │ [ ] sales_ops               │                               │
│  │ [ ] qa_sales                │                               │
│  │ [ ] crm_hygiene             │                               │
│  │ [ ] competitive_intel       │                               │
│  └─────────────────────────────┘                               │
│                                                                 │
│  Modos ativos: 8/37           Score estimado: 94%              │
│                                                                 │
│  [Preview Prompt]  [Testar Agente]  [Deploy]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ESTRUTURA prompts_by_mode

### Exemplo Real (Diana)

```json
{
  "prompts_by_mode": {
    "sdr_inbound": {
      "objetivo": "Qualificar leads inbound via BANT",
      "tom": "acolhedor",
      "fluxo": ["acolhimento", "discovery", "bant", "valor", "objecoes", "cta"],
      "max_mensagens": 10,
      "prompt": "# MODO: SDR INBOUND\n..."
    },
    "closer": {
      "objetivo": "Converter lead qualificado em venda",
      "tom": "confiante",
      "fluxo": ["retomar", "aprofundar_dor", "valor", "objecoes", "fechar"],
      "max_mensagens": 15,
      "prompt": "# MODO: CLOSER\n..."
    },
    "social_seller": {
      "objetivo": "Engajar via DM sem vender direto",
      "tom": "casual",
      "fluxo": ["conexao", "interesse", "transicao", "qualificacao", "cta_leve"],
      "max_mensagens": 5,
      "prompt": "# MODO: SOCIAL SELLER\n..."
    }
  },
  "tools_config": {
    "modos_ativos": ["sdr_inbound", "closer", "social_seller"],
    "enabled_tools": {
      "sdr_inbound": ["Busca_disponibilidade", "Escalar_humano"],
      "closer": ["Criar_link_pagamento", "Aplicar_desconto"],
      "social_seller": ["Enviar_material_gratuito", "Criar_lead_crm"]
    }
  }
}
```

---

## METRICAS POR MODO

| Modo | Metrica Principal | Target |
|------|-------------------|--------|
| `social_seller` | Taxa resposta DM | 40%+ |
| `cold_outreach` | Taxa abertura | 25%+ |
| `sdr_outbound` | Calls conectadas/dia | 15+ |
| `sdr_inbound` | Taxa qualificacao | 70%+ |
| `lead_scorer` | Precisao MQL | 80%+ |
| `email_nurture` | Taxa conversao | 5%+ |
| `scheduler` | Taxa comparecimento | 75%+ |
| `closer` | Taxa fechamento | 30%+ |
| `onboarder` | Ativacao 30d | 85%+ |
| `concierge` | CSAT | 4.5+ |
| `cs_manager` | NPS | 50+ |
| `upseller` | Taxa upsell | 15%+ |
| `followuper` | Taxa reativacao | 20%+ |
| `collections` | Taxa recuperacao | 40%+ |

---

## SQL - CRIAR TABELAS

### agent_templates

```sql
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(30) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  tools_template JSONB DEFAULT '{}',
  variables JSONB DEFAULT '[]',
  priority VARCHAR(2) DEFAULT 'P2',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias: acquisition, qualification, nurture, scheduling, closing, post_sale, recovery, management
```

### agent_mode_config

```sql
CREATE TABLE agent_mode_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agent_versions(id) ON DELETE CASCADE,
  mode_name VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  custom_overrides JSONB DEFAULT '{}',
  custom_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, mode_name)
);
```

### View: agent_full_config

```sql
CREATE VIEW agent_full_config AS
SELECT
  av.id,
  av.location_id,
  av.agent_name,
  ARRAY_AGG(amc.mode_name) FILTER (WHERE amc.enabled) as modos_ativos,
  COUNT(*) FILTER (WHERE amc.enabled) as total_modos,
  av.validation_score
FROM agent_versions av
LEFT JOIN agent_mode_config amc ON av.id = amc.agent_id
GROUP BY av.id;
```

---

## COMANDOS

### Criar template novo
```bash
# 1. Criar arquivo do template
vim templates/cold_outreach.json

# 2. Inserir no banco
curl -X POST "$SUPABASE_URL/rest/v1/agent_templates" \
  -d @templates/cold_outreach.json
```

### Habilitar modo para cliente
```bash
curl -X POST "$SUPABASE_URL/rest/v1/agent_mode_config" \
  -d '{"agent_id": "UUID", "mode_name": "cold_outreach", "enabled": true}'
```

### Rebuild prompts_by_mode
```bash
# Script que monta o JSON final
python scripts/rebuild_prompts.py --agent-id UUID
```

---

## REGRAS

1. **1 agente por location_id** - Nunca criar multiplos agentes
2. **Modos sao checkboxes** - Habilita/desabilita no dashboard
3. **Templates sao globais** - Compartilhados entre todos os clientes
4. **Overrides sao locais** - Customizacoes por cliente
5. **Score minimo 80%** - Nao deployar abaixo
6. **Framework CRITICS** - Todos os prompts seguem o padrao

---

## CHANGELOG

| Data | Versao | Mudanca |
|------|--------|---------|
| 2026-01-25 | v1.0 | Mapeamento inicial 37 funcoes |
| 2026-01-25 | v2.0 | Arquitetura correta prompts_by_mode |
