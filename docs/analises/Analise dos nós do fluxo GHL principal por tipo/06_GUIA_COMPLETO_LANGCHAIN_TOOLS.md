# GUIA COMPLETO DOS NOS LANGCHAIN TOOLS - FLUXO PRINCIPAL GHL MOTTIVME

## INDICE
1. [Visao Geral](#1-visao-geral)
2. [Tipos de Tools](#2-tipos-de-tools)
3. [Mapa de Relacionamentos](#3-mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#4-detalhamento-por-categoria)
   - 4.1 [Tool HTTP Request](#41-tool-http-request)
   - 4.2 [Tool Think](#42-tool-think)
   - 4.3 [Tool Workflow](#43-tool-workflow)
   - 4.4 [MCP Client Tool](#44-mcp-client-tool)
5. [Integracao com Agentes](#5-integracao-com-agentes)
6. [Referencia Rapida](#6-referencia-rapida)

---

## 1. VISAO GERAL

### Resumo Executivo
O fluxo principal GHL utiliza **8 nos LangChain Tools** organizados em **4 categorias funcionais**:

| Categoria | Quantidade | Proposito |
|-----------|------------|-----------|
| Tool HTTP Request | 1 | Chamadas diretas a API GHL |
| Tool Think | 1 | Raciocinio interno do agente |
| Tool Workflow | 5 | Execucao de sub-workflows |
| MCP Client Tool | 1 | Integracao via Model Context Protocol |

### Como o LangChain Tools Funciona no n8n

Os nos LangChain Tools sao **capacidades** expostas ao agente de IA. Quando o agente LangChain (AI Agent node) recebe uma mensagem, ele pode decidir autonomamente quais tools utilizar com base em:

1. **Descricao da Tool**: Texto que explica quando e como usar a ferramenta
2. **Schema de Input**: Parametros que o agente deve fornecer
3. **Contexto da Conversa**: Informacoes disponiveis para o agente

O agente invoca as tools usando a funcao `$fromAI()` que extrai automaticamente os parametros necessarios da conversa.

---

## 2. TIPOS DE TOOLS

### 2.1 Tool HTTP Request (`@n8n/n8n-nodes-langchain.toolHttpRequest`)
**Proposito**: Permite ao agente fazer chamadas HTTP diretas a APIs externas.

**Caracteristicas**:
- Metodo HTTP configuravel (GET, POST, PUT, DELETE)
- Headers e body customizaveis
- Placeholders para parametros dinamicos
- Autenticacao via headers

### 2.2 Tool Think (`@n8n/n8n-nodes-langchain.toolThink`)
**Proposito**: Ferramenta de raciocinio interno - nao gera output visivel ao usuario.

**Caracteristicas**:
- Conteudo privado (nao aparece na resposta final)
- Estruturacao de logica e instrucoes
- Contexto adicional para o modelo
- Guia para tomada de decisao

### 2.3 Tool Workflow (`@n8n/n8n-nodes-langchain.toolWorkflow`)
**Proposito**: Executa outros workflows n8n como sub-rotinas.

**Caracteristicas**:
- Chamada a workflows externos
- Schema de input com `$fromAI()`
- Retorno do output do workflow
- Parametros mapeados automaticamente

### 2.4 MCP Client Tool (`@n8n/n8n-nodes-langchain.mcpClientTool`)
**Proposito**: Integracao via Model Context Protocol para servicos externos.

**Caracteristicas**:
- Conexao via Server-Sent Events (SSE)
- Timeout configuravel
- Retry automatico
- Integracao com servicos de IA externos

---

## 3. MAPA DE RELACIONAMENTOS

```
+-----------------------------------------------------------------------------------+
|                         AGENTE LANGCHAIN (AI Agent)                               |
|                                                                                   |
|   O agente decide qual tool usar baseado na descricao e contexto da conversa      |
+-----------------------------------------------------------------------------------+
                                      |
          +---------------------------+---------------------------+
          |                           |                           |
          v                           v                           v
+-------------------+       +-------------------+       +-------------------+
|   TOOL HTTP       |       |   TOOL THINK      |       |   TOOL WORKFLOW   |
|   REQUEST         |       |                   |       |                   |
+-------------------+       +-------------------+       +-------------------+
| Adicionar_tag_    |       | Think1            |       | Busca_disponib.   |
| perdido           |       | (Raciocinio       |       | Agendar_reuniao   |
| (API GHL PUT)     |       |  interno)         |       | Atualizar Work P. |
+-------------------+       +-------------------+       | Atualizar Prof.   |
          |                           |                 | Atualizar Estado  |
          v                           v                 +-------------------+
+-------------------+       +-------------------+                 |
| GHL Contacts API  |       | Contexto privado  |                 v
| /contacts/{id}    |       | para decisoes     |       +-------------------+
+-------------------+       +-------------------+       | Sub-Workflows:    |
                                                        | - Busca Disponi.  |
+-------------------+                                   | - Agendar GHL     |
|   MCP CLIENT      |                                   | - Atualizar WP    |
|   TOOL            |                                   | - Atualizar Prof. |
+-------------------+                                   | - Atualizar Est.  |
| Busca historias   |                                   +-------------------+
| (SSE Endpoint)    |
+-------------------+
          |
          v
+-------------------+
| n8n MCP Server    |
| /mcp/busca_hist   |
+-------------------+
```

### Fluxo de Decisao do Agente

```
1. MENSAGEM DO LEAD
        |
        v
2. AGENTE ANALISA CONTEXTO
        |
        +---> Lead desqualificado? ---> Adicionar_tag_perdido (HTTP)
        |
        +---> Precisa pensar? -------> Think1 (interno)
        |
        +---> Buscar horarios? ------> Busca_disponibilidade (Workflow)
        |
        +---> Agendar reuniao? ------> Agendar_reuniao (Workflow)
        |
        +---> Atualizar dados? ------> Atualizar_* (Workflow)
        |
        +---> Buscar historias? -----> Busca_historias (MCP)
        |
        v
3. RESPOSTA AO LEAD
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 TOOL HTTP REQUEST

#### 4.1.1 No: "Adicionar_tag_perdido"
**ID:** `5300e392-d22d-4bb0-aae6-97899a3352be`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolHttpRequest` |
| **Versao** | 1.1 |
| **Posicao** | [5840, 608] |

**Descricao da Tool (visivel ao agente):**
```
Adicionar tag 'perdido'. Use quando o lead se enquadrar em qualquer situacao:
ja cadastrado, e agente, mora no Brasil, sem interesse, ou esta insatisfeito.
Motivo da desqualificacao deve ser especificado.
```

**Configuracao HTTP:**

| Parametro | Valor |
|-----------|-------|
| **Metodo** | PUT |
| **URL** | `https://services.leadconnectorhq.com/contacts/{contact_Id}` |
| **Send Headers** | Sim |
| **Send Body** | Sim |
| **Body Type** | JSON |

**Headers:**
```json
{
  "Authorization": "Bearer {{ $('Info').first().json.api_key }}",
  "Version": "2021-04-15"
}
```

**Body JSON:**
```json
{
  "tags": ["perdido"]
}
```

**Schema de Input (Placeholders):**

| Parametro | Tipo | Descricao | Obrigatorio |
|-----------|------|-----------|-------------|
| `contact_Id` | string | ID do contato | Sim |

**Como o Agente Invoca:**
```
Quando o agente identifica que o lead deve ser desqualificado, ele:
1. Extrai o contact_Id do contexto
2. Chama a API GHL para adicionar a tag "perdido"
3. Recebe confirmacao da atualizacao
```

**Endpoint GHL Chamado:**
```
PUT https://services.leadconnectorhq.com/contacts/{contact_Id}
```

**Credenciais:**
- API Key dinamica via `$('Info').first().json.api_key`

**Error Handling:**
- Retry padrao do n8n se falhar

**Casos de Uso:**
1. Lead ja e cadastrado como cliente
2. Lead e agente imobiliario (concorrente)
3. Lead mora no Brasil (fora do mercado EUA)
4. Lead sem interesse no servico
5. Lead insatisfeito/reclamacao

---

### 4.2 TOOL THINK

#### 4.2.1 No: "Think1"
**ID:** `9975017f-a829-4351-8d6e-2db072067674`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolThink` |
| **Versao** | 1 |
| **Posicao** | [5968, 608] |

**Descricao da Tool:**
```
Uma ferramenta de raciocinio interno para agentes de IA no n8n.
Use-a para estruturar pensamentos, logica e instrucoes ocultas que ajudam
o modelo a chegar em uma resposta final.
O conteudo definido aqui nao e mostrado ao usuario final - serve apenas
como contexto privado para guiar a geracao de saida.
```

**Schema de Input:**
Nenhum parametro de entrada - o agente usa para processar internamente.

**Schema de Output:**
Nenhum output visivel - conteudo privado.

**Como o Agente Invoca:**
```
O agente pode usar Think1 para:
1. Organizar raciocinio antes de responder
2. Processar logica complexa
3. Revisar decisoes antes de executar
4. Manter notas internas sobre a conversa
```

**Proposito:**
- Chain of Thought (CoT) privado
- Estruturacao de logica de decisao
- Guardrails internos
- Notas de contexto

**Error Handling:**
- N/A - ferramenta de raciocinio nao gera erros

---

### 4.3 TOOL WORKFLOW

#### 4.3.1 No: "Busca_disponibilidade"
**ID:** `08955562-d895-4f09-a959-18b6c3bfef00`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| **Versao** | 2.2 |
| **Posicao** | [6096, 608] |

**Descricao da Tool:**
```
Buscar/consultar por horarios disponiveis antes de agendar.
Exemplo: startDate=1735689600000 endDate=1736294400000.
calendario pode ser consultoria financeira ou carreira.
E dateEndTo e dateStartFrom e a data de inicio e fim, geralmente entre hoje e 7 dias.
Garanta que vai buscar slots disponiveis a partir do ano 2025.
```

**Workflow Chamado:**

| Atributo | Valor |
|----------|-------|
| **Workflow ID** | `pZIcRI1PGMzbQHZZ` |
| **Nome** | `[ GHL ] Busca Disponibilidade` |
| **URL** | `/workflow/pZIcRI1PGMzbQHZZ` |

**Schema de Input:**

| Parametro | Tipo | Descricao | fromAI Hint | Obrigatorio |
|-----------|------|-----------|-------------|-------------|
| `calendar` | string | ID do calendario | Buscar horarios disponiveis. IMPORTANTE: O parametro 'calendar' deve ser o ID do calendario (ex: LvZWMISiyYnF8p7TrY7q), NAO o nome. Consulte o CONTEXTO para obter calendarID_carreira ou calendarID_consultoria conforme work permit do lead. | Nao |
| `API_KEY` | string | Chave de API | - | Nao |
| `startDate` | string | Data inicio (timestamp) | exemplo: 1735689600000 | Nao |
| `endDate` | string | Data fim (timestamp) | exemplo: 1736294400000 | Nao |
| `lead_id` | string | ID do lead | exemplo: 23533559 | Nao |
| `usuario_responsavel` | string | Usuario responsavel | - | Nao |

**Schema de Output:**
Slots disponiveis retornados pelo workflow.

**Como o Agente Invoca:**
```javascript
// O agente extrai automaticamente via $fromAI():
$fromAI('calendar', 'Buscar horarios disponiveis. IMPORTANTE...', 'string')
$fromAI('startDate', 'exemplo: 1735689600000', 'string')
$fromAI('endDate', 'exemplo: 1736294400000', 'string')
$fromAI('lead_id', 'exemplo: 23533559', 'string')
```

**Notas Importantes:**
1. O parametro `calendar` deve ser o ID do calendario, NAO o nome
2. Datas sao em formato timestamp (milliseconds)
3. Buscar slots a partir de 2025
4. Periodo recomendado: hoje + 7 dias

---

#### 4.3.2 No: "Agendar_reuniao"
**ID:** `8f08715b-91f8-416d-bbaa-75e2636d1a6c`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| **Versao** | 2.2 |
| **Posicao** | [6224, 608] |

**Descricao da Tool:**
```
Agendar um nova reuniao. startTime segue o seguinte padrao 2021-06-23T03:30:00+05:30.
```

**Workflow Chamado:**

| Atributo | Valor |
|----------|-------|
| **Workflow ID** | `u1UsmjNNpaEiwIsp` |
| **Nome** | `Agendar pelo GHL - ATUALIZAR KOMMO` |
| **URL** | `/workflow/u1UsmjNNpaEiwIsp` |

**Schema de Input:**

| Parametro | Tipo | Descricao | fromAI Hint | Obrigatorio |
|-----------|------|-----------|-------------|-------------|
| `API_KEY` | string | Chave de API | - | Nao |
| `email` | string | Email do lead | - | Nao |
| `telefone` | string | Telefone do lead | - | Nao |
| `location_id` | string | ID da location GHL | - | Nao |
| `calendar_id` | string | ID do calendario | IMPORTANTE: O parametro 'calendar' deve ser o ID do calendario (ex: LvZWMISiyYnF8p7TrY7q), NAO o nome. Consulte o CONTEXTO para obter calendarID_carreira ou calendarID_consultoria conforme work permit do lead. | Nao |
| `startTime` | string | Data/hora inicio | Formato: 2021-06-23T03:30:00+05:30 | Nao |
| `firstName` | string | Primeiro nome | - | Nao |
| `lastName` | string | Sobrenome | - | Nao |
| `lead_id` | string | ID do lead | - | Nao |
| `Carreira_Consultoria` | string | Tipo do agendamento | Especificar o tipo do agendamento | Nao |
| `usuario_responsavel` | string | Usuario responsavel | - | Nao |

**Campos Removidos (deprecated):**
- `estadoValue` - removido
- `workPermitValue` - removido

**Schema de Output:**
Confirmacao do agendamento criado.

**Como o Agente Invoca:**
```javascript
// O agente extrai automaticamente via $fromAI():
$fromAI('startTime', '', 'string')  // 2021-06-23T03:30:00+05:30
$fromAI('calendar_id', 'Buscar horarios disponiveis...', 'string')
$fromAI('Carreira_Consultoria', 'Especificar o tipo do agendamento', 'string')
```

**Notas Importantes:**
1. Formato de startTime: ISO 8601 com timezone
2. Integra com sistema Kommo (CRM)
3. Tipo pode ser "Carreira" ou "Consultoria"

---

#### 4.3.3 No: "Atualizar Work Permit"
**ID:** `3cfa78ca-068b-466b-a0c9-744c2eb3d111`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| **Versao** | 2.2 |
| **Posicao** | [6352, 608] |

**Descricao da Tool:**
```
Atualizar o estado onde o lead mora (estado_onde_mora).
Use esta tool quando o lead informar em qual estado dos EUA ele reside.
Valores aceitos: nomes dos estados americanos (ex: Florida, California, Texas, New York, etc).
Campo ID customizado no GHL.
```

**Nota:** A descricao menciona "estado onde mora" mas o nome e "Work Permit" - parece haver inconsistencia.

**Workflow Chamado:**

| Atributo | Valor |
|----------|-------|
| **Workflow ID** | `3Dd8d5AnpD4iLPwG` |
| **Nome** | `Atualizar Work Permit GHL (Otimizado)` |
| **URL** | `/workflow/3Dd8d5AnpD4iLPwG` |

**Schema de Input:**

| Parametro | Tipo | Descricao | Obrigatorio |
|-----------|------|-----------|-------------|
| `location_id` | string | ID da location GHL | Nao |
| `API_KEY` | string | Chave de API | Nao |
| `contact_id` | string | ID do contato | Nao |
| `workPermitValue` | string | Valor do Work Permit | Nao |

**Como o Agente Invoca:**
```javascript
$fromAI('workPermitValue', '', 'string')
$fromAI('contact_id', '', 'string')
```

**Casos de Uso:**
- Lead informa status de autorizacao de trabalho nos EUA
- Valores tipicos: "Sim", "Nao", "Em processo", etc.

---

#### 4.3.4 No: "Atualizar Profissao"
**ID:** `cf78c90c-dc4a-4b70-99b2-bb600309bb6f`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| **Versao** | 2.2 |
| **Posicao** | [6480, 608] |

**Descricao da Tool:**
```
Atualizar a profissao/ocupacao do lead (contact.profissao).
Use esta tool quando o lead informar qual e sua profissao ou area de atuacao atual.
Valores: texto livre com a profissao (ex: Engenheiro, Medico, Empresario, Corretor de Imoveis, etc).
Campo ID customizado no GHL.
```

**Workflow Chamado:**

| Atributo | Valor |
|----------|-------|
| **Workflow ID** | `Kq3b79P6v4rTsiaH` |
| **Nome** | `Atualizar Campo Profissao GHL (Auto-Config)` |
| **URL** | `/workflow/Kq3b79P6v4rTsiaH` |

**Schema de Input:**

| Parametro | Tipo | Descricao | Obrigatorio |
|-----------|------|-----------|-------------|
| `API_KEY` | string | Chave de API | Nao |
| `location_id` | string | ID da location GHL | Nao |
| `contact_id` | string | ID do contato | Nao |
| `profissaoValue` | string | Profissao do lead | Nao |

**Como o Agente Invoca:**
```javascript
$fromAI('profissaoValue', '', 'string')
$fromAI('contact_id', '', 'string')
```

**Exemplos de Valores:**
- Engenheiro
- Medico
- Empresario
- Corretor de Imoveis
- Advogado
- Professor
- Autonomo

---

#### 4.3.5 No: "Atualizar Estado"
**ID:** `51bd7052-50e4-4537-a9b4-77d160743ea6`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| **Versao** | 2.2 |
| **Posicao** | [6608, 608] |

**Descricao da Tool:**
```
Atualizar o estado onde o lead mora (estado_onde_mora).
Use esta tool quando o lead informar em qual estado dos EUA ele reside.
Valores aceitos: nomes dos estados americanos (ex: Florida, California, Texas, New York, etc).
Campo ID customizado no GHL.
```

**Workflow Chamado:**

| Atributo | Valor |
|----------|-------|
| **Workflow ID** | `wsQQYmx8CLNBHoWq` |
| **Nome** | `Atualizar Estado GHL (Otimizado)` |
| **URL** | `/workflow/wsQQYmx8CLNBHoWq` |

**Schema de Input:**

| Parametro | Tipo | Descricao | Obrigatorio |
|-----------|------|-----------|-------------|
| `API_KEY` | string | Chave de API | Nao |
| `estadoValue` | string | Estado dos EUA | Nao |
| `contact_id` | string | ID do contato | Nao |
| `location_id` | string | ID da location GHL | Nao |

**Como o Agente Invoca:**
```javascript
$fromAI('estadoValue', '', 'string')
$fromAI('contact_id', '', 'string')
```

**Valores Aceitos (50 estados + DC):**
- Florida
- California
- Texas
- New York
- New Jersey
- Massachusetts
- Illinois
- Georgia
- Pennsylvania
- ... (todos os estados dos EUA)

---

### 4.4 MCP CLIENT TOOL

#### 4.4.1 No: "Busca historias"
**ID:** `339a6530-f97d-4798-a6df-fb950b33f2d9`

| Atributo | Valor |
|----------|-------|
| **Tipo** | `@n8n/n8n-nodes-langchain.mcpClientTool` |
| **Versao** | 1 |
| **Posicao** | [6736, 608] |

**Configuracao MCP:**

| Parametro | Valor |
|-----------|-------|
| **SSE Endpoint** | `https://cliente-a1.mentorfy.io/mcp/busca_historias/sse` |
| **Timeout** | 60000 ms (1 minuto) |
| **Retry on Fail** | Sim |
| **Wait Between Tries** | 3000 ms (3 segundos) |

**O que e MCP (Model Context Protocol):**
MCP e um protocolo padronizado para integracao de modelos de IA com servicos externos. Permite:
- Comunicacao em tempo real via SSE (Server-Sent Events)
- Ferramentas dinamicas expostas pelo servidor
- Contexto compartilhado entre cliente e servidor

**Schema de Input:**
Definido pelo servidor MCP - parametros dinamicos.

**Schema de Output:**
Historias/casos de sucesso retornados pelo servidor.

**Como o Agente Invoca:**
O agente envia uma requisicao ao endpoint SSE e recebe historias relevantes para usar na conversa.

**Proposito:**
- Buscar historias de sucesso de clientes
- Prover exemplos concretos ao lead
- Social proof automatizado
- Personalizacao baseada em casos similares

**Endpoint:**
```
SSE: https://cliente-a1.mentorfy.io/mcp/busca_historias/sse
```

**Error Handling:**
- Retry automatico apos 3 segundos
- Timeout de 60 segundos

---

## 5. INTEGRACAO COM AGENTES

### 5.1 Como as Tools sao Expostas ao Agente

```
+-------------------------------------------------------------------+
|                         AI AGENT NODE                              |
|                                                                    |
|   prompt: "Voce e um SDR da Mottivme..."                          |
|                                                                    |
|   tools: [                                                         |
|     Adicionar_tag_perdido,                                        |
|     Think1,                                                        |
|     Busca_disponibilidade,                                        |
|     Agendar_reuniao,                                              |
|     Atualizar Work Permit,                                        |
|     Atualizar Profissao,                                          |
|     Atualizar Estado,                                             |
|     Busca historias                                               |
|   ]                                                                |
+-------------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------------+
|                    LANGCHAIN TOOL BINDING                          |
|                                                                    |
|   Cada tool e convertida em uma "function" que o LLM pode chamar  |
|   baseado na descricao e schema de input                          |
+-------------------------------------------------------------------+
```

### 5.2 Fluxo de Execucao de uma Tool

```
1. USUARIO ENVIA MENSAGEM
   "Quero agendar uma reuniao para quinta-feira"
        |
        v
2. AGENTE PROCESSA MENSAGEM
   - Analisa contexto
   - Consulta tools disponiveis
   - Decide usar: Busca_disponibilidade + Agendar_reuniao
        |
        v
3. EXTRAI PARAMETROS VIA $fromAI()
   - calendar: "LvZWMISiyYnF8p7TrY7q" (do contexto)
   - startDate: 1735689600000 (quinta-feira)
   - endDate: 1735776000000 (quinta-feira fim)
        |
        v
4. EXECUTA BUSCA_DISPONIBILIDADE
   - Chama workflow pZIcRI1PGMzbQHZZ
   - Recebe slots disponiveis
        |
        v
5. APRESENTA OPCOES AO LEAD
   "Tenho os seguintes horarios disponiveis: 10h, 14h, 16h"
        |
        v
6. USUARIO ESCOLHE
   "Quero as 14h"
        |
        v
7. EXECUTA AGENDAR_REUNIAO
   - Chama workflow u1UsmjNNpaEiwIsp
   - Confirma agendamento
        |
        v
8. CONFIRMA AO USUARIO
   "Perfeito! Sua reuniao esta agendada para quinta as 14h"
```

### 5.3 Parametros Comuns entre Tools

Varios parametros sao reutilizados entre as tools:

| Parametro | Tools que Usam | Origem Tipica |
|-----------|----------------|---------------|
| `API_KEY` | Todas as Tool Workflow | `$('Info').first().json.api_key` |
| `location_id` | Agendar, Atualizar* | `$('Info').first().json.location_id` |
| `contact_id` | Adicionar_tag, Atualizar* | `$('Info').first().json.contact_id` |
| `lead_id` | Busca, Agendar | `$('Info').first().json.lead_id` |

### 5.4 Hierarquia de Decisao do Agente

```
PRIORIDADE ALTA (Executar imediatamente):
+-- Adicionar_tag_perdido (desqualificacao)
+-- Busca_disponibilidade (preparacao para agendar)
+-- Agendar_reuniao (fechamento)

PRIORIDADE MEDIA (Durante qualificacao):
+-- Atualizar Estado (dados do lead)
+-- Atualizar Profissao (dados do lead)
+-- Atualizar Work Permit (dados do lead)

PRIORIDADE BAIXA (Suporte a conversa):
+-- Think1 (raciocinio interno)
+-- Busca historias (social proof)
```

---

## 6. REFERENCIA RAPIDA

### 6.1 Tabela de Todas as Tools

| Nome | Tipo | ID | Workflow/Endpoint |
|------|------|-----|-------------------|
| Adicionar_tag_perdido | HTTP Request | `5300e392-d22d-4bb0-aae6-97899a3352be` | `PUT /contacts/{id}` |
| Think1 | Think | `9975017f-a829-4351-8d6e-2db072067674` | N/A |
| Busca_disponibilidade | Workflow | `08955562-d895-4f09-a959-18b6c3bfef00` | `pZIcRI1PGMzbQHZZ` |
| Agendar_reuniao | Workflow | `8f08715b-91f8-416d-bbaa-75e2636d1a6c` | `u1UsmjNNpaEiwIsp` |
| Atualizar Work Permit | Workflow | `3cfa78ca-068b-466b-a0c9-744c2eb3d111` | `3Dd8d5AnpD4iLPwG` |
| Atualizar Profissao | Workflow | `cf78c90c-dc4a-4b70-99b2-bb600309bb6f` | `Kq3b79P6v4rTsiaH` |
| Atualizar Estado | Workflow | `51bd7052-50e4-4537-a9b4-77d160743ea6` | `wsQQYmx8CLNBHoWq` |
| Busca historias | MCP Client | `339a6530-f97d-4798-a6df-fb950b33f2d9` | `mentorfy.io/mcp/busca_historias` |

### 6.2 Tabela de Workflows Externos

| Workflow ID | Nome | Proposito |
|-------------|------|-----------|
| `pZIcRI1PGMzbQHZZ` | [ GHL ] Busca Disponibilidade | Consultar slots de calendario |
| `u1UsmjNNpaEiwIsp` | Agendar pelo GHL - ATUALIZAR KOMMO | Criar agendamento + sync Kommo |
| `3Dd8d5AnpD4iLPwG` | Atualizar Work Permit GHL (Otimizado) | Atualizar campo work permit |
| `Kq3b79P6v4rTsiaH` | Atualizar Campo Profissao GHL (Auto-Config) | Atualizar campo profissao |
| `wsQQYmx8CLNBHoWq` | Atualizar Estado GHL (Otimizado) | Atualizar campo estado |

### 6.3 Tabela de Endpoints Externos

| Servico | Endpoint | Metodo | Proposito |
|---------|----------|--------|-----------|
| GHL API | `https://services.leadconnectorhq.com/contacts/{id}` | PUT | Atualizar contato (tags) |
| MCP Server | `https://cliente-a1.mentorfy.io/mcp/busca_historias/sse` | SSE | Buscar historias |

### 6.4 Configuracoes de Resiliencia

| No | Retry | Wait | Timeout | On Error |
|----|-------|------|---------|----------|
| Adicionar_tag_perdido | Padrao | - | - | - |
| Think1 | - | - | - | - |
| Busca_disponibilidade | - | - | - | - |
| Agendar_reuniao | - | - | - | - |
| Atualizar Work Permit | - | - | - | - |
| Atualizar Profissao | - | - | - | - |
| Atualizar Estado | - | - | - | - |
| Busca historias | Sim | 3000ms | 60000ms | - |

### 6.5 Mapeamento de Campos GHL

| Campo no Fluxo | Campo GHL | Tipo Campo GHL |
|----------------|-----------|----------------|
| `tags` | contact.tags | Array |
| `estadoValue` | contact.estado_onde_mora | Custom Field |
| `profissaoValue` | contact.profissao | Custom Field |
| `workPermitValue` | contact.work_permit | Custom Field |

---

## 7. CONSIDERACOES PARA ESCALAR

### 7.1 Pontos de Atencao

1. **Descricao Inconsistente** em "Atualizar Work Permit"
   - Descricao menciona "estado onde mora"
   - Nome da tool e "Work Permit"
   - Revisar para clareza

2. **Calendarios por ID**
   - O agente precisa mapear nome do calendario para ID
   - IDs devem estar no CONTEXTO do agente
   - Risco de erro se IDs mudarem

3. **Formato de Data**
   - Busca_disponibilidade: timestamp em milliseconds
   - Agendar_reuniao: ISO 8601 com timezone
   - Inconsistencia pode causar erros

4. **MCP Timeout**
   - 60 segundos e longo para UX
   - Considerar fallback se timeout

### 7.2 Recomendacoes

1. **Padronizar Formatos de Data**
   - Usar ISO 8601 em todas as tools
   - Converter no workflow se necessario

2. **Centralizar Mapeamentos**
   - Criar lookup table para calendar_id
   - Evitar hardcode no agente

3. **Adicionar Validacao**
   - Validar estados dos EUA
   - Validar formato de telefone/email

4. **Implementar Fallbacks**
   - Se MCP falhar, usar resposta generica
   - Se workflow falhar, notificar humano

### 7.3 Novas Tools Sugeridas

| Tool | Proposito | Prioridade |
|------|-----------|------------|
| Cancelar_reuniao | Cancelar agendamento existente | Alta |
| Reagendar_reuniao | Alterar data/hora de agendamento | Alta |
| Buscar_agendamentos | Listar agendamentos do lead | Media |
| Transferir_humano | Escalar para atendimento humano | Alta |
| Enviar_material | Enviar PDF/link informativo | Media |

---

## CHANGELOG

| Data | Versao | Descricao |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentacao inicial completa |

---

*Documento gerado para escalabilidade da operacao BPO Mottivme Sales - Fluxo GHL Principal*
