# Relatório de Correções - Follow Up Eterno V6 Multi-Channel

## Data: 2026-01-11
## Arquivo: `[ GHL ] Follow Up Eterno - V6 Multi-Channel - CORRIGIDO.json`

---

## RESUMO DAS CORREÇÕES

### 1. NÓ "SEARCH CONTACT" (LINHA ~170) ✅ CORRIGIDO

**Problema Original:**
- Usava `typeVersion: 2` (formato antigo)
- Parâmetros incorretos para API GHL
- `jsonBody` mal formatado

**Correção Aplicada:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://services.leadconnectorhq.com/contacts/search",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ $('Sem Resposta').first().json.api_key }}"
        },
        {
          "name": "Version",
          "value": "2021-07-28"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\"locationId\": \"{{ $('Sem Resposta').first().json.location_id }}\", \"query\": \"{{ $('Sem Resposta').first().json.unique_id }}\", \"limit\": 1}"
  },
  "typeVersion": 4.2
}
```

**Alterações:**
- ✅ `typeVersion` alterado de 2 para 4.2
- ✅ API Version padronizado para `2021-07-28`
- ✅ `jsonBody` com escape correto: `={{ ... }}`
- ✅ Headers estruturados corretamente para typeVersion 4.2
- ✅ `onError: "continueRegularOutput"` adicionado

---

### 2. REFERÊNCIAS ENTRE NÓS ✅ CORRIGIDO

**Problema Original:**
```javascript
// ERRADO - não funciona em typeVersion 4.2
$('Sem Resposta').item.json.api_key
$('Buscar Lead GHL').item.json.contact
```

**Correção Aplicada:**
```javascript
// CORRETO - funciona em todas as versões
$('Sem Resposta').first().json.api_key
$('Buscar Lead GHL').first().json.contact
```

**Locais Corrigidos:**
- Nó "Search Contact": linha ~176
- Nó "Informacoes Relevantes - FUP": múltiplas ocorrências
- Nó "Formatacao": linha ~274
- Nó "Atualiza status IA - CORRIGIDO": linha ~341
- Nó "Calcular Source": linha ~682

---

### 3. VALIDAÇÃO DE CONTATO INEXISTENTE ✅ ADICIONADO

**Problema Original:**
- Se `Search Contact` retornasse vazio, o workflow falhava

**Correção Aplicada:**

**No nó "Buscar Appointments do Contato":**
```json
"url": "=https://services.leadconnectorhq.com/contacts/{{ $('Search Contact').first().json.contacts?.[0]?.id || $('Sem Resposta').first().json.unique_id }}/appointments"
```

**No nó "Formatacao":**
```javascript
const searchResult = $('Search Contact').first()?.json || {};
const contact = $('Buscar Lead GHL').first()?.json?.contact || {};

// Usar contato da API de busca se disponível, senão usar o GET contact
const contactData = searchResult.contacts?.[0] || contact || {};

