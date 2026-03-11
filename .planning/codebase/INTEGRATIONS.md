# External Integrations

**Analysis Date:** 2026-03-05

## APIs & External Services

**Google Gemini AI:**

- Used for: AI voice support, audio transcription, text generation, onboarding processing
- SDK/Client: `@google/genai` 1.34.0 (dynamic import in components)
- Models used:
  - `gemini-2.5-flash-native-audio-preview-09-2025` - Native audio (voice widget) in `apps/docs/src/components/AISupportWidget.tsx`, `apps/docs/src/components/AISupportVoice.tsx`
  - `gemini-2.0-flash` - Text generation in `apps/docs/src/components/AISupportWidget.tsx`
  - `gemini-2.5-flash` - Audio transcription via REST API in `apps/docs/src/hooks/useOnboarding.ts`
- Auth: `VITE_GEMINI_API_KEY`
- Direct REST call pattern: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`

**n8n Webhooks (Automation Backend):**

- Used for: Message sending, chat interactions, onboarding processing
- n8n instances:
  - `mottivme.app.n8n.cloud` - Primary cloud instance
  - `cliente-a1.mentorfy.io` - Secondary instance (prompt engineer, workflows)
- Webhook endpoints consumed by frontend:
  - Supervision send message: `VITE_N8N_WEBHOOK_SEND_MESSAGE` (default: `https://mottivme.app.n8n.cloud/webhook/supervision-send-message`) - `apps/docs/src/hooks/useSendMessage.ts`
  - Chat adjustments: `VITE_N8N_WEBHOOK_CHAT_AJUSTES` (default: `https://mottivme.app.n8n.cloud/webhook/chat-ajustes`) - `apps/docs/src/components/AdjustmentsChat.tsx`
  - Chat adjustments save: `VITE_N8N_WEBHOOK_CHAT_AJUSTES_SAVE` (default: `https://mottivme.app.n8n.cloud/webhook/chat-ajustes-save`) - `apps/docs/src/components/AdjustmentsChat.tsx`
  - Prompt engineer: `VITE_N8N_WEBHOOK_PROMPT_ENGINEER` (default: `https://cliente-a1.mentorfy.io/webhook/engenheiro-prompt`) - `apps/docs/src/components/PromptEngineerChat.tsx`
  - Onboarding webhook: `VITE_N8N_ONBOARDING_WEBHOOK` - `apps/docs/src/hooks/useOnboarding.ts`
- Pattern: All use `fetch()` POST with JSON body, no SDK

**GoHighLevel (GHL):**

- Used for: CRM data, lead management, location-based multi-tenancy
- No direct GHL API calls from frontend; data flows through Supabase views/tables
- Webhook endpoint documented: `https://api.ai-factory.mottivme.com/webhooks/ghl/{location_id}` (in `apps/docs/src/pages/docs/GHLIntegration.tsx`)
- GHL locations stored in Supabase table `ghl_locations`, accessed via `apps/docs/src/hooks/useLocations.ts`

## Data Storage

**Database: Supabase (PostgreSQL)**

- Client: `@supabase/supabase-js` 2.89.0
- Connection: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- Client file: `apps/docs/src/lib/supabase.ts` (primary), `apps/docs/src/lib/supabaseClient.ts` (legacy - avoid)
- Project: `bfumywvwubvernvhjehk.supabase.co`

**Core tables accessed by frontend:**

- `agent_versions` - AI agent prompts, configs, scores, versions
- `factory_artifacts` - Generated content (persona analysis, objection maps)
- `socialfy_leads` - Sales leads data
- `ai_factory_conversations` - Agent conversation logs
- `n8n_historico_mensagens` - Message history (realtime subscriptions)
- `supervision_states` - AI supervision on/off states
- `conversation_quality_flags` - Quality flag assessments
- `llm_costs` - LLM usage cost tracking
- `fuu_events` - Follow-up events
- `app_dash_principal` - Main dashboard data (scheduling, funnel)
- `appointments_log` - Appointment tracking
- `ghl_locations` - GHL location mapping
- `onboarding_sessions` - Client onboarding data

**Supabase views (prefixed `vw_`):**

