# MindFlow Architecture

**Version:** 0.1.0 (Draft)
**Date:** 2026-03-05
**Status:** Planning

---

## 1. Component Architecture

MindFlow lives inside the existing AI Factory SPA (`apps/docs/`) as a new route group. It does NOT create a separate app — it reuses AuthContext, Layout, Supabase client, and the existing hook-based data layer.

### High-Level Component Map

```
apps/docs/src/
├── pages/
│   └── mindflow/                    # NEW — all MindFlow pages
│       ├── index.tsx                # Board list / workspace home
│       ├── BoardPage.tsx            # Single board (hosts all views)
│       ├── DashboardPage.tsx        # Dashboard builder
│       └── components/              # MindFlow-specific components
│           ├── board/               # Board Engine components
│           ├── views/               # View Layer components
│           ├── columns/             # Column Type System
│           ├── dnd/                 # DnD Layer
│           ├── dashboard/           # Dashboard Builder
│           ├── automations/         # Automation Engine
│           └── command-palette/     # Command Palette (cmdk)
├── hooks/
│   └── mindflow/                    # NEW — MindFlow data hooks
│       ├── index.ts                 # Barrel export
│       ├── useBoard.ts              # Single board CRUD + realtime
│       ├── useBoards.ts             # Board list
│       ├── useBoardItems.ts         # Items with column values
│       ├── useBoardViews.ts         # Views per board
│       ├── useBoardGroups.ts        # Groups per board
│       ├── useDashboardWidgets.ts   # Dashboard widget config
│       └── useAutomations.ts        # Automation rules
├── lib/
│   └── mindflow/                    # NEW — MindFlow infrastructure
│       ├── column-registry.ts       # Column type registry
│       ├── formula-engine.ts        # Formula parser (Phase 2)
│       └── automation-engine.ts     # Trigger/action evaluator
└── types/
    └── mindflow.ts                  # NEW — all MindFlow types
```

### 1.1 Board Engine (Core Data Model + CRUD)

The Board Engine is the central abstraction. A board contains groups, which contain items, which have typed column values stored as JSONB.

**Reference architecture:** Monday.com uses a flat item model with JSONB column values indexed by column ID. Plane (open-source, 46.2k stars) uses a similar pattern with PostgreSQL JSONB. Teable (21k stars) goes further with a database-first approach where each board is essentially a PostgreSQL table.

MindFlow follows the Monday/Plane pattern: one `mindflow_items` table with a `column_values` JSONB field, NOT the Teable pattern of dynamic DDL.

```
┌─────────────────────────────────────────────────────┐
│ BoardEngine                                         │
│                                                     │
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐  │
│  │  Board    │──>│  Groups  │──>│     Items      │  │
│  │ (config,  │   │ (color,  │   │ (column_values │  │
│  │  columns) │   │  order)  │   │  as JSONB)     │  │
│  └──────────┘   └──────────┘   └────────────────┘  │
│       │                              │              │
│       │ columns[]                    │ subitems     │
│       ▼                              ▼              │
│  ┌──────────┐                ┌────────────────┐     │
│  │ Column   │                │  SubItem       │     │
│  │ Registry │                │ (same schema,  │     │
│  │ (types)  │                │  parent_id)    │     │
│  └──────────┘                └────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Key components:**

| Component        | File                       | Responsibility                                                                                                                                           |
| ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BoardProvider`  | `board/BoardProvider.tsx`  | Context provider — loads board, groups, items, columns. Provides CRUD mutations. All child views consume this context instead of fetching independently. |
| `BoardHeader`    | `board/BoardHeader.tsx`    | Board name (editable), view tabs, filter/sort/group-by controls, "+ Add View" button.                                                                    |
| `GroupContainer` | `board/GroupContainer.tsx` | Renders a single group: colored header, collapse toggle, item list, "+ Add Item" row.                                                                    |
| `ItemRow`        | `board/ItemRow.tsx`        | One row in table view. Maps `column_values` to cell renderers via Column Registry. Handles inline editing.                                               |
| `SubItemsPanel`  | `board/SubItemsPanel.tsx`  | Expandable panel below an item showing subitems (same column structure, filtered columns).                                                               |

**CRUD pattern (follows existing AI Factory conventions):**

