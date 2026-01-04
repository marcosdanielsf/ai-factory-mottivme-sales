# 08 - QA Analyst

Monitora qualidade das conversas e calcula scores.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | QA Analyst IA |
| **Nodes** | 24 |
| **Trigger** | Schedule (diario) |
| **LLM** | Claude Sonnet 4.5 |

## Funcao

1. Busca conversas dos ultimos 7 dias
2. Avalia cada conversa em 6 dimensoes
3. Calcula score medio
4. Gera alertas se score baixo
5. Alimenta workflow 09

## Dimensoes Avaliadas

| Dimensao | Peso | Descricao |
|----------|------|-----------|
| Tom de Voz | 20% | Adequacao ao perfil |
| Engajamento | 15% | Nivel de interacao |
| Empatia | 15% | Conexao emocional |
| Precisao | 20% | Informacoes corretas |
| Script | 15% | Seguiu roteiro |
| Eficiencia | 15% | Resolucao rapida |

## Score

- **8-10**: Excelente
- **6-8**: Bom
- **4-6**: Regular (alerta)
- **0-4**: Ruim (pausa agente)

## Fluxo

```
Schedule --> Busca Conversas --> Avaliacao --> Score --> Alertas --> Trigger 09
```

## Output

- Scores em `qa_evaluations`
- Alertas no Slack
- Trigger para Reflection Loop
