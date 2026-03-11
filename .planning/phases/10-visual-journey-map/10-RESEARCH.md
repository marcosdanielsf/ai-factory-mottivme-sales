# Phase 10: Visual Journey Map - Research

**Researched:** 2026-03-11
**Domain:** React swimlane UI + Supabase Realtime Broadcast + inline editing
**Confidence:** HIGH

## Summary

Phase 10 builds the Customer Journey Map visual page — a swimlane-style view showing 4 GHL pipelines as horizontal lanes, each stage as a column, and client position badges with SLA color coding. The data foundation (Phase 9) is complete: 5 tables, 2 views, 4291 events backfilled, and the `vw_cjm_pipeline_flow` view already provides aggregated stage-level data (contact_count, avg_hours_in_stage, sla_breach_count). The n8n Event Ingester (`qFtjOPffsnkktF3f`) is live and will push Broadcast events on stage transitions.

The implementation is pure frontend React + Supabase reads, following existing project patterns (SalesOps directory module, `useSupervisionRealtime` hook pattern, Tailwind v4, lucide-react icons, Recharts for any micro-charts). No new npm dependencies are needed — everything required is already installed. The only backend change is adding an RLS UPDATE policy on `cjm_stage_config` to enable inline editing from the frontend.

**Primary recommendation:** Build as a directory-based page module (`pages/CustomerJourney/`) with 6 custom hooks for data fetching, a Broadcast-based realtime hook (not postgres_changes per project decision), and a component tree of `JourneyCanvas > PipelineLane > StageColumn > ClientBadge + StageConfigPanel + StageMetricsPopover`.

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                      | Research Support                                                                                                                                                                   |
| ------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MAP-01 | Visual end-to-end map with all journey stages                                    | `vw_cjm_pipeline_flow` view provides pipeline_name, stage_name, stage_order, color — render as swimlane lanes with ordered stage columns                                           |
| MAP-02 | Position indicator for each active client (which stage, how long)                | `cjm_journey_state` table has contact_id, current_stage, entered_stage_at — join with stage_config for display; Broadcast channel for <30s updates                                 |
| MAP-03 | Editable stage config (owner, SLA, tools) inline                                 | `cjm_stage_config` table has all fields; needs new RLS UPDATE policy for authenticated role; use optimistic update pattern                                                         |
| MAP-04 | Tooltip/panel with metrics (conversion rate, avg time, volume, SLA compliance %) | `vw_cjm_pipeline_flow` already provides contact_count, avg_hours_in_stage, sla_breach_count, sla_warning_count; conversion rate calculated client-side from adjacent stage volumes |

</phase_requirements>

## Standard Stack

### Core (already installed)

| Library               | Version  | Purpose                            | Why Standard                             |
| --------------------- | -------- | ---------------------------------- | ---------------------------------------- |
| React                 | ^19.2.3  | UI framework                       | Project standard                         |
| @supabase/supabase-js | ^2.89.0  | Data fetching + Realtime Broadcast | Project standard, Broadcast API included |
| react-router-dom      | ^7.11.0  | HashRouter routing                 | Project standard                         |
| Tailwind CSS          | ^4.1.18  | Styling                            | Project standard (v4)                    |
| lucide-react          | ^0.562.0 | Icons                              | Project standard                         |
| recharts              | ^3.6.0   | Micro-charts in metrics panel      | Already installed                        |
| typescript            | ~5.8.2   | Type safety                        | Project standard                         |

### Supporting (already installed)

| Library                 | Version  | Purpose                        | When to Use                      |
| ----------------------- | -------- | ------------------------------ | -------------------------------- |
| fractional-indexing     | ^3.2.0   | Stage ordering (Phase 13)      | Not needed yet but available     |
| @tanstack/react-virtual | ^3.13.18 | Virtualization for large lists | Only if a stage has 100+ clients |

### Not Needed

| Library           | Reason                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| date-fns          | Not installed, not needed — `entered_stage_at` timestamps displayed via `Intl.DateTimeFormat` or simple math; business hours calculated server-side by `business_hours_diff()` |
| react-grid-layout | Phase 12 only (analytics dashboard)                                                                                                                                            |
| @dnd-kit          | Phase 13 only (stage editor drag-and-drop)                                                                                                                                     |

**Installation:** No new packages needed for Phase 10.

## Architecture Patterns

### Recommended Project Structure

