# 06 - Call Analyzer Revisao

Revisa e atualiza agentes existentes com novas calls.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | Call Analyzer Revisao |
| **Nodes** | 23 |
| **Trigger** | Schedule ou Manual |
| **LLM** | Claude Opus 4 |

## Funcao

1. Identifica agentes com novas calls
2. Analisa calls de follow-up
3. Extrai novas informacoes
4. Atualiza prompt se necessario
5. Versiona mudancas

## Fluxo

```
Schedule --> Busca Agentes --> Analisa Calls --> Extrai Info --> Atualiza Prompt
```

## Criterios de Revisao

- Agente com mais de 3 calls novas
- Ultima revisao > 7 dias
- Score medio < 7.0

## Output

- Prompt atualizado em `prompt_versions`
- Changelog em `prompt_changelog`
