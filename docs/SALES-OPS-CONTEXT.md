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

## Como Continuar

```bash
# Na proxima sessao, dizer:
"Continua o Sales Ops Dashboard - implementa [secao X]"

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
