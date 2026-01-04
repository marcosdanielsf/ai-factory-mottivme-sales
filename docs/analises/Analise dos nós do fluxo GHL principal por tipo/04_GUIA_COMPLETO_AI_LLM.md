# GUIA COMPLETO DOS NOS AI/LLM - FLUXO PRINCIPAL GHL MOTTIVME

## INDICE
1. [Visao Geral](#visao-geral)
2. [Modelos e Provedores](#modelos-e-provedores)
3. [Mapa de Relacionamentos](#mapa-de-relacionamentos)
4. [Detalhamento por Categoria](#detalhamento-por-categoria)
   - 4.1 [Agent LangChain](#41-categoria-agent-langchain)
   - 4.2 [Chain LLM](#42-categoria-chain-llm)
   - 4.3 [Google Gemini](#43-categoria-google-gemini)
   - 4.4 [Anthropic Claude](#44-categoria-anthropic-claude)
   - 4.5 [OpenAI](#45-categoria-openai)
   - 4.6 [Output Parser](#46-categoria-output-parser)
5. [Fluxo de Orquestracao](#fluxo-de-orquestracao)
6. [Prompt Engineering](#prompt-engineering)
7. [Referencia Rapida](#referencia-rapida)

---

## 1. VISAO GERAL

### Resumo Executivo
O fluxo principal GHL Mottivme utiliza **7 nos de AI/LLM** organizados em **6 categorias funcionais**:

| Categoria | Quantidade | Proposito |
|-----------|------------|-----------|
| Agent LangChain | 1 | Agente principal de conversacao com tools |
| Chain LLM | 1 | Formatacao de mensagens para WhatsApp/Instagram |
| Google Gemini | 2 | Modelo de linguagem para Agent e Parser |
| Anthropic Claude | 1 | Analise de imagens (Vision) |
| OpenAI | 1 | Transcricao de audio (Whisper) |
| Output Parser | 1 | Parser estruturado JSON |

### Provedores Utilizados
```
- Google (Gemini 2.5 Pro)
- Anthropic (Claude Sonnet 4.5)
- OpenAI (Whisper)
```

---

## 2. MODELOS E PROVEDORES

### 2.1 Tabela Comparativa de Modelos

| Modelo | Provider | Tipo | Uso no Fluxo | Custo Relativo |
|--------|----------|------|--------------|----------------|
| Gemini 2.5 Pro | Google | Chat LLM | Agente principal, Parser | Medio |
| Claude Sonnet 4.5 | Anthropic | Vision | Analise de imagens | Alto |
| Whisper | OpenAI | STT | Transcricao de audio | Baixo |

### 2.2 Credenciais Utilizadas

| Credencial | ID | Provider | Nos que Utilizam |
|------------|----|---------|--------------------|
| Google Gemini(PaLM) Api account | 4ut0CD80SN7lbITM | Google | Gemini2, Google Gemini Chat Model2 |
| Anthropic account | nNkFTZpNoiBCbO1I | Anthropic | Analyze image |
| OpenAi - Marcos | WEENPovt22LUaeRp | OpenAI | Transcrever audio |

### 2.3 Capacidades por Modelo

```
GEMINI 2.5 PRO
├── Context Window: 2M tokens
├── Output Max: 8K tokens
├── Multimodal: Sim (texto, imagem, video)
├── Tools/Functions: Sim
└── Streaming: Sim

CLAUDE SONNET 4.5
├── Context Window: 200K tokens
├── Output Max: 8K tokens
├── Vision: Sim (alta qualidade)
├── Tools/Functions: Sim
└── Streaming: Sim

OPENAI WHISPER
├── Audio Max: 25MB
├── Formatos: mp3, mp4, mpeg, mpga, m4a, wav, webm
├── Idiomas: 98+ idiomas
└── Modo: Transcricao
```

---

## 3. MAPA DE RELACIONAMENTOS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE ORQUESTRACAO AI/LLM                                │
└─────────────────────────────────────────────────────────────────────────────────┘

ENTRADA MULTIMIDIA
        │
        ├──────────────────┬────────────────────────────┐
        │                  │                            │
        ▼                  ▼                            ▼
┌───────────────┐   ┌──────────────┐           ┌───────────────────┐
│  AUDIO        │   │   IMAGEM     │           │   TEXTO           │
│               │   │              │           │                   │
│ Transcrever   │   │ Analyze      │           │  (Direto)         │
│ audio         │   │ image        │           │                   │
│ [OpenAI       │   │ [Anthropic   │           │                   │
│  Whisper]     │   │  Claude]     │           │                   │
└───────┬───────┘   └──────┬───────┘           └─────────┬─────────┘
        │                  │                             │
        └──────────────────┴─────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │                               │
                    │    AI AGENT - MODULAR         │
                    │    [LangChain Agent]          │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │ Google Gemini Chat      │  │
                    │  │ Model (Sub-no)          │  │
                    │  │ models/gemini-2.5-pro   │  │
                    │  └─────────────────────────┘  │
                    │                               │
                    │  Tools Disponiveis:           │
                    │  - Busca_disponibilidade      │
                    │  - Agendar_reuniao            │
                    │  - Adicionar_tag_perdido      │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │       PARSER CHAIN            │
                    │       [Chain LLM]             │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │ Google Gemini Chat      │  │
                    │  │ Model2 (Sub-no)         │  │
                    │  │ models/gemini-2.0-flash │  │
                    │  └─────────────────────────┘  │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │ Structured Output       │  │
                    │  │ Parser (Sub-no)         │  │
                    │  └─────────────────────────┘  │
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │       SAIDA FORMATADA         │
                    │       JSON: {messages: [...]} │
                    └───────────────────────────────┘
```

---

## 4. DETALHAMENTO POR CATEGORIA

### 4.1 CATEGORIA: AGENT LANGCHAIN

#### 4.1.1 No: "AI Agent - Modular"
**ID:** `0366bcbe-bd9c-4cc1-b70f-32e78cd12ab7`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.agent |
| **Type Version** | 1.6 |
| **Posicao** | [6144, 384] |
| **Prompt Type** | define |

**Configuracao do Agente:**
```javascript
{
  promptType: "define",
  text: "={{ $input.item.json.mensagem || $('Extrair Dados do Webhook').item.json.mensagem }}",
  hasOutputParser: false
}
```

**SYSTEM PROMPT COMPLETO:**
```
**CONTEXTO**
DATA: {{ $now.format('FFFF') }}
HORA_LOCAL: {{ $now.setZone($('Info').first().json.time_zone_do_agente || 'America/Sao_Paulo').toFormat('HH:mm') }}
TEL/WHATSAPP: {{ $('Info').first().json.telefone }}
EMAIL: {{ $('Info').first().json.email || 'não informado' }}
NOME DO CLIENTE: {{ $('Info').first().json.full_name || $('Info').first().json.first_name + ' ' + $('Info').first().json.last_name }}
CONTACT_ID: {{ $('Info').first().json.lead_id }}
LOCATION_ID: {{ $('Info').first().json.location_id }}
API_KEY: {{ $('Info').first().json.api_key }}
AGENTE_IA: {{ $('Info').first().json.agente_ia }}
OBJETIVO_LEAD: {{ $('Info').first().json.objetivo_do_lead }}
ETIQUETAS: {{ $('Info').first().json.etiquetas }}
SOURCE: {{ $('Info').first().json.source }}
TIMEZONE_LEAD: {{ $('Info').first().json.timezone_do_lead }}

{{ $json.contexto_hiperpersonalizado || '' }}

## SAUDACAO
{{ $('Info').first().json.is_primeira_mensagem ? '- PRIMEIRA MENSAGEM: Use saudação apropriada + nome do cliente' : '- JÁ CONVERSARAM: Não use saudação, vá direto ao ponto' }}

## HISTORIA DO USUARIO (AGENTE)
{{ $('Info').first().json.historia_do_usuario }}

## FERRAMENTAS DISPONIVEIS
- **Busca_disponibilidade**: OBRIGATORIO antes de oferecer horarios
- **Agendar_reuniao**: Criar agendamento (nome, tel, email, eventId, data, hora)
- **Adicionar_tag_perdido**: Desqualificar lead

## FORMATOS OBRIGATORIOS
- **Telefone**: +00000000000 (sem espacos)
- **Data**: MM/dd/yyyy (padrao americano)
- **Hora**: formato 12h com AM/PM
- **Agendamento CRM**: ISO 8601 (Y-m-d\TH:i:sP)

## CALENDARIOS
- Carreira: {{ $('Info').first().json.calendarID_carreira }}
- Consultoria Financeira: {{ $('Info').first().json.calendarID_consultoria_financeira }}

## LINK ZOOM
{{ $('Info').first().json.link_do_zoom }}

---

## HISTORICO DE CONVERSAS ANTIGAS
{{ $('Set mensagens').first().json.mensagens_antigas }}

---

## REGRA INVIOLAVEL
PROIBIDO mencionar dia/hora sem ANTES chamar Busca_disponibilidade. Sem excecao.

{{ $json.contexto_hiperpersonalizado }}

{{ $json.prompt_dinamico }}

## LEMBRETE CRITICO
Voce NAO PODE sugerir horarios sem ter chamado Busca_disponibilidade ANTES. Horarios "inventados" causam frustracao no cliente e prejudicam a operacao.
```

**USER PROMPT TEMPLATE:**
```
={{ $input.item.json.mensagem || $('Extrair Dados do Webhook').item.json.mensagem }}
```

**Tools/Functions Disponiveis:**

| Tool | Descricao | Parametros |
|------|-----------|------------|
| Busca_disponibilidade | Consulta slots disponiveis no calendario | calendarId, startDate, endDate |
| Agendar_reuniao | Cria evento no calendario | nome, telefone, email, eventId, data, hora |
| Adicionar_tag_perdido | Marca lead como perdido/desqualificado | lead_id, motivo |

**Variaveis Dinamicas Injetadas:**

| Variavel | Fonte | Descricao |
|----------|-------|-----------|
| time_zone_do_agente | Info | Timezone do agente para calculo de hora local |
| is_primeira_mensagem | Info | Flag para controle de saudacao |
| historia_do_usuario | Info | Persona/historia do agente IA |
| mensagens_antigas | Set mensagens | Historico de conversas anteriores |
| contexto_hiperpersonalizado | JSON anterior | Contexto adicional personalizado |
| prompt_dinamico | JSON anterior | Prompt adicional carregado dinamicamente |

**Modelo Conectado:** Google Gemini Chat Model (sub-no)

---

### 4.2 CATEGORIA: CHAIN LLM

#### 4.2.1 No: "Parser Chain"
**ID:** `961328dd-7797-409c-98c7-49149ab2d880`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.chainLlm |
| **Type Version** | 1.7 |
| **Posicao** | [8624, 320] |
| **Execute Once** | Sim |
| **Retry on Fail** | Sim |
| **Has Output Parser** | Sim |

**Configuracao:**
```javascript
{
  promptType: "define",
  text: "=Mensagem do usuário a ser formatada: {{ $('Tipo de mensagem1').first().json.output }}",
  hasOutputParser: true,
  batching: {}
}
```

**SYSTEM PROMPT COMPLETO:**
```
Por favor, gere a saída no seguinte formato JSON:
{
  "messages": [
    "splitedMessage",
    "splitedMessage",
    "splitedMessage"
  ]
}

Você é especialista em formatação de mensagem para WhatsApp e instagram, trabalhando somente na formatação e não alterando o conteúdo da menssagem. Responda apenas com o texto final, não comente nada e não fale 'sua mensagem formatada', apenas o texto final. Não comente e nem fale por conta própria, apenas pegue a mensagem do usuário e formate.

Recomendado: ideal entre 1-2 mensagens e no max 3.

- Substitua ** por *
- Remova #
- remova \n e quebra de linhas
- Substitua aspas duplas por aspas simples " > '
```

**USER PROMPT TEMPLATE:**
```
=Mensagem do usuário a ser formatada: {{ $('Tipo de mensagem1').first().json.output }}
```

**Proposito:**
Formata a resposta da IA para compatibilidade com WhatsApp/Instagram:
1. Converte markdown para formato simples
2. Divide mensagens longas em chunks menores (max 3)
3. Remove caracteres especiais problematicos
4. Garante output JSON estruturado

**Modelo Conectado:** Google Gemini Chat Model2 (sub-no)
**Parser Conectado:** Structured Output Parser (sub-no)

---

### 4.3 CATEGORIA: GOOGLE GEMINI

#### 4.3.1 No: "Gemini2"
**ID:** `272f0f06-a636-4735-ba4c-89fc89970bcb`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.lmChatGoogleGemini |
| **Type Version** | 1 |
| **Posicao** | [5712, 608] |
| **Modelo** | models/gemini-2.5-pro |

**Configuracao do Modelo:**
```javascript
{
  modelName: "models/gemini-2.5-pro",
  options: {}
}
```

**Especificacoes Tecnicas:**

| Parametro | Valor |
|-----------|-------|
| **Modelo** | Gemini 2.5 Pro |
| **Context Window** | 2,097,152 tokens (2M) |
| **Max Output Tokens** | 8,192 tokens |
| **Temperatura** | Default (nao especificado) |
| **Top P** | Default |
| **Top K** | Default |

**Credencial:**
```
ID: 4ut0CD80SN7lbITM
Nome: Google Gemini(PaLM) Api account
```

**Capacidades:**
- Texto para texto
- Multimodal (imagem, video, audio)
- Function calling
- Streaming
- JSON mode

**Uso:** Sub-no conectado ao "AI Agent - Modular"

---

#### 4.3.2 No: "Google Gemini Chat Model2"
**ID:** `e999e99e-dc8b-4bec-b211-16bd02f666ae`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.lmChatGoogleGemini |
| **Type Version** | 1 |
| **Posicao** | [8672, 688] |
| **Modelo** | Default (gemini-2.0-flash) |

**Configuracao do Modelo:**
```javascript
{
  options: {}
}
```

**Especificacoes Tecnicas:**

| Parametro | Valor |
|-----------|-------|
| **Modelo** | Gemini 2.0 Flash (default) |
| **Context Window** | 1,048,576 tokens (1M) |
| **Max Output Tokens** | 8,192 tokens |
| **Temperatura** | Default |
| **Velocidade** | Alta (otimizado para baixa latencia) |

**Credencial:**
```
ID: 4ut0CD80SN7lbITM
Nome: Google Gemini(PaLM) Api account
```

**Uso:** Sub-no conectado ao "Parser Chain"

**Nota:** Usa modelo mais leve (Flash) para tarefa simples de formatacao, otimizando custo e velocidade.

---

### 4.4 CATEGORIA: ANTHROPIC CLAUDE

#### 4.4.1 No: "Analyze image"
**ID:** `cfd76a6c-b2d4-4fa4-854f-da6647f6a627`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.anthropic |
| **Type Version** | 1 |
| **Posicao** | [1664, 592] |
| **Resource** | image |
| **Modelo** | claude-sonnet-4-5-20250929 |

**Configuracao:**
```javascript
{
  resource: "image",
  modelId: {
    __rl: true,
    value: "claude-sonnet-4-5-20250929",
    mode: "list",
    cachedResultName: "claude-sonnet-4-5-20250929"
  },
  text: "O que há nessa imagem?",
  imageUrls: "={{ $json.photo_audio }}",
  options: {}
}
```

**Especificacoes Tecnicas:**

| Parametro | Valor |
|-----------|-------|
| **Modelo** | Claude Sonnet 4.5 |
| **Context Window** | 200,000 tokens |
| **Max Output Tokens** | 8,192 tokens |
| **Vision** | Sim (alta qualidade) |
| **Temperatura** | Default |

**PROMPT DE ANALISE:**
```
O que há nessa imagem?
```

**Input de Imagem:**
```
={{ $json.photo_audio }}
```

**Credencial:**
```
ID: nNkFTZpNoiBCbO1I
Nome: Anthropic account
```

**Capacidades Vision:**
- Descricao de imagens
- OCR (texto em imagens)
- Analise de graficos/diagramas
- Identificacao de objetos
- Extracao de informacoes visuais

**Formatos Suportados:**
- JPEG
- PNG
- GIF
- WebP
- Base64 encoded

**Proposito:**
Quando usuario envia imagem pelo WhatsApp/Instagram, este no analisa o conteudo visual e gera descricao textual que sera usada pelo agente principal.

---

### 4.5 CATEGORIA: OPENAI

#### 4.5.1 No: "Transcrever audio"
**ID:** `5d2f835b-0299-47c3-a49a-663963ba883f`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.openAi |
| **Type Version** | 1.8 |
| **Posicao** | [2608, 832] |
| **Resource** | audio |
| **Operation** | transcribe |

**Configuracao:**
```javascript
{
  resource: "audio",
  operation: "transcribe",
  options: {
    language: "pt"
  }
}
```

**Especificacoes Tecnicas:**

| Parametro | Valor |
|-----------|-------|
| **Modelo** | Whisper |
| **Idioma** | Portugues (pt) |
| **Max File Size** | 25 MB |
| **Duracao Max** | ~2 horas |

**Credencial:**
```
ID: WEENPovt22LUaeRp
Nome: OpenAi - Marcos
```

**Formatos de Audio Suportados:**
- mp3
- mp4
- mpeg
- mpga
- m4a
- wav
- webm

**Opcoes Disponiveis:**
```javascript
{
  language: "pt",           // Idioma forcado (opcional)
  prompt: "",               // Prompt de contexto (opcional)
  response_format: "json",  // Formato de resposta
  temperature: 0            // Temperatura (0-1)
}
```

**Proposito:**
Quando usuario envia mensagem de voz pelo WhatsApp/Instagram, este no converte o audio em texto que sera processado pelo agente principal.

**Fluxo:**
1. Recebe URL do audio do webhook
2. Faz download do arquivo
3. Envia para API Whisper
4. Retorna transcricao em texto

---

### 4.6 CATEGORIA: OUTPUT PARSER

#### 4.6.1 No: "Structured Output Parser"
**ID:** `b55d7359-2aa9-4c05-abdf-4ee2adc7aa11`

| Atributo | Valor |
|----------|-------|
| **Tipo** | @n8n/n8n-nodes-langchain.outputParserStructured |
| **Type Version** | 1.3 |
| **Posicao** | [8704, 512] |
| **Schema Type** | manual |
| **Auto Fix** | Sim |

**Configuracao:**
```javascript
{
  schemaType: "manual",
  inputSchema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"messages\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\"messages\"]\n}",
  autoFix: true
}
```

**JSON SCHEMA COMPLETO:**
```json
{
  "type": "object",
  "properties": {
    "messages": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["messages"]
}
```

**Exemplo de Output:**
```json
{
  "messages": [
    "Olá João! Tudo bem?",
    "Vi que você tem interesse em nossa consultoria de carreira.",
    "Posso verificar os horários disponíveis para você?"
  ]
}
```

**Funcionalidades:**
- **Auto Fix:** Tenta corrigir JSON malformado automaticamente
- **Validation:** Valida contra schema definido
- **Type Coercion:** Converte tipos quando possivel

**Proposito:**
Garante que a saida do Parser Chain seja sempre um JSON valido com array de mensagens, permitindo envio sequencial de multiplas mensagens ao usuario.

---

## 5. FLUXO DE ORQUESTRACAO

### 5.1 Pipeline de Processamento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PIPELINE DE PROCESSAMENTO AI/LLM                         │
└─────────────────────────────────────────────────────────────────────────────┘

FASE 1: PREPROCESSAMENTO DE MIDIA
══════════════════════════════════

[Webhook] ──┬──► [Audio?] ──► [Transcrever audio] ──► texto
            │                   (OpenAI Whisper)
            │
            ├──► [Imagem?] ──► [Analyze image] ──► descricao
            │                   (Claude Sonnet 4.5)
            │
            └──► [Texto?] ──► (direto) ──► texto


FASE 2: PROCESSAMENTO PRINCIPAL
═══════════════════════════════

[Texto/Descricao] ──► [Set mensagens] ──► [AI Agent - Modular]
                      (historico)          │
                                          ├── System Prompt (contexto)
                                          ├── User Message (input)
                                          ├── Tools (3 funcoes)
                                          └── LLM (Gemini 2.5 Pro)
                                               │
                                               ▼
                                          [Resposta IA]


FASE 3: POS-PROCESSAMENTO
═════════════════════════

[Resposta IA] ──► [Tipo de mensagem1] ──► [Parser Chain]
                                           │
                                           ├── System Prompt (formatacao)
                                           ├── User Message (resposta IA)
                                           ├── Output Parser (JSON)
                                           └── LLM (Gemini 2.0 Flash)
                                                │
                                                ▼
                                           [JSON Formatado]
                                           {messages: [...]}


FASE 4: ENVIO
═════════════

[JSON] ──► [Split por mensagem] ──► [Enviar GHL] ──► WhatsApp/Instagram
```

### 5.2 Estrategia de Fallback

```
HIERARQUIA DE FALLBACK (nao implementada atualmente)
════════════════════════════════════════════════════

Modelo Primario: Gemini 2.5 Pro
                     │
                     ▼ (se falhar)
Fallback 1: Claude Sonnet 4.5
                     │
                     ▼ (se falhar)
Fallback 2: GPT-4 (nao configurado)
                     │
                     ▼ (se falhar)
Erro + Notificacao Admin

NOTA: Fallback NAO esta implementado no fluxo atual.
Recomendacao: Adicionar try-catch com modelo alternativo.
```

### 5.3 Rate Limits por Provider

| Provider | Modelo | RPM | TPM | Obs |
|----------|--------|-----|-----|-----|
| Google | Gemini 2.5 Pro | 60 | 2M | Tier gratuito limitado |
| Google | Gemini 2.0 Flash | 60 | 1M | Tier gratuito limitado |
| Anthropic | Claude Sonnet 4.5 | 60 | 80K | Depende do tier |
| OpenAI | Whisper | 50 | - | Limite por arquivo: 25MB |

**RPM:** Requests per Minute
**TPM:** Tokens per Minute

### 5.4 Gestao de Contexto

```
CONTEXT WINDOW MANAGEMENT
═════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI 2.5 PRO - 2M tokens                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SYSTEM PROMPT                                ~2K tokens │   │
│  │ - Contexto                                              │   │
│  │ - Regras                                                │   │
│  │ - Tools                                                 │   │
│  │ - Formatos                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ HISTORICO DE CONVERSAS              ~10K-50K tokens     │   │
│  │ (mensagens_antigas)                                     │   │
│  │ - Ultimas N mensagens                                   │   │
│  │ - Ordem cronologica ASC                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CONTEXTO DINAMICO                   ~1K-5K tokens       │   │
│  │ - contexto_hiperpersonalizado                           │   │
│  │ - prompt_dinamico                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ USER MESSAGE                        ~100-500 tokens     │   │
│  │ (mensagem atual do lead)                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ RESERVA PARA OUTPUT                 ~8K tokens          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TOTAL ESTIMADO: 20K-70K tokens por request                    │
│  FOLGA DISPONIVEL: ~1.9M tokens                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. PROMPT ENGINEERING

### 6.1 Analise do System Prompt Principal

**Estrutura do Prompt (AI Agent - Modular):**

```
1. CONTEXTO DINAMICO
   ├── Data/Hora
   ├── Dados do Lead
   ├── Dados do Agente
   └── Metadados

2. REGRAS DE SAUDACAO
   └── Condicional (primeira msg vs continuacao)

3. PERSONA DO AGENTE
   └── historia_do_usuario (injetado)

4. TOOLS DOCUMENTATION
   └── 3 ferramentas com descricao

5. FORMATOS OBRIGATORIOS
   └── Telefone, Data, Hora

6. RECURSOS DISPONIVEIS
   ├── IDs de Calendarios
   └── Link Zoom

7. MEMORIA/HISTORICO
   └── mensagens_antigas (injetado)

8. REGRAS INVIOLAVEIS
   └── Nunca sugerir horario sem consultar

9. CONTEXTO ADICIONAL
   ├── contexto_hiperpersonalizado
   └── prompt_dinamico
```

### 6.2 Tecnicas de Prompt Utilizadas

| Tecnica | Uso no Fluxo | Exemplo |
|---------|--------------|---------|
| **Role Playing** | historia_do_usuario | Define persona do agente |
| **Few-Shot** | Nao utilizado | - |
| **Chain of Thought** | Nao explicito | - |
| **Constraints** | REGRA INVIOLAVEL | "PROIBIDO mencionar dia/hora sem..." |
| **Format Specification** | FORMATOS OBRIGATORIOS | "Telefone: +00000000000" |
| **Context Injection** | Variaveis dinamicas | {{ $json.contexto_hiperpersonalizado }} |
| **Memory Integration** | mensagens_antigas | Historico de conversa |

### 6.3 Variaveis de Template Utilizadas

```javascript
// DADOS DO LEAD
$('Info').first().json.telefone
$('Info').first().json.email
$('Info').first().json.full_name
$('Info').first().json.first_name
$('Info').first().json.last_name
$('Info').first().json.lead_id
$('Info').first().json.objetivo_do_lead
$('Info').first().json.etiquetas
$('Info').first().json.source
$('Info').first().json.timezone_do_lead

// DADOS DO AGENTE/LOCATION
$('Info').first().json.location_id
$('Info').first().json.api_key
$('Info').first().json.agente_ia
$('Info').first().json.time_zone_do_agente
$('Info').first().json.historia_do_usuario
$('Info').first().json.calendarID_carreira
$('Info').first().json.calendarID_consultoria_financeira
$('Info').first().json.link_do_zoom

// FLAGS DE ESTADO
$('Info').first().json.is_primeira_mensagem

// CONTEXTO DINAMICO
$json.contexto_hiperpersonalizado
$json.prompt_dinamico
$('Set mensagens').first().json.mensagens_antigas

// TEMPO
$now.format('FFFF')
$now.setZone('America/Sao_Paulo').toFormat('HH:mm')
```

### 6.4 Prompt do Parser

**Objetivo:** Transformar output do agente em JSON compativel com WhatsApp

**Regras de Formatacao:**
1. `**texto**` → `*texto*` (negrito WhatsApp)
2. `#` → remover (headers markdown)
3. `\n` → remover (quebras de linha)
4. `"` → `'` (aspas duplas para simples)
5. Dividir em 1-3 mensagens

**Output Esperado:**
```json
{
  "messages": [
    "Mensagem 1",
    "Mensagem 2 (opcional)",
    "Mensagem 3 (opcional)"
  ]
}
```

---

## 7. REFERENCIA RAPIDA

### 7.1 Tabela de Nos por Tipo

| Tipo | Nos |
|------|-----|
| **Agent LangChain** | AI Agent - Modular |
| **Chain LLM** | Parser Chain |
| **Google Gemini** | Gemini2, Google Gemini Chat Model2 |
| **Anthropic** | Analyze image |
| **OpenAI** | Transcrever audio |
| **Output Parser** | Structured Output Parser |

### 7.2 Tabela de Nos por Funcao

| Funcao | No | Modelo |
|--------|----|----|
| Conversacao Principal | AI Agent - Modular | Gemini 2.5 Pro |
| Formatacao WhatsApp | Parser Chain | Gemini 2.0 Flash |
| Analise de Imagem | Analyze image | Claude Sonnet 4.5 |
| Transcricao Audio | Transcrever audio | Whisper |
| Parse JSON | Structured Output Parser | N/A |

### 7.3 Configuracoes Especiais por No

| No | Configuracao Especial |
|----|----------------------|
| AI Agent - Modular | Tools conectadas, System Prompt extenso |
| Parser Chain | executeOnce: true, retryOnFail: true |
| Gemini2 | modelName: models/gemini-2.5-pro |
| Google Gemini Chat Model2 | Modelo default (Flash) |
| Analyze image | resource: image, Vision mode |
| Transcrever audio | language: pt, resource: audio |
| Structured Output Parser | autoFix: true |

### 7.4 Custos Estimados por Request

| No | Modelo | Tokens In | Tokens Out | Custo USD |
|----|--------|-----------|------------|-----------|
| AI Agent | Gemini 2.5 Pro | ~30K | ~500 | ~$0.02 |
| Parser Chain | Gemini 2.0 Flash | ~2K | ~200 | ~$0.0002 |
| Analyze image | Claude Sonnet 4.5 | ~1K | ~200 | ~$0.005 |
| Transcrever audio | Whisper | N/A | N/A | ~$0.006/min |

**Custo Total Estimado por Conversa:** ~$0.03-0.05

### 7.5 Fluxo de Dependencias

```
                    ┌─────────────────┐
                    │     Webhook     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐   ┌───────────┐   ┌─────────┐
    │ Transcrever │   │ Analyze   │   │ (texto) │
    │ audio       │   │ image     │   │         │
    │ [OpenAI]    │   │ [Claude]  │   │         │
    └──────┬──────┘   └─────┬─────┘   └────┬────┘
           │                │              │
           └────────────────┴──────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │   Set/Merge    │
                   └───────┬────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   AI Agent - Modular   │
              │        [Agent]         │
              │            │           │
              │   ┌────────┴────────┐  │
              │   │     Gemini2     │  │
              │   │  [Gemini 2.5]   │  │
              │   └─────────────────┘  │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │     Parser Chain       │
              │       [Chain]          │
              │            │           │
              │   ┌────────┴────────┐  │
              │   │  Gemini Model2  │  │
              │   │  [Gemini Flash] │  │
              │   │        │        │  │
              │   │  ┌─────┴─────┐  │  │
              │   │  │  Parser   │  │  │
              │   │  │ [JSON]    │  │  │
              │   │  └───────────┘  │  │
              │   └─────────────────┘  │
              └───────────┬────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Enviar GHL    │
                  └───────────────┘
```

---

## 8. RECOMENDACOES PARA EVOLUCAO

### 8.1 Implementar Fallback entre Modelos

```javascript
// Pseudo-codigo para fallback
try {
  response = await gemini25Pro.generate(prompt);
} catch (error) {
  if (error.code === 429 || error.code === 503) {
    response = await claudeSonnet.generate(prompt);
  } else {
    throw error;
  }
}
```

### 8.2 Adicionar Streaming

- Gemini e Claude suportam streaming
- Permite resposta mais rapida ao usuario
- Reduz timeout em conversas longas

### 8.3 Implementar Cache de Respostas

```javascript
// Cache por hash da mensagem
const cacheKey = hash(systemPrompt + userMessage);
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

### 8.4 Monitoramento de Custos

- Implementar logging de tokens por request
- Dashboard de custos por location
- Alertas de uso anormal

### 8.5 Versionamento de Prompts

- Mover prompts para banco de dados (agent_versions)
- Permitir A/B testing de prompts
- Rollback facil de versoes

---

## CHANGELOG

| Data | Versao | Descricao |
|------|--------|-----------|
| 2024-12-31 | 1.0 | Documentacao inicial completa |

---

*Documento gerado para operacao BPO Mottivme Sales - Fluxo GHL Principal*
*AI/LLM Orchestration - 7 nos documentados*
