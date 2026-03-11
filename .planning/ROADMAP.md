# Roadmap: Customer Journey Map v2.0

## Overview

Customer Journey Map v2.0 delivers full visibility into the MOTTIVME client journey — from prospecting to renewal/churn — by syncing 4 GHL pipelines into Supabase, rendering a live visual journey map, tracking per-client timelines with SLA monitoring, and surfacing analytics including Sankey flow and drop-off rates. The roadmap is strictly sequenced: data pipeline before UI, timeline before analytics, analytics before enrichment features.

> **Note on v1.0 MindFlow:** Phases 1–8 were planned for MindFlow (project management boards). Phase 1 is complete (schema, types, column registry, hooks, routes). Phases 2–8 are pending and paused. This roadmap starts at Phase 9 and covers v2.0 only. MindFlow phases 1–8 are preserved in git history and can resume after v2.0 ships.

---

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (created via `/gsd:insert-phase`)
- v1.0 MindFlow: Phases 1–8 (Phase 1 complete; Phases 2–8 paused)
- v2.0 Customer Journey Map: Phases 9–13

- [ ] **Phase 9: Foundation** - Supabase schema, SQL functions, TypeScript types, n8n event ingestion pipeline, GHL backfill
- [ ] **Phase 10: Visual Journey Map** - CustomerJourney page, 4-pipeline tabs, live client positions, stage config, SLA color coding, Realtime
- [ ] **Phase 11: Client Timeline + SLA Monitor** - Per-client event timeline, SLA breach indicators, alerts, onboarding checklist
- [ ] **Phase 12: Analytics Dashboard + Sankey** - Drop-off rates, time-in-stage, Sankey flow chart, resizable widget dashboard
- [ ] **Phase 13: Stage Editor + Health Score** - Drag-and-drop stage editor, health score computation, AI agent activity overlay

---

## Phase Details

### Phase 9: Foundation

**Goal**: Live GHL pipeline events flow into Supabase with idempotency, timestamptz discipline, and business hours calculation — enabling every downstream phase to read reliable data
**Depends on**: Nothing (first v2.0 phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):

1. Sending an identical GHL webhook payload twice inserts exactly one row in `cjm_events` (idempotency via unique constraint on `contact_id, stage_key, source_event_id`)
2. A stage transition in any of the 4 GHL pipelines (Prospects, Pre-Vendas, Sales Farming, CS/Retencao) appears in `cjm_events` within 30 seconds
3. Historical GHL pipeline data for all 4 active clients (MOTTIVME, Dra. Gabriela, Instituto Amare, Dra. Carolina) exists in `cjm_events` after backfill completes (churned clients Alberto and Eline excluded — queryable by `location_id`)
4. `SELECT business_hours_diff('2026-03-07 18:00:00+03', '2026-03-09 09:00:00+03')` returns the correct business-hours count excluding the weekend
   **Plans**: 2 plans

Plans:

- [x] 09-01-PLAN.md — Supabase schema (5 tabelas + business_calendar, 2 views, RLS, business_hours_diff() SQL function) + TypeScript types em apps/docs/src/types/cjm.ts
- [x] 09-02-PLAN.md — n8n CJM Event Ingester (live GHL webhook → idempotent INSERT) + CJM Backfill (bulk histórico 4 pipelines × 4 clientes com rate limiting)

### Phase 10: Visual Journey Map

**Goal**: Users see where every active client is across all 4 pipelines in real time, with SLA color coding and stage-level metrics on demand
**Depends on**: Phase 9
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04
**Success Criteria** (what must be TRUE):

1. User opens the Customer Journey page and sees a horizontal lane for each of the 4 pipelines, with every stage of that pipeline displayed as a column
2. Each pipeline column shows the names and current-stage duration of all active clients positioned there (updated within 30 seconds of a GHL stage transition)
3. Each stage column displays its configured owner, SLA threshold, and tools — all editable inline — without navigating away from the map
4. Clicking or hovering on a stage reveals a panel with conversion rate, average time, current volume, and SLA compliance percentage drawn from Supabase views
   **Plans**: 2 plans

Plans:

- [ ] 10-01-PLAN.md — Data layer: 4 useCjm\* hooks (PipelineMap, ClientPositions, StageConfig, Realtime), page shell with tab router, lazy route in App.tsx, sidebar entry, RLS UPDATE policy SQL
- [ ] 10-02-PLAN.md — Visual components: JourneyCanvas, PipelineLane, StageColumn, ClientBadge, SlaIndicator (swimlane renderer), StageConfigPanel (inline editing), StageMetricsPopover (metrics on hover)

### Phase 11: Client Timeline + SLA Monitor

**Goal**: Users can drill into any client's full event history and act on SLA breaches before they escalate
**Depends on**: Phase 10
**Requirements**: TIME-01, TIME-02, TIME-03, TIME-04
**Success Criteria** (what must be TRUE):

