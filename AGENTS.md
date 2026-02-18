# AGENTS.md — GHL Direct Dashboard

> Instrucoes para agentes autonomos (Antigravity / Gemini 3 / Claude)
> PRD completo: `~/.claude/plans/ghl-direct-dashboard-prd.md`

---

## MISSAO

Criar um dashboard paralelo que consulta GHL API diretamente, sem n8n/webhooks/Supabase como intermediario de dados. O dashboard atual NAO deve ser afetado.

---

## REGRAS ABSOLUTAS

1. **NUNCA modifique arquivos fora do namespace `ghl/`** (exceto `App.tsx` pra adicionar rotas)
2. **NUNCA delete ou renomeie** arquivos existentes
3. **Reutilize componentes existentes** — nao recrie o que ja existe
4. **TypeScript strict** — zero `any`, zero `@ts-ignore`
5. **Tailwind CSS v4** — sem CSS custom, sem styled-components
6. **DateRange** importa APENAS de `src/components/DateRangePicker.tsx`
7. **Testes**: rode `npx tsc --noEmit` antes de considerar pronto

---

## STACK

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Backend Proxy | Vercel Serverless Functions (`/api/ghl/`) |
| API Source | GHL API v2 REST (`https://services.leadconnectorhq.com`) |
| Auth | Supabase Auth (compartilhado com dashboard atual) |
| Cache | In-memory (MVP) → Vercel KV (fase 2) |

---

## ESTRUTURA DE PASTAS (criar nesses paths exatos)

```
api/ghl/                    ← Vercel Serverless Functions (proxy)
  contacts.ts               ← GET /contacts/ (paginado)
  contacts/[id].ts          ← GET /contacts/:id
  calendar/events.ts        ← GET /calendars/events
  opportunities.ts          ← GET /opportunities/search
  pipelines.ts              ← GET /opportunities/pipelines
  _example.ts               ← JA EXISTE — usar como referencia

src/services/ghl/           ← Client + Types
  ghlClient.ts              ← Fetch wrapper (auth header, error handling)
  ghlTypes.ts               ← Types dos responses GHL

src/hooks/ghl/              ← React hooks
  useGHLContacts.ts         ← Lista contatos + attribution
  useGHLCalendar.ts         ← Eventos do calendario
  useGHLOpportunities.ts    ← Oportunidades + pipeline stage counts
  useGHLPipelines.ts        ← Pipeline stages (cache longo)

src/pages/ghl/              ← Pages
  GHLPipeline.tsx           ← Funil de oportunidades (hero page)
  GHLAgenda.tsx             ← Agendamentos direto do GHL
  GHLLeads.tsx              ← Leads + UTM attribution
```

---

## COMPONENTES PRA REUTILIZAR (NAO recriar)

```typescript
// Importar destes paths exatos:
import { DateRangePicker, type DateRange } from '@/src/components/DateRangePicker';
import { SalesFunnelChart } from '@/src/components/charts/SalesFunnelChart';
// MetricCards: ver pattern em src/pages/Agendamentos.tsx (inline, nao e componente separado)
// AccountContext: ver src/contexts/AccountContext.tsx (location picker + selectedAccount)
// AuthContext: ver src/contexts/AuthContext.tsx (user auth state)
```

---

## EDGE FUNCTION PATTERN

Ver `api/ghl/_example.ts` como referencia completa. Resumo:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS headers
  // 2. Auth check (Authorization header)
  // 3. Validar query params (locationId obrigatorio)
  // 4. Check cache (Map em memoria)
  // 5. Fetch GHL API com Bearer token
  // 6. Salvar cache + retornar
}
```

**Headers obrigatorios pro GHL:**
```typescript
{
  Authorization: `Bearer ${process.env.GHL_API_KEY}`,
  Version: '2021-07-28',
  Accept: 'application/json',
}
```

---

## GHL API ENDPOINTS

### Contacts (Leads)
```
GET /contacts/?locationId={id}&limit=100&startAfter={timestamp}
→ Paginado (max 100/page). Campos: firstName, lastName, email, phone, tags, dateAdded
→ Attribution: contact.attributionSource.{utmSource, medium, utmCampaign, utmContent}
```

### Calendar Events (Agendamentos)
```
GET /calendars/events?locationId={id}&startTime={ms}&endTime={ms}
→ Retorna events com: title, appointmentStatus (showed/noshow/cancelled/confirmed/new),
  contactId, startTime, endTime, calendarId
```

### Opportunities (Pipeline)
```
GET /opportunities/search?location_id={id}&status={open|won|lost|abandoned|all}&limit=100&page=1
→ Retorna: name, monetaryValue, pipelineId, pipelineStageId, status, contactId
```

### Pipelines (Stages)
```
GET /opportunities/pipelines?locationId={id}
→ Retorna: pipeline.stages[] com {id, name} — usar pra montar funil
→ Cache longo (1h) — stages raramente mudam
```

---

## ORDEM DE EXECUCAO

### Fase 1: Edge Functions (proxy)
1. Criar `api/ghl/pipelines.ts` — proxy GET /opportunities/pipelines
2. Criar `api/ghl/opportunities.ts` — proxy GET /opportunities/search
3. Criar `api/ghl/calendar/events.ts` — proxy GET /calendars/events
4. Criar `api/ghl/contacts.ts` — proxy GET /contacts/
5. Criar `api/ghl/contacts/[id].ts` — proxy GET /contacts/:id
6. Testar com `npx vercel dev` + REST Client

### Fase 2: Types + Client
1. Criar `src/services/ghl/ghlTypes.ts` — tipos dos responses
2. Criar `src/services/ghl/ghlClient.ts` — fetch wrapper

### Fase 3: Hooks
1. Criar `useGHLPipelines.ts` — carrega stages (cache longo)
2. Criar `useGHLOpportunities.ts` — carrega opportunities + agrupa por stage
3. Criar `useGHLCalendar.ts` — carrega events por date range
4. Criar `useGHLContacts.ts` — carrega contacts + attribution

### Fase 4: Pages
1. Criar `GHLPipeline.tsx` — funil (SalesFunnelChart) + metric cards
2. Criar `GHLAgenda.tsx` — tabela + chart por dia
3. Criar `GHLLeads.tsx` — tabela UTM + donut chart

### Fase 5: Routing
1. Adicionar rotas em `App.tsx`:
   ```tsx
   <Route path="/ghl/pipeline" element={<GHLPipeline />} />
   <Route path="/ghl/agenda" element={<GHLAgenda />} />
   <Route path="/ghl/leads" element={<GHLLeads />} />
   ```
2. Adicionar links no menu lateral (Layout component)

### Fase 6: Validacao
1. `npx tsc --noEmit` — zero erros nos arquivos novos
2. `npm run build` — build passa
3. Testar com location Vertex: `ehlHgDeJS3sr8rCDcZtA`

---

## ENV VARS NECESSARIAS

```bash
# Ja existem:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Novas (criar em .env.local):
GHL_API_KEY=<chave agency-level do GoHighLevel>
GHL_API_BASE_URL=https://services.leadconnectorhq.com
```

---

## LOCATION ID PRA TESTE

```
Vertex Sales Solutions: ehlHgDeJS3sr8rCDcZtA
```
