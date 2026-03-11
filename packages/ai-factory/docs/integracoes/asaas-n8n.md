# Integração Asaas + n8n

Guia completo de engenharia reversa para integrar o **Asaas** (gateway de pagamentos) com **n8n** para automação de cobranças com PIX e Cartão de Crédito.

::: tip Cliente de Referência
Este guia foi criado a partir de uma implementação real para o cliente **Dr. Luiz - Instituto Amare**.
:::

## Visão Geral

Esta integração permite:
- Criar clientes automaticamente no Asaas
- Gerar cobranças com valores diferenciados (PIX com desconto vs Cartão)
- Receber webhooks de atualização de status de pagamento
- Notificar clientes automaticamente

## Pré-requisitos

### 1. Conta Asaas Ativa

Criar conta em [asaas.com](https://www.asaas.com/r/5ec90fd5-677d-40c7-b577-cc1f6de62fec)

### 2. Documentação Aprovada

Aguardar aprovação de:
- Preenchimento dos Dados Comerciais
- Envio de documentos
- Aprovação geral

### 3. Faturamento Preenchido

::: warning IMPORTANTE
O campo "Qual seu faturamento mensal?" deve ter valor maior que R$ 0,00.

Localização: `Conta → Minha Conta → Informações`
:::

## Configuração da API

### 1. Gerar Chave de API de Produção

::: danger Atenção
Não confunda com a API Sandbox! A URL de produção é `https://api.asaas.com`
:::

1. Acesse: `API → Chaves de API`
2. Clique em **"Gerar chave de API"**
3. Nome sugerido: `n8n-producao`
4. **Copie a chave imediatamente** - ela só aparece uma vez!

### 2. Liberar IP do n8n

Se receber erro `"IP não autorizado"`:

1. Acesse: `API → Mecanismos de segurança`
2. Na seção **"IPs autorizados"**, adicione o IP do seu servidor n8n
3. Para descobrir o IP do n8n, crie um node HTTP Request para: `https://api.ipify.org?format=json`

### 3. Criar Credencial no n8n

No n8n, crie uma credencial **Header Auth**:

| Campo | Valor |
|-------|-------|
| Name | `access_token` |
| Value | `sua_chave_api_asaas` |

Renomeie para: `Asaas - Produção`

## Estrutura do Fluxo n8n

### Nodes Principais

```
Gatilho → Cobrança já existe? → Cliente já existe? → Criar cliente → Criar cobrança → Resultado
                ↓                      ↓
          Buscar cobrança        Buscar cliente
```

### Variáveis do Gatilho (Execute Workflow Trigger)

```json
{
  "cobranca_valor": 1200,
  "cobranca_vencimento": "2026-01-14",
  "telefone": "+5511999999999",
  "nome": "Nome do Cliente",
  "cpf": "12345678900",
  "id_conta": "location_id_ghl",
  "id_contato": "contact_id_ghl",
  "asaas_id_cliente": null,
  "asaas_id_cobranca": null,
  "url_asaas": "https://api.asaas.com",
  "api_key": "sua_api_key_ghl"
}
```

## Criar Cobrança com Desconto PIX

### Configuração de Valores

| Forma de Pagamento | Valor |
|--------------------|-------|
| Cartão de Crédito | R$ 1.200,00 |
| PIX (com desconto) | R$ 971,04 |
| Desconto aplicado | 19,08% |

### JSON do Node "Criar cobrança"

```json
{
  "customer": "{{ $('Gatilho').first().json.asaas_id_cliente || $('Code in JavaScript').first().json.asaasId || $node['Criar cliente'].json['id'] }}",
  "billingType": "UNDEFINED",
  "value": 1200,
  "dueDate": "{{ $('Gatilho').first().json.cobranca_vencimento }}",
  "discount": {
    "value": 19.08,
    "dueDateLimitDays": 0,
    "type": "PERCENTAGE"
  }
}
```

::: tip Cálculo do Desconto
O desconto é calculado assim: `(1200 - 971) / 1200 * 100 = 19.08%`
:::

### Como funciona o desconto

- `value`: Valor cheio (usado no cartão)
- `discount.value`: Percentual de desconto
- `discount.type`: `PERCENTAGE` para desconto percentual
- `discount.dueDateLimitDays`: `0` = desconto vale até o vencimento

O cliente verá na tela de pagamento:
- **Valor total**: R$ 1.200,00
- **Valor com desconto**: R$ 971,04 (Até a data de vencimento)

## Desabilitar Boleto Bancário

::: warning Limitação do Asaas
Não existe configuração global no painel para desabilitar boleto.
:::

### O que NÃO funciona

Os parâmetros abaixo são **ignorados** pela API em contas padrão:

```json
// NÃO FUNCIONA
"disableBillingTypes": ["BOLETO", "DEBIT_CARD"]

// NÃO FUNCIONA
"enabledBillingTypes": ["PIX", "CREDIT_CARD"]
```

### Solução

**Contatar o Suporte Asaas**:
- Telefone: `0800 009 0037`
- WhatsApp: `0800 009 0037`
- Horário: Seg-Sex 8h-22h | Sáb-Dom 8h-18h

Solicite a **desativação global do Boleto Bancário** na conta.

## Webhook de Atualização de Cobrança

### Configurar Webhook no Asaas

1. Acesse: `API → Webhooks`
2. Clique em **"Novo Webhook"**
3. Configure:

| Campo | Valor |
|-------|-------|
| Nome | `n8n-webhooks` |
| URL | URL de produção do seu webhook n8n |
| Versão | v3 |
| Tipo de envio | Sequencial |
| Token de autenticação | Crie uma senha segura |

4. Na seção **"Cobranças"**, selecione todos os eventos

### Eventos de Cobrança Importantes

```javascript
const eventosCobranca = [
  "PAYMENT_CONFIRMED",    // Pagamento confirmado
  "PAYMENT_RECEIVED",     // Pagamento recebido
  "PAYMENT_OVERDUE",      // Pagamento vencido
  "PAYMENT_REFUNDED",     // Pagamento estornado
  "PAYMENT_CHARGEBACK_REQUESTED", // Chargeback solicitado
];
```

### Mapeamento de Status

```json
{
  "PENDING": "Pendente",
  "RECEIVED": "Cobrança recebida",
  "CONFIRMED": "Cobrança confirmada",
  "OVERDUE": "Cobrança vencida",
  "REFUNDED": "Cobrança estornada",
  "RECEIVED_IN_CASH": "Cobrança recebida em dinheiro",
  "REFUND_REQUESTED": "Solicitação de estorno",
  "REFUND_IN_PROGRESS": "Estorno em andamento",
  "CHARGEBACK_REQUESTED": "Recebido chargeback",
  "CHARGEBACK_DISPUTE": "Em disputa de chargeback",
  "AWAITING_CHARGEBACK_REVERSAL": "Disputa vencida",
  "DUNNING_REQUESTED": "Requisição de negativação",
  "DUNNING_RECEIVED": "Recebimento de negativação",
  "AWAITING_RISK_ANALYSIS": "Aguardando análise de risco"
}
```

## Troubleshooting

### Erro: "IP não autorizado"

```json
{
  "errors": [{
    "code": "not_allowed_ip",
    "description": "IP não autorizado. Código de erro: XXXXXX."
  }]
}
```

**Solução**: Liberar IP em `API → Mecanismos de segurança`

### Erro: "Não consigo gerar chave de API"

**Solução**: Preencher campo "Qual seu faturamento mensal?" em `Conta → Minha Conta → Informações` com valor maior que R$ 0,00

### Erro: "Forbidden - perhaps check your credentials?"

**Soluções**:
1. Verificar se está usando URL de produção (`https://api.asaas.com`) e não sandbox
2. Verificar se a chave de API está correta na credencial
3. Verificar se o IP está liberado

## Checklist de Implementação

### Configuração Asaas

- [ ] Criar conta no Asaas
- [ ] Aguardar aprovação de documentos
- [ ] Preencher faturamento mensal > R$ 0
- [ ] Gerar chave de API de produção
- [ ] Liberar IP do n8n
- [ ] (Opcional) Contatar suporte para desabilitar boleto

### Configuração n8n

- [ ] Criar credencial Header Auth com chave Asaas
- [ ] Importar fluxo de cobrança
- [ ] Configurar variáveis do Gatilho
- [ ] Configurar webhook de atualização
- [ ] Testar criação de cliente
- [ ] Testar criação de cobrança
- [ ] Verificar desconto PIX na página de pagamento

### Integração GHL (opcional)

- [ ] Criar custom fields para `asaas_id_cliente` e `asaas_id_cobranca`
- [ ] Configurar workflow para atualizar contato após criação
- [ ] Configurar webhook para atualizar status da cobrança

## Referências

- [Documentação API Asaas](https://docs.asaas.com/)
- [Referência de Cobranças](https://docs.asaas.com/reference/criar-nova-cobranca)
- [Webhooks Asaas](https://docs.asaas.com/docs/webhooks)
