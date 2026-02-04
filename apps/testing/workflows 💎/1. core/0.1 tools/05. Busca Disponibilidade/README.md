# Busca Disponibilidade - Tool n8n

## Resumo

Tool integrada no fluxo principal de conversação do GoHighLevel (GHL) que **busca e consulta horários disponíveis** antes de agendar uma consultoria ou conversa com o lead.

## Tipo de Node

- **Tipo**: Workflow Tool (n8n)
- **Versão**: 2.2 (@n8n/n8n-nodes-langchain.toolWorkflow)
- **Node ID**: `450bdcd1-95e0-48d6-b7e6-2f204456236e`
- **Posição no canvas**: [38016, 28000]

## Workflow Referenciado

- **Workflow ID**: `pZIcRI1PGMzbQHZZ`
- **Nome**: `[ GHL ] Busca Disponibilidade`
- **Função**: Consultar slots disponíveis no calendário de agendamentos

## Propósito

A tool é usada para:
1. Validar disponibilidade ANTES de oferecer horários ao lead
2. Buscar slots livres em um período determinado (ex: próximos 7 dias)
3. Diferenciar entre tipos de calendário (Consultoria Financeira ou Carreira)
4. Retornar horários formatados e prontos para serem oferecidos ao lead

## Inputs (Parâmetros)

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `calendar` | String | Não | **ID do calendário** (não o nome\!) Extraído do contexto do lead | `LvZWMISiyYnF8p7TrY7q` |
| `startDate` | String | Não | Data de início em timestamp Unix (ms) | `1735689600000` |
| `endDate` | String | Não | Data de fim em timestamp Unix (ms) | `1736294400000` |
| `lead_id` | String | Não | ID do lead no GHL | `{{ $("Info").first().json.lead_id }}` |
| `usuario_responsavel` | String | Não | Usuário responsável pelo agendamento (padrão: "Sistema") | `vendedor-123` |
| `API_KEY` | String | Não | Chave de API do GHL | `{{ $("Info").first().json.api_key }}` |

## Origem dos Dados

Os parâmetros são **extraídos automaticamente** do node anterior (`Info`) que contém:

```json
{
  "api_key": "chave_api_ghl",
  "lead_id": "id_lead",
  "usuario_responsavel": "nome_usuario",
  "calendarID_carreira": "LvZWMISiyYnF8p7TrY7q",
  "calendarID_consultoria": "X9aB2wZcDeFgHiJkLmNo"
}
```

## Output Esperado

```json
{
  "disponibilidades": [
    {
      "data": "2025-01-28",
      "horario": "14:00",
      "timestamp": 1735420800000,
      "disponivel": true
    }
  ],
  "total_slots": 12
}
```

## Notas Técnicas

- **Type**: `@n8n/n8n-nodes-langchain.toolWorkflow`
- **Status**: Produção (v2.2)

## Referências

- Config: [tool-config.json](./tool-config.json)
- Workflow: [ GHL ] Busca Disponibilidade (ID: pZIcRI1PGMzbQHZZ)

