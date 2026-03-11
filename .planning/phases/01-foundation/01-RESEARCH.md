# Phase 1: Foundation - Research

**Researched:** 2026-03-05
**Domain:** Supabase schema design, TypeScript type system, column registry pattern, fractional indexing, React lazy routes
**Confidence:** HIGH

## Summary

Phase 1 is pure infrastructure: 6 database tables, TypeScript types, a column type registry, lazy-loaded routes, and Supabase data hooks. No visible UI beyond route placeholders. The research confirms all decisions from CONTEXT.md are sound and well-supported by the ecosystem.

The critical insight is that the column type registry and JSONB schema design are the two foundational decisions that every subsequent phase depends on. Getting these right in Phase 1 prevents costly rewrites later. The `fractional-indexing` npm package (2KB, by Rocicorp/Linear team) is the clear choice for position ordering. Supabase Realtime with `postgres_changes` filtered by `board_id` is the correct subscription pattern -- one channel per board, not per table.

**Primary recommendation:** Build the 6 mindflow\_ tables with GIN indexes first, then types, then column registry, then hooks, then routes. Each layer depends on the previous.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- 4 initial column types: Text, Number, Status, Date (Person, Dropdown, Checkbox enter Phase 3)
- Registry pattern: Object map + interface -- `columnRegistry[type]` returns `{renderCell, renderEditor, validate, serialize, deserialize, sortComparator, filterOperators}`
- Each column carries metadata: `{id, type, title, settings, width, position}`
- `settings` is type-specific JSONB (e.g., status has `labels[]`, number has `format`, date has `date_format`)
- Status options: Array of `{id, label, color}` in settings. Monday.com pattern.
- `column_values` stored as map by column_id: `{"col_abc123": {"value": "Done", "label": "Done"}, "col_def456": {"value": 42}}`
- Column definitions stored as JSONB array in `mindflow_boards.columns` (not a separate table)
- Fractional indexing for positions (strings like 'a0', 'a1', 'a0V')
- Table prefix: `mindflow_` (mindflow_boards, mindflow_groups, mindflow_items, mindflow_views, mindflow_dashboards, mindflow_dashboard_widgets)
- GIN index on `column_values` for JSONB queries
- Dedicated subfolders: `pages/mindflow/`, `hooks/mindflow/`, `lib/mindflow/`, `types/mindflow.ts`
- Components organized by feature inside `pages/mindflow/components/`: `board/`, `views/`, `columns/`, `dnd/`
- Types in single file: `types/mindflow.ts`
- Hook barrel export: `hooks/mindflow/index.ts`
- Import pattern: `import { useBoard } from '@/hooks/mindflow'`
- URL pattern: `#/mindflow/*` -- `#/mindflow` (board list), `#/mindflow/:boardId` (board view), `#/mindflow/:boardId/settings`
- Lazy-loaded via `React.lazy + Suspense`
- Sidebar: New collapsible section "MindFlow" with LayoutDashboard icon
- Layout: Reuse existing AI Factory Layout

### Claude's Discretion

- Exact fractional indexing library choice (or custom implementation)
- RPC function signatures for CRUD operations
- Supabase Realtime channel naming convention
- Hook internal state management pattern (useState vs useReducer)
- Migration file naming/numbering convention within existing sql/ folder

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                               | Research Support                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| BOARD-07 | Board stores column definitions as JSONB and item values as JSONB (column_values pattern) | Full schema design with 6 tables, GIN index, JSONB column_values pattern, RPC functions for atomic updates, TypeScript types matching schema |

</phase_requirements>

## Standard Stack

### Core

| Library                 | Version             | Purpose                            | Why Standard                                                         |
| ----------------------- | ------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `fractional-indexing`   | `3.2.0`             | Position ordering for items/groups | Used by Linear, Figma, Plane. 2KB. Rocicorp maintains it.            |
| `@supabase/supabase-js` | `2.89.0` (existing) | Database client, auth, realtime    | Already in codebase. Provides RPC, realtime channels, JSONB queries. |

### Supporting

| Library          | Version           | Purpose            | When to Use            |
| ---------------- | ----------------- | ------------------ | ---------------------- |
| React            | 19.2.3 (existing) | UI framework       | All components         |
| React Router DOM | 7.11.0 (existing) | HashRouter routing | Lazy route integration |
| TypeScript       | ~5.8.2 (existing) | Type system        | All type definitions   |

### Alternatives Considered

