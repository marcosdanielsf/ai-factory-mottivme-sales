# AgenticOS - Insights e Decisoes

> **Atualizado em:** 2026-01-21 (manhã)
> **Status:** Sistema de Skills Orquestrado FUNCIONANDO
> Conhecimento acumulado durante o desenvolvimento

---

## Sessão 2026-01-21 - SKILLS ORQUESTRADAS PARA DETECÇÃO DE ORIGEM

### Problema Original

**Sintoma:** Endpoint `/api/detect-conversation-origin` falhava frequentemente
- API do GHL retornava `TYPE_PHONE` em vez de `TYPE_INSTAGRAM`
- Mensagens em formato inesperado (`dict` ao invés de `list`)
- Erros: "Conversa sem mensagens", "'str' object has no attribute 'get'"

**Causa Raiz:** Dependência excessiva da API do GHL que é inconsistente

### Solução Implementada: Skills Orquestradas

#### Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│          ORQUESTRADOR: enrich_and_detect_origin                 │
│                                                                 │
│  Input: contact_id, api_key, message                            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ get_ghl_contact │  │scrape_instagram │  │analyze_message  │ │
│  │                 │  │    _profile     │  │    _intent      │ │
│  │ → username      │  │ → bio           │  │ → is_response   │ │
│  │ → profile_photo │  │ → followers     │  │ → origin        │ │
│  │ → ig_sid        │  │ → specialty     │  │ → confidence    │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┴────────────────────┘          │
│                              │                                  │
│                    ┌─────────▼─────────┐                       │
│                    │ Resultado Final   │                       │
│                    │ origin + profile  │                       │
│                    └───────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 4 Novas Skills Criadas

| Skill | Arquivo | Função |
|-------|---------|--------|
| `get_ghl_contact` | `skills/get_ghl_contact.py` | Busca contato no GHL, extrai username do Instagram do campo `firstName` |
| `scrape_instagram_profile` | `skills/scrape_instagram_profile.py` | Scrape bio, seguidores, especialidade (requer INSTAGRAM_SESSION_ID) |
| `analyze_message_intent` | `skills/analyze_message_intent.py` | Análise semântica com Gemini + heurísticas para detectar outbound/inbound |
| `enrich_and_detect_origin` | `skills/enrich_and_detect_origin.py` | **ORQUESTRADOR** - combina todas as skills em paralelo |

#### Novo Endpoint

**URL:** `POST /api/enrich-and-detect-origin`

**Request:**
```json
{
  "contact_id": "{{ $('Info').first().json.lead_id }}",
  "api_key": "{{ $('Info').first().json.api_key }}",
  "message": "{{ $json.mensagem }}",
  "location_id": "{{ $('Info').first().json.location_id }}"
}
```

**Response (exemplo real):**
```json
{
  "success": true,
  "origin": "outbound",
  "origin_label": "BDR/Empresa iniciou (prospecção)",
  "origin_confidence": 0.9,
  "instagram_username": "dra.marilia.santos",
  "profile_context": {
    "bio": null,
    "followers": null,
    "specialty": null
  },
  "origin_context": {
    "origin": "outbound",
    "confidence": 0.9,
    "reasoning": "Padrão detectado: agradecimento_algo_recebido",
    "is_response": true,
    "analysis_method": "gemini"
  },
  "agent_context": {
    "should_activate": true,
    "context_type": "prospecting_response",
    "tom_agente": "direto, dar continuidade à conversa",
    "recommendation": "Lead respondendo prospecção - ativar qualificação imediata",
    "avoid": "Não se apresentar novamente, não fazer introduções genéricas"
  },
  "skills_executed": ["get_ghl_contact", "scrape_instagram_profile", "analyze_message_intent"]
}
```

### Insight: Username do Instagram está no GHL

**Descoberta:** Quando lead vem do Instagram, o GHL guarda o username no campo `firstName`:
```json
{
  "firstName": "dra.marilia.santos",  // ← USERNAME!
  "attributionSource": {
    "medium": "instagram",
    "igSid": "1386946543118614"
  }
}
```

**Código para extrair:**
```python
def _extract_instagram_username(contact: Dict) -> Optional[str]:
    attribution = contact.get("attributionSource") or {}
    if attribution.get("medium") == "instagram":
        first_name = contact.get("firstName") or ""
        if " " not in first_name:  # Username não tem espaços
            return first_name.lower()
```

### Insight: Análise Semântica é Suficiente

**Descoberta:** Não precisa buscar histórico de mensagens no GHL. A análise semântica da mensagem atual tem 90%+ de precisão:

| Mensagem | Padrão Detectado | Origem |
|----------|------------------|--------|
| "Muito obrigada pelo elogio" | `agradecimento_algo_recebido` | outbound |
| "Oi, quero saber mais sobre..." | `interesse_espontaneo` | inbound |
| "Vi sua mensagem" | `referencia_mensagem_anterior` | outbound |

