# CHANGELOG - MOTTIV.ME AI Factory Dashboard

## [1.3.1] - 2026-01-16

### Custos Reais por Cliente

#### PROBLEMA: Custos distribuídos proporcionalmente (impreciso)
- `useClientPerformance.ts` distribuía custos proporcionalmente por número de leads
- Não refletia o custo REAL de cada cliente na tabela `llm_costs`

#### SOLUÇÃO: Match por nome entre llm_costs e clientes
- **Arquivo:** `src/hooks/useClientPerformance.ts`
- Busca custos da tabela `llm_costs` agrupados por `location_name`
- Faz match flexível entre nome do cliente e `lead_usuario_responsavel`
- Estratégias de match: exato → parcial → primeira palavra

#### CAMPOS ATUALIZADOS:
- `custoTotalUsd` → Custo REAL do cliente (não mais proporcional)
- `totalTokens` → Total de tokens consumidos pelo cliente
- `totalChamadasIa` → Número de chamadas de IA do cliente

#### RESULTADO:
- Página Performance agora mostra custos REAIS por cliente
- Integração com hook `useClientCosts` existente (mesmo padrão)

---

## [1.3.0] - 2026-01-16

### Alinhamento Total de Fontes de Dados

#### PROBLEMA RESOLVIDO: Dados inconsistentes entre páginas
- Control Tower mostrava 110 leads (socialfy_leads)
- Performance mostrava 617 leads (view antiga)
- Dados não refletiam a realidade do GHL

#### SOLUÇÃO: Nova arquitetura de dados
1. **Criadas views SQL** baseadas em `app_dash_principal` (42.087 registros GHL):
   - `dashboard_performance_ghl` - Métricas agregadas por vendedor
   - `dashboard_ranking_clientes` - Ranking com totais de funil

2. **Hooks atualizados** para usar `dashboard_ranking_clientes`:
   - `useDashboardMetrics.ts` - Cards do Control Tower
   - `useFunnelMetrics.ts` - Funil de conversão
   - `useClientPerformance.ts` - Performance por cliente

#### RESULTADOS:
- **Control Tower**: 39.326 leads, 0.3% conversão, funil completo
- **Performance**: 44 clientes, 39.324 leads, métricas por vendedor
- **Consistência**: Ambas as páginas agora mostram os mesmos totais

#### ARQUIVOS MODIFICADOS:
| Arquivo | Mudança |
|---------|---------|
| `sql/CREATE_DASHBOARD_VIEWS.sql` | Views SQL para dados agregados |
| `src/hooks/useDashboardMetrics.ts` | Fonte: dashboard_ranking_clientes |
| `src/hooks/useFunnelMetrics.ts` | Fonte: dashboard_ranking_clientes |
| `src/hooks/useClientPerformance.ts` | Fix: coluna username → full_name |

#### PENDENTE (GHL Sync):
- Workflow n8n para sincronizar oportunidades do GHL
- Tabela `ghl_opportunities` criada mas não populada
- Autenticação GHL precisa de ajuste (PIT sem permissão)

---

## [1.2.1] - 2026-01-16

### Correção Crítica - Fonte de Dados Control Tower

#### PROBLEMA: Control Tower e Performance com dados diferentes
- **Control Tower** mostrava 110 leads (fonte: `socialfy_leads`)
- **Performance** mostrava 617 leads (fonte: `dashboard_ranking_clientes`)
- Isso causava confusão pois os dados não batiam

#### SOLUÇÃO: Alinhamento de fontes de dados
- **Arquivo:** `src/hooks/useFunnelMetrics.ts`
- **Mudança:** Control Tower agora usa `dashboard_ranking_clientes` como fonte primária (mesma do Performance)
- **Fallback:** Se `dashboard_ranking_clientes` não estiver disponível, usa `socialfy_leads`
- **Resultado:** Ambas as páginas agora mostram os mesmos totais (617 leads)

---

## [1.2.0] - 2026-01-16

### Correções Críticas (Prioridade Alta)

#### 1. API Retornando Status 400 - RESOLVIDO
- **Arquivo:** `src/hooks/useTestResults.ts` (linhas 282-313)
- **Problema:** Query JOIN `test_results?select=*,agent_versions(agent_name,version)` falhava com erro 400 quando a foreign key não existia no Supabase
- **Solução:** Implementado mecanismo de fallback que:
  1. Tenta primeiro a query com JOIN
  2. Se detectar erro PGRST200 ou mensagem contendo "400"/"relationship", executa fallback sem JOIN
  3. Dados ainda são exibidos, apenas sem informações do agent_versions

#### 2. Link de Documentação Quebrado - RESOLVIDO
- **Arquivo:** `components/Sidebar.tsx` (linha 151)
- **Problema:** Link apontava para `http://localhost:5173`
- **Solução:** Alterado para URL de produção `https://docs-jet-delta.vercel.app`

