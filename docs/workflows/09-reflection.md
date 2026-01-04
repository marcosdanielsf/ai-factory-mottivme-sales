# 09 - Reflection Loop

Identifica padroes de erro e gera sugestoes de melhoria.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | 11. Reflection Loop |
| **Nodes** | 34 |
| **Trigger** | Workflow 08 |
| **LLM** | Claude Opus 4 |

## Funcao

1. Recebe conversas com score < 6.0
2. Agrupa por tipo de erro
3. Identifica padroes recorrentes
4. Gera sugestoes de melhoria
5. Dispara workflow 10

## Tipos de Erro

| Tipo | Exemplo |
|------|---------|
| Alucinacao | Inventou informacao |
| Tom inadequado | Muito formal/informal |
| Falta de empatia | Respostas frias |
| Fora do escopo | Tema nao relacionado |
| Loop infinito | Repetiu mesma resposta |

## Fluxo

```
Conversas Ruins --> Agrupamento --> Identificacao --> Sugestoes --> Trigger 10
```

## Sugestoes Geradas

Cada sugestao inclui:
- Tipo de problema
- Exemplos reais
- Proposta de correcao
- Confianca (0-100)

## Output

- Padroes em `reflection_patterns`
- Sugestoes em `improvement_suggestions`
- Trigger para AI Judge
