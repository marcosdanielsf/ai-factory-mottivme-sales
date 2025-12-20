# Workflows

## Mapa de Workflows

| # | Nome | Trigger | Funcao |
|---|------|---------|--------|
| 01 | [Organizador-Calls](./01-organizador-calls) | G.Drive /7.Calls/ | Classifica e move arquivos |
| 02 | [Head de Vendas](./02-head-vendas) | G.Drive /1.Vendas/ | Analisa calls de diagnostico |
| 03 | [Call-Analyzer](./03-call-analyzer) | G.Drive /2.Onboard/ | Cria agente a partir de kickoff |
| 05 | [Execution](./05-execution) | Webhook GHL | Executa agente em producao |
| 07 | [Engenheiro](./07-engenheiro) | Webhook | Ajustes manuais em prompts |
| 08 | [Validator](./08-validator) | Schedule 5min | Valida agentes automaticamente |
| 09 | [QA-Analyst](./09-qa-analyst) | Schedule 1h | Monitora performance |

## Conexoes entre Workflows

```
01-Organizador-Calls
       │
       ├──▶ 02-Head-Vendas (via pasta /1.Vendas/)
       │
       ├──▶ 03-Call-Analyzer (via pasta /2.Onboarding/)
       │         │
       │         └──▶ Cria agent_version → dispara 08-Boot-Validator
       │
       └──▶ 06-Call-Analyzer-Revisao (via pasta /3.Revisao/)


08-Boot-Validator
       │
       └──▶ Se aprovado, ativa agente → pode ser usado por 05-Execution


05-Execution
       │
       └──▶ Salva conversas → analisadas por 09-QA-Analyst


07-Engenheiro-de-Prompt
       │
       └──▶ Cria novas versoes → validadas por 08-Boot-Validator
```

## Camadas do Sistema

### Camada 1: Ingestao
- **01-Organizador-Calls**: Orquestrador inicial
- **02-Head-Vendas**: Analisa calls de vendas
- **03-Call-Analyzer**: Cria agentes de kickoff

### Camada 2: Validacao
- **08-Boot-Validator**: Valida automaticamente

### Camada 3: Execucao e QA
- **05-Execution-Modular**: Executa em producao
- **09-QA-Analyst**: Monitora qualidade
