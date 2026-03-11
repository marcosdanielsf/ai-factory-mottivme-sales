# Phase 9: Foundation - Research

**Researched:** 2026-03-11
**Domain:** Supabase schema (PostgreSQL DDL, RLS, views, SQL functions) + n8n event ingestion workflows (GHL webhook → idempotent INSERT)
**Confidence:** HIGH

---

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                                                    | Research Support                                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| DATA-01 | Sistema sincroniza stage transitions dos 4 pipelines GHL para Supabase via n8n webhook, com dedup por (contact_id, stage_key, source_event_id) | Idempotency via UNIQUE constraint; GHL webhook trigger pattern; n8n Postgres node INSERT pattern documented               |
| DATA-02 | Tabela journey_events armazena eventos append-only com timestamptz, client_id, pipeline_id, stage_id, event_type, e metadata JSONB             | Full cjm_events schema with all required columns; timestamptz everywhere; composite indexes for performance               |
| DATA-03 | Backfill importa dados historicos dos 4 pipelines GHL (Prospects, Pre-Vendas, Sales Farming, CS/Retencao) para journey_events                  | GHL GET /opportunities bulk pattern; rate-limit strategy (batches of 20, 2s delay); 4 pipeline IDs verified in PROJECT.md |
| DATA-04 | Funcao SQL business_hours_diff() calcula tempo util entre dois timestamps excluindo fins de semana e feriados (tabela business_calendar)       | Full plpgsql function pattern with America/Sao_Paulo named timezone; business_calendar seed data approach documented      |

</phase_requirements>

---

## Summary

Phase 9 is the data foundation that every downstream phase depends on. It has two deliverables: (1) a Supabase migration creating 4 CJM tables, 2 views, RLS policies, the `business_hours_diff()` SQL function, and TypeScript types; and (2) two n8n workflows — a live GHL webhook ingester and a bulk backfill for historical data.

The highest-risk element is the n8n ingestion workflow. GHL "Workflow Inbound Webhook" triggers (the pattern MOTTIVME uses) have no retry on 5xx responses — only 429 triggers a retry. This makes idempotency non-negotiable from day one. The unique constraint on `(contact_id, stage_key, source_event_id)` must be in the migration so that replayed or duplicate webhooks silently become no-ops. The `occurred_at` timestamp must come from the webhook payload, not `now()` — n8n processes with 1-5s delay.

The business hours function requires named timezone `'America/Sao_Paulo'` (not offset `'-03:00'`) because Brasilia observes DST with date-specific rules. All timestamp columns must be `timestamptz` — this cannot be retrofitted cheaply after the fact. The schema decisions made in this phase lock in the data integrity model for all 4 downstream phases.

**Primary recommendation:** Write the migration SQL first, test it against Supabase directly (Management API or psql), then build the n8n workflows pointing to the verified schema. Never write n8n Code nodes with `!` in string literals — check after every PUT via API.

---

## Standard Stack

### Core (Phase 9 specific)

| Library / Tool            | Version | Purpose                                        | Why Standard                                       |
| ------------------------- | ------- | ---------------------------------------------- | -------------------------------------------------- |
| Supabase JS               | ^2.89.0 | Already installed — TypeScript type generation | Project standard; already in package.json          |
| PostgreSQL (via Supabase) | 15.x    | DDL, views, plpgsql functions, RLS             | Single DB in project — bfumywvwubvernvhjehk        |
| n8n (self-hosted)         | current | GHL webhook ingestion + backfill workflows     | Only write path for all GHL data per v2.0 decision |
| GHL REST API v2           | v2      | GET /opportunities for backfill                | v1 deprecated; v2 pipeline endpoints verified      |

### Supporting

| Library                     | Version  | Purpose                          | When to Use                                                         |
| --------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------- |
| date-fns                    | ^3.6.0   | TypeScript-side SLA display math | Client-side duration display only — SQL does authoritative SLA math |
| @supabase/supabase-js types | auto-gen | Type-safe cjm.ts domain types    | After migration applied — run type gen against REST OpenAPI         |

### What Is NOT Needed in Phase 9

