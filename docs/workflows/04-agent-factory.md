# 04 - Agent Factory

Provisiona agentes no GoHighLevel para execucao em producao.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Nome** | Agent Factory |
| **Nodes** | 17 |
| **Trigger** | Workflow 03 |
| **Integracao** | GHL API |

## Funcao

1. Recebe agente criado pelo workflow 03
2. Configura webhook no GHL
3. Cria bot de conversacao
4. Associa a location/subaccount
5. Ativa agente

## Fluxo

```
Agente Criado --> Config GHL --> Webhook --> Bot --> Ativacao
```

## Configuracao GHL

| Item | Descricao |
|------|-----------|
| Webhook URL | URL do workflow 05 |
| Trigger | Nova mensagem |
| Location | Subaccount do cliente |
| Pipeline | Funil de vendas |

## API Calls

```javascript
// Criar webhook
POST /webhooks
{
  "url": "https://n8n.socialfy.me/webhook/execution",
  "event": "message.new"
}

// Criar bot
POST /conversations/bots
{
  "name": "Agente Cliente X",
  "prompt": "..."
}
```

## Output

- Webhook ativo no GHL
- Bot configurado
- Registro em `ghl_integrations`
