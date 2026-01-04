---
layout: home

hero:
  name: AI Factory V3
  text: Sistema de Agentes IA
  tagline: Automação inteligente para GoHighLevel - Mottivme Sales
  actions:
    - theme: brand
      text: Começar
      link: /arquitetura/
    - theme: alt
      text: Ver Workflows
      link: /workflows/

features:
  - icon: 🤖
    title: Agentes Hiperpersonalizados
    details: Cria agentes de IA automaticamente a partir de calls de kickoff, com personalização por DDD, setor e porte.
  - icon: ✅
    title: Validação Integrada
    details: Fase 3 do Call-Analyzer valida agentes com anti-alucinação antes de ativar. Nota mínima 8.0 para aprovação.
  - icon: 📊
    title: QA em Tempo Real
    details: QA Analyst monitora todas as conversas e alerta se performance cair abaixo de 6.0.
  - icon: 🔄
    title: Self-Improving
    details: Reflection Loop + Prompt Updater auto-melhoram agentes baseado em análise de conversas reais.
---

## Visão Geral

O **AI Factory V3** é um sistema completo de 6 camadas para criar, validar, executar e auto-melhorar agentes de IA conversacionais.

| Camada | Função | Workflows |
|--------|--------|-----------|
| **Ingestão** | Captura calls, organiza, cria agentes | 01, 02, 03, 06 |
| **Provisionamento** | Provisiona agentes no GHL | 04, 07 |
| **Execução** | Roda agentes em produção | 05 |
| **QA & Monitoramento** | Monitora qualidade e avalia | 08, 10 |
| **Self-Improving** | Auto-melhora prompts e calibra predições | 09, 11, 13 |
| **Multi-Tenant** | Classificação multi-cliente | 12 |

## Fluxo Resumido

```
Call Google Meet/Zoom
       │
       ▼
01-Organizador-Calls (classifica e move)
       │
       ▼
03-Call-Analyzer-Onboarding (cria agente com validação)
       │
       ▼
04-Agent-Factory (provisiona no GHL)
       │
       ▼
05-Execution-Modular (roda em produção)
       │
       ▼
08-QA-Analyst (monitora qualidade)
       │
       ▼
09-Reflection-Loop → 11-Prompt-Updater (auto-melhora)
```

## Tecnologias

- **n8n** - Orquestração de workflows
- **Groq (Llama 3.3 70B)** - LLM principal para execução
- **Claude Opus 4** - Prompt engineering e self-improving
- **Claude Sonnet 4.5** - Validação e QA
- **Supabase (PostgreSQL)** - Banco de dados
- **GoHighLevel** - CRM e WhatsApp
- **Google Drive** - Armazenamento de calls

## Referências

- [Testing Framework](/referencias/ai-factory-testing-framework/) - Framework Python para testes (40% implementado)
- [Starter Kit](/referencias/Self_Improving_System_Starter_Kit/) - Material de referência teórica
- [Dashboard Reference](/referencias/Prints%20Dash%20Automelhoraemtno/) - Screenshots de referência para dashboard