| Avoid                       | Reason                                                       |
| --------------------------- | ------------------------------------------------------------ |
| @dnd-kit                    | UI library — Phase 10+ only                                  |
| react-grid-layout           | Analytics UI — Phase 12 only                                 |
| recharts upgrade            | UI dependency — Phase 12 only                                |
| Any new npm package install | Phase 9 is pure backend (SQL + n8n) — no frontend code ships |

**Phase 9 installs nothing new.** It only applies a Supabase migration and creates n8n workflows.

---

## Architecture Patterns

### Recommended Schema Structure

```
Supabase public schema — new CJM tables:

cjm_stage_config       — pipeline/stage definitions, owners, SLA thresholds, order
cjm_events             — append-only event log (idempotency constraint here)
cjm_journey_state      — denormalized current state per contact/pipeline (fast SLA queries)
cjm_touchpoints        — visual touchpoint catalog per stage (for editor in Phase 13)
business_calendar      — holiday/non-business-day table for business_hours_diff()

Views:
vw_cjm_pipeline_flow   — stage-level aggregates (contact counts, avg hours, SLA breach counts)
vw_cjm_sla_status      — breach/warning contacts with hours_overdue

Function:
business_hours_diff(ts_start, ts_end, tz, work_start, work_end) → interval
```

### Pattern 1: Idempotent INSERT via Unique Constraint + ON CONFLICT DO NOTHING

**What:** The `cjm_events` table has a UNIQUE constraint on `(contact_id, stage_key, source_event_id)`. The n8n INSERT uses `ON CONFLICT DO NOTHING`. Duplicate GHL webhooks (from retries or replays) silently insert zero rows.

**When to use:** All stage_change event INSERTs from the live ingestion workflow.

**Example (Postgres node in n8n — NOTE: n8n Postgres nodes use template literals, NOT $1/$2):**

```sql
INSERT INTO cjm_events (
  location_id, contact_id, pipeline_id, stage_key,
  from_stage, to_stage, event_type, source_event_id,
  metadata, occurred_at
) VALUES (
  '{{ $json.location_id }}',
  '{{ $json.contact_id }}',
  '{{ $json.pipeline_id }}',
  '{{ $json.stage_key }}',
  NULLIF('{{ $json.from_stage }}', 'NULL'),
  '{{ $json.to_stage }}',
  'stage_change',
  '{{ $json.source_event_id }}',
  '{{ $json.metadata }}'::jsonb,
  '{{ $json.occurred_at }}'::timestamptz
)
ON CONFLICT (contact_id, stage_key, source_event_id) DO NOTHING;
```

**Critical:** `NULLIF(..., 'NULL')` is mandatory for all nullable string values coming from n8n GetInfo nodes. n8n serializes null as the string `"NULL"`.

### Pattern 2: UPSERT for cjm_journey_state (current position)

**What:** After inserting the event, n8n UPSERTs `cjm_journey_state` with the new current stage. This maintains the denormalized "where is this contact right now" row used by `vw_cjm_pipeline_flow` and SLA queries.

**Example:**

```sql
INSERT INTO cjm_journey_state (
  location_id, contact_id, pipeline_id, current_stage,
  entered_stage_at, sla_status, last_event_at
) VALUES (
  '{{ $json.location_id }}',
  '{{ $json.contact_id }}',
  '{{ $json.pipeline_id }}',
  '{{ $json.to_stage }}',
  '{{ $json.occurred_at }}'::timestamptz,
  'ok',
  '{{ $json.occurred_at }}'::timestamptz
)
ON CONFLICT (location_id, contact_id, pipeline_id)
DO UPDATE SET
  current_stage    = EXCLUDED.current_stage,
  entered_stage_at = EXCLUDED.entered_stage_at,
  sla_status       = 'ok',
  last_event_at    = EXCLUDED.last_event_at,
  updated_at       = now();
```

### Pattern 3: RLS Policy — DROP + CREATE (no IF NOT EXISTS)

**What:** PostgreSQL does NOT support `CREATE POLICY IF NOT EXISTS`. The idempotent pattern is `DROP POLICY IF EXISTS` + `CREATE POLICY`.

**Example:**

```sql
ALTER TABLE cjm_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read cjm_events" ON cjm_events;
CREATE POLICY "Authenticated read cjm_events"
  ON cjm_events FOR SELECT TO authenticated USING (true);

-- n8n uses service_role key -- bypasses RLS automatically, no write policy needed
```

