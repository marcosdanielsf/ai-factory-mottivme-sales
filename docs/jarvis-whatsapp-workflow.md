# Jarvis WhatsApp Router — Workflow n8n Design

> Data: 2026-02-20 | Versao: 1.0.0
> Arquiteto: MOTTIVME System Architect
> Status: DESIGN FINALIZADO — aguardando implementacao via n8n-workflow-expert
> Schema Supabase: APLICADO (002_jarvis_schema.sql)

---

## 1. Contexto

### Problema Resolvido
Assistente pessoal "Jarvis" para o Marcos Daniels via WhatsApp. Mensagens chegam pelo GHL (location cd1uyzpJox6XPt4Vct8Y), sao roteadas ao projeto correto via keywords/semantica, processadas com contexto de memoria persistente e respondidas em linguagem natural.

### Restricoes
- Gateway: GoHighLevel (location `cd1uyzpJox6XPt4Vct8Y`, PIT `pit-fe627027-b9cb-4ea3-aaa4-149459e66a03`)
- Orquestrador: n8n (self-hosted em `cliente-a1.mentorfy.io`)
- LLM: Claude API (Anthropic) — modelo configuravel por projeto
- Memoria: Supabase PostgreSQL + pgvector (tabelas criadas por 002_jarvis_schema.sql)
- Rate limiting: inline via Code node (sem Redis — keep it simple)
- Formato resposta: WhatsApp-friendly (sem markdown complexo, *bold* e _italic_ simples)

---

## 2. Diagrama de Fluxo

```
[01] GHL Webhook Trigger (POST /webhook/jarvis-whatsapp)
         |
         v
[02] Filter: Inbound Only (IF node)
    - direction == "inbound" AND type == "WhatsApp"
    - Se falso → Stop (sem resposta)
         |
         v
[03] Security Check (Code node)
    - Verificar se phone/contactId esta na allowed_list
    - Rate limit: max 30 msgs/min por numero
    - Se bloqueado → [04] Respond 403
         |
         v (autorizado)
[05] Fetch Project Config (HTTP → Supabase REST)
    GET /rest/v1/jarvis_projects?select=*&is_active=eq.true
         |
         v
[06] Brain Router (Code node)
    - Calcular keyword score para cada projeto
    - Se max_score >= 0.8 → projeto detectado → goto [08]
    - Se max_score < 0.8 → goto [07] Semantic Fallback
         |
         v (score < 0.8)
[07a] Generate Message Embedding (HTTP → OpenAI)
         |
         v
[07b] Semantic Memory Search (HTTP → Supabase RPC jarvis_search_memory)
         |
         v
[07c] Resolve Project from Memories (Code node)
         |
         v
[08] Intent Classifier (HTTP → Claude Haiku)
         |
         v
[09] Context Builder (Code node)
    - claude_md do projeto + memories relevantes
         |
         v
[09a] Fetch Conversation History (HTTP → Supabase)
         |
         v
[09b] Merge Messages Array (Code node)
         |
         v
[10] Call Claude API (HTTP → Anthropic)
    POST /v1/messages
         |
         v
[10a] Extract Claude Response (Code node)
         |
         v
[11] Save User Message (HTTP → Supabase REST)
         |
         v
[12] Save Bot Message (HTTP → Supabase REST)
         |
         v
[13] Extract Memories (HTTP → Claude Haiku)
         |
         v
[13a] Parse Memories (Code node) → loop por memoria
         |
         v
[14a] Generate Memory Embedding (HTTP → OpenAI)
         |
         v
[14b] Save Memory (HTTP → Supabase REST)
         |
         v
[14c] Format WhatsApp Response (Code node)
         |
         v
[15] Reply via GHL (HTTP → GHL Conversations API)
```

---

## 3. Nodes — Descricao Detalhada

### Node 01: GHL Webhook Trigger
```json
{
  "id": "node-01-webhook",
  "name": "GHL Webhook Trigger",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [240, 300],
  "parameters": {
    "httpMethod": "POST",
    "path": "jarvis-whatsapp",
    "responseMode": "responseNode",
    "options": {}
  }
}
```

**Payload de entrada (GHL InboundMessage):**
```json
{
  "type": "InboundMessage",
  "locationId": "cd1uyzpJox6XPt4Vct8Y",
  "contactId": "abc123",
  "conversationId": "conv456",
  "direction": "inbound",
  "messageType": "WhatsApp",
  "body": "Preciso ver o status do Assembly Line",
  "phone": "+5511999998888",
  "dateAdded": "2026-02-20T14:30:00.000Z",
  "attachments": []
}
```

---

