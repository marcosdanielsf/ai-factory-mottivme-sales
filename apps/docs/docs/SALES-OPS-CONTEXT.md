# Sales Ops Dashboard - Contexto para Continuacao

> Atualizado: 2026-01-25 02:38 BRT

## Status Atual

### MVP Implementado ✅

**Deploy:** https://front-factorai-mottivme-sales-o5zqourc0.vercel.app/#/sales-ops

**Arquivos criados:**
```
src/lib/supabase-sales-ops.ts          # DAO com todas as queries
src/pages/SalesOps/index.tsx           # Pagina principal
src/pages/SalesOps/components/
  ├── ClientSelector.tsx               # Dropdown filtro por cliente
  ├── OverviewCards.tsx                # 4 cards de metricas
  ├── FunnelChart.tsx                  # Grafico barras horizontal
  ├── ActivityChart.tsx                # Grafico linhas 30 dias
  └── ConversionTable.tsx              # Tabela taxa desistencia
```

**Views SQL (Supabase):**
- `vw_sales_ops_overview` - Metricas agregadas por location
- `vw_follow_up_funnel` - Distribuicao por etapa FU
- `vw_leads_prontos_follow_up` - Leads aguardando contato
- `vw_conversao_por_etapa` - Ativos vs desativados por etapa
- `vw_atividade_diaria` - Mensagens e leads por dia

**Commit:** f38ea00

---

## Expansao Planejada (PENDENTE)

### IMPORTANTE: Validacao de Dados (2026-01-25)

**Campos COM dados (podem ser implementados):**
| Campo | Dados Encontrados |
|-------|-------------------|
| `funnel_stage` | "lead" (108), "lead_novo" (392) |
| `source_channel` | apify_scraping (84), cnpj_search (2), doctoralia (14) |
| `lead_temperature` | Todos "cold" (sem variacao) |

**Campos SEM dados (aguardar fluxo de vendas popular):**
| Campo | Status |
|-------|--------|
| `bant_*_score` | Todos = 0 |
| `proposal_value` | Nenhum registro |
| `meeting_scheduled_at` | Nenhum registro |
| `lost_reason`, `lost_competitor` | Nenhum registro |
| `converted_at`, `conversion_value` | Nenhum registro |

### O que PODE ser implementado agora:

| Secao | Campos | Descricao |
|-------|--------|-----------|
| **ROI por Canal** | `source_channel` | Leads por origem (apify, doctoralia, cnpj) |
| **Funil Real** | `funnel_stage` | Distribuicao lead vs lead_novo |

### O que precisa de DADOS primeiro (n8n/GHL popular):

| Secao | Campos | Bloqueio |
|-------|--------|----------|
| **Pipeline de Valor** | `proposal_value`, `proposal_status` | Campos vazios |
| **BANT Score** | `bant_*_score` | Todos zerados |
| **Temperatura** | `lead_temperature` | Todos "cold" (sem variacao) |
| **Reunioes** | `meeting_scheduled_at`, `meeting_show_status` | Campos vazios |
| **Perdas** | `lost_reason`, `lost_competitor` | Campos vazios |

---

---

## LISTA COMPLETA DE ACOES PENDENTES

### SECAO 1: METRICAS JA DISPONIVEIS (implementar no Dashboard)

| # | Acao | Fonte | Dados |
|---|------|-------|-------|
| 1.1 | Adicionar metricas FUU por location | `fuu_metrics_by_location` | pending_count, completed_count, responded_count, failed_count, response_rate |
| 1.2 | Adicionar grafico de status FUU | `fuu_queue` | pending (499), completed (1) |
| 1.3 | Adicionar ROI por canal | `growth_leads.source_channel` | apify_scraping (84), cnpj_search (2), doctoralia (14) |
| 1.4 | Adicionar distribuicao funnel_stage | `growth_leads.funnel_stage` | lead (108), lead_novo (392) |

### SECAO 2: VIEWS SQL A CRIAR