### Pattern 4: business_hours_diff() using generate_series

**What:** SQL function using `generate_series` to enumerate business days between two timestamps, filtering weekends and rows in `business_calendar` (holidays). Returns interval.

**Example (complete implementation):**

```sql
CREATE OR REPLACE FUNCTION business_hours_diff(
  ts_start   timestamptz,
  ts_end     timestamptz,
  tz         text    DEFAULT 'America/Sao_Paulo',
  work_start time    DEFAULT '09:00',
  work_end   time    DEFAULT '18:00'
) RETURNS numeric AS $$
DECLARE
  v_start    timestamptz;
  v_end      timestamptz;
  v_hours    numeric := 0;
  v_day      date;
  v_day_start timestamptz;
  v_day_end   timestamptz;
  v_overlap_start timestamptz;
  v_overlap_end   timestamptz;
BEGIN
  -- Normalize: always start <= end
  IF ts_start > ts_end THEN
    RETURN 0;
  END IF;

  -- Enumerate each calendar day in the range
  FOR v_day IN
    SELECT generate_series(
      (ts_start AT TIME ZONE tz)::date,
      (ts_end   AT TIME ZONE tz)::date,
      '1 day'::interval
    )::date
  LOOP
    -- Skip weekends
    IF EXTRACT(DOW FROM v_day) IN (0, 6) THEN CONTINUE; END IF;
    -- Skip holidays
    IF EXISTS (SELECT 1 FROM business_calendar WHERE calendar_date = v_day AND is_holiday = true) THEN
      CONTINUE;
    END IF;

    -- Business window for this day in target timezone
    v_day_start := (v_day + work_start) AT TIME ZONE tz;
    v_day_end   := (v_day + work_end)   AT TIME ZONE tz;

    -- Clamp to ts_start/ts_end
    v_overlap_start := GREATEST(ts_start, v_day_start);
    v_overlap_end   := LEAST(ts_end,   v_day_end);

    IF v_overlap_end > v_overlap_start THEN
      v_hours := v_hours + EXTRACT(EPOCH FROM (v_overlap_end - v_overlap_start)) / 3600.0;
    END IF;
  END LOOP;

  RETURN v_hours;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Test case (from success criteria):**

```sql
SELECT business_hours_diff('2026-03-07 18:00:00+03', '2026-03-09 09:00:00+03');
-- Saturday 2026-03-07 18:00 BRT = after business hours Friday (Sat = DOW 6)
-- Sunday 2026-03-09 09:00 BRT actually needs re-checking: 2026-03-09 is a Monday
-- Expected: 0 hours (Saturday = weekend, Sunday = weekend, arrives at work_start on Monday)
-- NOTE: verify the exact expected return value against the phase success criteria before running
```

### Pattern 5: n8n Workflow — 1 Workflow, 1 Concern

**What:** The live ingestion workflow does exactly 3 things: validate the GHL webhook payload, deduplicate via ON CONFLICT, insert. Nothing else. No SLA checking. No alerts. No enrichment. Those are separate workflows.

**Node sequence for live ingestion workflow:**

```
Webhook Trigger (GHL pipeline stage change)
  → Set: extract contact_id, pipeline_id, from_stage, to_stage, occurred_at from payload
  → Code: build stage_key ('pipeline_id.to_stage'), source_event_id (deliveryId header or hash)
  → Postgres: INSERT cjm_events ON CONFLICT DO NOTHING
  → Postgres: UPSERT cjm_journey_state
  → Respond to Webhook: HTTP 200
```

Max 8 nodes. Split if it grows beyond 15.

### Pattern 6: Bulk Backfill Workflow (rate-limited)

**What:** One-time (or nightly) n8n workflow that GETs all opportunities from the 4 GHL pipelines for each of the 6 clients, and seeds `cjm_events` + `cjm_journey_state` with current/historical state.

**Node sequence:**

```
Manual Trigger (or Schedule)
  → Set: define pipeline IDs array + client location_id array
  → SplitInBatches (size=1): loop per client
    → HTTP Request: GET /opportunities?pipelineId=...&locationId=...&limit=100 (GHL v2)
    → Wait: 2000ms (rate limit guard)
    → SplitInBatches (size=20): loop per opportunity batch
      → Wait: 500ms between batches
      → Code: transform opportunity to cjm_events row
      → Postgres: INSERT cjm_events ON CONFLICT DO NOTHING
      → Postgres: UPSERT cjm_journey_state