### Node 02: Filter — Inbound Only
```json
{
  "id": "node-02-filter",
  "name": "Filter: Inbound Only",
  "type": "n8n-nodes-base.if",
  "typeVersion": 2,
  "position": [460, 300],
  "parameters": {
    "conditions": {
      "conditions": [
        { "leftValue": "={{ $json.direction }}", "rightValue": "inbound", "operator": { "type": "string", "operation": "equals" } },
        { "leftValue": "={{ $json.body }}", "rightValue": "", "operator": { "type": "string", "operation": "notEquals" } }
      ],
      "combinator": "and"
    }
  }
}
```

---

### Node 03: Security Check
```javascript
// Code node
const ALLOWED_NUMBERS = ["+55119XXXXXXXX"]; // Numero real do Marcos
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60000;
const staticData = $getWorkflowStaticData('global');
const phone = $json.phone;
const now = Date.now();

if (!ALLOWED_NUMBERS.includes(phone)) {
  return [{ json: { blocked: true, reason: 'unauthorized_number', phone } }];
}

if (!staticData.rateLimits) staticData.rateLimits = {};
if (!staticData.rateLimits[phone]) staticData.rateLimits[phone] = [];
staticData.rateLimits[phone] = staticData.rateLimits[phone].filter(t => now - t < RATE_WINDOW_MS);

if (staticData.rateLimits[phone].length >= RATE_LIMIT) {
  return [{ json: { blocked: true, reason: 'rate_limit_exceeded', phone } }];
}

staticData.rateLimits[phone].push(now);

return [{
  json: {
    blocked: false,
    contactId: $json.contactId,
    conversationId: $json.conversationId,
    phone,
    body: $json.body,
    locationId: $json.locationId,
    dateAdded: $json.dateAdded
  }
}];
```

---

### Node 06: Brain Router (Keyword Detection)
```javascript
// Code node
const message = $('Security Check').first().json.body.toLowerCase();
const projects = $input.all().map(item => item.json);

const DEFAULT_PROJECT = {
  id: null, slug: 'general', name: 'Geral',
  claude_md: '# Jarvis — Assistente Pessoal do Marcos Daniels\n\nVoce e um assistente pessoal inteligente. Responda em PT-BR, seja conciso e direto.',
  model_override: null,
  config: { max_response_length: 4000, memory_limit: 5 }
};

let bestProject = DEFAULT_PROJECT;
let bestScore = 0;

for (const project of projects) {
  const keywords = Array.isArray(project.keywords) ? project.keywords : [];
  let matches = 0;
  for (const kw of keywords) {
    if (message.includes(kw.toLowerCase())) matches++;
  }
  const score = keywords.length > 0 ? matches / keywords.length : 0;
  if (score > bestScore) { bestScore = score; bestProject = project; }
}

return [{
  json: {
    ...$('Security Check').first().json,
    detected_project: bestScore >= 0.8 ? bestProject : null,
    keyword_score: bestScore,
    needs_semantic: bestScore < 0.8,
    projects_loaded: projects.length,
    default_project: DEFAULT_PROJECT
  }
}];
```

---

### Node 08: Intent Classifier
- Model: `claude-haiku-4-5-20251001`
- System: "Classifique a intencao. Retorne APENAS uma palavra: query, create, execute, tools, ou chitchat."
- Max tokens: 10

---

### Node 09: Context Builder
```javascript
// Code node
const intentData = $input.first().json;
const project = intentData.detected_project || intentData.default_project;
const semanticMemories = intentData.semantic_memories || [];

const systemPrompt = [
  project.claude_md || '# Jarvis — Assistente Pessoal do Marcos Daniels\n\nVoce e um assistente pessoal inteligente.',
  '',
  '## Contexto da Sessao',
  `Projeto detectado: ${project.name}`,
  `Intencao do usuario: ${intentData.intent}`,
  '',
  semanticMemories.length > 0 ? [
    '## Memorias Relevantes',
    ...semanticMemories.map(m => `- ${m.content}`)
  ].join('\n') : '',
  '',
  '## Instrucoes de Resposta',
  '- Responda em portugues brasileiro',
  '- Use *negrito* e _italico_ (formato WhatsApp — sem ## ou **)',
  '- Seja conciso e direto (CEO mindset — sem rodeios)',
  '- Nunca invente dados — informe quando nao sabe',
  '- Maximo de 3 paragrafos por resposta',
].filter(Boolean).join('\n');

return [{
  json: {
    ...intentData,
    system_prompt: systemPrompt,
    model: project.model_override || 'claude-3-5-haiku-20241022',
    max_tokens: project.config?.max_response_length || 4000,
    project_slug: project.slug,
  }
}];
```

---

### Node 14c: Format WhatsApp Response
```javascript
// Converter markdown para formato WhatsApp
const raw = $('Claude Response Extract').first().json.assistant_response;

const formatted = raw
  .replace(/\*\*(.+?)\*\*/g, '*$1*')        // **bold** → *bold*
  .replace(/#{1,6}\s+(.+)/g, '*$1*')         // ## Heading → *Heading*
  .replace(/```[\s\S]*?```/g, '[codigo]')     // code blocks
  .replace(/`(.+?)`/g, '$1')                 // inline code
  .trim();

// WhatsApp tem limite de ~1600 chars por mensagem
const truncated = formatted.length > 1500
  ? formatted.substring(0, 1497) + '...'
  : formatted;

return [{
  json: {
    contactId: $('Security Check').first().json.contactId,
    formatted_response: truncated,
  }
}];
```

