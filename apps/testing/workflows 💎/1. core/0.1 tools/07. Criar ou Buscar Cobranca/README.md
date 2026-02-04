# Tool: Criar ou Buscar Cobranca

## Visao Geral

Ferramenta n8n integrada no **Fluxo Principal de Conversacao - GHL** que permite criar novas cobranças ou consultar dados de cobranças já existentes no sistema **Asaas**.

**Node ID:** `54c7b9ff-669c-403d-88d0-023004cec8cf`

---

## Funcionalidades

1. **Criar Nova Cobranca**
   - Gera cobrança no Asaas após agendamento confirmado
   - Calcula vencimento automático (agendamento + 7 dias)
   - Consulta tabela de preços para valor correto

2. **Buscar/Consultar Cobranca**
   - Consulta status de cobrança já existente
   - Retorna dados atualizados do Asaas
   - Reutiliza cliente já cadastrado (asaas_id_cliente)

---

## Parametros de Entrada

### Gerados pela IA (fromAI)

Estes parâmetros são preenchidos automaticamente:

| Parâmetro | Tipo | Exemplo | Validação |
|-----------|------|---------|-----------|
| `cobranca_valor` | number | `600.00` | Consultar tabela de preços |
| `cobranca_vencimento` | string | `2026-02-02` | YYYY-MM-DD, agendamento + 7 dias |
| `nome` | string | `João Silva` | Nome completo |
| `cpf` | string | `123.456.789-00` | CPF válido |

### Extraídos do Contexto (Info)

| Parâmetro | Fonte | Descrição |
|-----------|-------|-----------|
| `telefone` | `Info.telefone` | Telefone do contato |
| `id_conta` | `Info.location_id` | ID da location no GHL |
| `id_contato` | `Info.lead_id` | ID do lead no GHL |
| `asaas_id_cliente` | `Info.atributos_contato.asaas_id_cliente` | ID cliente Asaas |
| `asaas_id_cobranca` | `Info.atributos_contato.asaas_id_cobranca` | ID cobrança Asaas |
| `url_asaas` | `Info.url_asaas` | URL API Asaas |
| `api_key` | `Info.api_key` | Chave API Asaas |

---

## Data Flow

Info Node → AI Engine → Criar ou Buscar Cobranca → Subworkflow 06.1 Integração Asaas

---

## Workflow Integration

- **Tipo:** `@n8n/n8n-nodes-langchain.toolWorkflow`
- **Versão:** 2.2
- **Posição:** (38560, 28144)
- **Subworkflow:** 06.1 Integração Asaas (ID: 45POrWnyU2UR7HjQ)

---

## Prerequisitos

1. Lead/contato registrado no GHL
2. Agendamento criado ANTES desta ferramenta
3. Cliente pode estar cadastrado no Asaas
4. Tabela de preços consultada antes do valor
5. Vencimento = Agendamento + 7 dias

---

## Casos de Uso

### Criar Nova Cobranca
- Usuario agenda consulta → Criar ou Buscar Cobranca executa → Cobranca criada em 7 dias

### Consultar Cobranca Existente
- Cliente pergunta status → Sistema busca asaas_id_cobranca → Retorna status atual

### Reutilizar Cliente Asaas
- Cliente retorna → Sistema encontra asaas_id_cliente → Cria nova cobranca p/ cliente

---

## Erros Comuns

| Erro | Solução |
|------|---------|
| Cliente não encontrado | Criar novo no Asaas |
| Cobrança não encontrada | Verificar asaas_id_cobranca |
| API Key inválida | Verificar credenciais |
| Valor inválido | Consultar tabela preços |
| Data inválida | Calcular: agendamento + 7 dias |

---

## Schema de Dados

```json
{
  "cobranca_valor": "string",
  "cobranca_vencimento": "string",
  "telefone": "string",
  "nome": "string",
  "cpf": "string",
  "id_conta": "string",
  "id_contato": "string",
  "asaas_id_cliente": "string",
  "asaas_id_cobranca": "string",
  "url_asaas": "string",
  "api_key": "string"
}
```

---

## Links Relacionados

- Workflow Principal: `0.1 - Fluxo Principal de Conversacao - GHL - Versionado.json`
- Subworkflow: `06.1 Integração Asaas` (45POrWnyU2UR7HjQ)
- Docs Asaas: https://docs.asaas.com
- Docs GHL: https://help.gohighlevel.com

---

Última atualização: 26 de janeiro de 2026
Status: Ativo em produção