```typescript
// hooks/mindflow/useBoard.ts
export function useBoard(boardId: string) {
  const [board, setBoard] = useState<MindflowBoard | null>(null);
  const [groups, setGroups] = useState<MindflowGroup[]>([]);
  const [items, setItems] = useState<MindflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch board + groups + items in parallel
  const fetchBoard = useCallback(async () => { ... }, [boardId]);

  // Mutations return optimistic update + server sync
  const updateItem = useCallback(async (itemId: string, columnId: string, value: unknown) => {
    // 1. Optimistic update (setItems)
    // 2. Supabase PATCH mindflow_items.column_values via JSONB merge
    // 3. On error: rollback + toast
  }, []);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`board:${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mindflow_items', filter: `board_id=eq.${boardId}` }, handleChange)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [boardId]);

  return { board, groups, items, loading, error, updateItem, addItem, deleteItem, ... };
}
```

### 1.2 View Layer (Table, Kanban, Calendar)

All views render from the SAME board data provided by `BoardProvider`. Views do NOT fetch their own data — they receive items, groups, and columns from context and apply their own filtering, sorting, and grouping.

```
                    ┌─────────────┐
                    │ BoardProvider│
                    │  (data ctx) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │TableView │ │KanbanView│ │CalendarVw│
        │(TanStack │ │(@dnd-kit │ │(schedule │
        │ Table v8)│ │ sortable)│ │  -x)     │
        └──────────┘ └──────────┘ └──────────┘
```

**View architecture inspired by:** Monday.com (view tabs sharing same board data) and Plane (each view stores its own filter/sort/group config independently).

Each view is a separate component with its own:

- Filter state (saved in `mindflow_views.filters` JSONB)
- Sort state (saved in `mindflow_views.sort_config` JSONB)
- Group-by state (saved in `mindflow_views.group_by` column reference)
- Hidden columns (saved in `mindflow_views.hidden_columns` text array)

**Table View** (`views/TableView.tsx`):

- Built on **TanStack Table v8** (headless, 15KB, MIT)
- Column definitions generated dynamically from board's `columns` config
- Each cell delegates rendering to the Column Registry's `renderCell()` / `renderEditor()`
- Features: column resize, column reorder (DnD), row selection (checkbox), sticky first column, virtualization via TanStack Virtual for 1000+ items
- Inline editing: click cell > editor appears > onChange debounce 300ms or onBlur > optimistic update

**Kanban View** (`views/KanbanView.tsx`):

- Built on **@dnd-kit/sortable** (13KB, MIT)
- Groups items by any Status/Dropdown column (configurable per view)
- Each column = one status value, cards = items
- DnD: drag card between columns updates `column_values[groupByColumn]`
- DnD: drag card within column updates `position`
- Collapse/expand columns, WIP limits (visual only, Phase 2 for enforcement)
- Card layout: item name + 2-3 preview columns (configurable)

**Calendar View** (`views/CalendarView.tsx`):

- Built on **@schedule-x/react** (or FullCalendar as fallback)
- Maps items with Date columns to calendar events
- Month/week/day views
- DnD to move items between dates (updates the mapped date column)
- Click event opens item detail panel

### 1.3 Column Type System (Registry Pattern)

The Column Type System uses a **registry pattern** so that adding a new column type requires registering ONE object — the views, editors, validators, and serializers are all encapsulated.

**Reference:** Monday.com's column system (30+ types) and Teable's field system both use registry patterns. Huly uses a simpler approach with hardcoded type switches.

```typescript
// lib/mindflow/column-registry.ts

interface ColumnType<T = unknown> {
  type: string; // 'status' | 'number' | 'date' | ...
  label: string; // Human-readable name
  icon: LucideIcon; // Column header icon
  defaultValue: T; // Default for new items
  renderCell: (value: T, column: ColumnDef) => ReactNode; // Read-only cell
  renderEditor: (
    value: T,
    onChange: (v: T) => void,
    column: ColumnDef,
  ) => ReactNode; // Edit mode
  renderKanbanCard?: (value: T, column: ColumnDef) => ReactNode; // Compact card preview
  validate: (value: unknown, column: ColumnDef) => boolean; // Input validation
  serialize: (value: T) => JsonValue; // To JSONB
  deserialize: (raw: JsonValue) => T; // From JSONB
  sortComparator: (a: T, b: T) => number; // For TanStack Table sorting
  filterOperators: FilterOperator[]; // Available filter ops (equals, contains, gt, etc.)
  summarize?: (values: T[]) => string | number; // Group footer summary (sum, avg, count)
}

// Registry singleton
const COLUMN_TYPES = new Map<string, ColumnType>();