```

**Critical:** Never use nested `splitInBatches` directly — the outer loop per client must complete before inner processing starts. Chain sequentially, not in parallel GHL requests.

### Anti-Patterns to Avoid

- **Using `timestamp` instead of `timestamptz`:** Cannot be retrofitted cheaply — SLA math breaks across DST boundaries. Every CJM column must be `timestamptz`.
- **Putting `occurred_at = now()` in n8n:** n8n processes webhooks with 1-5s lag. Use the timestamp from the webhook payload for accurate SLA tracking.
- **CREATE TABLE with serial/int PK:** Use `UUID PRIMARY KEY DEFAULT gen_random_uuid()` — consistent with all existing tables in this project.
- **DDL via Supabase REST API:** REST API = DML only. CREATE TABLE / ALTER TABLE requires Management API (`sbp_` token) or psql direct. Use the Supabase dashboard SQL editor or psql for the migration.
- **Inline GHL PIT tokens in n8n Code nodes:** Store in n8n credentials. Workflow export reveals hardcoded secrets.
- **Running backfill and live ingestion simultaneously against the same location:** Risk of hitting GHL rate limits and creating duplicate events.

---

## Don't Hand-Roll

| Problem                  | Don't Build                                                         | Use Instead                                                                           | Why                                                                                             |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Idempotency logic        | Custom dedup queries checking for existing rows before INSERT       | UNIQUE constraint + ON CONFLICT DO NOTHING                                            | Database-level constraint is atomic; custom check has TOCTOU race condition                     |
| Business hours math      | Interval arithmetic `(ts_end - ts_start) * 0.42`                    | `business_hours_diff()` plpgsql function                                              | Edge cases: DST transitions, holiday mid-week, partial business days                            |
| Timezone-aware SLA       | Storing SLA deadline as computed `deadline_at` column               | Compute fresh from `business_hours_diff()` at query time                              | Holiday rules change — stored deadline becomes stale immediately                                |
| GHL webhook dedup        | Tracking processed `deliveryId` in a separate table                 | UNIQUE on `(contact_id, stage_key, source_event_id)` — `source_event_id` = deliveryId | One constraint covers all replay scenarios without extra table maintenance                      |
| Current stage derivation | Scanning `cjm_events` ORDER BY occurred_at DESC LIMIT 1 per contact | `cjm_journey_state` denormalized table, UPSERTed per transition                       | cjm_events will grow to thousands of rows; scanning per contact kills SLA dashboard performance |

**Key insight:** The database does the hard work. n8n just validates the shape and executes the SQL.

---

## Common Pitfalls

### Pitfall 1: n8n PUT Re-Compiles Code Nodes — Introducing `\!`

**What goes wrong:** Any `PUT /workflows/{id}` via the n8n API re-compiles all Code nodes. If any Code node has `!` in a string (e.g., `'stage_entered!'` or a comment), n8n's task runner sees `\!` (escaped bang) and times out silently after 300s.

**Why it happens:** n8n's JavaScript execution environment under `--exec-mode=worker` treats unescaped `!` in certain string contexts as a shell operator escape. Four documented reincidences: 09/03, 09/03, 10/03, 13/03.

**How to avoid:**

1. After every PUT via n8n API, read back the Code node source and check for `\!`
2. Fix: replace `\!` with `!` in the Code node content via UI (not API)
3. Never include `!` in Code node strings or comments
4. Test in n8n UI execution before activating

**Warning signs:** Workflow execution starts but never completes. n8n task runner log shows 300s timeout. No error in execution log — just a stuck/pending execution.

### Pitfall 2: GHL Webhook `message` Field Is an Object, Not a String

**What goes wrong:** GHL webhook bodies sometimes pass `message` as `{ type, body }` not as a plain string. Code that does `payload.message.toLowerCase()` throws `TypeError: .toLowerCase is not a function` and the workflow crashes.

**How to avoid:**

```javascript
const msg =
  typeof payload.message === "object" ? payload.message.body : payload.message;
