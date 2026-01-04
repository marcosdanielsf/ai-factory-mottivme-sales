# Workflows

## Mapa de Workflows (13 total)

| # | Nome | Trigger | Função |
|---|------|---------|--------|
| 01 | Organizador-Calls | G.Drive /7.Calls/ | Classifica e move arquivos |
| 02 | Head de Vendas | G.Drive /1.Vendas/ | Analisa calls de diagnóstico |
| 03 | Call-Analyzer-Onboarding | G.Drive /2.Onboard/ | Cria agente a partir de kickoff |
| 04 | Agent-Factory | Webhook | Provisiona agente no GHL |
| 05 | Execution-Modular | Webhook GHL | Executa agente em produção |
| 06 | Call-Analyzer-Revisao | G.Drive /3.Revisao/ | Analisa calls de revisão |
| 07 | Engenheiro-de-Prompt | Webhook | Ajustes manuais em prompts |
| 08 | QA-Analyst | Schedule 1h | Monitora performance |
| 09 | Reflection-Loop | Schedule 6h | Analisa conversas e identifica padrões |
| 10 | AI-as-Judge | Webhook | LLM-as-Judge para avaliar agentes |
| 11 | Prompt-Updater | Webhook | Gera melhorias automáticas de prompts |
| 12 | Multi-Tenant-Inbox-Classifier | Webhook | Classifica mensagens multi-tenant |
| 13 | Feedback-Loop-Oportunidade | Webhook | Calibra IA comparando predição vs resultado real |

## Conexões entre Workflows

```
01-Organizador-Calls
       │
       ├──▶ 02-Head-Vendas (via pasta /1.Vendas/)
       │
       ├──▶ 03-Call-Analyzer-Onboarding (via pasta /2.Onboarding/)
       │         │
       │         └──▶ Cria agent_version → dispara 04-Agent-Factory
       │
       └──▶ 06-Call-Analyzer-Revisao (via pasta /3.Revisao/)


04-Agent-Factory
       │
       └──▶ Provisiona agente no GHL → pode ser usado por 05-Execution


05-Execution-Modular
       │
       └──▶ Salva conversas → analisadas por 08-QA-Analyst


08-QA-Analyst
       │
       └──▶ Gera qa_scores → alimenta 09-Reflection-Loop


09-Reflection-Loop (SELF-IMPROVING)
       │
       ├──▶ 10-AI-as-Judge (avaliação LLM)
       │
       └──▶ 11-Prompt-Updater (auto-melhoria)
              │
              ├── auto_apply (confiança alta)
              └── suggestion (requer aprovação)


07-Engenheiro-de-Prompt
       │
       └──▶ Cria novas versões manualmente


13-Feedback-Loop-Oportunidade
       │
       └──▶ Calibra predições comparando com resultados reais (won/lost)
              │
              ├── Atualiza call_recordings.analise_json.feedback_loop
              └── Registra churns em churn_reasons
```

## Camadas do Sistema

### Camada 1: Ingestão
- **01-Organizador-Calls**: Orquestrador inicial
- **02-Head-Vendas**: Analisa calls de vendas
- **03-Call-Analyzer-Onboarding**: Cria agentes de kickoff
- **06-Call-Analyzer-Revisao**: Analisa revisões

### Camada 2: Provisionamento
- **04-Agent-Factory**: Cria agente no GHL
- **07-Engenheiro-de-Prompt**: Ajustes manuais

### Camada 3: Execução
- **05-Execution-Modular**: Executa em produção

### Camada 4: QA & Monitoramento
- **08-QA-Analyst**: Monitora qualidade
- **10-AI-as-Judge**: Avalia com LLM

### Camada 5: Self-Improving
- **09-Reflection-Loop**: Análise de padrões
- **11-Prompt-Updater**: Auto-melhoria de prompts
- **13-Feedback-Loop-Oportunidade**: Calibração de predições com resultados reais

### Camada 6: Multi-Tenant
- **12-Multi-Tenant-Inbox-Classifier**: Classificação multi-cliente