export function registerColumnType<T>(type: ColumnType<T>) {
  COLUMN_TYPES.set(type.type, type);
}
export function getColumnType(type: string): ColumnType {
  return COLUMN_TYPES.get(type) ?? COLUMN_TYPES.get("text")!;
}
```

**MVP column types (10):**

| Type       | Stored As (JSONB)     | Editor Component        | Notes                             |
| ---------- | --------------------- | ----------------------- | --------------------------------- |
| `text`     | `string`              | `<input>`               | Default fallback                  |
| `number`   | `number`              | `<input type="number">` | Supports unit prefix ($, %, etc.) |
| `status`   | `{ index: number }`   | Color pill dropdown     | Labels defined in column config   |
| `date`     | `string` (ISO)        | react-day-picker        | Optional time component           |
| `person`   | `string[]` (user IDs) | Avatar multi-select     | Queries Supabase auth users       |
| `dropdown` | `string[]`            | Multi-select popover    | Options in column config          |
| `checkbox` | `boolean`             | Toggle                  | -                                 |
| `url`      | `string`              | `<input>` + link icon   | Opens in new tab                  |
| `rating`   | `number`              | Star selector           | 1-5 default, configurable         |
| `formula`  | computed              | Read-only display       | Phase 2 — parser via mathjs       |

### 1.4 DnD Layer (@dnd-kit Integration)

DnD is used in four contexts, all powered by @dnd-kit:

```
DnD Contexts:
┌───────────────────────────────────────────────────┐
│                                                   │
│  1. TABLE VIEW                                    │
│     - Reorder items within group (vertical)       │
│     - Move items between groups (vertical)        │
│     - Reorder columns (horizontal)                │
│     - Reorder groups (vertical)                   │
│                                                   │
│  2. KANBAN VIEW                                   │
│     - Move cards between columns (horizontal)     │
│     - Reorder cards within column (vertical)      │
│                                                   │
│  3. DASHBOARD BUILDER                             │
│     - Move widgets on grid (2D)                   │
│     - Resize widgets (handle)                     │
│                                                   │
│  4. VIEW TABS                                     │
│     - Reorder view tabs (horizontal)              │
│                                                   │
└───────────────────────────────────────────────────┘
```

**DnD wrapper component:**

```typescript
// dnd/BoardDndContext.tsx
// Wraps the active view with DndContext + sensors + collision detection
// Handles the onDragEnd dispatch:
//   - If item moved to different group: updateItem(groupId)
//   - If item reordered: updatePositions(newOrder)
//   - If column moved: updateColumnOrder(newOrder)
//   - If Kanban card moved: updateColumnValue(statusColumnId, newStatus) + updatePosition
```

**Position strategy:** Fractional indexing (e.g., `a0`, `a1`, `a0V`) for insertion between items without rewriting all positions. Library: `fractional-indexing` (2KB). This is the pattern used by Linear, Plane, and Figma.

### 1.5 Dashboard Builder (react-grid-layout)

**Reference:** Monday.com has 30+ dashboard widgets. ClickUp has 50+. Both use grid-based drag-and-drop layouts. react-grid-layout is the standard open-source solution (used by Grafana, Kibana, Jupyter).

```
┌────────────────────────────────────────────────┐
│ Dashboard Page                                  │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ react-grid-layout                        │   │
│  │                                          │   │
│  │  ┌────────┐ ┌────────┐ ┌──────────────┐ │   │
│  │  │ Number │ │ Chart  │ │   Table      │ │   │
│  │  │ Widget │ │ Widget │ │   Widget     │ │   │
│  │  └────────┘ └────────┘ └──────────────┘ │   │
│  │  ┌─────────────────┐ ┌────────────────┐ │   │
│  │  │ Battery Widget  │ │ Status Widget  │ │   │
│  │  └─────────────────┘ └────────────────┘ │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  [+ Add Widget] button → widget type picker     │
└────────────────────────────────────────────────┘
```

**Widget registry (same pattern as columns):**

| Widget             | Data Source                | Viz Library         | Description                 |
| ------------------ | -------------------------- | ------------------- | --------------------------- |
| `number`           | Aggregation on column      | Custom              | Count, sum, avg of a column |
| `chart_bar`        | Group-by + aggregate       | Recharts (existing) | Bar chart                   |
| `chart_pie`        | Group-by + count           | Recharts            | Pie/donut                   |
| `chart_line`       | Date column + aggregate    | Recharts            | Time series                 |
| `table`            | Board items (filtered)     | TanStack Table      | Mini table view             |
| `battery`          | Status column distribution | Custom SVG          | Progress bar                |
| `status_breakdown` | Status column counts       | Custom              | Horizontal stacked bar      |

Each widget config is stored as JSONB in `mindflow_dashboard_widgets`:

```jsonc
{
  "type": "chart_bar",
  "board_id": "uuid",
  "column_id": "col_status_1",     // Which column to aggregate
  "group_by": "col_person_1",       // Optional grouping
  "filters": [...],                  // Optional filters
  "layout": { "x": 0, "y": 0, "w": 6, "h": 4 }  // react-grid-layout position
}
```

### 1.6 Automation Engine (Trigger + Condition + Action)

**Reference:** Monday.com has 50+ triggers and 50+ actions with a visual workflow builder. ClickUp has 17+ triggers and 20+ actions. For MindFlow MVP, we start with 10 recipes.

The automation engine is server-side (Supabase Database Functions + pg_cron or n8n webhooks), NOT client-side. The UI is a builder in the frontend, but execution happens in PostgreSQL triggers or via n8n webhook calls.

```
┌──────────────────────────────────────────────┐
│ Automation Rule (stored in mindflow_automations)│
│                                                 │
│  WHEN [trigger]                                 │
│    IF [conditions] (optional)                   │
│    THEN [actions]                                │
│                                                 │
│  Example:                                       │
│  WHEN status changes to "Done"                  │
│    IF priority = "High"                         │
│    THEN notify person column via webhook        │
│         AND move item to "Archive" group        │
└─────────────────────────────────────────────────┘
```

**Execution flow:**

```
Item updated (Supabase)
      │
      ▼