```
apps/docs/src/
├── pages/CustomerJourney/
│   ├── index.tsx                    # Main page with tab router
│   ├── components/
│   │   ├── JourneyCanvas.tsx        # Swimlane container with pipeline tabs
│   │   ├── PipelineLane.tsx         # Single pipeline row
│   │   ├── StageColumn.tsx          # Single stage column with client badges
│   │   ├── ClientBadge.tsx          # Client position indicator
│   │   ├── SlaIndicator.tsx         # Green/amber/red dot
│   │   ├── StageConfigPanel.tsx     # Inline editor side panel
│   │   └── StageMetricsPopover.tsx  # Click/hover metrics display
│   └── hooks/                       # (optional: can go in src/hooks/)
├── hooks/
│   ├── useCjmPipelineMap.ts         # Reads vw_cjm_pipeline_flow
│   ├── useCjmClientPositions.ts     # Reads cjm_journey_state with contact names
│   ├── useCjmStageConfig.ts         # CRUD on cjm_stage_config
│   ├── useCjmSlaStatus.ts           # Reads vw_cjm_sla_status
│   ├── useCjmRealtime.ts            # Broadcast channel subscription
│   └── useCjmDropOff.ts             # Stub for Phase 12
└── types/cjm.ts                     # Already exists from Phase 9
```

### Pattern 1: Supabase Broadcast Realtime (NOT postgres_changes)

**What:** Subscribe to a named Broadcast channel where n8n pushes events after each stage transition INSERT.
**When to use:** CJM realtime updates (project decision: Broadcast for performance).
**Why:** postgres_changes on `cjm_events` would fire on every INSERT and requires RLS on the table. Broadcast is explicit — n8n only sends when relevant, lower overhead.

```typescript
// useCjmRealtime.ts
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface CjmBroadcastPayload {
  contact_id: string;
  pipeline_id: string;
  stage_key: string;
  from_stage: string | null;
  to_stage: string;
  occurred_at: string;
  contact_name?: string;
}

export const useCjmRealtime = (
  onStageChange: (payload: CjmBroadcastPayload) => void,
  enabled = true,
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbackRef = useRef(onStageChange);
  callbackRef.current = onStageChange;

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("cjm-events")
      .on("broadcast", { event: "stage_change" }, (payload) => {
        callbackRef.current(payload.payload as CjmBroadcastPayload);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled]);
};
```

**n8n side (already built in Event Ingester):** After the UPSERT into `cjm_journey_state`, the workflow must POST to Supabase Broadcast:

```
POST https://{project}.supabase.co/realtime/v1/api/broadcast
Authorization: Bearer {service_role_key}
Body: { "channel": "cjm-events", "event": "stage_change", "payload": {...} }
```

**GOTCHA:** The n8n Event Ingester (`qFtjOPffsnkktF3f`) currently does NOT broadcast. Plan 10-01 must add a Broadcast POST node to the ingester OR accept that Broadcast is a Phase 10 addition.

### Pattern 2: Tab Router within Page (SalesOps pattern)

**What:** `CustomerJourney/index.tsx` uses internal state for tab switching (Map / Analytics / SLA / Editor). No sub-routes needed — tabs are local state.
**When to use:** Following SalesOps pattern (single page, no URL-based tabs).

```typescript
// CustomerJourney/index.tsx
type CjmTab = "map" | "analytics" | "sla" | "editor";
const [activeTab, setActiveTab] = useState<CjmTab>("map");
```

**Alternative (URL tabs):** Use `useSearchParams` for `?tab=map`. Better for deep linking but adds complexity. Recommendation: simple state for now, upgrade to URL params in Phase 12 when analytics tab has value.

### Pattern 3: Pipeline Flow Data Hook

**What:** `useCjmPipelineMap` fetches `vw_cjm_pipeline_flow` grouped by pipeline_id, then transforms into a nested structure for rendering.

```typescript
// Shape for rendering
interface PipelineMapData {
  pipeline_id: string;
  pipeline_name: string;
  stages: Array<{
    stage_key: string;
    stage_name: string;
    stage_order: number;
    color: string | null;
    owner_name: string | null;
    sla_hours: number | null;
    contact_count: number;
    avg_hours_in_stage: number;
    sla_breach_count: number;
    sla_warning_count: number;
  }>;
}
```

### Pattern 4: Inline Stage Config Editing

**What:** Clicking a stage column opens `StageConfigPanel` (slide-over panel) with editable fields. Uses optimistic update pattern.
**RLS requirement:** Phase 9 only created SELECT policies. Phase 10 needs:

```sql
DROP POLICY IF EXISTS "auth update cjm_stage_config" ON cjm_stage_config;
CREATE POLICY "auth update cjm_stage_config"
  ON cjm_stage_config FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
```

