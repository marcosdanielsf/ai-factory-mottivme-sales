# AI Factory V3 - Documentacao Completa

**Sistema de Automacao de Agentes de IA para GoHighLevel (GHL)**
**Versao:** v3.0-hyperpersonalized
**Ultima Atualizacao:** 2025-12-20

---

## Indice

1. [Visao Geral do Sistema](#visao-geral-do-sistema)
2. [Arquitetura Completa](#arquitetura-completa)
3. [Mapa de Fluxos](#mapa-de-fluxos)
4. [Descricao Detalhada de Cada Workflow](#descricao-detalhada-de-cada-workflow)
5. [Como os Fluxos se Interligam](#como-os-fluxos-se-interligam)
6. [Banco de Dados (Supabase)](#banco-de-dados-supabase)
7. [Modos de Agente](#modos-de-agente)
8. [Hiperpersonalizacao Engine](#hiperpersonalizacao-engine)
9. [Checklist de Deploy](#checklist-de-deploy)

---

## Visao Geral do Sistema

O AI Factory V3 e um sistema completo para criar, validar e executar agentes de IA conversacionais para atendimento via WhatsApp/GHL. O sistema possui 3 camadas principais:

| Camada | Funcao | Workflows |
|--------|--------|-----------|
| **Camada 1 - Ingestao** | Captura, organiza e processa calls de kickoff | 01, 03, 10 |
| **Camada 2 - Validacao** | Valida agentes antes de ir para producao | 08 |
| **Camada 3 - Execucao/QA** | Executa agentes e monitora qualidade | 05, 09 |
| **Auxiliares** | Ferramentas de suporte e manutencao | 02, 07 |

---

## Arquitetura Completa

```
                            FLUXO COMPLETO DO SISTEMA

    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │   CAMADA 1: INGESTAO E CRIACAO                                      │
    │                                                                     │
    │   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐  │
    │   │ Call Google │────▶│ 01-Organi-  │────▶│ Move para subpasta  │  │
    │   │ Meet/Zoom   │     │ zador-Calls │     │ /2. Onboarding/     │  │
    │   └─────────────┘     └─────────────┘     └──────────┬──────────┘  │
    │                                                       │             │
    │                       ┌───────────────────────────────▼──────────┐ │
    │                       │ 03-Call-Analyzer-Onboarding              │ │
    │                       │ Extrai: negocio, personalidade,          │ │
    │                       │ compliance, modos, hiperpersonalizacao   │ │
    │                       └──────────────────────────────────────────┘ │
    │                                           │                        │
    │                       ┌───────────────────▼──────────────────────┐ │
    │                       │ 10-AI-Factory-V3-Unified (Alternativo)   │ │
    │                       │ Fluxo unificado: ingestao + validacao    │ │
    │                       └──────────────────────────────────────────┘ │
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │                                                                    │
    │   CAMADA 2: VALIDACAO                                              │
    │                                                                    │
    │   ┌────────────────────────────────────────────────────────────┐  │
    │   │ 08-Boot-Validator                                          │  │
    │   │                                                            │  │
    │   │ • Roda a cada 5 minutos                                    │  │
    │   │ • Busca agentes pending_approval                           │  │
    │   │ • Simula 7-10 cenarios de teste                            │  │
    │   │ • Avalia: Tom, Compliance, Clareza, Efetividade            │  │
    │   │ • Nota minima para aprovacao: 8.0                          │  │
    │   │                                                            │  │
    │   │ Resultados:                                                │  │
    │   │ ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐ │  │
    │   │ │ APROVADO      │ │ APROVADO COM  │ │ BLOQUEADO         │ │  │
    │   │ │ (>= 8.0)      │ │ RESTRICOES    │ │ (< 6.0 ou         │ │  │
    │   │ │               │ │ (6.0 - 7.9)   │ │ violacao critica) │ │  │
    │   │ │ Auto-ativa    │ │ Notifica CS   │ │ Notifica CS       │ │  │
    │   │ └───────────────┘ └───────────────┘ └───────────────────┘ │  │
    │   └────────────────────────────────────────────────────────────┘  │
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │                                                                    │
    │   CAMADA 3: EXECUCAO E MONITORAMENTO                               │
    │                                                                    │
    │   ┌────────────────────────────────────────────────────────────┐  │
    │   │ 05-AI-Agent-Execution-Modular                              │  │
    │   │                                                            │  │
    │   │ Webhook GHL ──▶ Busca Agente Ativo ──▶ Prepara Execucao   │  │
    │   │                                                            │  │
    │   │ ┌──────────────────────────────────────────────────────┐  │  │
    │   │ │ Switch por Modo (contexto):                          │  │  │
    │   │ │                                                      │  │  │
    │   │ │ • first_contact   • scheduler    • rescheduler       │  │  │
    │   │ │ • concierge       • customer_success                 │  │  │
    │   │ │ • objection_handler  • followuper                    │  │  │
    │   │ └──────────────────────────────────────────────────────┘  │  │
    │   │                        │                                   │  │
    │   │                        ▼                                   │  │
    │   │ ┌──────────────────────────────────────────────────────┐  │  │
    │   │ │ AI Agent Modular (Groq Llama 3.3 70B)               │  │  │
    │   │ │ + Ferramentas: Busca_disponibilidade, Agendar,      │  │  │
    │   │ │                Adicionar_tag_perdido                │  │  │
    │   │ └──────────────────────────────────────────────────────┘  │  │
    │   │                        │                                   │  │
    │   │                        ▼                                   │  │
    │   │              Enviar Resposta via GHL API                   │  │
    │   └────────────────────────────────────────────────────────────┘  │
    │                                                                    │
    │   ┌────────────────────────────────────────────────────────────┐  │
    │   │ 09-QA-Analyst (Monitoramento Passivo)                     │  │
    │   │                                                            │  │
    │   │ • Roda a cada 1 hora                                       │  │
    │   │ • Analisa conversas das ultimas 48h                        │  │
    │   │ • 4 Dimensoes: Clareza, Objecoes, Compliance, Avanco       │  │
    │   │ • Alerta se nota < 6.0 ou red flag critica                 │  │
    │   │ • Relatorio diario consolidado as 18h                      │  │
    │   └────────────────────────────────────────────────────────────┘  │
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
```

---

## Mapa de Fluxos

### Numeracao e Proposito

| # | Arquivo | Nome | Proposito |
|---|---------|------|-----------|
| 01 | `01-Organizador-Calls.json` | Monitor-Pasta-Calls | Monitora /7. Calls/, classifica por prefixo e move para subpastas |
| 02 | `02-AI-Agent-Head-Vendas.json` | AI-Agent-Head-Vendas | Analisa calls de diagnostico com metodologia BANT/SPIN |
| 03 | `03-Call-Analyzer-Onboarding.json` | Call Analyzer Onboarding | Analisa calls de kickoff e extrai config do agente |
| 04 | `04-Agent-Factory.json` | Agent Factory | (Versao anterior - deprecado) |
| 05 | `05-AI-Agent-Execution-Modular.json` | AI Agent Execution - Modular | Executa agentes versionados quando GHL envia webhook |
| 06 | `06-Call-Analyzer-Revisao.json` | Call Analyzer Revisao | Analisa calls de acompanhamento/revisao |
| 07 | `07-Engenheiro-de-Prompt.json` | Engenheiro de Prompt | Interface para ajustes pontuais em prompts |
| 08 | `08-Boot-Validator.json` | IA Boot Validator | Valida agentes automaticamente antes de producao |
| 09 | `09-QA-Analyst.json` | QA Analyst IA | Monitora performance de agentes em producao |
| 10 | `10-AI-Factory-V3-Unified.json` | AI Factory Completa | Fluxo unificado (ingestao + validacao) |

---

## Descricao Detalhada de Cada Workflow

### 01-Organizador-Calls.json

**Funcao:** Orquestrador inicial - monitora a pasta raiz de calls no Google Drive.

**Trigger:** Google Drive Trigger (a cada 1 minuto) monitorando `/7. Calls/`

**Fluxo:**
1. Detecta novo arquivo na pasta raiz
2. Classifica por prefixo do nome:
   - `DIAGNOSTICO/DIAG_` → `/1. Vendas/`
   - `KICKOFF/KICK_` → `/2. Onboarding/`
   - `ACOMPANHAMENTO/ACOMP_` → `/3. Revisao/`
   - `SUPORTE/SUP_` → `/4. Suporte/`
   - `CHURN/CHURN_` → `/5. Churn/`
   - Sem prefixo → `/6. Outros/`
3. Busca contato no GHL por telefone
4. Gera numero sequencial por tipo
5. Renomeia arquivo com padrao: `{numero} - {tipo} - {nome} - {telefone} - {location_id}`
6. Move para subpasta correta
7. Registra no Supabase (tabela `call_recordings`)
8. Notifica CS se dados incompletos

**Conexoes:**
- **Saida:** Dispara workflows 02, 03, 06 indiretamente (via Google Drive Trigger de cada subpasta)

---

### 02-AI-Agent-Head-Vendas.json

**Funcao:** Analisa calls de diagnostico/vendas com metodologia BANT/SPIN.

**Trigger:** Google Drive Trigger monitorando `/1. Vendas/`

**Fluxo:**
1. Detecta novo arquivo na pasta de vendas
2. Busca registro no Supabase (call_recordings)
3. Exporta Google Doc como texto
4. IA analisa com prompt de Head de Vendas:
   - Qualificacao BANT (Budget, Authority, Need, Timeline)
   - Descoberta SPIN (Situation, Problem, Implication, Need-Payoff)
   - Conducao (Rapport, Escuta Ativa, Controle, Objecoes)
   - Fechamento (CTA, Compromisso, Urgencia, Entusiasmo)
5. Processa analise e gera scores (0-100)
6. Atualiza Custom Fields no GHL
7. Cria Custom Object "Analise de Call"
8. Associa ao contato

**Output:**
- Tier: A+ EXCELENTE / B BOA / C MEDIANA / D FRACA
- Probabilidade de fechamento: 0-100%
- Status: QUALIFICADO / DESQUALIFICAR / NUTRIR

---

### 03-Call-Analyzer-Onboarding.json

**Funcao:** Analisa calls de kickoff e extrai configuracao completa do agente.

**Trigger:** Google Drive Trigger monitorando `/2. Onboarding/`

**Fluxo:**
1. Filtra apenas Google Docs (ignora MP4, imagens)
2. Busca registro no Supabase
3. Exporta texto da transcricao
4. IA extrai:
   - `business_context` (nome, tipo, servicos, precos)
   - `hyperpersonalization` (DDD, setor, porte, cargo)
   - `compliance_rules` (proibicoes, limites, escalacao)
   - `personality_config` (tom, nome_agente, caracteristicas)
   - `modos_identificados` (quais modos o cliente precisa)
   - `prompts_por_modo` (prompt completo para cada modo)
5. Atualiza status no Supabase
6. Salva em Custom Object no GHL
7. Associa ao contato

**Conexao:**
- **Saida:** Cria registro em `agent_versions` → Dispara 08-Boot-Validator

---

### 05-AI-Agent-Execution-Modular.json

**Funcao:** Executa agentes de IA quando mensagens chegam do GHL.

**Trigger:** Webhook POST `/webhook-whatsapp-modular`

**Fluxo:**
1. Recebe webhook do GHL com mensagem
2. Extrai dados: location_id, contact_id, mensagem, telefone, nome
3. Busca agente ativo no Supabase para o location_id
4. Prepara execucao:
   - Parse de configs (tools_config, business_config, compliance, personality)
   - Gera contexto hiperpersonalizado (DDD, setor, porte, cargo)
   - Identifica modo/contexto atual
5. Switch roteia para o Set correto do modo
6. AI Agent executa com:
   - System prompt dinamico (template padrao + prompt do modo)
   - Ferramentas: Busca_disponibilidade, Agendar_reuniao, Adicionar_tag_perdido
7. Envia resposta via GHL API

**Modos Suportados:**
- first_contact
- scheduler
- rescheduler
- concierge
- customer_success
- objection_handler
- followuper

---

### 07-Engenheiro-de-Prompt.json

**Funcao:** Interface para ajustes pontuais em prompts de agentes.

**Trigger:** Webhook POST `/engenheiro-prompt`

**Comandos Suportados:**
- `/prompt listar` - Lista agentes ativos
- `/prompt ver "Nome"` - Mostra config atual do agente
- `/prompt editar "Nome" "instrucao"` - Propoe mudanca no prompt
- `/prompt aprovar {uuid}` - Aprova versao pendente

**Fluxo de Edicao:**
1. Busca agente pelo nome
2. Envia prompt atual + instrucao para IA
3. IA aplica mudanca e gera novo system_prompt
4. Cria nova versao (vX.Y+1) com status pending_approval
5. Retorna ID para aprovacao

---

### 08-Boot-Validator.json

**Funcao:** Validador automatico de agentes antes de ir para producao.

**Trigger:** Schedule Trigger (a cada 5 minutos)

**Fluxo:**
1. Busca agentes com status `pending_approval` ou `draft` com prompt
2. Para cada agente:
   - Gera 7 cenarios base de teste
   - Adiciona cenarios especificos por segmento (saude, juridico, imobiliario)
   - Simula respostas do agente
   - Avalia 4 dimensoes: Tom, Compliance, Clareza, Efetividade
3. Classifica resultado:
   - **APROVADO** (>= 8.0): Ativa automaticamente
   - **APROVADO_COM_RESTRICOES** (6.0-7.9): Notifica CS
   - **BLOQUEADO** (< 6.0 ou violacao critica): Bloqueia
4. Salva resultado no Supabase
5. Notifica via WhatsApp

**Cenarios Base:**
1. Saudacao inicial
2. Demonstracao de interesse
3. Objecao de preco
4. Objecao de tempo
5. Pergunta fora do escopo
6. Caso de escalacao
7. Solicitacao de agendamento

---

### 09-QA-Analyst.json

**Funcao:** Monitoramento passivo de performance de agentes em producao.

**Trigger:** Schedule Trigger (a cada 1 hora)

**Fluxo:**
1. Busca conversas nao analisadas das ultimas 48h
2. Para cada conversa:
   - Busca historico completo de mensagens
   - Formata para analise
   - IA avalia 4 dimensoes:
     - Clareza de Conducao (0-10)
     - Tratamento de Objecoes (0-10)
     - Loop/Repeticao/Compliance (0-10)
     - Avanco para Objetivo (0-10)
   - Identifica red flags
3. Salva analise no banco (qa_analyses)
4. Se nota < 6.0 ou red flag critica: envia alerta WhatsApp
5. As 18h: envia relatorio diario consolidado

**Classificacoes:**
- EXCELENTE (9-10)
- BOM (7.5-8.9)
- ADEQUADO (6-7.4)
- PRECISA_ATENCAO (4-5.9)
- CRITICO (0-3.9)

---

### 10-AI-Factory-V3-Unified.json

**Funcao:** Fluxo unificado que combina ingestao + processamento + validacao.

**Trigger:** Google Drive Trigger monitorando pasta de kickoffs

**Fases:**
1. **FASE 1 - Ingestao:**
   - Filtra apenas arquivos novos
   - Busca call no Supabase
   - Exporta texto
   - IA analisa kickoff (Groq Llama 3.3 70B)

2. **FASE 2 - Processamento:**
   - Parse JSON robusto
   - Cria agent_version no Supabase
   - Salva prompts_por_modo, hyperpersonalization, tools_config

3. **FASE 3 - Validacao:**
   - Prepara cenarios
   - Claude Sonnet 4 valida o agente
   - Switch por resultado (APROVADO/BLOQUEADO)
   - Auto-ativa se aprovado
   - Notifica via Slack se bloqueado

---

## Como os Fluxos se Interligam

```
                         FLUXO DE DADOS ENTRE WORKFLOWS

    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │  Google Drive                                                       │
    │  /7. Calls/                                                         │
    │       │                                                             │
    │       ▼                                                             │
    │  ┌─────────────┐                                                    │
    │  │ 01-Organi-  │                                                    │
    │  │ zador-Calls │                                                    │
    │  └─────┬───────┘                                                    │
    │        │ move arquivo                                               │
    │        ▼                                                            │
    │  ┌─────────────────────────────────────────────────────────────┐   │
    │  │             SUBPASTAS (cada uma dispara seu workflow)       │   │
    │  │                                                             │   │
    │  │  /1. Vendas/      ──▶  02-AI-Agent-Head-Vendas             │   │
    │  │  /2. Onboarding/  ──▶  03-Call-Analyzer-Onboarding         │   │
    │  │  /3. Revisao/     ──▶  06-Call-Analyzer-Revisao            │   │
    │  └─────────────────────────────────────────────────────────────┘   │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │  Supabase - agent_versions                                          │
    │  ┌─────────────────────────────────────────────────────────────┐   │
    │  │ status: 'pending_approval' | 'draft' | 'active' | 'archived'│   │
    │  │ is_active: true | false                                     │   │
    │  │ validation_status: null | 'APROVADO' | 'BLOQUEADO'          │   │
    │  └─────────────────────────────────────────────────────────────┘   │
    │                    │                         ▲                      │
    │                    │ poll a cada 5 min       │ atualiza             │
    │                    ▼                         │                      │
    │           ┌─────────────────┐                │                      │
    │           │ 08-Boot-Valida- │────────────────┘                      │
    │           │ tor             │                                       │
    │           └─────────────────┘                                       │
    │                    │                                                │
    │                    │ se aprovado: is_active = true                  │
    │                    ▼                                                │
    │           ┌─────────────────┐                                       │
    │           │ AGENTE ATIVO    │                                       │
    │           │ EM PRODUCAO     │                                       │
    │           └─────────────────┘                                       │
    │                    │                                                │
    └────────────────────┼────────────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │  GHL envia webhook quando lead manda mensagem                       │
    │                    │                                                │
    │                    ▼                                                │
    │           ┌─────────────────┐                                       │
    │           │ 05-AI-Agent-    │                                       │
    │           │ Execution-      │                                       │
    │           │ Modular         │                                       │
    │           └────────┬────────┘                                       │
    │                    │                                                │
    │                    ▼                                                │
    │           ┌─────────────────┐                                       │
    │           │ Resposta via    │                                       │
    │           │ GHL API         │                                       │
    │           └─────────────────┘                                       │
    │                    │                                                │
    │                    │ salva conversa                                 │
    │                    ▼                                                │
    │           ┌─────────────────┐                                       │
    │           │ agent_conver-   │                                       │
    │           │ sations         │                                       │
    │           └─────────────────┘                                       │
    │                    │                                                │
    │                    │ poll a cada 1 hora                             │
    │                    ▼                                                │
    │           ┌─────────────────┐                                       │
    │           │ 09-QA-Analyst   │────▶ Alertas se nota < 6.0            │
    │           │                 │────▶ Relatorio diario 18h             │
    │           └─────────────────┘                                       │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘


    ┌─────────────────────────────────────────────────────────────────────┐
    │                                                                     │
    │  WORKFLOW AUXILIAR                                                  │
    │                                                                     │
    │  07-Engenheiro-de-Prompt                                            │
    │  ┌─────────────────────────────────────────────────────────────┐   │
    │  │ Webhook /engenheiro-prompt                                  │   │
    │  │                                                             │   │
    │  │ Comandos:                                                   │   │
    │  │ • listar        → consulta agent_versions                   │   │
    │  │ • ver "Nome"    → mostra config do agente                   │   │
    │  │ • editar        → cria nova versao pending_approval         │   │
    │  │ • aprovar       → ativa versao manualmente                  │   │
    │  └─────────────────────────────────────────────────────────────┘   │
    │                                                                     │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## Banco de Dados (Supabase)

### Tabelas Principais

#### `agent_versions`
```sql
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  location_id VARCHAR(100),
  agent_name VARCHAR(255),
  version INTEGER DEFAULT 1,
  system_prompt TEXT,
  agent_config JSONB,        -- inclui prompts_por_modo, tools_config
  hyperpersonalization JSONB, -- DDD, setor, porte, cargo
  business_config JSONB,
  compliance_rules JSONB,
  personality_config JSONB,
  tools_config JSONB,
  status VARCHAR(50),         -- draft, pending_approval, active, archived
  validation_status VARCHAR(50),
  validation_score DECIMAL(4,2),
  validation_result JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  validated_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(100),
  approved_at TIMESTAMP WITH TIME ZONE
);
```

#### `call_recordings`
```sql
CREATE TABLE call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50),           -- diagnostico, kickoff, revisao, etc
  titulo VARCHAR(500),
  gdrive_file_id VARCHAR(200),
  gdrive_url TEXT,
  contact_id VARCHAR(100),
  location_id VARCHAR(100),
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  nome_lead VARCHAR(255),
  telefone VARCHAR(50),
  api_key VARCHAR(200),
  status VARCHAR(50),         -- novo, movido, analisado
  analise_json JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `agent_conversations`
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_version_id UUID REFERENCES agent_versions(id),
  contact_id VARCHAR(100),
  channel VARCHAR(50),
  status VARCHAR(50),
  resultado VARCHAR(50),
  mensagens_total INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  qa_analyzed BOOLEAN DEFAULT FALSE,
  qa_score DECIMAL(4,2),
  qa_analyzed_at TIMESTAMP WITH TIME ZONE
);
```

#### `qa_analyses`
```sql
CREATE TABLE qa_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id),
  agent_version_id UUID REFERENCES agent_versions(id),
  nota_clareza DECIMAL(4,2),
  nota_objecoes DECIMAL(4,2),
  nota_compliance DECIMAL(4,2),
  nota_avanco DECIMAL(4,2),
  nota_final DECIMAL(4,2),
  classificacao VARCHAR(50),
  red_flags_count INTEGER DEFAULT 0,
  precisa_alerta BOOLEAN DEFAULT FALSE,
  analise_completa JSONB,
  resumo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Modos de Agente

O sistema suporta 7 modos de operacao para o agente:

| Modo | Proposito | Quando Usar |
|------|-----------|-------------|
| `first_contact` | Primeiro contato com lead frio | Qualificacao inicial, criar interesse |
| `scheduler` | Agendar reunioes/consultas | Buscar disponibilidade, confirmar horario |
| `rescheduler` | Recuperar no-shows | Reagendar, entender motivo da falta |
| `concierge` | Pos-agendamento | Lembrar reuniao, manter engajamento ate o dia |
| `customer_success` | Pos-primeira reuniao | Fechar venda, upsell, fidelizacao |
| `objection_handler` | Lidar com objecoes | Quando lead apresenta resistencia |
| `followuper` | Reativar leads frios | Follow-up apos semanas/meses sem contato |

---

## Hiperpersonalizacao Engine

O sistema ajusta automaticamente o tom e linguagem baseado em:

### DDD (Regiao)
```javascript
const DDD_DATABASE = {
  '11': { cidade: 'Sao Paulo', cultura: 'objetiva', ritmo: 'acelerado' },
  '21': { cidade: 'Rio de Janeiro', cultura: 'descontraida', expressoes: ['cara', 'beleza'] },
  '31': { cidade: 'Belo Horizonte', cultura: 'acolhedora', expressoes: ['uai', 'so'] },
  '41': { cidade: 'Curitiba', cultura: 'formal', formalidade: 'alta' },
  '51': { cidade: 'Porto Alegre', cultura: 'direta', expressoes: ['bah', 'tche'] },
  // ...
};
```

### Setor
```javascript
const SETOR_DATABASE = {
  'saude': { analogias: ['diagnostico', 'tratamento'], tom: 'consultivo e empatico' },
  'juridico': { analogias: ['processo', 'defesa'], tom: 'formal e confiavel' },
  'tech': { analogias: ['deploy', 'sprint'], tom: 'tecnico mas acessivel' },
  // ...
};
```

### Porte
```javascript
const PORTE_DATABASE = {
  'micro': { abordagem: 'direta ao ponto, foco em ROI imediato' },
  'pequena': { abordagem: 'consultiva, mostrar como escalar' },
  'media': { abordagem: 'formal, apresentar business case' },
  'grande': { abordagem: 'institucional, foco em case' },
};
```

---

## Checklist de Deploy

### Pré-requisitos

- [ ] Supabase configurado com todas as tabelas
- [ ] Credenciais Groq API
- [ ] Credenciais Anthropic API (Claude)
- [ ] Credenciais Google Drive OAuth
- [ ] Credenciais GHL API (por location)

### Ordem de Ativacao

1. [ ] Executar migrations SQL
2. [ ] Configurar credenciais no n8n
3. [ ] Ativar 01-Organizador-Calls
4. [ ] Ativar 02-AI-Agent-Head-Vendas
5. [ ] Ativar 03-Call-Analyzer-Onboarding
6. [ ] Ativar 08-Boot-Validator
7. [ ] Ativar 05-AI-Agent-Execution-Modular
8. [ ] Ativar 09-QA-Analyst

### Testes Recomendados

1. [ ] Upload de arquivo de teste em /7. Calls/ com prefixo KICKOFF_
2. [ ] Verificar se moveu para /2. Onboarding/
3. [ ] Verificar se criou registro em call_recordings
4. [ ] Verificar se criou agent_version
5. [ ] Verificar se Boot Validator validou (a cada 5 min)
6. [ ] Enviar mensagem via GHL para testar execucao
7. [ ] Verificar se QA Analyst analisou conversa

---

## Credenciais Necessarias

| Servico | Uso | Workflows |
|---------|-----|-----------|
| Postgres (Supabase) | Banco de dados | Todos |
| Groq API | LLM Llama 3.3 70B | 02, 03, 05, 07 |
| Anthropic API | LLM Claude Sonnet | 08, 09 |
| Google Drive OAuth | Monitorar pastas | 01, 02, 03, 06 |
| GHL API | Enviar mensagens, atualizar contatos | 02, 05, 08, 09 |

---

**Mantenedor:** Marcos Daniels / Claude Code
**Versao do Sistema:** v3.0-hyperpersonalized
**Data:** 2025-12-20