PostgreSQL AFTER UPDATE trigger on mindflow_items
      │
      ▼
Check mindflow_automations WHERE board_id = item.board_id AND is_active = true
      │
      ▼
For each matching automation:
  1. Evaluate trigger (column changed? which column?)
  2. Evaluate conditions (JSONB path check on column_values)
  3. Execute actions:
     - Internal (UPDATE item, NOTIFY channel) → SQL function
     - External (webhook, email, GHL) → INSERT into mindflow_automation_queue
       → n8n polls queue or LISTEN/NOTIFY → n8n executes
```

**MVP triggers (10):**

| Trigger             | Fires When                                          |
| ------------------- | --------------------------------------------------- |
| `status_change`     | Status column value changes                         |
| `any_column_change` | Any column value changes                            |
| `item_created`      | New item inserted                                   |
| `item_moved`        | Item moved to different group                       |
| `date_arrives`      | Date column reaches today (via pg_cron daily check) |
| `person_assigned`   | Person column updated                               |
| `checkbox_checked`  | Checkbox set to true                                |
| `item_archived`     | Item archived                                       |
| `recurring`         | Cron schedule (daily/weekly/monthly)                |
| `webhook_received`  | External webhook hits endpoint                      |

**MVP actions (8):**

| Action           | Effect                                   |
| ---------------- | ---------------------------------------- |
| `change_status`  | Update status column to specified value  |
| `change_column`  | Update any column to specified value     |
| `move_item`      | Move to specified group                  |
| `create_item`    | Create new item in specified board/group |
| `notify_person`  | Send notification (toast/email/webhook)  |
| `send_webhook`   | POST to external URL                     |
| `archive_item`   | Set archived = true                      |
| `duplicate_item` | Clone item with all column values        |

### 1.7 Command Palette (cmdk)

The existing AI Factory Layout has a search modal (Cmd+K in `Layout.tsx`). MindFlow extends this with board-specific commands.

**Reference:** ClickUp's Cmd+K is best-in-class — fuzzy search across tasks, docs, people, and commands. Linear also excels here.

```typescript
// command-palette/MindflowCommands.tsx
// Registers commands with the global command palette

