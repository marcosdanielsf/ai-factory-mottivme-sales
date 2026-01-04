# GUIA COMPLETO DOS NOS UTILITIES - FLUXO PRINCIPAL GHL MOTTIVME

## INDICE
1. [Visao Geral](#visao-geral)
2. [Tipos de Utilitarios](#tipos-de-utilitarios)
3. [Mapa de Relacionamentos](#mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#detalhamento-por-categoria)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Referencia Rapida](#referencia-rapida)

---

## 1. VISAO GERAL

### Resumo Executivo
O fluxo principal do GHL Mottivme utiliza **10 nos Utilities** organizados em **5 categorias funcionais**:

| Categoria | Quantidade | Proposito |
|-----------|------------|-----------|
| Execution Data | 4 | Persistir dados entre nos e execucoes |
| Split/Merge | 2 | Segmentar e iterar sobre arrays de dados |
| File Operations | 2 | Converter entre formatos binario e JSON |
| Workflow Execution | 1 | Chamar workflows externos |
| NoOp | 1 | Ponto de passagem/placeholder |

### Importancia dos Utilitarios
Os nos de utilidades sao fundamentais para:
- **Persistencia de contexto** entre nos distantes no workflow
- **Segmentacao de dados** para processamento individual
- **Integracao** com workflows externos
- **Manipulacao de arquivos** (audio, imagens, documentos)

---

## 2. TIPOS DE UTILITARIOS

### 2.1 Execution Data (`n8n-nodes-base.executionData`)
**Proposito:** Salvar dados que precisam ser acessados em qualquer ponto da execucao

| Caracteristica | Descricao |
|----------------|-----------|
| **Persistencia** | Dados ficam disponiveis em toda a execucao |
| **Acesso** | Via `$execution.customData.get('key')` ou painel de execucao |
| **Uso comum** | IDs, nomes, contexto do lead, metricas |
| **Visibilidade** | Aparece no painel "Custom Data" da execucao |

### 2.2 Split In Batches (`n8n-nodes-base.splitInBatches`)
**Proposito:** Iterar sobre arrays processando N itens por vez

| Caracteristica | Descricao |
|----------------|-----------|
| **Modo** | Loop controlado com batches configuraveis |
| **Saidas** | 2 saidas: "loop" (continua) e "done" (fim) |
| **Uso comum** | Enviar multiplas mensagens, processar listas |
| **Controle** | Pode pausar entre iteracoes |

### 2.3 Split Out (`n8n-nodes-base.splitOut`)
**Proposito:** Transformar array em itens individuais

| Caracteristica | Descricao |
|----------------|-----------|
| **Operacao** | Explode array em multiplos itens de saida |
| **Configuracao** | Campo a explodir, nome do campo destino |
| **Uso comum** | Segmentar mensagens da IA para envio individual |

### 2.4 Extract from File (`n8n-nodes-base.extractFromFile`)
**Proposito:** Extrair dados de arquivos binarios

| Caracteristica | Descricao |
|----------------|-----------|
| **Operacao** | binaryToProperty (binario para JSON) |
| **Suporte** | PDF, imagens, audio, documentos |
| **Uso comum** | Processar audio de WhatsApp, documentos enviados |

### 2.5 Convert to File (`n8n-nodes-base.convertToFile`)
**Proposito:** Converter dados JSON para formato binario

| Caracteristica | Descricao |
|----------------|-----------|
| **Operacao** | toBinary (JSON para binario) |
| **Configuracao** | Nome do arquivo, MIME type |
| **Uso comum** | Preparar arquivos para upload |

### 2.6 Execute Workflow (`n8n-nodes-base.executeWorkflow`)
**Proposito:** Chamar outro workflow como sub-rotina

| Caracteristica | Descricao |
|----------------|-----------|
| **Modo** | Sincrono (espera resultado) ou assincrono |
| **Inputs** | Mapeamento de dados para o workflow filho |
| **Uso comum** | Registrar custos, notificacoes, tarefas auxiliares |

### 2.7 NoOp (`n8n-nodes-base.noOp`)
**Proposito:** Ponto de passagem sem operacao

| Caracteristica | Descricao |
|----------------|-----------|
| **Operacao** | Nenhuma - apenas passa dados adiante |
| **Uso comum** | Placeholder, organizacao visual, merge points |

---

## 3. MAPA DE RELACIONAMENTOS

```
+------------------------------------------------------------------------------+
|                    FLUXO DE DADOS - UTILITIES                                 |
+------------------------------------------------------------------------------+

ENTRADA (Webhook)
        |
        v
+-------------------+
| Execution Data5   |  <-- Salva: contact_id, location_name, agente_ia
| (Inicio)          |      Fonte: body.contact_id, body.location.name
+-------------------+
        |
        v
   [Processamento inicial]
        |
        v
+-------------------+
| Execution Data    |  <-- Salva: lead_id, lead_name, location_name, telefone
| (Pos-Info)        |      Fonte: $('Info').item.json.*
+-------------------+
        |
        v
   [Branch: Arquivo de audio?]
        |
        +-------------------+
        |                   |
        v                   v
+-------------------+  +-------------------+
| Extract from File |  | [Continua sem     |
| (Audio -> Base64) |  |  arquivo]         |
+-------------------+  +-------------------+
        |
        v
+-------------------+
| Convert to File   |  <-- Reconstroi arquivo com nome/MIME corretos
| (Base64 -> Binary)|
+-------------------+
        |
        v
   [Processamento IA]
        |
        v
+-------------------+
| Execution Data2   |  <-- Salva: agente_ia
| (Pre-Parser)      |      Para rastreabilidade
+-------------------+
        |
        v
+-------------------+
| Segmentos1        |  <-- Explode output.messages em itens individuais
| (Split Out)       |      Cada mensagem vira item separado
+-------------------+
        |
        v
+-------------------+
| Loop Over Items3  |  <-- Itera sobre cada segmento de mensagem
| (Split In Batches)|      Saida 0: Loop | Saida 1: Done
+-------------------+
        |
        +-----------> [Envio de mensagem individual]
        |
        v (quando termina loop)
+-------------------+
| no.op             |  <-- Ponto de convergencia / placeholder
+-------------------+
        |
        v
+-------------------+
| Execution Data1   |  <-- Salva: a_lead_response (resposta completa)
| (Pos-Parser)      |      Fonte: Parser Chain output
+-------------------+
        |
        v
+-------------------+
| Call Track AI Cost|  <-- Workflow externo: [TOOL] Registrar Custo IA
| (Execute Workflow)|      Inputs: tokens, custos, contact_id, etc.
+-------------------+
        |
        v
   [Finalizacao]
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 CATEGORIA: EXECUTION DATA

#### 4.1.1 No: "Execution Data5"
**ID:** `8e3e4049-8662-4f80-b877-3682c8ed9a9e`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.executionData |
| **Versao** | 1.1 |
| **Posicao** | [-144, 400] |
| **Fase no Workflow** | Inicio (pos-webhook) |

**Dados Salvos:**
```javascript
{
  "contact_id": "{{ $json.body.contact_id }}",
  "location_name": "{{ $json.body.location.name }}",
  "agente_ia": "{{ $json.agente_ia }}"
}
```

**Proposito:**
Primeiro ponto de persistencia no workflow. Captura dados essenciais do webhook antes de qualquer processamento:
- `contact_id`: Identificador unico do contato no GHL
- `location_name`: Nome da sub-conta GHL
- `agente_ia`: Identificador do agente de IA a ser usado

**Acesso Posterior:**
```javascript
// Em qualquer no subsequente:
$execution.customData.get('contact_id')
$execution.customData.get('location_name')
$execution.customData.get('agente_ia')
```

**Visualizacao:**
Aparece no painel de execucao em "Custom Data", facilitando debug e monitoramento.

---

#### 4.1.2 No: "Execution Data"
**ID:** `cb90f49f-deca-4845-a187-22df16c6b7d7`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.executionData |
| **Versao** | 1.1 |
| **Posicao** | [3872, 384] |
| **Fase no Workflow** | Pos-processamento inicial |

**Dados Salvos:**
```javascript
{
  "a_lead_id": "{{ $('Info').item.json.lead_id }}",
  "a_lead_name": "{{ $('Info').item.json.full_name }}",
  "location_name": "{{ $('Info').first().json.location_name }}",
  "telefone": "{{ $('Info').item.json.telefone }}"
}
```

**Proposito:**
Persiste dados do lead apos processamento pelo no "Info". Prefixo `a_` garante ordenacao alfabetica no painel:
- `a_lead_id`: ID do lead no GHL
- `a_lead_name`: Nome completo do lead
- `location_name`: Location GHL (reafirmado)
- `telefone`: Numero de telefone do lead

**Dependencia:**
Depende do no "Info" ter processado os dados do webhook.

**Uso Tipico:**
Estes dados sao usados em:
- Identificacao de logs
- Personalizacao de mensagens
- Tracking de conversoes

---

#### 4.1.3 No: "Execution Data2"
**ID:** `091ed666-f666-46f4-aa9e-0c566e6ee808`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.executionData |
| **Versao** | 1.1 |
| **Posicao** | [9504, 320] |
| **Fase no Workflow** | Pre-Parser Chain |

**Dados Salvos:**
```javascript
{
  "agente_ia": "{{ $('Info').first().json.agente_ia }}"
}
```

**Proposito:**
Persiste o identificador do agente de IA usado antes do parsing final. Util para:
- Rastreabilidade de qual agente processou a conversa
- Debug de comportamentos diferentes por agente
- Metricas por tipo de agente

**Posicionamento:**
Localizado estrategicamente antes do Parser Chain para garantir que a informacao do agente seja preservada independente do resultado do parsing.

---

#### 4.1.4 No: "Execution Data1"
**ID:** `71e5e6c0-cb86-48de-b14c-3e875584b9ab`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.executionData |
| **Versao** | 1.1 |
| **Posicao** | [10352, 32] |
| **Fase no Workflow** | Pos-Parser Chain |

**Dados Salvos:**
```javascript
{
  "a_lead_response": "{{ $('Parser  Chain').item.json.output.messages.join('') }}"
}
```

**Proposito:**
Captura a resposta completa gerada pela IA apos parsing:
- `a_lead_response`: Todas as mensagens concatenadas

**Formato de Entrada:**
O Parser Chain retorna um objeto com estrutura:
```javascript
{
  "output": {
    "messages": ["Mensagem 1", "Mensagem 2", "..."]
  }
}
```

**Uso:**
- Auditoria da resposta gerada
- Debug de problemas de resposta
- Integracao com sistemas de qualidade

**Nota sobre o Nome:**
Ha um espaco duplo em `'Parser  Chain'` - isso e o nome exato do no referenciado.

---

### 4.2 CATEGORIA: SPLIT/MERGE

#### 4.2.1 No: "Segmentos1"
**ID:** `7347c31a-e682-4c36-b47a-5eff12eddad2`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.splitOut |
| **Versao** | 1 |
| **Posicao** | [9728, 320] |
| **Always Output Data** | Sim |

**Configuracao:**
```javascript
{
  "fieldToSplitOut": "output.messages",
  "options": {
    "destinationFieldName": "output"
  }
}
```

**Proposito:**
Transforma o array de mensagens da IA em itens individuais para envio sequencial.

**Entrada (1 item):**
```javascript
{
  "output": {
    "messages": [
      "Ola! Como posso ajudar?",
      "Temos otimas opcoes para voce.",
      "Quando podemos agendar?"
    ]
  }
}
```

**Saida (3 itens):**
```javascript
// Item 1
{ "output": "Ola! Como posso ajudar?" }

// Item 2
{ "output": "Temos otimas opcoes para voce." }

// Item 3
{ "output": "Quando podemos agendar?" }
```

**Por que Segmentar?**
1. **Naturalidade:** Mensagens enviadas uma por vez parecem mais humanas
2. **Rate Limiting:** Evita bloqueios por envio em massa
3. **Controle:** Permite pausas entre mensagens
4. **Tracking:** Cada mensagem pode ser rastreada individualmente

**Always Output Data:**
Configurado como `true` para garantir que o fluxo continue mesmo se o array estiver vazio.

---

#### 4.2.2 No: "Loop Over Items3"
**ID:** `90c79f43-5deb-465b-b318-a7a9bf1eb88a`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.splitInBatches |
| **Versao** | 3 |
| **Posicao** | [9952, 320] |

**Configuracao:**
```javascript
{
  "options": {}
}
```

**Saidas:**
| Saida | Nome | Proposito |
|-------|------|-----------|
| 0 | Loop | Proximo item a processar |
| 1 | Done | Quando todos items processados |

**Funcionamento:**
```
[Segmentos1: 3 mensagens]
        |
        v
+-------------------+
| Loop Over Items3  |
+-------------------+
        |
        +--> Saida 0 (Loop): Mensagem 1
        |         |
        |         v
        |    [Enviar Mensagem]
        |         |
        |         v
        |    [Volta para Loop]
        |
        +--> Saida 0 (Loop): Mensagem 2
        |         ...
        |
        +--> Saida 1 (Done): Todas enviadas
                  |
                  v
             [no.op]
```

**Uso no Workflow:**
1. Recebe itens do "Segmentos1"
2. Para cada item, aciona a saida 0 (Loop)
3. Apos processar todos, aciona saida 1 (Done)
4. Permite adicionar delays entre iteracoes

**Opcoes Disponiveis (nao usadas):**
- `batchSize`: Numero de itens por batch (padrao: 1)
- `reset`: Se deve reiniciar o contador

---

### 4.3 CATEGORIA: FILE OPERATIONS

#### 4.3.1 No: "Extract from File"
**ID:** `da710893-fa14-41bf-b74d-691b61a18645`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.extractFromFile |
| **Versao** | 1 |
| **Posicao** | [1936, 832] |

**Configuracao:**
```javascript
{
  "operation": "binaryToPropery",  // Nota: typo no n8n
  "options": {}
}
```

**Operacao:** Converte dados binarios em propriedade JSON (Base64)

**Entrada Esperada:**
```javascript
{
  "binary": {
    "data": {
      "data": "<BINARIO>",
      "mimeType": "audio/ogg",
      "fileName": "voice_message.ogg"
    }
  }
}
```

**Saida:**
```javascript
{
  "data": "<BASE64_STRING>",
  "mimeType": "audio/ogg",
  "fileName": "voice_message.ogg"
}
```

**Uso no Workflow:**
Usado para processar audios de WhatsApp recebidos. O audio e extraido do formato binario para Base64, permitindo:
- Envio para APIs de transcricao
- Armazenamento em banco de dados
- Processamento por modelos de IA

**Tipos de Arquivo Suportados:**
- Audio: `audio/ogg`, `audio/mpeg`, `audio/wav`
- Imagens: `image/jpeg`, `image/png`, `image/gif`
- Documentos: `application/pdf`, `text/plain`

---

#### 4.3.2 No: "Convert to File"
**ID:** `209bea72-3b8d-4a57-ad5b-3f318b7ab87e`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.convertToFile |
| **Versao** | 1.1 |
| **Posicao** | [2384, 832] |

**Configuracao:**
```javascript
{
  "operation": "toBinary",
  "sourceProperty": "data",
  "options": {
    "fileName": "={{ $json.fileName }}",
    "mimeType": "={{ $json.mimeType }}"
  }
}
```

**Operacao:** Converte dados JSON (Base64) de volta para binario

**Entrada:**
```javascript
{
  "data": "<BASE64_STRING>",
  "fileName": "voice_message.ogg",
  "mimeType": "audio/ogg"
}
```

**Saida:**
```javascript
{
  "binary": {
    "data": {
      "data": "<BINARIO>",
      "mimeType": "audio/ogg",
      "fileName": "voice_message.ogg",
      "fileExtension": "ogg"
    }
  }
}
```

**Por que Converter de Volta?**
1. **Upload para APIs:** Algumas APIs requerem formato binario
2. **Storage:** Salvar em S3/GCS requer binario
3. **Processamento:** Ferramentas de transcricao usam binario
4. **Metadados:** Preserva fileName e mimeType originais

**Fluxo Completo de Arquivos:**
```
[Webhook com audio]
       |
       v
[Extract from File] --> Base64 para processamento
       |
       v
[Processamento/Transcricao]
       |
       v
[Convert to File] --> Binario para armazenamento
       |
       v
[Upload/Storage]
```

---

### 4.4 CATEGORIA: WORKFLOW EXECUTION

#### 4.4.1 No: "Call Track AI Cost"
**ID:** `3124778a-2ba5-4aaf-a038-c8da82371a9d`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.executeWorkflow |
| **Versao** | 1.3 |
| **Posicao** | [10576, 32] |
| **On Error** | Continue Regular Output |

**Workflow Chamado:**
```
ID: GWKl5KuXAdeu4BLr
Nome: [TOOL] Registrar Custo IA
```

**Configuracao de Inputs:**
```javascript
{
  "workflowInputs": {
    "mappingMode": "defineBelow",
    "value": {
      "location_id": "={{ $('Info').first().json.location_id }}",
      "location_name": "={{ $('Info').first().json.location_name }}",
      "contact_id": "={{ $('Info').first().json.lead_id }}",
      "contact_name": "={{ $('Info').first().json.first_name }}",
      "canal": "={{ $('Info').first().json.source }}",
      "tipo_acao": "Agendar",
      "total_tokens": "={{ $('Calcular Custo LLM').first().json.custo_pro.tokens_input + $('Calcular Custo LLM').first().json.custo_pro.tokens_output + $('Calcular Custo LLM').first().json.custo_flash.tokens_input + $('Calcular Custo LLM').first().json.custo_flash.tokens_output }}",
      "output_tokens": "={{ $('Calcular Custo LLM').first().json.custo_pro.tokens_output + $('Calcular Custo LLM').first().json.custo_flash.tokens_output }}",
      "input_tokens": "={{ $('Calcular Custo LLM').first().json.custo_pro.tokens_input + $('Calcular Custo LLM').first().json.custo_flash.tokens_input }}",
      "model": "gemini-2.5-pro+flash",
      "workflowId": "={{ $workflow.id }}",
      "executionId": "={{ $execution.id }}",
      "date": "={{ $now.format('FFFF') }}"
    }
  }
}
```

**Schema de Inputs:**
| Campo | Tipo | Descricao |
|-------|------|-----------|
| date | string | Data formatada da execucao |
| model | string | Modelo(s) de IA usado(s) |
| input_tokens | number | Total de tokens de entrada |
| output_tokens | number | Total de tokens de saida |
| total_tokens | number | Soma de todos os tokens |
| workflowId | string | ID do workflow principal |
| executionId | string | ID da execucao atual |
| location_id | string | ID da location GHL |
| location_name | string | Nome da location |
| contact_id | string | ID do contato |
| contact_name | string | Nome do contato |
| canal | string | Canal de origem (WhatsApp, Instagram, etc.) |
| tipo_acao | string | Tipo de acao ("Agendar") |

**Calculo de Tokens:**
```javascript
// Modelo Pro
tokens_pro = custo_pro.tokens_input + custo_pro.tokens_output

// Modelo Flash
tokens_flash = custo_flash.tokens_input + custo_flash.tokens_output

// Total
total = tokens_pro + tokens_flash
```

**Proposito:**
Registrar metricas de custo de IA para:
- Billing por cliente (location)
- Analise de uso por canal
- Otimizacao de custos
- Relatorios de consumo

**On Error: Continue Regular Output**
Configurado para nao interromper o fluxo principal se o tracking falhar. O registro de custo e secundario em relacao ao atendimento do lead.

---

### 4.5 CATEGORIA: NOOP

#### 4.5.1 No: "no.op"
**ID:** `5a9b5a7e-894f-40c8-91a6-86d744c1d530`

| Atributo | Valor |
|----------|-------|
| **Tipo** | n8n-nodes-base.noOp |
| **Versao** | 1 |
| **Posicao** | [10848, 384] |

**Configuracao:**
```javascript
{
  // Nenhuma configuracao - nao faz nada
}
```

**Proposito no Workflow:**
Serve como ponto de convergencia apos o loop de envio de mensagens.

**Usos Comuns de NoOp:**
1. **Merge Point:** Consolidar multiplos branches
2. **Placeholder:** Marcar local para desenvolvimento futuro
3. **Organizacao Visual:** Separar secoes logicas do workflow
4. **Debug:** Ponto de parada para inspecao de dados
5. **Documentacao:** Usar como "comentario visual"

**Posicionamento:**
Localizado apos o "Loop Over Items3" (saida Done), indicando fim do processamento de segmentos.

**Fluxo:**
```
[Loop Over Items3]
       |
       +--> Saida 0 (Loop): Envia mensagens
       |
       +--> Saida 1 (Done)
                |
                v
           [no.op]  <-- Ponto de convergencia
                |
                v
      [Proximos passos...]
```

---

## 5. FLUXO DE DADOS

### 5.1 Ciclo Completo dos Utilitarios

```
FASE 1: CAPTURA INICIAL
========================
[Webhook recebe mensagem]
         |
         v
+---------------------+
| Execution Data5     |
| - contact_id        |
| - location_name     |
| - agente_ia         |
+---------------------+
         |
         v
[Processamento Info]
         |
         v
+---------------------+
| Execution Data      |
| - a_lead_id         |
| - a_lead_name       |
| - telefone          |
+---------------------+


FASE 2: PROCESSAMENTO DE ARQUIVOS (se houver)
=============================================
[Arquivo binario detectado]
         |
         v
+---------------------+
| Extract from File   |
| Binario -> Base64   |
+---------------------+
         |
         v
[Processamento/Transcricao]
         |
         v
+---------------------+
| Convert to File     |
| Base64 -> Binario   |
+---------------------+
         |
         v
[Upload/Storage]


FASE 3: PROCESSAMENTO IA
========================
[IA processa e gera resposta]
         |
         v
+---------------------+
| Execution Data2     |
| - agente_ia         |
+---------------------+
         |
         v
[Parser Chain processa]


FASE 4: SEGMENTACAO E ENVIO
===========================
[Parser Chain output]
         |
         v
+---------------------+
| Segmentos1          |
| Array -> Itens      |
+---------------------+
         |
         v
+---------------------+
| Loop Over Items3    |
+---------------------+
    |         |
    v         v
  Loop      Done
    |         |
    v         v
[Enviar]   [no.op]
    |
    +---> [Volta ao Loop]


FASE 5: FINALIZACAO E METRICAS
==============================
+---------------------+
| Execution Data1     |
| - a_lead_response   |
+---------------------+
         |
         v
+---------------------+
| Call Track AI Cost  |
| -> Workflow externo |
+---------------------+
         |
         v
[Finalizacao]
```

### 5.2 Interdependencias

```
+------------------+       +------------------+       +------------------+
|  Execution Data5 |  -->  |  Execution Data  |  -->  |  Execution Data2 |
|  (Webhook)       |       |  (Info)          |       |  (Pre-Parser)    |
+------------------+       +------------------+       +------------------+
         |                         |                         |
         v                         v                         v
   contact_id              a_lead_id, etc.            agente_ia
   location_name
   agente_ia                       |
         |                         |                         |
         +-------------------------+-------------------------+
                                   |
                                   v
                          [Dados disponiveis em
                           toda a execucao via
                           $execution.customData]


+------------------+       +------------------+
| Extract from File|  -->  | Convert to File  |
| (Binario->Base64)|       | (Base64->Binario)|
+------------------+       +------------------+
         |                         |
         v                         v
   Processamento             Armazenamento
   de conteudo               de arquivo


+------------------+       +------------------+       +------------------+
|    Segmentos1    |  -->  | Loop Over Items3 |  -->  |      no.op       |
|    (Split Out)   |       | (Split Batches)  |       |  (Convergencia)  |
+------------------+       +------------------+       +------------------+
   3 mensagens -->       Processa 1 por vez -->      Ponto de termino
```

### 5.3 Dados Persistidos por Fase

| Fase | Dados | Fonte | Uso |
|------|-------|-------|-----|
| 1 | contact_id | Webhook body | Identificacao |
| 1 | location_name | Webhook body | Contexto |
| 1 | agente_ia | Webhook | Roteamento |
| 2 | a_lead_id | Info node | Tracking |
| 2 | a_lead_name | Info node | Personalizacao |
| 2 | telefone | Info node | Contato |
| 3 | agente_ia | Info node | Auditoria |
| 4 | a_lead_response | Parser Chain | Historico |

---

## 6. REFERENCIA RAPIDA

### 6.1 Tabela de Nos por Tipo

| Tipo | Nos | Quantidade |
|------|-----|------------|
| Execution Data | Execution Data, Execution Data1, Execution Data2, Execution Data5 | 4 |
| Split Out | Segmentos1 | 1 |
| Split In Batches | Loop Over Items3 | 1 |
| Extract from File | Extract from File | 1 |
| Convert to File | Convert to File | 1 |
| Execute Workflow | Call Track AI Cost | 1 |
| NoOp | no.op | 1 |

### 6.2 Tabela de Nos por ID

| ID | Nome | Tipo |
|----|------|------|
| 8e3e4049-8662-4f80-b877-3682c8ed9a9e | Execution Data5 | executionData |
| cb90f49f-deca-4845-a187-22df16c6b7d7 | Execution Data | executionData |
| 091ed666-f666-46f4-aa9e-0c566e6ee808 | Execution Data2 | executionData |
| 71e5e6c0-cb86-48de-b14c-3e875584b9ab | Execution Data1 | executionData |
| 7347c31a-e682-4c36-b47a-5eff12eddad2 | Segmentos1 | splitOut |
| 90c79f43-5deb-465b-b318-a7a9bf1eb88a | Loop Over Items3 | splitInBatches |
| da710893-fa14-41bf-b74d-691b61a18645 | Extract from File | extractFromFile |
| 209bea72-3b8d-4a57-ad5b-3f318b7ab87e | Convert to File | convertToFile |
| 3124778a-2ba5-4aaf-a038-c8da82371a9d | Call Track AI Cost | executeWorkflow |
| 5a9b5a7e-894f-40c8-91a6-86d744c1d530 | no.op | noOp |

### 6.3 Chaves de Execution Data

| Chave | Origem | Tipo | Uso |
|-------|--------|------|-----|
| contact_id | Webhook | string | ID do contato GHL |
| location_name | Webhook | string | Nome da location |
| agente_ia | Webhook/Info | string | Identificador do agente |
| a_lead_id | Info | string | ID do lead |
| a_lead_name | Info | string | Nome do lead |
| telefone | Info | string | Telefone do lead |
| a_lead_response | Parser Chain | string | Resposta completa da IA |

### 6.4 Configuracoes Especiais

| No | Configuracao | Valor | Motivo |
|----|--------------|-------|--------|
| Segmentos1 | alwaysOutputData | true | Continua mesmo sem dados |
| Call Track AI Cost | onError | continueRegularOutput | Nao interrompe fluxo principal |
| Extract from File | operation | binaryToProperty | Extrai para Base64 |
| Convert to File | operation | toBinary | Reconverte para binario |

### 6.5 Workflows Externos

| No | Workflow ID | Nome | Proposito |
|----|------------|------|-----------|
| Call Track AI Cost | GWKl5KuXAdeu4BLr | [TOOL] Registrar Custo IA | Metricas de custo |

---

## 7. MELHORES PRATICAS

### 7.1 Execution Data

**FAZER:**
- Usar prefixo consistente (ex: `a_`) para ordenacao
- Salvar dados no ponto mais proximo da fonte
- Documentar chaves no nome do no

**EVITAR:**
- Salvar dados grandes (limitar a identificadores)
- Sobrescrever chaves existentes sem necessidade
- Depender exclusivamente de customData para dados criticos

### 7.2 Split Operations

**FAZER:**
- Configurar `alwaysOutputData` para arrays potencialmente vazios
- Nomear campos de destino claramente
- Usar Split In Batches para rate limiting

**EVITAR:**
- Processar arrays muito grandes sem paginacao
- Ignorar a saida "Done" do Split In Batches

### 7.3 File Operations

**FAZER:**
- Preservar fileName e mimeType originais
- Validar tipo de arquivo antes de processar
- Usar Convert to File para reconstruir metadados

**EVITAR:**
- Processar arquivos muito grandes inline
- Ignorar erros de conversao

### 7.4 Execute Workflow

**FAZER:**
- Usar `onError: continueRegularOutput` para operacoes secundarias
- Passar apenas dados necessarios
- Nomear workflows auxiliares com prefixo [TOOL]

**EVITAR:**
- Criar loops infinitos entre workflows
- Passar objetos muito grandes entre workflows

---

## 8. TROUBLESHOOTING

### 8.1 Execution Data Nao Aparece

**Sintoma:** Dados nao aparecem no painel Custom Data

**Causas Possiveis:**
1. No nao foi executado (verificar fluxo)
2. Expressao retorna undefined/null
3. Erro silencioso no no anterior

**Solucao:**
- Verificar se o no esta no caminho executado
- Adicionar fallbacks: `{{ $json.campo ?? 'default' }}`

### 8.2 Split In Batches Loop Infinito

**Sintoma:** Workflow nunca termina

**Causas Possiveis:**
1. Saida Loop reconectada ao mesmo no
2. Dados sendo adicionados durante iteracao

**Solucao:**
- Verificar conexoes do no
- Garantir que dados nao sao modificados durante loop

### 8.3 Execute Workflow Timeout

**Sintoma:** Workflow filho nao retorna

**Causas Possiveis:**
1. Workflow filho muito lento
2. Erro no workflow filho
3. Loop infinito no filho

**Solucao:**
- Verificar logs do workflow filho
- Adicionar timeout explicito
- Usar modo assincrono se retorno nao for necessario

---

## CHANGELOG

| Data | Versao | Descricao |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentacao inicial completa |

---

*Documento gerado para analise tecnica do fluxo GHL Mottivme Sales - Nos Utilities*