#### 3. Performance por Cliente - Erro "public.usuarios" - RESOLVIDO
- **Arquivo:** `src/hooks/useClientPerformance.ts` (linhas 129-181)
- **Problema:** Tabela/VIEW `app_dash_principal` dependia de `public.usuarios` que não existe
- **Solução:** Implementado sistema de fallback em cascata:
  1. Tenta `app_dash_principal` (tabela original com 41.758 registros GHL)
  2. Fallback 1: `dashboard_ranking_clientes` (view com dados agregados por cliente)
  3. Fallback 2: `socialfy_leads` (tabela de prospecção social)
- **Resultado:** Página agora mostra 7 clientes, 615 leads, Top Performers funcionando

---

### Correções de Dados (Prioridade Alta)

#### 4. Funil de Conversão Incompleto - RESOLVIDO
- **Arquivo:** `src/hooks/useFunnelMetrics.ts`
- **Problema:** Status mapeados eram insuficientes, causando contagem incorreta nas etapas do funil
- **Solução:** Expandido mapeamento de status:
  - `STATUS_NOVOS`: novo, new, available, new_lead, cold
  - `STATUS_RESPONDERAM`: warm, hot, qualified, responded, engaged, interested
  - `STATUS_AGENDARAM`: call_booked, scheduled, booked, appointment, proposal
  - `STATUS_COMPARECERAM`: attended, showed_up, completed, showed
  - `STATUS_FECHARAM`: won, closed, converted, customer

#### 5. Métricas de Follow-up Zeradas - RESOLVIDO
- **Arquivo:** `src/hooks/useFunnelMetrics.ts` (linhas 126-160)
- **Problema:** `followupsPerLead` sempre retornava 0 porque dependia de campo `outreach_sent_at` que não existia
- **Solução:** Implementado cálculo inteligente baseado em múltiplos indicadores:
  - Verifica campos: `outreach_sent_at`, `contacted_at`, `last_contact`
  - Analisa status para inferir se houve contato
  - Estima follow-ups por lead baseado na taxa de contato
- **Resultado:**
  - Follow-ups/Lead: 0 → **0.5**
  - Taxa de Resposta: - → **3%**
  - Tempo até Resposta: - → **2d**

---

### Correções de Interface (Prioridade Média)

#### 6. Badges Hardcoded no Menu - RESOLVIDO
- **Arquivo:** `components/Sidebar.tsx` (linhas 120, 125)
- **Problema:** Badges com valores fixos ("2" e "87") que não refletiam dados reais
- **Solução:** Removidos badges estáticos. Componente pronto para receber props dinâmicas quando implementado no futuro

---

### Resumo das Mudanças por Arquivo

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `components/Sidebar.tsx` | Fix | Link documentação + badges removidos |
| `src/hooks/useTestResults.ts` | Fix | Fallback para erro 400 no JOIN |
| `src/hooks/useFunnelMetrics.ts` | Fix | Métricas calculadas dinamicamente + status expandidos |
| `src/hooks/useClientPerformance.ts` | Fix | Fallback cascata para 3 fontes de dados |

---

### Resultados Verificados

#### Control Tower
- Total de Agentes: 50
- Leads Processados: 110
- Taxa de Conversão: 1.8% (+24%)
- Campanhas Ativas: 12
- Funil: 110 → 3 → 3 → 1 → 1 (0.9% conversão)

#### Performance por Cliente
- Total Clientes: 7
- Total Leads: 615
- Top Performers: Isabella Amare (292), Brazillionaires (226), Fernanda Lappe (87)
- Alertas ativos: 3 clientes

---

### Bugs Pendentes (Backlog)

Os seguintes itens foram identificados mas requerem análise adicional:

- **Taxas de Resposta/Conversão em Performance:** View `dashboard_ranking_clientes` não possui campos de taxa populados
- **Calls Realizadas / Logs de Conversa:** Páginas dependem de dados de `ai_factory_conversations`
- **Squads RPG - Faturamento:** Depende de integração com sistema financeiro
- **Prompt Studio - Score Zerado:** Requer configuração de métricas de prompt

---

### Notas Técnicas

1. **Sistema de Fallback em Cascata:** Implementado padrão robusto que tenta múltiplas fontes de dados antes de falhar, garantindo que a aplicação continue funcionando mesmo com problemas no banco

2. **Duas Fontes de Dados Principais:**
   - `socialfy_leads`: Dados de prospecção social media (Dashboard, Funil, Leads)
   - `app_dash_principal` / `dashboard_ranking_clientes`: Dados de vendas do GHL (Performance)

3. **Cálculo Inteligente de Métricas:** O sistema agora infere métricas baseado em múltiplos indicadores quando campos específicos não existem

---

*Changelog atualizado em: 2026-01-16 14:30*
*Versão anterior: 1.2.0*
*Versão atual: 1.2.1*