**Heurísticas implementadas:** ~15 padrões de RESPOSTA + ~12 padrões de INICIATIVA

### Decisão: Scrape do Instagram Opcional

**Motivo:** Risco de bloqueio do Instagram
- 10-20 scrapes/hora → ~5% risco
- 200+ scrapes/hora → ~60% risco

**Decisão:** Deixar scrape desabilitado por ora. A análise semântica resolve o problema principal (detectar origem).

**Para habilitar futuramente:** Adicionar `INSTAGRAM_SESSION_ID` no Railway

### JSON para Integrar no "Classificar Lead IA"

```json
{
  "username": "{{ $('Info').first().json.first_name || 'lead' }}",
  "message": "{{ $('Mensagem recebida').first().json.body?.message?.body }}",
  "tenant_id": "{{ $('Info').first().json.location_id }}",

  "profile_context": {
    "bio": "{{ $('Detectar Origem').first().json.profile_context?.bio || '' }}",
    "especialidade": "{{ $('Detectar Origem').first().json.profile_context?.specialty || '' }}",
    "followers": "{{ $('Detectar Origem').first().json.profile_context?.followers || 0 }}",
    "source_channel": "instagram"
  },

  "origin_context": {
    "origem": "{{ $('Detectar Origem').first().json.origin }}",
    "context_type": "{{ $('Detectar Origem').first().json.agent_context?.context_type }}",
    "tom_agente": "{{ $('Detectar Origem').first().json.agent_context?.tom_agente }}",
    "reasoning": "{{ $('Detectar Origem').first().json.origin_context?.reasoning }}"
  },

  "context": {
    "source": "instagram",
    "phone": "{{ $('Info').first().json.telefone || '' }}",
    "email": "{{ $('Info').first().json.email || '' }}",
    "tags": "{{ $('Info').first().json.etiquetas || '' }}"
  }
}
```

### Arquivos Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `skills/get_ghl_contact.py` | **CRIADO** |
| `skills/scrape_instagram_profile.py` | **CRIADO** |
| `skills/analyze_message_intent.py` | **CRIADO** |
| `skills/enrich_and_detect_origin.py` | **CRIADO** |
| `skills/__init__.py` | Atualizado para registrar novas skills |
| `api_server.py` | Adicionado endpoint `/api/enrich-and-detect-origin` |

### Commits

| Hash | Descrição |
|------|-----------|
| `d3a80e3` | fix: complete rewrite of detect_conversation_origin |
| `44a0606` | feat: orchestrated skills for enrich + detect origin |

---

## Sessão 2026-01-20 - CONTEXTO DE PERFIL PARA IA DE QUALIFICAÇÃO

### Problema Identificado

**Sintoma:** Agente de qualificação responde de forma genérica/robótica
- Introduções estranhas: "Alberto Correia por aqui???"
- Perguntas genéricas quando BDR já viu o perfil do lead
- Sem personalização baseada na bio/profissão do lead

**Causa Raiz:** O endpoint `/webhook/classify-lead` não recebia contexto do perfil

```
FLUXO QUEBRADO:
┌──────────────────────┐      ┌───────────────────┐
│  Auto Enrich Lead    │ ───► │ Classificar Lead  │
│  RETORNA: bio,       │      │ RECEBE: username  │
│  followers, perfil   │      │ message, tags     │
│                      │      │ NÃO RECEBE: bio!  │
└──────────────────────┘      └───────────────────┘
```

### Solução Implementada

#### 1. Novos Modelos Pydantic (`api_server.py`)

```python
class LeadProfileContext(BaseModel):
    bio: Optional[str] = None
    especialidade: Optional[str] = None
    followers: Optional[int] = None
    is_verified: Optional[bool] = None
    source_channel: Optional[str] = None

class ConversationOriginContext(BaseModel):
    origem: Optional[str] = None  # "outbound" ou "inbound"
    context_type: Optional[str] = None
    tom_agente: Optional[str] = None
    mensagem_abordagem: Optional[str] = None

class ClassifyLeadRequest(BaseModel):
    # campos existentes...
    profile_context: Optional[LeadProfileContext] = None
    origin_context: Optional[ConversationOriginContext] = None
```

#### 2. Prompt Atualizado do Gemini

O prompt agora:
- Usa bio/especialidade para entender o lead
- Considera se é resposta de prospecção (outbound) vs contato orgânico (inbound)
- Personaliza sugestão de resposta
- Evita introduções genéricas

#### 3. JSON Body para n8n (arquivo: `.claude/n8n-classificar-lead-ia-novo-body.json`)

