# Codebase Concerns

**Analysis Date:** 2026-03-25

## Tech Debt

**Mock Data Fallback & Incomplete Integration:**
- Issue: Frontend has comprehensive mock data fallback system that masks incomplete Supabase integration
- Files: `App.tsx` (lines 69-86), `constants.ts` (MOCK_LEADS, RECENT_CAMPAIGNS, PIPELINE_DATA, MOCK_ACCOUNTS, MOCK_AGENTS)
- Impact: Frontend renders normally even without real data connection. When real data doesn't load, users see placeholder data without clear indication. Potential to ship incomplete integrations to production undetected.
- Fix approach: Add explicit data source indicator in UI (tag showing "MOCK DATA" vs "LIVE DATA"), implement health check on app startup, require explicit real data before removing fallbacks from production builds

**Disabled Webhook Integration:**
- Issue: Message sending contains commented-out n8n webhook trigger
- Files: `hooks/useInbox.ts` (lines 292-297)
- Impact: Messages appear to send locally but n8n automation never executes. Users believe messages are being sent when they're only stored in database. Critical for core product functionality.
- Fix approach: Implement webhook trigger with retry logic, add error handling and user feedback, configure webhook URL from environment variables

**Multiple Legacy Supabase Client Versions:**
- Issue: Two Supabase client files exist in different locations (consolidation incomplete)
- Files: `src/lib/supabase.ts` (primary), `supabaseClient.ts` (root level - likely legacy)
- Impact: Risk of code using outdated client, inconsistent auth patterns, maintenance burden
- Fix approach: Delete legacy `supabaseClient.ts` after verifying all imports, update any references to use `src/lib/supabase.ts`

**Placeholder Credentials in Client Initialization:**
- Issue: Supabase client has placeholder fallback values when environment variables are missing
- Files: `lib/supabase.ts` (lines 7-8)
- Impact: App boots with non-functional database connection silently. No error shown to user. Could lead to silent failures and poor diagnostics.
- Fix approach: Throw explicit error on missing env vars during app initialization, add startup health check that validates Supabase connectivity before allowing app to mount

## Known Bugs

**Lead Detail Drawer Incomplete:**
- Symptoms: Lead detail drawer opens on lead click but "TODO: expandir para mostrar mais detalhes" indicates incomplete implementation
- Files: `components/views/LeadsView.tsx` (line 388)
- Trigger: Click any lead card in LeadsView
- Workaround: View lead on Instagram using button, but no full detail view available
- Root cause: Drawer template created but detail fields never populated

**Avatar Profile Pic Not Returned from API:**
- Symptoms: Lead cards show placeholder avatars because profile_pic_url is always null
- Files: `components/views/LeadsView.tsx` (line 185) - explicit comment: `// API nao retorna isso ainda`
- Impact: Instagram lead profiles lack visual identification. Grid view less scannable.
- Trigger: Loading any leads from API
- Root cause: Instagram scraper not capturing/returning profile image URLs

**AgenticOS Data Not Auto-Fetching:**
- Symptoms: Growth dashboard, accounts view, and system health metrics only load on manual action
- Files: `App.tsx` (lines 105-107) - `autoFetch=false` for all AgenticOS integrations
- Trigger: App mount; metrics only load after explicit refetch
- Impact: Dashboard shows stale/missing data on first load. User must click refresh button.
- Workaround: Manual refetch available via header refresh button
- Root cause: Performance decision to prevent blocking initial render, but creates poor UX

## Security Considerations

**Placeholder API Keys Visible in Source Code:**
- Risk: While placeholder keys are used for dev, the pattern of defaulting to non-functional values instead of failing early could lead to accidental deployment of similar patterns with real secrets
- Files: `lib/supabase.ts` (lines 7-8)
- Current mitigation: Depends on .env configuration at build time
- Recommendations: (1) Remove placeholder fallbacks entirely - throw error on missing vars, (2) Add pre-commit hook that validates required env vars are set, (3) Add build-time validation that aborts build if env vars missing

**Environment Variables Not Validated at Build Time:**
- Risk: TypeScript doesn't enforce VITE_ env vars exist. Build succeeds with missing credentials.
- Files: `lib/supabase.ts`, `hooks/*`, `App.tsx`
- Current mitigation: None - app attempts graceful degradation with fallbacks
- Recommendations: Use Zod or similar schema validation on `import.meta.env` at app startup, fail fast with clear error message

**Auth Context Profile Fetch Silent Failures:**
- Risk: Profile fetch errors are caught and logged but silently ignored (lines 164-167, 197-199 in AuthContext.tsx)
- Files: `contexts/AuthContext.tsx` (lines 164-167, 197-199)
- Current mitigation: App continues with user=null, sessions continue anyway
- Recommendations: Distinguish between "profile not found yet" (benign, wait and retry) vs "query failed" (error to surface), add explicit retry with backoff