| Instead of                        | Could Use                                | Tradeoff                                                                                                                                                 |
| --------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fractional-indexing`             | Custom implementation                    | Custom is ~50 lines but misses edge cases (key exhaustion, base-62 encoding). Library is 2KB and battle-tested by Linear. Use library.                   |
| Separate `mindflow_columns` table | JSONB array in `mindflow_boards.columns` | Separate table = more JOINs, harder realtime. JSONB array = one query, one realtime event. User chose JSONB array -- correct for <100 columns per board. |

**Installation:**

```bash
cd apps/docs && pnpm add fractional-indexing
```

## Architecture Patterns

### Recommended Project Structure

```
apps/docs/src/
├── pages/mindflow/              # Route pages (lazy-loaded)
│   ├── index.tsx                # Board list placeholder
│   ├── BoardPage.tsx            # Board view placeholder
│   └── components/              # Phase 2+ components
│       ├── board/
│       ├── views/
│       ├── columns/
│       └── dnd/
├── hooks/mindflow/              # Data hooks
│   ├── index.ts                 # Barrel export
│   ├── useBoard.ts              # Single board + groups + items
│   ├── useBoardItems.ts         # Items CRUD
│   └── useBoardGroups.ts        # Groups CRUD
├── lib/mindflow/                # Infrastructure
│   └── column-registry.ts       # Column type registry
└── types/
    └── mindflow.ts              # All MindFlow types
```

### Pattern 1: Column Type Registry (Object Map + Interface)

**What:** A `Map<string, ColumnType>` where each entry encapsulates all behavior for one column type (render, edit, validate, serialize, sort, filter).
**When to use:** Every time a cell needs to render, edit, sort, or filter. Views never import column-specific logic directly.

```typescript
// Source: CONTEXT.md locked decision + Architecture research
// lib/mindflow/column-registry.ts

import { ReactNode } from "react";

export interface ColumnType<T = unknown> {
  type: string;
  label: string;
  icon: string; // Lucide icon name
  defaultValue: T;
  renderCell: (value: T, column: MindflowColumn) => ReactNode;
  renderEditor: (
    value: T,
    onChange: (v: T) => void,
    column: MindflowColumn,
  ) => ReactNode;
  validate: (value: unknown, column: MindflowColumn) => boolean;
  serialize: (value: T) => JsonValue;
  deserialize: (raw: JsonValue) => T;
  sortComparator: (a: T, b: T) => number;
  filterOperators: FilterOperator[];
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface FilterOperator {
  id: string;
  label: string;
  apply: (cellValue: unknown, filterValue: unknown) => boolean;
}

// Registry singleton
const COLUMN_REGISTRY = new Map<string, ColumnType>();

export function registerColumnType<T>(definition: ColumnType<T>): void {
  COLUMN_REGISTRY.set(definition.type, definition as ColumnType);
}

export function getColumnType(type: string): ColumnType {
  return COLUMN_REGISTRY.get(type) ?? COLUMN_REGISTRY.get("text")!;
}

export function getAllColumnTypes(): ColumnType[] {
  return Array.from(COLUMN_REGISTRY.values());
}
```

**Phase 1 registrations (4 types):**

```typescript
// lib/mindflow/column-types/text.ts
registerColumnType<string>({
  type: 'text',
  label: 'Text',
  icon: 'Type',
  defaultValue: '',
  renderCell: (value) => <span>{value}</span>,
  renderEditor: (value, onChange) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} />
  ),
  validate: (v) => typeof v === 'string',
  serialize: (v) => v,
  deserialize: (raw) => String(raw ?? ''),
  sortComparator: (a, b) => a.localeCompare(b),
  filterOperators: [
    { id: 'contains', label: 'Contains', apply: (cell, filter) => String(cell).toLowerCase().includes(String(filter).toLowerCase()) },
    { id: 'equals', label: 'Equals', apply: (cell, filter) => cell === filter },
    { id: 'is_empty', label: 'Is Empty', apply: (cell) => !cell },
    { id: 'is_not_empty', label: 'Is Not Empty', apply: (cell) => !!cell },
  ],
});
```

### Pattern 2: Supabase Hook Pattern (matching existing codebase)

**What:** `useState + useCallback + useEffect` with `{ data, loading, error, refetch }` return.
**When to use:** All MindFlow data hooks. Matches existing `useAgentVersions`, `useDashboardMetrics` patterns.

```typescript
// Source: apps/docs/src/hooks/useAgentVersions.ts (existing pattern)
// hooks/mindflow/useBoard.ts

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type {
  MindflowBoard,
  MindflowGroup,
  MindflowItem,
} from "../../types/mindflow";

