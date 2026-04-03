# External Integrations

**Analysis Date:** 2026-03-25

## APIs & External Services

**Supabase (PostgreSQL + Auth):**
- Client library: `@supabase/supabase-js` 2.87.1
- Auth: Email/password authentication via `contexts/AuthContext.tsx`
- Connection: `lib/supabase.ts`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Features used:
  - Authentication (sign up, sign in, sign out, password reset)
  - Database queries via PostgREST API
  - Real-time subscriptions (auth state changes)
  - RPC function calls (`upgrade_agent_version`, dashboard metrics, etc.)

**AgenticOS Platform:**
- Purpose: Instagram scraping, prospecting, lead scoring
- SDK: Native fetch API calls (HTTP)
- Base URL: `import.meta.env.VITE_AGENTICOS_API_URL`
- Default: `https://agenticoskevsacademy-production.up.railway.app`
- Endpoints used:
  - `GET /api/stats` - Fetch statistics (via `hooks/useAgenticOSStats.ts`)
  - `GET /health` - Health check (via `hooks/useSystemHealth.ts`)
  - Other account/lead endpoints (lazy-loaded in main app)
- Env var: `VITE_AGENTICOS_API_URL`
- Integration strategy: Lazy-loaded (non-blocking) via `useAgenticOSStats`, `useAgenticOSAccounts`

**GoHighLevel (GHL):**
- Purpose: CRM integration, location management, lead syncing
- Status: Optional integration
- Env vars: `VITE_GHL_API_KEY`, `VITE_GHL_LOCATION_ID`
- Note: Currently not implemented in main codebase; reserved for future use
- Location in codebase: Referenced in `env.example`

**n8n Webhooks:**
- Purpose: Workflow automation, lead routing, cadence execution
- Status: Optional integration
- Env var: `VITE_N8N_WEBHOOK_URL`
- Note: Reserved for future automation pipelines
- Location in codebase: Referenced in `env.example`

## Data Storage

**Databases:**
- Type/Provider: PostgreSQL via Supabase
- Connection: `lib/supabase.ts` exports `supabase` client
- Auth: Supabase anon key (public, row-level security via RLS)
- Client: `@supabase/supabase-js` 2.87.1
- Tables accessed:
  - `growth_leads` - Multi-tenant leads (primary source)
  - `growth_client_configs` - Tenant settings
  - `portal_conversations` - Synced conversations from GHL
  - `portal_messages` - Conversation messages
  - `socialfy_leads` - Legacy lead data
  - `crm_leads` - CRM lead data
  - `socialfy_campaigns` - Campaign definitions
  - `socialfy_cadences` - Cadence templates
  - `socialfy_messages` - Inbox messages
  - `socialfy_pipeline_deals` - Pipeline stages
  - `socialfy_connected_accounts` - Platform credentials
  - `socialfy_ai_agents` - AI agent configurations
  - `tenants` - Organization/workspace data

**File Storage:**
- Location: None configured; user avatars via URL fields (external URLs)
- S3/Cloud storage: Not integrated
- Static assets: Vite bundled into `dist/`

**Caching:**
- Type: None (client-side React state via hooks)
- Strategy: Component-level state via `useState`, no Redis or Memcached

## Authentication & Identity

**Auth Provider:**
- Service: Supabase Auth (built-in)
- Type: Email/password authentication
- Implementation location: `contexts/AuthContext.tsx`
- Methods supported:
  - Sign up (creates user + auto-creates tenant via DB trigger)
  - Sign in (password-based)
  - Sign out
  - Password reset (email-based)
  - Session persistence
- User metadata: Stored in Supabase `user.user_metadata` (full_name, company_name)
- Tenant association: User tied to organization via `tenants` table

## Monitoring & Observability

**Error Tracking:**
- Service: Not configured
- Note: Sentry DSN field mentioned in CLAUDE.md project context but not implemented
- Env var: `VITE_SENTRY_DSN` (optional, unused)

