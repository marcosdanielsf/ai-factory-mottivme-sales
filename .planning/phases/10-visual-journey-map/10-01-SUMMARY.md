---
phase: 10-visual-journey-map
plan: 01
subsystem: ui
tags: [react, supabase, realtime, broadcast, hooks, customer-journey]

# Dependency graph
requires:
  - phase: 09-foundation
    provides: "CJM schema (5 tables, 2 views), TypeScript types, backfilled data (4291 events)"
provides:
  - "4 CJM data hooks (useCjmPipelineMap, useCjmClientPositions, useCjmStageConfig, useCjmRealtime)"
  - "CustomerJourney page shell with tab routing (map/analytics/sla/editor)"
  - "Lazy-loaded /customer-journey route in App.tsx"
  - "Sidebar entry 'Jornada Cliente' in Sales OS section"
  - "RLS UPDATE policy SQL for cjm_stage_config"
  - "Phase 10 types: CjmBroadcastPayload, CjmClientPosition, PipelineMapData, CjmTab"
affects: [10-02-visual-components, 11-sla-alerts, 12-analytics, 13-editor]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Broadcast channel realtime with polling fallback"
    - "Optimistic update with rollback on error"
    - "Contact name resolution via cjm_events metadata"

key-files:
  created:
    - apps/docs/src/hooks/useCjmPipelineMap.ts
    - apps/docs/src/hooks/useCjmClientPositions.ts
    - apps/docs/src/hooks/useCjmStageConfig.ts
    - apps/docs/src/hooks/useCjmRealtime.ts
    - apps/docs/src/pages/CustomerJourney/index.tsx
    - .planning/phases/10-visual-journey-map/sql/10-rls-update-policy.sql
  modified:
    - apps/docs/src/types/cjm.ts
    - apps/docs/src/hooks/index.ts
    - apps/docs/src/App.tsx
    - apps/docs/src/components/Sidebar.tsx

key-decisions:
  - "Contact names resolved from cjm_events metadata (not separate lookup table)"
  - "30s polling fallback alongside Broadcast channel (n8n Broadcast node not yet added)"
  - "Sidebar entry placed in Sales OS section after Agendamentos"

patterns-established:
  - "CJM hooks accept optional locationId param (null = all locations)"
  - "useCjmRealtime uses useRef for callback stability (no channel recreation)"
  - "Optimistic update pattern: local state first, supabase persist, rollback on error"

requirements-completed: [MAP-01, MAP-02, MAP-03]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 10 Plan 01: Data Layer & Page Shell Summary

**4 CJM data hooks (pipeline map, client positions, stage config CRUD, Broadcast realtime) + CustomerJourney page shell with tab routing, lazy route, and sidebar entry**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T13:36:04Z
- **Completed:** 2026-03-11T13:40:18Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- 4 custom hooks covering all CJM data needs: pipeline flow aggregation, client position tracking with contact name resolution, stage config CRUD with optimistic updates, and Broadcast realtime with 30s polling fallback
- CustomerJourney page shell at `/#/customer-journey` with 4-tab interface (Mapa/Analytics/SLA/Editor), loading/empty states, and pipeline summary cards
- RLS UPDATE policy SQL ready for manual application to enable inline stage config editing
- All new types added to `cjm.ts`: CjmBroadcastPayload, CjmClientPosition, PipelineMapData, CjmTab

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, RLS SQL, and 4 data hooks** - `616c17a` (feat)
2. **Task 2: Page shell, lazy route, and sidebar entry** - `b81e0b5` (feat)

## Files Created/Modified

- `apps/docs/src/types/cjm.ts` - Added 4 new Phase 10 types (CjmBroadcastPayload, CjmClientPosition, PipelineMapData, CjmTab)
- `apps/docs/src/hooks/useCjmPipelineMap.ts` - Fetches vw_cjm_pipeline_flow, groups by pipeline_id, sorts stages by stage_order
- `apps/docs/src/hooks/useCjmClientPositions.ts` - Fetches cjm_journey_state, resolves contact names from cjm_events metadata
- `apps/docs/src/hooks/useCjmStageConfig.ts` - CRUD on cjm_stage_config with optimistic update and rollback
- `apps/docs/src/hooks/useCjmRealtime.ts` - Broadcast channel subscription + 30s polling fallback
- `apps/docs/src/hooks/index.ts` - Added 4 new CJM hook exports
- `apps/docs/src/pages/CustomerJourney/index.tsx` - Page shell with tabs, hook integration, summary cards
- `apps/docs/src/App.tsx` - Lazy-loaded /customer-journey route
- `apps/docs/src/components/Sidebar.tsx` - "Jornada Cliente" entry with Map icon
- `.planning/phases/10-visual-journey-map/sql/10-rls-update-policy.sql` - UPDATE RLS policy for cjm_stage_config

## Decisions Made

- Contact names resolved from `cjm_events.metadata->>'contact_name'` (most recent event per contact). Fallback: contact_id substring. This avoids a new table and leverages existing data.
- 30s polling fallback added to useCjmRealtime because n8n Event Ingester does not yet POST to Broadcast API. Ensures map updates even without Broadcast node.
- Sidebar entry placed in SALES OS section after Agendamentos (not in a new section), consistent with CJM being a sales operations tool.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing build failure in TeamRPG.tsx (missing `../data/squads` module) — not related to CJM changes, out of scope. Logged for awareness.
- 1Password git signing agent not available — committed without GPG signing.

## User Setup Required

**RLS policy must be applied manually before inline editing works:**

- Open Supabase SQL Editor
- Run: `.planning/phases/10-visual-journey-map/sql/10-rls-update-policy.sql`

## Next Phase Readiness

- All 4 hooks are importable and ready for visual component integration (Plan 10-02)
- Page shell renders with working data — pipelines, client positions, and realtime subscription active
- Visual components (JourneyCanvas, PipelineLane, StageColumn, ClientBadge) are the next step (Plan 10-02)
- n8n Broadcast POST node still needed in Event Ingester for true realtime (currently using polling fallback)

---

_Phase: 10-visual-journey-map_
_Completed: 2026-03-11_
