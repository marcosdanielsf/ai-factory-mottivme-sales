# MindFlow - Feature Catalog

> Categorized feature list based on market research (Monday.com, ClickUp, 18 open-source projects).
> Source: `~/pesquisa-pm-tool-2026.md` | Date: 2026-03-05

---

## Table Stakes

Features users expect from any PM tool. Missing any of these = users leave.

### Board Engine

| Feature                                                                           | Complexity | Dependencies                         | Who Has It |
| --------------------------------------------------------------------------------- | ---------- | ------------------------------------ | ---------- |
| Board with typed columns (Text, Number, Status, Date, Person, Dropdown, Checkbox) | High       | Supabase schema, JSONB column_values | Both       |
| Groups/sections within boards (collapsible, colorable)                            | Medium     | Board engine                         | Both       |
| Items (rows) CRUD with optimistic updates                                         | Medium     | Supabase Realtime                    | Both       |
| Subitems (1 level deep, collapsible)                                              | Medium     | Board engine, materialized path      | Both       |
| Column reordering via drag-and-drop                                               | Low        | @dnd-kit                             | Both       |
| Item reordering via drag-and-drop                                                 | Medium     | @dnd-kit, sort_order persistence     | Both       |
| Item ID / Auto Number column                                                      | Low        | PostgreSQL sequence                  | Both       |
| Creation Log / Last Updated (auto columns)                                        | Low        | PostgreSQL triggers                  | Both       |

### Table View

| Feature                                                 | Complexity | Dependencies                               | Who Has It |
| ------------------------------------------------------- | ---------- | ------------------------------------------ | ---------- |
| Table view with inline editing (click cell = editor)    | High       | TanStack Table v8, cell renderers per type | Both       |
| Column resize                                           | Low        | TanStack Table                             | Both       |
| Column hide/show                                        | Low        | TanStack Table, view settings              | Both       |
| Row selection (checkbox, Shift+click range, Ctrl+click) | Medium     | TanStack Table row selection               | Both       |
| Sticky header + sticky first column                     | Low        | CSS sticky                                 | Both       |
| Virtualized rows for large boards (1000+ items)         | Medium     | TanStack Virtual                           | Both       |
| Tab navigation between cells                            | Low        | Keyboard event handlers                    | Monday     |

### Kanban View

| Feature                                                  | Complexity | Dependencies            | Who Has It |
| -------------------------------------------------------- | ---------- | ----------------------- | ---------- |
| Kanban board grouped by Status column                    | Medium     | @dnd-kit, status column | Both       |
| Drag-and-drop cards between columns                      | Medium     | @dnd-kit/sortable       | Both       |
| Group by any column (Status, Person, Dropdown, Priority) | Medium     | Dynamic grouping logic  | Both       |
| Card preview (configurable visible fields)               | Low        | View settings           | Both       |
| Column collapse                                          | Low        | UI state                | Both       |
| Card count per column                                    | Low        | Derived count           | Both       |

### Filtering, Sorting, Grouping

| Feature                                                                          | Complexity | Dependencies                      | Who Has It |
| -------------------------------------------------------------------------------- | ---------- | --------------------------------- | ---------- |
| Filter by any column (operators: equals, contains, is empty, greater than, etc.) | Medium     | Filter engine, per-type operators | Both       |
| Multi-filter with AND/OR logic                                                   | Medium     | Filter engine                     | Both       |
| Sort by any column (asc/desc, multi-sort)                                        | Low        | TanStack Table sorting            | Both       |
| Group by any column (collapsible groups)                                         | Medium     | TanStack Table grouping           | Both       |
| Save filters/sort/group per view                                                 | Medium     | View settings table (Supabase)    | Both       |
| Quick filter bar (search items by name)                                          | Low        | Text search                       | Both       |

### CRUD & Data

