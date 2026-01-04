# GUIA COMPLETO DOS NOS HTTP/API - FLUXO PRINCIPAL GHL MOTTIVME

## INDICE
1. [Visao Geral](#1-visao-geral)
2. [Endpoints e Integracoes](#2-endpoints-e-integracoes)
3. [Mapa de Relacionamentos](#3-mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#4-detalhamento-por-categoria)
5. [Fluxo de Dados](#5-fluxo-de-dados)
6. [Referencia Rapida](#6-referencia-rapida)
7. [Consideracoes para Escalar](#7-consideracoes-para-escalar)

---

## 1. VISAO GERAL

### Resumo Executivo
O fluxo principal do GHL Mottivme utiliza **17 nos HTTP/API** organizados em **5 categorias funcionais**:

| Categoria | Quantidade | Proposito |
|-----------|------------|-----------|
| Webhook de Entrada | 1 | Receber mensagens do GHL |
| Envio de Mensagens | 6 | Enviar respostas via IG/SMS/WhatsApp |
| Gestao de Contatos | 6 | Buscar e atualizar contatos no GHL |
| Custom Fields | 2 | Gerenciar campos customizados |
| Download de Midia | 1 | Baixar audios para transcricao |
| Campo Desabilitado | 1 | Criar campos (desativado) |

### Integracao Principal
```
API: GoHighLevel (LeadConnector)
Base URL: https://services.leadconnectorhq.com
Versoes de API: 2021-04-15 / 2021-07-28
Autenticacao: Bearer Token dinamico via $json.api_key
```

### Credenciais Utilizadas

| Credencial | ID | Nos que Utilizam |
|------------|----|--------------------|
| ChatWoot account | UmVE5jAScA8a8vNB | Download audio |
| API Key GHL (dinamica) | - | 15 nos (via expressao) |

---

## 2. ENDPOINTS E INTEGRACOES

### 2.1 Endpoints GHL Utilizados

| Endpoint | Metodo | Proposito | Nos |
|----------|--------|-----------|-----|
| `/conversations/messages` | POST | Enviar mensagens | 6 nos |
| `/contacts/{id}` | GET | Buscar contato | 1 no |
| `/contacts/{id}` | PUT | Atualizar contato | 5 nos |
| `/conversations/search` | GET | Buscar conversas | 1 no |
| `/locations/{id}/customFields` | GET | Listar campos | 1 no |
| `/locations/{id}/customFields` | POST | Criar campos | 1 no |

### 2.2 Versoes de API por Endpoint

```
/conversations/messages    -> 2021-04-15 ou 2021-07-28
/contacts/{id}             -> 2021-04-15 ou 2021-07-28
/conversations/search      -> 2021-04-15
/locations/{id}/customFields -> 2021-07-28
```

### 2.3 Tipos de Mensagem Suportados

| Tipo | Canal | Nos que Enviam |
|------|-------|----------------|
| SMS | WhatsApp/SMS | Whatsapp, Whatsapp2, Perguntar Objetivo (SMS) |
| IG | Instagram DM | Instagram, Instagram2, Instagram4 |

---

## 3. MAPA DE RELACIONAMENTOS

```
+-----------------------------------------------------------------------------+
|                     FLUXO DE CHAMADAS HTTP/API                              |
+-----------------------------------------------------------------------------+

ENTRADA (WEBHOOK)
        |
        v
+-------------------+
| Mensagem recebida |  POST /factor-ai (Webhook n8n)
| [WEBHOOK]         |
+--------+----------+
         |
         v
+-------------------+     +---------------------+
| Download audio    |     | Search Contact      |
| [GET audio URL]   |     | [GET /contacts/{id}]|
+-------------------+     +---------------------+
                                   |
                                   v
                          +------------------------+
                          | 1. Buscar Conversa     |
                          | [GET /conversations/   |
                          |  search?contactId=]    |
                          +------------------------+
                                   |
    +------------------------------+------------------------------+
    |                              |                              |
    v                              v                              v
+----------------+      +------------------+      +-------------------+
| 1. Listar      |      | ativar_ia2       |      | Update Contact    |
| campos custom  |      | [PUT /contacts]  |      | (Outbound)        |
| [GET /custom   |      +------------------+      | [PUT /contacts]   |
|  Fields]       |                                +-------------------+
+----------------+                                         |
    |                                                      v
    v                                            +-------------------+
+----------------+                               | Update Contact    |
| 3. Detectar    |                               | (Outbound)2       |
| Objetivo       |                               | [PUT /contacts]   |
| [SWITCH]       |                               +-------------------+
+----------------+
    |
    +--------------------+---------------------+
    |                    |                     |
    v                    v                     v
+--------------+  +---------------+  +------------------+
| 5. Atualizar |  | 5. Atualizar  |  | 5. Perguntar     |
| -> Carreira  |  | -> Consultoria|  | Objetivo (SMS)   |
| [PUT]        |  | [PUT]         |  | [POST /messages] |
+--------------+  +---------------+  +------------------+
                                              |
                                              v
                                     +------------------+
                                     | Instagram4       |
                                     | [POST /messages] |
                                     +------------------+

SAIDA DE MENSAGENS (pos-processamento IA)
    |
    +------------------------+------------------------+
    |                        |                        |
    v                        v                        v
+---------------+     +---------------+     +---------------+
| Whatsapp      |     | Instagram     |     | Instagram2    |
| [POST SMS]    |     | [POST IG]     |     | [POST IG]     |
+---------------+     +---------------+     +---------------+
                             |
                             v
                      +---------------+
                      | Whatsapp2     |
                      | [POST SMS]    |
                      +---------------+

CAMPO DESABILITADO
+------------------------------+
| GHL - Criar Campo Etapa      |
| Funil [DISABLED]             |
| [POST /customFields]         |
+------------------------------+
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 CATEGORIA: WEBHOOK DE ENTRADA

#### 4.1.1 No: "Mensagem recebida"
**ID:** `8b088c6c-3506-4bb1-98e1-8549cf75152a`

| Atributo | Valor |
|----------|-------|
| **Tipo** | Webhook |
| **Metodo HTTP** | POST |
| **Path** | `/factor-ai` |
| **Webhook ID** | 7799e079-0add-4f93-8527-157d2b344711 |
| **Type Version** | 2 |

**URL Completa (exemplo):**
```
https://seu-n8n.com/webhook/factor-ai
```

**Proposito:** Ponto de entrada para todas as mensagens recebidas do GHL. Este webhook e acionado quando uma nova mensagem chega de qualquer canal (WhatsApp, Instagram, SMS).

**Dados Esperados no Payload:**
```json
{
  "lead_id": "string",
  "message": "string",
  "channel": "SMS|IG|WhatsApp",
  "api_key": "string",
  "location_id": "string",
  "first_name": "string",
  "full_name": "string"
}
```

**Conexao:** Saida -> Fluxo principal de processamento

---

### 4.2 CATEGORIA: ENVIO DE MENSAGENS

#### 4.2.1 No: "WhatsApp"
**ID:** `54980c5b-b84c-4c5b-91ab-72b32682a074`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/conversations/messages` |
| **Type Version** | 4.2 |
| **Retry on Fail** | Sim |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-04-15
```

**Body (JSON):**
```json
{
  "type": "SMS",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "{{ $('Parser  Chain').item.json.output.messages }}"
}
```

**Proposito:** Envia a resposta da IA para o lead via WhatsApp/SMS apos o processamento do agente.

**Dependencias:**
- `Info` - Dados do lead e API key
- `Parser Chain` - Resposta processada da IA

---

#### 4.2.2 No: "Instagram"
**ID:** `94639e3c-e072-4d2e-8242-33a1e58e5e4c`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/conversations/messages` |
| **Type Version** | 4.2 |
| **Retry on Fail** | Sim |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-04-15
```

**Body (JSON):**
```json
{
  "type": "IG",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "{{ $('Parser  Chain').item.json.output.messages }}"
}
```

**Proposito:** Envia a resposta da IA para o lead via Instagram DM apos o processamento do agente.

---

#### 4.2.3 No: "WhatsApp2"
**ID:** `d00a6a26-7103-4ad3-a829-7a80ef73c910`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/conversations/messages` |
| **Type Version** | 4.2 |
| **Retry on Fail** | Sim |

**Headers:**
```
Authorization: {{ $('Info').first().json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "SMS",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "Memoria resetada."
}
```

**Proposito:** Envia confirmacao de reset de memoria via SMS/WhatsApp. Usado no fluxo de reset de conversa.

**Nota:** Usa `Version: 2021-07-28` e Content-Type explicito (diferente do WhatsApp principal).

---

#### 4.2.4 No: "Instagram2"
**ID:** `7f184ebf-86ae-4cc2-a23b-7162cec06661`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/conversations/messages` |
| **Type Version** | 4.2 |
| **Retry on Fail** | Sim |

**Headers:**
```
Authorization: {{ $('Info').first().json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "IG",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "Memoria resetada."
}
```

**Proposito:** Envia confirmacao de reset de memoria via Instagram DM. Usado no fluxo de reset de conversa.

---

#### 4.2.5 No: "5. Perguntar Objetivo (SMS)"
**ID:** `75cf217d-647f-4c11-886f-05b0ff3c4209`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/conversations/messages` |
| **Type Version** | 4.2 |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "SMS",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "Ola! Para continuar, preciso saber seu objetivo. Por favor, responda:\n\n/teste carreira - para oportunidades de emprego\n/teste consultoria - para servicos de consultoria"
}
```

**Proposito:** Envia menu de opcoes para o lead escolher entre Carreira ou Consultoria quando o objetivo nao e detectado automaticamente.

---

#### 4.2.6 No: "Instagram4"
**ID:** `0d5d114d-5cd6-4881-ac4c-183ea94a17a5`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/conversations/messages` |
| **Type Version** | 4.2 |
| **Retry on Fail** | Sim |

**Headers:**
```
Authorization: {{ $('Info').first().json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "type": "IG",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "Ola! Para continuar, preciso saber seu objetivo. Por favor, responda:\n\n/teste carreira - para oportunidades de emprego\n/teste consultoria - para servicos de consultoria"
}
```

**Proposito:** Versao Instagram do menu de opcoes de objetivo.

---

### 4.3 CATEGORIA: GESTAO DE CONTATOS

#### 4.3.1 No: "Search Contact"
**ID:** `781bfd6b-aba2-4c1a-8c78-70d3534dc2cc`

| Atributo | Valor |
|----------|-------|
| **Metodo** | GET |
| **URL** | `https://services.leadconnectorhq.com/contacts/{{ $json.lead_id }}` |
| **Type Version** | 2 |
| **Retry on Fail** | Sim |
| **Wait Between Tries** | 3000ms |
| **Execute Once** | Nao |

**Headers (via headerParametersUi):**
```
Authorization: Bearer {{ $json.api_key }}
Version: 2021-07-28
```

**Proposito:** Busca dados completos do contato no GHL por ID. Retorna todos os campos do contato incluindo custom fields.

**Notas no Workflow:** "Busca contato por EMAIL" (nota legada)

**Response Esperada:**
```json
{
  "contact": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "customFields": [...]
  }
}
```

---

#### 4.3.2 No: "1. Buscar Conversa do Contato"
**ID:** `6d921c02-f8f3-45fa-83dc-018c8cad1fba`

| Atributo | Valor |
|----------|-------|
| **Metodo** | GET |
| **URL** | `https://services.leadconnectorhq.com/conversations/search?contactId={{ $('Info').first().json.lead_id }}&limit=1` |
| **Type Version** | 4.2 |
| **Retry on Fail** | Sim |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-04-15
```

**Query Parameters:**
| Parametro | Valor | Descricao |
|-----------|-------|-----------|
| contactId | `$('Info').first().json.lead_id` | ID do contato |
| limit | 1 | Retorna apenas 1 conversa |

**Proposito:** Busca a conversa mais recente do contato para verificar estado atual e ID da conversa.

**Response Esperada:**
```json
{
  "conversations": [
    {
      "id": "string",
      "contactId": "string",
      "lastMessageDate": "datetime",
      "unreadCount": 0
    }
  ]
}
```

---

#### 4.3.3 No: "Update Contact (Outbound)"
**ID:** `cc88b517-55a9-4445-8f03-4d894e55c35c`

| Atributo | Valor |
|----------|-------|
| **Metodo** | PUT |
| **URL** | `https://services.leadconnectorhq.com/contacts/{{ $('Edit Fields').item.json.contactId }}` |
| **Type Version** | 2 |

**Headers (via headerParametersUi):**
```
Authorization: Bearer {{ $('Info').item.json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Body Parameters (via bodyParametersUi):**
```json
{
  "tags": "reset"
}
```

**Proposito:** Adiciona tag "reset" ao contato durante o fluxo de reset de memoria.

**Dependencias:**
- `Edit Fields` - Fornece contactId
- `Info` - Fornece api_key

---

#### 4.3.4 No: "Update Contact (Outbound)2"
**ID:** `9650f9b9-a652-4b3e-b4c7-55ee0efe9981`

| Atributo | Valor |
|----------|-------|
| **Metodo** | PUT |
| **URL** | `https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}` |
| **Type Version** | 2 |

**Headers (via headerParametersUi):**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Proposito:** Atualiza contato apos reset de memoria (sem body definido - apenas headers).

---

#### 4.3.5 No: "ativar_ia2"
**ID:** `909e65a3-4dbe-440a-976c-c983a17ad755`

| Atributo | Valor |
|----------|-------|
| **Metodo** | PUT |
| **URL** | `https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}` |
| **Type Version** | 4.2 |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-04-15
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "customFields": [
    {
      "id": "{{ $json.ativar_ia_id }}",
      "value": "sim"
    }
  ]
}
```

**Proposito:** Ativa o campo customizado `ativar_ia` para "sim", habilitando o atendimento por IA para este contato.

**Notas no Workflow:** "Atualiza o campo customizado work_permit no contato" (nota legada)

---

#### 4.3.6 No: "5. Atualizar -> Carreira"
**ID:** `9d7bc33a-d829-4a61-bb48-73a74c8feedc`

| Atributo | Valor |
|----------|-------|
| **Metodo** | PUT |
| **URL** | `https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}` |
| **Type Version** | 4.2 |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-04-15
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "customFields": [
    {
      "id": "{{ $('3. Detectar Objetivo').first().json.especialista_motive_id }}",
      "value": "sdrcarreira"
    },
    {
      "id": "{{ $('3. Detectar Objetivo').first().json.objetivo_lead_id }}",
      "value": "carreira"
    },
    {
      "id": "{{ $('3. Detectar Objetivo').first().json.ativar_ia_id }}",
      "value": "sim"
    }
  ]
}
```

**Proposito:** Atualiza o contato quando detectado objetivo de Carreira:
- Define especialista como "sdrcarreira"
- Define objetivo como "carreira"
- Ativa IA

**Dependencias:** `3. Detectar Objetivo` - IDs dos campos customizados

---

#### 4.3.7 No: "5. Atualizar -> Consultoria"
**ID:** `30fa385d-0d5e-4cbb-80cf-5eba3cd244e4`

| Atributo | Valor |
|----------|-------|
| **Metodo** | PUT |
| **URL** | `https://services.leadconnectorhq.com/contacts/{{ $('Info').first().json.lead_id }}` |
| **Type Version** | 4.2 |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-04-15
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "customFields": [
    {
      "id": "{{ $('3. Detectar Objetivo').first().json.especialista_motive_id }}",
      "value": "sdrconsultoria"
    },
    {
      "id": "{{ $('3. Detectar Objetivo').first().json.objetivo_lead_id }}",
      "value": "consultoria"
    },
    {
      "id": "{{ $('3. Detectar Objetivo').first().json.ativar_ia_id }}",
      "value": "sim"
    }
  ]
}
```

**Proposito:** Atualiza o contato quando detectado objetivo de Consultoria:
- Define especialista como "sdrconsultoria"
- Define objetivo como "consultoria"
- Ativa IA

---

### 4.4 CATEGORIA: CUSTOM FIELDS

#### 4.4.1 No: "1. Listar campos customizados"
**ID:** `e1f52353-ebd5-4ba8-8b91-9db2bbd32b14`

| Atributo | Valor |
|----------|-------|
| **Metodo** | GET |
| **URL** | `https://services.leadconnectorhq.com/locations/{{ $('Info').first().json.location_id }}/customFields` |
| **Type Version** | 4.2 |

**Headers:**
```
Authorization: Bearer {{ $('Info').first().json.api_key }}
Version: 2021-07-28
```

**Proposito:** Lista todos os campos customizados da location para obter os IDs necessarios para atualizacao de contatos.

**Response Esperada:**
```json
{
  "customFields": [
    {
      "id": "string",
      "name": "string",
      "fieldKey": "string",
      "dataType": "string",
      "position": 0
    }
  ]
}
```

**Uso Tipico:** Obter IDs de campos como:
- `ativar_ia_id`
- `objetivo_lead_id`
- `especialista_motive_id`

---

#### 4.4.2 No: "GHL - Criar Campo Etapa do Funil" (DESABILITADO)
**ID:** `c95162d2-5fd9-4fb2-bf20-00545dfbe518`

| Atributo | Valor |
|----------|-------|
| **Metodo** | POST |
| **URL** | `https://services.leadconnectorhq.com/locations/{{ $json.location.id }}/customFields` |
| **Type Version** | 4.2 |
| **Disabled** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Headers:**
```
Authorization: Bearer {{ $json.api_key }}
Version: 2021-07-28
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Etapa do Funil",
  "fieldKey": "contact.etapa_funil",
  "dataType": "SINGLE_OPTIONS",
  "placeholder": "Selecione a etapa",
  "position": 100,
  "options": [
    "Novo Lead",
    "Primeiro Contato",
    "Em Follow-Up",
    "Qualificado",
    "Agendamento Marcado",
    "Reagendado",
    "No-Show",
    "Reuniao Realizada",
    "Proposta Enviada",
    "Follow-Up Proposta",
    "Contrato Enviado",
    "Aguardando Pagamento",
    "Cliente Ativo",
    "Perdido"
  ]
}
```

**Proposito:** Cria campo customizado de Etapa do Funil com todas as opcoes de pipeline.

**Status:** DESABILITADO - Campo ja existe, no mantido para referencia.

---

### 4.5 CATEGORIA: DOWNLOAD DE MIDIA

#### 4.5.1 No: "Download audio"
**ID:** `3ab2663c-e9ba-4a33-82ab-237143e965e9`

| Atributo | Valor |
|----------|-------|
| **Metodo** | GET |
| **URL** | `{{ $json.photo_audio }}` (dinamica) |
| **Type Version** | 4.2 |
| **Authentication** | Predefined Credential Type |
| **Credential Type** | chatwootApi |
| **Retry on Fail** | Sim |
| **On Error** | Continue Regular Output |

**Credencial:**
```
ID: UmVE5jAScA8a8vNB
Nome: ChatWoot account
```

**Proposito:** Baixa arquivo de audio enviado pelo lead para posterior transcricao. Usa credencial ChatWoot para autenticacao no storage.

**Input Esperado:**
```json
{
  "photo_audio": "https://storage.url/audio.ogg"
}
```

**Output:** Arquivo binario do audio para processamento pelo no de transcricao.

---

## 5. FLUXO DE DADOS

### 5.1 Ciclo Completo de uma Mensagem de Entrada

```
1. RECEBIMENTO
   +-> Mensagem recebida [WEBHOOK POST /factor-ai]
       (Recebe payload do GHL com dados do lead e mensagem)

2. PROCESSAMENTO DE AUDIO (se aplicavel)
   +-> Download audio [GET URL dinamica]
       (Baixa audio para transcricao)

3. BUSCA DE CONTEXTO
   +-> Search Contact [GET /contacts/{id}]
   |   (Dados completos do contato)
   |
   +-> 1. Buscar Conversa [GET /conversations/search]
   |   (Estado da conversa atual)
   |
   +-> 1. Listar campos customizados [GET /customFields]
       (IDs dos campos para atualizacao)

4. DETECCAO DE OBJETIVO
   +-> 3. Detectar Objetivo [SWITCH]
       |
       +---> Carreira detectada
       |     +-> 5. Atualizar -> Carreira [PUT /contacts]
       |
       +---> Consultoria detectada
       |     +-> 5. Atualizar -> Consultoria [PUT /contacts]
       |
       +---> Objetivo indefinido
             +-> 5. Perguntar Objetivo (SMS) [POST /messages]
             +-> Instagram4 [POST /messages]

5. PROCESSAMENTO IA
   +-> [Agentes de IA processam]

6. ENVIO DE RESPOSTA (por canal)
   +-> Canal SMS/WhatsApp
   |   +-> Whatsapp [POST /messages type=SMS]
   |
   +-> Canal Instagram
       +-> Instagram [POST /messages type=IG]

7. FLUXO DE RESET (quando solicitado)
   +-> ativar_ia2 [PUT /contacts - ativar IA]
   +-> Update Contact (Outbound) [PUT - tag reset]
   +-> Update Contact (Outbound)2 [PUT]
   +-> Whatsapp2 [POST - "Memoria resetada"]
   +-> Instagram2 [POST - "Memoria resetada"]
```

### 5.2 Fluxo de Autenticacao

```
+-----------------+     +----------------------+
| Webhook recebe  |     | Info extrai api_key  |
| dados do GHL    | --> | da location          |
+-----------------+     +----------+-----------+
                                   |
                                   v
                        +----------------------+
                        | Bearer Token         |
                        | dinamico em cada     |
                        | chamada HTTP         |
                        +----------------------+
                                   |
     +-----------------------------+-----------------------------+
     |                             |                             |
     v                             v                             v
+----------+              +--------------+              +--------------+
| GET      |              | POST         |              | PUT          |
| requests |              | /messages    |              | /contacts    |
+----------+              +--------------+              +--------------+
```

### 5.3 Rate Limiting e Retry

```
Configuracao de Retry por No:

+----------------------+-------------+------------------+
| No                   | Retry       | Wait Between     |
+----------------------+-------------+------------------+
| Whatsapp             | Sim         | Padrao (1s)      |
| Instagram            | Sim         | Padrao (1s)      |
| Whatsapp2            | Sim         | Padrao (1s)      |
| Instagram2           | Sim         | Padrao (1s)      |
| Instagram4           | Sim         | Padrao (1s)      |
| Download audio       | Sim         | Padrao (1s)      |
| Search Contact       | Sim         | 3000ms           |
| Buscar Conversa      | Sim         | Padrao (1s)      |
+----------------------+-------------+------------------+

Limites GHL API:
- Rate Limit: 10 requests/segundo por location
- Burst Limit: 120 requests/minuto
- Recomendacao: Implementar exponential backoff
```

---

## 6. REFERENCIA RAPIDA

### 6.1 Tabela de Nos por Metodo HTTP

| Metodo | Nos |
|--------|-----|
| **GET** | Search Contact, 1. Buscar Conversa, 1. Listar campos customizados, Download audio |
| **POST** | Mensagem recebida (webhook), Whatsapp, Instagram, Whatsapp2, Instagram2, 5. Perguntar Objetivo, Instagram4, GHL - Criar Campo (disabled) |
| **PUT** | Update Contact (Outbound), Update Contact (Outbound)2, ativar_ia2, 5. Atualizar -> Carreira, 5. Atualizar -> Consultoria |

### 6.2 Tabela de Nos por Endpoint

| Endpoint | Nos que Utilizam |
|----------|------------------|
| `/conversations/messages` | Whatsapp, Instagram, Whatsapp2, Instagram2, 5. Perguntar Objetivo, Instagram4 |
| `/contacts/{id}` (GET) | Search Contact |
| `/contacts/{id}` (PUT) | Update Contact (x2), ativar_ia2, 5. Atualizar -> Carreira, 5. Atualizar -> Consultoria |
| `/conversations/search` | 1. Buscar Conversa |
| `/locations/{id}/customFields` | 1. Listar campos, GHL - Criar Campo |

### 6.3 Tabela de Nos por Type Version

| Type Version | Nos |
|--------------|-----|
| **2** | Search Contact, Update Contact (Outbound), Update Contact (Outbound)2, Mensagem recebida (webhook) |
| **4.2** | Todos os demais nos HTTP |

### 6.4 Configuracoes Especiais por No

| No | Configuracao Especial |
|----|----------------------|
| Download audio | Credencial ChatWoot, onError: continueRegularOutput |
| Search Contact | waitBetweenTries: 3000ms |
| GHL - Criar Campo | disabled: true, alwaysOutputData: true |
| Todos POST/messages | retryOnFail: true |

### 6.5 Headers Padrao por Versao de API

**Versao 2021-04-15:**
```
Authorization: Bearer {api_key}
Version: 2021-04-15
```

**Versao 2021-07-28:**
```
Authorization: Bearer {api_key}
Version: 2021-07-28
Content-Type: application/json
```

---

## 7. CONSIDERACOES PARA ESCALAR

### 7.1 Pontos de Atencao

1. **API Key Dinamica**
   - Atualmente: Obtida de `$('Info').first().json.api_key`
   - Risco: Se Info nao existir, requisicao falha
   - Recomendacao: Adicionar validacao antes das chamadas

2. **Versoes de API Inconsistentes**
   - Alguns nos usam 2021-04-15, outros 2021-07-28
   - Impacto: Comportamento diferente em edge cases
   - Recomendacao: Padronizar para versao mais recente

3. **No Desabilitado Mantido**
   - "GHL - Criar Campo Etapa do Funil" esta disabled
   - Manter para referencia ou remover em limpeza

4. **Credencial ChatWoot Misturada**
   - Usada para download de audio em fluxo GHL
   - Verificar se e necessario ou se GHL tem proprio storage

### 7.2 Recomendacoes para Multi-tenant

1. **Validacao de API Key:**
```javascript
// Antes de cada requisicao
if (!$('Info').first().json.api_key) {
  throw new Error('API Key nao encontrada');
}
```

2. **Tratamento de Rate Limit:**
```javascript
// Implementar em nos criticos
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1000,
  "continueOnFail": false
}
```

3. **Cache de Custom Fields:**
   - IDs de campos customizados raramente mudam
   - Cachear por location_id
   - Invalidar apenas em caso de erro 404

4. **Monitoramento:**
```javascript
// Log de metricas por location
{
  "location_id": "string",
  "endpoint": "string",
  "status": 200,
  "latency_ms": 150,
  "timestamp": "datetime"
}
```

### 7.3 Melhores Praticas para Integracao GHL

1. **Usar Versao Mais Recente da API:**
   - Migrar todos os nos para 2021-07-28
   - Testar antes em ambiente de staging

2. **Implementar Circuit Breaker:**
   - Se GHL retornar 5xx consecutivos, pausar requests
   - Notificar operacao

3. **Separar Envio de Mensagens:**
   - Criar fila para mensagens de saida
   - Processar em batch respeitando rate limits

4. **Logging Estruturado:**
```json
{
  "timestamp": "2024-12-23T10:30:00Z",
  "node": "Whatsapp",
  "method": "POST",
  "endpoint": "/conversations/messages",
  "lead_id": "xxx",
  "status": 200,
  "response_time_ms": 150
}
```

### 7.4 Checklist de Seguranca

- [ ] API Keys nunca expostas em logs
- [ ] Validar lead_id antes de usar em URL
- [ ] Sanitizar mensagens antes de enviar
- [ ] Rate limiting por location_id
- [ ] Timeout configurado em todas requisicoes
- [ ] Retry com backoff exponencial

---

## CHANGELOG

| Data | Versao | Descricao |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentacao inicial completa dos 17 nos HTTP/API |

---

*Documento gerado para escalabilidade da operacao BPO Mottivme Sales*