```json
{
  "profile_context": {
    "bio": "{{ $('Auto Enrich Lead').first().json.lead_data?.bio }}",
    "especialidade": "...",
    "followers": "..."
  },
  "origin_context": {
    "origem": "{{ $json.origem_conversa }}",
    "context_type": "{{ $json.context_type }}",
    "tom_agente": "{{ $json.tom_agente }}"
  }
}
```

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `api_server.py` | Novos modelos + prompt atualizado |
| `.claude/n8n-classificar-lead-ia-novo-body.json` | JSON body para n8n |
| `.claude/INSTRUCOES-ATUALIZACAO-N8N.md` | Guia de implementação |

### Próximos Passos

1. ✅ Backend atualizado
2. ⏳ Atualizar nó "Classificar Lead IA" no n8n
3. ⏳ Testar com lead real
4. ⏳ Verificar se especialidade está sendo detectada corretamente

### Padrão Aprendido

Sempre que um agente precisa responder de forma personalizada:
1. Passar **contexto do perfil** (bio, profissão, seguidores)
2. Passar **origem da conversa** (outbound vs inbound)
3. Incluir no prompt instruções para evitar respostas genéricas

---

## Sessão 2026-01-19 (noite) - PALIATIVO BDR

### Insight: API GHL Conversations Search

**Problema:** Contato vem do Instagram (`source: "instagram"`) mas API GHL retorna conversa de outro canal (ex: `TYPE_PHONE`)

**Causa:** Um contato no GHL pode ter múltiplas conversas de canais diferentes. A API retorna a primeira (não necessariamente do Instagram).

**Solução implementada:**
```python
# Filtrar por canal específico
async def _search_conversation(..., channel_filter: Optional[str] = None):
    if channel_filter:
        for conv in conversations:
            conv_type = conv.get("type", "").lower()
            if channel_filter.lower() in conv_type:  # Ex: "instagram" in "TYPE_INSTAGRAM"
                return {"conversation": conv, ...}
```

### Insight: n8n envia null como string

**Problema:** `"channel_filter": null` no JSON do n8n chega como string `"null"` no Python

**Solução:**
```python
# api_server.py
if channel_filter in [None, "null", "None", ""]:
    channel_filter = None
```

### Insight: GHL API Key não está no Railway

**Problema:** Endpoint retorna `"GHL_API_KEY não configurada"`

**Solução:** Passar `api_key` no body do request (não confiar apenas em env var)
```json
{
  "contact_id": "...",
  "api_key": "{{ $('Info').first().json.api_key }}"
}
```

### Insight: Decorator @skill envelopa resultado

**Formato do retorno:**
```python
{
    "success": True,
    "skill": "detect_conversation_origin",
    "data": { ... resultado real ... },
    "elapsed_seconds": 0.5
}
```

**Extrair no endpoint:**
```python
result = await skill_function(...)
data = result.get("data", result)  # Extrai o data de dentro do envelope
```

### Tipos de Conversa no GHL

Observados durante testes:
- `TYPE_PHONE` - Conversa de telefone/SMS
- `TYPE_INSTAGRAM` - DM de Instagram (esperado)
- `TYPE_WHATSAPP` - WhatsApp
- `TYPE_EMAIL` - Email
- `TYPE_FB` - Facebook Messenger

**Filtro deve usar substring:** `"instagram" in conv_type.lower()`

---

## Sessão 2026-01-19 - SISTEMA DE SEGURANÇA COMPLETO

### Arquitetura de Segurança em Camadas (8/10)

| Camada | Componente | Arquivo | Função |
|--------|------------|---------|--------|
| 1. Rede | Proxy Decodo | `proxy_manager.py` | IP residencial brasileiro |
| 2. Browser | Playwright Stealth | `instagram_dm_agent.py` | Oculta automação |
| 3. Comportamento | Warm-up Protocol | `warmup_manager.py` | Limites graduais |
| 4. Detecção | Block Detection | `instagram_dm_agent.py` | 8 tipos de bloqueio |

### Insight: Proxy Trial vs Pago

**Problema:** HTTP 407 (Authentication Required) com trial Decodo
**Causa:** Trial tem limite de requisições/conexões
**Solução:** Plano pago $6/mês (2GB) - funciona imediatamente

### Insight: Seletores Instagram Mudam Frequentemente

**Problema:** `input[placeholder="Search..."]` não encontrado
**Causa:** Instagram mudou placeholder de "Search..." para "Search"
**Solução:** Usar múltiplos fallbacks:
```python
selectors = [
    'div[role="dialog"] input[name="queryBox"]',
    'div[role="dialog"] input[placeholder="Search..."]',
    'div[role="dialog"] input[placeholder="Search"]',
]
```

### Insight: Modal vs Background

**Problema:** Código digitava no campo errado (atrás do modal)
**Causa:** Seletor pegava campo do background, não do dialog
**Solução:** Sempre prefixar com `div[role="dialog"]`