| Feature                                            | Complexity | Dependencies                     | Who Has It              |
| -------------------------------------------------- | ---------- | -------------------------------- | ----------------------- |
| Create item (inline row add, bottom of group)      | Low        | Board engine                     | Both                    |
| Duplicate item                                     | Low        | Board engine                     | Both                    |
| Delete item (with confirmation)                    | Low        | Board engine                     | Both                    |
| Archive item (soft delete)                         | Low        | `archived_at` column             | Both                    |
| Move item between groups                           | Low        | @dnd-kit or menu                 | Both                    |
| Bulk actions (delete, move, change status, assign) | Medium     | Row selection + floating toolbar | Both                    |
| Item detail panel (sidebar or modal)               | Medium     | UI component                     | Both (ClickUp: 4 modes) |
| Activity log per item (who changed what, when)     | Medium     | Audit trail table                | Both                    |

### Real-time & Collaboration

| Feature                                          | Complexity | Dependencies                       | Who Has It |
| ------------------------------------------------ | ---------- | ---------------------------------- | ---------- |
| Real-time updates (see changes from other users) | Medium     | Supabase Realtime broadcast        | Both       |
| Presence indicators (who is viewing the board)   | Medium     | Supabase Realtime presence         | Both       |
| Comments/updates on items                        | Medium     | Comments table, TipTap mini editor | Both       |
| @mentions in comments                            | Medium     | TipTap mention extension           | Both       |
| File attachments on items                        | Medium     | Supabase Storage, react-dropzone   | Both       |

### Navigation & UX

| Feature                                          | Complexity | Dependencies               | Who Has It |
| ------------------------------------------------ | ---------- | -------------------------- | ---------- |
| Sidebar navigation (workspaces, boards)          | Low        | Existing sidebar pattern   | Both       |
| View tabs (switch between Table/Kanban/Calendar) | Low        | React Router or tabs state | Both       |
| Breadcrumb navigation                            | Low        | UI component               | Both       |
| Board search                                     | Low        | Supabase text search       | Both       |

### Permissions

| Feature                        | Complexity | Dependencies                      | Who Has It |
| ------------------------------ | ---------- | --------------------------------- | ---------- |
| 3 roles: Admin, Member, Viewer | Medium     | Supabase RLS, board_members table | Both       |
| Board-level permissions        | Medium     | RLS policies                      | Both       |
| Workspace-level permissions    | Medium     | RLS policies                      | Both       |

---

## Differentiators

Features that give MindFlow competitive advantage. These are NOT in Monday/ClickUp or are done fundamentally differently.

### AI-Native Columns

| Feature                                                     | Complexity | Dependencies                      | Who Has It                   | MindFlow Advantage                          |
| ----------------------------------------------------------- | ---------- | --------------------------------- | ---------------------------- | ------------------------------------------- |
| AI Text Generator column (auto-fill from prompt + context)  | Medium     | OpenAI/Anthropic API, column type | Monday (AI Columns)          | Deeper integration with AI Factory agents   |
| AI Scoring column (auto-score leads/items 0-100)            | Medium     | LLM + scoring prompt              | Neither natively             | Unique -- uses existing agent scoring infra |
| AI Summarize column (summarize long text / activity)        | Low        | LLM API                           | Monday (AI Summarize)        | Lower cost (own models)                     |
| AI Sentiment column                                         | Low        | LLM API                           | Monday (AI Detect Sentiment) | Integrated with GHL conversation data       |
| AI Agent Actions column (trigger agent workflow from board) | High       | n8n integration, agent_versions   | Neither                      | Unique -- agents as board members           |
| AI Auto-categorize (classify items automatically)           | Medium     | LLM API                           | Neither natively             | Uses existing classification infra          |

### GHL / n8n Integration

| Feature                                    | Complexity | Dependencies                        | Who Has It | MindFlow Advantage                     |
| ------------------------------------------ | ---------- | ----------------------------------- | ---------- | -------------------------------------- |
| GHL leads as board items (auto-sync)       | High       | GHL API, sync workflow              | Neither    | Native -- same Supabase, same contacts |
| GHL pipeline stages as Status column       | Medium     | GHL pipelines API                   | Neither    | Zero config for existing clients       |
| n8n workflows as automation triggers       | High       | n8n API, webhook                    | Neither    | Already running 200+ workflows         |
| Agent conversation history in item detail  | Medium     | agent_conversations table           | Neither    | Unique context per lead                |
| Contact enrichment data as columns (Stevo) | Medium     | stevo_accounts, contact_enrichments | Neither    | Already enriching contacts             |

