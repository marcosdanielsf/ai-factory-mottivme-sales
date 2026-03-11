# n8n Workflows - AI Factory

Repositorio de workflows n8n para o sistema financeiro e administrativo da MOTTIVME.

## Estrutura

```
n8n-workflows/
├── agentes/                    # Workflows principais (agentes IA)
│   └── agente-adm-financeiro/  # Agente Administrativo Financeiro
└── tools/                      # Sub-workflows (ferramentas)
    ├── financeiro/             # Tools de gestao financeira
    ├── contratos/              # Tools de gestao de contratos
    └── cadastros/              # Tools de cadastros
```

## Agentes

| Agente | Descricao | Nodes |
|--------|-----------|-------|
| [Agente ADM Financeiro](./agentes/agente-adm-financeiro/) | Agente conversacional para gestao financeira via WhatsApp/Instagram | 146 |

## Tools por Categoria

### Financeiro (12 tools)
- Fluxo de Caixa Projetado
- Criar Parcelamento
- Criar Recorrencia
- Relatorio de Inadimplencia
- Dashboard KPIs
- Centros de Custo
- Orcamento vs Realizado
- DRE Simplificado
- Conciliacao Bancaria
- Listar Categorias
- Buscar Movimentacoes
- Salvar Movimentacao

### Contratos (5 tools)
- Atualizar Dados Cliente
- Listar Contratos Cliente
- Buscar Contrato Pendente
- Atualizar Termos Contrato
- Gerar Contrato Automatico (Google Docs + Autentique)

### Cadastros (1 tool)
- Criar Cliente/Fornecedor

## Como Importar

1. Acesse seu n8n: `https://seu-n8n.com`
2. Va em **Workflows** > **Import from File**
3. Selecione o arquivo `.json` desejado
4. Ajuste as credenciais conforme necessario

## Ambiente de Producao

- **n8n URL:** https://cliente-a1.mentorfy.io
- **Supabase:** Configurado via credenciais no n8n

## Versionamento

- **Versao atual:** 2.0 (2026-01-11)
- **Ultima atualizacao:** Upgrade completo das tools financeiras

---
*Mantido por MOTTIVME - AI Factory*