**Optimistic update pattern:**

```typescript
const updateStageConfig = async (
  id: string,
  changes: Partial<CjmStageConfig>,
) => {
  // 1. Optimistic: update local state immediately
  setStages((prev) =>
    prev.map((s) => (s.id === id ? { ...s, ...changes } : s)),
  );

  // 2. Persist to Supabase
  const { error } = await supabase
    .from("cjm_stage_config")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id);

  // 3. Rollback on error
  if (error) {
    refetch(); // Re-read from DB
    showToast("Erro ao salvar configuracao", "error");
  }
};
```

### Pattern 5: SLA Color Coding

**What:** Three-color system based on `sla_status` field in `cjm_journey_state`.
**Colors (Tailwind v4):**

| Status  | Color | Tailwind Class                       | Condition                          |
| ------- | ----- | ------------------------------------ | ---------------------------------- |
| ok      | Green | `bg-emerald-500/20 text-emerald-400` | hours_in_stage < 80% of sla_hours  |
| warning | Amber | `bg-amber-500/20 text-amber-400`     | hours_in_stage >= 80% of sla_hours |
| breach  | Red   | `bg-red-500/20 text-red-400`         | hours_in_stage > sla_hours         |

**Note:** `sla_status` is already in `cjm_journey_state` from Phase 9, but it is NOT updated automatically yet (that is Phase 11 — n8n hourly SLA checker). For Phase 10, compute color client-side from `entered_stage_at` and `sla_hours`.

### Anti-Patterns to Avoid

- **DO NOT use postgres_changes for CJM realtime** — project decision is Broadcast channel only (performance)
- **DO NOT call GHL API from frontend** — all writes go through n8n; frontend is read-only except cjm_stage_config UPDATE
- **DO NOT fetch cjm_events directly for the map** — use `vw_cjm_pipeline_flow` (aggregated) and `cjm_journey_state` (current positions); events are for timeline (Phase 11)
- **DO NOT add date-fns** — not installed, not needed; use native `Date` / `Intl.DateTimeFormat` for display
- **DO NOT build drag-and-drop for stages** — that is Phase 13 (EDIT-01); Phase 10 is view + inline config edit only
- **DO NOT build SLA alerts** — that is Phase 11 (TIME-03); Phase 10 only shows color indicators

## Don't Hand-Roll

| Problem                | Don't Build                | Use Instead                                                         | Why                              |
| ---------------------- | -------------------------- | ------------------------------------------------------------------- | -------------------------------- |
| Time formatting        | Custom date formatter      | `Intl.RelativeTimeFormat` or simple "Xh Ym" math                    | Native browser API, no deps      |
| SLA color mapping      | Complex conditional logic  | Simple lookup object `{ ok: '...', warning: '...', breach: '...' }` | 3 states only                    |
| Realtime subscriptions | Custom WebSocket           | `supabase.channel().on('broadcast')`                                | Already in @supabase/supabase-js |
| Tab routing            | react-router nested routes | `useState<CjmTab>`                                                  | SalesOps pattern, simpler        |
| Stage aggregation      | Client-side reduce         | `vw_cjm_pipeline_flow` SQL view                                     | Already computed server-side     |
| Business hours         | Client-side calculation    | `business_hours_diff()` SQL function                                | Already built in Phase 9         |

## Common Pitfalls

### Pitfall 1: Broadcast Channel Not Configured in n8n

**What goes wrong:** Frontend subscribes to `cjm-events` Broadcast channel but n8n Event Ingester never sends Broadcast messages — map appears frozen.
**Why it happens:** Phase 9 Event Ingester was built before Broadcast was needed. It inserts into `cjm_events` and upserts `cjm_journey_state` but does not POST to Supabase Broadcast API.
**How to avoid:** Plan 10-01 MUST include adding a Broadcast POST node to the existing n8n Event Ingester workflow (`qFtjOPffsnkktF3f`). Alternatively, use polling with `setInterval(refetch, 30000)` as fallback until the Broadcast node is added.
**Warning signs:** Map loads correctly on first render but never updates when GHL stages change.

### Pitfall 2: RLS Blocks Inline Editing

**What goes wrong:** `useCjmStageConfig` UPDATE calls return 403/RLS error because Phase 9 only created SELECT policies.
**Why it happens:** Phase 9 schema was designed for read-only frontend. Phase 10 adds inline editing.
**How to avoid:** Add UPDATE RLS policy on `cjm_stage_config` in Plan 10-01 (schema additions).
**Warning signs:** Config changes appear to save (optimistic update) but revert on refetch.