**Logs:**
- Approach: Browser console logs (development)
  - Error logging in hooks (useAgenticOSStats, useSystemHealth)
  - Auth state logging in contexts (AuthContext.tsx)
- Production: No centralized logging configured

**Health Checks:**
- System health endpoint: `GET /health` from AgenticOS (via `hooks/useSystemHealth.ts`)
- Polling interval: 30 seconds (configurable)
- Monitored components: Database, Redis, Instagram API, Queue

## CI/CD & Deployment

**Hosting:**
- Platform: Vercel
- Production URL: https://socialfy-platform.vercel.app
- Git integration: GitHub connected
- Deployment branches:
  - `main` → Production (automatic)
  - `develop` → Preview (automatic)

**CI Pipeline:**
- Service: Vercel CI/CD
- Build command: `npm run build`
- Install: `npm install`
- Output: `dist/` directory
- Preview deploys: Per PR to `develop`
- Production deploys: On `main` branch push

**Rollback:**
- Method: Vercel dashboard or git revert
- Manual deploy: `npx vercel --prod`

## Environment Configuration

**Required env vars:**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Optional env vars:**
```
VITE_AGENTICOS_API_URL=https://agenticoskevsacademy-production.up.railway.app
VITE_GHL_API_KEY=...
VITE_GHL_LOCATION_ID=...
VITE_N8N_WEBHOOK_URL=...
VITE_SENTRY_DSN=...
```

**Secrets location:**
- Local development: `.env` file (git-ignored)
- Vercel production: Environment variables in Vercel dashboard (project settings)
- CI/CD: GitHub repository secrets (not used in current setup)

## Webhooks & Callbacks

**Incoming:**
- Supabase auth state changes
  - Listener: `auth.onAuthStateChange()` in `AuthContext.tsx`
  - Trigger: User login, logout, token refresh
  - Callback: Updates user state in React context

**Outgoing:**
- Portal message handling
  - Endpoint: Supabase RLS policies (no direct webhook)
- Cadence execution via n8n (reserved, not implemented)
  - Target: `VITE_N8N_WEBHOOK_URL` (future)

## Data Flow - Key Integrations

1. **User Authentication:**
   - User → Supabase Auth → AuthContext → App renders
   - Tenant auto-created via Supabase trigger on signup

2. **Lead Data:**
   - Primary: Supabase `growth_leads` table (synced from GHL)
   - Fallback: `socialfy_leads` table (mock data for demo)
   - Loaded via: `hooks/useSupabaseData.ts`

3. **Conversations (Inbox):**
   - Source: `portal_conversations` + `portal_messages` tables (synced from GHL)
   - Display via: `InboxView` component

4. **AgenticOS Stats (Optional):**
   - Endpoint: `GET /api/stats` from AgenticOS
   - Loaded lazily (non-blocking) via: `hooks/useAgenticOSStats.ts`
   - Fallback: Empty stats if unavailable

5. **System Health:**
   - Endpoint: `GET /health` from AgenticOS
   - Polling: Every 30 seconds via `hooks/useSystemHealth.ts`
   - Display: System status indicator

## API Response Handling

**Supabase (PostgREST):**
- Type: RESTful JSON
- Error handling: `.select()`, `.eq()`, `.update()` chains return `{data, error}`
- Timeout: 3-second promise race on auth session fetch (non-blocking)

**AgenticOS (HTTP):**
- Type: JSON REST API
- Response format: Flexible (normalizes various field names)
- Error handling: Try-catch with graceful fallback to empty data
- Headers: `Content-Type: application/json` only

**HTTP Methods:**
- GET: Data fetching (Supabase, AgenticOS)
- POST: Data creation (Supabase, sign up)
- PATCH/UPDATE: Data modification (Supabase)
- DELETE: Data removal (Supabase)

---

*Integration audit: 2026-03-25*
