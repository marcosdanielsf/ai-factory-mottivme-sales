# Ferramenta: Agendar Reunião

## Descrição Geral

A ferramenta **Agendar Reunião** é responsável por agendar novas reuniões no GoHighLevel (GHL) como parte do fluxo de conversação automática. Esta ferramenta é chamada pela IA (SDR1) quando há necessidade de marcar uma consulta ou reunião com um lead qualificado.

## Funcionalidade Principal

Integra-se com a API do GoHighLevel para criar compromissos de calendário, associando automaticamente as informações do lead e definindo o horário específico solicitado.

## Parâmetros de Entrada

### Parâmetros Obrigatórios

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| **API_KEY** | string | Chave de autenticação do GoHighLevel | `sk-1234567890abcdef` |
| **location_id** | string | ID da localização/conta no GHL | `LvZWMISiyYnF8p7TrY7q` |
| **calendar_id** | string | ID do calendário específico (não o nome) | `calendarID_carreira` ou `calendarID_consultoria` |
| **startTime** | string | Horário de início em formato ISO8601 | `2024-02-15T10:30:00-03:00` |
| **lead_id** | string | ID único do lead no GHL | `lead_12345abcde` |
| **Carreira_Consultoria** | enum | Tipo de agendamento | `"Carreira"` ou `"Consultoria"` |

### Parâmetros Opcionais

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| email | string | Email do contato | (vazio) |
| telefone | string | Telefone do contato | (vazio) |
| firstName | string | Primeiro nome do contato | (vazio) |
| lastName | string | Sobrenome do contato | (vazio) |
| usuario_responsavel | string | Usuário responsável pela reunião | `"Sistema"` |

## Retornos (Outputs)

A ferramenta retorna os seguintes dados após execução:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **success** | boolean | Indica se o agendamento foi realizado com sucesso |
| **appointmentId** | string | ID único do compromisso criado no GHL |
| **message** | string | Mensagem de resposta da API (sucesso ou erro) |

## Fluxo de Dados

### Entrada

A ferramenta recebe dados principalmente do contexto do lead através do nó **Info**, que contém:

```json
{
  "api_key": "chave_api_ghl",
  "location_id": "loc_id",
  "lead_id": "lead_123",
  "first_name": "João",
  "last_name": "Silva",
  "email": "joao@example.com",
  "telefone": "+55 11 98765-4321",
  "usuario_responsavel": "Ana Santos",
  "work_permit": "Carreira ou Consultoria"
}
```

### Inteligência Dinâmica

A ferramenta utiliza `$fromAI()` para dois parâmetros críticos:

1. **calendar_id**: A IA escolhe entre `calendarID_carreira` ou `calendarID_consultoria` baseado no `work_permit` do lead
2. **startTime**: A IA extrai ou negocia o horário ideal com base na conversa anterior

## Integração no Workflow

### Conexões

- **Entrada**: Chamada como ferramenta de IA pelo nó **SDR1**
- **Saída**: Retorna resultado ao SDR1 para continuação do fluxo

### Workflow Referenciado

- **Nome**: "Agendar pelo GHL - ATUALIZAR KOMMO"
- **ID**: `u1UsmjNNpaEiwIsp`
- **Função**: Executa a lógica específica de agendamento no GHL

## Considerações Importantes

### Validações Críticas

1. **Calendar ID**: DEVE ser o ID do calendário (ex: `LvZWMISiyYnF8p7TrY7q`), NÃO o nome
2. **StartTime**: Deve estar em formato ISO8601 com timezone (ex: `2024-02-15T10:30:00-03:00`)
3. **Lead Context**: Todos os dados do lead devem estar disponíveis no nó Info

### Contexto Dinâmico

- Se `work_permit = "Carreira"` → usar `calendarID_carreira`
- Se `work_permit = "Consultoria"` → usar `calendarID_consultoria`

### Tratamento de Erros

Se a ferramenta retornar `success = false`:

- Verificar validade do `API_KEY`
- Confirmar existência do `location_id` e `calendar_id`
- Validar formato de `startTime`
- Verificar se o horário está disponível no calendário

## Exemplo de Uso

```json
{
  "toolName": "Agendar Reuniao",
  "inputs": {
    "API_KEY": "sk-xyz123",
    "location_id": "LvZWMISiyYnF8p7TrY7q",
    "calendar_id": "calendarID_carreira",
    "startTime": "2024-02-15T14:00:00-03:00",
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@example.com",
    "telefone": "+55 11 98765-4321",
    "lead_id": "lead_456",
    "Carreira_Consultoria": "Carreira",
    "usuario_responsavel": "Ana Santos"
  }
}
```

### Resposta Esperada

```json
{
  "success": true,
  "appointmentId": "appt_789xyz",
  "message": "Reunião agendada com sucesso para 15/02/2024 às 14:00"
}
```

## Relação com Outros Nós

- **SDR1**: Node de IA que invoca esta ferramenta
- **Info**: Fornece contexto do lead (dados estruturados)
- **Busca_disponibilidade**: Nó complementar para verificar horários livres
- **Workflow "Agendar pelo GHL"**: Executa a lógica específica

## Changelog

- **v1.0**: Criada extração e documentação inicial
- **Referência**: Fluxo Principal de Conversação - GHL - Versionado
