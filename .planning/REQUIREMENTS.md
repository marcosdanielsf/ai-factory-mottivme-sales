# MindFlow - Requirements v1

> Milestone 1: MVP Board Engine + Table + Kanban
> Generated: 2026-03-05 | Source: research + user scoping

---

## v1 Requirements

### Board Engine

- [ ] **BOARD-01**: User can create a board with name, description, and typed columns (Text, Number, Status, Date, Person, Dropdown, Checkbox)
- [ ] **BOARD-02**: User can add, rename, reorder, and delete columns on a board via drag-and-drop
- [ ] **BOARD-03**: User can create collapsible, colorable groups (sections) within a board
- [ ] **BOARD-04**: User can create subitems (1 level deep) under any item, collapsible in table view
- [ ] **BOARD-05**: User can reorder items within and between groups via drag-and-drop
- [ ] **BOARD-06**: Column types render appropriate editors: Text (inline input), Number (formatted input), Status (color-coded dropdown), Date (date picker), Person (user selector), Dropdown (custom options), Checkbox (toggle)
- [ ] **BOARD-07**: Board stores column definitions as JSONB and item values as JSONB (column_values pattern)

### Table View

- [ ] **TABLE-01**: User can view board items in a table with inline editing (click cell = type-specific editor)
- [ ] **TABLE-02**: Table virtualizes rows for boards with 1000+ items using TanStack Virtual
- [ ] **TABLE-03**: User can resize columns by dragging column borders
- [ ] **TABLE-04**: User can hide/show columns per view
- [ ] **TABLE-05**: User can select multiple rows (checkbox, Shift+click range) and perform bulk actions via floating toolbar (delete, move, change status, assign)
- [ ] **TABLE-06**: Table has sticky header and sticky first column
- [ ] **TABLE-07**: User can navigate between cells using Tab key

### Kanban View

- [ ] **KANBAN-01**: User can view board items as Kanban cards grouped by Status column, with drag-and-drop between columns
- [ ] **KANBAN-02**: User can group Kanban by any column type (Status, Person, Dropdown)
- [ ] **KANBAN-03**: User can configure which fields are visible on Kanban cards
- [ ] **KANBAN-04**: Kanban columns show card count and can be collapsed

### Filtering, Sorting, Grouping

- [ ] **FILTER-01**: User can filter items by any column with type-appropriate operators (equals, contains, is empty, greater than, etc.)
- [ ] **FILTER-02**: User can combine multiple filters with AND/OR logic
- [ ] **FILTER-03**: User can sort items by any column (asc/desc), including multi-column sort
- [ ] **FILTER-04**: User can group items by any column (collapsible group headers with counts)
- [ ] **FILTER-05**: Filters, sort, and group-by settings are saved independently per view
- [ ] **FILTER-06**: User can search items by name via quick filter bar

### CRUD & Data

- [ ] **CRUD-01**: User can create items inline (add row at bottom of group)
- [ ] **CRUD-02**: User can duplicate an item (copies all column values)
- [ ] **CRUD-03**: User can delete items (with confirmation dialog)
- [ ] **CRUD-04**: User can archive items (soft delete with archived_at timestamp)
- [ ] **CRUD-05**: User can move items between groups via drag-and-drop or context menu
- [ ] **CRUD-06**: User can open item detail panel (sidebar) showing all fields, description (rich text), and activity
- [ ] **CRUD-07**: System logs activity per item (who changed what field, when) in audit trail

### Real-time & Collaboration

- [ ] **RT-01**: Changes made by other users appear in real-time without page refresh (Supabase Realtime)
- [ ] **RT-02**: Board shows presence indicators (avatars of users currently viewing)

### Permissions

- [ ] **PERM-01**: Board supports 3 roles: Admin (full control), Member (edit items), Viewer (read-only)
- [ ] **PERM-02**: Board owner can invite users and assign roles
- [ ] **PERM-03**: Supabase RLS enforces permissions at database level

### Navigation & UX

- [ ] **NAV-01**: MindFlow has dedicated sidebar section with workspace/board navigation
- [ ] **NAV-02**: User can switch between Table and Kanban views via tabs
- [ ] **NAV-03**: Command palette (Cmd+K) allows quick navigation to any board, item, or action
- [ ] **NAV-04**: Breadcrumb navigation shows current location (Workspace > Board > View)

### Templates

- [ ] **TPL-01**: System provides 4 pre-built board templates: Projeto, CRM, Sprint, Onboarding
- [ ] **TPL-02**: User can create a board from template (pre-configured columns, groups, and sample items)

### Multi-tenant

- [ ] **MT-01**: Boards are scoped to location_id for client isolation (RLS policies)
- [ ] **MT-02**: Internal MOTTIVME workspace serves as first tenant for validation

---

## v2 Requirements (Deferred)

- [ ] Calendar view for items with dates
- [ ] Gantt chart with dependencies (SVAR React Gantt)
- [ ] Dashboard builder with draggable widgets (charts, numbers, battery, table)
- [ ] Automation engine (trigger + condition + action, 10 initial recipes)
- [ ] AI columns (scoring, auto-fill, sentiment, summarize)
- [ ] GHL leads sync as board items
- [ ] Formula column
- [ ] Rich text docs (TipTap collaborative)
- [ ] Form view (public form creates items)
- [ ] Comments with @mentions on items
- [ ] File attachments on items
- [ ] White-label multi-tenant for AI Factory clients

---

## Out of Scope

| Exclusion                  | Rationale                                                 |
| -------------------------- | --------------------------------------------------------- |
| Mobile native app          | Web-first. Responsive PWA later.                          |
| Apps marketplace           | Premature complexity. Extend codebase directly.           |
| Whiteboards / canvas       | Not core PM. Embed Miro/Excalidraw if needed.             |
| Video calls / chat         | Use Slack/WhatsApp/GHL conversations.                     |
| Complex Gantt v1           | Defer to v2 with SVAR React Gantt.                        |
| Connect Boards + Mirror    | Requires distributed query engine. v2.                    |
| Goals/OKRs                 | Already have business_okrs in Supabase. Integrate v2.     |
| Sprint management complete | Burndown/velocity = v2. Status columns sufficient for v1. |
| Time tracking native       | Timer + timesheet = complex UX. v2.                       |
| 7-level hierarchy          | Over-engineering. 4 levels + subitems = sufficient.       |
| Multi-LLM user selection   | We pick best model per task internally.                   |
| n8n workflow triggers      | v3 platform play.                                         |
| Agent actions column       | v3 platform play.                                         |

---

## Traceability

> Populated by roadmap creation (maps REQ-IDs to phases)

| REQ-ID | Phase | Status |
| ------ | ----- | ------ |
| —      | —     | —      |

---

## Requirement Stats

- **v1 Total:** 40 requirements
- **Categories:** 10 (Board Engine, Table View, Kanban, Filter/Sort/Group, CRUD, Real-time, Permissions, Navigation, Templates, Multi-tenant)
- **High Complexity:** BOARD-01, BOARD-06, TABLE-01
- **Core Value Alignment:** BOARD-01 + TABLE-01 + KANBAN-01 = "Boards flexiveis com colunas tipadas e edicao inline"

---

_Last updated: 2026-03-05 after requirements scoping_
