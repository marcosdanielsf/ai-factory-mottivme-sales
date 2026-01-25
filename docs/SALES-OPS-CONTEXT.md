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

### Campos disponiveis em `growth_leads`:

| Secao | Campos | Descricao |
|-------|--------|-----------|
| **Pipeline de Valor** | `proposal_value`, `proposal_status`, `proposal_sent_at`, `conversion_value` | Valor total em propostas, taxa aceite |
| **BANT Score** | `bant_budget_score`, `bant_authority_score`, `bant_need_score`, `bant_timeline_score`, `bant_total_score` | Grafico radar qualificacao |
| **Temperatura** | `lead_temperature`, `lead_score`, `icp_score` | Pizza quentes/mornos/frios |
| **Reunioes** | `meeting_scheduled_at`, `meeting_show_status`, `total_meetings` | Taxa show-up |
| **Perdas** | `lost_at`, `lost_reason`, `lost_competitor` | Top motivos + concorrentes |
| **Resposta** | `response_time_avg_hours`, `total_messages_sent`, `total_messages_received` | Tempo medio resposta |
| **ROI Canal** | `source_channel`, `source_campaign` | Performance por origem |

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
