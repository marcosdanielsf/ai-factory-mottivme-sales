# 10 - AI as Judge

Avalia qualidade das sugestoes de melhoria.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | AI as Judge - Evaluation System |
| **Nodes** | 16 |
| **Trigger** | Workflow 09 |
| **LLM** | Claude Sonnet 4.5 |

## Funcao

1. Recebe sugestoes do Reflection Loop
2. Avalia cada sugestao
3. Pontua confianca (0-100)
4. Filtra sugestoes fracas
5. Passa aprovadas para workflow 11

## Criterios de Avaliacao

| Criterio | Peso |
|----------|------|
| Relevancia | 30% |
| Especificidade | 25% |
| Aplicabilidade | 25% |
| Impacto esperado | 20% |

## Threshold

- **> 80**: Aprovada automaticamente
- **60-80**: Revisao manual
- **< 60**: Rejeitada

## Fluxo

```
Sugestoes --> Avaliacao --> Score --> Filtro --> Trigger 11
```

## Output

- Scores em `judge_evaluations`
- Sugestoes aprovadas para Prompt Updater