const simplified = {
  id: contactData.id || semResposta.unique_id || null,
  name: `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || 'Lead',
  // ... resto com fallbacks
};
```

**Benefícios:**
- ✅ Workflow não falha se contato não existir no GHL
- ✅ Usa `unique_id` do Supabase como fallback
- ✅ Encadeamento opcional `?.` para evitar erros

---

### 4. API VERSION CONSISTENTE ✅ PADRONIZADO

**Problema Original:**
- Alguns nós usavam `2021-04-15`
- Outros usavam `2021-07-28`

**Correção Aplicada:**
TODOS os nós HTTP agora usam `2021-07-28`:

| Nó | API Version (Antes) | API Version (Depois) |
|-----|---------------------|----------------------|
| Search Contact | 2021-04-15 | 2021-07-28 ✅ |
| Buscar Appointments | 2021-04-15 | 2021-07-28 ✅ |
| Buscar Lead GHL | 2021-04-15 | 2021-07-28 ✅ |
| Adicionar Tag GHL | 2021-04-15 | 2021-07-28 ✅ |
| Whatsapp | 2021-04-15 | 2021-07-28 ✅ |
| Instagram | 2021-04-15 | 2021-07-28 ✅ |
| Atualizar Tentativa | 2021-07-28 | 2021-07-28 ✅ (já estava correto) |

---

### 5. ESTRUTURA JSON CORRETA (typeVersion 4.2) ✅ CORRIGIDO

**Modelo Padrão para typeVersion 4.2:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "https://services.leadconnectorhq.com/ENDPOINT",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "=Bearer {{ VARIAVEL }}"
        },
        {
          "name": "Version",
          "value": "2021-07-28"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\"campo\": \"{{ VARIAVEL }}\"}"
  },
  "typeVersion": 4.2,
  "onError": "continueRegularOutput"
}
```

**Regras Aplicadas:**
- ✅ `sendHeaders: true`
- ✅ `headerParameters.parameters` como array
- ✅ `jsonBody` com prefixo `=` e escape correto
- ✅ Expressões entre `{{ }}` dentro de strings JSON
- ✅ `onError: "continueRegularOutput"` em nós críticos

---

### 6. NÓS COM VALIDAÇÃO ADICIONADA ✅ ADICIONADO

**Nós que receberam `onError: "continueRegularOutput":**
- ✅ Sem Resposta (Postgres)
- ✅ Ultima Atualizacao (Postgres)
- ✅ Search Contact (HTTP)
- ✅ Buscar Appointments do Contato (HTTP)
- ✅ Buscar Lead GHL (HTTP)
- ✅ Mensagem anteriores (Postgres)
- ✅ Atualiza status IA - CORRIGIDO (Postgres)
- ✅ Buscar Cadência Action Type (Postgres)
- ✅ Adicionar Tag GHL (HTTP)
- ✅ Buscar Config Agente (Postgres)
- ✅ Whatsapp (HTTP)
- ✅ Instagram (HTTP)
- ✅ Sentiment Analysis (LangChain)
- ✅ Calcular Source (Code)
- ✅ Garantir Registro Existe (Postgres)

---

## LISTA COMPLETA DE NÓS CORRIGIDOS

### Nós Modificados:
1. ✅ Search Contact - typeVersion 4.2 + referências
2. ✅ Formatacao - validação de null
3. ✅ Atualiza status IA - CORRIGIDO - query com fallback
4. ✅ Verificar Agendamento - validação de array
5. ✅ Informacoes Relevantes - FUP - referências `.first()`
6. ✅ Calcular Source (Instagram vs WhatsApp) - validação robusta
7. ✅ Code in JavaScript - parse JSON com tratamento de erro
8. ✅ Merge Config + Sentiment - conexões corrigidas

### Nós com typeVersion 4.2 (HTTP Request):
1. ✅ Search Contact
2. ✅ Buscar Appointments do Contato
3. ✅ Buscar Lead GHL
4. ✅ Whatsapp
5. ✅ Instagram
6. ✅ Adicionar Tag GHL
7. ✅ Buscar Contas Twilio
8. ✅ Fazer Ligacao WhatsApp
9. ✅ Fazer Ligacao Telefone
10. ✅ Atualizar Tentativa

---

## TESTES RECOMENDADOS

### 1. Teste de Contato Existente
```json
{
  "unique_id": "EXISTE_NO_GHL",
  "location_id": "LOCATION_ID_VALIDO",
  "api_key": "API_KEY_VALIDA"
}
```
**Expectativa:** ✅ Busca contato, envia follow-up

### 2. Teste de Contato Inexistente
```json
{
  "unique_id": "NAO_EXISTE_NO_GHL",
  "location_id": "LOCATION_ID_VALIDO",
  "api_key": "API_KEY_VALIDA"
}
```
**Expectativa:** ✅ Usa `unique_id` como fallback, não falha

### 3. Teste de API Version
- Verificar se todos os nós HTTP usam `2021-07-28`

### 4. Teste de Referências
- Verificar se não há mais `.item.json` no workflow
- Substituir por `.first().json`

---

## MIGRAÇÃO DO WORKFLOW ORIGINAL

### Passo 1: Backup
```bash
# Exportar workflow original
# Salvar como backup antes de importar o corrigido
```

### Passo 2: Importar Workflow Corrigido
1. Abrir n8n
2. Ir em "Workflows"
3. Clicar em "Import from File"
4. Selecionar: `[ GHL ] Follow Up Eterno - V6 Multi-Channel - CORRIGIDO.json`

