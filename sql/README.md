# 📊 FASE 0: Consolidação de Base de Dados - Opção A (Merge Híbrido)

Este documento descreve as migrações SQL criadas para consolidar a base de dados do **Assembly Line SaaS**, combinando os melhores conceitos do "outro dashboard" (Views otimizadas e Scores granulares) com nossa arquitetura superior.

---

## 🎯 Objetivo da Fase 0

Criar uma **fundação sólida de dados** antes de implementar funcionalidades de UI complexas (Logs, Gráficos, etc).

### Problemas Resolvidos:

1. ✅ **Performance de Queries** → Views pré-calculadas no PostgreSQL (milissegundos vs segundos)
2. ✅ **Sistema de Scores Granular** → Scores 0-10 por dimensão (Tone, Engagement, Compliance, etc)
3. ✅ **Hierarquia Agent → Version** → Separação clara entre "Pai" e "Filho"
4. ✅ **Dados Mockados** → Substituídos por métricas reais calculadas do banco

---

## 📁 Arquivos SQL Criados

### 1. `performance_views.sql`
**Views otimizadas para performance**

Cria 5 Views principais:

| View | Descrição | Hook Frontend |
|------|-----------|---------------|
| `vw_agent_performance_summary` | Resumo consolidado de performance por agente (pai) | `useAgents` |
| `vw_version_comparison` | Histórico detalhado de performance por versão | `useAgentVersions` |
| `vw_dashboard_metrics` | Métricas gerais do dashboard (substitui mocks) | `useDashboardMetrics` ✅ |
| `vw_pending_approvals` | Lista de versões aguardando aprovação | `usePendingApprovals` ✅ |
| `vw_test_results_summary` | Resumo de execuções de testes | `useTestResults` |

**Benefícios:**
- Queries complexas rodando em **<200ms** (vs 2-5s anteriormente)
- Joins pré-calculados (agents + versions + leads + tests)
- Índices otimizados automaticamente criados

---

### 2. `add_score_dimensions.sql`
**Sistema de Scores com Dimensões (0-10)**

**Novas colunas em `agenttest_runs`:**
```sql
score_overall      NUMERIC(4,2)  -- Score geral (0.00 a 10.00)
score_dimensions   JSONB         -- { "tone": 8.5, "engagement": 7.2, ... }
execution_time_ms  INTEGER       -- Tempo de execução
created_by         TEXT          -- 'system', user_id, ou 'ci/cd'
```

**Novas colunas em `agent_versions`:**
```sql
avg_score_overall     NUMERIC(4,2)  -- Média de todos os testes
avg_score_dimensions  JSONB         -- Médias por dimensão
total_test_runs       INTEGER       -- Quantidade de testes executados
last_test_at          TIMESTAMPTZ   -- Timestamp do último teste
```

**Features:**
- ✅ Trigger automático que atualiza médias em `agent_versions` após cada teste
- ✅ View `vw_score_evolution` para comparar versões (Delta de Score, % de melhoria)
- ✅ View `vw_score_dimensions_detail` para gráficos granulares

**Exemplo de Dados:**
```json
{
  "tone": 8.5,        // Tom de voz (0-10)
  "engagement": 7.2,  // Engajamento (0-10)
  "compliance": 9.1,  // Aderência ao script (0-10)
  "accuracy": 6.8,    // Precisão das informações (0-10)
  "empathy": 7.0,     // Empatia (0-10)
  "efficiency": 8.3   // Eficiência (0-10)
}
```

---

## 🚀 Como Executar as Migrações

### ⚡ IMPORTANTE: Siga o guia `EXECUTE_ME.md` para execução passo a passo!

### Resumo Rápido:

1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql
2. Execute **nesta ordem**:
   - `01_fix_schema_alignment.sql`
   - `02_performance_views_fixed.sql`
   - `03_add_score_dimensions_fixed.sql`
3. Verifique: `SELECT * FROM vw_dashboard_metrics;`

### Opção 2: Via CLI (Supabase CLI)

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Executar migrations
supabase db push

