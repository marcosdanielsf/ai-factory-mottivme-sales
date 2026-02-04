# Tool: Enviar Comprovante de Pagamento

## Visao Geral

Esta tool e responsavel por escalar automaticamente o comprovante de pagamento ao gestor responsavel via workflow GHL (GoHighLevel). Faz parte do fluxo de automacao de vendas da MOTTIVME.

**Tipo de Node:** `@n8n/n8n-nodes-langchain.toolWorkflow`
**Workflow Alvo:** `05 - Escalar para humano - SOCIALFY`
**Status:** Producao

## Quando e Acionada

A tool e acionada pelo agente SDR1 quando:
1. Um comprovante de pagamento foi gerado com sucesso
2. Precisa ser enviado ao gestor responsavel
3. Requer validacao ou comunicacao ao time de gestao

## Parametros de Entrada

| Parametro | Tipo | Fonte |
|-----------|------|-------|
| api_key_v2 | string | Info.first().json.api_key |
| telefone | string | Info.first().json.telefone |
| message | string | Template dinamico |
| contact_id | string | Info.first().json.id_conversa_alerta |
| location_id | string | Info.first().json.location_id |
| usuario_responsavel | string | Mensagem recebida.first().json.body.location.name |

## Fluxo de Dados

Info + Download Comprovante1 + Mensagem recebida
  -> Enviar comprovante de pagamento (ESTA TOOL)
  -> SDR1 (decide executar)
  -> 05 - Escalar para humano - SOCIALFY
  -> Comprovante escalado ao gestor

## Dependencias

- Node Info: api_key, telefone, ids
- Node Download Comprovante1: URL arquivo
- Node Mensagem recebida: location.name
- API: GoHighLevel v2
- Workflow: 05 - Escalar para humano - SOCIALFY

## Configuracao

Inputs obrigatorios:
- api_key_v2: Chave API GHL
- telefone: Telefone contato
- message: Mensagem com link
- contact_id: ID conversa
- location_id: ID localizacao
- usuario_responsavel: Nome gestor

Output esperado:
- success: true/false
- message_id: ID mensagem GHL
- timestamp: Data execucao

## Tratamento de Erros

- API key invalida: Retry com log
- Contact not found: Registra erro conversa
- Link vazio: Alerta ao gestor
- Workflow indisponivel: Fila n8n

## Troubleshooting

1. API Key Invalid: Verifique credenciais GHL
2. Contact Not Found: Confirme contact_id
3. Workflow Not Found: ID 0r0V3ija6EM88T6E
4. Empty Link: Verifique Download Comprovante1

## Referencias

- Workflow Principal: /Users/marcosdaniels/Projects/mottivme/ai-factory-mottivme-sales/1. ai-factory-agents/workflows/1. core/0.1 - Fluxo Principal de Conversasao - GHL - Versionado.json
- GHL API: https://help.gohighlevel.com/
- n8n Docs: https://docs.n8n.io/

Ultima Atualizacao: 2026-01-26
