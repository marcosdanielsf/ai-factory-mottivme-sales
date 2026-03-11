# Requirements: Customer Journey Map v2.0

**Defined:** 2026-03-11
**Core Value:** Visibilidade total da jornada do cliente — da prospecao ate renovacao/churn — com tracking de cada touchpoint, owners claros, SLAs definidos e dashboard visual.

## v2.0 Requirements

### Data Pipeline

- [ ] **DATA-01**: Sistema sincroniza stage transitions dos 4 pipelines GHL para Supabase via n8n webhook, com dedup por (contact_id, stage_key, source_event_id)
- [ ] **DATA-02**: Tabela journey_events armazena eventos append-only com timestamptz, client_id, pipeline_id, stage_id, event_type, e metadata JSONB
- [ ] **DATA-03**: Backfill importa dados historicos dos 4 pipelines GHL (Prospects, Pre-Vendas, Sales Farming, CS/Retencao) para journey_events
- [ ] **DATA-04**: Funcao SQL business_hours_diff() calcula tempo util entre dois timestamps excluindo fins de semana e feriados (tabela business_calendar)

### Journey Map Visual

- [x] **MAP-01**: Usuario ve mapa visual ponta-a-ponta com todas as etapas da jornada do cliente (prospecao → qualificacao → reuniao → proposta → onboarding → ativo → renovacao)
- [x] **MAP-02**: Mapa mostra indicador de posicao de cada cliente ativo na jornada (em qual etapa esta, ha quanto tempo)
- [x] **MAP-03**: Cada etapa do mapa exibe configuracao editavel: owner responsavel, SLA em horas uteis, ferramentas usadas, descricao
- [ ] **MAP-04**: Tooltip ou painel lateral por etapa mostra metricas: conversion rate, tempo medio, volume atual, SLA compliance %

### Client Timeline

- [ ] **TIME-01**: Usuario pode ver timeline cronologica de todos os eventos/touchpoints de um cliente especifico (webhook recebido, stage change, mensagem enviada, agendamento)
- [ ] **TIME-02**: Timeline exibe indicadores visuais de SLA (verde = dentro do prazo, amarelo = proximo do limite, vermelho = breach)
- [ ] **TIME-03**: Sistema envia alerta (notificacao na UI + opcional webhook) quando SLA de uma etapa e violado para um cliente
- [ ] **TIME-04**: Modulo de onboarding checklist integrado com etapas configuradas e progresso por cliente (meta: onboarding <48h)

### Analytics Dashboard

- [ ] **ANAL-01**: Dashboard exibe diagrama Sankey mostrando fluxo de clientes entre etapas (volume de transicoes, com threshold minimo de 30 eventos)
- [ ] **ANAL-02**: Dashboard mostra drop-off rates por etapa (% de clientes que saem/churnam em cada ponto da jornada)
- [ ] **ANAL-03**: Dashboard mostra tempo medio por etapa com comparacao vs SLA definido (destaque visual quando acima do SLA)
- [ ] **ANAL-04**: Dashboard usa layout customizavel com widgets arrastáveis (react-grid-layout) — usuario pode reorganizar e redimensionar graficos

### Stage Editor

- [ ] **EDIT-01**: Usuario pode criar, editar, reordenar e deletar etapas da jornada via interface drag-and-drop
- [ ] **EDIT-02**: Cada etapa tem campos editaveis: nome, owner, SLA (horas uteis), ferramentas, descricao, cor, icone
- [ ] **EDIT-03**: Sistema calcula health score automatico por cliente baseado em: tempo na etapa vs SLA, quality_score das conversas (quando disponivel), responded rate, agendamentos realizados

---

## Future Requirements (v3.0+)

- Mapa de jornada por tipo de cliente (medico vs mentoria vs financeiro)
- Integracao com MindFlow boards (etapas como items de board)
- AI recommendations (sugestao de proxima acao por cliente)
- Multi-tenant journey maps (cada cliente do AI Factory define sua jornada)
- Benchmarks entre clientes (comparar performance)
- Attribution modeling (qual canal gera mais conversao por etapa)

## Out of Scope

| Feature                                | Reason                                           |
| -------------------------------------- | ------------------------------------------------ |
| Canvas/whiteboard journey designer     | Overengineering — lista/flow ordenado suficiente |
| Persona builder                        | Tool de UX design, nao operacional               |
| CRM replication                        | GHL e o CRM — nao duplicar dados de contato      |
| PDF export                             | Sem demanda imediata — screenshot funciona       |
| Emotional journey lanes                | Conceito de UX design, nao operacional           |
| Client portal (cliente ve sua jornada) | v3+ se houver demanda                            |
| Drag-and-drop template editor          | Stage editor simples e suficiente                |
| Direct GHL API calls from frontend     | Seguranca — tudo via n8n backend                 |
| Realtime on journey_events table       | Performance — usar Broadcast channel             |

## Traceability

| REQ-ID  | Phase    | Status  |
| ------- | -------- | ------- |
| DATA-01 | Phase 9  | Pending |
| DATA-02 | Phase 9  | Pending |
| DATA-03 | Phase 9  | Pending |
| DATA-04 | Phase 9  | Pending |
| MAP-01  | Phase 10 | Complete |
| MAP-02  | Phase 10 | Complete |
| MAP-03  | Phase 10 | Complete |
| MAP-04  | Phase 10 | Pending |
| TIME-01 | Phase 11 | Pending |
| TIME-02 | Phase 11 | Pending |
| TIME-03 | Phase 11 | Pending |
| TIME-04 | Phase 11 | Pending |
| ANAL-01 | Phase 12 | Pending |
| ANAL-02 | Phase 12 | Pending |
| ANAL-03 | Phase 12 | Pending |
| ANAL-04 | Phase 12 | Pending |
| EDIT-01 | Phase 13 | Pending |
| EDIT-02 | Phase 13 | Pending |
| EDIT-03 | Phase 13 | Pending |

## Requirement Stats

- **v2.0 Total:** 19 requirements
- **Categories:** 5 (Data Pipeline, Journey Map Visual, Client Timeline, Analytics Dashboard, Stage Editor)
- **High Complexity:** DATA-01 (GHL sync), ANAL-01 (Sankey), EDIT-03 (Health score)
- **Core Value Alignment:** DATA-01 + MAP-01 + MAP-02 = "Visibilidade total da jornada"
- **Gated Features:** ANAL-01 (min 30 eventos), EDIT-03 (reflection data quality)

---

_Requirements defined: 2026-03-11_
_Last updated: 2026-03-11 — traceability populated after roadmap creation_
