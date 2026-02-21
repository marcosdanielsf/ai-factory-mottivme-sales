# LinkedIn Prospector — Frontend Status

**Data:** 2026-02-20  
**Agente:** lp-frontend subagent  
**Dev Server:** http://localhost:3006 (Vite, auto-port)

---

## Páginas Testadas (Compilação TypeScript)

| Página | Compila? | Erros Encontrados | Status |
|--------|----------|-------------------|--------|
| `ProspectorInbox.tsx` | ✅ | Nenhum | OK |
| `ProspectorAI.tsx` | ✅ | Nenhum | OK (mock logs removidos) |
| `ProspectorAccounts.tsx` | ✅ | Nenhum | OK |
| `ProspectorDashboard.tsx` | ✅ | Nenhum | OK |
| `ProspectorQueue.tsx` | ✅ | Nenhum | OK |
| `ProspectorTemplates.tsx` | ✅ | Nenhum | OK |
| `ProspectorAnalytics.tsx` | ✅ | 1 erro corrigido | FIXED |
| `ProspectorCampaignDetail.tsx` | ✅ | Nenhum | OK |
| `useLinkedInInbox.ts` | ✅ | Nenhum | OK |
| `prospector-api.ts` | ✅ | Nenhum | OK |
| `Sidebar.tsx` | ✅ | Nenhum | OK (itens adicionados) |

---

## Erros TypeScript Encontrados e Corrigidos

### 1. `ProspectorAnalytics.tsx` — Line 168
**Erro:**  
```
Type '{ size: number; className: string; title: string; }' is not assignable to 
type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'
```
**Causa:** lucide-react v0.562 não aceita `title` como prop direto em ícones SVG.  
**Fix:**  
```tsx
// ANTES (erro):
<Trophy size={14} className="text-[#d29922]" title="Top Performer" />

// DEPOIS (corrigido):
<span title="Top Performer"><Trophy size={14} className="text-[#d29922]" /></span>
```

---

## Erros TypeScript NÃO relacionados ao Prospector (pré-existentes)

Estes erros existem em outros módulos e não foram alterados pois estão fora do escopo:
- `src/pages/TeamRPG.tsx` — type predicate issue
- `src/pages/Validation.tsx` — type mismatch
- `src/pages/VideoProducerNew.tsx` — missing property
- `src/pages/LeadGen/ApolloScraper.tsx` — type mismatch
- `src/pages/LeadGen/GMapsScraper.tsx` — type mismatch
- `src/pages/LeadGen/LeadsListPeople.tsx` — Tab type mismatch
- `supabase/functions/process-prospector-queue/index.ts` — Deno-specific types (não afeta build Vite)

---

## Integração com Backend (http://localhost:8000)

### O que funciona ✅
| Feature | Implementação |
|---------|---------------|
| Listar contas | `ProspectorAccounts` → Supabase `lp_accounts` + `prospectorApi.getAccounts()` |
| Adicionar conta | `ProspectorAccounts` → Supabase insert + `prospectorApi.validateAccount()` |
| Validar conta | `ProspectorAccounts` → `GET /api/accounts/{id}/validate` |
| Inbox conversations | `useLinkedInInbox` → Supabase `lp_conversations` |
| Sync inbox | `syncInbox()` → `GET /api/inbox/{accountId}/conversations` |
| Enviar mensagem | `useConversationMessages.sendMessage()` → `POST /api/inbox/{id}/send` |
| Gerar resposta AI | `generateAIResponse()` → `POST /api/ai/generate-response/{id}` |
| Config AI SDR | `ProspectorAI` → Supabase `lp_ai_config` + `GET/PUT /api/ai/config` |
| Queue de review | `ProspectorAI` → Supabase `lp_conversations` (ai_pending=true) |
| Aprovar resposta AI | `handleApprove()` → `POST /api/inbox/{id}/send` |
| Rejeitar resposta AI | `handleReject()` → Supabase update |
| Toggle auto-respond | `ProspectorAI` → Supabase `lp_ai_config` update |
| Robot logs | `ProspectorAI` → `GET /api/robot/logs` (substituiu mock) |
| Dashboard métricas | `ProspectorDashboard` → Supabase via `useProspectorAnalytics` |
| Campanhas | `ProspectorDashboard` → Supabase `prospector_campaigns` |
| WebSocket inbox | `createInboxWebSocket()` → `WS ws://localhost:8000/ws/inbox` |