### Cost & Access

| Feature                                  | Complexity | Dependencies       | Who Has It                  | MindFlow Advantage                |
| ---------------------------------------- | ---------- | ------------------ | --------------------------- | --------------------------------- |
| Zero cost per seat (no per-user pricing) | N/A        | Own infrastructure | ClickUp free tier (limited) | Unlimited seats, no feature gates |
| No automation limits                     | N/A        | Own n8n infra      | Neither (all have limits)   | Unlimited automations             |
| Total customization (own codebase)       | N/A        | React + Supabase   | Open-source only            | Full control, no vendor lock-in   |

### Multi-Tenant (AI Factory)

| Feature                                               | Complexity | Dependencies                       | Who Has It          | MindFlow Advantage                    |
| ----------------------------------------------------- | ---------- | ---------------------------------- | ------------------- | ------------------------------------- |
| Client-scoped boards (location_id isolation)          | Medium     | RLS, existing multi-tenant pattern | Neither             | Built into AI Factory architecture    |
| Board templates per vertical (clinica, imoveis, etc.) | Low        | Template system                    | Both have templates | Pre-configured for MOTTIVME verticals |
| White-label boards for AI Factory clients             | Medium     | Theme system, branding             | Neither             | Clients use as their own tool         |

### UX Differentiators

| Feature                                            | Complexity | Dependencies            | Who Has It | MindFlow Advantage                   |
| -------------------------------------------------- | ---------- | ----------------------- | ---------- | ------------------------------------ |
| Command palette (Cmd+K)                            | Low        | cmdk library            | ClickUp    | Unified search across all AI Factory |
| Dark/Light theme                                   | Low        | Existing Tailwind theme | Both       | Already in codebase                  |
| Board templates (Projeto, CRM, Sprint, Onboarding) | Low        | Seed data               | Both       | Tailored for Brazilian SMB verticals |

---

## Nice-to-Have (v2)

Features planned for future versions. Important but not launch-blocking.

### Views

| Feature                                      | Complexity | Dependencies                      | Who Has It |
| -------------------------------------------- | ---------- | --------------------------------- | ---------- |
| Calendar view (items with dates on calendar) | Medium     | @schedule-x/react or FullCalendar | Both       |
| Gantt chart with dependencies                | High       | SVAR React Gantt (MIT)            | Both       |
| Timeline view (horizontal time bars)         | High       | vis-timeline or custom            | Both       |
| Chart/Dashboard view (embedded widgets)      | Medium     | Recharts + react-grid-layout      | Both       |
| Form view (public form that creates items)   | Medium     | React Hook Form + Zod             | Both       |
| Map view (items with location on map)        | Medium     | Mapbox/Google Maps                | Both       |
| Files gallery view                           | Low        | Grid layout + Supabase Storage    | Both       |

### Advanced Columns

| Feature                                         | Complexity | Dependencies                    | Who Has It |
| ----------------------------------------------- | ---------- | ------------------------------- | ---------- |
| Formula column (IF, SUM, CONCATENATE, etc.)     | High       | Math parser (mathjs)            | Both       |
| Connect Boards (cross-board relations)          | High       | board_relation schema           | Monday     |
| Mirror column (project data via Connect Boards) | High       | Connect Boards                  | Monday     |
| Timeline column (date range for Gantt)          | Medium     | Date range picker               | Both       |
| Tags column (multi-select shared across boards) | Medium     | Tags table                      | Both       |
| Rating column (stars 1-5)                       | Low        | UI component                    | Both       |
| Progress bar (based on subitems)                | Low        | Derived calculation             | Both       |
| Button column (trigger automation)              | Medium     | Automation engine               | Monday     |
| Time Tracking column (timer + sessions)         | High       | Timer UI + tracking table       | Both       |
| Email column                                    | Low        | Input validation                | Both       |
| Phone column                                    | Low        | Input validation + country code | Both       |
| URL/Link column                                 | Low        | Input validation                | Both       |
| Location column (geocoding)                     | Medium     | Geocoding API                   | Both       |
| Currency column (formatted number)              | Low        | react-number-format             | ClickUp    |