- `vw_dashboard_metrics` - Aggregated dashboard stats
- `vw_pending_approvals` - Agent versions awaiting approval
- `vw_supervision_conversations` - Supervision panel conversation view
- `vw_quality_flags_detail` - Quality flag details
- `vw_conversation_quality_summary` - Quality summary
- `vw_client_costs_summary` - Client cost aggregation (CRITICAL: 7 dependent views, never DROP)
- `vw_global_cost_summary` - Global cost overview
- `vw_fuu_dashboard` - Follow-up dashboard
- `dashboard_ranking_clientes` - Client ranking

**Data access patterns:**

- DAO layer: `apps/docs/src/lib/supabase-sales-ops.ts` (Sales Ops typed queries)
- Type definitions: `apps/docs/src/lib/supabaseData.ts` (AgentVersion, TestResult, etc.)
- Custom hooks: `apps/docs/src/hooks/` (28 hooks, barrel export from `index.ts`)

**Supabase Realtime:**

- Used for: Live supervision panel updates
- Implementation: `apps/docs/src/hooks/useSupervisionRealtime.ts`
- Channels:
  - `supervision-realtime` - Listens to `n8n_historico_mensagens` INSERTs and `supervision_states` changes
  - `conversation-{sessionId}` - Per-conversation message stream with session_id filter
- Debounce: 500ms aggregation to avoid excessive refetches

**File Storage:**

- Not directly used from frontend (no `supabase.storage` calls detected)

**Caching:**

- None (no Redis, no service worker caching detected)

## Authentication & Identity

**Auth Provider: Supabase Auth**

- Implementation: `apps/docs/src/contexts/AuthContext.tsx`
- Methods: Email/password sign-in, sign-up, password reset
- Session management: Automatic token refresh via `onAuthStateChange`
- Route protection: `apps/docs/src/components/ProtectedRoute.tsx` wraps all routes except `/login`
- Email redirect: `${window.location.origin}/` for sign-up, `${window.location.origin}/reset-password` for password reset
- No OAuth providers configured (email/password only)

## Monitoring & Observability

**Error Tracking:**

- None (no Sentry, no error boundary with reporting)

**Logs:**

- `console.log` / `console.error` throughout codebase
- Production build drops all console statements via terser config

## CI/CD & Deployment

**Hosting:**

- Vercel at `factorai.mottivme.com.br`
- Static SPA deployment (HashRouter for compatibility)

**CI Pipeline:**

- Not detected (no `.github/workflows`, no Vercel CI config in repo)

**Build:**

- `turbo build` from root triggers `vite build` for `apps/docs`
- Output: `dist/` directory

## Environment Configuration

**Required env vars:**

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Google Gemini API key

**Optional env vars (with hardcoded fallbacks):**

- `VITE_N8N_WEBHOOK_SEND_MESSAGE` - Falls back to `mottivme.app.n8n.cloud`
- `VITE_N8N_WEBHOOK_CHAT_AJUSTES` - Falls back to `mottivme.app.n8n.cloud`
- `VITE_N8N_WEBHOOK_CHAT_AJUSTES_SAVE` - Falls back to `mottivme.app.n8n.cloud`
- `VITE_N8N_WEBHOOK_PROMPT_ENGINEER` - Falls back to `cliente-a1.mentorfy.io`
- `VITE_N8N_ONBOARDING_WEBHOOK` - No fallback (skips processing if missing)

**Secrets location:**

- Vercel environment variables (production)
- Local `.env` files (not committed, not present in repo)

## Webhooks & Callbacks

**Incoming (frontend receives):**

- Supabase Realtime via WebSocket (postgres_changes on `n8n_historico_mensagens`, `supervision_states`)

**Outgoing (frontend calls):**

- n8n supervision send message webhook
- n8n chat adjustments webhook (+ save variant)
- n8n prompt engineer webhook
- n8n onboarding processing webhook
- Google Gemini API (REST + SDK)
- Supabase REST API (all data operations)

## Integration Architecture Summary

```
Browser (React SPA)
  |
  |-- Supabase REST API --> PostgreSQL (tables, views)
  |-- Supabase Realtime --> WebSocket (live message updates)
  |-- Supabase Auth --> Email/password authentication
  |
  |-- n8n Webhooks --> Automation workflows
  |     |-- supervision-send-message
  |     |-- chat-ajustes / chat-ajustes-save
  |     |-- engenheiro-prompt
  |     |-- onboarding
  |
  |-- Google Gemini API --> AI text/audio generation
  |     |-- @google/genai SDK (voice, text)
  |     |-- REST API (transcription, onboarding)
  |
  [GHL data flows through Supabase, not called directly]
```

---

_Integration audit: 2026-03-05_