### Passo 3: Verificar Credenciais
- ✅ Postgres: `w2mBaRwhZ3tM4FUw`
- ✅ Google Gemini: `4ut0CD80SN7lbITM`
- ✅ Twilio: `pauvhliYHlGqkTOY`

### Passo 4: Ativar Workflow
1. Alterar `active: false` para `active: true` (linha 3264)
2. Salvar workflow
3. Testar com "Execute Workflow"

---

## TABELAS SUPABASE NECESSÁRIAS

### Tabela Principal: `n8n_schedule_tracking`
```sql
CREATE TABLE IF NOT EXISTS n8n_schedule_tracking (
  unique_id TEXT PRIMARY KEY,
  source TEXT DEFAULT 'whatsapp',
  follow_up_count INTEGER DEFAULT 0,
  api_key TEXT NOT NULL,
  location_id TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  last_execution TIMESTAMPTZ
);
```

### Tabela: `fuu_cadences` (Nova - Action Types)
```sql
CREATE TABLE IF NOT EXISTS fuu_cadences (
  id SERIAL PRIMARY KEY,
  location_id TEXT,
  channel TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'ai_text', 'tag', 'skip', 'ai_call'
  fallback_action TEXT DEFAULT 'ai_text',
  is_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  requires_qualification BOOLEAN DEFAULT false,
  min_engagement_score INTEGER DEFAULT 70,
  tag_to_add TEXT,
  webhook_url TEXT
);
```

### Tabela: `fuu_agent_configs`
```sql
CREATE TABLE IF NOT EXISTS fuu_agent_configs (
  id SERIAL PRIMARY KEY,
  location_id TEXT,
  agent_name TEXT,
  company_name TEXT,
  company_description TEXT,
  agent_role TEXT,
  tone TEXT DEFAULT 'casual',
  use_slang BOOLEAN DEFAULT true,
  use_emoji BOOLEAN DEFAULT true,
  max_emoji_per_message INTEGER DEFAULT 1,
  max_message_lines INTEGER DEFAULT 3,
  offer_value_attempt INTEGER DEFAULT 3,
  breakup_attempt INTEGER DEFAULT 5,
  custom_prompts JSONB,
  message_examples JSONB,
  channel_sequence TEXT[] DEFAULT '{"mensagem", "mensagem", "ligacao_whatsapp", "ligacao", "mensagem"}',
  hours_between_attempts INTEGER[] DEFAULT '{6, 24, 48, 72, 96}',
  follow_up_type TEXT DEFAULT 'sdr_inbound',
  is_active BOOLEAN DEFAULT true
);
```

---

## DIFERENÇAS ENTRE ORIGINAL E CORRIGIDO

| Aspecto | Original | Corrigido |
|---------|----------|-----------|
| **TypeVersion HTTP** | 2 (antigo) | 4.2 (novo) ✅ |
| **API Version** | Inconsistente | 2021-07-28 (padrão) ✅ |
| **Referências** | `.item.json` | `.first().json` ✅ |
| **Validação null** | Não existia | Adicionada ✅ |
| **onError** | Ausente | `continueRegularOutput` ✅ |
| **Fallback contact** | Não existia | `contacts?.[0]?.id ?? unique_id` ✅ |

---

## PRÓXIMOS PASSOS

1. ✅ **Importar workflow corrigido** no n8n
2. ✅ **Verificar credenciais** (Postgres, Gemini, Twilio)
3. ✅ **Criar tabelas Supabase** se não existirem
4. ✅ **Testar manualmente** com "Execute Workflow"
5. ✅ **Ativar Schedule Trigger** quando pronto
6. ✅ **Monitorar primeiras execuções**

---

## CONTATO

**Criado por:** Marcos Daniels - MOTTIVME
**Data:** 2026-01-11
**Versão:** 6.0 CORRIGIDA

---

## ANEXOS

### Exemplo de JSON Body Correto
```json
{
  "jsonBody": "={\"locationId\": \"{{ VAR }}\", \"query\": \"{{ VAR2 }}\", \"limit\": 1}"
}
```

### Exemplo de Referência Correta
```javascript
// ERRADO
$('No Anterior').item.json.campo

// CORRETO
$('No Anterior').first().json.campo

// COM FALLBACK
$('No Anterior').first().json?.campo ?? 'valor_padrao'
```

---

**FIM DO RELATÓRIO**
