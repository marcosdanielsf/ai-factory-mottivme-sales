# Tool: Atualizar Agendamento

## O que é?

Ferramenta n8n integrada ao fluxo de conversação do GHL que permite **atualizar informações de eventos agendados** sem alterar o horário.

Esta é uma **IA Tool** (ferramenta de IA) disponível para o agente SDR1 executar como ação durante a conversa.

---

## Funcionalidades

✅ **Atualizar título do agendamento**
✅ **Atualizar descrição do agendamento**
✅ **Preservar informações anteriores relevantes**
✅ **Integração com GoHighLevel (GHL)**

---

## Limitações Importantes

❌ **NÃO pode alterar o horário do agendamento**

Se o usuário precisar mudar a hora/data do evento:
1. Cancele o evento existente
2. Crie um novo agendamento com o horário correto

---

## Arquitetura

### Fluxo de Execução

```
Usuário solicita atualização
        ↓
    SDR1 (Agente IA)
        ↓
Avalia se deve chamar ferramenta
        ↓
Atualizar agendamento (Tool)
        ↓
Workflow 04.1 Atualizar/Cancelar agendamento
        ↓
Integração com GHL Calendar API
        ↓
Retorna resultado para SDR1
        ↓
SDR1 continua conversa com usuário
```

### Componentes

| Componente | ID | Tipo | Descrição |
|---|---|---|---|
| Node Principal | `805a4f23-2860-4d2d-8f7e-aaf32fdbe166` | n8n ToolWorkflow | Define a tool que chama workflow externo |
| Agente Chamador | `SDR1` | @n8n/n8n-nodes-langchain.agent | Agente IA que decide chamar a ferramenta |
| Workflow Alvo | `tB6BNUcIu0SxpA9u` | n8n Workflow | `04.1 Atualizar/Cancelar agendamento` |
| Tipo Conexão | `ai_tool` | n8n Connection | Conecta agente à ferramenta |

---

## Inputs (Parâmetros de Entrada)

Todos os campos são **opcionais**. O agente SDR1 determina quais valores enviar baseado no contexto:

### Campos Disponíveis

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `API_KEY` | string | Chave de autenticação GHL | `sk_live_...` |
| `email` | string | Email do contato | `joao@empresa.com.br` |
| `telefone` | string | Telefone do contato | `(11) 99999-9999` |
| `location_id` | string | ID da localização/empresa no GHL | `ve9EPM428h8vShlRW1KT` |
| `calendar_id` | string | ID do calendário específico | `cal_123456` |
| `startTime` | string | Horário de início (informativo) | `2026-02-15T14:00:00Z` |
| `firstName` | string | Primeiro nome do contato | `João` |
| `lastName` | string | Sobrenome do contato | `Silva` |
| `lead_id` | string | ID do lead/contato no GHL | `ocQHyuzHvysMo5N5VsXc` |

---

## Outputs (Retorno)

A ferramenta retorna o resultado da operação no workflow externo.

---

## Relação com Outras Tools

Estas outras tools trabalham em conjunto:

- **Criar Agendamento** - Cria novo evento
- **Cancelar Agendamento** - Remove evento existente
- **Listar Agendamentos** - Busca eventos do calendário
- **Atualizar Agendamento** ← **VOCÊ ESTÁ AQUI**

---

## Ficheiro de Configuração

Veja `tool-config.json` para configuração completa incluindo:
- Estrutura de inputs/outputs
- Schema de campos esperados
- Mapeamento de conexões
- Referência do workflow externo

---

## Documentação de Referência

- **Workflow Principal:** `0.1 - Fluxo Principal de Conversasão - GHL - Versionado.json`
- **Workflow Alvo:** `04.1 Atualizar/Cancelar agendamento` (ID: `tB6BNUcIu0SxpA9u`)
- **Agente SDR:** `SDR1` (ID: `5656766a-0825-4b7b-8ba4-9ef600a5df0a`)
- **Documentação GHL:** https://help.gohighlevel.com/

---

## Últimas Atualizações

- **2026-01-26:** Criação da documentação e extração de configuração
- **Base:** Versionado v2.2 com agentes LLM
