# 02 - Head de Vendas

Agente IA que analisa performance de vendas e gera insights estrategicos.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | 02-AI-Agent-Head-Vendas-V2 |
| **Nodes** | 19 |
| **Trigger** | Schedule (semanal) |
| **LLM** | Claude Opus 4 |

## Funcao

1. Coleta dados de vendas da semana
2. Analisa metricas de conversao
3. Identifica gargalos no funil
4. Gera recomendacoes estrategicas
5. Envia relatorio consolidado

## Fluxo

```
Schedule --> Coleta Dados --> Analise --> Insights --> Relatorio --> Slack
```

## Metricas Analisadas

| Metrica | Fonte |
|---------|-------|
| Leads gerados | GHL |
| Taxa de conversao | GHL |
| Tempo medio de ciclo | GHL |
| Score medio de calls | QA Analyst |
| Agentes com baixa performance | Supabase |

## Output

- Relatorio semanal em Markdown
- Alertas no Slack se metricas caem
- Recomendacoes de acao

## Configuracao

```
SCHEDULE=0 9 * * 1  # Segunda 9h
SLACK_CHANNEL=vendas
```