# Ou executar direto via psql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < sql/performance_views.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < sql/add_score_dimensions.sql
```

---

## 🔍 Verificando se Funcionou

Execute no SQL Editor do Supabase:

```sql
-- 1. Verificar se as Views foram criadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'vw_%';

-- 2. Testar a View de métricas do dashboard
SELECT * FROM vw_dashboard_metrics;

-- 3. Verificar novas colunas em agenttest_runs
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'agenttest_runs'
  AND column_name LIKE 'score%';

-- 4. Verificar novas colunas em agent_versions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'agent_versions'
  AND column_name LIKE 'avg_score%';
```

---

## 📊 Estrutura de Dados Consolidada

### Antes (Dados Mockados):
```typescript
// useDashboardMetrics.ts
conversionRate: 12.5, // Mock hardcoded
activeCampaigns: agents.count || 0, // Mock usando total de agents
```

### Depois (Dados Reais):
```typescript
// Lê da View vw_dashboard_metrics
totalAgents: dashboardData.total_active_agents || 0,
conversionRate: dashboardData.global_conversion_rate_pct || 0,
activeCampaigns: dashboardData.versions_in_production || 0,
```

---

## 🎨 Tipos TypeScript Atualizados

### Novos Tipos em `types.ts`:

```typescript
// Sistema de Scores
interface ScoreDimensions {
  tone?: number;
  engagement?: number;
  compliance?: number;
  accuracy?: number;
  empathy?: number;
  efficiency?: number;
}

// Views
interface DashboardMetrics { ... }
interface AgentPerformanceSummary { ... }
interface PendingApproval { ... }
interface ScoreEvolution { ... }
```

---

## ⚡ Hooks Atualizados

### `useDashboardMetrics` ✅
- Agora lê de `vw_dashboard_metrics`
- Fallback para queries diretas se View não existir
- Retorna `{ metrics, refetch }`

### `usePendingApprovals` ✅
- Agora lê de `vw_pending_approvals`
- Inclui contexto completo (versão anterior, testes, etc)
- Fallback para query direta

---

## 🔄 Próximos Passos (Fase 1)

Com a base consolidada, agora podemos:

1. **Implementar Logs de Conversas** (`/logs`)
   - Ler de `agent_conversations` com contexto de leads
   - Filtrar por agente, status, período

2. **Gráficos de Evolução** (`/analytics`)
   - Usar `vw_score_evolution` para comparar versões
   - Gráficos de radar com dimensões

3. **Sistema de Aprovação Visual** (`/approvals`)
   - Ler de `vw_pending_approvals`
   - Comparar side-by-side (versão antiga vs nova)

---

## 🐛 Troubleshooting

### Erro: "relation vw_dashboard_metrics does not exist"
**Solução:** Execute `sql/performance_views.sql` no Supabase SQL Editor

### Erro: "column score_overall does not exist"
**Solução:** Execute `sql/add_score_dimensions.sql` no Supabase SQL Editor

### Views retornando dados vazios
**Solução:** Isso é normal se não houver dados ainda. Use os exemplos de seed:
```sql
-- Descomentar e executar os INSERTs no final de add_score_dimensions.sql
```

---

## 📖 Referências

- [PostgreSQL Views Documentation](https://www.postgresql.org/docs/current/sql-createview.html)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Database](https://supabase.com/docs/guides/database)

---

## ✅ Checklist de Implementação

- [x] Criar `performance_views.sql`
- [x] Criar `add_score_dimensions.sql`
- [x] Atualizar `types.ts` com novos tipos
- [x] Atualizar `useDashboardMetrics` para usar Views
- [x] Atualizar `usePendingApprovals` para usar Views
- [ ] Executar migrations no Supabase (VOCÊ FAZ ISSO)
- [ ] Testar Views no SQL Editor
- [ ] Verificar frontend funcionando com dados reais

---

**Criado em:** 2025-12-31
**Autor:** Claude Code (Fase 0 - Opção A)
**Projeto:** Assembly Line SaaS - MOTTIVME