export const useBoard = (boardId: string | undefined) => {
  const [board, setBoard] = useState<MindflowBoard | null>(null);
  const [groups, setGroups] = useState<MindflowGroup[]>([]);
  const [items, setItems] = useState<MindflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    if (!boardId) {
      setBoard(null);
      setGroups([]);
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Parallel fetch: board + groups + items
      const [boardRes, groupsRes, itemsRes] = await Promise.all([
        supabase.from("mindflow_boards").select("*").eq("id", boardId).single(),
        supabase
          .from("mindflow_groups")
          .select("*")
          .eq("board_id", boardId)
          .order("position"),
        supabase
          .from("mindflow_items")
          .select("*")
          .eq("board_id", boardId)
          .eq("is_archived", false)
          .order("position"),
      ]);

      if (boardRes.error) throw boardRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setBoard(boardRes.data);
      setGroups(groupsRes.data || []);
      setItems(itemsRes.data || []);
    } catch (err: any) {
      console.error("Error fetching board:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return { board, groups, items, loading, error, refetch: fetchBoard };
};
```

### Pattern 3: React.lazy Route Integration with Existing HashRouter

**What:** Lazy-load the entire MindFlow module as a separate chunk. Add routes inside existing `<Routes>` in `App.tsx`.
**When to use:** Phase 1 route scaffolding.

```typescript
// Source: apps/docs/src/App.tsx (existing pattern analysis)
// In App.tsx, add at top:

const MindflowHome = React.lazy(() => import('./pages/mindflow/index'));
const BoardPage = React.lazy(() => import('./pages/mindflow/BoardPage'));

// Inside <Routes>, add new section:
{/* MindFlow */}
<Route path="/mindflow" element={
  <ProtectedRoute>
    <Layout>
      <React.Suspense fallback={<div className="p-8 text-text-muted">Loading...</div>}>
        <MindflowHome />
      </React.Suspense>
    </Layout>
  </ProtectedRoute>
} />
<Route path="/mindflow/:boardId" element={
  <ProtectedRoute>
    <Layout>
      <React.Suspense fallback={<div className="p-8 text-text-muted">Loading...</div>}>
        <BoardPage />
      </React.Suspense>
    </Layout>
  </ProtectedRoute>
} />
```

**Key details from existing App.tsx:**

- All routes use `<ProtectedRoute><Layout>...</Layout></ProtectedRoute>` wrapper
- No existing lazy loading -- MindFlow will be the first lazy-loaded routes
- Pages use named exports (`export const Dashboard`) BUT lazy loading requires default exports
- MindFlow pages MUST use `export default` for `React.lazy` to work
- HashRouter is already configured -- routes work as `#/mindflow`, `#/mindflow/:boardId`
- Catch-all `<Route path="*">` exists at the bottom -- MindFlow routes MUST be placed ABOVE it

### Pattern 4: Fractional Indexing for Positions

**What:** Use `fractional-indexing` library for `position` TEXT columns on items and groups.
**When to use:** Every insert/reorder operation on items or groups.

```typescript
// Source: Context7 /rocicorp/fractional-indexing docs (verified HIGH confidence)
import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

// First item in a group
const firstPos = generateKeyBetween(null, null); // "a0"

// Append after last item
const appendPos = generateKeyBetween(lastItemPosition, null); // e.g., "a3"

// Insert between two items
const betweenPos = generateKeyBetween(itemAbovePos, itemBelowPos); // e.g., "a1V"

// Batch insert (e.g., creating a board with 3 default groups)
const positions = generateNKeysBetween(null, null, 3); // ["a0", "a1", "a2"]
```

**Storage:** Position is `TEXT` column, sorted lexicographically. PostgreSQL `ORDER BY position` works correctly with fractional index strings because they are designed for lexicographic sorting.

### Anti-Patterns to Avoid

- **Anti-pattern: Integer positions with reindexing.** Inserting between positions 3 and 4 requires updating all positions >= 4. Fractional indexing avoids this entirely.
- **Anti-pattern: Separate columns table.** Column definitions in a separate `mindflow_columns` table requires JOINs and multiple realtime subscriptions. JSONB array in `mindflow_boards.columns` gives everything in one query.
- **Anti-pattern: Default exports for hooks.** Existing codebase uses named exports for hooks. Keep consistency: `export const useBoard = ...`. Only page components need default exports (for React.lazy).
- **Anti-pattern: Eagerly importing MindFlow in App.tsx.** All MindFlow page imports MUST use `React.lazy()`. Regular imports would add MindFlow to the main bundle.

## Don't Hand-Roll

| Problem                | Don't Build                          | Use Instead                                                     | Why                                                                                                                     |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| Position ordering      | Custom integer reindexing            | `fractional-indexing` (2KB)                                     | Edge cases with key exhaustion, base-62 encoding, and boundary conditions. Library handles all of them. Used by Linear. |
| JSONB atomic merge     | Manual read-modify-write from client | Supabase RPC with `                                             |                                                                                                                         | ` operator | Race condition: two edits to different columns on same item can overwrite each other without server-side merge. |
| Realtime subscriptions | Custom WebSocket                     | Supabase `postgres_changes`                                     | Already in stack, handles reconnection, auth, filtering.                                                                |
| UUID generation        | Custom ID scheme                     | `gen_random_uuid()` in PostgreSQL + `crypto.randomUUID()` in JS | Column IDs like `col_abc123` need uniqueness. Use `crypto.randomUUID()` for generating column IDs client-side.          |

**Key insight:** The JSONB merge RPC is the most critical "don't hand-roll" item. Without it, two users editing different columns on the same item simultaneously will cause data loss (last full `column_values` write wins). The RPC uses PostgreSQL's `||` operator for atomic merge.

## Common Pitfalls

### Pitfall 1: JSONB Race Condition on column_values Updates

**What goes wrong:** Client reads full `column_values`, modifies one key, writes back entire object. If another client writes a different key between read and write, the first write is lost.
**Why it happens:** Supabase REST API's `.update()` replaces the entire column value. No built-in JSONB merge.
**How to avoid:** Use an RPC function that performs atomic `column_values || jsonb_build_object(key, value)` server-side.
**Warning signs:** Users report "my edit disappeared" or values randomly reverting.

### Pitfall 2: Realtime Subscription Leak

**What goes wrong:** Navigating away from a board doesn't clean up the Realtime channel. Channels accumulate, hitting Supabase's per-connection limit.
**Why it happens:** Missing cleanup in `useEffect` return function.
**How to avoid:** Always return `() => { supabase.removeChannel(channel) }` from the useEffect that creates the subscription. Name channels uniquely: `mindflow:board:${boardId}`.
**Warning signs:** WebSocket reconnects, missing updates, console warnings about max channels.

### Pitfall 3: Lazy Loading Requires Default Exports

**What goes wrong:** `React.lazy(() => import('./pages/mindflow/index'))` fails silently or throws if the module uses named exports.
**Why it happens:** `React.lazy` expects the dynamic import to resolve to a module with a `default` export.
**How to avoid:** MindFlow page components MUST use `export default`. Hooks and utilities continue using named exports (they're not lazy-loaded).
**Warning signs:** Blank page when navigating to `/mindflow`, console error about missing default export.

### Pitfall 4: GIN Index with jsonb_path_ops vs Default

**What goes wrong:** Default GIN index supports `?`, `?|`, `?&` operators but NOT `@>` path queries efficiently. Using `jsonb_path_ops` supports `@>` but NOT key-existence queries.
**Why it happens:** Two different GIN operator classes serve different query patterns.
**How to avoid:** Use `jsonb_path_ops` for `column_values` since the primary query pattern is containment (`@>`), e.g., "find items where status column = Done". Key-existence queries are not needed for filtering.
**Warning signs:** EXPLAIN ANALYZE shows sequential scan despite GIN index existing.

### Pitfall 5: Supabase Realtime Row Size Limit

**What goes wrong:** Supabase Realtime does not send the payload if the row exceeds ~1MB. Large JSONB `column_values` (many columns with large text) could hit this.
**Why it happens:** Realtime uses WAL (Write-Ahead Log) which has size constraints.
**How to avoid:** Keep `column_values` lean. Large text content (rich text, descriptions) should go in a separate `description` TEXT column on the item, not inside `column_values`. Monitor average row size.
**Warning signs:** Realtime events stop arriving for specific items but work for others.

### Pitfall 6: SQL Migration Numbering Collision

**What goes wrong:** Existing SQL files in `apps/docs/sql/` use numbering `009-021`. Adding MindFlow migrations at `022` could collide with other features being developed.
**Why it happens:** No automated migration runner -- files are manually applied.
**How to avoid:** Use `070-079` range for MindFlow migrations (as suggested in PITFALLS.md). File names: `070_mindflow_schema.sql`, `071_mindflow_rpc_functions.sql`, `072_mindflow_rls_policies.sql`.
**Warning signs:** Two SQL files with same number, migrations applied out of order.

## Code Examples

### Complete SQL Schema for 6 mindflow\_ Tables

```sql
-- Source: Architecture research + CONTEXT.md decisions
-- File: apps/docs/sql/070_mindflow_schema.sql

-- ============================================================
-- 1. mindflow_boards
-- ============================================================
CREATE TABLE IF NOT EXISTS mindflow_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'New Board',
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- columns: [{id, type, title, settings, width, position}]
  column_order TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT DEFAULT 'table-2',
  color TEXT DEFAULT '#6C5CE7',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. mindflow_groups
-- ============================================================
CREATE TABLE IF NOT EXISTS mindflow_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES mindflow_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Group',
  color TEXT DEFAULT '#6C5CE7',
  position TEXT NOT NULL, -- fractional index
  is_collapsed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. mindflow_items
-- ============================================================
CREATE TABLE IF NOT EXISTS mindflow_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES mindflow_boards(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES mindflow_groups(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES mindflow_items(id) ON DELETE CASCADE, -- subitems (Phase 6)
  name TEXT NOT NULL DEFAULT '',
  column_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- column_values: {"col_abc": {"value": "Done"}, "col_def": {"value": 42}}
  position TEXT NOT NULL, -- fractional index
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. mindflow_views
-- ============================================================
CREATE TABLE IF NOT EXISTS mindflow_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES mindflow_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Table',
  type TEXT NOT NULL DEFAULT 'table' CHECK (type IN ('table', 'kanban', 'calendar')),
  position INTEGER NOT NULL DEFAULT 0,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  group_by TEXT, -- column_id or null
  hidden_columns TEXT[] NOT NULL DEFAULT '{}',
  column_widths JSONB NOT NULL DEFAULT '{}'::jsonb,
  kanban_config JSONB,
  calendar_config JSONB,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. mindflow_dashboards
-- ============================================================
CREATE TABLE IF NOT EXISTS mindflow_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES mindflow_boards(id) ON DELETE SET NULL, -- null = cross-board
  name TEXT NOT NULL DEFAULT 'New Dashboard',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. mindflow_dashboard_widgets
-- ============================================================
CREATE TABLE IF NOT EXISTS mindflow_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES mindflow_dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'number', 'chart_bar', 'chart_pie', etc.
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout JSONB NOT NULL DEFAULT '{"x":0,"y":0,"w":6,"h":4}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Items: primary query path (board page load)
CREATE INDEX idx_mindflow_items_board ON mindflow_items(board_id)
  WHERE NOT is_archived;

-- Items: group filtering
CREATE INDEX idx_mindflow_items_group ON mindflow_items(group_id);

-- Items: subitems lookup (Phase 6)
CREATE INDEX idx_mindflow_items_parent ON mindflow_items(parent_id)
  WHERE parent_id IS NOT NULL;

-- Items: position ordering within board+group
CREATE INDEX idx_mindflow_items_position ON mindflow_items(board_id, group_id, position);

-- Items: JSONB column_values for filter queries
-- Using jsonb_path_ops for @> containment queries (primary filter pattern)
CREATE INDEX idx_mindflow_items_colvals ON mindflow_items
  USING GIN(column_values jsonb_path_ops);

-- Groups: board lookup + position ordering
CREATE INDEX idx_mindflow_groups_board ON mindflow_groups(board_id);

-- Views: board lookup
CREATE INDEX idx_mindflow_views_board ON mindflow_views(board_id);

-- Dashboard widgets: dashboard lookup
CREATE INDEX idx_mindflow_widgets_dashboard ON mindflow_dashboard_widgets(dashboard_id);

-- ============================================================
-- UPDATED_AT TRIGGER (auto-set updated_at on UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION mindflow_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mindflow_boards_updated
  BEFORE UPDATE ON mindflow_boards
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

CREATE TRIGGER trg_mindflow_groups_updated
  BEFORE UPDATE ON mindflow_groups
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

CREATE TRIGGER trg_mindflow_items_updated
  BEFORE UPDATE ON mindflow_items
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

CREATE TRIGGER trg_mindflow_views_updated
  BEFORE UPDATE ON mindflow_views
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();

CREATE TRIGGER trg_mindflow_dashboards_updated
  BEFORE UPDATE ON mindflow_dashboards
  FOR EACH ROW EXECUTE FUNCTION mindflow_set_updated_at();
```

### RPC Functions for CRUD Operations

```sql
-- Source: Architecture research + Supabase Context7 docs
-- File: apps/docs/sql/071_mindflow_rpc_functions.sql

-- ============================================================
-- 1. Atomic JSONB column value update (prevents race condition)
-- ============================================================
CREATE OR REPLACE FUNCTION mindflow_update_column_value(
  p_item_id UUID,
  p_column_id TEXT,
  p_value JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE mindflow_items
  SET column_values = column_values || jsonb_build_object(p_column_id, p_value),
      updated_at = now()
  WHERE id = p_item_id
  RETURNING column_values INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. Batch column value update (multiple columns at once)
-- ============================================================
CREATE OR REPLACE FUNCTION mindflow_update_column_values(
  p_item_id UUID,
  p_values JSONB  -- {"col_abc": {"value": "Done"}, "col_def": {"value": 42}}
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE mindflow_items
  SET column_values = column_values || p_values,
      updated_at = now()
  WHERE id = p_item_id
  RETURNING column_values INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Create board with default group and view
-- ============================================================
CREATE OR REPLACE FUNCTION mindflow_create_board(
  p_name TEXT,
  p_created_by UUID,
  p_columns JSONB DEFAULT '[]'::jsonb,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_board_id UUID;
  v_group_id UUID;
  v_view_id UUID;
BEGIN
  -- Create board
  INSERT INTO mindflow_boards (name, description, columns, created_by)
  VALUES (p_name, p_description, p_columns, p_created_by)
  RETURNING id INTO v_board_id;

  -- Create default group
  INSERT INTO mindflow_groups (board_id, name, color, position)
  VALUES (v_board_id, 'New Group', '#6C5CE7', 'a0')
  RETURNING id INTO v_group_id;

  -- Create default table view
  INSERT INTO mindflow_views (board_id, name, type, is_default, created_by)
  VALUES (v_board_id, 'Main Table', 'table', true, p_created_by)
  RETURNING id INTO v_view_id;

  RETURN jsonb_build_object(
    'board_id', v_board_id,
    'group_id', v_group_id,
    'view_id', v_view_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. Move item (change group + position atomically)
-- ============================================================
CREATE OR REPLACE FUNCTION mindflow_move_item(
  p_item_id UUID,
  p_target_group_id UUID,
  p_new_position TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE mindflow_items
  SET group_id = p_target_group_id,
      position = p_new_position,
      updated_at = now()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Reorder group position
-- ============================================================
CREATE OR REPLACE FUNCTION mindflow_reorder_group(
  p_group_id UUID,
  p_new_position TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE mindflow_groups
  SET position = p_new_position,
      updated_at = now()
  WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies (Phase 1: Owner-Based Access)

```sql
-- Source: Architecture research
-- File: apps/docs/sql/072_mindflow_rls_policies.sql

-- Enable RLS on all mindflow tables
ALTER TABLE mindflow_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindflow_dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Boards: creator has full access
CREATE POLICY "mindflow_boards_owner" ON mindflow_boards
  FOR ALL USING (created_by = auth.uid());

-- Groups: access if user owns the parent board
CREATE POLICY "mindflow_groups_via_board" ON mindflow_groups
  FOR ALL USING (
    board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid())
  );

-- Items: access if user owns the parent board
CREATE POLICY "mindflow_items_via_board" ON mindflow_items
  FOR ALL USING (
    board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid())
  );

-- Views: access if user owns the parent board
CREATE POLICY "mindflow_views_via_board" ON mindflow_views
  FOR ALL USING (
    board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid())
  );