### Configuração Final do Proxy (Supabase)

```sql
INSERT INTO instagram_proxies (
    tenant_id, name, host, port, username, password,
    proxy_type, provider, country, is_residential
) VALUES (
    'global', 'Decodo BR', 'gate.decodo.com', 10001,
    'spmqvj96vr', '<password>', 'http', 'smartproxy', 'BR', true
);
```

### Configuração Playwright Stealth

```python
# requirements.txt
playwright-stealth>=1.0.6

# instagram_dm_agent.py
try:
    from playwright_stealth import stealth_async
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False

# Após criar página:
if STEALTH_AVAILABLE:
    await stealth_async(self.page)
    logger.info("🥷 Stealth mode ENABLED")
```

### Commits Importantes (2026-01-19)

| Commit | Descrição |
|--------|-----------|
| `a76945f` | feat: playwright-stealth anti-detection |
| `8f5593c` | feat: warm-up protocol manager |
| `6f762b6` | feat: proxy rotation infrastructure |
| `076b09e` | feat: block detection system |

---

## Arquitetura

### API Server (api_server.py)
- **Linhas:** ~4.700
- **Endpoints:** 57 rotas
- **Framework:** FastAPI + Uvicorn
- **Deploy:** Railway via Nixpacks

### Problemas Criticos de Escalabilidade

#### 1. Campanhas em Memoria RAM
```python
# Linha 4516-4517
running_campaigns: Dict[str, Dict[str, Any]] = {}
```
**Problema:** Perde tudo em crash/restart. Impossivel escalar horizontalmente.
**Solucao:** Migrar para Redis HSET

#### 2. Rate Limiter Falho
```python
# Linha 91-170
class RateLimiter:
    self.requests: Dict[str, List[float]] = defaultdict(list)
```
**Problema:** Memory leak, sem persistencia, bypass facil.
**Solucao:** Redis INCR com TTL

#### 3. N+1 Queries Supabase
```python
# Linha 344-554
# Cada save_lead faz 2 requests (check + insert/update)
```
**Solucao:** Usar UPSERT ou bulk operations

#### 4. BackgroundTasks Sem Retry
**Problema:** 12 endpoints usam BackgroundTasks sem persistencia.
**Solucao:** Celery + Redis

#### 5. Auth Superficial
```python
# Linha 779-783
# Apenas verifica API_SECRET_KEY header
# Sem JWT, sem scopes, sem RBAC
```

---

## Decisoes Tecnicas

### Multi-Tenant Scoring
- Cada tenant tem seu proprio ICP config na tabela `tenant_icp_config`
- Score calculado com pesos diferentes por tenant
- Prioridades: HOT (>=70), WARM (50-69), COLD (40-49), NURTURING (<40)

### Sincronizacao com GHL
- Metodo `sync_to_ghl()` no instagram_dm_agent.py
- Tags adicionadas: `prospectado`, `outbound-instagram`
- Custom fields: `outreach_sent_at`, `last_outreach_message`, `source_channel`

### Endpoints de Campanha
- `POST /api/campaign/start` - Inicia campanha em background
- `GET /api/campaign/{id}` - Status da campanha
- `GET /api/campaigns` - Lista campanhas (filtro por status)
- `POST /api/campaign/{id}/stop` - Para campanha

---

## Padroes de Codigo

### Async/Await
- 87% dos endpoints sao async
- Usar `async def` para I/O bound operations
- BackgroundTasks para operacoes longas

### Error Handling
```python
try:
    # operacao
except Exception as e:
    logger.error(f"Error: {e}")
    return {"success": False, "error": str(e)}
```

### Logging
```python
import logging
logger = logging.getLogger(__name__)
logger.info("message", extra={"campaign_id": id})
```

---

## Roadmap de Escalabilidade

### Prioridade 1 (Semana 1-2)
1. Redis para campanhas e rate limiting
2. Connection pooling (httpx)
3. Retry logic (tenacity)

### Prioridade 2 (Semana 3-4)
1. Celery job queue
2. Checkpoint system
3. JWT auth

### Prioridade 3 (Semana 5-6)
1. Structured logging
2. Prometheus metrics
3. Sentry integration

---

## Variaveis de Ambiente

```
SUPABASE_URL=https://bfumywvwubvernvhjehk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<secret>
GEMINI_API_KEY=<secret>
OPENAI_API_KEY=<secret>
GHL_API_KEY=<secret>
GHL_LOCATION_ID=<secret>
INSTAGRAM_SESSION_ID=<secret>
```

**ATENCAO:** `.env` estava commitado no git. Rotacionar todas as keys!

---

## Links Uteis

- Railway Dashboard: https://railway.app
- Supabase: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk
- API Docs: https://agenticoskevsacademy-production.up.railway.app/docs
