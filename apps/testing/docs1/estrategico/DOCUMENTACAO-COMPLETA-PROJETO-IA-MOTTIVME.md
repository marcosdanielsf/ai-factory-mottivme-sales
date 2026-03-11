# 🤖 DOCUMENTAÇÃO COMPLETA - PROJETO IA MOTTIVME

> **Documentação Master de todos os sistemas de IA e automação da MOTTIVME**
> Versão: 2.0
> Data: 18/12/2025
> Autor: Marcos Daniel (CEO) + Claude AI (Anthropic)
> Status: Em construção - Produção parcial

---

## 📑 ÍNDICE

1. [Visão Geral do Projeto](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura)
3. [Módulos e Componentes](#módulos)
4. [Fluxos de Negócio](#fluxos)
5. [Infraestrutura Técnica](#infraestrutura)
6. [Roadmap e Prioridades](#roadmap)
7. [Guias de Implementação](#guias)
8. [Troubleshooting](#troubleshooting)
9. [Referências Técnicas](#referências)

---

## 🎯 VISÃO GERAL DO PROJETO

### **Missão**

Criar um **ecossistema completo de IAs** que automatiza e otimiza todo o ciclo de vida do cliente MOTTIVME:
- Desde a **prospecção** (vendas)
- Passando pelo **onboarding** (implementação)
- Até a **operação contínua** (atendimento + revisões)
- E **gestão interna** (produtividade do CEO)

### **Objetivos de Negócio**

| Objetivo | Meta | Status Atual |
|----------|------|--------------|
| Reduzir tempo de setup de agentes | De 4-6h → 30min | 🟡 Parcial (Agent Factory v1.0) |
| Aumentar taxa de implementação | De 60% → 90% | 🔴 Não iniciado |
| Reduzir churn | De 20% → 10% | 🔴 Não iniciado |
| Escalar vendas | De 2 → 4 clientes/semana | 🔴 Não iniciado |
| Aumentar produtividade CEO | +50% tempo livre | 🔴 Não iniciado |

### **Princípios de Design**

1. **Automação Inteligente** - IA decide quando precisa de humano
2. **Qualidade > Velocidade** - Melhor errar devagar que acertar rápido e entregar ruim
3. **Feedback Loop** - Todo sistema aprende com dados reais
4. **Fail-Safe** - Se IA falhar, escala para humano gracefully
5. **Visibilidade Total** - Marcos sempre sabe o que está acontecendo

---

## 🏗️ ARQUITETURA DO SISTEMA

### **Diagrama Geral**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE GESTÃO (CEO)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ASSISTENTE IA EXECUTIVA (Sofia)                         │  │
│  │  - Monday.com Sync                                       │  │
│  │  - Gatilhos Ativos (8h, 12h, 15h, 18h)                  │  │
│  │  - WhatsApp Conversacional                               │  │
│  │  - Accountability & Lembretes                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE VENDAS                              │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Organizador Calls  │→ │ AI Head de Vendas  │                │
│  │ (monitora/numera)  │  │ (analisa BANT/SPIN)│                │
│  └────────────────────┘  └─────────┬──────────┘                │
│                                     │                            │
│                                     ↓                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Custom Objects GHL:                                    │    │
│  │ - Análises de Call                                     │    │
│  │ - Objeções (NOVO - P0)                                 │    │
│  │ - Feedback Loop Oportunidade (NOVO - P0)               │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE ONBOARDING                          │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Call Analyzer      │→ │ Agent Factory v2   │                │
│  │ Onboarding v2.3    │  │ (cria agente)      │                │
│  └────────────────────┘  └─────────┬──────────┘                │
│                                     │                            │
│                                     ↓                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Supabase:                                              │    │
│  │ - locations, clients, agent_versions                   │    │
│  │ - agent_metrics, call_recordings                       │    │
│  │ - prompt_change_requests                               │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE OPERAÇÃO                            │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ AI Agent           │  │ QA Analyst (NOVO)  │                │
│  │ Conversacional v2  │→ │ (monitora qualidade)│               │
│  └────────────────────┘  └────────────────────┘                │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Sistema de Alertas:                                    │    │
│  │ - Nota < 6 → WhatsApp CS                               │    │
│  │ - Loop detectado → Escala para humano                  │    │
│  │ - Objeção não tratada → Sugestão de melhoria           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE REVISÃO                             │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Call Analyzer      │→ │ Engenheiro Prompt  │                │
│  │ Revisão v2.0       │  │ (7 comandos)       │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### **Stack Tecnológico**

| Camada | Tecnologia | Uso |
|--------|------------|-----|
| **Automação** | n8n (self-hosted) | Workflows, integrações, cron jobs |
| **CRM** | GoHighLevel (GHL) | Gestão de leads, contacts, oportunidades |
| **Banco de Dados** | PostgreSQL (Supabase) | Agentes, métricas, análises, histórico |
| **IA Conversacional** | OpenAI GPT-4o / Anthropic Claude | Agentes conversacionais, análises |
| **IA de Análise** | Google Gemini 2.0 Flash | Transcrição e análise de calls |
| **WhatsApp** | Evolution API | Comunicação com leads e interno |
| **Propostas** | Propostal Webhook | Captura de interesse em propostas |
| **Tarefas** | Monday.com | Gestão de tarefas do CEO |
| **Notificações** | osascript (macOS) | Notificações desktop |

---

## 📦 MÓDULOS E COMPONENTES

### **MÓDULO 1: ASSISTENTE IA EXECUTIVA (Sofia)**

**Status:** 🟡 Documentado - Aguardando implementação

**Objetivo:** Maximizar produtividade do CEO através de accountability inteligente

#### **Componentes:**

##### **1.1 Workflow: Gatilhos Ativos**
```yaml
Arquivo: workflows/assistente-gatilhos-ativos.json
Triggers:
  - 08:00 - Morning Routine (apresenta tarefas + força escolha de 3 inegociáveis)
  - 12:00 - Noon Check-in (status das inegociáveis)
  - 15:00 - Afternoon Alert (alerta de deadline 3h)
  - 18:00 - Evening Review (review do dia + score + motivação)

Integrações:
  - Monday.com (busca tarefas)
  - PostgreSQL (salva estado diário)
  - WhatsApp (envia mensagens)
  - Desktop macOS (notificações)

Tabelas DB:
  - assistente_tasks
  - assistente_interactions
  - assistente_objectives
  - assistente_daily_state
  - assistente_scheduled_messages
```

##### **1.2 Workflow: WhatsApp Inbox**
```yaml
Arquivo: workflows/assistente-whatsapp-inbox.json
Trigger: Webhook (mensagens do WhatsApp)
Funcionalidades:
  - Recebe mensagem do Marcos
  - Busca contexto (tarefas, objetivos, histórico)
  - Processa com Claude AI
  - Executa ações (marcar concluída, adicionar tarefa)
  - Responde via WhatsApp
  - Loga interação

Ações disponíveis:
  - [ACTION:COMPLETE_TASK:id]
  - [ACTION:ADD_TASK:título]
  - [ACTION:GET_MOTIVATION]
```

##### **1.3 Workflow: Monday Sync**
```yaml
Arquivo: workflows/assistente-monday-sync.json
Trigger: Cron diário (07:00)
Funcionalidade:
  - Busca tarefas do Monday.com
  - Sincroniza com PostgreSQL
  - Atualiza estado diário
  - Prepara dados para gatilhos do dia
```

**Documentação Completa:** `ASSISTENTE-IA-EXECUTIVA-N8N.md`

---

### **MÓDULO 2: SISTEMA DE VENDAS**

**Status:** 🟢 Funcionando em produção

#### **Componentes:**

##### **2.1 Organizador de Calls**
```yaml
Arquivo: workflows/organizador-calls.json
Funcionalidade:
  - Monitora gravações do Gemini
  - Numera sequencialmente
  - Categoriza por tipo (Diagnóstico, Kickoff, Revisão, etc)
  - Move para pasta correta
  - Salva metadados no Supabase (call_recordings)

Custom Fields GHL:
  - ultima_call_tipo
  - ultima_call_data
  - total_calls
```

##### **2.2 AI Head de Vendas v2**
```yaml
Arquivo: workflows/ai-head-vendas-v2.json
Funcionalidade:
  - Analisa call de vendas (Diagnóstico)
  - Extrai BANT (Budget, Authority, Need, Timing)
  - Aplica SPIN Selling (Situation, Problem, Implication, Need-Payoff)
  - Calcula score de qualificação (0-100)
  - Detecta objeções
  - Recomenda próximos passos
  - Salva em Custom Object "Análises de Call"
  - Associa ao Contact

Custom Object: analises_de_call
Campos:
  - tipo_call
  - data_call
  - score_qualificacao
  - objecoes_detectadas
  - proximos_passos
  - transcricao_resumida
```

##### **2.3 Propostal Webhook**
```yaml
Arquivo: workflows/propostal-webhook.json
Trigger: Webhook do Propostal (lead vê proposta)
Funcionalidade:
  - Recebe score de interesse (tempo visualizado, páginas vistas)
  - Atualiza campo no GHL
  - Se score > 70 → Alerta SDR via WhatsApp
  - Loga no Supabase

Custom Fields GHL:
  - proposta_score_interesse
  - proposta_ultima_visualizacao
  - proposta_paginas_vistas
```

#### **🔴 PENDENTE - P0 (Esta Semana):**

##### **2.4 Custom Object: Objeções**
```yaml
Status: A criar
Funcionalidade:
  - Armazena objeções detectadas em vendas, renovação, cancelamento
  - Rastreia status (detectada, tratada, persistente)
  - Alimenta dashboard de objeções mais comuns

Campos necessários:
  - tipo (texto, preço, timing, marido, medo)
  - intensidade (baixa, média, alta)
  - contexto (venda, renovacao, cancelamento) ← NOVO
  - status (detectada, tratada, persistente)
  - proxima_acao (texto)
  - data_deteccao (datetime)
  - data_resolucao (datetime)

Associação: Contact → Objeções (1:N)
```

##### **2.5 Workflow: Feedback Loop Oportunidade**
```yaml
Status: A criar
Arquivo: workflows/feedback-loop-oportunidade.json
Trigger: GHL Opportunity Status → Won/Lost

Funcionalidade:
  - Busca Custom Object "Análise de Call" do contato
  - Atualiza campo: resultado_real = "ganho/perdido"
  - Compara: score_previsto vs resultado_real
  - Calcula acurácia da IA
  - Se acurácia < 70% → Alerta para revisar prompt
  - Salva no Supabase para métricas agregadas

Benefício: IA aprende com feedback e melhora previsões ao longo do tempo
```

---

### **MÓDULO 3: SISTEMA DE ONBOARDING**

**Status:** 🟢 Funcionando em produção (v1.0)

#### **Componentes:**

##### **3.1 Call Analyzer Onboarding v2.3**
```yaml
Arquivo: workflows/call-analyzer-onboarding-v2.3.json
Funcionalidade:
  - Analisa call de kickoff com cliente novo
  - Extrai:
    * Dados do cliente (nome, vertical, nicho)
    * Persona ideal
    * Objeções principais a quebrar
    * Diferenciais do negócio
    * Tom de voz desejado
  - Gera configuração completa para Agent Factory
  - Salva no Supabase (agent_configs)

Tabela DB: agent_configs
Campos:
  - client_id
  - persona_json
  - objecoes_json
  - diferenciais_json
  - tom_voz
  - created_at
```

##### **3.2 Agent Factory v1.0**
```yaml
Arquivo: workflows/agent-factory-v1.json
Status: 🟡 Funcional mas precisa melhorar (v2.0 em P0)

Funcionalidade:
  - Recebe config do Call Analyzer
  - Cria registro no Supabase (agent_versions)
  - Gera system prompt completo
  - Cria Custom Object "Agentes" no GHL
  - Associa ao Contact do cliente
  - Marca como is_active=TRUE

Problemas atuais:
  - Não tem retry se falhar
  - Não valida cada etapa
  - Erro silencioso em alguns casos

Tabela DB: agent_versions
Campos:
  - id (UUID)
  - client_id
  - versao (integer)
  - system_prompt (text)
  - is_active (boolean)
  - created_at
  - updated_at
```

#### **🔴 PENDENTE - P0 (Esta Semana):**

##### **3.3 Agent Factory v2.0 - Ultra Confiável**
```yaml
Status: A criar
Arquivo: workflows/agent-factory-v2.json

Melhorias sobre v1.0:
  ✅ Validação em cada etapa (não pula se algo falhar)
  ✅ Retry lógico (3 tentativas antes de desistir)
  ✅ Notificação detalhada de erro (WhatsApp CS)
  ✅ Fallback: cria versão "minimal funcional" se config completa falhar
  ✅ Log estruturado no Supabase de cada tentativa

Nova tabela DB: agent_factory_logs
Campos:
  - id
  - agent_version_id
  - step (string - ex: "create_supabase", "create_ghl_object")
  - status (pending, success, failed)
  - attempt (integer - qual tentativa)
  - error_message (text)
  - created_at

Fluxo melhorado:
  1. Recebe config → Valida JSON → Log: "validate_config"
  2. Cria registro Supabase → Retry 3x → Log: "create_supabase"
  3. Gera system prompt → Valida tamanho → Log: "generate_prompt"
  4. Cria Custom Object GHL → Retry 3x → Log: "create_ghl_object"
  5. Associa ao Contact → Retry 3x → Log: "associate_contact"
  6. Marca is_active=TRUE → Log: "activate_agent"
  7. Notifica CS: "Agente criado com sucesso" ou "Agente criado com config mínima"

Impacto esperado:
  - De 10 tentativas, 9 funcionam sozinhas
  - 1 falha mas você sabe exatamente onde e por quê
  - Configuração manual reduz de 4-6h → 30min
```

---

### **MÓDULO 4: SISTEMA DE OPERAÇÃO**

**Status:** 🟢 Funcionando em produção (v1.0)

#### **Componentes:**

##### **4.1 AI Agent Conversacional v1.0**
```yaml
Arquivo: workflows/ai-agent-conversacional-v1.json
Funcionalidade:
  - Recebe mensagem via webhook (Evolution API)
  - Busca agente ativo no Supabase
  - Carrega system prompt + histórico conversa
  - Processa com OpenAI GPT-4o
  - Responde via WhatsApp
  - Salva no histórico

Tabela DB: agent_conversations
Campos:
  - id
  - agent_version_id
  - contact_id
  - message_role (user, assistant)
  - message_content
  - created_at

Problemas atuais:
  - Sem retry se OpenAI falhar
  - Sem timeout (lead pode esperar muito)
  - Sem detecção de loop (repetir resposta)
```

#### **🔴 PENDENTE - P0 (Esta Semana):**

##### **4.2 AI Agent Conversacional v2.0 - Robusto**
```yaml
Status: A criar
Arquivo: workflows/ai-agent-conversacional-v2.json

Melhorias sobre v1.0:
  ✅ Retry com backoff exponencial (OpenAI falhou? espera 2s, 4s, 8s e tenta de novo)
  ✅ Timeout de 10s (se não responder, envia "Um momento, estou processando...")
  ✅ Detecção de loops (mesma resposta 2x seguidas = alerta + para conversa)
  ✅ Carregamento de contexto com fallback (se histórico muito grande, resume)
  ✅ Limite inteligente de histórico (últimas 20 mensagens ou 8000 tokens)
  ✅ Fallback final: "Me desculpe, vou transferir para um humano"

Nova lógica de retry:
  Tentativa 1: Timeout 10s → Falhou
  Tentativa 2: Timeout 15s, espera 2s → Falhou
  Tentativa 3: Timeout 20s, espera 4s → Falhou
  → Envia fallback message + alerta CS

Detecção de loop:
  - Salva hash MD5 da última resposta
  - Se nova resposta = hash anterior → Loop detectado
  - Ação: Para conversa, envia "Vou transferir para equipe", alerta CS

Impacto esperado:
  - IA responde 99% das vezes sem intervenção
  - 1% que falha escalona automaticamente para humano
  - Leads não ficam sem resposta
```

##### **4.3 Workflow: QA Analyst - Monitoramento de Qualidade**
```yaml
Status: A criar
Arquivo: workflows/qa-analyst.json
Trigger: Cron a cada 6h

Funcionalidade:
  - Busca conversas das últimas 6h
  - Para cada conversa:
    * Analisa com Claude/GPT-4
    * Dá nota 0-10 em 4 dimensões:
      - Cordialidade (tom amigável, empático)
      - Efetividade (quebrou objeções, gerou interesse)
      - Coerência (respostas fazem sentido, não repetiu)
      - Próximo passo (agendou, escalou ou definiu ação clara)
    * Calcula nota geral (média ponderada)
    * Detecta problemas:
      - Repetições (mesma resposta 2x)
      - Objeções mal tratadas
      - Loops de conversa
      - Falta de ação clara
    * Gera sugestões de melhoria
  - Se nota_geral < 6 OU problemas críticos:
    * Envia WhatsApp para CS com:
      - Score da conversa
      - Problemas detectados
      - Sugestões de ação
      - Link para conversa completa

Tabela DB: qa_analysis
Campos:
  - id
  - agent_version_id
  - conversation_id
  - nota_cordialidade (0-10)
  - nota_efetividade (0-10)
  - nota_coerencia (0-10)
  - nota_proximo_passo (0-10)
  - nota_geral (decimal 0-10)
  - problemas_detectados (jsonb)
  - sugestoes (jsonb)
  - alertar_cs (boolean)
  - motivo_alerta (text)
  - created_at

Prompt do QA:
```
```xml
<role>
Você é um Quality Assurance Analyst especializado em avaliar conversas de IA com leads.
</role>

<task>
Analise esta conversa entre a IA e o lead e dê notas de 0-10 em:

1. CORDIALIDADE - Tom amigável, empático, humano
2. EFETIVIDADE - Quebrou objeções, gerou interesse
3. COERÊNCIA - Respostas fazem sentido, não repetiu
4. PRÓXIMO PASSO - Agendou, escalou ou definiu ação clara

Detecte:
- Repetições (mesma resposta 2x seguidas)
- Objeções mal tratadas
- Loops de conversa
- Falta de ação clara
</task>

<output_format>
{
  "nota_cordialidade": 8,
  "nota_efetividade": 6,
  "nota_coerencia": 9,
  "nota_proximo_passo": 5,
  "nota_geral": 7.0,
  "problemas_detectados": [
    "IA repetiu pergunta sobre disponibilidade",
    "Lead mencionou preço alto mas IA não quebrou objeção"
  ],
  "sugestoes": [
    "Adicionar script de quebra de objeção de preço",
    "Evitar perguntar disponibilidade mais de 1x"
  ],
  "alertar_cs": true,
  "motivo_alerta": "Nota geral < 7 e objeção não tratada"
}
</output_format>

<conversation>
{{conversa_historico}}
</conversation>
```
```yaml

Dashboard de QA (View SQL):
```
```sql
CREATE VIEW v_agent_quality_metrics AS
SELECT
  av.id as agent_id,
  av.versao,
  c.nome as cliente,
  COUNT(qa.id) as total_analises,
  AVG(qa.nota_geral) as nota_media,
  COUNT(CASE WHEN qa.alertar_cs THEN 1 END) as total_alertas,
  MAX(qa.created_at) as ultima_analise
FROM agent_versions av
LEFT JOIN clients c ON av.client_id = c.id
LEFT JOIN qa_analysis qa ON qa.agent_version_id = av.id
WHERE av.is_active = TRUE
GROUP BY av.id, av.versao, c.nome;

-- Query para ver problemas
SELECT * FROM v_agent_quality_metrics
WHERE nota_media < 7 OR total_alertas > 0
ORDER BY nota_media ASC;
```
```yaml

Impacto esperado:
  - Você sabe ANTES do cliente que IA está errando
  - Resolve problema em 1h ao invés de perder cliente
  - Reduz churn de 20% → 10%
  - Paz de espírito: sistema te avisa quando precisa
```

---

### **MÓDULO 5: SISTEMA DE REVISÃO**

**Status:** 🟢 Funcionando em produção

#### **Componentes:**

##### **5.1 Call Analyzer Revisão v2.0**
```yaml
Arquivo: workflows/call-analyzer-revisao-v2.json
Funcionalidade:
  - Analisa call de revisão (PDCA com cliente)
  - Extrai:
    * O que está funcionando
    * O que precisa melhorar
    * Mudanças solicitadas no agente
  - Cria registro "pending" no Supabase (agent_versions com is_active=FALSE)
  - Notifica Engenheiro de Prompt

Tabela DB: agent_versions
Status: pending → Aguardando aprovação do Engenheiro
```

##### **5.2 Engenheiro de Prompt v1.0**
```yaml
Arquivo: workflows/engenheiro-prompt-v1.json
Trigger: 7 comandos via webhook

Comandos disponíveis:
  /engenheiro-ajustar-tom [agent_id] [tom_desejado]
  /engenheiro-adicionar-objecao [agent_id] [objecao] [resposta]
  /engenheiro-remover-script [agent_id] [script_id]
  /engenheiro-ajustar-persona [agent_id] [persona_nova]
  /engenheiro-preview [agent_id]
  /engenheiro-aprovar [agent_id]
  /engenheiro-reverter [agent_id]

Funcionalidade:
  - Recebe comando
  - Busca versão pending
  - Aplica modificação no system_prompt
  - Salva como nova versão pending
  - Retorna preview das mudanças
  - Ao aprovar: marca como is_active=TRUE e desativa versão anterior

Tabela DB: prompt_change_requests
Campos:
  - id
  - agent_version_id
  - change_type (ajustar_tom, adicionar_objecao, etc)
  - change_data (jsonb)
  - status (pending, approved, rejected)
  - created_at
  - approved_at
```

---

### **MÓDULO 6: SISTEMA DE ONBOARDING AUTOMATIZADO**

**Status:** 🔴 Não iniciado (P1 - Semana 2-3)

#### **Componentes Planejados:**

##### **6.1 Custom Object: Score de Implementação**
```yaml
Status: A criar (P1)

Campos:
  - cliente_id (lookup Contact)
  - score_total (number 0-100) - CALCULADO
  - nivel_resultado (select: Máximo/Bom/Limitado/Crítico)
  - audio_1_gravado (checkbox)
  - audio_2_gravado (checkbox)
  - audio_3_gravado (checkbox)
  - audio_4_gravado (checkbox)
  - audio_5_gravado (checkbox)
  - audio_6_gravado (checkbox)
  - audio_7_gravado (checkbox)
  - audio_8_gravado (checkbox)
  - video_1_gravado (checkbox)
  - video_2_gravado (checkbox)
  - video_3_gravado (checkbox)
  - video_4_gravado (checkbox)
  - scripts_aprovados (checkbox)
  - isca_criada (checkbox)
  - landing_page_aprovada (checkbox)
  - crm_configurado (checkbox)
  - agente_testado (checkbox)
  - primeira_lead_gerada (checkbox)
  - investimento_trafego (number)
  - criativos_mes (number)
  - ultima_atualizacao (datetime)

Fórmula do Score:
  score_total = (
    (áudios_gravados / 8 * 40) +     // 40% do score
    (vídeos_gravados / 4 * 20) +     // 20% do score
    (configs_técnicas / 5 * 20) +    // 20% do score
    (investimento > 5000 ? 10 : 5) + // 10% do score
    (criativos > 10 ? 10 : 5)        // 10% do score
  )

Níveis:
  - Máximo: 80-100 (vai ter resultado extraordinário)
  - Bom: 60-79 (vai ter resultado bom)
  - Limitado: 40-59 (resultado limitado, precisa melhorar)
  - Crítico: 0-39 (alto risco de churn, intervenção urgente)
```

##### **6.2 Workflow: Score Tracker**
```yaml
Status: A criar (P1)
Arquivo: workflows/score-tracker.json
Trigger: Poll a cada 6h

Funcionalidade:
  - Busca todos os Custom Objects "Score de Implementação"
  - Para cada cliente:
    * Calcula score_total
    * Atualiza campo calculado
    * Determina nivel_resultado
    * Salva no Supabase para histórico
  - Se score < 40:
    * Alerta CS via WhatsApp
    * Cria tarefa no Monday "Intervenção Urgente - Cliente X"
  - Se score >= 80:
    * Envia email de celebração
    * Notifica CS: "Cliente pronto para case de sucesso"

Tabela DB: client_score_history
Campos:
  - id
  - client_id
  - score (integer 0-100)
  - nivel (text)
  - detalhes (jsonb - breakdown do score)
  - created_at

Dashboard SQL:
```
```sql
CREATE VIEW v_client_scores AS
SELECT
  c.nome,
  cs.score,
  cs.nivel,
  cs.created_at,
  LAG(cs.score) OVER (PARTITION BY c.id ORDER BY cs.created_at) as score_anterior,
  cs.score - LAG(cs.score) OVER (PARTITION BY c.id ORDER BY cs.created_at) as variacao
FROM clients c
LEFT JOIN client_score_history cs ON cs.client_id = c.id
ORDER BY cs.created_at DESC;
```
```yaml

Impacto esperado:
  - Visibilidade em tempo real de quem vai ter resultado
  - Intervenção proativa antes de cliente reclamar
  - Dados para prever churn com 30 dias de antecedência
```

##### **6.3 Workflow: Follow-up Níveis + Stevo**
```yaml
Status: A criar (P1)
Arquivo: workflows/follow-up-niveis.json

5 Níveis de Follow-up:

Nível 1 - Trojan Horse (Isca):
  Trigger: Lead entrou mas não agendou
  Ação: Envia áudio "Permissão para enviar conteúdo?"
  Isca: PDF 1 página relevante para o nicho

Nível 2 - Grupo VIP (Stevo):
  Trigger: Lead aceitou isca
  Ação:
    - Cria grupo WhatsApp "[Cliente] - [Lead Nome]"
    - Adiciona lead ao grupo (#addnogrupo via Stevo)
    - Envia boas-vindas no grupo
    - Envia conteúdo exclusivo (vídeo curto ou áudio)

Nível 3 - Área de Membros:
  Trigger: Lead está no grupo há 2 dias
  Ação:
    - Envia link para área de membros Stevo
    - Acesso a 3 conteúdos exclusivos
    - Gamificação: "Desbloqueie mais conteúdo agendando"

Nível 4 - Case + Vídeo Social Proof:
  Trigger: Lead consumiu conteúdo da área
  Ação:
    - Envia case de sucesso similar ao problema do lead
    - Vídeo depoimento de cliente satisfeito
    - CTA: "Quer resultado parecido? Agende já"

Nível 5 - Break-up:
  Trigger: Passou 7 dias e lead não agendou
  Ação:
    - Mensagem de "despedida"
    - "Vou tirar você da lista, mas se mudar de ideia..."
    - Última chance com urgência

Tabela DB: lead_follow_up_status
Campos:
  - id
  - contact_id
  - nivel_atual (1-5)
  - data_ultimo_envio
  - proximo_envio_em
  - status (ativo, pausado, concluído)
  - converteu (boolean)
```

##### **6.4 Workflow: Onboarding Kickstart (Pós-Assinatura)**
```yaml
Status: A criar (P1)
Arquivo: workflows/onboarding-kickstart.json
Trigger: GHL Opportunity Status = WON

Funcionalidade:
  - Busca dados do cliente (nome, email, telefone, vertical)
  - Envia WhatsApp/Email com:
    * PDF Welcome Kit MOTTIVME
    * PDFs dos 8 Scripts de Áudio
    * PDFs dos 4 Scripts de Vídeo
    * Guia de Gravação
    * Checklist de Implementação (100 pontos)
    * Link para agendar Kickoff
  - Cria Custom Object "Score de Implementação" (score inicial = 0)
  - Cria grupo WhatsApp "[Cliente] - Onboarding"
  - Adiciona cliente no grupo
  - Envia mensagem de boas-vindas no grupo
  - Cria tarefa no Monday "Acompanhar onboarding [Cliente]"
  - Notifica CS: "Cliente novo assinado, materiais enviados"

Template da mensagem:
```
```
🎉 Bem-vindo à MOTTIVME, [Nome]!

Estamos MUITO animados em ter você na família!

📦 ACABEI DE ENVIAR NO SEU EMAIL:
✅ Welcome Kit MOTTIVME
✅ 8 Scripts de Áudio (prontos pra gravar)
✅ 4 Scripts de Vídeo
✅ Guia Completo de Gravação
✅ Checklist de Implementação

📅 PRÓXIMO PASSO:
Agende seu Kickoff aqui: [LINK CALENDLY]

Nessa call vamos:
• Mapear sua persona ideal
• Definir objeções a quebrar
• Criar estratégia de 90 dias

Também te adicionei no grupo de Onboarding.
Qualquer dúvida, pode perguntar lá!

Vamos JUNTOS fazer seu negócio EXPLODIR! 🚀

- Equipe MOTTIVME
```
```yaml

Impacto esperado:
  - Cliente sai do "assinei" para "operando" em 24-48h
  - Reduz confusão de "o que fazer agora?"
  - Aumenta taxa de implementação de 60% → 90%
```

---

## 🔄 FLUXOS DE NEGÓCIO

### **FLUXO 1: Ciclo Completo de Vendas**

```
Lead entra → SDR qualifica → Agenda call → [Organizador Calls]
                                                    ↓
                                            [AI Head de Vendas]
                                                    ↓
                                    Analisa BANT/SPIN → Score → Objeções
                                                    ↓
                              Cria "Análise de Call" + Associa Contact
                                                    ↓
                                    SDR vê análise → Cria Oportunidade
                                                    ↓
                              Envia proposta via Propostal
                                                    ↓
                              [Propostal Webhook] → Score de Interesse
                                                    ↓
                                    Se interesse alto → Alerta SDR
                                                    ↓
                                    Cliente fecha (Won)
                                                    ↓
                              [Feedback Loop] ← Atualiza: previsto vs real
                                                    ↓
                              [Onboarding Kickstart] → Materiais + Grupo
```

### **FLUXO 2: Ciclo de Onboarding**

```
Cliente assina → [Onboarding Kickstart]
                            ↓
            Envia materiais + Cria Score (0) + Grupo WhatsApp
                            ↓
                Cliente agenda Kickoff
                            ↓
                [Call Analyzer Onboarding]
                            ↓
        Extrai: persona, objeções, tom → Gera config
                            ↓
                [Agent Factory v2]
                            ↓
        Cria agente Supabase + GHL → is_active=TRUE
                            ↓
                Cliente começa a gravar áudios/vídeos
                            ↓
                [Score Tracker] (poll 6h)
                            ↓
        Atualiza score conforme cliente completa checklist
                            ↓
                Score < 40 → Alerta CS
                Score 80+ → Email celebração + Case
```

### **FLUXO 3: Operação Contínua**

```
Lead manda mensagem WhatsApp
            ↓
    [AI Agent Conversacional v2]
            ↓
    Busca agente ativo + histórico
            ↓
    Processa com GPT-4 (retry 3x se falhar)
            ↓
    Detecta loop? → Para + Escala humano
    Timeout? → "Um momento..."
            ↓
    Responde lead + Salva histórico
            ↓
    [QA Analyst] (poll 6h)
            ↓
    Analisa qualidade da conversa
            ↓
    Nota < 6 ou problemas? → Alerta CS
    Nota OK → Continua monitorando
```

### **FLUXO 4: Revisão e Melhoria**

```
Call de revisão (PDCA)
            ↓
    [Call Analyzer Revisão]
            ↓
    Extrai mudanças solicitadas
            ↓
    Cria versão "pending" no Supabase
            ↓
    Notifica Engenheiro de Prompt
            ↓
    [Engenheiro de Prompt]
            ↓
    Aplica comandos de ajuste
            ↓
    Preview mudanças → Aprova
            ↓
    Nova versão is_active=TRUE
    Versão antiga is_active=FALSE
            ↓
    Cliente vê melhoria no agente
```

### **FLUXO 5: Gestão Pessoal (CEO)**

```
07:00 → [Monday Sync] → Sincroniza tarefas
            ↓
08:00 → [Morning Routine] → Apresenta tarefas + Força escolha 3 inegociáveis
            ↓
    Marcos escolhe via WhatsApp: "1, 3, 5"
            ↓
    [WhatsApp Inbox] → Processa com Claude → Marca como críticas
            ↓
12:00 → [Noon Check-in] → Status das inegociáveis
            ↓
15:00 → [Afternoon Alert] → "Faltam 3h, corre!"
            ↓
18:00 → [Evening Review] → Score do dia + Motivação
            ↓
    Score < 70 → "Amanhã você recupera"
    Score 80+ → "Dia produtivo! Continue"
            ↓
Durante o dia: Marcos pode comandar via WhatsApp
    - "Marca tarefa X como concluída"
    - "Adiciona tarefa Y"
    - "Me lembra por que estou fazendo isso"
```

---

## 🏗️ INFRAESTRUTURA TÉCNICA

### **N8N (Servidor de Automação)**

```yaml
URL: https://cliente-a1.mentorfy.io/
Webhook Base: https://cliente-a1.mentorfy.io/webhook/
Instance ID: 9d65e6caa0e89e696b77790e020391d74468b15f71b3dcdb63aad81f090f5e69

Workflows Ativos (Produção):
  - organizador-calls.json
  - ai-head-vendas-v2.json
  - propostal-webhook.json
  - call-analyzer-onboarding-v2.3.json
  - agent-factory-v1.json
  - ai-agent-conversacional-v1.json
  - call-analyzer-revisao-v2.json
  - engenheiro-prompt-v1.json

Workflows Pendentes (P0 - Esta Semana):
  - agent-factory-v2.json
  - ai-agent-conversacional-v2.json
  - qa-analyst.json
  - feedback-loop-oportunidade.json

Workflows Planejados (P1 - Próximas Semanas):
  - assistente-gatilhos-ativos.json
  - assistente-whatsapp-inbox.json
  - assistente-monday-sync.json
  - score-tracker.json
  - follow-up-niveis.json
  - onboarding-kickstart.json

Credenciais Configuradas:
  - PostgreSQL: "postgress - financeiro - mottivme sales" (ID: WsU3bciJm7aMyAoC)
  - Twilio: "Twilio account" (ID: pauvhliYHlGqkTOY)
  - Monday.com: (via env var)
  - Anthropic Claude: (via env var - a configurar)
  - Evolution API: (via env var - a configurar)
```

### **PostgreSQL (Supabase)**

#### **Projeto Financeiro**
```yaml
Project ID: xbqxivqzetaoptuyykmx
URL: https://xbqxivqzetaoptuyykmx.supabase.co
Dashboard: https://supabase.com/dashboard/project/xbqxivqzetaoptuyykmx/editor

Tabelas Principais (Sistema MOTTIVME):
  - locations (multi-tenant por location GHL)
  - clients (clientes MOTTIVME)
  - agent_versions (versões dos agentes IA)
  - agent_metrics (métricas de performance)
  - agent_conversations (histórico de conversas)
  - call_recordings (metadados das gravações)
  - prompt_change_requests (histórico de mudanças)
  - agent_factory_logs (P0 - logs de criação de agentes)
  - qa_analysis (P0 - análises de qualidade)

Tabelas Pendentes (P0):
  - agent_factory_logs
  - qa_analysis

Tabelas Planejadas (P1):
  - client_score_history
  - lead_follow_up_status
```

#### **Projeto CEO (Assistente IA)**
```yaml
Project ID: bfumywvwubvernvhjehk
URL: https://bfumywvwubvernvhjehk.supabase.co

Tabelas (Assistente IA):
  - assistente_tasks
  - assistente_interactions
  - assistente_objectives
  - assistente_daily_state
  - assistente_scheduled_messages

Status: Tabelas criadas aguardando implementação dos workflows
```

### **GoHighLevel (CRM)**

```yaml
Location ID: cd1uyzpJox6XPt4Vct8Y
API Key: pit-fe627027-b9cb-4ea3-aaa4-149459e66a03
Base URL: https://app.socialfy.me

Custom Objects Ativos:
  - anlises_de_call (Análises de Call)
  - Agentes (Agentes IA)
  - Revisoes de Agente (Revisões)

Custom Objects Pendentes (P0):
  - Objecoes (Objeções detectadas)

Custom Objects Planejados (P1):
  - Score de Implementacao (Score 100 pontos)

Contatos Operacionais (Notificações):
  - Marcos Daniel: oaVXSzAd30bm5Mf2nMDW
  - Financeiro BPOSS: vUejYndMsxxnyGKO77JC
  - Gestão SDR: skfa6JP6lLlAXkc8FfIp
  - Agendamentos: XdsVZ9Fx0dzToMPinO2r
  - Automações/IA: Ql1qBRN8GTemuG0BlM0F

Telefone Admin: +5511936180422
```

### **APIs e Integrações**

```yaml
Monday.com:
  API Token: eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM1MDA3Mzc3NSwiYWFpIjoxMSwidWlkIjozNjMzNzQwNiwiaWFkIjoiMjAyNC0wNC0yMVQwOTo1MjozMi4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTQwNjE3OTksInJnbiI6InVzZTEifQ.-8-lOl8h6fcG82m_GdzckKnimiRRNTCxx8cHZTEEhXw
  Endpoint: https://api.monday.com/v2
  Board ID: [A configurar]

Anthropic Claude:
  API Key: [A configurar]
  Model: claude-3-5-sonnet-20241022
  Uso: Assistente IA + QA Analyst

OpenAI:
  API Key: [REDACTED - usar variavel de ambiente]
  Model Default: gpt-4o
  Model Fast: gpt-4o-mini
  Uso: AI Agents Conversacionais

Google Gemini:
  API Key: [Configurada em outra ferramenta de transcrição]
  Model: gemini-2.0-flash-exp
  Uso: Transcrição e análise de calls

Evolution API (WhatsApp):
  URL: [A configurar]
  API Key: [A configurar]
  Instance: mottivme-assistente
  Uso: Comunicação WhatsApp com leads e Marcos

Propostal:
  Webhook URL: https://cliente-a1.mentorfy.io/webhook/propostal
  Uso: Captura score de interesse em propostas
```

---

## 🗺️ ROADMAP E PRIORIDADES

### **P0 - ESTA SEMANA (Crítico - Coloca dinheiro no bolso)**

| Item | Módulo | Impacto | Tempo | Status |
|------|--------|---------|-------|--------|
| Custom Object `Objeções` | Vendas | Alto - Melhora vendas | 1h | 🔴 Pendente |
| Workflow Feedback Loop Oportunidade | Vendas | Alto - IA aprende | 2h | 🔴 Pendente |
| Agent Factory v2.0 | Onboarding | Crítico - Setup sem falhas | 4h | 🔴 Pendente |
| AI Agent Conversacional v2.0 | Operação | Alto - Cliente vê resultado | 3h | 🔴 Pendente |
| Workflow QA Analyst | Operação | Crítico - Paz de espírito | 3h | 🔴 Pendente |

**Total P0:** ~13h de trabalho
**Resultado esperado:** Sistema funciona com 99% de confiabilidade + visibilidade total

---

### **P1 - SEMANAS 2-3 (Importante - Escala e retenção)**

| Item | Módulo | Impacto | Tempo | Status |
|------|--------|---------|-------|--------|
| Custom Object Score Implementação | Onboarding | Alto - Reduz churn | 2h | 🔴 Pendente |
| Workflow Score Tracker | Onboarding | Alto - Visibilidade | 3h | 🔴 Pendente |
| Workflow Follow-up Níveis + Stevo | Vendas | Médio - Nutrição automática | 4h | 🔴 Pendente |
| Workflow Onboarding Kickstart | Onboarding | Alto - Experiência cliente | 3h | 🔴 Pendente |
| Assistente IA - Gatilhos Ativos | Gestão CEO | Alto - Produtividade Marcos | 2h | 🟡 Documentado |
| Assistente IA - WhatsApp Inbox | Gestão CEO | Alto - Accountability | 2h | 🟡 Documentado |
| Assistente IA - Monday Sync | Gestão CEO | Médio - Sincronização | 1h | 🟡 Documentado |

**Total P1:** ~17h de trabalho
**Resultado esperado:** Cliente implementa em 24h + Marcos 50% mais produtivo

---

### **P2 - SEMANA 4 (Otimização - Melhora resultados)**

| Item | Módulo | Impacto | Tempo | Status |
|------|--------|---------|-------|--------|
| Dashboard Cliente MVP | Onboarding | Médio - Transparência | 6h | 🔴 Pendente |
| Call Analyzer Suporte | Suporte | Baixo - Categoriza tickets | 3h | 🔴 Pendente |
| Teste End-to-End Completo | Todos | Alto - Validação | 4h | 🔴 Pendente |
| Ajustes baseados em feedback | Todos | Variável | 4h | 🔴 Pendente |

**Total P2:** ~17h de trabalho
**Resultado esperado:** Sistema validado com clientes reais + ajustes finos

---

### **P3 - MÊS 2+ (Expansão - Novas capacidades)**

| Item | Módulo | Impacto | Tempo | Status |
|------|--------|---------|-------|--------|
| Call Analyzer Churn | Churn | Médio - Previne cancelamentos | 3h | 🔴 Pendente |
| Dashboard Objeções Agregadas | Vendas | Baixo - Insights macro | 4h | 🔴 Pendente |
| Artilharia Nuclear MOTTIVME | Vendas | Alto - Prospecção ativa | 8h | 🔴 Pendente |
| Cadência Profissional (Email + SMS) | Vendas | Médio - Multi-canal | 6h | 🔴 Pendente |
| Biblioteca Iscas por Vertical | Marketing | Médio - Conteúdo pronto | 4h | 🔴 Pendente |

**Total P3:** ~25h de trabalho
**Resultado esperado:** Sistema completo e escalável

---

## 📚 GUIAS DE IMPLEMENTAÇÃO

### **GUIA 1: Implementar P0 (Esta Semana)**

#### **Passo 1: Custom Object Objeções**

1. Acessar GHL → Settings → Custom Objects
2. Criar novo: "Objeções"
3. Adicionar campos:
   ```
   - tipo (Dropdown: texto, preço, timing, marido, medo)
   - intensidade (Dropdown: baixa, média, alta)
   - contexto (Dropdown: venda, renovacao, cancelamento)
   - status (Dropdown: detectada, tratada, persistente)
   - proxima_acao (Text Area)
   - data_deteccao (Date Time)
   - data_resolucao (Date Time)
   ```
4. Configurar associação: Contact → Objeções (1:N)
5. Testar criação manual de uma objeção

#### **Passo 2: Workflow Feedback Loop Oportunidade**

1. Importar JSON no n8n: `workflows/feedback-loop-oportunidade.json`
2. Configurar trigger: GHL Webhook (Opportunity Status Changed)
3. Adicionar URL webhook no GHL: Settings → Integrations → Webhooks
4. Testar: Mudar status de uma oportunidade para Won/Lost
5. Verificar se campo `resultado_real` foi atualizado

#### **Passo 3: Agent Factory v2**

1. Criar tabela no Supabase:
   ```sql
   CREATE TABLE agent_factory_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     agent_version_id UUID REFERENCES agent_versions(id),
     step TEXT NOT NULL,
     status TEXT DEFAULT 'pending',
     attempt INTEGER DEFAULT 1,
     error_message TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. Importar JSON no n8n: `workflows/agent-factory-v2.json`
3. Configurar retry em cada etapa crítica
4. Testar com cliente piloto
5. Validar logs no Supabase

#### **Passo 4: AI Agent Conversacional v2**

1. Importar JSON no n8n: `workflows/ai-agent-conversacional-v2.json`
2. Configurar retry com backoff exponencial
3. Adicionar detecção de loop (hash MD5)
4. Configurar timeout de 10s
5. Testar com conversas simuladas

#### **Passo 5: QA Analyst**

1. Criar tabela no Supabase:
   ```sql
   CREATE TABLE qa_analysis (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     agent_version_id UUID REFERENCES agent_versions(id),
     conversation_id UUID REFERENCES agent_conversations(id),
     nota_cordialidade INTEGER,
     nota_efetividade INTEGER,
     nota_coerencia INTEGER,
     nota_proximo_passo INTEGER,
     nota_geral DECIMAL(3,1),
     problemas_detectados JSONB,
     sugestoes JSONB,
     alertar_cs BOOLEAN DEFAULT FALSE,
     motivo_alerta TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. Importar JSON no n8n: `workflows/qa-analyst.json`
3. Configurar cron: a cada 6h
4. Testar análise de 1 conversa real
5. Verificar se alerta foi enviado (se nota < 6)

---

### **GUIA 2: Implementar Assistente IA (P1)**

**Documentação completa:** `ASSISTENTE-IA-EXECUTIVA-N8N.md`

**Resumo dos passos:**
1. Criar tabelas no PostgreSQL (Projeto CEO)
2. Configurar variáveis de ambiente no n8n
3. Setup Evolution API para WhatsApp
4. Importar 3 workflows
5. Testar cada gatilho individualmente
6. Ativar workflows

**Tempo estimado:** 6-7h

---

## 🔧 TROUBLESHOOTING

### **Problema: Agent Factory falha silenciosamente**

**Sintomas:**
- Workflow executa sem erro mas agente não aparece no GHL
- Supabase cria registro mas is_active=FALSE

**Diagnóstico:**
1. Verificar logs no n8n: Executions → Ver último run
2. Verificar tabela `agent_factory_logs` no Supabase
3. Identificar qual step falhou

**Solução:**
- Se falhou em "create_ghl_object": Verificar API Key GHL válida
- Se falhou em "associate_contact": Verificar se Contact ID existe
- Se falhou 3x: Agent Factory v2 cria versão minimal e alerta CS

---

### **Problema: AI Agent não responde lead**

**Sintomas:**
- Lead manda mensagem mas não recebe resposta
- Workflow não executa

**Diagnóstico:**
1. Verificar se webhook Evolution API está configurado
2. Verificar logs do n8n: Executions
3. Verificar se agente existe no Supabase com is_active=TRUE

**Solução:**
- Webhook não configurado: Adicionar URL no Evolution API
- Agente não encontrado: Rodar Agent Factory manualmente
- OpenAI timeout: AI Agent v2 tem retry automático

---

### **Problema: QA Analyst não envia alertas**

**Sintomas:**
- Conversas ruins mas CS não recebe notificação
- Tabela `qa_analysis` vazia

**Diagnóstico:**
1. Verificar cron job ativo: n8n → Workflows → QA Analyst
2. Verificar se há conversas nas últimas 6h
3. Ver logs de execução

**Solução:**
- Cron desativado: Ativar workflow
- Nenhuma conversa: Normal, aguardar próximas 6h
- Erro na análise: Verificar API Key Anthropic válida

---

### **Problema: Assistente IA não sincroniza Monday**

**Sintomas:**
- Gatilho das 8h não mostra tarefas do dia
- Tabela `assistente_tasks` vazia

**Diagnóstico:**
1. Verificar Monday Sync executou às 7h
2. Verificar Board ID configurado
3. Ver logs do workflow

**Solução:**
- Workflow desativado: Ativar
- Board ID errado: Corrigir variável de ambiente
- API Token expirado: Renovar token Monday

---

## 📖 REFERÊNCIAS TÉCNICAS

### **Documentos do Projeto**

| Documento | Caminho | Uso |
|-----------|---------|-----|
| Credenciais Master | `CREDENCIAIS-MASTER.md` | Todas as APIs e credenciais |
| Assistente IA (Completo) | `ASSISTENTE-IA-EXECUTIVA-N8N.md` | Implementação detalhada Sofia |
| Documentação Completa | `DOCUMENTACAO-COMPLETA-PROJETO-IA-MOTTIVME.md` | Este documento |

### **Arquivos-Guia da Empresa**

```yaml
Checklist Criação: /Users/marcosdaniels/Desktop/CHECKLIST - O Que Precisa Ser Criado.md
Plano 90 Dias: /Users/marcosdaniels/Desktop/PLANO 90 DIAS - 100K MRR - Sistema Assembly Line + Socialfy.md
Planejamento Estratégico: /Users/marcosdaniels/Library/CloudStorage/GoogleDrive-ceo@marcosdaniels.com/Meu Drive/1. ESTRUTURA GERAL/3. ESTRATÉGICO - OKRs E KPIs - ⚙️/Planejamento-Anual/PLANEJAMENTO ESTRATÉGICO MOTTIVME - Estrutura, Produtos e Precificação.md
```

### **Workflows JSON (Quando Criados)**

```
workflows/
├── producao/
│   ├── organizador-calls.json
│   ├── ai-head-vendas-v2.json
│   ├── propostal-webhook.json
│   ├── call-analyzer-onboarding-v2.3.json
│   ├── agent-factory-v1.json
│   ├── ai-agent-conversacional-v1.json
│   ├── call-analyzer-revisao-v2.json
│   └── engenheiro-prompt-v1.json
├── p0-esta-semana/
│   ├── agent-factory-v2.json
│   ├── ai-agent-conversacional-v2.json
│   ├── qa-analyst.json
│   └── feedback-loop-oportunidade.json
└── p1-proximas-semanas/
    ├── assistente-gatilhos-ativos.json
    ├── assistente-whatsapp-inbox.json
    ├── assistente-monday-sync.json
    ├── score-tracker.json
    ├── follow-up-niveis.json
    └── onboarding-kickstart.json
```

### **Schemas SQL (Quando Criados)**

```
schemas/
├── supabase-financeiro/
│   ├── agent_factory_logs.sql
│   └── qa_analysis.sql
└── supabase-ceo/
    ├── assistente_tasks.sql
    ├── assistente_interactions.sql
    ├── assistente_objectives.sql
    ├── assistente_daily_state.sql
    └── assistente_scheduled_messages.sql
```

---

## 🎯 PRÓXIMAS AÇÕES

### **HOJE:**
1. ✅ Ler este documento completo
2. ✅ Decidir: Priorizar P0 ou Assistente IA primeiro?
3. ✅ Se P0: Começar por Custom Object Objeções
4. ✅ Se Assistente: Começar por setup banco (30 min)

### **ESTA SEMANA:**
1. ⏳ Implementar todos os 5 itens de P0
2. ⏳ Testar com 1 cliente piloto
3. ⏳ Validar que sistema funciona com 99% confiabilidade

### **PRÓXIMAS SEMANAS:**
1. ⏳ Implementar Assistente IA completa
2. ⏳ Implementar Score Tracker
3. ⏳ Implementar Follow-up Níveis

---

**🚀 RESUMO EXECUTIVO:**

Este documento é a **fonte única da verdade** para todo o Projeto IA MOTTIVME.

**Onde estamos:**
- ✅ Sistema de Vendas funcionando
- ✅ Sistema de Onboarding v1.0 funcionando
- ✅ Sistema de Operação v1.0 funcionando
- ✅ Sistema de Revisão funcionando

**Próximos passos críticos (P0):**
1. Tornar sistema 99% confiável (Agent Factory v2 + AI Agent v2)
2. Ter visibilidade total (QA Analyst)
3. Fechar loop de vendas (Feedback Loop)

**Meta final:**
Sistema completamente automatizado que:
- Vende sozinho
- Onboarda sozinho
- Atende sozinho
- Se auto-melhora
- Alerta quando precisa de humano
- Marcos foca 100% em crescimento estratégico

---

*Documento mantido por: Marcos Daniel + Claude AI*
*Última atualização: 18/12/2025 - v2.0*
*Status: Living Document - Atualizar conforme implementação avança*
