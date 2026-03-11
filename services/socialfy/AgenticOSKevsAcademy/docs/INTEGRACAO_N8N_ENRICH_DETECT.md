# Guia de Integração: Endpoint enrich-and-detect-origin no N8N

**Data:** 2026-01-21
**Workflow:** SDR Julia Amare
**URL Base:** `https://agenticoskevsacademy-production.up.railway.app`

---

## 1. Criar Novo Nó: "Detectar Origem"

### Configuração do Nó HTTP Request

| Campo | Valor |
|-------|-------|
| **Nome** | `Detectar Origem` |
| **Método** | `POST` |
| **URL** | `https://agenticoskevsacademy-production.up.railway.app/api/enrich-and-detect-origin` |

### Headers

| Nome | Valor |
|------|-------|
| `Content-Type` | `application/json` |

### JSON Body

```json
={
  "contact_id": "{{ $('Info').first().json.lead_id }}",
  "location_id": "{{ $('Info').first().json.location_id || 'default' }}",
  "api_key": "{{ $('Info').first().json.ghl_api_key || $env.GHL_API_KEY }}",
  "message": "{{ $('Mensagem recebida').first().json.body?.message?.body || $('Mensagem recebida').first().json.body?.lastMessage?.body || '' }}",
  "enable_instagram_scrape": false
}
```

> **Nota:** `enable_instagram_scrape: false` por enquanto para evitar bloqueios do Instagram.

### Response Format

- Marcar: **Response Format: JSON**

---

## 2. Posicionar o Nó no Fluxo

### Conexão

```
[Analisar Contexto Conversa] → [Detectar Origem] → [Classificar Lead IA]
```

O nó "Detectar Origem" deve ser executado **ANTES** do "Classificar Lead IA".

---

## 3. Modificar Nó "Classificar Lead IA"

### Novo JSON Body

Substituir o JSON Body atual por:

```json
={
  "username": "{{ $('Info').first().json.first_name || 'lead' }}",
  "message": "{{ $('Mensagem recebida').first().json.body?.message?.body || $('Mensagem recebida').first().json.body?.lastMessage?.body || '' }}",
  "tenant_id": "{{ $('Info').first().json.location_id || 'default' }}",
  "context": {
    "source": "{{ $('Mensagem recebida').first().json.body?.contact?.attributionSource?.medium || $('Mensagem recebida').first().json.body?.contact_source || 'unknown' }}",
    "phone": "{{ $('Info').first().json.telefone || $('Mensagem recebida').first().json.body?.phone || '' }}",
    "email": "{{ $('Info').first().json.email || '' }}",
    "tags": "{{ $('Mensagem recebida').first().json.body?.tags || '' }}"
  },
  "origin_context": {
    "origem": "{{ $('Detectar Origem').first().json.origin || 'unknown' }}",
    "origem_confidence": {{ $('Detectar Origem').first().json.origin_confidence || 0.5 }},
    "context_type": "{{ $('Detectar Origem').first().json.agent_context?.context_type || 'primeiro_contato' }}",
    "tom_agente": "{{ $('Detectar Origem').first().json.agent_context?.tom_agente || 'receptivo' }}",
    "instagram_username": "{{ $('Detectar Origem').first().json.instagram_username || '' }}",
    "is_response": {{ $('Detectar Origem').first().json.message_analysis?.is_response || false }},
    "detected_context": "{{ $('Detectar Origem').first().json.message_analysis?.detected_context || '' }}"
  }
}
```

---

## 4. Exemplo de Resposta do Endpoint

Quando o endpoint `/api/enrich-and-detect-origin` é chamado, retorna:

```json
{
  "success": true,
  "contact_id": "abc123",
  "instagram_username": "dra.marilia.santos",
  "origin": "outbound",
  "origin_confidence": 0.9,
  "message_analysis": {
    "origin": "outbound",
    "confidence": 0.9,
    "is_response": true,
    "detected_context": "agradecimento_elogio",
    "reasoning": "Padrão detectado: agradecimento_elogio",
    "recommended_tone": "direto, dar continuidade à conversa iniciada"
  },
  "profile_context": null,
  "ghl_contact": {
    "contact_id": "abc123",
    "full_name": "dra.marilia.santos",
    "profile_photo": "https://...",
    "source": "instagram",
    "ig_sid": "1386946543118614"
  },
  "agent_context": {
    "context_type": "lead_prospectado_resposta",
    "tom_agente": "direto, dar continuidade - lead está respondendo prospecção",
    "lead_priority": "alta - respondeu mensagem de prospecção",
    "suggested_approach": "Continuar conversa naturalmente, não precisa se apresentar novamente"
  }
}
```

---

## 5. Interpretação dos Valores

### Campo `origin`

| Valor | Significado | Ação do Agente |
|-------|-------------|----------------|
| `outbound` | Lead responde mensagem da empresa (BDR/prospecção) | Tom direto, continuar conversa |
| `inbound` | Lead iniciou contato espontâneo | Tom receptivo, fazer qualificação |
| `unknown` | Não foi possível determinar | Perguntar para entender contexto |

### Campo `agent_context.context_type`

| Valor | Descrição |
|-------|-----------|
| `lead_prospectado_resposta` | Lead respondendo prospecção |
| `primeiro_contato_organico` | Lead iniciou contato sozinho |
| `contexto_incerto` | Origem não determinada |

---

## 6. Troubleshooting

### Erro 422 - Campos obrigatórios

Se receber erro 422, verificar se todos os campos estão preenchidos:
- `contact_id` (obrigatório)
- `api_key` (obrigatório)
- `location_id` (obrigatório)
- `message` (obrigatório)

### Profile Context é null

Normal se `enable_instagram_scrape: false`. O scrape está desabilitado para evitar bloqueios.

### Origin retorna "unknown"

Mensagem muito curta ou sem padrões reconhecíveis. O agente deve perguntar para entender o contexto.

---

## 7. Campos Adicionais Úteis

O endpoint também retorna dados do contato GHL:

```javascript
// No nó seguinte, você pode acessar:
$('Detectar Origem').first().json.ghl_contact.profile_photo  // Foto do perfil
$('Detectar Origem').first().json.ghl_contact.source         // Canal de origem (instagram)
$('Detectar Origem').first().json.ghl_contact.ig_sid         // Instagram Scoped ID
```

---

**Implementado em:** 2026-01-21
**Testado com:** Contato `dra.marilia.santos` - Resultado: `origin: outbound`, `confidence: 0.9`
