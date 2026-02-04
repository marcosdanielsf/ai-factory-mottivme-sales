# Arquitetura do Sistema

O AI Factory V3 e um sistema de 6 camadas para criar, validar, executar e auto-melhorar agentes de IA conversacionais.

## Camadas

| Camada | Funcao | Workflows |
|--------|--------|-----------|
| **Ingestao** | Captura calls, organiza, cria agentes | 01, 02, 03, 06 |
| **Provisionamento** | Provisiona agentes no GHL | 04, 07 |
| **Execucao** | Roda agentes em producao | 05 |
| **QA & Monitoramento** | Monitora qualidade e avalia | 08, 10 |
| **Self-Improving** | Auto-melhora prompts e calibra predicoes | 09, 11, 13 |
| **Multi-Tenant** | Classificacao multi-cliente | 12 |

## Documentos

- [Contexto AI Factory V3](./CONTEXTO-AI-FACTORY-V3.md)
- [Documentacao Completa](./DOCUMENTACAO-AI-FACTORY-V3.md)
- [Diagrama de Fluxos](./diagrama)
- [Arquitetura Unificada](./ARQUITETURA-MOTTIVME-UNIFIED-AI-SYSTEM.md)
- [Integracao Multi-Tenant](./MULTI_TENANT_INTEGRATION.md)

## Stack Tecnologico

- **n8n** - Orquestracao de workflows
- **Groq (Llama 3.3 70B)** - LLM principal para execucao
- **Claude Opus 4** - Prompt engineering e self-improving
- **Claude Sonnet 4.5** - Validacao e QA
- **Supabase (PostgreSQL)** - Banco de dados com pgvector
- **GoHighLevel** - CRM e WhatsApp
- **Google Drive** - Armazenamento de calls
