---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Customer Journey Map
status: executing
last_updated: "2026-03-11"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 10
  completed_plans: 3
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Visibilidade total da jornada do cliente — da prospecao ate renovacao/churn — com tracking de cada touchpoint, owners claros, SLAs definidos e dashboard visual.
**Current focus:** Phase 10 — Visual Journey Map (data layer + page shell)

## Current Position

Phase: 10 (Visual Journey Map) — In Progress
Plan: 10-01 (data layer + page shell) DONE, 10-02 (visual components) PENDING
Status: Plan 10-01 complete. 4 hooks, page shell, route, sidebar entry created.
Last activity: 2026-03-11 — Plan 10-01 executed (4 hooks, CustomerJourney page, RLS SQL)

Progress: [███░░░░░░░] 30%

Phase 9 complete. Phase 10 plan 01 done. 3/10 plans done.

## Performance Metrics

| Metric       | Value |
| ------------ | ----- |
| Plans done   | 3/10  |
| Phases done  | 0/5   |
| Requirements | 19    |
| Coverage     | 100%  |

## Accumulated Context

### Decisions

- [v2.0]: Customer Journey Map como novo milestone, pausando MindFlow v1.0
- [v2.0]: 5 fases (9-13), numeracao continuando apos MindFlow phases 1-8
- [v2.0]: n8n e o UNICO write path — React e read-only (sem chamadas diretas ao GHL)
- [v2.0]: Supabase Realtime via Broadcast channel, NAO postgres_changes (performance)
- [v2.0]: Max 4 tabelas (cjm_stage_config, cjm_events, cjm_journey_state, cjm_touchpoints) — evitar over-normalization
- [v2.0]: ANAL-01 (Sankey) gated em minimo 30 eventos — placeholder ate threshold
- [v2.0]: EDIT-03 (health score) condicional — quality_score incluido quando nao-NULL, badge "limited data" quando NULL
- [v2.0]: timestamptz everywhere — nunca timestamp sem timezone
- [v2.0]: business_hours_diff() com named timezone 'America/Sao_Paulo' (nao offset '-03:00')
- [v2.0]: Idempotencia UNIQUE constraint em (contact_id, stage_key, source_event_id) — nao negociavel
- [v2.0]: recharts upgrade 3.6→3.8 necessario (Sankey stability + React 19 compat)
- [10-01]: Contact names via cjm_events metadata (nao tabela separada)
- [10-01]: Polling fallback 30s no useCjmRealtime (n8n Broadcast node pendente)
- [10-01]: Sidebar "Jornada Cliente" na secao Sales OS apos Agendamentos

### Pending Todos

- ~~Verificar 4 pipeline IDs do GHL contra conta live antes de executar backfill~~ DONE (apenas MOTTIVME Dev tem opps; outros clientes = 0)
- Confirmar se date-fns ja foi instalado no MindFlow Phase 1 (evitar reinstalar)
- Configurar credenciais Postgres/Gemini no n8n workflow YlCtmyzCtGu2SmEx (reflection loop) — prerequesito para EDIT-03 health score com quality_score
- Auditoria de cobertura agent_conversation_reflections.quality_score antes de Phase 13

### Blockers/Concerns

- MindFlow v1.0 pausado na Fase 1/8 — retomar apos v2.0 completo
- agent_conversation_reflections.quality_score = NULL na maioria dos registros (credenciais n8n nao configuradas)
- GHL webhooks sem retry logic em 5xx — idempotencia critica; testar replay antes de ativar
- GOTCHA n8n: verificar \! em Code nodes apos qualquer PUT via API (reincidencia 4x)

## Session Continuity

Last session: 2026-03-11
Stopped at: Completed 10-01-PLAN.md (data layer + page shell). 4 hooks, CustomerJourney page, lazy route, sidebar entry.
Next action: `/gsd:execute-phase 10` plan 10-02 (visual components: JourneyCanvas, PipelineLane, StageColumn, ClientBadge)

### Phase 9 Artifacts

- SQL migration: `.planning/phases/09-foundation/sql/09-migration.sql` (aplicada)
- TypeScript types: `apps/docs/src/types/cjm.ts` (8 exports)
- n8n Event Ingester: `qFtjOPffsnkktF3f` (ATIVO, webhook: `/webhook/cjm-event-ingester`)
- n8n Backfill: `TQBwvXUsyKySyRyG` (inativo, manual trigger)

### Phase 9 Gotchas Discovered

- Webhook `responseMode` deve ser `responseNode` (nao `lastNode`) quando usa Respond to Webhook node
- Postgres node quebra cadeia de dados — UPSERT precisa referenciar `$('Node anterior').first().json` em vez de `$json`
- n8n API POST rejeita campo `tags` (read-only) — remover antes de importar
