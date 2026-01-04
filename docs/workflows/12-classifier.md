# 12 - Multi-Tenant Inbox Classifier

Classifica mensagens de multiplos clientes para o agente correto.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | 14 - Multi-Tenant Inbox Classifier |
| **Nodes** | 22 |
| **Trigger** | Webhook |
| **LLM** | Groq (rapido) |

## Funcao

1. Recebe mensagem de inbox compartilhado
2. Identifica cliente pelo contexto
3. Roteia para agente correto
4. Dispara workflow 05

## Identificacao de Cliente

| Metodo | Prioridade |
|--------|-----------|
| Phone number | 1 |
| Contact metadata | 2 |
| Contexto da conversa | 3 |
| LLM classification | 4 |

## Fluxo

```
Mensagem --> Identificacao --> Roteamento --> Trigger 05
```

## Configuracao

```json
{
  "tenants": [
    {"id": "cliente-a", "pattern": "+5511*"},
    {"id": "cliente-b", "pattern": "+5521*"}
  ]
}
```

## Output

- Mensagem roteada
- Log em `routing_logs`
