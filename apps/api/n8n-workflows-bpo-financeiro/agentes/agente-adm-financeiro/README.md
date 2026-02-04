# Agente ADM Financeiro

Agente conversacional para gestao financeira integrado com WhatsApp e Instagram.

## Visao Geral

Este agente processa mensagens de clientes e administradores, oferecendo:
- Gestao financeira completa (fluxo de caixa, DRE, inadimplencia)
- Geracao automatica de contratos
- Parcelamentos e recorrencias
- Dashboard de KPIs em tempo real

## Arquitetura

```
[WhatsApp/Instagram]
       ↓
[Webhook n8n] → [Processamento de Mensagem]
       ↓
[Agente IA (Gemini)] ←→ [18 Tools]
       ↓
[Resposta via Canal]
```

## Tools Conectadas

### Financeiro
| Tool | ID n8n | Descricao |
|------|--------|-----------|
| fluxo_caixa_projetado | C4kPTHRzifQ0CIMy | Projecao 30 dias |
| criar_parcelamento | lbOH0pP3mOyEAkXQ | Compras/vendas parceladas |
| criar_recorrencia | h2JGa8pTPjTtA5vn | Despesas mensais fixas |
| relatorio_inadimplencia | zmj9M6HKSrdxJuZb | Clientes em atraso |
| dashboard_kpis | s6HIkSZxkKL90B18 | Visao geral financeira |
| centros_custo | Vu6Uk9NqVD5KTNqM | Despesas por centro |
| orcamento_realizado | vStkWfdwFAg0vqZw | Planejado vs executado |
| dre_simplificado | 9N4DwvjLk6WsJm64 | Demonstrativo de resultado |
| conciliacao_bancaria | Z1IFeHsHZYnooRMs | Conciliar transacoes |
| listar_categorias | Acllbvk5jMEMDzd7 | Categorias disponiveis |
| buscar_movimentacoes | 2b7qY6FV4SksBgXV | Consultar lancamentos |
| salvar_movimentacao | UZSQ0ovulSKyfbfL | Criar novo lancamento |

### Contratos
| Tool | ID n8n | Descricao |
|------|--------|-----------|
| atualizar_dados_cliente | mtNbOiMxMZvVH0RB | Atualizar cadastro |
| listar_contratos_cliente | pZfi7Juh5CXcEaJh | Historico de contratos |
| buscar_contrato_pendente | GAmDsrgHzVowt0nk | Contratos aguardando |
| atualizar_termos_contrato | 1AyAvl2oQEa1v2mW | Definir valores |
| gerar_contrato_google_docs | s1FZRsx5o7AIrQjk | Gerar e enviar p/ assinatura |

### Cadastros
| Tool | ID n8n | Descricao |
|------|--------|-----------|
| criar_cliente_fornecedor | dEPGbp6hUQbW1g5a | Novo cliente/fornecedor |

## Funcionalidades

### Para Clientes
- Consultar saldo e extrato
- Ver faturas pendentes
- Enviar comprovantes de pagamento
- Solicitar segunda via

### Para Administradores
- Dashboard financeiro completo
- Gerar contratos automaticamente
- Criar parcelamentos e recorrencias
- Relatorios de inadimplencia
- Conciliacao bancaria

## Modelo de IA

- **Provider:** Google Gemini
- **Modelo:** gemini-2.0-flash
- **Memoria:** Zep (contexto de conversa)

## Canais Suportados

- WhatsApp (via GoHighLevel)
- Instagram DM (via GoHighLevel)

## Configuracao

1. Importe `workflow.json` no n8n
2. Configure as credenciais:
   - GoHighLevel API
   - Google Gemini
   - Supabase
   - Zep Memory
   - Google Docs (para contratos)
   - Autentique (assinatura digital)

---
*Versao: 2.0 | Atualizado: 2026-01-11*
