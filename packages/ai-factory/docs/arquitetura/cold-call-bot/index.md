# Cold Call Bot - Arquitetura

Sistema de ligações telefônicas com IA para prospecção ativa.

## Visão Geral

Bot que faz ligações outbound usando IA conversacional, com:
- Voz natural em PT-BR
- Qualificação automática de leads
- Dashboard de custos em tempo real
- Sistema de retry inteligente

## Stack

| Componente | Tecnologia | Função |
|-----------|------------|--------|
| Framework | pipecat-ai | Orquestração de pipeline de voz |
| STT | Deepgram Nova-3 | Speech-to-Text (PT-BR) |
| LLM | OpenAI gpt-4o-mini | Conversação + Function Calling |
| TTS | Cartesia Sonic-3 | Text-to-Speech (voz Luana) |
| Telefonia | Telnyx + Twilio | Dual provider (failover) |
| Backend | FastAPI + WebSocket | Servidor de chamadas |
| Banco | Supabase (PostgreSQL) | Logs, métricas, retry queue |
| Deploy | Railway | Auto-deploy de GitHub |
| Frontend | React + Vite + Tailwind | Dashboard de monitoramento |
| Frontend Deploy | Vercel | Auto-deploy |

## Páginas

- [Pipeline de Voz](./pipeline) — Como o áudio flui do lead até a IA
- [Processo de Construção](./processo) — Como o sistema foi construído
- [Metodologia](./metodologia) — Padrão de sub-agentes e orquestração
- [Troubleshooting](./troubleshooting) — Bugs conhecidos e soluções