-- Dashboards: creator has full access
CREATE POLICY "mindflow_dashboards_owner" ON mindflow_dashboards
  FOR ALL USING (created_by = auth.uid());

-- Dashboard widgets: access if user owns the parent dashboard
CREATE POLICY "mindflow_widgets_via_dashboard" ON mindflow_dashboard_widgets
  FOR ALL USING (
    dashboard_id IN (SELECT id FROM mindflow_dashboards WHERE created_by = auth.uid())
  );

-- Grant access to authenticated role
GRANT ALL ON mindflow_boards TO authenticated;
GRANT ALL ON mindflow_groups TO authenticated;
GRANT ALL ON mindflow_items TO authenticated;
GRANT ALL ON mindflow_views TO authenticated;
GRANT ALL ON mindflow_dashboards TO authenticated;
GRANT ALL ON mindflow_dashboard_widgets TO authenticated;
```

### TypeScript Types

```typescript
// Source: CONTEXT.md decisions + Architecture research
// types/mindflow.ts

// ============================================================
// Column System Types
// ============================================================

export type MindflowColumnType = "text" | "number" | "status" | "date";
// Phase 3 additions: 'person' | 'dropdown' | 'checkbox'

export interface MindflowColumn {
  id: string; // e.g., "col_abc123"
  type: MindflowColumnType;
  title: string;
  settings: Record<string, any>; // Type-specific settings
  width: number; // Column width in pixels
  position: string; // Fractional index for ordering
}