## Performance Bottlenecks

**All AgenticOS Data Lazy-Loaded on Demand:**
- Problem: System health, account stats, and growth metrics load only when explicitly triggered. Initial page load is fast but interactive elements are slow.
- Files: `App.tsx` (lines 105-107), `hooks/useAgenticOSStats.ts`, `hooks/useAgenticOSAccounts.ts`, `hooks/useSystemHealth.ts`
- Cause: Performance decision to prevent blocking - `autoFetch=false` on all AgenticOS hooks
- Improvement path: Implement staggered/prioritized loading: fetch critical metrics immediately in background, defer secondary metrics, show loading states instead of empty states

**Authentication Session Fetch 3-Second Timeout:**
- Problem: Auth initialization can hang app for up to 3 seconds if Supabase is slow
- Files: `contexts/AuthContext.tsx` (lines 144-149)
- Cause: Promise.race() with 3-second timeout adds significant latency to app startup
- Improvement path: Reduce timeout to 1-2 seconds, implement preconnect to Supabase API, cache last known session in localStorage for instant return

**Lead Loading with Full Lead Details Join:**
- Problem: LeadsView fetches 20 leads with nested lead relationship (full profile fetch)
- Files: `hooks/useLeads.ts` (likely fetching full lead relations)
- Cause: N+1 risk if using REST API without limits
- Improvement path: Implement database view that aggregates only needed lead fields, add query pagination, cache lead list client-side

**No Request Caching or Deduplication:**
- Problem: Multiple components can trigger same data fetches simultaneously
- Files: Throughout hooks
- Cause: Each hook instance makes independent requests
- Improvement path: Implement request-level cache (e.g., React Query, SWR) to deduplicate identical in-flight requests

## Fragile Areas

**AuthContext Initialization Race Conditions:**
- Files: `contexts/AuthContext.tsx` (lines 134-183)
- Why fragile: Complex multi-step initialization (session fetch → user fetch → profile fetch) with async patterns and race condition guards (`isMounted`). Multiple fallback paths. Timeout logic can mask real errors.
- Safe modification: (1) Add explicit state machine for auth states (initializing → authenticated/unauthenticated → error), (2) separate concerns into smaller hooks (useAuthSession, useUserProfile), (3) simplify error handling with explicit retry logic
- Test coverage: Only 1 test exists (`contexts/__tests__/AuthContext.test.tsx`). Critical flows like session timeout, profile fetch failure, concurrent updates not tested.

**DataContext Type-Safe Fallback with Inline Mock:**
- Files: `App.tsx` (lines 66-87)
- Why fragile: `useData()` hook returns mock data when context is null, type-casting everything to `any` (line 71). If mock data structure differs from real data, components will still type-check but fail at runtime.
- Safe modification: (1) Create separate MockDataProvider for testing, (2) remove fallback - let app fail loudly if DataProvider not initialized, (3) validate mock data structure matches real API types
- Test coverage: No unit tests for useData hook or DataProvider

**Tenant Dropdown Without Organization Context:**
- Files: `components/views/LeadsView.tsx` (lines 166-169), `hooks/useTenantDropdown.ts`
- Why fragile: Dropdown populated from `useTenantDropdown()` but selected tenant filtered in `useLeads()`. No validation that selectedTenant matches user's actual tenants. No error if tenant fetch fails - dropdown just empty.
- Safe modification: (1) Fetch tenants in AuthContext, store in user metadata, (2) validate selected tenant is in user's tenant list, (3) add explicit error state when tenant fetch fails
- Test coverage: Likely no tests for tenant-aware filtering

**Lead Detail Drawer Management:**
- Files: `components/views/LeadsView.tsx` (lines 389-400+)
- Why fragile: Drawer state synchronized with `selectedLead` state from array search. If lead removed from `leads` array while drawer open, selectedLead becomes stale. Click handlers might reference wrong lead.
- Safe modification: (1) Store selected lead ID instead of full object, (2) fetch lead details separately when drawer opens, (3) add synchronization check when leads array updates
- Test coverage: No tests for drawer behavior, lead selection, or state synchronization

**File Organization with Mixed Concerns:**
- Files: Many components combine filtering UI, data fetching, rendering, error handling in single files
- Why fragile: Hard to test individual concerns. Changes to one concern break others. Difficult to reuse filtering logic across views.
- Safe modification: Extract filters to separate component, move data fetching to custom hook, separate error boundary from content
- Test coverage: 2 test files exist but only 4 total tests vs 43 components

## Scaling Limits