### Pitfall 3: Contact Names Not in CJM Tables

**What goes wrong:** `cjm_journey_state` has `contact_id` but no contact name. The map shows IDs instead of names.
**Why it happens:** CJM tables store GHL contact_id only — names live in GHL. No local contact lookup table in Supabase.
**How to avoid:** Two options:

1. Store `contact_name` in `cjm_events.metadata` during ingestion (n8n already has the name from GHL webhook payload)
2. Create a lightweight `cjm_contacts` lookup table or reuse `cjm_events.metadata->>'contact_name'` via a view
   **Recommendation:** Add `contact_name` to `cjm_journey_state` as a denormalized column (simplest, no joins needed). Update the n8n Ingester to extract name from GHL webhook payload and include it in the UPSERT.

### Pitfall 4: vw_cjm_pipeline_flow Performance with business_hours_diff()

**What goes wrong:** View calls `business_hours_diff()` for every row in `cjm_journey_state` on every query — O(N \* days) per row.
**Why it happens:** The function iterates day-by-day to exclude weekends/holidays.
**How to avoid:** For Phase 10 with ~4300 rows this is fine (<1s). Monitor query time. If slow, add a materialized column or cache `avg_hours_in_stage` on a schedule.
**Warning signs:** CustomerJourney page load > 2s.

### Pitfall 5: SLA Status Not Yet Updated by n8n

**What goes wrong:** All clients show green SLA indicators even when they should be warning/breach.
**Why it happens:** Phase 11 builds the hourly SLA checker that updates `cjm_journey_state.sla_status`. Without it, `sla_status` stays at default 'ok'.
**How to avoid:** In Phase 10, compute SLA status client-side: compare `entered_stage_at` with current time using simple wall-clock hours (not business hours — that is imprecise but good enough for visual indicators). Accept this as a Phase 10 limitation; Phase 11 will make it accurate with business hours.
**Warning signs:** All SLA dots are green.

### Pitfall 6: Only MOTTIVME Dev Has Data

**What goes wrong:** Other client locations show empty maps.
**Why it happens:** Backfill found data only in MOTTIVME Dev location. Other clients (Gabriela, Amare, Carolina) have 0 pipeline opportunities.
**How to avoid:** Show graceful empty state: "Nenhum dado de pipeline encontrado para esta localizacao". The `useCjmPipelineMap` hook should handle empty results without crashing.
**Warning signs:** Blank page for non-MOTTIVME locations.

## Code Examples

### Swimlane Layout (CSS Grid with Tailwind v4)

```tsx
// JourneyCanvas.tsx — simplified structure
const JourneyCanvas: React.FC<{ data: PipelineMapData[] }> = ({ data }) => {
  const [selectedPipeline, setSelectedPipeline] = useState(0);
  const pipeline = data[selectedPipeline];

  return (
    <div>
      {/* Pipeline tabs */}
      <div className="flex gap-2 mb-4">
        {data.map((p, i) => (
          <button
            key={p.pipeline_id}
            onClick={() => setSelectedPipeline(i)}
            className={`px-3 py-1.5 rounded-md text-sm ${
              i === selectedPipeline
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-hover"
            }`}
          >
            {p.pipeline_name}
          </button>
        ))}
      </div>

      {/* Swimlane */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {pipeline?.stages
          .sort((a, b) => a.stage_order - b.stage_order)
          .map((stage) => (
            <StageColumn key={stage.stage_key} stage={stage} />
          ))}
      </div>
    </div>
  );
};
```

### Client Badge Component

```tsx
// ClientBadge.tsx
const ClientBadge: React.FC<{
  contactName: string;
  hoursInStage: number;
  slaHours: number | null;
}> = ({ contactName, hoursInStage, slaHours }) => {
  const slaStatus = computeSlaStatus(hoursInStage, slaHours);

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded bg-bg-secondary text-sm">
      <SlaIndicator status={slaStatus} />
      <span className="truncate max-w-[120px]">{contactName}</span>
      <span className="text-text-muted text-xs">
        {formatDuration(hoursInStage)}
      </span>
    </div>
  );
};

function computeSlaStatus(
  hours: number,
  slaHours: number | null,
): CjmSlaStatus {
  if (!slaHours) return "ok";
  if (hours > slaHours) return "breach";
  if (hours >= slaHours * 0.8) return "warning";
  return "ok";
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
```

### Stage Metrics Popover

