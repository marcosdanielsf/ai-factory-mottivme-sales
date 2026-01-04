# 05 - Execution Modular

Workflow de execucao que responde mensagens em tempo real.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | AI Factory v3 - Completo |
| **Nodes** | 33 |
| **Trigger** | Webhook GHL |
| **LLM** | Groq (Llama 3.3 70B) |

## Funcao

1. Recebe mensagem do WhatsApp via GHL
2. Identifica agente correto
3. Carrega prompt e contexto
4. Gera resposta com LLM
5. Envia de volta ao GHL
6. Salva conversa no banco

## Fluxo

```
Webhook --> Identificacao --> Contexto --> LLM --> Resposta --> GHL --> Save
```

## Identificacao de Agente

O workflow identifica o agente por:
1. Location ID do GHL
2. Contact metadata
3. Fallback para agente padrao

## Contexto Carregado

| Item | Fonte |
|------|-------|
| Prompt atual | `prompt_versions` |
| Historico | `conversations` |
| Metadata cliente | `contacts` |
| Knowledge base | `knowledge_chunks` |

## Resposta

- LLM: Groq (rapido, 200ms)
- Max tokens: 500
- Temperature: 0.7
- Stop sequences: configuradas

## Output

- Mensagem enviada ao WhatsApp
- Conversa salva em `conversations`
- Metricas em `execution_logs`