| # | Acao | Descricao |
|---|------|-----------|
| 2.1 | Criar view `vw_fuu_dashboard` | Agregar fuu_metrics_by_location com nome do cliente |
| 2.2 | Criar view `vw_leads_por_canal` | Agrupar growth_leads por source_channel |
| 2.3 | Criar view `vw_leads_por_stage` | Agrupar growth_leads por funnel_stage |

### SECAO 3: COMPONENTES FRONTEND A CRIAR

| # | Acao | Descricao |
|---|------|-----------|
| 3.1 | FUUMetricsCards.tsx | Cards: Pendentes, Completados, Taxa Resposta |
| 3.2 | FUUStatusChart.tsx | Grafico pizza: pending vs completed vs responded |
| 3.3 | LeadsByChannelChart.tsx | Grafico barras: Leads por canal de origem |
| 3.4 | LeadsByStageChart.tsx | Grafico funil: lead_novo -> lead |

### SECAO 4: INTEGRACOES DAO

| # | Acao | Descricao |
|---|------|-----------|
| 4.1 | Adicionar `getFUUMetrics()` no DAO | Query fuu_metrics_by_location |
| 4.2 | Adicionar `getLeadsByChannel()` no DAO | Query growth_leads agrupado |
| 4.3 | Adicionar `getLeadsByStage()` no DAO | Query growth_leads agrupado |

### SECAO 5: DADOS QUE PRECISAM SER POPULADOS (n8n/GHL)

| # | Acao | Campos | Responsavel |
|---|------|--------|-------------|
| 5.1 | Popular BANT scores | bant_*_score | Workflow de qualificacao |
| 5.2 | Popular propostas | proposal_value, proposal_status | Workflow de vendas |
| 5.3 | Popular reunioes | meeting_scheduled_at, meeting_show_status | Workflow de calendario |
| 5.4 | Popular perdas | lost_at, lost_reason, lost_competitor | Workflow de feedback |
| 5.5 | Popular temperatura | lead_temperature (variacao) | Workflow de scoring |

### SECAO 6: AJUSTES NO DASHBOARD ATUAL

| # | Acao | Descricao |
|---|------|-----------|
| 6.1 | Refatorar cores para CSS vars | Trocar #1a1a1a -> bg-bg-primary |
| 6.2 | Filtro cliente em todas metricas | Atualmente so filtra tabela conversao |
| 6.3 | Adicionar loading skeleton | Melhorar UX durante carregamento |

---

## Views Existentes Descobertas

### fuu_metrics_by_location (JA EXISTE NO SUPABASE)
```sql
SELECT
  location_id,
  follow_up_type,
  pending_count,      -- Leads aguardando FU
  completed_count,    -- FUs completados
  responded_count,    -- Leads que responderam
  failed_count,       -- FUs que falharam
  response_rate       -- Taxa de resposta %
FROM fuu_metrics_by_location;
```

**Dados atuais:**
- Bgi2hFMgiLLoRlOO0K5b: 465 pending
- sNwLyynZWP6jEtBy1ubf: 692 pending
- EKHxHl3KLPN0iRc69GNU: 168 pending
- Total na fuu_queue: 499 pending, 1 completed

---

## Como Continuar

```bash
# Na proxima sessao, dizer:
"Continua o Sales Ops Dashboard - implementa secao [1/2/3/4/5/6]"

# Ou buscar contexto no RAG:
/ms search "sales-ops dashboard"
```

## Decisoes Tecnicas

- **Cores:** Componentes usam cores hardcoded (#1a1a1a, #333) em vez de CSS vars (bg-bg-primary)
  - Funciona mas inconsistente com resto do app
  - Considerar refatorar para usar CSS vars do Tailwind

- **Filtro cliente:** Funciona mas views agregam TODOS os clientes por padrao
  - Quando seleciona cliente, filtra apenas na tabela de conversao
  - Considerar filtrar em todas as metricas

- **Recharts:** Ja instalado (v3.6.0), funciona bem

## Referencia: ai-factory-agents

Documentacao adicional em:
```
/Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/
├── docs/MAPA_TABELAS_FUU.md     # Mapa de todas tabelas FUU
├── migrations/fuu_schema_v1.sql  # Schema completo FUU
└── sql/                          # Scripts SQL diversos
```
