# Codebase Concerns

**Analysis Date:** 2026-03-05

## Tech Debt

**Hardcoded Mock Data in Client Portal Pages:**

- Issue: Multiple client-facing pages use hardcoded mock arrays instead of Supabase queries
- Files: `apps/docs/src/pages/client/ClientConversas.tsx` (line 23: `mockConversations`), `apps/docs/src/pages/client/ClientAgendamentos.tsx` (line 26: `mockAppointments`), `apps/docs/src/pages/client/ClientDashboard.tsx` (line 146: mock data comment)
- Impact: Client portal shows fake data; entire `/client/*` section is non-functional for real users
- Fix approach: Replace mocks with hooks that query Supabase views (same pattern as `useAgendamentos`, `useLeads`)

**Hardcoded Dashboard Stats (leadsProcessed, conversionRate, activeCampaigns):**

- Issue: Three KPIs in `fetchDashboardStats()` return static values with TODO comments
- Files: `apps/docs/src/lib/supabaseData.ts` (lines 122-124)
- Impact: Dashboard shows fake numbers (`1247`, `23.5%`, `3`) regardless of actual data
- Fix approach: Query `crm_leads` or appropriate Supabase view to compute real values

**Mock Fallback in fetchScoreHistory():**

- Issue: When no test results exist, function returns randomly generated mock data instead of empty state
- Files: `apps/docs/src/lib/supabaseData.ts` (lines 137-147)
- Impact: Charts display fabricated trend data, misleading users about agent performance
- Fix approach: Return empty array and handle empty state in chart components

**Legacy Data Service with Excessive Comments:**

- Issue: `dataService.ts` contains long stream-of-consciousness comments explaining schema confusion (`// WAIT: User schema doesn't have a 'clients' table...`), mock fallbacks, and dual-table query attempts
- Files: `apps/docs/src/services/dataService.ts`
- Impact: Confusing codebase; unclear which code path executes in production; `MOCK_CLIENTS` fallback masks real errors
- Fix approach: Remove exploratory comments, remove mock fallbacks, consolidate into a single clean query path

**Duplicate Supabase Client Files:**

- Issue: Two Supabase client files exist. The root-level one is legacy and unused by app code but still referenced in docs
- Files: `apps/docs/src/lib/supabase.ts` (active), root `supabaseClient.ts` (legacy, referenced in `apps/docs/CLAUDE.md`)
- Impact: Confusion about which client to import; potential for accidentally importing the wrong one
- Fix approach: Delete root `supabaseClient.ts`, update CLAUDE.md reference

**Duplicate/Overlapping Data Layer Files:**

- Issue: Three files serve overlapping purposes for data access: `supabaseData.ts` (agent CRUD + stats), `supabase-sales-ops.ts` (sales ops DAO), `dataService.ts` (client/agent service with mocks)
- Files: `apps/docs/src/lib/supabaseData.ts`, `apps/docs/src/lib/supabase-sales-ops.ts`, `apps/docs/src/services/dataService.ts`
- Impact: No single source of truth for data access patterns; some pages import from lib, others from services; agent fetching duplicated across `supabaseData.ts` and hooks
- Fix approach: Consolidate into hooks-only pattern (already used by most pages). Deprecate `supabaseData.ts` and `dataService.ts`, move remaining logic into dedicated hooks

**Hardcoded User ID in Quality Flags:**

- Issue: `resolved_by` field hardcoded to string `'gestora'` instead of actual authenticated user
- Files: `apps/docs/src/hooks/useQualityFlags.ts` (lines 61, 227)
- Impact: Audit trail is broken; all flag resolutions attributed to same fake user
- Fix approach: Get `user.id` from `useAuth()` and pass into the hook or its methods

**TODO: ReflectionLoop Save Not Implemented:**

- Issue: ReflectionLoop page has `// TODO: Save to Supabase` — settings changes are not persisted
- Files: `apps/docs/src/pages/ReflectionLoop.tsx` (line 173)
- Impact: User configures reflection settings but they reset on page reload
- Fix approach: Implement Supabase upsert for reflection settings

**TODO: Supervision View Missing JOIN:**

- Issue: `vw_supervision_conversations_v3` view needs a JOIN that is not yet implemented
- Files: `apps/docs/src/components/supervision/ConversationList.tsx` (line 76), `apps/docs/src/hooks/useSupervisionPanel.ts` (line 120)
- Impact: Supervision panel may show incomplete data (missing quality_issues_count)
- Fix approach: Update the Supabase view SQL to include the JOIN