### Automations

| Feature                                          | Complexity | Dependencies               | Who Has It |
| ------------------------------------------------ | ---------- | -------------------------- | ---------- |
| Automation engine (trigger + condition + action) | High       | Event system, worker queue | Both       |
| Status change triggers                           | Medium     | Column change events       | Both       |
| Date arrives triggers                            | Medium     | Cron/scheduler             | Both       |
| Notify/email actions                             | Medium     | Notification system        | Both       |
| Webhook actions (call external URL)              | Medium     | HTTP client                | Both       |
| Move/create item actions                         | Medium     | Board engine               | Both       |
| Multi-step workflows (branching)                 | High       | Workflow builder           | Monday     |
| Custom automation blocks                         | High       | SDK/framework              | Monday     |

### Dashboard & Reporting

| Feature                                   | Complexity | Dependencies           | Who Has It |
| ----------------------------------------- | ---------- | ---------------------- | ---------- |
| Dashboard builder (drag-and-drop widgets) | High       | react-grid-layout      | Both       |
| Number widget (count, sum, avg)           | Low        | SQL aggregation        | Both       |
| Chart widget (bar, pie, line)             | Medium     | Recharts               | Both       |
| Battery widget (status distribution)      | Low        | Derived calculation    | Monday     |
| Table widget (cross-board data)           | Medium     | Multi-board query      | Both       |
| Workload widget (person x capacity)       | High       | Person + timeline data | Both       |

### Docs & Content

| Feature                        | Complexity | Dependencies               | Who Has It        |
| ------------------------------ | ---------- | -------------------------- | ----------------- |
| Rich text docs (collaborative) | High       | TipTap v2 + Yjs            | Both              |
| Docs embedded in boards        | Medium     | TipTap + board integration | Monday (WorkDocs) |
| Slash commands in docs         | Medium     | TipTap extensions          | Both              |

### Goals & OKRs

| Feature                                              | Complexity | Dependencies | Who Has It |
| ---------------------------------------------------- | ---------- | ------------ | ---------- |
| Goals with targets (Number, Currency, Boolean, Task) | Medium     | Goals table  | ClickUp    |
| Key Results with auto-tracking                       | Medium     | Rollup logic | ClickUp    |
| Goal folders with rollup                             | Medium     | Hierarchy    | ClickUp    |

### Sprints

| Feature                  | Complexity | Dependencies           | Who Has It                            |
| ------------------------ | ---------- | ---------------------- | ------------------------------------- |
| Sprint lists with points | Medium     | Sprint table           | ClickUp (native), Monday (Dev add-on) |
| Burndown / Burnup charts | Medium     | Sprint data + Recharts | ClickUp                               |
| Velocity chart           | Medium     | Sprint history         | ClickUp                               |
| Auto-complete + rollover | Medium     | Sprint engine          | ClickUp                               |

---

## Anti-Features

Features we are deliberately NOT building. Each has a clear rationale.

