# 13 - Feedback Loop

Aplica novos prompts em producao e monitora resultados.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | Feedback Loop Oportunidade |
| **Nodes** | 15 |
| **Trigger** | Workflow 11 |

## Funcao

1. Recebe nova versao de prompt
2. Atualiza agente em producao
3. Monitora primeiras conversas
4. Compara scores antes/depois
5. Rollback se necessario

## Fluxo

```
Nova Versao --> Deploy --> Monitor --> Comparacao --> Decisao
```

## Deploy Gradual

1. **Canary (10%)**: Testa com 10% do trafego
2. **Validacao**: Compara scores
3. **Rollout (100%)**: Se OK, aplica para todos
4. **Rollback**: Se piorar, volta versao anterior

## Metricas de Sucesso

| Metrica | Esperado |
|---------|----------|
| Score medio | +0.5 |
| Taxa de conversao | +5% |
| Tempo de resposta | Igual |

## Rollback Automatico

Se score cair mais de 10% nas primeiras 50 conversas:
- Reverte para versao anterior
- Envia alerta no Slack
- Marca versao como "failed"

## Output

- Prompt atualizado no agente
- Registro em `prompt_deployments`
- Metricas de comparacao
