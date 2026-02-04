# Call Track AI Cost - Registro de Custo de IA

## Propósito

Node especializado para rastrear e registrar custos de utilização de IA (tokens de input/output) ao longo da jornada de conversação com leads via GHL (GoHighLevel).

## Contexto no Workflow

Este node faz parte do fluxo principal de conversação da AI Factory para Mottivme Sales. Ele é acionado automaticamente após cada interação com modelos LLM (Gemini Pro e Flash) para documentar o consumo de recursos.

## Conexões

### Entrada
- **From:** `Calcular Custo LLM`
- **Type:** Main connection  
- **Trigger:** Executado após cálculo de tokens utilizados

### Saída
- Sem conexões de saída diretas (erro handling: `continueRegularOutput`)
- Resultado é registrado no subworkflow "[TOOL] Registrar Custo IA"

## Tipo de Node
- **Type:** Execute Workflow (n8n-nodes-base.executeWorkflow)
- **Version:** 1.3
- **Target Workflow:** `GWKl5KuXAdeu4BLr` ("[TOOL] Registrar Custo IA")

## Inputs Requeridos

| Campo | Tipo | Origem | Descrição |
|-------|------|--------|-----------|
| `location_id` | string | `Info.location_id` | ID da localização/loja no GHL |
| `contact_id` | string | `Info.lead_id` | ID do contato/lead |
| `model` | string | Hardcoded | Modelo LLM utilizado: "gemini-2.5-pro+flash" |
| `input_tokens` | number | `Calcular Custo LLM` | Tokens de entrada consumidos |
| `output_tokens` | number | `Calcular Custo LLM` | Tokens de saída gerados |

## Inputs Opcionais

| Campo | Tipo | Origem | Descrição |
|-------|------|--------|-----------|
| `location_name` | string | `Info.location_name` | Nome da localização |
| `contact_name` | string | `Info.first_name` | Nome do contato |
| `canal` | string | `Info.source` | Canal de comunicação (SMS, email, etc) |
| `tipo_acao` | string | Hardcoded | Tipo de ação: "Agendar" |
| `total_tokens` | number | Calculado | Soma total de tokens (input + output) |
| `workflowId` | string | Context | ID do workflow principal |
| `executionId` | string | Context | ID da execução atual |
| `date` | string | Context | Data/hora formatada (FFFF) |

## Fórmulas de Cálculo

### Total de Tokens
```
total_tokens = 
  custo_pro.tokens_input + 
  custo_pro.tokens_output + 
  custo_flash.tokens_input + 
  custo_flash.tokens_output
```

### Output Tokens  
```
output_tokens = 
  custo_pro.tokens_output + 
  custo_flash.tokens_output
```

### Input Tokens
```
input_tokens = 
  custo_pro.tokens_input + 
  custo_flash.tokens_input
```

## Tratamento de Erros

- **Strategy:** `continueRegularOutput`
- **Comportamento:** Se o subworkflow de custo falhar, o workflow principal continua normalmente
- **Impacto:** Falhas de registro não afetam a conversação com o lead

## Fluxo de Dados

```
Node: Calcular Custo LLM
    ↓
    ├─ custo_pro: {tokens_input, tokens_output}
    └─ custo_flash: {tokens_input, tokens_output}
    
    ↓
Node: Call Track AI Cost
    ├─ Agregação de dados
    ├─ Enriquecimento com contexto (location, contact)
    └─ Chamada do subworkflow: "[TOOL] Registrar Custo IA"
    
    ↓
Subworkflow: [TOOL] Registrar Custo IA (GWKl5KuXAdeu4BLr)
    ├─ Calcula custo em USD/BRL
    └─ Registra em banco de dados (Supabase)
```

## Variáveis de Contexto Utilizadas

- `$(`'Info').first().json.*` - Dados do lead e localização
- `$(`'Calcular Custo LLM').first().json.*` - Tokens consumidos por modelo
- `$workflow.id` - ID do workflow principal
- `$execution.id` - ID da execução atual
- `$now.format(`'FFFF')` - Data/hora atual

## Casos de Uso

1. **Auditoria de Custos:** Rastrear gastos de IA por lead/localização
2. **Billing:** Calcular custos para clientes que pagam por uso
3. **Otimização:** Identificar padrões de consumo alto
4. **Analytics:** Dashboards de gastos por modelo/canal

## Subworkflow Relacionado

- **Name:** [TOOL] Registrar Custo IA
- **ID:** GWKl5KuXAdeu4BLr
- **Responsabilidade:** Armazenar dados em banco e calcular custos monetários

## Posição no Workflow

- **X:** 42704
- **Y:** 27456

## Node ID

`1ef42823-ac8a-4233-8ce8-acd7f8de7ba1`

---

**Última Atualização:** Janeiro 2026
**Projeto:** AI Factory - Mottivme Sales
**Fluxo Principal:** "0.1 - Fluxo Principal de Conversasão - GHL"