```tsx
// StageMetricsPopover.tsx
const StageMetricsPopover: React.FC<{ stage: StageFlowData }> = ({ stage }) => {
  const slaCompliance =
    stage.contact_count > 0
      ? (
          ((stage.contact_count - stage.sla_breach_count) /
            stage.contact_count) *
          100
        ).toFixed(0)
      : "100";

  return (
    <div className="absolute z-20 bg-bg-primary border border-border-default rounded-lg shadow-lg p-4 w-64">
      <h4 className="font-medium text-sm mb-3">{stage.stage_name}</h4>
      <div className="space-y-2 text-sm">
        <MetricRow label="Volume atual" value={stage.contact_count} />
        <MetricRow
          label="Tempo medio"
          value={`${stage.avg_hours_in_stage.toFixed(1)}h`}
        />
        <MetricRow label="SLA compliance" value={`${slaCompliance}%`} />
        <MetricRow
          label="Em breach"
          value={stage.sla_breach_count}
          warn={stage.sla_breach_count > 0}
        />
      </div>
    </div>
  );
};
```

### Lazy-loaded Route in App.tsx

```tsx
// In App.tsx — add alongside MindFlow pattern
const CustomerJourney = React.lazy(() => import("./pages/CustomerJourney"));

// In Routes:
<Route
  path="/customer-journey"
  element={
    <ProtectedRoute>
      <Layout>
        <React.Suspense
          fallback={<div className="p-8 text-text-muted">Loading...</div>}
        >
          <CustomerJourney />
        </React.Suspense>
      </Layout>
    </ProtectedRoute>
  }
/>;
```

## State of the Art

| Old Approach                      | Current Approach                              | When Changed        | Impact                           |
| --------------------------------- | --------------------------------------------- | ------------------- | -------------------------------- |
| postgres_changes for all realtime | Broadcast for custom events                   | Supabase 2.x (2024) | Lower overhead, explicit control |
| Separate realtime library         | Built into @supabase/supabase-js              | Always              | No extra dep needed              |
| date-fns for date display         | Intl.DateTimeFormat / Intl.RelativeTimeFormat | Browser native      | Zero bundle cost                 |
| Tailwind v3 @apply                | Tailwind v4 native CSS                        | Project migrated    | No `@apply` in v4                |

## Open Questions

1. **Contact names in journey state**
   - What we know: `cjm_journey_state` only has `contact_id`, no name
   - What's unclear: Best approach to get names — denormalize in table vs. join via events metadata vs. separate lookup
   - Recommendation: Add `contact_name TEXT` column to `cjm_journey_state` and populate from n8n webhook payload during UPSERT. Simplest approach, no joins.

2. **n8n Broadcast POST node**
   - What we know: Event Ingester exists (`qFtjOPffsnkktF3f`) but does not send Broadcast messages
   - What's unclear: Whether to modify existing workflow or use a polling fallback
   - Recommendation: Add HTTP Request node to Event Ingester that POSTs to Supabase Broadcast API after UPSERT. Include in Plan 10-01 as a prerequisite task.

3. **Conversion rate calculation**
   - What we know: MAP-04 requires "conversion rate" per stage
   - What's unclear: Conversion rate definition — percentage advancing to next stage vs. percentage reaching final stage
   - Recommendation: Define as `contacts_who_advanced / total_contacts_who_entered_stage`. Calculate client-side from `cjm_events` grouped by (from_stage, to_stage) counts. OR add a SQL view `vw_cjm_stage_conversion`. Simpler: use `vw_cjm_pipeline_flow.contact_count` of current stage vs. next stage as proxy.

## Sources

### Primary (HIGH confidence)

- Project files: `apps/docs/src/App.tsx`, `apps/docs/src/hooks/useSupervisionRealtime.ts`, `apps/docs/src/components/Sidebar.tsx` — existing patterns
- Project files: `apps/docs/src/types/cjm.ts` — Phase 9 TypeScript types
- Project files: `.planning/phases/09-foundation/sql/09-migration.sql` — Phase 9 schema
- Project files: `apps/docs/package.json` — installed dependencies
- [Supabase Broadcast docs](https://supabase.com/docs/guides/realtime/broadcast) — channel API

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — project decisions (Broadcast over postgres_changes, n8n as only write path)
- `.planning/REQUIREMENTS.md` — MAP-01 through MAP-04 definitions

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - all libraries already installed, patterns well-established in codebase
- Architecture: HIGH - follows existing SalesOps/MindFlow module patterns, types already defined
- Pitfalls: HIGH - identified from direct codebase inspection (missing RLS, missing contact names, missing Broadcast node)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable — no moving targets, all deps pinned)
