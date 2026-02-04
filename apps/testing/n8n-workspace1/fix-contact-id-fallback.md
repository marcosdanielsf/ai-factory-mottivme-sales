# Fix Contact ID - Fallback GHL

**Data:** 2026-01-04
**Problema:** `contact_id` vindo null no workflow 02
**Solução:** Adicionar busca no GHL como fallback

---

## Passo 1: Adicionar Nó HTTP Request

**Nome do nó:** `Buscar Contato GHL (Fallback)`

**Posição:** DEPOIS do `Buscar Call no Supabase`, ANTES do `Call Existe?`

### Configurações:

- **Method:** POST
- **URL:** `https://services.leadconnectorhq.com/contacts/search`

### Headers:

| Name | Value |
|------|-------|
| Authorization | `Bearer {{ $json.location_api_key \|\| $json.api_key \|\| 'pit-fe627027-b9cb-4ea3-aaa4-149459e66a03' }}` |
| Version | `2021-07-28` |
| Content-Type | `application/json` |

### Body (JSON):

```json
{
  "locationId": "{{ $json.location_id }}",
  "query": "{{ $json.contact_phone || $json.telefone }}",
  "limit": 1
}
```

### Settings:

- ✅ **Continue On Fail** (IMPORTANTE: marcar essa opção!)

---

## Passo 2: Adicionar Nó Code

**Nome do nó:** `Merge Contact Data`

**Posição:** DEPOIS do `Buscar Contato GHL (Fallback)`

### Código:

```javascript
// Merge dados do Supabase com fallback do GHL
const dadosSupabase = $('Buscar Call no Supabase').first()?.json || {};
const buscaGHL = $input.first()?.json || {};

// Tentar pegar contact_id do GHL se não veio do Supabase
let contactId = dadosSupabase.contact_id;
let contactIdSource = 'supabase';

if (!contactId && buscaGHL.contacts && buscaGHL.contacts.length > 0) {
  contactId = buscaGHL.contacts[0].id;
  contactIdSource = 'ghl_fallback';
  console.log('✅ Contact ID recuperado do GHL:', contactId);
}

if (!contactId) {
  console.warn('⚠️ Contact ID não encontrado nem no Supabase nem no GHL');
}

return [{
  json: {
    // Todos os dados do Supabase
    ...dadosSupabase,

    // Contact ID (com fallback)
    contact_id: contactId,
    contact_id_source: contactIdSource,

    // Garantir que esses campos existem
    location_id: dadosSupabase.location_id || '',
    location_api_key: dadosSupabase.location_api_key || dadosSupabase.api_key || '',
    nome_lead: dadosSupabase.nome_lead || dadosSupabase.contact_name || '',
    telefone: dadosSupabase.telefone || dadosSupabase.contact_phone || '',
    gdrive_url: dadosSupabase.gdrive_url || '',
    association_id: dadosSupabase.association_id || ''
  }
}];
```

---

## Passo 3: Atualizar Conexões

A chain deve ficar assim:

```
Buscar Call no Supabase
        ↓
Buscar Contato GHL (Fallback)
        ↓
Merge Contact Data
        ↓
Call Existe?
        ↓
[resto do fluxo...]
```

---

## Passo 4: Atualizar Referências

### No nó `2.1 Resolver Variáveis`:

**Trocar esta linha:**
```javascript
const dadosCall = $('Buscar Call no Supabase').first()?.json || {};
```

**Por:**
```javascript
const dadosCall = $('Merge Contact Data').first()?.json || {};
```

---

### No nó `Code - Processar Analise V2`:

**Trocar esta linha:**
```javascript
const dadosCall = $('Buscar Call no Supabase').first()?.json || {};
```

**Por:**
```javascript
const dadosCall = $('Merge Contact Data').first()?.json || {};
```

---

## Checklist

- [ ] Adicionar nó `Buscar Contato GHL (Fallback)`
- [ ] Marcar "Continue On Fail" no nó
- [ ] Adicionar nó `Merge Contact Data`
- [ ] Conectar: Supabase → Fallback → Merge → Call Existe?
- [ ] Atualizar referência no `2.1 Resolver Variáveis`
- [ ] Atualizar referência no `Code - Processar Analise V2`
- [ ] Salvar workflow
- [ ] Testar