### O que ainda falta / pode melhorar ⚠️
| Feature | Status | Observação |
|---------|--------|------------|
| Robot status no Dashboard | ❌ Não implementado | ProspectorDashboard não mostra status do robot; seria útil adicionar um card com `GET /api/robot/status` |
| Métricas do backend no Dashboard | ⚠️ Parcial | Usa Supabase (prospector_campaigns); backend tem `GET /api/metrics/{accountId}` que não é chamado |
| Reconexão WebSocket | ✅ Automática | Já tem retry em 5s no `createInboxWebSocket()` |
| Tabela `lp_accounts` no Supabase | ⚠️ Depende de migração | ProspectorAccounts espera esta tabela; backend tem GET /api/accounts mas o front usa Supabase |

---

## Sidebar/Navigation

**Status:** ✅ Atualizado

**Antes** (Seção Prospecção tinha apenas):
- Dashboard → `/prospector`
- Fila → `/prospector/queue`
- Templates → `/prospector/templates`
- Analytics → `/prospector/analytics`
- (links de LeadGen)

**Depois** (adicionados):
```
Prospecção
├── Dashboard          → /prospector
├── LinkedIn Inbox     → /prospector/inbox   ← NOVO 
├── AI SDR             → /prospector/ai       ← NOVO
├── Contas LinkedIn    → /prospector/accounts ← NOVO
├── Fila               → /prospector/queue
├── Templates          → /prospector/templates
├── Analytics          → /prospector/analytics
└── ... (LeadGen items)
```

**Ícones adicionados ao import do Sidebar.tsx:**
- `Inbox` — para LinkedIn Inbox
- `UserCog` — para Contas LinkedIn

---

## Estado Visual (Descrição)

### ProspectorInbox
- Layout 2 painéis (esquerdo: lista de conversas, direito: chat)
- Dark theme `#0d1117` / `#21262d`
- Avatares com iniciais fallback
- Filtros: Todas / Não respondidas / Interessados / AI Pendente
- Busca por nome/headline/empresa
- Badges de não lidos (azul)
- Badges AI pendente (roxo)
- Banner de sugestão da IA com Aprovar/Editar/Rejeitar
- Input com Enter para enviar + botão Bot para gerar resposta IA

### ProspectorAccounts
- Lista de contas LinkedIn conectadas
- Status badge (active/inactive/error)
- Form para adicionar nova conta (li_at + jsessionid + nome)
- Botão de validar conta
- Config de automação (horários, limites diários)

### ProspectorAI
- Métricas de AI SDR (conversas classificadas, score médio, etc.)
- Queue de respostas pendentes com approve/reject
- Toggle auto-respond com threshold de score
- Log de ações da IA (real-time do backend)
- Config de personalidade/tom

### ProspectorDashboard
- Cards de métricas (campanhas ativas, leads na fila, DMs hoje, taxa de resposta)
- Lista de campanhas com status
- Botão criar campanha com modal

---

## Arquivos Modificados

1. `src/pages/ProspectorAnalytics.tsx` — Fix `title` prop no Trophy icon
2. `src/pages/ProspectorAI.tsx` — Substituiu mock logs por chamada real ao backend
3. `src/components/Sidebar.tsx` — Adicionou Inbox/AI SDR/Accounts + imports de ícones

---

## Dev Server

```
URL: http://localhost:3006
Comando: npx vite --port 3005 (auto-rebinded para 3006 pois 3005 estava ocupado)
```