**Single Organization Demo Database:**
- Current capacity: Hardcoded `DEMO_ORG_ID` used for all users
- Limit: All users share same organization, same leads, same campaigns
- Files: `App.tsx` (line 95)
- Scaling path: (1) Replace hardcoded ID with dynamic org from auth user metadata, (2) implement organization creation in signup flow, (3) add org switcher in UI

**No Pagination Implemented:**
- Current capacity: Loads 20 leads at once, relies on browser to render
- Limit: Browser will slow rendering at 500+ items
- Files: `hooks/useLeads.ts`, `components/views/LeadsView.tsx` (infinite scroll partially implemented with hasMore flag)
- Scaling path: Implement virtual scrolling (react-window), add cursor-based pagination instead of offset, implement request caching

**No Rate Limiting on Client:**
- Current capacity: No throttling on API calls
- Limit: Rapid actions (filter changes, searches, refetch) can spam backend
- Files: Throughout hooks
- Scaling path: Add debouncing on search input, implement request deduplication, add exponential backoff on retries

## Dependencies at Risk

**Outdated TypeScript Configuration:**
- Risk: `tsconfig.json` uses `skipLibCheck: true` which hides type errors in dependencies
- Files: `tsconfig.json` (line 12)
- Impact: Silent type mismatches in dependency updates. Harder to catch breaking changes.
- Migration plan: Remove `skipLibCheck`, run `tsc --noEmit` in CI, incrementally fix type errors

**No Linter Configured:**
- Risk: Eslint config referenced in package.json (`npm run lint`) but no `.eslintrc` found
- Files: `package.json` (line 10), missing `.eslintrc.js` or `.eslintrc.json`
- Impact: No enforced code style, duplicated patterns, inconsistent error handling
- Migration plan: Create `.eslintrc.json` with sensible defaults, add to pre-commit hook, run in CI

**React 19 Early Adoption:**
- Risk: React 19.2.1 is very new, limited production usage in ecosystem
- Files: `package.json` (line 21)
- Impact: Potential incompatibilities with third-party components, breaking changes likely
- Migration plan: Monitor React issues, plan test matrix for major versions, consider pinning minor version

**Missing Test Coverage:**
- Risk: Only 4 test files for 43 components. Critical paths (auth, data fetching, message sending) barely tested
- Files: `contexts/__tests__/AuthContext.test.tsx`, `hooks/__tests__/useFormValidation.test.tsx`, `hooks/__tests__/useMetrics.test.ts`, `components/__tests__/Button.test.tsx`
- Impact: Regression risks high. Refactoring breaks core flows undetected.
- Migration plan: Add testing for hooks/contexts first, then integrate components, aim for 50% coverage in 1 month

## Missing Critical Features

**No Form Validation on Auth Forms:**
- Problem: Signup/login forms lack validation - no checks for password strength, email format, required fields
- Blocks: Security, user experience
- Files: `components/auth/SignupPage.tsx`, `components/auth/LoginPage.tsx`, `components/auth/ForgotPasswordPage.tsx`
- Risk: Users submit invalid data, confusing error messages from Supabase

**No Multi-Tenant Isolation:**
- Problem: All users see same demo org. No RLS policies likely implemented
- Blocks: Production readiness, data security
- Files: Database schema (Supabase), `App.tsx` (demo org hardcoded)
- Risk: Data leakage across organizations in production

**No Offline Support:**
- Problem: All data fetching requires live connection. No service worker, no local cache
- Blocks: Mobile-friendly experience, reliability
- Files: Throughout data hooks
- Risk: Single network hiccup breaks entire app

## Test Coverage Gaps

**AuthContext Not Tested for Error Cases:**
- What's not tested: Session timeout, profile fetch failure, concurrent auth state changes, token refresh
- Files: `contexts/AuthContext.tsx` (234 lines, only 1 test file)
- Risk: Auth flows could break in production without detection
- Priority: High

**Data Fetching Hooks Have No Tests:**
- What's not tested: Error handling, retry logic, empty states, pagination
- Files: `hooks/useLeads.ts`, `hooks/useInbox.ts`, `hooks/useCampaigns.ts`, etc. (20+ hooks, 0 tests)
- Risk: Silent data fetch failures, race conditions in production
- Priority: High

**Component Interaction Flows Untested:**
- What's not tested: LeadView -> click lead -> open drawer, filter leads -> pagination, send message flow
- Files: `components/views/LeadsView.tsx`, `components/views/InboxView.tsx`, etc. (43 components, ~3 tested)
- Risk: UI breaks mid-flow undetected
- Priority: Medium

**Edge Cases in Data Transformation:**
- What's not tested: Null field handling in lead transformation (line 185-191), missing relationships, malformed metadata
- Files: `components/views/LeadsView.tsx` (lines 178-191)
- Risk: Crashes on unexpected data shapes from API
- Priority: Medium

---

*Concerns audit: 2026-03-25*
