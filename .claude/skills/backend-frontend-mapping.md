# Backend ↔ Frontend Mapping - Self-Improving AI System

## DOCUMENTO CRITICO - CONSULTAR ANTES DE QUALQUER IMPLEMENTACAO

Este documento mapeia exatamente como os dados do Supabase devem aparecer no frontend.

---

## GAPS IDENTIFICADOS

### 1. Tipos TypeScript que FALTAM no Frontend

| Tipo | Status | Arquivo Destino |
|------|--------|-----------------|
| SystemPrompt | FALTA CRIAR | types.ts |
| ReflectionLog | FALTA CRIAR | types.ts |
| ImprovementSuggestion | FALTA CRIAR | types.ts |
| SelfImprovingSettings | FALTA CRIAR | types.ts |
| AgentConversation | FALTA CRIAR | types.ts |
| AgentConversationMessage | FALTA CRIAR | types.ts |

### 2. Helpers Supabase que FALTAM

| Helper | Status | Arquivo Destino |
|--------|--------|-----------------|
| db.systemPrompts.* | FALTA CRIAR | lib/supabase.ts |
| db.reflectionLogs.* | FALTA CRIAR | lib/supabase.ts |
| db.improvementSuggestions.* | FALTA CRIAR | lib/supabase.ts |
| db.selfImprovingSettings.* | FALTA CRIAR | lib/supabase.ts |
| db.agentConversations.* | FALTA CRIAR | lib/supabase.ts |

### 3. Componentes/Paginas que FALTAM

| Componente | Status | Descricao |
|------------|--------|-----------|
| SelfImprovingDashboard | FALTA CRIAR | Dashboard do sistema de auto-melhoria |
| ReflectionLogsTable | FALTA CRIAR | Tabela de logs de reflexao |
| PromptVersionHistory | FALTA CRIAR | Historico de versoes de prompts |
| SuggestionApprovalCard | FALTA CRIAR | Card para aprovar/rejeitar sugestoes |
| ScoreEvolutionChart | FALTA CRIAR | Grafico de evolucao de scores |
| SettingsPanel | FALTA CRIAR | Painel de configuracoes do self-improving |

---

## MAPEAMENTO DETALHADO: Tabela → Interface → Componente

### 1. system_prompts → SystemPrompt → PromptVersionHistory

**Query Supabase:**
```sql
SELECT * FROM system_prompts
WHERE agent_version_id = ?
ORDER BY version DESC
```

**Ou usar View:**
```sql
SELECT * FROM vw_self_improving_summary
WHERE agent_version_id = ?
```

**Mapeamento de Colunas:**
| Coluna SQL | Campo TypeScript | Componente UI |
|------------|------------------|---------------|
| id | id | (interno) |
| version | version | Badge "v4" |
| is_active | isActive | Badge "Active" verde |
| prompt_content | promptContent | Textarea expandivel |
| prompt_name | promptName | Titulo do card |
| performance_score | performanceScore | Score badge (ex: 4.2/5) |
| change_reason | changeReason | Tag colorida |
| change_summary | changeSummary | Texto "Reasoning for Update" |
| created_at | createdAt | Data formatada |
| activated_at | activatedAt | "Updated 12/6/2025" |

**Componente Existente:** Prompts Tab (parcialmente implementado)
**Acoes Necessarias:**
- Usar is_active para mostrar badge "Active"
- Mostrar performance_score ao lado de cada versao
- Botao "Revert to this version" ja existe

---

### 2. reflection_logs → ReflectionLog → ReflectionLogsTable

**Query Supabase:**
```sql
SELECT * FROM reflection_logs
WHERE agent_version_id = ?
ORDER BY created_at DESC
```

**Mapeamento de Colunas:**
| Coluna SQL | Campo TypeScript | Componente UI |
|------------|------------------|---------------|
| id | id | (interno) |
| created_at | createdAt | Coluna "TIME" |
| action_taken | actionTaken | Coluna "DECISION" (UPDATE/MAINTAIN) |
| overall_score | overallScore | Coluna "AVG SCORE" |
| weaknesses | weaknesses | Coluna "WEAKNESS" (primeiro item) |
| score_completeness | scoreCompleteness | Card "COMPLETENESS 2/5" |
| score_depth | scoreDepth | Card "DEPTH 4/5" |
| score_tone | scoreTone | Card "TONE 4/5" |
| score_scope | scoreScope | Card "SCOPE 1/5" |
| score_missed_opportunities | scoreMissedOpportunities | **FALTA NO FRONTEND** |
| strengths | strengths | Secao "Analysis" (positivos) |
| patterns_identified | patternsIdentified | Secao "Analysis" (padroes) |

