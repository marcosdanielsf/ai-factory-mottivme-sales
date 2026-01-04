# GUIA COMPLETO DOS NÓS POSTGRES - FLUXO PRINCIPAL BPO MOTTIVME SALES

## ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Tabelas Utilizadas](#tabelas-utilizadas)
3. [Mapa de Relacionamentos](#mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#detalhamento-por-categoria)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Referência Rápida](#referência-rápida)

---

## 1. VISÃO GERAL

### Resumo Executivo
O fluxo principal do BPO utiliza **20 nós Postgres** organizados em **6 categorias funcionais**:

| Categoria | Quantidade | Propósito |
|-----------|------------|-----------|
| Fila de Mensagens | 3 | Gerenciar buffer de mensagens recebidas |
| Conversa Ativa | 6 | Controlar estado das conversas em andamento |
| Histórico/Memória | 5 | Persistir contexto e histórico de mensagens |
| Agendamento | 2 | Rastrear atividades agendadas |
| Métricas | 1 | Registrar métricas de execução |
| Configuração | 2 | Buscar configurações dinâmicas |
| Limpeza | 1 | Reset de dados |

### Conexão Utilizada
```
Credencial: "Postgres Marcos Daniels."
ID: w2mBaRwhZ3tM4FUw
```

---

## 2. TABELAS UTILIZADAS

### 2.1 `n8n_fila_mensagens`
**Propósito:** Buffer temporário para acumular mensagens antes do processamento pela IA

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | number | Não (auto) | Identificador único |
| `id_mensagem` | string | Sim | ID da mensagem original (GHL) |
| `mensagem` | string | Sim | Conteúdo da mensagem |
| `timestamp` | dateTime | Não | Data/hora da mensagem |
| `lead_id` | string | Não | ID do lead no GHL |
| `telefone` | string | Não | (Removido) |
| `instagram` | string | Não | (Removido) |

### 2.2 `n8n_active_conversation`
**Propósito:** Controlar o estado das conversas ativas com a IA

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | number | Não | Identificador único (pode ser process_id) |
| `lead_id` | string | Não | ID do lead no GHL |
| `lead_name` | string | Não | Nome do lead |
| `status` | string | Não | Estado: "active" ou "inactive" |
| `owner_id` | string | Não | ID do dono/responsável |
| `workflow_id` | string | Sim | ID do workflow n8n |
| `waiting_process_id` | string | Não | ID do processo aguardando resposta |
| `retries` | number | Não | Contador de tentativas |
| `output_preview` | string | Não | Preview da resposta da IA |
| `created_at` | dateTime | Não | Data de criação |

### 2.3 `n8n_historico_mensagens`
**Propósito:** Memória de longo prazo da IA (histórico de conversas)

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | number | Não (auto) | Identificador único |
| `session_id` | string | Sim | ID da sessão (geralmente lead_id) |
| `message` | object (JSONB) | Sim | Objeto com a mensagem estruturada |
| `message_hash` | string | Não | Hash para deduplicação |
| `created_at` | dateTime | Não | Data de criação |

### 2.4 `crm_historico_mensagens`
**Propósito:** Log permanente de todas as mensagens trocadas

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `lead_id` | string | Sim | ID do lead |
| `mensagem` | string | Sim | Conteúdo da mensagem |
| `datetime` | string | Sim | Data/hora |
| `source` | string | Sim | Origem (inbound/outbound) |
| `full_name` | string | Sim | Nome completo do lead |

**Constraint:** `UNIQUE (lead_id, mensagem, datetime)` - Evita duplicatas

### 2.5 `ops_historico_mensagens`
**Propósito:** Histórico de mensagens para ambiente OPS (Marcos)

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | number | Não (auto) | Identificador único |
| `session_id` | string | Sim | ID da sessão |
| `message` | object | Sim | Objeto com a mensagem |
| `message_hash` | string | Não | Hash para deduplicação |
| `created_at` | dateTime | Não | Data de criação |

### 2.6 `n8n_schedule_tracking` (Alan)
**Propósito:** Rastreamento de atividades agendadas - Ambiente Alan

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `field` | string | Tipo de campo/ação |
| `value` | string | Valor associado |
| `execution_id` | string | ID da execução |
| `unique_id` | string | ID único (chave de conflito) |
| `ativo` | boolean | Se está ativo |
| `chat_id` | string | ID do chat |

### 2.7 `ops_schedule_tracking` (Marcos)
**Propósito:** Rastreamento de atividades agendadas - Ambiente Marcos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `field` | string | Tipo de campo/ação |
| `value` | string | Valor associado |
| `execution_id` | string | ID da execução |
| `unique_id` | string | ID único (chave de conflito) |
| `ativo` | boolean | Se está ativo |
| `chat_id` | string | ID do chat |
| `api_key` | string | Chave de API |
| `location_id` | string | ID da location GHL |
| `source` | string | Origem do registro |

### 2.8 `execution_metrics`
**Propósito:** Métricas de execução do workflow

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `execution_id` | string | ID da execução |
| `workflow_id` | string | ID do workflow |
| `workflow_name` | string | Nome do workflow |
| `workflow_version` | string | Versão |
| `n8n_version` | string | Versão do n8n |
| `environment` | string | Ambiente (prod/dev) |
| `status` | string | Status da execução |
| `started_at` | dateTime | Início |
| `owner_id` | string | ID do dono |

### 2.9 `agent_versions` + `locations` (JOIN)
**Propósito:** Buscar configuração do agente ativo

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `location_id` | string | ID da location GHL |
| `is_active` | boolean | Se versão está ativa |
| `status` | string | Status ("active") |
| `activated_at` | dateTime | Data de ativação |
| `api_key` | string | (via join) Chave da location |

---

## 3. MAPA DE RELACIONAMENTOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE DADOS - POSTGRES                            │
└─────────────────────────────────────────────────────────────────────────────┘

ENTRADA DE MENSAGEM
        │
        ▼
┌───────────────────┐     ┌─────────────────────────┐
│ historico_        │     │ Enfileirar mensagem.    │
│ mensagens_leads   │     │ (n8n_fila_mensagens)    │
│ [INSERT com       │     │ [INSERT]                │
│  ON CONFLICT]     │     └──────────┬──────────────┘
└───────────────────┘                │
                                     ▼
                        ┌─────────────────────────┐
                        │ Buscar mensagens        │
                        │ (n8n_fila_mensagens)    │
                        │ [SELECT WHERE lead_id]  │
                        └──────────┬──────────────┘
                                   │
                                   ▼
                        ┌─────────────────────────┐
                        │ Limpar fila mensagens   │
                        │ (n8n_fila_mensagens)    │
                        │ [DELETE WHERE lead_id]  │
                        └──────────┬──────────────┘
                                   │
                                   ▼
┌───────────────────┐   ┌─────────────────────────┐
│ Salvar registro   │   │ Conversa Ativa          │
│ de Atividade      │   │ (n8n_active_conversation│
│ [UPSERT]          │   │ [SELECT WHERE lead_id   │
└───────────────────┘   │  AND workflow_id]       │
                        └──────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ Salvar Inicio IA    │ │ Salvar Espera   │ │ Mensagem anteriores │
│ (n8n_active_        │ │ (n8n_active_    │ │ (n8n_historico_     │
│ conversation)       │ │ conversation)   │ │ mensagens)          │
│ [UPSERT status=     │ │ [UPSERT waiting │ │ [SELECT WHERE       │
│ active, retries=0]  │ │ _process_id,    │ │ session_id]         │
└──────────┬──────────┘ │ retries++]      │ └──────────┬──────────┘
           │            └─────────────────┘            │
           │                                           │
           ▼                                           ▼
┌─────────────────────┐                   ┌─────────────────────┐
│ Atualizar resposta  │                   │ Memoria Lead        │
│ IA                  │                   │ (n8n_historico_     │
│ (n8n_active_        │                   │ mensagens)          │
│ conversation)       │                   │ [INSERT]            │
│ [UPSERT status=     │                   └─────────────────────┘
│ inactive, output]   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Conversa ativa      │
│ atualizada          │
│ [SELECT]            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Termino de resposta │
│ (n8n_active_        │
│ conversation)       │
│ [DELETE WHERE id]   │
└─────────────────────┘

FLUXO DE RESET/LIMPEZA
        │
        ▼
┌───────────────────┐     ┌─────────────────────────┐
│ Resetar status    │────▶│ Limpar fila mensagens1  │
│ atendimento       │     │ (n8n_historico_         │
│ [UPSERT vazio]    │     │ mensagens) [DELETE]     │
└───────────────────┘     └─────────────────────────┘
        │
        ▼
┌───────────────────┐
│ Limpar memória    │
│ (n8n_historico_   │
│ mensagens)        │
│ [DELETE ALL]      │
└───────────────────┘
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 CATEGORIA: FILA DE MENSAGENS

#### 4.1.1 Nó: "Enfileirar mensagem."
**ID:** `7fe31a6f-81c3-41d9-90dc-b11a6700ea1c`

| Atributo | Valor |
|----------|-------|
| **Operação** | INSERT |
| **Tabela** | `n8n_fila_mensagens` |
| **Schema** | `public` |
| **Usa Query Customizada?** | Não |
| **Retry on Fail** | Sim |

**Colunas Utilizadas:**
```
mensagem    ← $json.mensagem
id_mensagem ← $json.mensagem_id
timestamp   ← $json.datetime
lead_id     ← $json.lead_id
```

**Propósito:** Quando uma nova mensagem chega, ela é enfileirada nesta tabela. Isso permite acumular múltiplas mensagens do lead antes de processá-las em lote pela IA.

**Dependências de Entrada:** Nó "Info" (dados do webhook)

---

#### 4.1.2 Nó: "Buscar mensagens"
**ID:** `08911ab3-3746-4962-ad5a-6dc2d9482055`

| Atributo | Valor |
|----------|-------|
| **Operação** | SELECT |
| **Tabela** | `n8n_fila_mensagens` |
| **Schema** | `public` |
| **Return All** | Sim |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |

**Filtros (WHERE):**
```sql
lead_id = $json.lead_id
```

**Ordenação (ORDER BY):**
```sql
timestamp ASC
```

**Propósito:** Busca todas as mensagens enfileiradas para um lead específico, ordenadas por tempo. Isso permite concatenar as mensagens na ordem correta antes de enviar para a IA.

---

#### 4.1.3 Nó: "Limpar fila de mensagens"
**ID:** `f8d6c788-ee01-406a-b8ac-8fa5918c04e2`

| Atributo | Valor |
|----------|-------|
| **Operação** | DELETE |
| **Tabela** | `n8n_fila_mensagens` |
| **Schema** | `public` |
| **Usa Query Customizada?** | Não |

**Filtros (WHERE):**
```sql
lead_id = $('Info').item.json.lead_id
```

**Propósito:** Após processar as mensagens enfileiradas, este nó limpa a fila para aquele lead específico. Isso evita reprocessamento de mensagens já tratadas.

**Conexão:** Saída → "Conversa Ativa"

---

### 4.2 CATEGORIA: CONVERSA ATIVA

#### 4.2.1 Nó: "Conversa Ativa"
**ID:** `6caccaa4-742d-4f2b-b949-cc7ade8191f4`

| Atributo | Valor |
|----------|-------|
| **Operação** | SELECT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **Limit** | 1 |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Filtros (WHERE):**
```sql
lead_id = $('Info').item.json.lead_id
AND workflow_id = $('Info').item.json.workflow_id
```

**Propósito:** Verifica se já existe uma conversa ativa para este lead neste workflow. Isso é crucial para:
- Detectar se a IA já está processando este lead
- Recuperar o estado anterior da conversa
- Obter o ID da conversa para atualizações

---

#### 4.2.2 Nó: "Salvar Inicio IA"
**ID:** `08675855-d720-466d-96e1-5a68e3722f6b`

| Atributo | Valor |
|----------|-------|
| **Operação** | UPSERT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **Matching Column** | `id` |
| **Retry on Fail** | Sim |
| **Replace Empty Strings** | Sim |

**Colunas Utilizadas:**
```
id                  ← $('Conversa Ativa').item.json.id || $('Info').item.json.process_id
lead_id             ← $('Info').item.json.lead_id
lead_name           ← $('Info').item.json.first_name
status              ← "active"
owner_id            ← $('Info').item.json.owner_id
workflow_id         ← $('Info').item.json.workflow_id
waiting_process_id  ← null
retries             ← 0
```

**Propósito:** Marca o início do processamento pela IA:
- Define status como "active" para bloquear processamentos paralelos
- Reseta contadores de retry
- Limpa processo aguardando anterior

**Credencial:** `Postgres account` (diferente!)

**Conexão:** Saída → "Mensagem anteriores"

---

#### 4.2.3 Nó: "Salvar Espera"
**ID:** `ee72b5c3-acb5-40ef-88ad-581dbdc6e7f3`

| Atributo | Valor |
|----------|-------|
| **Operação** | UPSERT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **Matching Column** | `id` |
| **Retry on Fail** | Sim |

**Colunas Utilizadas:**
```
id                  ← $('Conversa Ativa').item.json.id
waiting_process_id  ← $('Info').item.json.process_id
workflow_id         ← $json.workflow_id
retries             ← $('Conversa Ativa').item.json.retries + 1
```

**Propósito:** Quando a IA precisa aguardar mais input:
- Salva o process_id para retomar depois
- Incrementa contador de retries para controle de timeout
- Mantém a conversa em estado "ativo" mas aguardando

---

#### 4.2.4 Nó: "Atualizar resposta IA"
**ID:** `78d5a613-591c-429e-8ddb-58d723173f32`

| Atributo | Valor |
|----------|-------|
| **Operação** | UPSERT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **Matching Column** | `id` |
| **Retry on Fail** | Sim |
| **Replace Empty Strings** | Sim |

**Colunas Utilizadas:**
```
id             ← $('Conversa Ativa').first().json.id || $('Info').first().json.process_id
lead_id        ← $('Info').first().json.lead_id
lead_name      ← $('Info').first().json.full_name
status         ← "inactive"
owner_id       ← $('Info').first().json.owner_id
workflow_id    ← $('Info').first().json.workflow_id
output_preview ← $('Tipo de mensagem1').item.json.output
```

**Propósito:** Após a IA gerar resposta:
- Muda status para "inactive" permitindo novo processamento
- Salva preview da resposta para debug/monitoramento
- Atualiza dados do lead

---

#### 4.2.5 Nó: "Conversa ativa atualizada"
**ID:** `3e7a1e6e-f39d-4a1d-a548-3f881ca63394`

| Atributo | Valor |
|----------|-------|
| **Operação** | SELECT |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **Limit** | 1 |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Filtros (WHERE):**
```sql
lead_id = $('Info').first().json.lead_id
AND workflow_id = $('Info').first().json.workflow_id
```

**Propósito:** Re-busca o estado da conversa após atualizações para garantir sincronização e obter dados atualizados para o próximo passo.

---

#### 4.2.6 Nó: "Termino de resposta"
**ID:** `e4225a8d-69bc-4188-82ca-1d5451db8ed5`

| Atributo | Valor |
|----------|-------|
| **Operação** | DELETE |
| **Tabela** | `n8n_active_conversation` |
| **Schema** | `public` |
| **Retry on Fail** | Sim |

**Filtros (WHERE):**
```sql
id = $json.id
```

**Propósito:** Remove completamente o registro da conversa ativa quando:
- O atendimento foi finalizado
- O lead foi transferido para humano
- A conversa atingiu timeout máximo

---

### 4.3 CATEGORIA: HISTÓRICO E MEMÓRIA

#### 4.3.1 Nó: "Mensagem anteriores"
**ID:** `d11d0a46-bd2d-41cc-ab94-7b9a4e659c77`

| Atributo | Valor |
|----------|-------|
| **Operação** | SELECT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **Return All** | Sim |
| **Retry on Fail** | Sim |
| **Always Output Data** | Sim |
| **On Error** | Continue Regular Output |

**Filtros (WHERE):**
```sql
session_id = $json.lead_id
```

**Ordenação (ORDER BY):**
```sql
created_at ASC
```

**Propósito:** Recupera todo o histórico de conversas com o lead para fornecer contexto à IA. Essencial para:
- Manter continuidade da conversa
- Evitar repetir perguntas
- Contexto para tomada de decisão

---

#### 4.3.2 Nó: "Memoria Lead"
**ID:** `bc82b37e-61e1-453c-a986-634199b59727`

| Atributo | Valor |
|----------|-------|
| **Operação** | INSERT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **Retry on Fail** | Sim |
| **Execute Once** | Sim |
| **On Error** | Continue Regular Output |

**Colunas Utilizadas:**
```
session_id ← $json.session_id
message    ← $json.message (objeto JSONB)
```

**Propósito:** Persiste cada interação (mensagem do lead e resposta da IA) no histórico. O formato JSONB permite:
- Armazenar metadata estruturada
- Queries flexíveis no futuro
- Preservar formato original

---

#### 4.3.3 Nó: "historico_mensagens_leads"
**ID:** `d2acb803-00c3-43fb-96d3-fe77a795ca76`

| Atributo | Valor |
|----------|-------|
| **Operação** | Execute Query |
| **Tabela** | `crm_historico_mensagens` |
| **Always Output Data** | Sim |
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

**Propósito:** Log permanente de todas as mensagens para:
- Auditoria
- Relatórios de atendimento
- Análise de conversas
- Backup de dados

**Nota:** Usa `ON CONFLICT DO NOTHING` para evitar duplicatas sem erro.

---

#### 4.3.4 Nó: "Memoria Lead1 - Marcos"
**ID:** `11104143-b2d2-400c-b456-cb01d11e3ba9`

| Atributo | Valor |
|----------|-------|
| **Operação** | INSERT |
| **Tabela** | `ops_historico_mensagens` |
| **Schema** | `public` |
| **Retry on Fail** | Sim |
| **Execute Once** | Sim |
| **On Error** | Continue Regular Output |

**Colunas Utilizadas:**
```
session_id ← $json.session_id
message    ← $json.message
```

**Propósito:** Versão alternativa do histórico para ambiente OPS (Marcos). Estrutura idêntica ao `n8n_historico_mensagens` mas em tabela separada.

---

#### 4.3.5 Nó: "Limpar memória"
**ID:** `f4f620ee-064f-43f6-bc24-bb08f1cb6480`

| Atributo | Valor |
|----------|-------|
| **Operação** | DELETE |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **Delete Command** | Delete ALL |

**Propósito:** Limpa TODA a tabela de histórico. **CUIDADO:** Este nó apaga tudo, não apenas de um lead.

**Uso:** Apenas em cenários de reset total ou manutenção.

---

### 4.4 CATEGORIA: AGENDAMENTO/TRACKING

#### 4.4.1 Nó: "Salvar registro de Atividade - alan"
**ID:** `1c0e24ae-5f08-4674-9fd5-cc5cb911655d`

| Atributo | Valor |
|----------|-------|
| **Operação** | Execute Query |
| **Tabela** | `n8n_schedule_tracking` |
| **On Error** | Continue Regular Output |

**Query Customizada:**
```sql
INSERT INTO n8n_schedule_tracking (
  field, value, execution_id, unique_id, ativo, chat_id
) VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (unique_id) DO UPDATE SET
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

**Propósito:** Rastreia atividades agendadas (follow-ups, lembretes) para ambiente Alan. O UPSERT garante atualização se já existir.

---

#### 4.4.2 Nó: "Salvar registro de Atividade - marcos"
**ID:** `0def80c5-5c60-4810-9424-139ff69c5287`

| Atributo | Valor |
|----------|-------|
| **Operação** | Execute Query |
| **Tabela** | `ops_schedule_tracking` |
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

**Propósito:** Versão estendida do tracking com campos adicionais (api_key, location_id, source) para ambiente Marcos/OPS.

---

### 4.5 CATEGORIA: MÉTRICAS

#### 4.5.1 Nó: "Postgres" (Métricas)
**ID:** `5e211984-e7e9-4207-85dc-bdb79c09d82e`

| Atributo | Valor |
|----------|-------|
| **Operação** | Execute Query |
| **Tabela** | `execution_metrics` |
| **On Error** | Continue Regular Output |

**Query Customizada:**
```sql
INSERT INTO execution_metrics (
  execution_id, workflow_id, workflow_name, workflow_version,
  n8n_version, environment, status, started_at, owner_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, NOW(), $8
)
RETURNING *;
```

**Query Replacement:**
```javascript
$json.dados
```

**Propósito:** Registra métricas de cada execução do workflow para:
- Monitoramento de performance
- Debug de falhas
- Relatórios de uso
- Identificação de gargalos

---

### 4.6 CATEGORIA: CONFIGURAÇÃO

#### 4.6.1 Nó: "Buscar Agente Ativo"
**ID:** `283d11ae-531f-4e03-81ea-a227c7736c37`

| Atributo | Valor |
|----------|-------|
| **Operação** | Execute Query |
| **Tabelas** | `agent_versions` + `locations` (JOIN) |
| **Always Output Data** | Sim |
| **Type Version** | 2.5 (diferente!) |

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

**Propósito:** Busca a configuração do agente de IA ativo para a location específica. Permite:
- Versionamento de agentes
- Rollback para versões anteriores
- Configuração por location
- Obter API key da location

**Nota:** Location ID hardcoded: `cd1uyzpJox6XPt4Vct8Y`

---

### 4.7 CATEGORIA: LIMPEZA/RESET

#### 4.7.1 Nó: "Resetar status atendimento"
**ID:** `db781f06-0590-4338-b197-769b4243b4bb`

| Atributo | Valor |
|----------|-------|
| **Operação** | UPSERT |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |
| **Matching Column** | `id` |
| **Always Output Data** | Não |

**Colunas Utilizadas:** Nenhuma mapeada (vazio)

**Propósito:** Aparentemente preparado para reset mas não configurado. Verifica existência na tabela.

**Conexão:** Saída → "Limpar fila de mensagens1"

---

#### 4.7.2 Nó: "Limpar fila de mensagens1"
**ID:** `54a0ec23-8f5d-475a-b36a-5d589ea78fe1`

| Atributo | Valor |
|----------|-------|
| **Operação** | DELETE |
| **Tabela** | `n8n_historico_mensagens` |
| **Schema** | `public` |

**Filtros (WHERE):**
```sql
lead_id = $('Info').first().json.lead_id
```

**Propósito:** Limpa histórico de mensagens de um lead específico. Usado para:
- Reset de conversa
- Novo início de atendimento
- Limpeza de dados antigos

---

## 5. FLUXO DE DADOS

### 5.1 Ciclo Completo de uma Mensagem

```
1. RECEBIMENTO
   └─► historico_mensagens_leads [INSERT]
       (Log permanente da mensagem)

2. ENFILEIRAMENTO
   └─► Enfileirar mensagem [INSERT em n8n_fila_mensagens]
       (Buffer para acumular mensagens)

3. PROCESSAMENTO
   ├─► Buscar mensagens [SELECT de n8n_fila_mensagens]
   │   (Recupera todas mensagens pendentes do lead)
   │
   └─► Limpar fila de mensagens [DELETE de n8n_fila_mensagens]
       (Remove mensagens já processadas)

4. VERIFICAÇÃO DE ESTADO
   └─► Conversa Ativa [SELECT de n8n_active_conversation]
       (Verifica se já existe conversa em andamento)

5. INÍCIO DO PROCESSAMENTO IA
   ├─► Salvar Inicio IA [UPSERT em n8n_active_conversation]
   │   (Marca conversa como "active")
   │
   └─► Mensagem anteriores [SELECT de n8n_historico_mensagens]
       (Recupera contexto histórico)

6. PROCESSAMENTO IA
   └─► [Nós de IA processam]

7. SALVAMENTO DE MEMÓRIA
   └─► Memoria Lead [INSERT em n8n_historico_mensagens]
       (Salva nova interação no histórico)

8. ATUALIZAÇÃO DE ESTADO
   └─► Atualizar resposta IA [UPSERT em n8n_active_conversation]
       (Marca como "inactive", salva preview)

9. FINALIZAÇÃO
   ├─► Conversa ativa atualizada [SELECT]
   │   (Confirma estado final)
   │
   └─► Termino de resposta [DELETE de n8n_active_conversation]
       (Remove registro da conversa)

PARALELO - TRACKING:
   └─► Salvar registro de Atividade [UPSERT em *_schedule_tracking]
       (Para follow-ups e agendamentos)

PARALELO - MÉTRICAS:
   └─► Postgres [INSERT em execution_metrics]
       (Métricas de execução)
```

### 5.2 Ciclo de Espera (Timeout/Retry)

```
1. IA precisa aguardar mais input
   └─► Salvar Espera [UPSERT em n8n_active_conversation]
       - waiting_process_id = process_id atual
       - retries++
       - Status permanece "active"

2. Nova mensagem chega
   └─► Conversa Ativa [SELECT]
       - Detecta waiting_process_id
       - Recupera retries

3. Retoma processamento
   └─► Salvar Inicio IA [UPSERT]
       - waiting_process_id = null
       - retries = 0
```

### 5.3 Ciclo de Reset

```
1. Trigger de reset
   └─► Resetar status atendimento [UPSERT vazio]

2. Limpeza de histórico
   └─► Limpar fila de mensagens1 [DELETE WHERE lead_id]

3. Limpeza total (se necessário)
   └─► Limpar memória [DELETE ALL]
```

---

## 6. REFERÊNCIA RÁPIDA

### 6.1 Tabela de Nós por Operação

| Operação | Nós |
|----------|-----|
| **SELECT** | Buscar mensagens, Conversa Ativa, Conversa ativa atualizada, Mensagem anteriores |
| **INSERT** | Enfileirar mensagem, Memoria Lead, Memoria Lead1 - Marcos |
| **UPSERT** | Salvar Inicio IA, Salvar Espera, Atualizar resposta IA, Resetar status atendimento |
| **DELETE** | Limpar fila de mensagens, Termino de resposta, Limpar memória, Limpar fila de mensagens1 |
| **Execute Query** | Postgres (métricas), historico_mensagens_leads, Salvar registro de Atividade (x2), Buscar Agente Ativo |

### 6.2 Tabela de Nós por Tabela

| Tabela | Nós que Utilizam |
|--------|------------------|
| `n8n_fila_mensagens` | Enfileirar mensagem, Buscar mensagens, Limpar fila de mensagens |
| `n8n_active_conversation` | Conversa Ativa, Salvar Inicio IA, Salvar Espera, Atualizar resposta IA, Conversa ativa atualizada, Termino de resposta |
| `n8n_historico_mensagens` | Memoria Lead, Mensagem anteriores, Limpar memória, Resetar status atendimento, Limpar fila de mensagens1 |
| `crm_historico_mensagens` | historico_mensagens_leads |
| `ops_historico_mensagens` | Memoria Lead1 - Marcos |
| `n8n_schedule_tracking` | Salvar registro de Atividade - alan |
| `ops_schedule_tracking` | Salvar registro de Atividade - marcos |
| `execution_metrics` | Postgres |
| `agent_versions` + `locations` | Buscar Agente Ativo |

### 6.3 Configurações Especiais por Nó

| Nó | Configuração Especial |
|----|----------------------|
| Enfileirar mensagem | retryOnFail: true |
| Buscar mensagens | alwaysOutputData: true, retryOnFail: true |
| Conversa Ativa | alwaysOutputData: true, onError: continueRegularOutput |
| Salvar Inicio IA | **Credencial diferente** (Postgres account) |
| Memoria Lead | executeOnce: true |
| historico_mensagens_leads | ON CONFLICT DO NOTHING |
| Limpar memória | DELETE ALL (sem WHERE) |
| Buscar Agente Ativo | typeVersion: 2.5, location hardcoded |

### 6.4 Credenciais Utilizadas

| Credencial | ID | Nós |
|------------|----|----|
| Postgres Marcos Daniels. | w2mBaRwhZ3tM4FUw | 19 nós |
| Postgres account | B0fAAM3acruSSuiz | Salvar Inicio IA |

---

## 7. CONSIDERAÇÕES PARA ESCALAR

### 7.1 Pontos de Atenção

1. **Location ID Hardcoded** em "Buscar Agente Ativo"
   - Atualmente: `cd1uyzpJox6XPt4Vct8Y`
   - Para escalar: Tornar dinâmico via `$json.location_id`

2. **Duas Credenciais Diferentes**
   - Verificar se ambas apontam para mesmo banco
   - Risco de inconsistência de dados

3. **Nó "Limpar memória" sem filtro**
   - Apaga TODA a tabela
   - Adicionar filtro por lead_id ou session_id

4. **Tabelas Duplicadas (Alan vs Marcos)**
   - `n8n_schedule_tracking` vs `ops_schedule_tracking`
   - `n8n_historico_mensagens` vs `ops_historico_mensagens`
   - Considerar unificar com campo de ambiente

### 7.2 Recomendações para Multi-tenant

1. Adicionar coluna `tenant_id` ou `location_id` em todas as tabelas
2. Criar índices compostos: `(tenant_id, lead_id)`
3. Unificar tabelas duplicadas com discriminador de ambiente
4. Parametrizar credenciais por ambiente

### 7.3 Índices Recomendados

```sql
-- n8n_fila_mensagens
CREATE INDEX idx_fila_lead_id ON n8n_fila_mensagens(lead_id);
CREATE INDEX idx_fila_timestamp ON n8n_fila_mensagens(timestamp);

-- n8n_active_conversation
CREATE INDEX idx_active_lead_workflow ON n8n_active_conversation(lead_id, workflow_id);
CREATE INDEX idx_active_status ON n8n_active_conversation(status);

-- n8n_historico_mensagens
CREATE INDEX idx_historico_session ON n8n_historico_mensagens(session_id);
CREATE INDEX idx_historico_created ON n8n_historico_mensagens(created_at);

-- crm_historico_mensagens
CREATE INDEX idx_crm_hist_lead ON crm_historico_mensagens(lead_id);
```

---

## CHANGELOG

| Data | Versão | Descrição |
|------|--------|-----------|
| 2024-12-23 | 1.0 | Documentação inicial completa |

---

*Documento gerado para escalabilidade da operação BPO Mottivme Sales*
