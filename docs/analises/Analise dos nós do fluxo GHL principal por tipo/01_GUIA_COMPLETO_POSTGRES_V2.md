# GUIA COMPLETO DOS NOS POSTGRES - FLUXO GHL MOTTIVME SALES V2

## INDICE
1. [Visao Geral](#1-visao-geral)
2. [Tabelas Utilizadas](#2-tabelas-utilizadas)
3. [Mapa de Relacionamentos](#3-mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#4-detalhamento-por-categoria)
5. [Fluxo de Dados](#5-fluxo-de-dados)
6. [Referencia Rapida](#6-referencia-rapida)
7. [Consideracoes para Escalar](#7-consideracoes-para-escalar)

---

## 1. VISAO GERAL

### Resumo Executivo
O fluxo GHL Mottivme Sales V2 utiliza **20 nos Postgres** organizados em **7 categorias funcionais**:

| Categoria | Quantidade | Proposito |
|-----------|------------|-----------|
| Fila de Mensagens | 3 | Gerenciar buffer de mensagens recebidas |
| Conversa Ativa | 6 | Controlar estado das conversas em andamento |
| Historico/Memoria | 5 | Persistir contexto e historico de mensagens |
| Agendamento/Tracking | 2 | Rastrear atividades agendadas |
| Metricas | 1 | Registrar metricas de execucao |
| Configuracao | 1 | Buscar configuracoes dinamicas de agentes |
| Limpeza/Reset | 2 | Reset de dados e limpeza de memoria |

### Conexoes Utilizadas
```
Credencial Principal: "Postgres Marcos Daniels."
ID: w2mBaRwhZ3tM4FUw
Utilizacao: 19 nos

Credencial Secundaria: "Postgres account"
ID: B0fAAM3acruSSuiz
Utilizacao: 1 no (Salvar Inicio IA)
```

### Versao do TypeVersion
- **Predominante:** 2.6 (19 nos)
- **Excecao:** 2.5 (Buscar Agente Ativo)

---

## 2. TABELAS UTILIZADAS

### 2.1 `n8n_fila_mensagens`
**Proposito:** Buffer temporario para acumular mensagens antes do processamento pela IA

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | number | Nao (auto) | Identificador unico autoincremental |
| `id_mensagem` | string | Sim | ID da mensagem original (GHL) |
| `mensagem` | string | Sim | Conteudo da mensagem |
| `timestamp` | dateTime | Nao | Data/hora da mensagem |
| `lead_id` | string | Nao | ID do lead no GHL |
| `telefone` | string | Nao | (Campo removido/nao utilizado) |
| `instagram` | string | Nao | (Campo removido/nao utilizado) |

**Nos que utilizam:** Enfileirar mensagem., Buscar mensagens, Limpar fila de mensagens

---

### 2.2 `n8n_active_conversation`
**Proposito:** Controlar o estado das conversas ativas com a IA

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | number | Nao | Identificador unico (pode ser process_id) |
| `lead_id` | string | Nao | ID do lead no GHL |
| `lead_name` | string | Nao | Nome do lead |
| `status` | string | Nao | Estado: "active" ou "inactive" |
| `owner_id` | string | Nao | ID do dono/responsavel |
| `workflow_id` | string | Sim | ID do workflow n8n |
| `waiting_process_id` | string | Nao | ID do processo aguardando resposta |
| `retries` | number | Nao | Contador de tentativas |
| `output_preview` | string | Nao | Preview da resposta da IA |
| `created_at` | dateTime | Nao | Data de criacao |

**Nos que utilizam:** Conversa Ativa, Salvar Inicio IA, Salvar Espera, Atualizar resposta IA, Conversa ativa atualizada, Termino de resposta

---

### 2.3 `n8n_historico_mensagens`
**Proposito:** Memoria de longo prazo da IA (historico de conversas)

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `id` | number | Nao (auto) | Identificador unico autoincremental |
| `session_id` | string | Sim | ID da sessao (geralmente lead_id) |
| `message` | object (JSONB) | Sim | Objeto com a mensagem estruturada |
| `message_hash` | string | Nao | Hash para deduplicacao |
| `created_at` | dateTime | Nao | Data de criacao |

**Estrutura do campo `message` (JSONB):**
```json
{
  "type": "ai" | "human",
  "content": "conteudo da mensagem",
  "tool_calls": [],
  "additional_kwargs": {},
  "response_metadata": {},
  "invalid_tool_calls": []
}
```

**Nos que utilizam:** Memoria Lead, Memoria IA, Mensagem anteriores, Limpar memoria, Limpar fila de mensagens1, Resetar status atendimento

---

### 2.4 `crm_historico_mensagens`
**Proposito:** Log permanente de todas as mensagens trocadas para CRM

| Coluna | Tipo | Obrigatorio | Descricao |
|--------|------|-------------|-----------|
| `lead_id` | string | Sim | ID do lead |
| `mensagem` | string | Sim | Conteudo da mensagem |
| `datetime` | string | Sim | Data/hora |
| `source` | string | Sim | Origem (inbound/outbound) |
| `full_name` | string | Sim | Nome completo do lead |

**Constraint:** `UNIQUE (lead_id, mensagem, datetime)` - Evita duplicatas

**Nos que utilizam:** historico_mensagens_leads

---

### 2.5 `n8n_schedule_tracking`
**Proposito:** Rastreamento de atividades agendadas - Ambiente Alan

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `field` | string | Tipo de campo/acao |
| `value` | string | Valor associado |
| `execution_id` | string | ID da execucao |
| `unique_id` | string | ID unico (chave de conflito) |
| `ativo` | boolean | Se esta ativo |
| `chat_id` | string | ID do chat |

**Constraint:** `UNIQUE (unique_id)` - Usado para UPSERT

**Nos que utilizam:** Salvar registro de Atividade - alan

---

### 2.6 `ops_schedule_tracking`
**Proposito:** Rastreamento de atividades agendadas - Ambiente Marcos/OPS

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `field` | string | Tipo de campo/acao |
| `value` | string | Valor associado |
| `execution_id` | string | ID da execucao |
| `unique_id` | string | ID unico (chave de conflito) |
| `ativo` | boolean | Se esta ativo |
| `chat_id` | string | ID do chat |
| `api_key` | string | Chave de API |
| `location_id` | string | ID da location GHL |
| `source` | string | Origem do registro |

**Constraint:** `UNIQUE (unique_id)` - Usado para UPSERT

**Nos que utilizam:** Salvar registro de Atividade - marcos

---

### 2.7 `execution_metrics`
**Proposito:** Metricas de execucao do workflow

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `execution_id` | string | ID da execucao |
| `workflow_id` | string | ID do workflow |
| `workflow_name` | string | Nome do workflow |
| `workflow_version` | string | Versao |
| `n8n_version` | string | Versao do n8n |
| `environment` | string | Ambiente (prod/dev) |
| `status` | string | Status da execucao |
| `started_at` | dateTime | Inicio (usa NOW()) |
| `owner_id` | string | ID do dono |

**Nos que utilizam:** Postgres (metricas)

---

### 2.8 `agent_versions` + `locations` (JOIN)
**Proposito:** Buscar configuracao do agente ativo por location

| Tabela | Coluna | Tipo | Descricao |
|--------|--------|------|-----------|
| agent_versions | `location_id` | string | ID da location GHL |
| agent_versions | `is_active` | boolean | Se versao esta ativa |
| agent_versions | `status` | string | Status ("active") |
| agent_versions | `activated_at` | dateTime | Data de ativacao |
| locations | `api_key` | string | Chave da location (via JOIN) |

**Nos que utilizam:** Buscar Agente Ativo

---

## 3. MAPA DE RELACIONAMENTOS

```
+------------------------------------------------------------------------------+
|                        FLUXO DE DADOS - POSTGRES V2                          |
+------------------------------------------------------------------------------+

ENTRADA DE MENSAGEM (Webhook GHL)
        |
        v
+---------------------+     +---------------------------+
| historico_mensagens |     | Enfileirar mensagem.      |
| _leads              |     | (n8n_fila_mensagens)      |
| [INSERT com         |     | [INSERT]                  |
|  ON CONFLICT]       |     +------------+--------------+
+---------------------+                  |
        |                                v
        |                  +---------------------------+
        |                  | Buscar mensagens          |
        |                  | (n8n_fila_mensagens)      |
        |                  | [SELECT WHERE lead_id     |
        |                  |  ORDER BY timestamp ASC]  |
        |                  +------------+--------------+
        |                               |
        |                               v
        |                  +---------------------------+
        |                  | Limpar fila de mensagens  |
        |                  | (n8n_fila_mensagens)      |
        |                  | [DELETE WHERE lead_id]    |
        |                  +------------+--------------+
        |                               |
        v                               v
+---------------------+   +---------------------------+
| Salvar registro     |   | Conversa Ativa            |
| de Atividade        |   | (n8n_active_conversation) |
| [UPSERT x2]         |   | [SELECT WHERE lead_id     |
| - alan              |   |  AND workflow_id]         |
| - marcos            |   +------------+--------------+
+---------------------+                |
        |                              |
        v               +--------------+---------------+
+---------------------+ |              |               |
| Postgres (metricas) | v              v               v
| [INSERT]            | +-----------+ +-----------+ +-------------------+
+---------------------+ |Salvar     | |Salvar     | | Mensagem          |
                        |Inicio IA  | |Espera     | | anteriores        |
                        |[UPSERT    | |[UPSERT    | | [SELECT WHERE     |
                        | status=   | | retries   | |  session_id       |
                        | active]   | | ++]       | |  ORDER BY         |
                        +-----------+ +-----------+ |  created_at ASC]  |
                              |                     +--------+----------+
                              |                              |
                              v                              v
                        +-----------+             +-------------------+
                        | Buscar    |             | Memoria Lead      |
                        | Agente    |             | [INSERT]          |
                        | Ativo     |             +-------------------+
                        | [SELECT   |                     |
                        |  JOIN]    |                     v
                        +-----------+             +-------------------+
                              |                   | Memoria IA        |
                              |                   | [INSERT]          |
                              v                   +-------------------+
                    +-------------------+                |
                    | [IA PROCESSA]     |                |
                    +-------------------+                |
                              |                          |
                              v                          |
                    +-------------------+                |
                    | Atualizar         |<---------------+
                    | resposta IA       |
                    | [UPSERT status=   |
                    |  inactive]        |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | Conversa ativa    |
                    | atualizada        |
                    | [SELECT]          |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | Termino de        |
                    | resposta          |
                    | [DELETE WHERE id] |
                    +-------------------+


FLUXO DE RESET/LIMPEZA (Branch separado)
        |
        v
+------------------------+     +---------------------------+
| Resetar status         |---->| Limpar fila de mensagens1 |
| atendimento            |     | (n8n_historico_mensagens) |
| [UPSERT vazio]         |     | [DELETE WHERE lead_id]    |
+------------------------+     +---------------------------+
        |
        v
+------------------------+
| Limpar memoria         |
| (n8n_historico_        |
| mensagens)             |
| [DELETE ALL]           |
+------------------------+
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 CATEGORIA: FILA DE MENSAGENS

#### 4.1.1 No: "Enfileirar mensagem."
**ID:** `d228bdf9-3c9e-46d4-afd2-1ab1fad665e5`

| Atributo | Valor |
|----------|-------|
| **Operacao** | INSERT |
| **Tabela** | `n8n_fila_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [1696, 400] |
| **Usa Query Customizada?** | Nao |
| **Retry on Fail** | Sim |

**Colunas Utilizadas:**
```javascript
mensagem    <- $json.mensagem
id_mensagem <- $json.mensagem_id
timestamp   <- $json.datetime
lead_id     <- $json.lead_id
```

**Schema de Colunas Completo:**
| Coluna | Tipo | Obrigatorio | Match | Display |
|--------|------|-------------|-------|---------|
| id | number | Nao | Sim (default) | Removido |
| id_mensagem | string | Sim | Nao | Sim |
| telefone | string | Nao | Nao | Removido |
| mensagem | string | Sim | Nao | Sim |
| timestamp | dateTime | Nao | Nao | Sim |
| instagram | string | Nao | Nao | Removido |
| lead_id | string | Nao | Nao | Sim |

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Quando uma nova mensagem chega via webhook, ela e enfileirada nesta tabela. Isso permite acumular multiplas mensagens do lead antes de processa-las em lote pela IA, evitando processamento individual de cada mensagem.

**Dependencias de Entrada:** No de origem com dados do webhook (Info)

---

#### 4.1.2 No: "Buscar mensagens"
**ID:** `58dd5b6d-7ffb-4940-a292-ba80a8914483`

| Atributo | Valor |
|----------|-------|
| **Operacao** | SELECT |
| **Tabela** | `n8n_fila_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2144, 400] |
| **Return All** | Sim |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |

**Filtros (WHERE):**
```sql
WHERE lead_id = $json.lead_id
```

**Ordenacao (ORDER BY):**
```sql
ORDER BY timestamp ASC
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Busca todas as mensagens enfileiradas para um lead especifico, ordenadas por tempo. Isso permite concatenar as mensagens na ordem cronologica correta antes de enviar para a IA processar.

**Configuracoes Especiais:**
- `alwaysOutputData: true` - Sempre produz output mesmo sem resultados
- `retryOnFail: true` - Retentar em caso de falha

---

#### 4.1.3 No: "Limpar fila de mensagens"
**ID:** `c6b038d8-871b-4709-bf26-8d808d29158a`

| Atributo | Valor |
|----------|-------|
| **Operacao** | DELETE (deleteTable) |
| **Tabela** | `n8n_fila_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2816, 400] |
| **Delete Command** | delete |

**Filtros (WHERE):**
```sql
WHERE lead_id = $('Info').item.json.lead_id
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Apos processar as mensagens enfileiradas, este no limpa a fila para aquele lead especifico. Isso evita reprocessamento de mensagens ja tratadas nas proximas execucoes.

**Conexao:** Saida -> "Conversa Ativa"

---

### 4.2 CATEGORIA: CONVERSA ATIVA

#### 4.2.1 No: "Conversa Ativa"
**ID:** `d8560446-bfd9-42a2-b4eb-a2925c88b0fc`

| Atributo | Valor |
|----------|-------|
| **Operacao** | SELECT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [3312, 400] |
| **Limit** | 1 |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Filtros (WHERE):**
```sql
WHERE lead_id = $('Info').item.json.lead_id
  AND workflow_id = $('Info').item.json.workflow_id
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Verifica se ja existe uma conversa ativa para este lead neste workflow. Isso e crucial para:
- Detectar se a IA ja esta processando este lead (evitar processamento paralelo)
- Recuperar o estado anterior da conversa
- Obter o ID da conversa para atualizacoes subsequentes

**Configuracoes Especiais:**
- `onError: continueRegularOutput` - Continua execucao mesmo com erro
- `alwaysOutputData: true` - Produz output vazio se nao encontrar

---

#### 4.2.2 No: "Salvar Inicio IA"
**ID:** `0cae2f0e-646d-44cb-8f34-6ba52b6d59a5`

| Atributo | Valor |
|----------|-------|
| **Operacao** | UPSERT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [4048, 384] |
| **Matching Column** | `id` |
| **Retry on Fail** | Sim |
| **Replace Empty Strings** | Sim |

**Colunas Utilizadas:**
```javascript
id                  <- $('Conversa Ativa').item.json.id || $('Info').item.json.process_id
lead_id             <- $('Info').item.json.lead_id
lead_name           <- $('Info').item.json.first_name
status              <- "active"
owner_id            <- $('Info').item.json.owner_id
workflow_id         <- $('Info').item.json.workflow_id
waiting_process_id  <- null
retries             <- 0
```

**Schema de Colunas Completo:**
| Coluna | Tipo | Obrigatorio | Match | Removido |
|--------|------|-------------|-------|----------|
| id | number | Nao | Sim (default) | Nao |
| lead_id | string | Nao | Nao | Nao |
| lead_name | string | Nao | Nao | Nao |
| status | string | Nao | Nao | Nao |
| owner_id | string | Nao | Nao | Nao |
| created_at | dateTime | Nao | Nao | Sim |
| output_preview | string | Nao | Nao | Sim |
| waiting_process_id | string | Nao | Nao | Nao |
| workflow_id | string | Sim | Nao | Nao |
| retries | number | Nao | Nao | Nao |

**Credencial (DIFERENTE!):**
```
Nome: Postgres account
ID: B0fAAM3acruSSuiz
```

**Proposito:** Marca o inicio do processamento pela IA:
- Define status como "active" para bloquear processamentos paralelos
- Reseta contadores de retry para 0
- Limpa waiting_process_id anterior (define como null)
- Garante que apenas uma execucao processe o lead por vez

**Conexao:** Saida -> "Mensagem anteriores"

**ATENCAO:** Este no usa credencial diferente dos demais!

---

#### 4.2.3 No: "Salvar Espera"
**ID:** `f89511d6-39fc-413d-ac7c-5fe9fa0bb18f`

| Atributo | Valor |
|----------|-------|
| **Operacao** | UPSERT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [3712, 560] |
| **Matching Column** | `id` |
| **Retry on Fail** | Sim |

**Colunas Utilizadas:**
```javascript
id                  <- $('Conversa Ativa').item.json.id
waiting_process_id  <- $('Info').item.json.process_id
workflow_id         <- $json.workflow_id
retries             <- $('Conversa Ativa').item.json.retries + 1
```

**Schema de Colunas Completo:**
| Coluna | Tipo | Removido | Proposito |
|--------|------|----------|-----------|
| id | number | Nao | Matching column |
| lead_id | string | Sim | - |
| lead_name | string | Sim | - |
| status | string | Sim | - |
| owner_id | string | Sim | - |
| created_at | dateTime | Sim | - |
| output_preview | string | Sim | - |
| waiting_process_id | string | Nao | ID do processo em espera |
| workflow_id | string | Nao | ID do workflow |
| retries | number | Nao | Contador incrementado |

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Quando a IA precisa aguardar mais input do usuario:
- Salva o process_id para retomar depois
- Incrementa contador de retries para controle de timeout
- Mantem a conversa em estado "ativo" mas aguardando input
- Usado no mecanismo de timeout/retry do workflow

---

#### 4.2.4 No: "Atualizar resposta IA"
**ID:** `d5c47233-8e95-493c-a144-3e3c4dd56d89`

| Atributo | Valor |
|----------|-------|
| **Operacao** | UPSERT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [8176, 224] |
| **Matching Column** | `id` |
| **Retry on Fail** | Sim |
| **Replace Empty Strings** | Sim |

**Colunas Utilizadas:**
```javascript
id             <- $('Conversa Ativa').first().json.id || $('Info').first().json.process_id
lead_id        <- $('Info').first().json.lead_id
lead_name      <- $('Info').first().json.full_name
status         <- "inactive"
owner_id       <- $('Info').first().json.owner_id
workflow_id    <- $('Info').first().json.workflow_id
output_preview <- $('Tipo de mensagem1').item.json.output
```

**Schema de Colunas Completo:**
| Coluna | Tipo | Removido | Proposito |
|--------|------|----------|-----------|
| id | number | Nao | Matching column |
| lead_id | string | Nao | ID do lead |
| lead_name | string | Nao | Nome atualizado |
| status | string | Nao | "inactive" |
| owner_id | string | Nao | ID do owner |
| created_at | dateTime | Sim | - |
| output_preview | string | Nao | Preview da resposta |
| waiting_process_id | string | Sim | - |
| workflow_id | string | Nao | ID do workflow |

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Apos a IA gerar resposta:
- Muda status para "inactive" permitindo novo processamento futuro
- Salva preview da resposta para debug/monitoramento
- Atualiza dados do lead (nome completo)
- Marca que a IA finalizou o processamento atual

---

#### 4.2.5 No: "Conversa ativa atualizada"
**ID:** `3131af47-bee4-4e87-bf03-a313cef4b730`

| Atributo | Valor |
|----------|-------|
| **Operacao** | SELECT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [7728, 368] |
| **Limit** | 1 |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Filtros (WHERE):**
```sql
WHERE lead_id = $('Info').first().json.lead_id
  AND workflow_id = $('Info').first().json.workflow_id
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Re-busca o estado da conversa apos atualizacoes para:
- Garantir sincronizacao de dados
- Obter dados atualizados para o proximo passo
- Verificar se atualizacao foi aplicada corretamente

---

#### 4.2.6 No: "Termino de resposta"
**ID:** `90a128fb-e7ae-4c56-88f3-150d149ddb80`

| Atributo | Valor |
|----------|-------|
| **Operacao** | DELETE (deleteTable) |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [8400, 464] |
| **Delete Command** | delete |
| **Retry on Fail** | Sim |

**Filtros (WHERE):**
```sql
WHERE id = $json.id
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Remove completamente o registro da conversa ativa quando:
- O atendimento foi finalizado com sucesso
- O lead foi transferido para humano
- A conversa atingiu timeout maximo
- Libera o lead para novo processamento do zero

---

### 4.3 CATEGORIA: HISTORICO E MEMORIA

#### 4.3.1 No: "Mensagem anteriores"
**ID:** `6dfe71c8-e802-4194-84aa-2bf7530f660f`

| Atributo | Valor |
|----------|-------|
| **Operacao** | SELECT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [4240, 384] |
| **Return All** | Sim |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Filtros (WHERE):**
```sql
WHERE session_id = $json.lead_id
```

**Ordenacao (ORDER BY):**
```sql
ORDER BY created_at ASC
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Recupera todo o historico de conversas com o lead para fornecer contexto a IA. Essencial para:
- Manter continuidade da conversa
- Evitar repetir perguntas ja feitas
- Contexto para tomada de decisao da IA
- Memoria de longo prazo do chatbot

---

#### 4.3.2 No: "Memoria Lead"
**ID:** `62aa871a-d0ac-4caa-b005-8f717683b45f`

| Atributo | Valor |
|----------|-------|
| **Operacao** | INSERT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [4624, 384] |
| **Retry on Fail** | Sim |
| **Execute Once** | Sim |
| **On Error** | Continue Regular Output |

**Colunas Utilizadas:**
```javascript
session_id <- $json.session_id
message    <- $json.message (objeto JSONB)
```

**Schema de Colunas Completo:**
| Coluna | Tipo | Obrigatorio | Match | Removido |
|--------|------|-------------|-------|----------|
| id | number | Nao | Sim (default) | Sim |
| session_id | string | Sim | Sim | Nao |
| message | object | Sim | Sim | Nao |
| created_at | dateTime | Nao | Sim | Sim |

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Persiste a mensagem do lead (human) no historico. O formato JSONB permite:
- Armazenar metadata estruturada
- Queries flexiveis no futuro
- Preservar formato original da mensagem

**Configuracoes Especiais:**
- `executeOnce: true` - Executa apenas uma vez por execucao do workflow

---

#### 4.3.3 No: "Memoria IA"
**ID:** `99152c83-b21e-4b37-9883-2a8a0aadf30d`

| Atributo | Valor |
|----------|-------|
| **Operacao** | INSERT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [10128, 32] |
| **Retry on Fail** | Sim |
| **Execute Once** | Sim |
| **On Error** | Continue Regular Output |

**Colunas Utilizadas:**
```javascript
session_id <- $('Memoria Lead').first().json.session_id
message    <- {
  "type": "ai",
  "content": "$('Parser Chain').first().json.output.messages.join('')",
  "tool_calls": [],
  "additional_kwargs": {},
  "response_metadata": {},
  "invalid_tool_calls": []
}
```

**Estrutura do Message JSONB:**
```json
{
  "type": "ai",
  "content": "[resposta concatenada da IA]",
  "tool_calls": [],
  "additional_kwargs": {},
  "response_metadata": {},
  "invalid_tool_calls": []
}
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Persiste a resposta da IA no historico para:
- Manter registro completo da conversa
- Alimentar contexto em proximas interacoes
- Auditoria e analise de conversas

---

#### 4.3.4 No: "historico_mensagens_leads"
**ID:** `0d08ba2d-a159-4f3e-b2d6-84b77eebf9db`

| Atributo | Valor |
|----------|-------|
| **Operacao** | Execute Query |
| **Tabela** | `crm_historico_mensagens` |
| **TypeVersion** | 2.6 |
| **Posicao** | [1824, -224] |
| **Always Output Data** | Sim |
| **Retry on Fail** | Nao |
| **Execute Once** | Nao |
| **On Error** | Continue Regular Output |

**Query Customizada:**
```sql
INSERT INTO public.crm_historico_mensagens
(lead_id, mensagem, datetime, source, full_name)
VALUES
('{{ $json.lead_id }}', '{{ $json.mensagem }}', '{{ $json.datetime }}',
 '{{ $json.source }}', '{{ $json.full_name }}')
ON CONFLICT (lead_id, mensagem, datetime)
DO NOTHING
RETURNING *;
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Log permanente de todas as mensagens para CRM:
- Auditoria completa
- Relatorios de atendimento
- Analise de conversas
- Backup de dados
- Integracao com CRM externo

**Nota:** Usa `ON CONFLICT DO NOTHING` para evitar duplicatas sem gerar erro.

---

#### 4.3.5 No: "Limpar memoria"
**ID:** `03958c2b-30d7-414d-80b3-a4c8285000f4`

| Atributo | Valor |
|----------|-------|
| **Operacao** | DELETE (deleteTable) |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [1904, -528] |
| **Delete Command** | truncate (DELETE ALL) |

**Sem filtros WHERE - Apaga TODA a tabela!**

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Limpa TODA a tabela de historico.

**CUIDADO:** Este no apaga TODO o historico de TODOS os leads, nao apenas de um lead especifico.

**Uso:** Apenas em cenarios de reset total, desenvolvimento ou manutencao.

---

### 4.4 CATEGORIA: AGENDAMENTO/TRACKING

#### 4.4.1 No: "Salvar registro de Atividade - alan"
**ID:** `1b01e85f-45fa-4030-a039-f0f692e98fb3`

| Atributo | Valor |
|----------|-------|
| **Operacao** | Execute Query |
| **Tabela** | `n8n_schedule_tracking` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2480, 0] |
| **On Error** | Continue Regular Output |

**Query Customizada:**
```sql
INSERT INTO n8n_schedule_tracking (
  field,
  value,
  execution_id,
  unique_id,
  ativo,
  chat_id
) VALUES (
  $1, $2, $3, $4, $5, $6
)
ON CONFLICT (unique_id) DO UPDATE
SET
  field = EXCLUDED.field,
  value = EXCLUDED.value,
  execution_id = EXCLUDED.execution_id,
  ativo = EXCLUDED.ativo,
  chat_id = EXCLUDED.chat_id;
```

**Query Replacement:**
```javascript
$json.session.split(',')
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Rastreia atividades agendadas (follow-ups, lembretes) para ambiente Alan. O UPSERT garante:
- Insercao de novos registros
- Atualizacao se ja existir (baseado em unique_id)

---

#### 4.4.2 No: "Salvar registro de Atividade - marcos"
**ID:** `082915f5-0854-4d48-a722-988fbe1bd224`

| Atributo | Valor |
|----------|-------|
| **Operacao** | Execute Query |
| **Tabela** | `ops_schedule_tracking` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2688, 0] |
| **On Error** | Continue Regular Output |

**Query Customizada:**
```sql
INSERT INTO ops_schedule_tracking (
  field, value, execution_id, unique_id, ativo, chat_id, api_key, location_id, source
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (unique_id) DO UPDATE SET
  field = EXCLUDED.field,
  value = EXCLUDED.value,
  execution_id = EXCLUDED.execution_id,
  ativo = EXCLUDED.ativo,
  chat_id = EXCLUDED.chat_id,
  api_key = EXCLUDED.api_key,
  location_id = EXCLUDED.location_id,
  source = EXCLUDED.source;
```

**Query Replacement:**
```javascript
$json.session.split(',')
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Versao estendida do tracking com campos adicionais para ambiente Marcos/OPS:
- `api_key` - Chave de API para integracao
- `location_id` - ID da location GHL
- `source` - Origem do registro

---

### 4.5 CATEGORIA: METRICAS

#### 4.5.1 No: "Postgres" (Metricas)
**ID:** `780b94b3-7962-4315-b4c4-a5a0aa8b4288`

| Atributo | Valor |
|----------|-------|
| **Operacao** | Execute Query |
| **Tabela** | `execution_metrics` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2240, 0] |
| **On Error** | Continue Regular Output |

**Query Customizada:**
```sql
INSERT INTO execution_metrics (
  execution_id,
  workflow_id,
  workflow_name,
  workflow_version,
  n8n_version,
  environment,
  status,
  started_at,
  owner_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, NOW(), $8
)
RETURNING *;
```

**Query Replacement:**
```javascript
$json.dados
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Registra metricas de cada execucao do workflow para:
- Monitoramento de performance
- Debug de falhas
- Relatorios de uso
- Identificacao de gargalos
- Historico de execucoes

---

### 4.6 CATEGORIA: CONFIGURACAO

#### 4.6.1 No: "Buscar Agente Ativo"
**ID:** `f2684337-4b8a-4954-a53d-ffed5ca68eae`

| Atributo | Valor |
|----------|-------|
| **Operacao** | Execute Query |
| **Tabelas** | `agent_versions` + `locations` (JOIN) |
| **TypeVersion** | 2.5 (DIFERENTE!) |
| **Posicao** | [5296, 384] |
| **Always Output Data** | Sim |

**Query Customizada:**
```sql
SELECT av.*, l.api_key as location_api_key
FROM agent_versions av
LEFT JOIN locations l ON av.location_id = l.location_id
WHERE av.location_id = 'cd1uyzpJox6XPt4Vct8Y'
  AND av.is_active = true
  AND av.status = 'active'
ORDER BY av.activated_at DESC
LIMIT 1
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Busca a configuracao do agente de IA ativo para a location especifica. Permite:
- Versionamento de agentes
- Rollback para versoes anteriores
- Configuracao por location
- Obter API key da location via JOIN

**ATENCAO - Location ID Hardcoded:**
```
Location: cd1uyzpJox6XPt4Vct8Y
```

**ATENCAO - TypeVersion Diferente:** Este no usa typeVersion 2.5, diferente dos demais que usam 2.6

---

### 4.7 CATEGORIA: LIMPEZA/RESET

#### 4.7.1 No: "Resetar status atendimento"
**ID:** `65ce5db2-a81b-4276-ac28-9b42c268e2fd`

| Atributo | Valor |
|----------|-------|
| **Operacao** | UPSERT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2592, -528] |
| **Matching Column** | `id` |
| **Always Output Data** | Nao |

**Colunas Utilizadas:** Nenhuma mapeada (value: {})

**Schema de Colunas Completo:**
| Coluna | Tipo | Obrigatorio | Match | Proposito |
|--------|------|-------------|-------|-----------|
| id | number | Nao | Sim (default) | Matching column |
| session_id | string | Sim | Sim | - |
| message | object | Sim | Nao | - |
| message_hash | string | Nao | Sim | - |
| created_at | dateTime | Nao | Nao | - |

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Preparado para reset mas nao completamente configurado. Funciona como verificacao de existencia na tabela.

**Conexao:** Saida -> "Limpar fila de mensagens1"

---

#### 4.7.2 No: "Limpar fila de mensagens1"
**ID:** `1c54ac44-9d95-498a-85e2-21cbda7da64d`

| Atributo | Valor |
|----------|-------|
| **Operacao** | DELETE (deleteTable) |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **TypeVersion** | 2.6 |
| **Posicao** | [2800, -528] |
| **Delete Command** | delete |

**Filtros (WHERE):**
```sql
WHERE lead_id = $('Info').first().json.lead_id
```

**Credencial:**
```
Nome: Postgres Marcos Daniels.
ID: w2mBaRwhZ3tM4FUw
```

**Proposito:** Limpa historico de mensagens de um lead especifico. Usado para:
- Reset de conversa individual
- Novo inicio de atendimento
- Limpeza de dados antigos

**Nota:** O nome do no menciona "fila de mensagens" mas opera na tabela `n8n_historico_mensagens`

---

## 5. FLUXO DE DADOS

### 5.1 Ciclo Completo de uma Mensagem

```
1. RECEBIMENTO (Webhook GHL)
   |
   +---> historico_mensagens_leads [INSERT com ON CONFLICT]
   |     (Log permanente da mensagem para CRM)
   |
   +---> Enfileirar mensagem [INSERT em n8n_fila_mensagens]
         (Buffer para acumular mensagens)

2. PROCESSAMENTO INICIAL
   |
   +---> Buscar mensagens [SELECT de n8n_fila_mensagens]
   |     (Recupera todas mensagens pendentes do lead ORDER BY timestamp)
   |
   +---> Limpar fila de mensagens [DELETE de n8n_fila_mensagens]
         (Remove mensagens ja processadas WHERE lead_id)

3. VERIFICACAO DE ESTADO
   |
   +---> Conversa Ativa [SELECT de n8n_active_conversation]
         (Verifica se ja existe conversa em andamento WHERE lead_id AND workflow_id)

4. INICIO DO PROCESSAMENTO IA
   |
   +---> Salvar Inicio IA [UPSERT em n8n_active_conversation]
   |     (Marca conversa como "active", reseta retries para 0)
   |
   +---> Mensagem anteriores [SELECT de n8n_historico_mensagens]
         (Recupera contexto historico ORDER BY created_at ASC)

5. SALVAMENTO DE MEMORIA (Input do Lead)
   |
   +---> Memoria Lead [INSERT em n8n_historico_mensagens]
         (Salva mensagem do lead type="human")

6. CONFIGURACAO DO AGENTE
   |
   +---> Buscar Agente Ativo [SELECT JOIN agent_versions + locations]
         (Obtem configuracao do agente ativo)

7. PROCESSAMENTO IA
   |
   +---> [Nos de IA processam a mensagem]

8. SALVAMENTO DE MEMORIA (Output da IA)
   |
   +---> Memoria IA [INSERT em n8n_historico_mensagens]
         (Salva resposta da IA type="ai")

9. ATUALIZACAO DE ESTADO
   |
   +---> Atualizar resposta IA [UPSERT em n8n_active_conversation]
         (Marca como "inactive", salva output_preview)

10. FINALIZACAO
    |
    +---> Conversa ativa atualizada [SELECT]
    |     (Confirma estado final)
    |
    +---> Termino de resposta [DELETE de n8n_active_conversation]
          (Remove registro da conversa WHERE id)

PARALELO - TRACKING:
   +---> Salvar registro de Atividade - alan [UPSERT em n8n_schedule_tracking]
   +---> Salvar registro de Atividade - marcos [UPSERT em ops_schedule_tracking]
         (Para follow-ups e agendamentos)

PARALELO - METRICAS:
   +---> Postgres [INSERT em execution_metrics]
         (Metricas de execucao)
```

### 5.2 Ciclo de Espera (Timeout/Retry)

```
1. IA precisa aguardar mais input do usuario
   |
   +---> Salvar Espera [UPSERT em n8n_active_conversation]
         - waiting_process_id = process_id atual
         - retries = retries + 1
         - Status permanece "active"

2. Nova mensagem chega do lead
   |
   +---> Conversa Ativa [SELECT]
         - Detecta waiting_process_id existente
         - Recupera contador de retries

3. Retoma processamento
   |
   +---> Salvar Inicio IA [UPSERT]
         - waiting_process_id = null
         - retries = 0
         - Status mantido "active"
```

### 5.3 Ciclo de Reset

```
1. Trigger de reset (Branch separado)
   |
   +---> Resetar status atendimento [UPSERT vazio]
         (Verifica existencia)

2. Limpeza de historico do lead
   |
   +---> Limpar fila de mensagens1 [DELETE WHERE lead_id]
         (Remove historico especifico)

3. Limpeza total (se necessario)
   |
   +---> Limpar memoria [DELETE ALL]
         (Remove TODO o historico - CUIDADO!)
```

---

## 6. REFERENCIA RAPIDA

### 6.1 Tabela de Nos por Operacao

| Operacao | Nos | Quantidade |
|----------|-----|------------|
| **SELECT** | Buscar mensagens, Conversa Ativa, Conversa ativa atualizada, Mensagem anteriores | 4 |
| **INSERT** | Enfileirar mensagem, Memoria Lead, Memoria IA | 3 |
| **UPSERT** | Salvar Inicio IA, Salvar Espera, Atualizar resposta IA, Resetar status atendimento | 4 |
| **DELETE** | Limpar fila de mensagens, Termino de resposta, Limpar memoria, Limpar fila de mensagens1 | 4 |
| **Execute Query** | Postgres (metricas), historico_mensagens_leads, Salvar registro de Atividade alan, Salvar registro de Atividade marcos, Buscar Agente Ativo | 5 |

### 6.2 Tabela de Nos por Tabela

| Tabela | Nos que Utilizam | Operacoes |
|--------|------------------|-----------|
| `n8n_fila_mensagens` | Enfileirar mensagem, Buscar mensagens, Limpar fila de mensagens | INSERT, SELECT, DELETE |
| `n8n_active_conversation` | Conversa Ativa, Salvar Inicio IA, Salvar Espera, Atualizar resposta IA, Conversa ativa atualizada, Termino de resposta | SELECT, UPSERT, DELETE |
| `n8n_historico_mensagens` | Memoria Lead, Memoria IA, Mensagem anteriores, Limpar memoria, Limpar fila de mensagens1, Resetar status atendimento | INSERT, SELECT, DELETE, UPSERT |
| `crm_historico_mensagens` | historico_mensagens_leads | Execute Query (INSERT) |
| `n8n_schedule_tracking` | Salvar registro de Atividade - alan | Execute Query (UPSERT) |
| `ops_schedule_tracking` | Salvar registro de Atividade - marcos | Execute Query (UPSERT) |
| `execution_metrics` | Postgres | Execute Query (INSERT) |
| `agent_versions` + `locations` | Buscar Agente Ativo | Execute Query (SELECT JOIN) |

### 6.3 Configuracoes Especiais por No

| No | Configuracao Especial | Valor |
|----|----------------------|-------|
| Enfileirar mensagem | retryOnFail | true |
| Buscar mensagens | alwaysOutputData, retryOnFail | true, true |
| Conversa Ativa | alwaysOutputData, onError | true, continueRegularOutput |
| Salvar Inicio IA | **Credencial diferente**, retryOnFail, replaceEmptyStrings | Postgres account, true, true |
| Salvar Espera | retryOnFail | true |
| Atualizar resposta IA | retryOnFail, replaceEmptyStrings | true, true |
| Conversa ativa atualizada | alwaysOutputData, onError, retryOnFail | true, continueRegularOutput, true |
| Termino de resposta | retryOnFail | true |
| Memoria Lead | executeOnce, onError, retryOnFail | true, continueRegularOutput, true |
| Memoria IA | executeOnce, onError, retryOnFail | true, continueRegularOutput, true |
| Mensagem anteriores | alwaysOutputData, onError, retryOnFail | true, continueRegularOutput, true |
| historico_mensagens_leads | alwaysOutputData, onError, ON CONFLICT DO NOTHING | true, continueRegularOutput, - |
| Limpar memoria | DELETE ALL | sem WHERE |
| Buscar Agente Ativo | **typeVersion 2.5**, alwaysOutputData, location hardcoded | cd1uyzpJox6XPt4Vct8Y |
| Postgres (metricas) | onError | continueRegularOutput |
| Salvar registro Atividade alan | onError | continueRegularOutput |
| Salvar registro Atividade marcos | onError | continueRegularOutput |

### 6.4 Credenciais Utilizadas

| Credencial | ID | Quantidade | Nos |
|------------|----|-----------|----|
| Postgres Marcos Daniels. | w2mBaRwhZ3tM4FUw | 19 | Todos exceto Salvar Inicio IA |
| Postgres account | B0fAAM3acruSSuiz | 1 | Salvar Inicio IA |

### 6.5 Posicionamento dos Nos (Grid)

| No | Posicao X | Posicao Y |
|----|-----------|-----------|
| Enfileirar mensagem | 1696 | 400 |
| historico_mensagens_leads | 1824 | -224 |
| Limpar memoria | 1904 | -528 |
| Buscar mensagens | 2144 | 400 |
| Postgres (metricas) | 2240 | 0 |
| Salvar registro Atividade alan | 2480 | 0 |
| Resetar status atendimento | 2592 | -528 |
| Salvar registro Atividade marcos | 2688 | 0 |
| Limpar fila de mensagens1 | 2800 | -528 |
| Limpar fila de mensagens | 2816 | 400 |
| Conversa Ativa | 3312 | 400 |
| Salvar Espera | 3712 | 560 |
| Salvar Inicio IA | 4048 | 384 |
| Mensagem anteriores | 4240 | 384 |
| Memoria Lead | 4624 | 384 |
| Buscar Agente Ativo | 5296 | 384 |
| Conversa ativa atualizada | 7728 | 368 |
| Atualizar resposta IA | 8176 | 224 |
| Termino de resposta | 8400 | 464 |
| Memoria IA | 10128 | 32 |

---

## 7. CONSIDERACOES PARA ESCALAR

### 7.1 Pontos de Atencao Criticos

1. **Location ID Hardcoded** em "Buscar Agente Ativo"
   - Atualmente: `cd1uyzpJox6XPt4Vct8Y`
   - **Recomendacao:** Tornar dinamico via `$json.location_id` ou `$('Info').item.json.location_id`
   - **Impacto:** Impossibilita multi-tenancy sem modificacao

2. **Duas Credenciais Diferentes**
   - `Postgres Marcos Daniels.` (19 nos)
   - `Postgres account` (1 no - Salvar Inicio IA)
   - **Risco:** Inconsistencia de dados se apontarem para bancos diferentes
   - **Recomendacao:** Verificar se ambas apontam para mesmo banco/schema

3. **No "Limpar memoria" sem filtro WHERE**
   - Apaga TODA a tabela `n8n_historico_mensagens`
   - **Risco CRITICO:** Pode apagar historico de todos os leads
   - **Recomendacao:** Adicionar filtro por lead_id ou session_id

4. **Tabelas Duplicadas (Alan vs Marcos)**
   - `n8n_schedule_tracking` vs `ops_schedule_tracking`
   - **Recomendacao:** Unificar com campo de `environment` ou `tenant_id`

5. **TypeVersion Inconsistente**
   - 19 nos usam typeVersion 2.6
   - 1 no usa typeVersion 2.5 (Buscar Agente Ativo)
   - **Recomendacao:** Padronizar para versao mais recente

6. **Campos Removidos mas Presentes no Schema**
   - `telefone`, `instagram` em n8n_fila_mensagens
   - **Recomendacao:** Limpar schema ou documentar deprecacao

### 7.2 Recomendacoes para Multi-tenant

1. **Adicionar coluna `tenant_id` ou `location_id` em todas as tabelas:**
```sql
ALTER TABLE n8n_fila_mensagens ADD COLUMN location_id VARCHAR(50);
ALTER TABLE n8n_active_conversation ADD COLUMN location_id VARCHAR(50);
ALTER TABLE n8n_historico_mensagens ADD COLUMN location_id VARCHAR(50);
```

2. **Criar indices compostos para performance:**
```sql
CREATE INDEX idx_fila_location_lead ON n8n_fila_mensagens(location_id, lead_id);
CREATE INDEX idx_active_location_lead ON n8n_active_conversation(location_id, lead_id, workflow_id);
CREATE INDEX idx_historico_location_session ON n8n_historico_mensagens(location_id, session_id);
```

3. **Unificar tabelas duplicadas:**
```sql
-- Exemplo de migracao
ALTER TABLE n8n_schedule_tracking ADD COLUMN environment VARCHAR(20) DEFAULT 'alan';
INSERT INTO n8n_schedule_tracking SELECT *, 'marcos' FROM ops_schedule_tracking;
DROP TABLE ops_schedule_tracking;
```

4. **Parametrizar credenciais por ambiente:**
   - Usar variaveis de ambiente no n8n
   - Implementar connection pooling por tenant

### 7.3 Indices Recomendados

```sql
-- n8n_fila_mensagens
CREATE INDEX idx_fila_lead_id ON n8n_fila_mensagens(lead_id);
CREATE INDEX idx_fila_timestamp ON n8n_fila_mensagens(timestamp);
CREATE INDEX idx_fila_lead_timestamp ON n8n_fila_mensagens(lead_id, timestamp);

-- n8n_active_conversation
CREATE INDEX idx_active_lead_workflow ON n8n_active_conversation(lead_id, workflow_id);
CREATE INDEX idx_active_status ON n8n_active_conversation(status);
CREATE INDEX idx_active_waiting ON n8n_active_conversation(waiting_process_id) WHERE waiting_process_id IS NOT NULL;

-- n8n_historico_mensagens
CREATE INDEX idx_historico_session ON n8n_historico_mensagens(session_id);
CREATE INDEX idx_historico_created ON n8n_historico_mensagens(created_at);
CREATE INDEX idx_historico_session_created ON n8n_historico_mensagens(session_id, created_at);
CREATE INDEX idx_historico_hash ON n8n_historico_mensagens(message_hash);

-- crm_historico_mensagens
CREATE INDEX idx_crm_hist_lead ON crm_historico_mensagens(lead_id);
CREATE INDEX idx_crm_hist_datetime ON crm_historico_mensagens(datetime);

-- schedule_tracking
CREATE INDEX idx_schedule_unique ON n8n_schedule_tracking(unique_id);
CREATE INDEX idx_schedule_chat ON n8n_schedule_tracking(chat_id);
CREATE INDEX idx_ops_schedule_unique ON ops_schedule_tracking(unique_id);
CREATE INDEX idx_ops_schedule_location ON ops_schedule_tracking(location_id);

-- execution_metrics
CREATE INDEX idx_metrics_workflow ON execution_metrics(workflow_id);
CREATE INDEX idx_metrics_started ON execution_metrics(started_at);
CREATE INDEX idx_metrics_status ON execution_metrics(status);

-- agent_versions
CREATE INDEX idx_agent_location_active ON agent_versions(location_id, is_active, status);
```

### 7.4 Scripts de Manutencao

```sql
-- Limpeza de registros antigos (manter ultimos 30 dias)
DELETE FROM n8n_fila_mensagens
WHERE timestamp < NOW() - INTERVAL '30 days';

DELETE FROM n8n_active_conversation
WHERE created_at < NOW() - INTERVAL '7 days'
  AND status = 'inactive';

DELETE FROM n8n_historico_mensagens
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM execution_metrics
WHERE started_at < NOW() - INTERVAL '30 days';

-- Vacuum para recuperar espaco
VACUUM ANALYZE n8n_fila_mensagens;
VACUUM ANALYZE n8n_active_conversation;
VACUUM ANALYZE n8n_historico_mensagens;
VACUUM ANALYZE execution_metrics;
```

### 7.5 Monitoramento Sugerido

```sql
-- Verificar conversas travadas (active por mais de 1 hora)
SELECT * FROM n8n_active_conversation
WHERE status = 'active'
  AND created_at < NOW() - INTERVAL '1 hour';

-- Verificar fila de mensagens acumulada
SELECT lead_id, COUNT(*) as msgs_pendentes
FROM n8n_fila_mensagens
GROUP BY lead_id
HAVING COUNT(*) > 5
ORDER BY msgs_pendentes DESC;

-- Verificar retries excessivos
SELECT * FROM n8n_active_conversation
WHERE retries > 3;

-- Estatisticas de execucao por workflow
SELECT workflow_name, status, COUNT(*)
FROM execution_metrics
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY workflow_name, status;
```

---

## CHANGELOG

| Data | Versao | Descricao |
|------|--------|-----------|
| 2024-12-31 | 2.0 | Documentacao V2 completa com 20 nos do fluxo GHL Mottivme |

---

## RESUMO DE IDS DOS NOS

| No | ID |
|----|----|
| Postgres (metricas) | 780b94b3-7962-4315-b4c4-a5a0aa8b4288 |
| Buscar mensagens | 58dd5b6d-7ffb-4940-a292-ba80a8914483 |
| Limpar fila de mensagens | c6b038d8-871b-4709-bf26-8d808d29158a |
| Enfileirar mensagem | d228bdf9-3c9e-46d4-afd2-1ab1fad665e5 |
| Conversa Ativa | d8560446-bfd9-42a2-b4eb-a2925c88b0fc |
| Salvar Espera | f89511d6-39fc-413d-ac7c-5fe9fa0bb18f |
| Conversa ativa atualizada | 3131af47-bee4-4e87-bf03-a313cef4b730 |
| Termino de resposta | 90a128fb-e7ae-4c56-88f3-150d149ddb80 |
| Atualizar resposta IA | d5c47233-8e95-493c-a144-3e3c4dd56d89 |
| Memoria IA | 99152c83-b21e-4b37-9883-2a8a0aadf30d |
| Memoria Lead | 62aa871a-d0ac-4caa-b005-8f717683b45f |
| Mensagem anteriores | 6dfe71c8-e802-4194-84aa-2bf7530f660f |
| historico_mensagens_leads | 0d08ba2d-a159-4f3e-b2d6-84b77eebf9db |
| Salvar Inicio IA | 0cae2f0e-646d-44cb-8f34-6ba52b6d59a5 |
| Salvar registro Atividade marcos | 082915f5-0854-4d48-a722-988fbe1bd224 |
| Salvar registro Atividade alan | 1b01e85f-45fa-4030-a039-f0f692e98fb3 |
| Limpar memoria | 03958c2b-30d7-414d-80b3-a4c8285000f4 |
| Limpar fila de mensagens1 | 1c54ac44-9d95-498a-85e2-21cbda7da64d |
| Resetar status atendimento | 65ce5db2-a81b-4276-ac28-9b42c268e2fd |
| Buscar Agente Ativo | f2684337-4b8a-4954-a53d-ffed5ca68eae |

---

*Documento gerado para escalabilidade da operacao BPO Mottivme Sales - Versao 2.0*