---

### Node 15: Reply via GHL
```json
{
  "method": "POST",
  "url": "https://services.leadconnectorhq.com/conversations/messages",
  "headers": {
    "Authorization": "Bearer pit-fe627027-b9cb-4ea3-aaa4-149459e66a03",
    "Version": "2021-04-15",
    "Content-Type": "application/json"
  },
  "body": {
    "type": "WhatsApp",
    "contactId": "{{ contactId }}",
    "message": "{{ formatted_response }}"
  }
}
```

---

## 4. Configuracoes Necessarias

### 4.1 GHL Webhook
1. GHL → Settings → Webhooks (location `cd1uyzpJox6XPt4Vct8Y`)
2. Criar webhook: "Jarvis WhatsApp Router"
3. URL: `https://cliente-a1.mentorfy.io/webhook/jarvis-whatsapp`
4. Events: `InboundMessage`

### 4.2 n8n Environment Variables
```
SUPABASE_URL         = https://bfumywvwubvernvhjehk.supabase.co
SUPABASE_ANON_KEY    = eyJ...(anon)
SUPABASE_SERVICE_KEY = eyJ...(service role)
ANTHROPIC_API_KEY    = sk-ant-...
OPENAI_API_KEY       = sk-...(para text-embedding-3-small)
```

### 4.3 Seed Data (jarvis_projects)
```sql
INSERT INTO jarvis_projects (user_id, slug, name, keywords, type, claude_md, is_active)
VALUES
  ('USER_UUID', 'general', 'Geral', '{}', 'general',
   '# Jarvis\nAssistente pessoal do Marcos Daniels. Responda em PT-BR, seja direto e conciso.', true),
  ('USER_UUID', 'assembly-line', 'Assembly Line', '{assembly,pipeline,registros,fase,railway}', 'coding',
   '# Assembly Line\nPipeline de processamento com 8 agentes. Fase 7, 23.8k registros. Deploy no Railway.', true),
  ('USER_UUID', 'ai-factory', 'AI Factory', '{factory,agente,prompt,versao,score,diana,fernanda,factorai}', 'coding',
   NULL, true);
```

---

## 5. Estimativa de Latencia

| Etapa | Tempo |
|-------|-------|
| GHL → n8n webhook | ~50ms |
| Security + Filter | ~10ms |
| Fetch Projects | ~100ms |
| Brain Router (keyword) | ~5ms |
| Embedding (se semantic) | ~200ms |
| Semantic Search (se usado) | ~150ms |
| Intent Classifier (Haiku) | ~500ms |
| Context Builder + History | ~110ms |
| **Call Claude API (principal)** | **~1.500ms** |
| Save Messages (2x) | ~200ms |
| Extract Memories (Haiku) | ~500ms |
| Save Memories | ~150ms |
| Format + Reply GHL | ~250ms |
| **TOTAL (happy path — keywords)** | **~3.6s** |
| **TOTAL (com semantic fallback)** | **~4.3s** |

---

## 6. Decisoes Arquiteturais

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| Rate Limiting | `$workflow.staticData` | Zero infra extra, suficiente pra 1 usuario |
| Routing primario | Keywords (threshold 0.8) | Fast path ~5ms, $0 custo |
| Routing fallback | Embedding semantico | +350ms, ~$0.00002/msg |
| Modelo intent | claude-haiku-4-5 | Tarefa simples, max 10 tokens |
| Modelo principal | claude-3-5-haiku (default) | Balanco velocidade/qualidade |
| Modelo projetos criticos | claude-opus-4-6 (override) | Raciocinio complexo |
| Historico | 5 mensagens recentes | Controlar tokens |
| Embedding model | text-embedding-3-small (1536d) | Custo baixissimo, qualidade boa |

---

## 7. Checklist Pre-Implementacao

- [x] Schema Supabase criado (002_jarvis_schema.sql)
- [x] RPC jarvis_search_memory criada
- [ ] Seed data em jarvis_projects (pelo menos 'general')
- [ ] n8n env vars configuradas
- [ ] GHL Webhook configurado
- [ ] Numero real do Marcos em ALLOWED_NUMBERS
- [ ] Testar GHL Conversations API com contactId real

---

## 8. Evolucao Planejada

| Versao | Feature |
|--------|---------|
| v1.0 (este doc) | Fluxo completo WhatsApp → Brain Router → Claude → GHL |
| v1.1 | Tasks a partir de msgs ("cria task para..."), imagens (Claude Vision) |
| v2.0 | Multi-canal (Telegram, Email), Google Calendar, alertas proativos |