1. Selecting a client on the journey map opens a timeline showing every event (stage change, message sent, appointment) in chronological order with timestamps and time-in-stage durations
2. Each timeline event is color-coded: green (within SLA), amber (within 20% of breach), red (SLA breached) — calculated using `business_hours_diff()` not wall-clock time
3. When a client's stage time exceeds the configured SLA, a notification appears in the UI within the next hourly SLA check cycle (max 60 minutes delay)
4. The onboarding checklist for each new client (VTX Playbook 6 steps) shows completion status per step, and the current completion percentage is visible on the journey map
   **Plans**: TBD

Plans:

- [ ] 11-01: `TouchpointTimeline.tsx` (per-client ordered event list with icons, durations, SLA color indicators), `SlaMonitor.tsx` (breach table sorted by hours overdue, querying `vw_cjm_sla_status`), `useCjmSlaStatus` hook
- [ ] 11-02: n8n hourly SLA checker workflow (UPDATE `cjm_journey_state.sla_status` + trigger Supabase Broadcast on breach), onboarding checklist component (`OnboardingChecklist.tsx`) with VTX Playbook steps per client

### Phase 12: Analytics Dashboard + Sankey

**Goal**: Users see where clients drop off and how long each stage takes — with a resizable widget dashboard they can arrange to their preference
**Depends on**: Phase 11
**Requirements**: ANAL-01, ANAL-02, ANAL-03, ANAL-04
**Success Criteria** (what must be TRUE):

1. When `cjm_events` has 30 or more stage transition events, the Sankey flow chart renders showing volume of client movement between stages; below 30 events a "collecting data" placeholder is shown instead
2. The analytics tab shows a bar chart of drop-off rate per stage (percentage of clients who exited the pipeline at that point rather than advancing)
3. Each stage displays average time-in-stage alongside its SLA threshold — stages where average time exceeds SLA are highlighted in red
4. User can drag and resize dashboard widgets and the layout persists across sessions (stored in Supabase `user_preferences` JSONB)
   **Plans**: TBD

Plans:

- [ ] 12-01: `vw_cjm_drop_off` Supabase view, `AnalyticsDashboard.tsx` with drop-off rate bar chart + time-in-stage chart (Recharts), `SankeyFlow.tsx` (Recharts `<Sankey>` wrapper with 30-event threshold guard and empty state)
- [ ] 12-02: `react-grid-layout ^2.2.2` resizable widget grid (hooks API `useGridLayout`), layout persistence in `user_preferences` JSONB, CSS scoped with Tailwind `@layer` to prevent cascade conflicts with Tailwind v4

### Phase 13: Stage Editor + Health Score

**Goal**: Users can reconfigure the journey map without code, and each client has an automatic health score surfacing risk before it becomes churn
**Depends on**: Phase 12
**Requirements**: EDIT-01, EDIT-02, EDIT-03
**Success Criteria** (what must be TRUE):

1. User can drag stage cards to reorder them in the Stage Editor and the visual map reflects the new order immediately (fractional-indexing for stable order)
2. User can create a new stage, rename an existing one, set its owner, SLA, tools, color, and icon — all changes save without page reload
3. Each active client has a health score (0–100) visible on the journey map that reflects: percentage of SLA time used, responded rate from `n8n_schedule_tracking`, and appointment completion rate (quality_score included when `agent_conversation_reflections` data is non-null; excluded with a UI note when NULL)
   **Plans**: TBD

Plans:

- [ ] 13-01: `StageEditor.tsx` with `@dnd-kit/sortable` horizontal drag-and-drop + `useCjmStageEditor.ts` mutations (CREATE, UPDATE, REORDER, DELETE stage configs)
- [ ] 13-02: Health score SQL function + `HealthScoreBadge.tsx` component (conditional: includes `quality_score` when populated, shows "limited data" badge when NULL), data audit step (confirm `agent_conversation_reflections.quality_score` coverage) must run before formula is finalized

---

## Progress

**Execution Order:**
Phases execute strictly in sequence: 9 → 10 → 11 → 12 → 13
Phase 9 is the unblockable prerequisite — no UI phase can start before the data pipeline is live.
Phase 12 and Phase 13 can be parallelized after Phase 11 is complete if velocity allows.

| Phase                             | Plans Complete | Status      | Completed  |
| --------------------------------- | -------------- | ----------- | ---------- |
| 9. Foundation                     | 2/2            | Complete    | 2026-03-11 |
| 10. Visual Journey Map            | 0/2            | Planned     | -          |
| 11. Client Timeline + SLA Monitor | 0/2            | Not started | -          |
| 12. Analytics Dashboard + Sankey  | 0/2            | Not started | -          |
| 13. Stage Editor + Health Score   | 0/2            | Not started | -          |

---

_Roadmap created: 2026-03-11_
_Milestone: v2.0 Customer Journey Map_
_Coverage: 19/19 requirements mapped_