const msgLower = (msg || "").toLowerCase();
```

Always guard. Log the raw payload on first test run before writing any field access.

### Pitfall 3: Supabase Management API 403 (Cloudflare Block)

**What goes wrong:** `api.supabase.com` sometimes returns HTTP 403 error 1010 (Cloudflare). DDL migrations fail silently.

**How to avoid:** Apply the migration via the Supabase dashboard SQL editor directly, or via psql:

```
psql postgres://postgres.bfumywvwubvernvhjehk:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

The Supabase dashboard SQL editor is the recommended path for Phase 9 DDL.

### Pitfall 4: `CREATE POLICY IF NOT EXISTS` Does Not Exist in PostgreSQL

**What goes wrong:** Migration fails with syntax error. PostgreSQL has no `IF NOT EXISTS` for `CREATE POLICY`.

**How to avoid:** Always use:

```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...;
```

### Pitfall 5: n8n Postgres Node — Zero Rows Break the Chain

**What goes wrong:** A Postgres SELECT that returns 0 rows terminates the workflow execution at that node. All downstream nodes receive no items and silently do nothing.

**How to avoid:** Set `alwaysOutputData: true` on all SELECT/query nodes in n8n. Required for any node where 0-row result is a valid outcome.

### Pitfall 6: GHL Backfill 429 Rate Limits Are Permanent for PIT Tokens

**What goes wrong:** Burst rate exceeded → GHL returns 429 → n8n workflow fails → contacts are not backfilled → `cjm_journey_state` is incomplete → Phase 10 journey map shows empty stages.

**Why it matters:** Unlike Marketplace OAuth tokens (which have documented retry windows), PIT tokens have undocumented rate limits that are generally more permissive but may have stricter burst limits. A 429 from a PIT token does NOT guarantee automatic retry.

**How to avoid:**

- Process in batches of 20 contacts maximum per GHL API call
- Add explicit 2-second Wait node between batches
- Run backfill for one client at a time (manual trigger per location_id)
- Never run backfill and live ingestion workflow simultaneously

### Pitfall 7: Wrong FOREIGN KEY on cjm_touchpoints Breaks the Migration

**What goes wrong:** `cjm_touchpoints` references `cjm_stage_config(location_id, pipeline_id, stage_id)` as a composite FK. This requires a UNIQUE constraint on that combination in `cjm_stage_config`. If the UNIQUE constraint is missing, the FK creation fails and the migration errors out mid-run.

**How to avoid:** Ensure `cjm_stage_config` has `UNIQUE(location_id, pipeline_id, stage_id)` before the `cjm_touchpoints` FK definition. Run migration in a single transaction so it rolls back cleanly on failure.

---

## Code Examples

### Complete `cjm_events` Table DDL

```sql
-- Source: ARCHITECTURE.md + Phase 9 spec (2026-03-11)
CREATE TABLE cjm_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     TEXT NOT NULL,
  contact_id      TEXT NOT NULL,
  pipeline_id     TEXT NOT NULL,
  stage_key       TEXT NOT NULL,           -- e.g. 'zay1uZBOKpheJKFlk2Il.stage_abc123'
  from_stage      TEXT,                    -- NULL for pipeline entry
  to_stage        TEXT NOT NULL,
  event_type      TEXT NOT NULL            -- CLOSED LIST: see below
    CHECK (event_type IN ('stage_change', 'sla_breached', 'touchpoint_fired', 'journey_completed', 'manual_note')),
  source_event_id TEXT,                    -- GHL deliveryId header for dedup
  metadata        JSONB,
  occurred_at     TIMESTAMPTZ NOT NULL,    -- from webhook payload, NOT now()
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, stage_key, source_event_id)
);

CREATE INDEX cjm_events_location_contact
  ON cjm_events(location_id, contact_id);
CREATE INDEX cjm_events_location_pipeline_time
  ON cjm_events(location_id, pipeline_id, occurred_at DESC);
CREATE INDEX cjm_events_stage_key
  ON cjm_events(location_id, stage_key, occurred_at DESC);
```

**Event type closed list (exactly 5 — never expand without updating CHECK constraint):**

