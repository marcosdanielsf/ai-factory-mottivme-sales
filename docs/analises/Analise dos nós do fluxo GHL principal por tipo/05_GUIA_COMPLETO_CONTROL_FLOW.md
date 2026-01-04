# GUIA COMPLETO DOS NÓS CONTROL FLOW - FLUXO PRINCIPAL GHL MOTTIVME

## ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Tipos de Controle](#tipos-de-controle)
3. [Mapa de Relacionamentos](#mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#detalhamento-por-categoria)
   - 4.1 [Switch (7 nós)](#41-categoria-switch)
   - 4.2 [If (4 nós)](#42-categoria-if)
   - 4.3 [Filter (3 nós)](#43-categoria-filter)
   - 4.4 [Wait (3 nós)](#44-categoria-wait)
5. [Fluxo de Decisão](#fluxo-de-decisão)
6. [Referência Rápida](#referência-rápida)

---

## 1. VISÃO GERAL

### Resumo Executivo
O fluxo principal GHL Mottivme utiliza **17 nós de controle de fluxo** organizados em **4 tipos principais**:

| Tipo | Quantidade | Propósito |
|------|------------|-----------|
| Switch | 7 | Roteamento multi-branch baseado em condições |
| If | 4 | Decisões binárias (true/false) |
| Filter | 3 | Bloqueio/permissão de execução |
| Wait | 3 | Pausas e delays no fluxo |

### Estatísticas de Uso

```
Total de nós de controle: 17
├─ Switch (41.2%): 7 nós
├─ If (23.5%): 4 nós
├─ Filter (17.6%): 3 nós
└─ Wait (17.6%): 3 nós

Configurações avançadas:
├─ Loose Type Validation: 3 nós
├─ Always Output Data: 1 nó
└─ Multiple Outputs: 14 branches totais
```

---

## 2. TIPOS DE CONTROLE

### 2.1 Switch (Roteamento Multi-branch)

**Características:**
- Permite múltiplas saídas (branches)
- Suporta fallback/default output
- Case sensitive configurável
- Type validation (strict/loose)

**Uso no fluxo:**
- Determinar canal de comunicação (WhatsApp/Instagram)
- Classificar tipo de mensagem (texto/imagem/áudio)
- Rotear por objetivo do lead (carreira/consultoria)

### 2.2 If (Decisão Binária)

**Características:**
- Apenas 2 saídas: true ou false
- Ideal para validações simples
- Suporta múltiplas condições (AND/OR)

**Uso no fluxo:**
- Validar se IA está ativa
- Verificar se há waiting_process_id
- Checar integridade da resposta da IA

### 2.3 Filter (Bloqueio/Permissão)

**Características:**
- Bloqueia execução se condições não atendidas
- Não tem output "false" - simplesmente para
- Usado para "guardrails" e validações críticas

**Uso no fluxo:**
- Bloquear mensagens muito curtas
- Verificar se IA está permitida
- Validar se deve enviar mensagem

### 2.4 Wait (Pausas)

**Características:**
- Pausas síncronas ou assíncronas
- Resume automaticamente após timeout
- Webhook para resumo externo

**Uso no fluxo:**
- Aguardar acúmulo de mensagens (18s)
- Delay entre mensagens (1.5s, 15s)

---

## 3. MAPA DE RELACIONAMENTOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ÁRVORE DE DECISÃO - CONTROL FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

ENTRADA WEBHOOK
        │
        ▼
┌───────────────────┐
│ IA Ativa? (IF)    │──── FALSE ──► [FIM]
└────────┬──────────┘
         │ TRUE
         ▼
┌───────────────────────────┐
│ Tipo de mensagem (SWITCH) │
└──────────┬────────────────┘
           │
           ├─► /reset ──────────────────────► [Reset Flow]
           │
           ├─► /teste ──────────────────────► [Teste Flow]
           │
           ├─► Texto ────┐
           │             │
           ├─► Imagem ───┤
           │             │
           ├─► Áudio ────┤
           │             │
           └─► Vazio ────┤
                         │
                         ▼
              ┌──────────────────┐
              │ Esperar (WAIT)   │
              │ 18 segundos      │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │ Conversa Ativa?      │
              │ (Postgres SELECT)    │
              └────────┬─────────────┘
                       │
                       ▼
              ┌─────────────────────────┐
              │ Ação Planejada (SWITCH) │
              └──────┬──────────────────┘
                     │
                     ├─► Iniciar Conversa ──┐
                     │                       │
                     ├─► Ignorar ───────────┼──► [FIM]
                     │                       │
                     └─► Aguardar ──────────┤
                              │              │
                              ▼              │
                     ┌──────────────┐        │
                     │ Wait (15s)   │        │
                     └──────────────┘        │
                                             │
                     ┌───────────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │ Permitido AI?    │
              │ (FILTER)         │──── BLOCKED ──► [FIM]
              └────────┬─────────┘
                       │ PASS
                       ▼
              [PROCESSAMENTO IA]
                       │
                       ▼
              ┌──────────────────┐
              │ Tudo certo?4 (IF)│
              └────────┬─────────┘
                       │
                       ├─► TRUE ──┐
                       │          │
                       └─► FALSE ─┼──► [Error Handler]
                                  │
                                  ▼
              ┌──────────────────────┐
              │ Filter (length > 2)  │
              └────────┬─────────────┘
                       │
                       ▼
              ┌──────────────────────────┐
              │ Tipo de mensagem1 (SWITCH)│
              └────────┬─────────────────┘
                       │
                       └─► Texto ──┐
                                   │
                                   ▼
              ┌─────────────────────────┐
              │ If (waiting_process_id?)│
              └────────┬────────────────┘
                       │
                       ├─► TRUE ──► [Aguardar resposta]
                       │
                       └─► FALSE ─┐
                                  │
                                  ▼
              ┌──────────────────────────────┐
              │ Deve enviar mensagem? (FILTER)│
              └────────┬─────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ If1 (valida JSON)│
              └────────┬─────────┘
                       │
                       └─► TRUE ──┐
                                  │
                                  ▼
              ┌──────────────────┐
              │ Canal (SWITCH)   │
              └────────┬─────────┘
                       │
                       ├─► WhatsApp ─┐
                       │             │
                       └─► Instagram ─┤
                                      │
                                      ▼
              ┌──────────────────┐
              │ 1.5s (WAIT)      │
              └────────┬─────────┘
                       │
                       ▼
              [ENVIO DE MENSAGEM]


FLUXOS PARALELOS:

┌─────────────────────────────┐
│ Switch Objetivo (4️⃣)        │
│ (Classificação do Lead)     │
└──────┬──────────────────────┘
       │
       ├─► Carreira ──────► [Pipeline Carreira]
       │
       ├─► Consultoria ───► [Pipeline Consultoria]
       │
       └─► Indefinido ────► [Qualificação]


┌─────────────────────────────┐
│ Canal2/Canal4 (SWITCH)      │
│ (Roteamento pós-IA)         │
└──────┬──────────────────────┘
       │
       ├─► WhatsApp ──────► [GHL WhatsApp]
       │
       └─► Instagram ─────► [GHL Instagram]
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 CATEGORIA: SWITCH

#### 4.1.1 Nó: "Tipo de mensagem"
**ID:** `6737ad10-a146-4dde-99a4-39d256540f69`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [880, 352] |
| **Always Output Data** | false |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  allMatchingOutputs: false  // Apenas primeira match
}
```

**Branches (6 outputs):**

##### Branch 1: /reset
```javascript
Condições:
  - $('Info').item.json.mensagem CONTAINS "/reset"
  - Combinator: AND

Output Key: "/reset"
Propósito: Comando de reset da conversa
Próximo nó: [Reset Flow]
```

##### Branch 2: /teste
```javascript
Condições:
  - $('Info').item.json.mensagem CONTAINS "/teste"
  - Combinator: AND

Output Key: "/teste"
Propósito: Comando de teste do sistema
Próximo nó: [Teste Flow]
```

##### Branch 3: Texto
```javascript
Condições:
  - $('Info').item.json.tipo_mensagem_original EQUALS "texto"
  - !!$('Info').item.json.mensagem && length > 0
  - Combinator: AND

Output Key: "Texto"
Propósito: Mensagem de texto válida
Próximo nó: Esperar (18s)
```

##### Branch 4: Imagem
```javascript
Condições:
  - $('Info').item.json.tipo_mensagem_original EQUALS "imagem"
  - Combinator: AND

Output Key: "Imagem"
Propósito: Mensagem com imagem
Próximo nó: [Processamento de Imagem]
```

##### Branch 5: Áudio
```javascript
Condições:
  - $('Info').item.json.tipo_mensagem_original EQUALS "audio"
  - Combinator: AND

Output Key: "Áudio"
Propósito: Mensagem de voz
Próximo nó: [Processamento de Áudio]
```

##### Branch 6: mensagem vazia
```javascript
Condições:
  - $('Info').item.json.tipo_mensagem_original IS_EMPTY
  - Combinator: AND

Output Key: "mensagem vazia"
Propósito: Fallback para mensagens sem tipo
Próximo nó: [Error Handler]
```

**Lógica de Decisão:**
1. Primeiro verifica comandos especiais (/reset, /teste)
2. Depois verifica tipo de mídia (texto, imagem, áudio)
3. Fallback para mensagens vazias
4. **IMPORTANTE:** Apenas a primeira condição que der match é executada

**Edge Cases:**
- Mensagem nula → Branch "mensagem vazia"
- Mensagem com tipo desconhecido → Nenhum output (execução para)
- Comando + texto → Apenas comando é processado (allMatchingOutputs: false)

---

#### 4.1.2 Nó: "Ação Planejada"
**ID:** `8555b95c-6398-4df7-ac36-a77b34c31448`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [3472, 400] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict"
}
```

**Branches (3 outputs):**

##### Branch 1: Iniciar Conversa
```javascript
Condições (ANY):
  1. $json.isEmpty() = true
  2. $json.status = "inactive"
  3. (new Date() - new Date($json.created_at)) > 60000ms  // 1 minuto

Lógica: (vazio OU inativo OU timeout de 1 min)
Output Key: "Iniciar Conversa"
Próximo nó: Salvar Inicio IA
```

**Explicação detalhada:**
- `isEmpty()`: Não há registro de conversa ativa
- `status = inactive`: Conversa anterior foi finalizada
- `timeout > 1 min`: Conversa antiga, pode reiniciar

##### Branch 2: Ignorar
```javascript
Condições (ANY):
  1. $json.retries > 10
  2. $json.waiting_process_id EXISTS
     AND $json.status = "active"
     AND $json.waiting_process_id ≠ $('Info').item.json.process_id

Lógica: (muitas tentativas OU processo diferente aguardando)
Output Key: "Ignorar"
Próximo nó: [FIM]
```

**Explicação detalhada:**
- `retries > 10`: Excedeu limite de tentativas (provável loop)
- `processo diferente`: Outra mensagem está aguardando resposta, não é esta

##### Branch 3: Aguardar
```javascript
Condições:
  - $json.status = "active"

Lógica: Conversa está ativa mas não se enquadra nos casos acima
Output Key: "Aguardar"
Próximo nó: Wait (15s)
```

**Explicação detalhada:**
- IA está processando, aguardar antes de acumular mais mensagens

**Lógica de Decisão:**
```
┌─────────────────────────────────────────────┐
│ Estado da Conversa Ativa                    │
└─────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │ Registro      │
    │ existe?       │
    └───┬───────────┘
        │
    NO  ├─────────────────► Iniciar Conversa
        │
    YES │
        ▼
    ┌───────────────┐
    │ Status =      │
    │ inactive?     │
    └───┬───────────┘
        │
    YES ├─────────────────► Iniciar Conversa
        │
    NO  │
        ▼
    ┌───────────────┐
    │ Timeout > 1min│
    └───┬───────────┘
        │
    YES ├─────────────────► Iniciar Conversa
        │
    NO  │
        ▼
    ┌───────────────┐
    │ Retries > 10? │
    └───┬───────────┘
        │
    YES ├─────────────────► Ignorar (loop infinito)
        │
    NO  │
        ▼
    ┌───────────────────────┐
    │ Waiting process ≠     │
    │ current process?      │
    └───┬───────────────────┘
        │
    YES ├─────────────────► Ignorar (outro processo)
        │
    NO  │
        ▼
    ┌───────────────┐
    │ Status =      │
    │ active?       │
    └───┬───────────┘
        │
    YES ├─────────────────► Aguardar (IA processando)
        │
    NO  │
        ▼
    [Fallback: nenhum output]
```

**Edge Cases:**
- Registro com created_at = null → Considera como > 1 min (truthy)
- Status desconhecido (não active/inactive) → Nenhum output
- Retries = null → Considera como 0 (falsy)

**Tratamento de Retry:**
- A cada "Aguardar", o contador `retries` é incrementado em Postgres
- Se atingir 11+, entra em "Ignorar" para evitar loop infinito
- Reset de retries acontece em "Salvar Inicio IA" (retries = 0)

---

#### 4.1.3 Nó: "Tipo de mensagem1"
**ID:** `f691c616-dac9-4c8c-a411-c900e8569a30`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [7504, 368] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict"
}
```

**Branches (1 output):**

##### Branch 1: Texto
```javascript
Condições:
  - $('Set mensagens').first().json.mensagem IS_NOT_EMPTY

Output Key: "Texto"
Propósito: Validar que IA gerou mensagem válida
Próximo nó: If (waiting_process_id?)
```

**Lógica de Decisão:**
- Simples validação de que a IA retornou conteúdo
- Se vazio → Nenhum output → Execução para
- Se tem conteúdo → Prossegue para verificar se precisa aguardar resposta

**Edge Cases:**
- Mensagem = null → Falha (nenhum output)
- Mensagem = "" → Falha (nenhum output)
- Mensagem = " " → Passa (espaço não é vazio)

**Fallback Behavior:**
- Não tem fallback/default output
- Se condição falhar, execução simplesmente termina ali
- Erro silencioso (ideal adicionar branch "Erro" para monitoramento)

---

#### 4.1.4 Nó: "Canal"
**ID:** `020715bd-e226-418c-bdb9-3cc5379446bd`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [10176, 320] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict"
}
```

**Branches (2 outputs):**

##### Branch 1: Whatsapp
```javascript
Condições:
  - "whatsapp " EQUALS $('Info').first().json.source

Nota: Espaço extra após "whatsapp" é proposital (bug?)
Output Key: "Whatsapp"
Próximo nó: GHL WhatsApp Sender
```

##### Branch 2: Instagram
```javascript
Condições:
  - "instagram" EQUALS $('Info').first().json.source

Output Key: "Instagram"
Próximo nó: GHL Instagram Sender
```

**Lógica de Decisão:**
- Roteia mensagem final para o canal correto
- Baseado no campo `source` do webhook original

**Edge Cases:**
- source = "WHATSAPP" (uppercase) → Nenhum output (case sensitive!)
- source = "whatsapp" (sem espaço) → Nenhum output (comparação exata!)
- source = "facebook" → Nenhum output (não tratado)

**Bug Identificado:**
```javascript
// Condição atual (com espaço):
"whatsapp " === $json.source

// Deveria ser:
"whatsapp" === $json.source.toLowerCase().trim()
```

**Recomendação:**
- Adicionar `.toLowerCase()` e `.trim()` na comparação
- Adicionar fallback/default output para canais desconhecidos

---

#### 4.1.5 Nó: "Canal2"
**ID:** `270c1971-763e-4900-8226-0a233e93f18e`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [2960, -528] |
| **Loose Type Validation** | true |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "loose"  // ⚠️ Diferente dos outros!
}
```

**Branches (2 outputs):**

##### Branch 1: Whatsapp
```javascript
Condições:
  - "whatsapp" EQUALS $('Edit Fields').first().json.source

Output Key: "Whatsapp"
```

##### Branch 2: Instagram
```javascript
Condições:
  - "instagram" EQUALS $('Edit Fields').first().json.source

Output Key: "Instagram"
```

**Diferenças vs "Canal":**
- Usa **loose type validation** (mais permissivo)
- Source vem de `Edit Fields` ao invés de `Info`
- Não tem espaço extra no "whatsapp"

**Loose Type Validation:**
```javascript
// Com loose:
"1" == 1  // true (coerção de tipo)
null == undefined  // true

// Com strict:
"1" === 1  // false
null === undefined  // false
```

---

#### 4.1.6 Nó: "4️⃣ Switch Objetivo"
**ID:** `97745add-33ee-493b-a963-79c78463b1ee`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [1968, -1168] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict"
}
```

**Branches (3 outputs):**

##### Branch 1: Carreira
```javascript
Condições:
  - $json.resultado EQUALS "carreira"

Output Key: "Carreira"
Propósito: Lead interessado em transição de carreira
Próximo nó: [Pipeline Carreira]
```

##### Branch 2: Consultoria
```javascript
Condições:
  - $json.resultado EQUALS "consultoria"

Output Key: "Consultoria"
Propósito: Lead interessado em consultoria empresarial
Próximo nó: [Pipeline Consultoria]
```

##### Branch 3: Indefinido
```javascript
Condições:
  - $json.resultado EQUALS "indefinido"

Output Key: "Indefinido"
Propósito: Lead ainda não definiu objetivo claro
Próximo nó: [Qualificação Adicional]
```

**Lógica de Decisão:**
- Classifica o lead em 3 categorias de objetivo
- Baseado em resposta prévia da IA (campo `resultado`)
- Roteia para pipeline específico

**Origem do Campo `resultado`:**
- Gerado por IA em nó anterior (provavelmente OpenAI/Claude)
- Prompt deve instruir IA a retornar: "carreira", "consultoria" ou "indefinido"

**Edge Cases:**
- resultado = "Carreira" (uppercase C) → Nenhum output (case sensitive!)
- resultado = "carreira " (com espaço) → Nenhum output
- resultado = "outro valor" → Nenhum output (execução para)

**Fallback Behavior:**
- Não tem default output
- Se IA retornar valor inesperado, fluxo trava
- **Crítico:** Adicionar fallback "Indefinido" como default

---

#### 4.1.7 Nó: "Canal4"
**ID:** `0749b87a-d884-43e1-96c7-327f007635bb`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.switch |
| **Type Version** | 3.2 |
| **Position** | [2192, -960] |
| **Loose Type Validation** | true |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "loose"
}
```

**Branches (2 outputs):**

##### Branch 1: Whatsapp
```javascript
Condições:
  - "whatsapp" EQUALS $json.source

Output Key: "Whatsapp"
```

##### Branch 2: Instagram
```javascript
Condições:
  - "instagram" EQUALS $json.source

Output Key: "Instagram"
```

**Propósito:**
- Similar ao "Canal2"
- Roteamento pós-classificação de objetivo
- Loose validation para maior tolerância

---

### 4.2 CATEGORIA: IF

#### 4.2.1 Nó: "IA Ativa?"
**ID:** `843943ea-7ec3-4b47-a662-6046beea4ae5`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.if |
| **Type Version** | 2.2 |
| **Position** | [656, 384] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  combinator: "or"  // ⚠️ Importante: OR
}
```

**Condições (OR):**

##### Condição 1: Flag de ativação
```javascript
$json.ativar_ia EQUALS "sim"
```

##### Condição 2: Tag especial
```javascript
$json.etiquetas CONTAINS "assistente-admin"
```

**Lógica de Decisão:**
```
IA está ativa SE:
  - Campo ativar_ia = "sim"
  OU
  - Lead tem tag "assistente-admin"
```

**Outputs:**
- **TRUE** → Prossegue para "Tipo de mensagem"
- **FALSE** → Encerra execução (IA não processa)

**Propósito:**
- Controle de feature flag (ativar/desativar IA)
- Bypass para leads VIP (tag assistente-admin)

**Edge Cases:**
- ativar_ia = "SIM" (uppercase) → FALSE (case sensitive!)
- ativar_ia = null → FALSE
- etiquetas = null → FALSE
- etiquetas = ["assistente-admin", "outro"] → TRUE (CONTAINS funciona em arrays)

**Valores Possíveis de ativar_ia:**
```javascript
"sim"   → TRUE
"não"   → FALSE
"Sim"   → FALSE (case sensitive!)
""      → FALSE
null    → FALSE
undefined → FALSE
```

**Recomendação:**
```javascript
// Melhorar robustez:
$json.ativar_ia?.toLowerCase() === "sim"
```

---

#### 4.2.2 Nó: "If" (waiting_process_id?)
**ID:** `33dec01d-7e1a-4b95-9e37-500463e1ed2b`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.if |
| **Type Version** | 2.2 |
| **Position** | [7952, 368] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  combinator: "and"
}
```

**Condições:**

##### Condição 1: Existe waiting_process_id
```javascript
$json.waiting_process_id IS_NOT_EMPTY
```

**Lógica de Decisão:**
```
IF waiting_process_id tem valor:
  TRUE  → IA está aguardando input adicional
  FALSE → IA finalizou, pode enviar mensagem
```

**Outputs:**
- **TRUE** → Aguardar resposta do lead (não envia mensagem ainda)
- **FALSE** → Continua para "Deve enviar mensagem?"

**Propósito:**
- Detectar se IA pediu informação adicional
- Evitar enviar mensagem parcial
- Controlar fluxo de pergunta-resposta

**Contexto:**
```
IA pode retornar:
1. Mensagem completa → waiting_process_id = null
2. Pergunta aguardando resposta → waiting_process_id = <process_id>

Exemplos:
- "Qual seu nome?" → waiting_process_id preenchido
- "Olá, tudo bem!" → waiting_process_id = null
```

**Edge Cases:**
- waiting_process_id = "" (string vazia) → FALSE
- waiting_process_id = "abc123" → TRUE
- waiting_process_id = null → FALSE
- waiting_process_id = undefined → FALSE

---

#### 4.2.3 Nó: "If1" (Validação JSON)
**ID:** `2648a0cf-ca4f-474b-8667-30546c7d5ae5`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.if |
| **Type Version** | 2.2 |
| **Position** | [9280, 320] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  combinator: "and"  // ⚠️ Todas devem ser TRUE
}
```

**Condições (AND):**

##### Bloco de validação: Evitar vazamento de JSON/código

```javascript
1. $json.output.messages.join().toLowerCase() NOT_CONTAINS "json"
2. $json.output.messages.join().toLowerCase() NOT_CONTAINS "{"
3. $json.output.messages.join().toLowerCase() NOT_CONTAINS "output"
4. $json.output.messages.join().toLowerCase() NOT_CONTAINS "parsed"
5. $json.output.messages.join().toLowerCase() NOT_CONTAINS "split"
6. $json.output.messages.join().toLowerCase() NOT_CONTAINS "properties"
7. $json.output.messages.join().toLowerCase() NOT_CONTAINS "type"
```

**Lógica de Decisão:**
```
A resposta da IA é VÁLIDA SE:
  - NÃO contém palavras técnicas (json, output, parsed, etc)
  - NÃO contém caracteres de código ({ )

Se ALGUMA palavra técnica aparecer → FALSE → Bloqueia envio
```

**Outputs:**
- **TRUE** → Mensagem limpa, pode enviar
- **FALSE** → Mensagem contém código/JSON, bloqueia envio

**Propósito:**
- Evitar que IA envie JSON raw para o cliente
- Filtrar respostas com código/debug
- Garantir qualidade da mensagem

**Exemplos:**

| Mensagem da IA | Resultado | Motivo |
|----------------|-----------|--------|
| "Olá! Como posso ajudar?" | TRUE | Limpa |
| "Aqui está o JSON: {...}" | FALSE | Contém "JSON" e "{" |
| "O output foi gerado" | FALSE | Contém "output" |
| "Vou te dar um tipo de ajuda" | FALSE | Contém "tipo" |
| "Você pode dividir (split) isso" | FALSE | Contém "split" |

**Problema Identificado:**
```javascript
// "tipo" é muito genérico!
"Que tipo de serviço você procura?" → BLOQUEADO incorretamente!

// "properties" também é comum
"Verifique as propriedades do imóvel" → BLOQUEADO incorretamente!
```

**Edge Cases:**
- Mensagem = "JSON" (uppercase) → Bloqueado (toLowerCase)
- Mensagem = "json" (minúsculo) → Bloqueado
- Mensagem = "tente dividir o valor" → Bloqueado (split em português não, mas "split" em inglês sim)

**Recomendação:**
```javascript
// Validação mais precisa:
Verificar APENAS se:
- Começa com { ou [
- Contém "```json"
- Contém chaves de objetos: "key":"value"

Ao invés de blacklist de palavras genéricas.
```

---

#### 4.2.4 Nó: "Tudo certo?4"
**ID:** `5884abc6-c8a1-48ea-a37a-33dc99087a3a`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.if |
| **Type Version** | 2.2 |
| **Position** | [6832, 384] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  combinator: "and"
}
```

**Condições (AND):**

##### Condição 1: Não contém tag de controle
```javascript
$json.output NOT_CONTAINS "<ctrl"
```

##### Condição 2: Output não vazio
```javascript
$json.output IS_NOT_EMPTY
```

**Lógica de Decisão:**
```
Resposta da IA é VÁLIDA SE:
  - NÃO contém "<ctrl" (tag especial de controle)
  E
  - Output tem conteúdo
```

**Outputs:**
- **TRUE** → IA gerou resposta válida, prosseguir
- **FALSE** → Erro na IA ou resposta especial, tratar

**Propósito:**
- Validar integridade da resposta da IA
- Detectar tags especiais de controle
- Evitar enviar mensagens vazias

**Tag `<ctrl`:**
```
Possíveis usos:
- <ctrl:transfer> → Transferir para humano
- <ctrl:schedule> → Agendar callback
- <ctrl:end> → Finalizar conversa
```

**Exemplos:**

| Output da IA | Condição 1 | Condição 2 | Resultado |
|--------------|------------|------------|-----------|
| "Olá, tudo bem?" | TRUE | TRUE | TRUE |
| "<ctrl:transfer>" | FALSE | TRUE | FALSE |
| "" | TRUE | FALSE | FALSE |
| null | TRUE | FALSE | FALSE |
| "Texto <ctrl:end>" | FALSE | TRUE | FALSE |

**Edge Cases:**
- output = "<CTRL:END>" (uppercase) → Passa (case sensitive!)
- output = " " (espaço) → TRUE (não é vazio)
- output = "\n" (quebra de linha) → TRUE (não é vazio)

**Recomendação:**
```javascript
// Adicionar case insensitive:
$json.output.toLowerCase() NOT_CONTAINS "<ctrl"

// Trim para evitar espaços vazios:
$json.output.trim() IS_NOT_EMPTY
```

---

### 4.3 CATEGORIA: FILTER

#### 4.3.1 Nó: "Filter" (length > 2)
**ID:** `b750bc68-0b49-4ccc-bc0e-5f40feb8abeb`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.filter |
| **Type Version** | 2.2 |
| **Position** | [7056, 368] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  combinator: "and"
}
```

**Condições:**

##### Condição 1: Comprimento mínimo
```javascript
$json.output.length > 2

Operator: number.gt (greater than)
```

**Lógica de Decisão:**
```
BLOQUEIA SE:
  - output.length <= 2

PERMITE SE:
  - output.length > 2
```

**Outputs:**
- **PASS** → Mensagem tem mais de 2 caracteres, prossegue
- **BLOCKED** → Mensagem muito curta, execução para (sem erro)

**Propósito:**
- Evitar enviar mensagens muito curtas (ex: "ok", ".")
- Filtrar respostas inválidas da IA
- Garantir qualidade mínima

**Exemplos:**

| Output | Length | Resultado |
|--------|--------|-----------|
| "" | 0 | BLOCKED |
| "ok" | 2 | BLOCKED |
| "sim" | 3 | PASS |
| "a" | 1 | BLOCKED |
| " " | 1 | BLOCKED |

**Edge Cases:**
- output = null → ERROR (null.length não existe)
- output = undefined → ERROR
- output = "  " (2 espaços) → BLOCKED (length = 2)
- output = "   " (3 espaços) → PASS (length = 3, mas mensagem inútil!)

**Problema Identificado:**
```javascript
// Conta espaços como caracteres válidos:
"   " → PASS (mas é mensagem vazia!)

// Deveria usar trim():
$json.output.trim().length > 2
```

**Recomendação:**
```javascript
// Melhor validação:
$json.output?.trim().length > 2

// Ou validação mais rigorosa:
$json.output?.trim().length >= 10  // Mínimo de 10 caracteres úteis
```

---

#### 4.3.2 Nó: "Permitido AI?"
**ID:** `89380197-9a86-4270-a5c4-70a5f8c8853b`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.filter |
| **Type Version** | 2.2 |
| **Position** | [3712, 384] |
| **Loose Type Validation** | true |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "loose",  // ⚠️ Loose!
  combinator: "and"
}
```

**Condições (AND):**

##### Condição 1: Flag não está como "disparo realizado"
```javascript
$('Info').item.json.n8n_ativo != "disparo realizado"

Operator: boolean.false
```

##### Condição 2: Mensagem não é "okkk"
```javascript
$('Tipo de mensagem').item.json.mensagem.toLowerCase() != "okkk"

Operator: string.notEquals
```

**Lógica de Decisão:**
```
PERMITE IA processar SE:
  - n8n_ativo NÃO é "disparo realizado"
  E
  - mensagem NÃO é "okkk"

BLOQUEIA SE:
  - Já foi disparado anteriormente
  OU
  - Lead respondeu "okkk" (confirmação de agendamento)
```

**Outputs:**
- **PASS** → IA pode processar
- **BLOCKED** → IA não deve processar, execução para

**Propósito:**
- Evitar processar duas vezes a mesma mensagem
- Bloquear respostas de confirmação simples ("okkk")
- Controle de idempotência

**Campo `n8n_ativo`:**
```javascript
// Valores possíveis:
"disparo realizado"  → Já processado, BLOQUEIA
null                → Novo, PERMITE
undefined           → Novo, PERMITE
"outro valor"       → Novo, PERMITE
```

**Mensagem "okkk":**
```
Contexto:
- Lead confirma agendamento com "okkk"
- Não precisa processar via IA (confirmação simples)
- Vai direto para agendamento

Variações:
"okkk"  → BLOQUEADO
"OKKK"  → BLOQUEADO (toLowerCase)
"ok"    → PERMITIDO (diferente)
"okok"  → PERMITIDO (diferente)
```

**Edge Cases:**
- n8n_ativo = "Disparo Realizado" (uppercase D/R) → PERMITE (não é exata match)
- mensagem = "OKKK " (com espaço) → BLOQUEADO (toLowerCase não afeta espaço, mas != funciona)
- mensagem = null → ERROR (null.toLowerCase())

**Loose Type Validation:**
```javascript
// Com loose:
"disparo realizado" == "disparo realizado"  → TRUE
null == undefined  → TRUE

// Mais permissivo em comparações de tipo
```

**Recomendação:**
```javascript
// Adicionar null check:
$('Tipo de mensagem').item.json.mensagem?.toLowerCase().trim() != "okkk"
```

---

#### 4.3.3 Nó: "Deve enviar mensagem?"
**ID:** `c9be966e-1ef5-4c5f-8ea1-7050dd2840d5`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.filter |
| **Type Version** | 2.2 |
| **Position** | [8400, 224] |

**Configuração:**
```javascript
{
  caseSensitive: true,
  typeValidation: "strict",
  combinator: "and"
}
```

**Condições:**

##### Condição 1: Processo correto
```javascript
NOT (
  $json.waiting_process_id
  AND
  $json.waiting_process_id !== $('Info').first().json.process_id
)

Operator: boolean.false
Simplified:
  SE waiting_process_id existe E é diferente do atual → BLOQUEIA
  SENÃO → PERMITE
```

**Lógica de Decisão:**
```
PERMITE enviar mensagem SE:
  - waiting_process_id é vazio/null
  OU
  - waiting_process_id = process_id atual

BLOQUEIA SE:
  - waiting_process_id existe MAS é diferente do process_id atual
```

**Outputs:**
- **PASS** → Pode enviar mensagem
- **BLOCKED** → Aguardando resposta de outro processo, não enviar

**Propósito:**
- Evitar enviar mensagem de processo antigo
- Garantir que apenas o processo atual envia mensagem
- Prevenir duplicatas

**Cenários:**

##### Cenário 1: Nova conversa
```javascript
waiting_process_id = null
process_id = "abc123"

Resultado: PASS (pode enviar)
```

##### Cenário 2: Mesma conversa continuando
```javascript
waiting_process_id = "abc123"
process_id = "abc123"

Resultado: PASS (processo correto)
```

##### Cenário 3: Processo antigo
```javascript
waiting_process_id = "old-process"
process_id = "new-process"

Resultado: BLOCKED (processo diferente, não enviar!)
```

**Diagrama de Fluxo:**
```
┌─────────────────────────────────────┐
│ Verificar waiting_process_id        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴───────┐
        │              │
   null/empty       existe
        │              │
        ▼              ▼
     ✅ PASS   ┌─────────────┐
               │ Comparar com│
               │ process_id  │
               └──────┬──────┘
                      │
               ┌──────┴───────┐
               │              │
             igual        diferente
               │              │
               ▼              ▼
            ✅ PASS       ❌ BLOCK
```

**Edge Cases:**
- waiting_process_id = "" (string vazia) → PASS (empty = null)
- process_id = undefined → BLOCK (undefined !== "abc")
- Ambos null → PASS

**Recomendação:**
```javascript
// Adicionar log para debug:
IF (blocked) {
  console.log(`Blocked: waiting=${waiting_process_id}, current=${process_id}`)
}
```

---

### 4.4 CATEGORIA: WAIT

#### 4.4.1 Nó: "Esperar" (18s)
**ID:** `3924ac37-fef7-4061-9058-8e56b0bbc595`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.wait |
| **Type Version** | 1.1 |
| **Position** | [1920, 400] |
| **Webhook ID** | 67355af6-0306-4b13-a57e-a5f53e8a9790 |

**Configuração:**
```javascript
{
  amount: 18  // segundos
}
```

**Propósito:**
- Aguardar acúmulo de mensagens do lead
- Evitar processar cada mensagem individualmente
- Batch de mensagens antes de enviar para IA

**Lógica:**
```
1. Lead envia mensagem 1
2. Entra em fila (Postgres)
3. WAIT 18 segundos
4. Lead envia mensagem 2 (durante o wait)
5. Mensagem 2 também entra na fila
6. Após 18s, busca TODAS mensagens da fila
7. Processa em lote
```

**Vantagens:**
- Economia de tokens da IA (1 chamada ao invés de N)
- Contexto completo (mensagens não fragmentadas)
- Evita interromper lead enquanto digita

**Desvantagens:**
- Lead aguarda 18s para primeira resposta
- Se lead enviar mensagem espaçada (>18s), processa separado

**Webhook:**
- ID: `67355af6-0306-4b13-a57e-a5f53e8a9790`
- Permite resumo externo se necessário
- Workflow fica "pausado" aguardando timeout ou trigger

**Timing Detalhado:**
```
T+0s:  Mensagem chega
T+1s:  Enfileirada
T+1s:  WAIT inicia
T+5s:  Lead envia outra mensagem → também enfileirada
T+10s: Lead envia mais uma → também enfileirada
T+19s: WAIT termina
T+19s: Busca 3 mensagens da fila
T+20s: Envia para IA em lote
```

**Edge Cases:**
- Lead envia mensagem exatamente aos 18s → Pode perder (race condition)
- Workflow reinicia durante wait → Perde estado (wait não é persistente)

**Recomendação:**
```javascript
// Considerar wait dinâmico:
amount: {{ $json.urgencia === "alta" ? 5 : 18 }}

// Ou wait adaptativo:
- Primeira mensagem: 18s
- Mensagens subsequentes: 8s
```

---

#### 4.4.2 Nó: "Wait" (15s)
**ID:** `11de321d-a084-4df0-8233-45aef2b9a3ea`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.wait |
| **Type Version** | 1.1 |
| **Position** | [3920, 560] |
| **Webhook ID** | 389b1db5-6082-4683-aa47-d868d578e5ec |

**Configuração:**
```javascript
{
  amount: 15  // segundos
}
```

**Propósito:**
- Aguardar IA terminar processamento
- Evitar sobrecarga de chamadas simultâneas
- Dar tempo para conversa "ativa" finalizar

**Contexto:**
- Vem do branch "Aguardar" do switch "Ação Planejada"
- Significa: IA está processando, aguarde antes de enviar nova mensagem

**Lógica:**
```
1. Nova mensagem chega
2. Verifica conversa ativa → status = "active"
3. IA ainda processando → WAIT 15s
4. Após 15s, tenta novamente
5. Se ainda ativa → Incrementa retries e aguarda novamente
6. Se retries > 10 → Ignora (evita loop infinito)
```

**Retry Loop:**
```
T+0s:   Mensagem chega
T+0s:   Status = active, retries = 0 → WAIT 15s
T+15s:  Verifica novamente → status = active, retries = 1 → WAIT 15s
T+30s:  Verifica novamente → status = active, retries = 2 → WAIT 15s
...
T+150s: retries = 10 → Ainda ativo? → WAIT 15s
T+165s: retries = 11 → IGNORA (timeout final)
```

**Timeout Total:**
```
15s × 11 tentativas = 165 segundos = 2min45s
```

**Webhook:**
- ID: `389b1db5-6082-4683-aa47-d868d578e5ec`
- Permite resumo externo
- Estado não persiste entre reinícios

**Edge Cases:**
- IA trava e nunca muda status → Atinge timeout de 11 retries
- Workflow reinicia durante wait → Perde contagem de retries
- Lead envia 50 mensagens em 1 minuto → Múltiplos waits paralelos

**Problema Identificado:**
```javascript
// Se IA demora 3 minutos:
- retries = 11 → Ignora mensagem (PERDEU MENSAGEM!)

// Melhor: Transferir para humano ao invés de ignorar
```

**Recomendação:**
```javascript
// No switch "Ação Planejada", branch "Ignorar":
IF retries > 10:
  → Transferir para atendente humano
  → Notificar erro no sistema
  → Salvar mensagem para retry manual
```

---

#### 4.4.3 Nó: "1.5s"
**ID:** `f74c8137-c4a1-4f31-81e8-2145c3f865fc`

| Atributo | Valor |
|----------|-------|
| **Type** | n8n-nodes-base.wait |
| **Type Version** | 1.1 |
| **Position** | [10624, 320] |
| **Webhook ID** | bbd4d6aa-da37-4ced-b768-193d47782b1b |

**Configuração:**
```javascript
{
  amount: 1.5  // segundos
}
```

**Propósito:**
- Delay entre envios de mensagem
- Evitar rate limit do GHL
- Simular digitação humana

**Contexto:**
- Vem após roteamento de canal (WhatsApp/Instagram)
- Antes de chamar API GHL para enviar mensagem
- Pequeno delay para parecer mais natural

**Rate Limiting:**
```
GHL Limits:
- WhatsApp: ?
- Instagram: ?

Com 1.5s delay:
- Max 40 mensagens/minuto (60s / 1.5s)
```

**Lógica:**
```
1. IA gerou mensagem
2. Roteou para canal (WhatsApp/IG)
3. WAIT 1.5s
4. Envia via GHL API
```

**UX Benefit:**
```
Lead percebe delay como:
- IA "pensando"
- Resposta mais natural
- Menos "robótico"

Ao invés de:
- Resposta instantânea = "isso é bot!"
```

**Webhook:**
- ID: `bbd4d6aa-da37-4ced-b768-193d47782b1b`
- Resumo assíncrono possível

**Edge Cases:**
- Mensagem muito longa → Mesmo delay (poderia ser proporcional)
- Urgência alta → Mesmo delay (poderia pular)

**Recomendação:**
```javascript
// Delay proporcional ao tamanho:
amount: Math.min(
  1.5 + ($json.output.length / 100),
  5  // max 5s
)

// Ou pular delay se urgente:
amount: $json.urgencia === "alta" ? 0 : 1.5
```

---

## 5. FLUXO DE DECISÃO

### 5.1 Árvore de Decisão Completa

```
                            ┌──────────────────┐
                            │ WEBHOOK RECEBIDO │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ IA Ativa? (IF)  │
                            └────┬────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
                  FALSE                     TRUE
                    │                         │
                    ▼                         ▼
              [FIM - BLOQUEADO]    ┌──────────────────────────┐
                                   │ Tipo de mensagem (SWITCH)│
                                   └────┬─────────────────────┘
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┬────────────┐
        │               │               │               │               │            │
    /reset           /teste          Texto          Imagem           Áudio    mensagem vazia
        │               │               │               │               │            │
        ▼               ▼               │               ▼               ▼            ▼
  [Reset Flow]    [Teste Flow]         │         [Img Process]   [Audio Process]  [Error]
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Esperar (WAIT)   │
                              │ 18 segundos      │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────────┐
                              │ Buscar mensagens     │
                              │ (Postgres)           │
                              └────────┬─────────────┘
                                       │
                                       ▼
                              ┌──────────────────────┐
                              │ Limpar fila          │
                              │ (Postgres)           │
                              └────────┬─────────────┘
                                       │
                                       ▼
                              ┌──────────────────────┐
                              │ Conversa Ativa       │
                              │ (Postgres SELECT)    │
                              └────────┬─────────────┘
                                       │
                                       ▼
                              ┌─────────────────────────┐
                              │ Ação Planejada (SWITCH) │
                              └────┬────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
      Iniciar Conversa         Ignorar             Aguardar
              │                    │                    │
              │                    ▼                    ▼
              │               [FIM - IGNORE]   ┌──────────────┐
              │                                │ Wait (15s)   │
              │                                └──────┬───────┘
              │                                       │
              │                                       ▼
              │                              [RETRY: +1 retries]
              │                                       │
              │                              ┌────────┴────────┐
              │                              │                 │
              │                         retries ≤ 10      retries > 10
              │                              │                 │
              │                              └─► [LOOP BACK]   └─► Ignorar
              │
              ▼
      ┌──────────────────┐
      │ Permitido AI?    │
      │ (FILTER)         │
      └────┬─────────────┘
           │
      ┌────┴────┐
      │         │
    BLOCK     PASS
      │         │
      ▼         ▼
   [FIM]  ┌──────────────────┐
          │ Salvar Inicio IA │
          │ (Postgres)       │
          └────┬─────────────┘
               │
               ▼
          ┌──────────────────┐
          │ Mensagens        │
          │ anteriores       │
          │ (Postgres)       │
          └────┬─────────────┘
               │
               ▼
          [PROCESSAMENTO IA]
          [OpenAI/Claude]
               │
               ▼
          ┌──────────────────┐
          │ Memoria Lead     │
          │ (Postgres INSERT)│
          └────┬─────────────┘
               │
               ▼
          ┌──────────────────┐
          │ Tudo certo?4 (IF)│
          └────┬─────────────┘
               │
          ┌────┴─────┐
          │          │
        TRUE       FALSE
          │          │
          │          ▼
          │    [Error Handler]
          │
          ▼
     ┌──────────────────────┐
     │ Filter (length > 2)  │
     └────┬─────────────────┘
          │
     ┌────┴─────┐
     │          │
   BLOCK      PASS
     │          │
     ▼          ▼
  [FIM]   ┌──────────────────────────┐
          │ Tipo de mensagem1 (SWITCH)│
          └────┬─────────────────────┘
               │
               └─► Texto ──┐
                           │
                           ▼
               ┌─────────────────────────┐
               │ If (waiting_process_id?)│
               └────┬────────────────────┘
                    │
               ┌────┴─────┐
               │          │
             TRUE       FALSE
               │          │
               ▼          ▼
          [AGUARDAR]  ┌──────────────────────────────┐
                      │ Deve enviar mensagem? (FILTER)│
                      └────┬─────────────────────────┘
                           │
                      ┌────┴─────┐
                      │          │
                    BLOCK      PASS
                      │          │
                      ▼          ▼
                   [FIM]   ┌──────────────────┐
                           │ Atualizar resposta│
                           │ IA (Postgres)    │
                           └────┬─────────────┘
                                │
                                ▼
                           ┌──────────────────┐
                           │ Conversa ativa   │
                           │ atualizada       │
                           └────┬─────────────┘
                                │
                                ▼
                           ┌──────────────────┐
                           │ If1 (valida JSON)│
                           └────┬─────────────┘
                                │
                           ┌────┴─────┐
                           │          │
                         TRUE       FALSE
                           │          │
                           │          ▼
                           │    [Error Handler]
                           │
                           ▼
                      ┌──────────────────┐
                      │ Canal (SWITCH)   │
                      └────┬─────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
          WhatsApp                  Instagram
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                      ┌──────────────────┐
                      │ 1.5s (WAIT)      │
                      └────┬─────────────┘
                           │
                           ▼
                      ┌──────────────────┐
                      │ GHL Send Message │
                      └────┬─────────────┘
                           │
                           ▼
                      ┌──────────────────┐
                      │ Termino resposta │
                      │ (Postgres DELETE)│
                      └────┬─────────────┘
                           │
                           ▼
                        [FIM OK]
```

### 5.2 Fluxo de Classificação (Paralelo)

```
                    ┌──────────────────────┐
                    │ OpenAI Classificação │
                    └────┬─────────────────┘
                         │
                         ▼
                    ┌─────────────────────────┐
                    │ 4️⃣ Switch Objetivo      │
                    └────┬────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    Carreira       Consultoria      Indefinido
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │Canal4  │      │Canal4  │      │Canal4  │
    │(SWITCH)│      │(SWITCH)│      │(SWITCH)│
    └───┬────┘      └───┬────┘      └───┬────┘
        │               │               │
   ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
   │         │     │         │     │         │
WhatsApp Instagram WhatsApp Instagram WhatsApp Instagram
   │         │     │         │     │         │
   └────┬────┘     └────┬────┘     └────┬────┘
        │               │               │
        ▼               ▼               ▼
   [GHL Update]   [GHL Update]   [GHL Update]
   [Pipeline]     [Pipeline]     [Pipeline]
```

---

## 6. REFERÊNCIA RÁPIDA

### 6.1 Tabela de Nós por Tipo

| Tipo | Nós | Propósito |
|------|-----|-----------|
| **Switch** | Tipo de mensagem, Ação Planejada, Tipo de mensagem1, Canal, Canal2, 4️⃣ Switch Objetivo, Canal4 | Roteamento multi-branch |
| **If** | IA Ativa?, If (waiting_process_id?), If1 (valida JSON), Tudo certo?4 | Decisões binárias |
| **Filter** | Filter (length > 2), Permitido AI?, Deve enviar mensagem? | Bloqueio/permissão |
| **Wait** | Esperar (18s), Wait (15s), 1.5s | Delays e pausas |

### 6.2 Configurações por Nó

| Nó | Type Validation | Case Sensitive | Combinator | Outputs |
|----|----------------|----------------|------------|---------|
| Tipo de mensagem | strict | TRUE | AND | 6 |
| Ação Planejada | strict | TRUE | AND | 3 |
| Tipo de mensagem1 | strict | TRUE | AND | 1 |
| Canal | strict | TRUE | - | 2 |
| Canal2 | loose | TRUE | AND | 2 |
| 4️⃣ Switch Objetivo | strict | TRUE | AND | 3 |
| Canal4 | loose | TRUE | AND | 2 |
| IA Ativa? | strict | TRUE | OR | 2 |
| If (waiting_process_id?) | strict | TRUE | AND | 2 |
| If1 (valida JSON) | strict | TRUE | AND | 2 |
| Tudo certo?4 | strict | TRUE | AND | 2 |
| Filter (length > 2) | strict | TRUE | AND | 1 |
| Permitido AI? | loose | TRUE | AND | 1 |
| Deve enviar mensagem? | strict | TRUE | AND | 1 |
| Esperar | - | - | - | 1 |
| Wait | - | - | - | 1 |
| 1.5s | - | - | - | 1 |

### 6.3 Condições Críticas

#### Segurança (Bloqueios)

| Nó | Condição | Ação |
|----|----------|------|
| IA Ativa? | ativar_ia != "sim" AND etiquetas NOT CONTAINS "assistente-admin" | BLOQUEIA execução |
| Permitido AI? | n8n_ativo = "disparo realizado" OR mensagem = "okkk" | BLOQUEIA IA |
| Filter (length > 2) | output.length ≤ 2 | BLOQUEIA envio |
| Deve enviar mensagem? | waiting_process_id ≠ process_id | BLOQUEIA envio |

#### Validação de Qualidade

| Nó | Condição | Ação |
|----|----------|------|
| Tudo certo?4 | output CONTAINS "<ctrl" OR output IS_EMPTY | BLOQUEIA (erro IA) |
| If1 (valida JSON) | output CONTAINS ("json", "{", "output", "parsed", "split", "properties", "type") | BLOQUEIA (vazou código) |

#### Controle de Fluxo

| Nó | Condição | Ação |
|----|----------|------|
| Ação Planejada | isEmpty() OR status="inactive" OR timeout>1min | Iniciar Conversa |
| Ação Planejada | retries > 10 OR processo diferente | Ignorar |
| Ação Planejada | status = "active" | Aguardar 15s |
| If (waiting_process_id?) | waiting_process_id EXISTS | Aguardar resposta |

### 6.4 Timing e Delays

| Nó | Delay | Propósito |
|----|-------|-----------|
| Esperar | 18s | Acumular mensagens do lead |
| Wait | 15s | Aguardar IA processar (retry) |
| 1.5s | 1.5s | Simular digitação humana |

**Timeout Total:**
```
Cenário 1: Lead envia 1 mensagem
  → 18s (acúmulo) + IA + 1.5s (envio) ≈ 20-25s

Cenário 2: IA já está ativa (retry)
  → 15s × 11 retries = 165s = 2min45s (max)

Cenário 3: Comando /reset
  → Imediato (pula waits)
```

### 6.5 Edge Cases e Problemas

| Nó | Problema | Impacto | Recomendação |
|----|----------|---------|--------------|
| Canal | Espaço extra em "whatsapp " | Falha de match | Usar trim() e toLowerCase() |
| If1 | Palavras "tipo" e "properties" muito genéricas | Falsos positivos | Validação mais específica (regex JSON) |
| Filter (length > 2) | Conta espaços como válidos | Envia mensagens vazias | Usar trim() antes |
| Ação Planejada | retries > 10 → Ignora mensagem | Perde mensagens | Transferir para humano |
| Tipo de mensagem | Nenhum fallback | Execução para silenciosamente | Adicionar branch "Outro" |
| 4️⃣ Switch Objetivo | Sem default output | Para se IA retornar valor inesperado | Adicionar fallback "Indefinido" |

### 6.6 Melhorias Sugeridas

#### Alta Prioridade

1. **Canal/Canal2/Canal4**: Normalizar comparação
```javascript
// Antes:
"whatsapp " EQUALS $json.source

// Depois:
"whatsapp" EQUALS $json.source.toLowerCase().trim()
```

2. **If1**: Validação JSON mais precisa
```javascript
// Antes:
NOT_CONTAINS "type"  // Muito genérico!

// Depois:
NOT_MATCHES /^[\{\[].*[\}\]]$/  // Regex para JSON
```

3. **Ação Planejada**: Adicionar fallback para retries > 10
```javascript
// Adicionar no branch "Ignorar":
→ Transferir para atendente humano
→ Salvar mensagem para retry manual
```

#### Média Prioridade

4. **Filter (length > 2)**: Usar trim
```javascript
$json.output.trim().length > 2
```

5. **4️⃣ Switch Objetivo**: Adicionar default output
```javascript
// Adicionar branch 4:
Default: "Indefinido"
```

6. **Tipo de mensagem**: Adicionar fallback
```javascript
// Adicionar branch 7:
Default: "Outro"
→ Log para monitoramento
```

#### Baixa Prioridade

7. **Wait delays**: Tornar dinâmicos
```javascript
// Esperar:
amount: $json.urgencia === "alta" ? 5 : 18

// 1.5s:
amount: Math.min(1.5 + ($json.output.length / 100), 5)
```

8. **Loose Type Validation**: Padronizar para strict
```javascript
// Canal2, Canal4, Permitido AI:
typeValidation: "strict"  // Consistência
```

### 6.7 Mapa de Posições

```
                    Y-axis
                      │
  -1200 ─────────────────────────────────
        │
  -1000 ─ 4️⃣ Switch Objetivo [1968, -1168]
        │ Canal4 [2192, -960]
   -500 ─ Canal2 [2960, -528]
        │
      0 ─────────────────────────────────
        │
    200 ─────────────────────────────────
        │
    300 ─ Filter [7056, 368]
        │ Tipo de mensagem1 [7504, 368]
        │ If [7952, 368]
        │ Canal [10176, 320]
        │ 1.5s [10624, 320]
        │ If1 [9280, 320]
    400 ─ IA Ativa? [656, 384]
        │ Tipo de mensagem [880, 352]
        │ Ação Planejada [3472, 400]
        │ Permitido AI? [3712, 384]
        │ Esperar [1920, 400]
        │ Tudo certo?4 [6832, 384]
    560 ─ Wait [3920, 560]
        │
        └─────────────────────────────────
                    X-axis →
```

### 6.8 Dependências entre Nós

```
IA Ativa?
  ↓
Tipo de mensagem
  ↓
Esperar (18s)
  ↓
[Postgres: Buscar mensagens]
  ↓
[Postgres: Limpar fila]
  ↓
[Postgres: Conversa Ativa]
  ↓
Ação Planejada
  ├─ Iniciar Conversa
  │    ↓
  │  Permitido AI?
  │    ↓
  │  [Processamento IA]
  │    ↓
  │  Tudo certo?4
  │    ↓
  │  Filter (length > 2)
  │    ↓
  │  Tipo de mensagem1
  │    ↓
  │  If (waiting_process_id?)
  │    ↓
  │  Deve enviar mensagem?
  │    ↓
  │  If1 (valida JSON)
  │    ↓
  │  Canal
  │    ↓
  │  1.5s
  │
  ├─ Aguardar
  │    ↓
  │  Wait (15s)
  │    ↓
  │  [RETRY LOOP]
  │
  └─ Ignorar
       ↓
     [FIM]
```

---

## CHANGELOG

| Data | Versão | Descrição |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentação inicial completa dos nós de controle de fluxo |

---

*Documento gerado para escalabilidade da operação BPO Mottivme Sales - Análise de Control Flow Nodes*
