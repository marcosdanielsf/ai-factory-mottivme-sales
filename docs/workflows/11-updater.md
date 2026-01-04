# 11 - Prompt Updater

Gera novas versoes de prompt com base nas sugestoes aprovadas.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | Prompt Updater |
| **Nodes** | 22 |
| **Trigger** | Workflow 10 |
| **LLM** | Claude Opus 4 |

## Funcao

1. Recebe sugestoes aprovadas pelo Judge
2. Carrega prompt atual
3. Aplica melhorias
4. Gera nova versao
5. Versiona com changelog
6. Dispara workflow 13

## Fluxo

```
Sugestoes --> Prompt Atual --> Merge --> Nova Versao --> Versionamento --> Trigger 13
```

## Versionamento

```sql
INSERT INTO prompt_versions (
  agent_id,
  version,
  prompt_text,
  changelog,
  created_at
) VALUES (
  'xxx',
  'v1.2.3',
  '...',
  'Melhorou tom de voz baseado em 5 conversas',
  NOW()
);
```

## Changelog

Cada versao inclui:
- Lista de mudancas
- Conversas que motivaram
- Score esperado de melhoria

## Output

- Nova versao em `prompt_versions`
- Changelog detalhado
- Trigger para Feedback Loop