1. `stage_change` — contact moves between pipeline stages (primary event type)
2. `sla_breached` — time in stage exceeded SLA threshold (written by scheduled n8n workflow)
3. `touchpoint_fired` — a defined touchpoint occurred (appointment, proposal sent, etc.)
4. `journey_completed` — contact reached terminal stage (won or churned)
5. `manual_note` — human operator logged an observation

### TypeScript Types for `types/cjm.ts`

```typescript
// Source: Phase 9 schema spec — file to create at apps/docs/src/types/cjm.ts

export type CjmEventType =
  | "stage_change"
  | "sla_breached"
  | "touchpoint_fired"
  | "journey_completed"
  | "manual_note";

export type CjmSlaStatus = "ok" | "warning" | "breach";

export interface CjmEvent {
  id: string;
  location_id: string;
  contact_id: string;
  pipeline_id: string;
  stage_key: string;
  from_stage: string | null;
  to_stage: string;
  event_type: CjmEventType;
  source_event_id: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string; // ISO timestamptz string
  created_at: string;
}

export interface CjmStageConfig {
  id: string;
  location_id: string;
  pipeline_id: string;
  pipeline_name: string;
  stage_id: string;
  stage_name: string;
  stage_order: number;
  color: string | null;
  owner_name: string | null;
  tools: string[] | null;
  sla_hours: number | null;
  is_active: boolean;
  created_at: string;
}

export interface CjmJourneyState {
  id: string;
  location_id: string;
  contact_id: string;
  pipeline_id: string;
  current_stage: string;
  entered_stage_at: string;
  sla_status: CjmSlaStatus;
  last_event_at: string | null;
  updated_at: string;
}

export interface CjmPipelineFlowRow {
  location_id: string;
  pipeline_id: string;
  pipeline_name: string;
  current_stage: string;
  stage_name: string;
  stage_order: number;
  color: string | null;
  owner_name: string | null;
  sla_hours: number | null;
  contact_count: number;
  avg_hours_in_stage: number;
  sla_breach_count: number;
  sla_warning_count: number;
}
```

### n8n Code Node: Build stage_key and source_event_id

```javascript
// Code node in the live ingestion workflow
// Source: Phase 9 spec (2026-03-11)
// WARNING: Do NOT use ! in strings — check for \! after any PUT via API

const body = $input.first().json;
const headers = $input.first().headers || {};

// GHL delivers dedup ID in X-Webhook-Delivery-Id or similar header
const sourceEventId =
  headers["x-webhook-delivery-id"] ||
  headers["x-ghl-signature"] ||
  [body.contact_id, body.pipeline_id, body.stage_id, body.occurred_at].join(
    "|",
  );

// stage_key = pipeline_id.stage_id — unique identifier for a position in a pipeline
const stageKey = `${body.pipeline_id}.${body.stage_id}`;

return [
  {
    json: {
      location_id: body.location_id || body.locationId,
      contact_id: body.contact_id || body.contactId,
      pipeline_id: body.pipeline_id || body.pipelineId,
      stage_key: stageKey,
      from_stage: body.old_stage_id || body.previousStageId || null,
      to_stage: body.stage_id || body.newStageId,
      occurred_at: body.dateAdded || new Date().toISOString(),
      source_event_id: sourceEventId,
      metadata: JSON.stringify({
        raw_event_type: body.type,
        opportunity_id: body.opportunity_id || body.id,
      }),
    },
  },
];
```

### business_calendar Seed (Brazil 2026 National Holidays)

```sql
-- Source: Brazilian national holidays 2026 (HIGH confidence — fixed-date + calculated)
CREATE TABLE IF NOT EXISTS business_calendar (
  calendar_date DATE PRIMARY KEY,
  description   TEXT NOT NULL,
  is_holiday    BOOLEAN DEFAULT true
);

INSERT INTO business_calendar (calendar_date, description) VALUES
  ('2026-01-01', 'Confraternizacao Universal'),
  ('2026-04-03', 'Sexta-Feira Santa'),
  ('2026-04-21', 'Tiradentes'),
  ('2026-05-01', 'Dia do Trabalho'),
  ('2026-06-04', 'Corpus Christi'),
  ('2026-09-07', 'Independencia do Brasil'),
  ('2026-10-12', 'Nossa Senhora Aparecida'),
  ('2026-11-02', 'Finados'),
  ('2026-11-15', 'Proclamacao da Republica'),
  ('2026-12-25', 'Natal')
ON CONFLICT (calendar_date) DO NOTHING;
```