**Componente Existente:** Reflection Logs Tab
**GAPS Identificados:**
- **FALTA:** score_missed_opportunities (5a dimensao)
- **FALTA:** strengths na UI (so mostra weaknesses)
- **FALTA:** patterns_identified na UI
- **FALTA:** Grafico de evolucao de scores

---

### 3. improvement_suggestions → ImprovementSuggestion → SuggestionApprovalCard

**Query Supabase:**
```sql
SELECT * FROM vw_pending_suggestions
WHERE agent_version_id = ?
ORDER BY confidence_score DESC
```

**Mapeamento de Colunas:**
| Coluna SQL | Campo TypeScript | Componente UI |
|------------|------------------|---------------|
| id | id | (interno) |
| suggestion_type | suggestionType | Tag colorida |
| rationale | rationale | Titulo da sugestao |
| confidence_score | confidenceScore | **FALTA NO FRONTEND** |
| focus_areas | focusAreas | Tags (Emotional Intelligence, etc) |
| status | status | Filtro dropdown |
| current_value | currentValue | **FALTA** (para mostrar diff) |
| suggested_value | suggestedValue | **FALTA** (para mostrar diff) |
| risk_assessment | riskAssessment | **FALTA NO FRONTEND** |
| expected_improvement | expectedImprovement | **FALTA NO FRONTEND** |
| created_at | createdAt | Data/hora |

**Componente Existente:** Suggestions Tab
**GAPS Identificados:**
- **FALTA:** confidence_score
- **FALTA:** current_value e suggested_value (diff visual)
- **FALTA:** risk_assessment
- **FALTA:** expected_improvement
- **FALTA:** Link para reflection_log que originou

---

### 4. self_improving_settings → SelfImprovingSettings → SettingsPanel

**Query Supabase:**
```sql
SELECT * FROM self_improving_settings
WHERE agent_version_id = ?
```

**Ou usar RPC:**
```sql
SELECT get_self_improving_config(?agent_version_id)
```

**Mapeamento de Colunas:**
| Coluna SQL | Campo TypeScript | Componente UI |
|------------|------------------|---------------|
| reflection_enabled | reflectionEnabled | **IMPLEMENTADO** (Paused/Active) |
| reflection_interval_hours | reflectionIntervalHours | **IMPLEMENTADO** (dropdown 10min-1h) |
| threshold_none | thresholdNone | **IMPLEMENTADO** (Score Threshold) |
| threshold_suggestion | thresholdSuggestion | **FALTA** (so mostra 1 threshold) |
| threshold_auto_update | thresholdAutoUpdate | **FALTA** |
| max_updates_per_day | maxUpdatesPerDay | **FALTA NO FRONTEND** |
| cooldown_after_update_hours | cooldownAfterUpdateHours | **FALTA NO FRONTEND** |
| min_conversations_for_reflection | minConversations | **IMPLEMENTADO** (Messages to Evaluate) |
| auto_apply_enabled | autoApplyEnabled | **FALTA NO FRONTEND** |
| auto_apply_min_confidence | autoApplyMinConfidence | **FALTA NO FRONTEND** |

**Componente Existente:** Reflection Settings
**GAPS Identificados:**
- **FALTA:** threshold_suggestion e threshold_auto_update (so tem 1 campo)
- **FALTA:** max_updates_per_day
- **FALTA:** cooldown_after_update_hours
- **FALTA:** auto_apply_enabled toggle
- **FALTA:** auto_apply_min_confidence
- **FALTA:** notification_webhook_url

---

### 5. Dashboard KPIs

**Query para KPIs:**
```sql
SELECT * FROM vw_self_improving_summary
WHERE agent_version_id = ?
```