## Security Considerations

**Supabase Client Falls Back to Placeholder Credentials:**

- Risk: When env vars are missing, the client initializes with `'https://placeholder-url.supabase.co'` and `'placeholder-key'` instead of failing explicitly
- Files: `apps/docs/src/lib/supabase.ts` (lines 8-9)
- Current mitigation: `isSupabaseConfigured()` function exists but is only checked in 5 of 30+ hooks
- Recommendations: Throw an error at initialization if env vars are missing, or at minimum check `isSupabaseConfigured()` in ALL hooks consistently

**Gemini API Key Exposed to Client-Side:**

- Risk: `VITE_GEMINI_API_KEY` is bundled into the frontend JavaScript, accessible to any user via browser DevTools
- Files: `apps/docs/src/components/AISupportWidget.tsx` (line 159), `apps/docs/src/components/AISupportVoice.tsx` (line 105), `apps/docs/src/hooks/useOnboarding.ts` (line 156)
- Current mitigation: None
- Recommendations: Proxy Gemini calls through a backend API route or Supabase Edge Function. Never expose API keys in `VITE_` prefixed vars

**Direct `agent_versions` UPDATE Bypasses `upgrade_agent_version()` RPC:**

- Risk: `supabaseData.ts` and `PromptEditor.tsx` do direct `.update()` on `agent_versions` table, violating the Constitution (Art. IV) which mandates using `upgrade_agent_version()` RPC
- Files: `apps/docs/src/lib/supabaseData.ts` (lines 222-226 `updateAgentPrompt`), `apps/docs/src/lib/supabaseData.ts` (lines 270-297 `publishAgentVersion`), `apps/docs/src/pages/PromptEditor.tsx` (line 285)
- Current mitigation: None
- Recommendations: Replace all direct `.update()` calls on `agent_versions` with `supabase.rpc('upgrade_agent_version', {...})`. This ensures archive history is maintained

**No Role-Based Access Control in Frontend:**

- Risk: All authenticated users have identical access to all pages including PromptEditor, Configuracoes, and agent publishing
- Files: `apps/docs/src/contexts/AuthContext.tsx` (no role/permission fields), all route definitions
- Current mitigation: Supabase RLS on the backend (assumed)
- Recommendations: Add user roles to AuthContext; conditionally render admin-only routes

## Performance Bottlenecks

**Oversized Page Components (1000+ lines):**

- Problem: Several pages are monolithic single-file components with inline sub-components, business logic, and rendering
- Files: `apps/docs/src/pages/Performance.tsx` (1586 lines), `apps/docs/src/lib/supabase-sales-ops.ts` (1471 lines), `apps/docs/src/pages/PromptEditor.tsx` (1187 lines), `apps/docs/src/pages/Agendamentos.tsx` (926 lines)
- Cause: All logic, state, sub-components, and utilities colocated in single files
- Improvement path: Extract sub-components into separate files; move data logic into hooks; split Performance.tsx into MetricsTab and CostsTab

**Excessive `select('*')` Queries (40+ occurrences):**

- Problem: Nearly all Supabase queries fetch all columns when only a subset is needed
- Files: 40+ occurrences across `apps/docs/src/hooks/` and `apps/docs/src/lib/`
- Cause: Convenience during rapid development
- Improvement path: Specify only needed columns in `.select()` to reduce payload size, especially on tables like `agent_versions` which has large JSONB columns (`system_prompt`, `tools_config`, etc.)

**188 `console.log/warn/error` Statements in Production Code:**

- Problem: Excessive console logging in hooks and components ships to production
- Files: 52 files across `apps/docs/src/`, heaviest in `apps/docs/src/lib/supabase-sales-ops.ts` (31 occurrences), `apps/docs/src/hooks/useClientPerformance.ts` (10), `apps/docs/src/hooks/useSupervisionRealtime.ts` (9)
- Cause: Debug logging never cleaned up
- Improvement path: Vite build config already drops console in production (`drop: ['console', 'debugger']` per CLAUDE.md). Verify this is active. For dev, use a structured logger

## Fragile Areas

**`useTestResults.ts` — Multi-Format JSONB Parsing:**

- Files: `apps/docs/src/hooks/useTestResults.ts` (630 lines)
- Why fragile: Supports 4+ different `validation_result` JSONB formats (new pipeline, sales_analysis, legacy root, pipeline-without-db). Each format has different field paths for scores and test results
- Safe modification: Add new format support by extending the interface union type; never remove old format handlers without DB migration
- Test coverage: Zero tests. Any change to score extraction logic could silently break dashboard numbers