export interface StatusOption {
  id: string;
  label: string;
  color: string;
}

export interface StatusColumnSettings {
  labels: StatusOption[];
  default_index?: number;
}

export interface NumberColumnSettings {
  format?: "number" | "currency" | "percent";
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export interface DateColumnSettings {
  date_format?: string; // e.g., 'YYYY-MM-DD', 'DD/MM/YYYY'
  include_time?: boolean;
}

// ============================================================
// Core Entity Types
// ============================================================

export interface MindflowBoard {
  id: string;
  name: string;
  description?: string;
  columns: MindflowColumn[];
  column_order: string[];
  icon: string;
  color: string;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MindflowGroup {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: string; // fractional index
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MindflowItem {
  id: string;
  board_id: string;
  group_id: string;
  parent_id?: string;
  name: string;
  column_values: Record<string, any>; // {"col_abc": {"value": "Done"}}
  position: string; // fractional index
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MindflowViewType = "table" | "kanban" | "calendar";

export interface MindflowView {
  id: string;
  board_id: string;
  name: string;
  type: MindflowViewType;
  position: number;
  filters: MindflowFilter[];
  sort_config: MindflowSort[];
  group_by?: string;
  hidden_columns: string[];
  column_widths: Record<string, number>;
  kanban_config?: Record<string, any>;
  calendar_config?: Record<string, any>;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MindflowFilter {
  column_id: string;
  operator: string; // 'equals', 'contains', 'gt', 'lt', 'is_empty', etc.
  value: unknown;
}

export interface MindflowSort {
  column_id: string;
  direction: "asc" | "desc";
}

export interface MindflowDashboard {
  id: string;
  board_id?: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MindflowDashboardWidget {
  id: string;
  dashboard_id: string;
  type: string;
  config: Record<string, any>;
  layout: { x: number; y: number; w: number; h: number };
  created_at: string;
  updated_at: string;
}
```

### Realtime Subscription Pattern

```typescript
// Source: Context7 Supabase Realtime docs (verified HIGH confidence)
// Inside hooks/mindflow/useBoard.ts — add to the existing hook

useEffect(() => {
  if (!boardId) return;

  const channel = supabase
    .channel(`mindflow:board:${boardId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mindflow_items",
        filter: `board_id=eq.${boardId}`,
      },
      (payload) => {
        // Dedup: ignore echoes of our own optimistic updates
        const remote = payload.new as MindflowItem;
        if (payload.eventType === "INSERT") {
          setItems((prev) => [...prev, remote]);
        } else if (payload.eventType === "UPDATE") {
          setItems((prev) =>
            prev.map((item) =>
              item.id === remote.id &&
              new Date(remote.updated_at) > new Date(item.updated_at)
                ? remote
                : item,
            ),
          );
        } else if (payload.eventType === "DELETE") {
          const old = payload.old as { id: string };
          setItems((prev) => prev.filter((item) => item.id !== old.id));
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "mindflow_groups",
        filter: `board_id=eq.${boardId}`,
      },
      (payload) => {
        // Same dedup pattern for groups
        // ...
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [boardId]);
```

### Vite Manual Chunk Configuration

```typescript
// Source: apps/docs/vite.config.ts (existing pattern)
// Add to manualChunks in vite.config.ts:

manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-ui': ['lucide-react', 'recharts'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-mindflow': ['fractional-indexing'],
  // Phase 2+: add '@tanstack/react-table', '@dnd-kit/core', etc.
},
```

### RPC Call from Client

```typescript
// Source: Context7 Supabase RPC docs (verified HIGH confidence)
// Atomic column value update:

const { data, error } = await supabase.rpc("mindflow_update_column_value", {
  p_item_id: itemId,
  p_column_id: "col_status_1",
  p_value: { value: "Done", label: "Done" },
});

// Create board with defaults:
const { data, error } = await supabase.rpc("mindflow_create_board", {
  p_name: "My Project Board",
  p_created_by: user.id,
  p_columns: JSON.stringify([
    {
      id: `col_${crypto.randomUUID().slice(0, 8)}`,
      type: "status",
      title: "Status",
      settings: {
        labels: [
          { id: "not_started", label: "Not Started", color: "#C4C4C4" },
          { id: "working", label: "Working on it", color: "#FDAB3D" },
          { id: "done", label: "Done", color: "#00C875" },
          { id: "stuck", label: "Stuck", color: "#E2445C" },
        ],
      },
      width: 150,
      position: "a0",
    },
    {
      id: `col_${crypto.randomUUID().slice(0, 8)}`,
      type: "date",
      title: "Due Date",
      settings: { include_time: false },
      width: 130,
      position: "a1",
    },
    {
      id: `col_${crypto.randomUUID().slice(0, 8)}`,
      type: "text",
      title: "Notes",
      settings: {},
      width: 200,
      position: "a2",
    },
  ]),
});
```

## State of the Art

| Old Approach                   | Current Approach                        | When Changed                             | Impact                                            |
| ------------------------------ | --------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| Integer positions with reindex | Fractional indexing (strings)           | ~2020 (Linear, Figma adoption)           | Single-row update on reorder instead of N updates |
| EAV tables for custom fields   | JSONB column with GIN index             | PostgreSQL 9.4+ (2014), mainstream ~2019 | One row per item instead of N rows per item       |
| `react-beautiful-dnd`          | `@dnd-kit` or `pragmatic-drag-and-drop` | 2023 (rbd archived by Atlassian)         | Better React 18/19 compat, smaller bundle         |
| Full page imports              | `React.lazy` + `Suspense`               | React 16.6 (2018), stable pattern        | Code splitting per route                          |

**Deprecated/outdated:**

- `react-beautiful-dnd`: Archived by Atlassian. Do not use. Use `@dnd-kit` (Phase 2+).
- Integer `SERIAL` position columns: Causes N updates per reorder. Use TEXT fractional indexing.

## Open Questions

1. **Supabase Realtime replica identity for `column_values`**
   - What we know: Realtime needs `REPLICA IDENTITY FULL` on tables to receive `old` values in UPDATE events. Default is `DEFAULT` (primary key only).
   - What's unclear: Whether the existing Supabase instance has replica identity configured, and whether it's needed for Phase 1 (dedup logic uses `new.updated_at` comparison, not `old` values).
   - Recommendation: Start with default replica identity. Only set `FULL` if dedup needs `old` values (unlikely for Phase 1). Test in dev.

2. **Column ID generation strategy**
   - What we know: IDs like `col_abc123` need to be unique per board. `crypto.randomUUID()` provides sufficient uniqueness.
   - What's unclear: Whether a shorter prefix+random scheme (`col_${randomHex(8)}`) is better for readability in JSONB keys.
   - Recommendation: Use `col_${crypto.randomUUID().slice(0, 8)}` for short, readable, unique-enough IDs. Collision probability at 8 hex chars across <100 columns per board is negligible.

3. **Hook state: useState vs useReducer**
   - What we know: Existing codebase uses `useState` exclusively. `useReducer` could reduce state update boilerplate for complex board state.
   - What's unclear: Whether `useReducer` complexity is worth it for Phase 1 hooks that only do fetch + set.
   - Recommendation: Use `useState` for Phase 1 (matches existing conventions, simpler). Refactor to `useReducer` in Phase 2 if mutations become complex. Do NOT introduce Zustand in Phase 1.

## Sources

### Primary (HIGH confidence)

- Context7 `/supabase/supabase` - Realtime postgres_changes, GIN indexes, RPC function calls
- Context7 `/rocicorp/fractional-indexing` - `generateKeyBetween`, `generateNKeysBetween` API
- `.planning/research/ARCHITECTURE.md` - Full component map, data flow, schema design
- `.planning/research/STACK.md` - Library versions, compatibility matrix
- `.planning/research/PITFALLS.md` - 17 pitfalls catalogued with prevention strategies
- `.planning/codebase/CONVENTIONS.md` - Hook pattern, naming, exports, styling tokens
- `.planning/codebase/STRUCTURE.md` - Directory layout, where to add new code

### Secondary (MEDIUM confidence)

- `.planning/codebase/STACK.md` - Existing dependency versions verified from package.json analysis
- `apps/docs/src/App.tsx` - Existing route pattern verified by direct code read
- `apps/docs/vite.config.ts` - Manual chunks pattern verified by direct code read

### Tertiary (LOW confidence)

- None. All findings verified through Context7 or direct codebase analysis.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - `fractional-indexing` verified via Context7, Supabase already in codebase
- Architecture: HIGH - Schema, types, registry all derived from locked CONTEXT.md decisions + verified patterns
- Pitfalls: HIGH - JSONB race condition, realtime cleanup, lazy export requirement all verified against official docs

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable domain, low churn)