const MINDFLOW_COMMANDS = [
  // Navigation
  {
    id: "mf:boards",
    label: "Go to Boards",
    action: () => navigate("/mindflow"),
  },
  { id: "mf:board", label: "Go to Board...", search: true }, // fuzzy search board names

  // Quick actions
  { id: "mf:new-board", label: "Create New Board", action: createBoard },
  { id: "mf:new-item", label: "Add Item to Current Board", action: addItem },
  { id: "mf:switch-view", label: "Switch View...", search: true },

  // Filters
  { id: "mf:filter", label: "Filter Current View...", action: openFilterPanel },
  { id: "mf:group-by", label: "Group By...", action: openGroupByPicker },

  // Board management
  { id: "mf:templates", label: "Create from Template...", search: true },
  { id: "mf:export", label: "Export Board to CSV", action: exportBoard },
];
```

Integration: The global Layout.tsx `SearchCommand` component gets a `<MindflowCommands />` section that appears when on `/mindflow/*` routes.

---

## 2. Database Schema

### Entity Relationship Diagram

```
mindflow_boards
  ├── id (PK, UUID)
  ├── workspace_id (FK → auth.users org, nullable Phase 1)
  ├── name
  ├── description
  ├── columns JSONB[]          ── Column definitions (type, label, settings)
  ├── column_order TEXT[]       ── Display order of column IDs
  ├── icon TEXT                 ── Emoji or Lucide icon name
  ├── color TEXT                ── Board accent color
  ├── created_by (FK → auth.users)
  ├── is_archived BOOLEAN
  ├── created_at, updated_at
  │
  ├──< mindflow_groups
  │     ├── id (PK, UUID)
  │     ├── board_id (FK)
  │     ├── name
  │     ├── color TEXT
  │     ├── position TEXT       ── Fractional index
  │     ├── is_collapsed BOOLEAN
  │     └── created_at, updated_at
  │
  ├──< mindflow_items
  │     ├── id (PK, UUID)
  │     ├── board_id (FK, indexed)
  │     ├── group_id (FK, indexed)
  │     ├── parent_id (FK → self, nullable)  ── Subitems
  │     ├── name TEXT
  │     ├── column_values JSONB    ── { "col_abc123": { "value": ... }, ... }
  │     ├── position TEXT          ── Fractional index
  │     ├── path TEXT              ── Materialized path: "board/group/item"
  │     ├── is_archived BOOLEAN
  │     ├── created_by (FK)
  │     └── created_at, updated_at
  │
  ├──< mindflow_views
  │     ├── id (PK, UUID)
  │     ├── board_id (FK)
  │     ├── name
  │     ├── type TEXT              ── 'table' | 'kanban' | 'calendar'
  │     ├── position INT
  │     ├── filters JSONB          ── [{ column_id, operator, value }]
  │     ├── sort_config JSONB      ── [{ column_id, direction }]
  │     ├── group_by TEXT          ── column_id or null
  │     ├── hidden_columns TEXT[]
  │     ├── column_widths JSONB    ── { "col_abc": 200 }
  │     ├── kanban_config JSONB    ── { status_column_id, card_fields[] }
  │     ├── calendar_config JSONB  ── { date_column_id, end_date_column_id }
  │     ├── is_default BOOLEAN
  │     ├── created_by (FK)
  │     └── created_at, updated_at
  │
  ├──< mindflow_dashboards
  │     ├── id (PK, UUID)
  │     ├── board_id (FK, nullable) ── null = cross-board dashboard
  │     ├── name
  │     ├── created_by (FK)
  │     └── created_at, updated_at
  │
  ├──< mindflow_dashboard_widgets
  │     ├── id (PK, UUID)
  │     ├── dashboard_id (FK)
  │     ├── type TEXT              ── 'number' | 'chart_bar' | 'chart_pie' | ...
  │     ├── config JSONB           ── Widget-specific config
  │     ├── layout JSONB           ── { x, y, w, h } for react-grid-layout
  │     └── created_at, updated_at
  │
  └──< mindflow_automations
        ├── id (PK, UUID)
        ├── board_id (FK)
        ├── name
        ├── trigger JSONB          ── { type, column_id, value }
        ├── conditions JSONB       ── [{ column_id, operator, value }]
        ├── actions JSONB          ── [{ type, config }]
        ├── is_active BOOLEAN
        ├── run_count INT DEFAULT 0
        ├── last_run_at TIMESTAMPTZ
        ├── created_by (FK)
        └── created_at, updated_at
```

### Column Definitions (stored in `mindflow_boards.columns`)

```jsonc
// mindflow_boards.columns JSONB example:
[
  {
    "id": "col_status_1",
    "type": "status",
    "label": "Status",
    "settings": {
      "labels": [
        { "index": 0, "label": "Not Started", "color": "#C4C4C4" },
        { "index": 1, "label": "Working on it", "color": "#FDAB3D" },
        { "index": 2, "label": "Done", "color": "#00C875" },
        { "index": 3, "label": "Stuck", "color": "#E2445C" },
      ],
      "default_index": 0,
    },
    "width": 150,
  },
  {
    "id": "col_person_1",
    "type": "person",
    "label": "Owner",
    "settings": { "multiple": false },
    "width": 120,
  },
  {
    "id": "col_date_1",
    "type": "date",
    "label": "Due Date",
    "settings": { "include_time": false },
    "width": 130,
  },
]
```

### Item Column Values (stored in `mindflow_items.column_values`)

```jsonc
// mindflow_items.column_values JSONB example:
{
  "col_status_1": { "index": 1 },
  "col_person_1": { "user_ids": ["uuid-1"] },
  "col_date_1": { "date": "2026-03-15" },
  "col_number_1": { "value": 42, "unit": "$" },
  "col_text_1": { "value": "Some description" },
}
```

### Materialized Path

The `path` column on `mindflow_items` enables efficient subtree queries:

```sql
-- All items in a board (including subitems)
SELECT * FROM mindflow_items WHERE board_id = $1 AND NOT is_archived;

-- Direct children of an item (subitems)
SELECT * FROM mindflow_items WHERE parent_id = $1;

-- Full subtree (if needed for deeply nested items, Phase 2)
SELECT * FROM mindflow_items WHERE path LIKE 'board_uuid/group_uuid/parent_uuid/%';
```

For MVP, subitems are only 1 level deep (parent_id is sufficient). Materialized path is included for future extensibility if deeper nesting is needed.

### Indexes

```sql
-- Core query paths
CREATE INDEX idx_mindflow_items_board_id ON mindflow_items(board_id) WHERE NOT is_archived;
CREATE INDEX idx_mindflow_items_group_id ON mindflow_items(group_id);
CREATE INDEX idx_mindflow_items_parent_id ON mindflow_items(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_mindflow_items_position ON mindflow_items(board_id, group_id, position);

-- JSONB column value queries (for filters/automations)
CREATE INDEX idx_mindflow_items_column_values ON mindflow_items USING GIN(column_values);

-- Views per board
CREATE INDEX idx_mindflow_views_board_id ON mindflow_views(board_id);

-- Automations per board (active only)
CREATE INDEX idx_mindflow_automations_board_active ON mindflow_automations(board_id) WHERE is_active;
```

### RLS Policies

```sql
-- Phase 1: User can access boards they created (single-user)
-- Phase 2: Workspace-based access with roles

ALTER TABLE mindflow_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own boards"
  ON mindflow_boards FOR ALL
  USING (created_by = auth.uid());

-- Items inherit access from board
CREATE POLICY "Users can CRUD items in own boards"
  ON mindflow_items FOR ALL
  USING (board_id IN (SELECT id FROM mindflow_boards WHERE created_by = auth.uid()));
```

### Supabase Realtime

One channel per board, subscribed when `BoardProvider` mounts:

```typescript
// Channel: `board:{boardId}`
// Listens to: mindflow_items, mindflow_groups (filtered by board_id)
// Events: INSERT, UPDATE, DELETE
// On receive: merge into local state (dedup by id + updated_at)
```

**Conflict resolution:** Last-write-wins with `updated_at` comparison. If a remote update has an older `updated_at` than local state (from optimistic update), ignore it. This is simple and sufficient for MVP.

---

## 3. Data Flow

### 3.1 How Views Render From Same Board Data

```
User navigates to /mindflow/board/:id
          │
          ▼
    BoardPage.tsx mounts
          │
          ▼
    <BoardProvider boardId={id}>     ← fetches board + groups + items + views
          │                            from Supabase, subscribes to Realtime
          ▼
    <BoardHeader />                  ← view tabs, filters, sort
          │
          ▼
    Active View Component             ← lazy-loaded based on view.type
    (TableView | KanbanView | CalendarView)
          │
          ▼
    View reads from BoardContext:
      - items (filtered by view.filters, sorted by view.sort_config)
      - groups (grouped by view.group_by or board default)
      - columns (with view.hidden_columns applied)
          │
          ▼
    View renders using Column Registry
    (each cell type resolved via getColumnType(col.type))
```

**Key principle:** Views are PURE renderers. They do not own data — they transform board context data through their filter/sort/group lens.

```typescript
// Inside any view component:
const { items, groups, columns, updateItem } = useBoardContext();
const { filters, sortConfig, groupBy, hiddenColumns } = useActiveView();

// Apply view-specific transformations
const filteredItems = applyFilters(items, filters, columns);
const sortedItems = applySort(filteredItems, sortConfig, columns);
const groupedItems = applyGroupBy(sortedItems, groupBy, groups);
const visibleColumns = columns.filter((c) => !hiddenColumns.includes(c.id));
```

### 3.2 How Inline Editing Works

```
User clicks cell in TableView
          │
          ▼
    Cell switches from renderCell() to renderEditor()
    (Column Registry provides both)
          │
    User types / selects value
          │
          ▼
    onChange fires (debounced 300ms for text, immediate for select/checkbox)
          │
          ▼
    1. OPTIMISTIC: setItems(prev => mergeColumnValue(prev, itemId, colId, newValue))
       → UI updates immediately
          │
    2. SERVER: supabase.from('mindflow_items')
         .update({ column_values: mergedJsonb, updated_at: now })
         .eq('id', itemId)
          │
          ├── SUCCESS: Realtime echoes back → deduped (already applied)
          │
          └── ERROR: rollback optimistic update + show toast error
```

**JSONB merge strategy:**

```sql
-- Supabase RPC function for atomic JSONB merge (avoids overwriting other columns)
CREATE OR REPLACE FUNCTION mindflow_update_column_value(
  p_item_id UUID,
  p_column_id TEXT,
  p_value JSONB
) RETURNS void AS $$
BEGIN
  UPDATE mindflow_items
  SET column_values = column_values || jsonb_build_object(p_column_id, p_value),
      updated_at = now()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;
```

This avoids the classic JSONB race condition where two concurrent edits to different columns could overwrite each other.

### 3.3 How DnD Updates Positions

```
User drags item from Group A position 3 to Group B position 1
          │
          ▼
    @dnd-kit onDragEnd fires with:
      { active: { id: itemId }, over: { id: targetItemId, data: { groupId, index } } }
          │
          ▼
    1. Calculate new fractional position:
       - Get positions of items at index 0 and index 1 in Group B
       - Generate midpoint: generateKeyBetween(pos0, pos1)
          │
    2. OPTIMISTIC: move item in local state
       - Remove from Group A items
       - Insert into Group B items at correct position
       - Update item.group_id + item.position
          │
    3. SERVER: supabase.from('mindflow_items')
         .update({ group_id: groupB.id, position: newPos, updated_at: now })
         .eq('id', itemId)
          │
    4. Realtime broadcasts change → other clients update
```

**Why fractional indexing:** Avoids rewriting all `position` values when inserting between items. Only the moved item gets a new position. Linear and Plane both use this approach.

### 3.4 How Real-Time Sync Works

```
Client A (editor)                    Supabase                     Client B (viewer)
       │                                │                                │
       │  UPDATE item col_values        │                                │
       │ ──────────────────────────────>│                                │
       │                                │                                │
       │  (optimistic update applied)   │  Realtime postgres_changes     │
       │                                │ ──────────────────────────────>│
       │                                │                                │
       │  Realtime echo (ignored -      │                                │  Apply remote change
       │   already applied locally)     │                                │  to local state
       │ <──────────────────────────────│                                │
```

**Channel structure:**

```typescript
// One channel per board, multiplexed events
supabase
  .channel(`board:${boardId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "mindflow_items",
      filter: `board_id=eq.${boardId}`,
    },
    handleItemChange,
  )
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "mindflow_groups",
      filter: `board_id=eq.${boardId}`,
    },
    handleGroupChange,
  )
  .subscribe();
```

**Dedup logic:** When a Realtime event arrives, compare `event.new.updated_at` with the local item's `updated_at`. If remote is older or equal, skip (it's our own optimistic update echoing back). If remote is newer, apply it.

---

## 4. Integration Points

### 4.1 HashRouter Routes

MindFlow adds a new route group in `App.tsx`:

```typescript
// In App.tsx, alongside existing route groups:

{/* MindFlow */}
<Route path="/mindflow" element={<ProtectedRoute><Layout><MindflowHome /></Layout></ProtectedRoute>} />
<Route path="/mindflow/board/:boardId" element={<ProtectedRoute><Layout><BoardPage /></Layout></ProtectedRoute>} />
<Route path="/mindflow/dashboard/:dashboardId" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
```

Sidebar entry in `Sidebar.tsx`:

```typescript
// New section in sidebar navigation:
{
  label: 'MindFlow',
  icon: LayoutDashboard,  // Lucide icon
  children: [
    { label: 'Boards', path: '/mindflow', icon: Table2 },
    { label: 'Dashboards', path: '/mindflow/dashboards', icon: BarChart3 },
  ]
}
```

### 4.2 AuthContext Connection

MindFlow reuses the existing `AuthContext` directly:

- `created_by` fields reference `auth.uid()` from Supabase Auth
- `Person` column type queries `auth.users` for avatar/name
- RLS policies use `auth.uid()` for access control
- No additional auth setup needed

### 4.3 GHL Contacts/Leads Integration (Phase 2)

```
┌─────────────────┐         ┌──────────────────┐
│  GHL Contact    │ ──────> │  MindFlow Item   │
│  (via webhook)  │  sync   │  (in CRM board)  │
└─────────────────┘         └──────────────────┘
        │                            │
        │ location_id                │ column_values includes
        │ contact_id                 │ { ghl_contact_id, phone, email,
        │ tags, custom fields        │   pipeline_stage, ... }
        ▼                            ▼
  n8n workflow listens        Board template "CRM"
  for GHL webhooks            pre-configured with
  and upserts items           matching columns