| Anti-Feature                             | Rationale                                                                                     | Who Has It                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------- |
| Mobile native app (iOS/Android)          | Web-first strategy. Responsive PWA later. Native app = 2x codebase, 2x maintenance.           | Both                              |
| Apps marketplace / extension framework   | Premature complexity. Monday invested years. We control the code -- extend directly.          | Monday (200+ apps)                |
| Whiteboards / drawing canvas             | Not core PM. Low usage vs development cost. Users can embed Miro/Excalidraw.                  | ClickUp                           |
| Video calls / chat nativo                | Use existing tools (Slack, WhatsApp, GHL conversations). Building chat = massive scope creep. | ClickUp (SyncUps)                 |
| Complex Gantt with dependencies (v1)     | High complexity. Defer to v2 with SVAR React Gantt. Basic timeline sufficient for v1.         | Both                              |
| Connect Boards + Mirror cross-board (v1) | Requires distributed query engine. Highest complexity feature in Monday. Defer to v2.         | Monday                            |
| Goals/OKRs (v1)                          | Already have `business_okrs` + `business_key_results` in Supabase. Integrate in v2.           | ClickUp                           |
| Sprint management complete (v1)          | Burndown/velocity charts = v2. Basic status columns sufficient for v1 sprint tracking.        | ClickUp (native), Monday (add-on) |
| Time tracking nativo (v1)                | Timer + timesheet = complex UX. Defer to v2. Column type sufficient for manual entry.         | Both                              |
| Mind Map view                            | Niche usage. Not worth development cost.                                                      | ClickUp                           |
| Proofing (image/video annotations)       | Niche usage. Design tools do this better.                                                     | ClickUp                           |
| Screen recording (Clips)                 | Browser extensions do this. Not PM core.                                                      | ClickUp                           |
| CRM module dedicated                     | GHL IS the CRM. MindFlow boards can model pipelines without a separate CRM module.            | Monday (CRM add-on)               |
| Service/ITSM module                      | Not relevant for MOTTIVME's ICP (clinics, real estate, SMBs).                                 | Monday (Service add-on)           |
| Multi-LLM selection (user picks model)   | Unnecessary complexity. We pick the best model per task internally.                           | ClickUp Brain                     |
| Hierarchia 7 niveis                      | Over-engineering. 4 levels (Workspace > Board > Group > Item) + subitems = sufficient.        | ClickUp                           |

---

## Feature Priority Matrix

Summary view for implementation planning.

### v1 (MVP) -- Ship to validate

| #   | Feature                                   | Category       | Complexity |
| --- | ----------------------------------------- | -------------- | ---------- |
| 1   | Board engine with typed columns (7 types) | Table Stakes   | High       |
| 2   | Table view with inline editing            | Table Stakes   | High       |
| 3   | Kanban view with drag-and-drop            | Table Stakes   | Medium     |
| 4   | Groups/sections (collapsible, colorable)  | Table Stakes   | Medium     |
| 5   | Filtering, sorting, grouping              | Table Stakes   | Medium     |
| 6   | Item CRUD + bulk actions                  | Table Stakes   | Medium     |
| 7   | Item detail panel (sidebar)               | Table Stakes   | Medium     |
| 8   | Real-time updates (Supabase Realtime)     | Table Stakes   | Medium     |
| 9   | Permissions (Admin, Member, Viewer)       | Table Stakes   | Medium     |
| 10  | Board templates (4 pre-built)             | Differentiator | Low        |
| 11  | Command palette (Cmd+K)                   | Differentiator | Low        |
| 12  | Multi-tenant isolation (location_id)      | Differentiator | Medium     |

### v2 -- Expand capabilities

| #   | Feature                                    | Category       | Complexity |
| --- | ------------------------------------------ | -------------- | ---------- |
| 13  | Calendar view                              | Nice-to-Have   | Medium     |
| 14  | Gantt chart with dependencies              | Nice-to-Have   | High       |
| 15  | Dashboard builder with widgets             | Nice-to-Have   | High       |
| 16  | Automation engine (10 recipes)             | Nice-to-Have   | High       |
| 17  | AI columns (scoring, auto-fill, sentiment) | Differentiator | Medium     |
| 18  | GHL leads sync as board items              | Differentiator | High       |
| 19  | Formula column                             | Nice-to-Have   | High       |
| 20  | Rich text docs (TipTap)                    | Nice-to-Have   | High       |
| 21  | Form view                                  | Nice-to-Have   | Medium     |
| 22  | Comments / activity log                    | Table Stakes   | Medium     |

### v3 -- Platform play

| #   | Feature                   | Category       | Complexity |
| --- | ------------------------- | -------------- | ---------- |
| 23  | n8n workflows as triggers | Differentiator | High       |
| 24  | Agent actions column      | Differentiator | High       |
| 25  | Connect Boards + Mirror   | Nice-to-Have   | High       |
| 26  | Goals/OKRs                | Nice-to-Have   | Medium     |
| 27  | Sprint management         | Nice-to-Have   | Medium     |
| 28  | Time tracking column      | Nice-to-Have   | High       |
| 29  | White-label for clients   | Differentiator | Medium     |

---

_Compiled from: `~/pesquisa-pm-tool-2026.md` (5-agent research, 2026-03-04)_
_Project context: `.planning/PROJECT.md`_