---

## State of the Art

| Old Approach                                  | Current Approach                           | Impact                                                   |
| --------------------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `timestamp` columns for events                | `timestamptz` everywhere                   | Correct DST-aware SLA math                               |
| Offset `-03:00` for São Paulo                 | Named timezone `'America/Sao_Paulo'`       | Handles DST date-specific rules                          |
| GHL v1 API for opportunities                  | GHL v2 REST `/opportunities`               | v1 deprecated, no new fixes                              |
| `CREATE POLICY IF NOT EXISTS` (non-existent)  | `DROP POLICY IF EXISTS` + `CREATE POLICY`  | Idempotent migration pattern                             |
| `continueOnFail: true` top-level in n8n       | `onError: 'continueRegularOutput'`         | Valid n8n property name                                  |
| `$1/$2` parameterized queries in n8n Postgres | Template literals `'{{ $json.campo }}'`    | n8n Postgres node does not support parameterized queries |
| INSERT + SELECT to check duplicates (TOCTOU)  | UNIQUE constraint + ON CONFLICT DO NOTHING | Atomic, race-condition-free                              |

**Deprecated/outdated:**

- `X-WH-Signature` header: deprecated July 2025, now `X-GHL-Signature`
- GHL API v1: deprecated, use v2 for all new integrations
- `react-beautiful-dnd`: archived 2023, no React 19 support (not relevant to Phase 9 but noted for phases 10+)

---

## Phase 9 Specific: GHL Pipeline IDs Reference

These IDs are verified from PROJECT.md (2026-03-11). **Must be validated against live GHL account before seeding `cjm_stage_config`** — a single wrong ID causes bulk sync to return 0 rows silently.

| Pipeline          | GHL ID                 | Stages Count                            |
| ----------------- | ---------------------- | --------------------------------------- |
| Prospects         | `zay1uZBOKpheJKFlk2Il` | 7 touchpoints (D1→D19→Ganho/Descartado) |
| Pre-Vendas/Vendas | `5LwcbrLUXG6TCLaP9wf3` | 12 stages                               |
| Sales Farming     | `cKc7qtxHdyVqG7aPkl3H` | 14 stages                               |
| CS/Retencao       | `QMG7pyGM6hlbvHrDPBVD` | 6 stages                                |

**Active clients to backfill (4):** MOTTIVME, Dra. Gabriela, Instituto Amare, Dra. Carolina
**Skip for backfill:** Alberto (churned), Eline (churned) — verify if historical data is still desired

---

## Phase 9 Specific: n8n Workflow Architecture Decision

Phase 9 creates exactly 2 n8n workflows:

**Workflow 09-01 "CJM Event Ingester" (live):**

- Trigger: GHL Webhook on pipeline stage change
- Max 10 nodes
- Does: validate → extract fields → INSERT cjm_events → UPSERT cjm_journey_state → HTTP 200
- Does NOT: check SLA, send alerts, enrich with other data

**Workflow 09-02 "CJM Backfill" (one-time manual):**

- Trigger: Manual
- Max 15 nodes
- Does: iterate 4 pipelines × 4-6 clients, GET opportunities, batch INSERT with rate limiting
- Rate limit: 20 contacts/batch, 2s between batches, one client at a time
- Does NOT: stay active after backfill completes — deactivate after first successful run

The live ingestion workflow and the backfill workflow must NEVER run at the same time against the same location.

---

## Open Questions

1. **GHL webhook trigger type for stage changes**
   - What we know: MOTTIVME uses "Workflow Inbound Webhook" triggers — no retry on 5xx
   - What's unclear: Whether setting up dedicated "OpportunityStageUpdate" triggers per pipeline would provide better delivery guarantees than generic workflow webhooks
   - Recommendation: Use the existing webhook infrastructure pattern first; if events are missed post-launch, evaluate dedicated triggers per pipeline

