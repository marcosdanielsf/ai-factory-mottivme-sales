# 03 - Call Analyzer Onboarding

Workflow principal que cria agentes IA a partir de calls de kickoff.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | AI Factory v3 - Completo |
| **Nodes** | 33 |
| **Trigger** | Workflow 01 ou Manual |
| **LLM** | Claude Opus 4 |

## Funcao

1. Recebe transcricao de call kickoff
2. Extrai informacoes do cliente (DDD, setor, porte)
3. Gera prompt hiperpersonalizado
4. Valida prompt com anti-alucinacao
5. Cria agente no banco
6. Dispara workflow 04 para provisionamento

## Fluxo

```
Transcricao --> Extracao --> Geracao Prompt --> Validacao --> Criacao --> Trigger 04
```

## Extracao de Dados

| Campo | Exemplo |
|-------|---------|
| DDD | 11, 21, 31 |
| Setor | Saude, Tech, Educacao |
| Porte | PME, Medio, Enterprise |
| Tom de voz | Formal, Casual, Tecnico |
| Objecoes comuns | Preco, Tempo, Confianca |

## Hiperpersonalizacao

O prompt e ajustado com base em:
- Regionalismos (DDD)
- Jargoes do setor
- Nivel de formalidade
- Objecoes especificas

## Validacao Anti-Alucinacao

Antes de criar o agente:
1. Verifica se prompt tem instrucoes claras
2. Checa se nao inventa informacoes
3. Valida se respeita guardrails
4. Score minimo: 8.0

## Output

- Agente criado em `agents`
- Prompt em `prompt_versions`
- Metadados em `agent_metadata`
- Trigger para workflow 04