**`useClientPerformance.ts` — Dual Data Source Confusion:**

- Files: `apps/docs/src/hooks/useClientPerformance.ts` (694 lines)
- Why fragile: Uses `app_dash_principal` (GHL data) while most other pages use `socialfy_leads`. Comment block (lines 6-18) explicitly warns numbers will differ between pages. Field `lead_usuario_responsavel` is repurposed as `locationId` for "compatibility"
- Safe modification: Always test alongside Dashboard and Leads pages to verify no cross-contamination of data sources
- Test coverage: None

**`supabase-sales-ops.ts` — Massive DAO with 1471 Lines:**

- Files: `apps/docs/src/lib/supabase-sales-ops.ts`
- Why fragile: Single file contains all Sales Ops data access (overview, funnel, leads, conversations, batch operations, agent leaderboard). Exported `salesOpsDAO` object has 15+ methods
- Safe modification: Extract individual DAO methods into separate hook files following the pattern of other hooks
- Test coverage: None

## Missing Critical Features

**Zero Test Files:**

- Problem: No `.test.ts`, `.spec.ts`, or any test files exist in the entire `apps/docs/src/` directory
- Blocks: No automated regression detection; every deploy is manual QA
- Priority: High — at minimum add tests for data transformation logic in `useTestResults.ts`, `useClientPerformance.ts`, and `supabaseData.ts`

**No Error Boundaries:**

- Problem: No React Error Boundaries detected. A crash in any component takes down the entire app
- Files: All page components in `apps/docs/src/pages/`
- Blocks: Production resilience; users see white screen on any unhandled error
- Priority: High — wrap route-level components with error boundaries

**No Loading/Error State Consistency:**

- Problem: Error handling varies wildly: some hooks return `[]` on error silently, others set error state, others console.error only. No standardized pattern
- Files: `apps/docs/src/lib/supabaseData.ts` (returns empty arrays/objects on error), `apps/docs/src/hooks/useQualityFlags.ts` (proper error state), `apps/docs/src/hooks/useClientCosts.ts` (mixed)
- Blocks: Users cannot distinguish "no data" from "failed to load"
- Priority: Medium — create a standard hook return type `{ data, loading, error, refetch }`

## Dependencies at Risk

**160 `any` Type Usages Across 56 Files:**

- Risk: TypeScript safety is undermined; refactors can introduce silent runtime errors
- Impact: Heaviest in `apps/docs/src/hooks/useClientCosts.ts` (11), `apps/docs/src/pages/PromptEditor.tsx` (10), `apps/docs/src/hooks/useTestResults.ts` (10), `apps/docs/src/hooks/useClientPerformance.ts` (9)
- Migration plan: Prioritize typing hooks that handle financial data (`useClientCosts`) and scoring data (`useTestResults`). Generate types from Supabase schema using `supabase gen types typescript`

## Test Coverage Gaps

**All Business Logic Untested:**

- What's not tested: Score calculations, data transformations, JSONB format parsing, ranking algorithms, alert threshold logic, cost calculations
- Files: `apps/docs/src/hooks/useTestResults.ts` (score extraction from 4+ formats), `apps/docs/src/hooks/useClientPerformance.ts` (ranking/alert computation), `apps/docs/src/hooks/useClientCosts.ts` (cost aggregation), `apps/docs/src/lib/supabaseData.ts` (dashboard stats calculation)
- Risk: Any change to score/cost logic could produce incorrect numbers in dashboards without detection
- Priority: High — these hooks contain the core business value of the app

**Client Portal Entirely Mock-Driven:**

- What's not tested: The entire `apps/docs/src/pages/client/` directory (6 files) either uses hardcoded mocks or has TODO comments for real data integration
- Files: `apps/docs/src/pages/client/ClientConversas.tsx`, `apps/docs/src/pages/client/ClientAgendamentos.tsx`, `apps/docs/src/pages/client/ClientDashboard.tsx`, `apps/docs/src/pages/client/ClientMetricas.tsx`, `apps/docs/src/pages/client/ClientAjuda.tsx`, `apps/docs/src/pages/client/MeuAgente.tsx`
- Risk: If client portal is shipped to actual clients, they see fabricated data
- Priority: High if client portal is user-facing; Low if internal-only

---

_Concerns audit: 2026-03-05_