```

Integration paths:

1. **Import:** n8n workflow fetches GHL contacts → creates items in a CRM-type board
2. **Sync:** GHL webhook → n8n → Supabase upsert to `mindflow_items` with `ghl_contact_id` in metadata
3. **Bi-directional (Phase 3):** MindFlow status change → automation → n8n → GHL pipeline update

### 4.4 Existing Component Reuse

| AI Factory Component                | MindFlow Usage                               |
| ----------------------------------- | -------------------------------------------- |
| `Layout.tsx`                        | Page wrapper (sidebar, header, content area) |
| `AuthContext`                       | Auth state, user info for Person columns     |
| `useToast`                          | Notification feedback on CRUD operations     |
| `SearchCommand` (Cmd+K)             | Extended with MindFlow commands              |
| `Recharts` components               | Dashboard widget charts                      |
| `MetricCard`                        | Dashboard number widgets                     |
| `DateRangePicker`                   | Date column editor, calendar view range      |
| `Badge` (ui/)                       | Status pills, tag display                    |
| Supabase client (`lib/supabase.ts`) | All data access                              |

---

## 5. Suggested Build Order

Dependencies flow downward — each phase builds on the previous.

```
Phase 0: Foundation (no UI yet)
  ├── Database schema (SQL migrations)
  ├── TypeScript types (mindflow.ts)
  ├── Column Registry (column-registry.ts)
  └── Supabase hooks skeleton (useBoard, useBoardItems)

