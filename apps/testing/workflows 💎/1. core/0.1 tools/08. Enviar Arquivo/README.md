# Tool: Enviar Arquivo

**Versão:** 1.0
**Data de Extração:** 26 de janeiro de 2026
**Workflow Original:** 0.1 - Fluxo Principal de Conversação - GHL - Versionado.json

---

## Visão Geral

A tool **"Enviar arquivo"** é um nó do n8n que integra com a IA e permite que agentes enviem arquivos do Google Drive diretamente para usuários em conversas no GoHighLevel (GHL).

Esta ferramenta funciona como um **workflow wrapper** que chama um workflow específico (02. Baixar e enviar arquivo do Google Drive) com os parâmetros necessários.

---

## Configuração Técnica

| Propriedade | Valor |
|------------|-------|
| **ID do Nó** | `db6e99b9-4471-4223-9732-be3660964b40` |
| **Tipo** | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| **Versão do Tipo** | 2.2 |
| **Posição no Canvas** | [38432, 28144] |
| **Workflow Chamado** | 02. Baixar e enviar arquivo do Google Drive |
| **ID do Workflow** | `si0lxAyvbgKOoO0g` |

---

## Entradas (Inputs)

### Parâmetros Obrigatórios

#### 1. file_id
- **Tipo:** String
- **Obrigatório:** Sim
- **Fonte:** `fromAI` (gerado pelo agente de IA)
- **Descrição:** ID único do arquivo no Google Drive a ser enviado
- **Exemplo:** `1a2b3c4d5e6f7g8h9i0j`

#### 2. id_conversa
- **Tipo:** String
- **Obrigatório:** Sim
- **Fonte:** `Edit Fields.conversationId`
- **Descrição:** ID da conversa no GHL para a qual o arquivo será enviado
- **Exemplo:** `conv_123456789`

#### 3. contact_id
- **Tipo:** String
- **Obrigatório:** Sim
- **Fonte:** `Edit Fields.contactId`
- **Descrição:** ID do contato no GHL (proprietário da conversa)
- **Exemplo:** `contact_987654321`

#### 4. api_key
- **Tipo:** String
- **Obrigatório:** Sim
- **Fonte:** `Info.api_key`
- **Descrição:** Chave de autenticação da API do GHL
- **Exemplo:** `sk-ghl-xxxxxxxxxxxxx`

#### 5. source
- **Tipo:** String
- **Obrigatório:** Sim
- **Fonte:** `Info.source`
- **Descrição:** Identificador da origem/fonte da requisição (rastreamento)
- **Exemplo:** `agent-principal`, `manual`, `webhook`

---

## Fluxo de Dados

```
Agente de IA (fromAI) → file_id
     ↓
Edit Fields ← Contact/Conversation Data
Info Node ← API Key + Source
     ↓
[Enviar Arquivo - Tool Node]
     ↓
02. Baixar e enviar arquivo do Google Drive
     ↓
GHL API (Send Message with Attachment)
```

---

## Mapeamento de Inputs

O nó utiliza o seguinte mapeamento (expressões n8n):

```
file_id: ={{ \$fromAI('file_id', '', 'string') }}
id_conversa: ={{ \$('Edit Fields').first().json.conversationId }}
contact_id: ={{ \$('Edit Fields').first().json.contactId }}
api_key: ={{ \$('Info').first().json.api_key }}
source: ={{ \$('Info').first().json.source }}
```

---

## Dependências

- **Google Drive API:** Acesso para obter arquivos
- **GHL API:** Endpoint de mensagens/anexos
- **Sub-workflow:** "02. Baixar e enviar arquivo do Google Drive"
- **Nodes Pré-requisito:** Edit Fields, Info

---

## Saídas (Outputs)

O workflow chamado retorna:

```json
{
  "success": boolean,
  "message_id": "string (ID da mensagem no GHL)",
  "file_url": "string (URL do arquivo no contexto do GHL)",
  "timestamp": "string (ISO 8601)"
}
```

---

## Referências

- **Arquivo JSON:** tool-config.json
- **Workflow Original:** 0.1 - Fluxo Principal de Conversação - GHL - Versionado.json  
- **Sub-workflow:** 02. Baixar e enviar arquivo do Google Drive
- **Base Path:** /Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/
