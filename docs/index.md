---
layout: home

hero:
  name: AI Factory V3
  text: Sistema de Agentes IA
  tagline: Automacao inteligente para GoHighLevel - Mottivme Sales
  actions:
    - theme: brand
      text: Comecar
      link: /arquitetura
    - theme: alt
      text: Ver Workflows
      link: /workflows/

features:
  - icon: 🤖
    title: Agentes Hiperpersonalizados
    details: Cria agentes de IA automaticamente a partir de calls de kickoff, com personalizacao por DDD, setor e porte.
  - icon: ✅
    title: Validacao Automatica
    details: Boot Validator testa agentes em 7-10 cenarios antes de ir para producao. Nota minima 8.0 para aprovacao.
  - icon: 📊
    title: QA em Tempo Real
    details: QA Analyst monitora todas as conversas e alerta se performance cair abaixo de 6.0.
  - icon: 🔄
    title: 7 Modos de Operacao
    details: first_contact, scheduler, rescheduler, concierge, customer_success, objection_handler, followuper.
---

## Visao Geral

O **AI Factory V3** e um sistema completo de 3 camadas para criar, validar e executar agentes de IA conversacionais.

| Camada | Funcao | Workflows |
|--------|--------|-----------|
| **Ingestao** | Captura calls, organiza, cria agentes | 01, 02, 03, 06, 10 |
| **Validacao** | Valida automaticamente antes de producao | 08 |
| **Execucao/QA** | Roda agentes e monitora qualidade | 05, 09 |

## Fluxo Resumido

```
Call Google Meet/Zoom
       │
       ▼
01-Organizador-Calls (classifica e move)
       │
       ▼
03-Call-Analyzer (cria agente)
       │
       ▼
08-Boot-Validator (valida automaticamente)
       │
       ▼
05-Execution (roda em producao)
       │
       ▼
09-QA-Analyst (monitora qualidade)
```

## Tecnologias

- **n8n** - Orquestracao de workflows
- **Groq (Llama 3.3 70B)** - LLM principal
- **Claude Sonnet** - Validacao e QA
- **Supabase (PostgreSQL)** - Banco de dados
- **GoHighLevel** - CRM e WhatsApp
- **Google Drive** - Armazenamento de calls
