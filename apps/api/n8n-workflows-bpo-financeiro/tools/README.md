# Tools (Sub-workflows)

Colecao de sub-workflows que funcionam como ferramentas para os agentes IA.

## Organizacao

```
tools/
├── financeiro/    # Gestao financeira (12 tools)
├── contratos/     # Gestao de contratos (5 tools)
└── cadastros/     # Cadastros gerais (1 tool)
```

## Padrao de Nomenclatura

Todos os arquivos seguem o padrao:
```
[NN]-TOOL-[Nome-Descritivo].json
```

Exemplo: `01-TOOL-Fluxo-Caixa-Projetado.json`

## Como Usar

Cada tool e um workflow independente que:
1. Recebe parametros via **Execute Workflow Trigger**
2. Processa a logica de negocio
3. Retorna resultado estruturado para o agente

## Integracao com Agentes

No workflow do agente, as tools sao conectadas via node `toolWorkflow`:

```javascript
{
  "name": "nome_da_tool",
  "description": "Descricao para a IA entender quando usar",
  "workflowId": "ID_DO_WORKFLOW"
}
```

## Dependencias

- **Supabase:** Todas as tools usam o mesmo banco
- **Credenciais:** Compartilhadas via n8n credentials

---
*Mantido por MOTTIVME - AI Factory*
