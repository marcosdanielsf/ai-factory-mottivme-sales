# AI Factory V3 - Diagrama Simplificado

## Fluxo Principal (Ciclo de Vida do Agente)

```
                    ENTRADA
                       │
                       ▼
    ┌──────────────────────────────────────┐
    │  1. ARQUIVO CALL NO GOOGLE DRIVE     │
    │     /7. Calls/                       │
    └──────────────────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────┐
    │  2. 01-ORGANIZADOR-CALLS             │
    │                                      │
    │  • Classifica por prefixo            │
    │  • Move para subpasta correta        │
    │  • Registra no Supabase              │
    └──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │/1.Vendas│ │/2.Onboard│ │/3.Revisao│
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ 02-Head  │ │ 03-Call  │ │ 06-Call  │
    │ Vendas   │ │ Analyzer │ │ Revisao  │
    │          │ │ Onboard  │ │          │
    │ Score    │ │ Cria     │ │ Atualiza │
    │ BANT/SPIN│ │ Agente   │ │ Agente   │
    └──────────┘ └────┬─────┘ └──────────┘
                      │
                      ▼
    ┌──────────────────────────────────────┐
    │  3. SUPABASE - agent_versions        │
    │     status: pending_approval         │
    └──────────────────────────────────────┘
                      │
                      ▼ (poll a cada 5 min)
    ┌──────────────────────────────────────┐
    │  4. 08-BOOT-VALIDATOR                │
    │                                      │
    │  • Simula 7-10 cenarios              │
    │  • Avalia Tom, Compliance, Clareza   │
    │  • Nota >= 8.0 → APROVADO            │
    │  • Nota 6.0-7.9 → COM RESTRICOES     │
    │  • Nota < 6.0 → BLOQUEADO            │
    └──────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   APROVADO     COM RESTRICOES  BLOQUEADO
   (auto-ativa)  (notifica)    (notifica)
        │
        ▼
    ┌──────────────────────────────────────┐
    │  5. AGENTE ATIVO EM PRODUCAO         │
    │     is_active = true                 │
    └──────────────────────────────────────┘
                      │
                      │ Webhook GHL
                      ▼
    ┌──────────────────────────────────────┐
    │  6. 05-AI-AGENT-EXECUTION-MODULAR    │
    │                                      │
    │  • Recebe mensagem do lead           │
    │  • Busca agente ativo                │
    │  • Identifica modo (scheduler, etc)  │
    │  • Executa IA com prompt do modo     │
    │  • Envia resposta via GHL            │
    │  • Salva conversa no Supabase        │
    └──────────────────────────────────────┘
                      │
                      ▼ (poll a cada 1h)
    ┌──────────────────────────────────────┐
    │  7. 09-QA-ANALYST                    │
    │                                      │
    │  • Busca conversas nao analisadas    │
    │  • Analisa 4 dimensoes               │
    │  • Se nota < 6.0 → ALERTA            │
    │  • Relatorio diario 18h              │
    └──────────────────────────────────────┘
```

---

## Tabela Rapida de Workflows

| # | Nome | Trigger | O que faz |
|---|------|---------|-----------|
| 01 | Organizador-Calls | G.Drive /7.Calls/ | Classifica e move arquivos |
| 02 | AI-Agent-Head-Vendas | G.Drive /1.Vendas/ | Analisa calls de diagnostico |
| 03 | Call-Analyzer-Onboarding | G.Drive /2.Onboard/ | Cria agente a partir de kickoff |
| 05 | AI-Agent-Execution-Modular | Webhook GHL | Executa agente em producao |
| 06 | Call-Analyzer-Revisao | G.Drive /3.Revisao/ | Analisa calls de revisao |
| 07 | Engenheiro-de-Prompt | Webhook | Ajustes manuais em prompts |
| 08 | Boot-Validator | Schedule 5min | Valida agentes automaticamente |
| 09 | QA-Analyst | Schedule 1h | Monitora performance |
| 10 | AI-Factory-V3-Unified | G.Drive | Fluxo unificado (alternativo) |

---

## Conexoes entre Workflows

```
01-Organizador-Calls
       │
       ├──▶ 02-AI-Agent-Head-Vendas (via pasta /1.Vendas/)
       │
       ├──▶ 03-Call-Analyzer-Onboarding (via pasta /2.Onboarding/)
       │         │
       │         └──▶ Cria agent_version → dispara 08-Boot-Validator
       │
       └──▶ 06-Call-Analyzer-Revisao (via pasta /3.Revisao/)


08-Boot-Validator
       │
       └──▶ Se aprovado, ativa agente → pode ser usado por 05-Execution


05-AI-Agent-Execution-Modular
       │
       └──▶ Salva conversas → analisadas por 09-QA-Analyst


07-Engenheiro-de-Prompt
       │
       └──▶ Cria novas versoes → validadas por 08-Boot-Validator
```

---

## Bancos de Dados Utilizados

| Tabela | Workflows que usam |
|--------|-------------------|
| `call_recordings` | 01, 02, 03, 06 |
| `agent_versions` | 03, 05, 07, 08, 09 |
| `clients` | 03, 07, 09 |
| `locations` | 02, 03, 05 |
| `agent_conversations` | 05, 09 |
| `agent_conversation_messages` | 05, 09 |
| `qa_analyses` | 09 |
| `call_counters` | 01 |

---

## APIs Externas

| API | Workflows | Uso |
|-----|-----------|-----|
| Groq (Llama 3.3 70B) | 02, 03, 05, 07 | LLM principal |
| Anthropic (Claude) | 08, 09, 10 | Validacao e QA |
| Google Drive | 01, 02, 03, 06 | Monitorar pastas |
| GHL API | 01, 02, 05, 08, 09 | Contatos, mensagens, custom fields |