Phase 1: Table View (core loop)
  ├── BoardProvider context
  ├── BoardPage + BoardHeader
  ├── GroupContainer + ItemRow
  ├── Table View with TanStack Table
  │   ├── Column rendering via registry
  │   ├── Inline editing (text, number, status, date)
  │   └── Add item / add group
  ├── Board list page (MindflowHome)
  ├── Routes + Sidebar integration
  └── Realtime subscription

Phase 2: DnD + More Column Types
  ├── @dnd-kit integration (item reorder, group reorder)
  ├── Column reorder (drag headers)
  ├── Remaining column types (person, dropdown, checkbox, url, rating)
  ├── Bulk selection + floating toolbar
  └── Fractional indexing for positions

Phase 3: Kanban View
  ├── KanbanView component
  ├── DnD between kanban columns
  ├── Card layout configuration
  └── View switching (tabs in BoardHeader)

Phase 4: Views Infrastructure
  ├── View CRUD (create, rename, delete views)
  ├── Filter builder UI
  ├── Sort configuration UI
  ├── Group-by picker
  ├── View-specific saved state
  └── Hidden columns per view

Phase 5: Calendar View
  ├── CalendarView component (@schedule-x)
  ├── Date column mapping config
  └── DnD date reassignment

Phase 6: Dashboard Builder
  ├── react-grid-layout integration
  ├── Widget registry
  ├── Number / Chart / Table widgets
  ├── Widget config modals
  └── Dashboard CRUD