2. **Backfill historical events vs. current state only**
   - What we know: `cjm_journey_state` needs current position; `cjm_events` is append-only
   - What's unclear: For backfill, should we insert only one `stage_change` event per contact (current position) or attempt to reconstruct historical transitions from GHL pipeline history?
   - Recommendation: Insert only current position as a single `stage_change` event per contact during backfill. Historical reconstruction requires GHL activity log API which has different rate limits and payload structure. Phase 9 success criteria only requires "queryable by client_id" — current position satisfies this.

3. **GHL deliveryId header name**
   - What we know: GHL uses `X-GHL-Signature` (as of July 2025) and some form of delivery ID for dedup
   - What's unclear: The exact header name for the delivery/idempotency ID in the current GHL webhook spec
   - Recommendation: Log the complete raw headers from the first test webhook hit before writing the Code node. Fall back to hashing `(contact_id + pipeline_id + stage_id + timestamp)` if no dedicated delivery ID header is found.

---

## Plan 09-01 Scope: Supabase Schema

Delivers:

- Migration SQL: 4 tables (`cjm_stage_config`, `cjm_events`, `cjm_journey_state`, `cjm_touchpoints`) + `business_calendar`
- Views: `vw_cjm_pipeline_flow`, `vw_cjm_sla_status`
- RLS: `DROP IF EXISTS` + `CREATE` on all 4 tables
- Function: `business_hours_diff()` with `'America/Sao_Paulo'` named timezone
- TypeScript: `apps/docs/src/types/cjm.ts` with all domain types
- Package check: confirm `date-fns` install status (may already be present from MindFlow Phase 1)

## Plan 09-02 Scope: n8n Workflows

Delivers:

- n8n Workflow: CJM Event Ingester (live GHL webhook → INSERT)
- n8n Workflow: CJM Backfill (manual bulk sync for 4 pipelines × active clients)
- Verification: replay same webhook payload twice → confirm exactly 1 row in `cjm_events`
- Verification: `SELECT business_hours_diff(...)` with Friday-after-hours to Monday-morning test

---

## Sources

### Primary (HIGH confidence)

- `.planning/research/ARCHITECTURE.md` — full CJM schema DDL and view SQL (2026-03-11)
- `.planning/research/PITFALLS.md` — GHL webhook retry behavior, Supabase RLS gotchas, n8n patterns (2026-03-11)
- `.planning/research/STACK.md` — confirmed no new npm packages for Phase 9 (2026-03-11)
- `.planning/STATE.md` — locked decisions: timestamptz everywhere, named timezone, idempotency constraint, n8n as only write path (2026-03-11)
- `.planning/PROJECT.md` — 4 GHL pipeline IDs, 6 client context (2026-03-11)
- MOTTIVME production memory — `\!` escaping (4 reincidences), n8n NULLIF pattern, Postgres node no parameterized queries, CREATE POLICY IF NOT EXISTS syntax error

### Secondary (MEDIUM confidence)

- [PostgreSQL Date/Time](https://www.postgresql.org/docs/current/datatype-datetime.html) — `timestamptz` vs `timestamp`, named timezone behavior
- [GoHighLevel Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/) — `X-GHL-Signature` header, payload structure
- [GoHighLevel Automated Webhook Retries](https://help.gohighlevel.com/support/solutions/articles/155000007071-automated-webhook-retries) — 429-only retry; 5xx = permanent failure for Workflow Inbound Webhooks
- [Supabase RLS docs](https://supabase.com/docs/guides/auth/row-level-security) — policy syntax confirmed

### Tertiary (LOW confidence — verify at implementation)

- GHL deliveryId header exact name — needs verification from first live test webhook
- Brazil 2026 holiday dates — verify against official government calendar before final seed

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — Phase 9 installs nothing new; all tools are established project infrastructure
- Architecture: HIGH — schema directly from ARCHITECTURE.md codebase research; patterns from production-proven n8n gotchas
- Pitfalls: HIGH — 4 first-party `\!` incidents, GHL retry behavior from official docs, Supabase DDL constraints from production experience

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (30 days — stable stack; GHL API v2 unlikely to change)

**Phase dependency note:** Phase 10 (Visual Journey Map) cannot start until both plans in Phase 9 are complete AND idempotency is verified by replaying identical webhook payloads. Do not begin Phase 10 until success criteria 1 and 4 are confirmed with a test run.
