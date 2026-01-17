# Catalogo de Dados - Performance Dashboard

## Resumo Executivo

**PROBLEMA ORIGINAL:** As views `dashboard_*` estavam mostrando dados incompletos/zerados.

**SOLUCAO APLICADA:** O hook `useClientPerformance.ts` foi atualizado para usar `app_dash_principal` como fonte de dados real.

---

## IMPORTANTE: Duas Fontes de Dados Distintas

O sistema possui DUAS fontes de dados com propositos diferentes:

| Tabela | Registros | Proposito | Hooks que usam |
|--------|-----------|-----------|----------------|
| `app_dash_principal` | 41.758 | Dados de VENDAS do GoHighLevel | `useClientPerformance` |
| `socialfy_leads` | ~variavel | Dados de PROSPECCAO do Socialfy | `useDashboardMetrics`, `useFunnelMetrics`, `useLeads` |

**Os numeros entre as telas de Performance e Dashboard/Funil/Leads SERAO DIFERENTES - isso e intencional.**

### Por que usar fontes diferentes?

- **Performance por Vendedor**: Precisa de dados do GHL porque e la que estao os vendedores (`lead_usuario_responsavel`)
- **Dashboard/Funil/Leads**: Mostra leads de prospeccao social media (Instagram scraping, etc)

### Limitacao: Filtro de Periodo

A tabela `app_dash_principal` NAO possui campo de data, portanto:
- O hook `useClientPerformance` busca TODOS os dados (performance historica completa)
- Os parametros `dateRange` e `month` sao mantidos na interface para compatibilidade, mas nao sao aplicados

---

## 1. Fonte de Dados Real: app_dash_principal

| Métrica | Valor |
|---------|-------|
| **Total de registros** | **41.758** |
| Com status definido | 1.000+ |
| new_lead | 550 (1.3%) |
| no_show | 171 (0.4%) |
| completed | 131 (0.3%) |
| qualifying | 60 (0.1%) |
| booked | 41 (0.1%) |
| lost | 36 (0.1%) |
| won | 11 (0.0%) |

### Distribuição por Responsável (Top 15)

| Responsável | Total | Won | Lost | New Lead | Booked |
|-------------|-------|-----|------|----------|--------|
| Contatos pessoais clientes | 248 | 0 | 2 | 231 | 15 |
| Andre Rosa | 128 | 6 | 6 | 6 | 5 |
| Marina Couto | 94 | 0 | 8 | 34 | 4 |
| Gustavo Couto | 91 | 1 | 5 | 12 | 2 |
| Fernanda Lappe | 68 | 0 | 7 | 25 | 3 |
| Vivian Osorio | 65 | 0 | 0 | 65 | 0 |
| Cláudia Fehribach | 60 | 2 | 1 | 15 | 3 |
| Marcos Daniel | 53 | 0 | 0 | 53 | 0 |
| Milton | 41 | 2 | 3 | 8 | 1 |
| SEM RESPONSÁVEL | 32 | 0 | 0 | 29 | 0 |

### Distribuição por Funil

| Funil | Quantidade |
|-------|------------|
| F2 - Funil Tráfego Direto | 436 |
| NULL | 419 |
| F1 - BPO Social Selling - EUA | 143 |
| F4 - Funil de LP - Carreira | 2 |

---

## 2. Todas as Tabelas/Views DASH

| Tabela/View | Registros |
|-------------|-----------|
| **app_dash_principal** | **41.758** |
| app_dash_backup_oct24 | 38.261 |
| dashboard_conversas_por_lead | 6.215 |
| dashboard_custos_por_lead | 1.259 |
| dashboard_followup_metrics | 196 |
| dashboard_alerts_recent | 50 |
| app_dash_resumo | 23 |
| dashboard_alerts_by_day | 22 |
| dashboard_alerts_breakdown | 16 |
| dashboard_funnel | 15 |
| dashboard_performance_agentes | 10 |
| dashboard_performance_cliente | 10 |
| dashboard_alertas_urgentes | 6 |
| dashboard_followup_performance | 6 |
| dashboard_off_hours | 6 |
| app_bdr_dashboard | 6 |
| dashboard_ranking_clientes | 4 |
| dashboard_alertas_cliente | 3 |
| dashboard_channels | 1 |
| dashboard_mottivme_geral | 1 |
| dashboard_overview | 1 |
| dashboard_cliente_hoje | 0 |
| app_dash_backup_1 | 0 |
| app_dash_backup_2 | 0 |

---

## 3. Problema das Views (RESOLVIDO)

### O que acontecia:
- `dashboard_performance_cliente` mostrava apenas 10 agentes com **zeros em todas métricas**
- As views dependiam de dados de `agent_conversations` que foram perdidos
- Não havia conexão com `app_dash_principal`

### Solução aplicada:
O hook `useClientPerformance.ts` foi modificado para:

1. **Fonte de dados**: Consultar diretamente `app_dash_principal` em vez das views
2. **Agrupamento**: Por `lead_usuario_responsavel` (responsável = cliente)
3. **Métricas do funil**: Calculadas a partir do campo `status`:
   - `totalLeads` = total de registros
   - `leadsResponderam` = todos que saíram de new_lead (booked + completed + qualifying + won + lost + no_show)
   - `leadsAgendaram` = booked + no_show + completed + won
   - `leadsCompareceram` = completed + qualifying + won
   - `leadsFecharam` = won

---

## 4. Mapeamento de Status do Funil

| Status | Significado | Conta em |
|--------|-------------|----------|
| new_lead | Lead novo, sem interação | totalLeads |
| booked | Agendou reunião | responderam, agendaram |
| no_show | Não compareceu | responderam, agendaram |
| qualifying | Em qualificação | responderam, compareceram |
| completed | Reunião realizada | responderam, agendaram, compareceram |
| won | Venda fechada | responderam, agendaram, compareceram, fecharam |
| lost | Perdido | responderam |

---

## 5. Estrutura da Tabela app_dash_principal

Campos principais utilizados:
- `lead_usuario_responsavel` - Nome do responsável/vendedor (usado como "cliente")
- `status` - Etapa do funil (new_lead, booked, no_show, completed, qualifying, won, lost)
- `funil` - Tipo de funil de origem
- `tag` - Tags do lead

---

## 6. Próximos Passos (Opcionais)

1. **Adicionar filtro de data**: O hook atual não filtra por período. Pode-se adicionar filtro pelo campo de data do `app_dash_principal`
2. **Mapear custos**: Conectar dados de `llm_costs` com responsáveis (requer campo de ligação)
3. **Corrigir views no Supabase**: Atualizar as views para usar `app_dash_principal` como fonte