Phase 7: Automations
  ├── Automation rule builder UI
  ├── PostgreSQL trigger functions
  ├── Automation queue table
  ├── n8n integration for external actions
  └── Automation log/history

Phase 8: Polish
  ├── Command palette extensions
  ├── Board templates (Project, CRM, Sprint, Onboarding)
  ├── Import/Export (CSV)
  ├── Subitems support
  ├── Permissions (Admin/Member/Viewer)
  └── Performance optimization (virtualization for 1000+ items)
```

### Dependency Graph

```
Phase 0 ──> Phase 1 ──> Phase 2 ──> Phase 3
                │                       │
                │                       ▼
                │                   Phase 4 (views infra)
                │                       │
                │              ┌────────┼────────┐
                │              ▼        ▼        ▼
                │          Phase 5  Phase 6  Phase 7
                │          (calendar)(dashboard)(automations)
                │              │        │        │
                │              └────────┼────────┘
                │                       ▼
                └──────────────────> Phase 8 (polish)
```

**Phases 5, 6, and 7 are independent** of each other and can be built in parallel or in any order after Phase 4. Phase 8 is polish that can happen incrementally throughout.

### Estimated Scope per Phase

| Phase | New Files | New DB Tables       | Key Dependencies to Install                                |
| ----- | --------- | ------------------- | ---------------------------------------------------------- |
| 0     | ~5        | 6 tables            | `fractional-indexing`                                      |
| 1     | ~12       | 0                   | `@tanstack/react-table`, `@tanstack/react-virtual`         |
| 2     | ~6        | 0                   | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| 3     | ~4        | 0                   | (uses @dnd-kit from Phase 2)                               |
| 4     | ~6        | 0                   | (none)                                                     |
| 5     | ~3        | 0                   | `@schedule-x/react` (or `@fullcalendar/react`)             |
| 6     | ~8        | 2 tables            | `react-grid-layout`                                        |
| 7     | ~6        | 1 table + functions | (none, or n8n integration)                                 |
| 8     | ~10       | 0                   | `cmdk`                                                     |

---

## Appendix: Key Architectural Decisions

### Why JSONB for column_values (not EAV or wide tables)?

| Approach                         | Pros                                                                                  | Cons                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **JSONB** (chosen)               | Flexible schema, single row per item, GIN indexing, Supabase Realtime works naturally | No foreign key on values, query syntax more complex                |
| **EAV** (entity-attribute-value) | Relational purity, easy to add columns                                                | N+1 queries, expensive JOINs for board view, poor Realtime support |
| **Wide table** (Teable approach) | SQL native, strong typing                                                             | DDL on every column add/remove, hard to manage per-board schemas   |

Monday.com, Plane, and Huly all use the JSONB approach. It's the right trade-off for a board tool where schema flexibility is the core feature.

### Why @dnd-kit over alternatives?

- **@dnd-kit** (13KB): React-first, smooth animations built-in, excellent accessibility, active maintenance
- **pragmatic-drag-and-drop** (8KB, Atlassian): Smaller but framework-agnostic (more boilerplate for React), animations are manual
- **hello-pangea/dnd** (30KB): Fork of react-beautiful-dnd, larger bundle, being replaced by pragmatic-dnd even at Atlassian

@dnd-kit is the current standard for React DnD. Plane uses it. Linear uses it.

### Why Fractional Indexing for positions?

With integer positions, inserting an item between positions 3 and 4 requires rewriting positions 4, 5, 6, ..., N. With fractional indexing, you generate a key between `a3` and `a4` (e.g., `a3V`) — only 1 row update. At scale (1000+ items), this is significantly better for both performance and Realtime (fewer change events).

### Why NOT a separate backend (GraphQL/REST API)?

The existing AI Factory has zero backend API layer — all 30+ pages query Supabase directly via hooks. Adding a GraphQL server for MindFlow alone would create architectural inconsistency. When/if the whole AI Factory migrates to an API layer, MindFlow migrates with it.

---

_Architecture draft: 2026-03-05_