**Mapeamento de Colunas:**
| Coluna View | Campo Frontend | Componente UI |
|-------------|----------------|---------------|
| (COUNT sessions) | totalSessions | Card "Total Sessions: 11" |
| (COUNT messages) | totalMessages | Card "Total Messages: 60" |
| prompt_version | currentPrompt | Card "Current Prompt: v4" |
| (COUNT reflections) | totalReflections | Card "Total Reflections: 15" |
| last_reflection_score | lastScore | Card "Last Reflection" scores |
| pending_suggestions | pendingSuggestions | **FALTA** (contador no header) |
| reflections_24h | reflections24h | **FALTA** |
| auto_updates_24h | autoUpdates24h | **FALTA** |

**Componente Existente:** Dashboard Tab
**GAPS Identificados:**
- **FALTA:** pending_suggestions badge no header
- **FALTA:** reflections_24h contador
- **FALTA:** auto_updates_24h contador
- **FALTA:** Grafico de evolucao (usar vw_score_evolution)

---

## ACOES PRIORITARIAS

### Prioridade ALTA (Funcionalidade Core)

1. **Adicionar tipos TypeScript no types.ts**
   - SystemPrompt
   - ReflectionLog
   - ImprovementSuggestion
   - SelfImprovingSettings

2. **Criar helpers Supabase no lib/supabase.ts**
   - db.systemPrompts.list(agentVersionId)
   - db.systemPrompts.getActive(agentVersionId)
   - db.reflectionLogs.list(agentVersionId)
   - db.improvementSuggestions.list(agentVersionId, status)
   - db.selfImprovingSettings.get(agentVersionId)
   - db.selfImprovingSettings.update(id, data)

3. **Corrigir Reflection Logs**
   - Adicionar 5a dimensao: score_missed_opportunities
   - Mostrar strengths alem de weaknesses
   - Mostrar patterns_identified

4. **Corrigir Settings**
   - Separar 3 thresholds (none, suggestion, auto_update)
   - Adicionar cooldown_after_update_hours
   - Adicionar max_updates_per_day

### Prioridade MEDIA (UX Melhorada)

5. **Melhorar Suggestions**
   - Mostrar confidence_score
   - Mostrar diff visual (current vs suggested)
   - Link para reflection_log origem

6. **Dashboard Enhancements**
   - Grafico de evolucao de scores (vw_score_evolution)
   - Contador de pending suggestions
   - Badge de status do cooldown

### Prioridade BAIXA (Nice to Have)

7. **Lock Prompt Feature**
   - Botao para travar prompt ativo

8. **Export/Backup**
   - Exportar prompts em JSON
   - Exportar logs em CSV

---

## QUERIES PRONTAS PARA USAR

### Dashboard - Resumo Geral
```typescript
const { data } = await supabase
  .from('vw_self_improving_summary')
  .select('*')
  .eq('agent_version_id', agentVersionId)
  .single();
```

### Prompts - Historico com Versoes
```typescript
const { data } = await supabase
  .from('system_prompts')
  .select('*')
  .eq('agent_version_id', agentVersionId)
  .order('version', { ascending: false });
```

### Reflection Logs - Lista Paginada
```typescript
const { data, count } = await supabase
  .from('reflection_logs')
  .select('*', { count: 'exact' })
  .eq('agent_version_id', agentVersionId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
```

### Suggestions - Pendentes
```typescript
const { data } = await supabase
  .from('vw_pending_suggestions')
  .select('*')
  .eq('agent_version_id', agentVersionId)
  .order('confidence_score', { ascending: false });
```

### Settings - Config Completa
```typescript
const { data } = await supabase
  .rpc('get_self_improving_config', {
    p_agent_version_id: agentVersionId
  });
```

### Score Evolution - Para Grafico
```typescript
const { data } = await supabase
  .from('vw_score_evolution')
  .select('*')
  .eq('agent_version_id', agentVersionId)
  .gte('date', thirtyDaysAgo)
  .order('date', { ascending: true });
```

---

## VALIDACAO ANTES DE IMPLEMENTAR

Checklist obrigatorio:

- [ ] Li o skill supabase-schema-analyzer.md
- [ ] Li o skill frontend-analyzer.md
- [ ] Confirmei que os tipos TypeScript existem
- [ ] Confirmei que as colunas batem com o schema SQL
- [ ] Testei a query no Supabase Dashboard primeiro
- [ ] Verifiquei se existe View que simplifica
- [ ] Atualizei este documento se necessario
