# MIGRATION EXECUTION GUIDE - Self-Improving AI System

## Status: READY TO EXECUTE

### Migration Files:
1. `001_self_improving_system.sql` - Sistema base de auto-melhoria
2. `002_insert_initial_prompts.sql` - Prompts iniciais
3. `004_insert_test_conversations.sql` - Conversas de teste
4. `005_integrate_conversations_for_reflection.sql` - Tabelas de integracao
5. **`006_add_unique_constraint.sql`** - **NOVO: Constraint para ON CONFLICT**

### Integration Nodes (para n8n):
- `nodes-to-add/Self-Improving-Integration-Nodes.json` - Nos para adicionar ao fluxo principal
- `nodes-to-add/DIRECT_INTEGRATION_GUIDE.md` - Guia de implementacao

---

## Option 1: Execute via Supabase Dashboard (RECOMMENDED)

### Steps:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/bfumywvwubvernvhjehk

2. Navigate to: **SQL Editor** (left sidebar)

3. Click **New Query**

4. Copy the entire contents of the file:
   ```
   /Users/marcosdaniels/Documents/Projetos/MOTTIVME SALES TOTAL/projects/n8n-workspace/Fluxos n8n/AI-Factory- Mottivme Sales/migrations/001_self_improving_system.sql
   ```

5. Paste into the SQL Editor

6. Click **RUN** (or press Cmd+Enter)

7. Wait for execution to complete (should take 2-5 seconds)

8. Verify success by checking for the "Migration Complete" notice messages

---

## Option 2: Execute via psql (Command Line)

If you have the database password:

```bash
# Set the connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.bfumywvwubvernvhjehk.supabase.co:5432/postgres"

# Execute migration
psql "$DATABASE_URL" -f "/Users/marcosdaniels/Documents/Projetos/MOTTIVME SALES TOTAL/projects/n8n-workspace/Fluxos n8n/AI-Factory- Mottivme Sales/migrations/001_self_improving_system.sql"
```

To find your database password:
1. Go to Supabase Dashboard > Settings > Database
2. Look for "Connection String" or "Database Password"

---

## Option 3: Execute via n8n Workflow

You can use the n8n Postgres node to execute the SQL:

1. Create a new workflow in n8n
2. Add a **Postgres** node
3. Configure connection:
   - Host: `db.bfumywvwubvernvhjehk.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: [from Supabase Dashboard]
4. Set operation to **Execute Query**
5. Paste the SQL from `001_self_improving_system.sql`
6. Execute the workflow

---

## Post-Execution Verification

After running the migration, verify the tables were created successfully.

### Verification Queries:

Run these queries in the SQL Editor to confirm success:

```sql
-- 1. Check if all tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'system_prompts',
    'reflection_logs',
    'improvement_suggestions',
    'self_improving_settings'
  )
ORDER BY table_name;

-- Expected output: 4 rows


-- 2. Check if all views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'vw_%'
ORDER BY table_name;

-- Expected output:
-- - vw_pending_suggestions
-- - vw_score_evolution
-- - vw_self_improving_summary


-- 3. Check if RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_self_improving_config',
    'can_run_reflection',
    'update_self_improving_timestamp',
    'ensure_single_active_prompt'
  )
ORDER BY routine_name;

-- Expected output: 4 functions


-- 4. Check table structures
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'system_prompts',
    'reflection_logs',
    'improvement_suggestions',
    'self_improving_settings'
  )
GROUP BY table_name
ORDER BY table_name;

-- Expected output:
-- improvement_suggestions: 24 columns
-- reflection_logs: 23 columns
-- self_improving_settings: 24 columns
-- system_prompts: 18 columns


-- 5. Check initial settings were created
SELECT
  COUNT(*) as settings_created,
  SUM(CASE WHEN reflection_enabled THEN 1 ELSE 0 END) as enabled_count,
  SUM(CASE WHEN auto_apply_enabled THEN 1 ELSE 0 END) as auto_apply_count
FROM self_improving_settings;

-- Expected: settings_created should match number of agent_versions
-- All should have reflection_enabled = true
-- All should have auto_apply_enabled = false (safety)


-- 6. Test the RPC functions
-- Get config for a random agent
SELECT get_self_improving_config(
  (SELECT id FROM agent_versions LIMIT 1)
);

-- Check if can run reflection
SELECT can_run_reflection(
  (SELECT id FROM agent_versions LIMIT 1)
);
```

---

## Expected Results

After successful migration, you should have:

### Tables Created (4):
1. `system_prompts` - Prompt versioning with performance tracking
2. `reflection_logs` - Reflection cycle logs with scores and decisions
3. `improvement_suggestions` - AI-generated suggestions with approval workflow
4. `self_improving_settings` - System configuration per agent

### Views Created (3):
1. `vw_self_improving_summary` - Dashboard summary per agent
2. `vw_score_evolution` - Score trends over time
3. `vw_pending_suggestions` - Suggestions awaiting approval

### Functions Created (4):
1. `get_self_improving_config()` - Fetch agent configuration
2. `can_run_reflection()` - Check if reflection can run (cooldown, limits)
3. `update_self_improving_timestamp()` - Auto-update timestamps
4. `ensure_single_active_prompt()` - Ensure only one active prompt per agent

### Triggers Created (4):
1. Auto-update timestamps on system_prompts
2. Auto-update timestamps on improvement_suggestions
3. Auto-update timestamps on self_improving_settings
4. Ensure single active prompt validation

### Indexes Created (17):
- Performance indexes on all foreign keys
- Partial indexes for active records
- GIN indexes for array searches
- Composite indexes for common queries

---

## Troubleshooting

### Error: "relation does not exist"

**Cause:** Missing prerequisite tables (agent_versions, etc.)

**Solution:** Ensure the base AI Factory tables exist first. Check if `agent_versions` table exists:

```sql
SELECT * FROM agent_versions LIMIT 1;
```

If it doesn't exist, you need to run the base schema migration first.

---

### Error: "constraint violation"

**Cause:** Foreign key references don't match

**Solution:** Check that agent_versions table has data:

```sql
SELECT COUNT(*) FROM agent_versions;
```

---

### Error: "permission denied"

**Cause:** Insufficient database privileges

**Solution:** Ensure you're using the `service_role` key or have admin access in Supabase Dashboard.

---

## Rollback (if needed)

If something goes wrong, you can rollback the migration:

```sql
-- Drop in reverse order (respecting foreign keys)
DROP VIEW IF EXISTS vw_pending_suggestions;
DROP VIEW IF EXISTS vw_score_evolution;
DROP VIEW IF EXISTS vw_self_improving_summary;

DROP TRIGGER IF EXISTS trigger_single_active_prompt ON system_prompts;
DROP TRIGGER IF EXISTS trigger_settings_timestamp ON self_improving_settings;
DROP TRIGGER IF EXISTS trigger_suggestions_timestamp ON improvement_suggestions;
DROP TRIGGER IF EXISTS trigger_system_prompts_timestamp ON system_prompts;

DROP FUNCTION IF EXISTS can_run_reflection(UUID);
DROP FUNCTION IF EXISTS get_self_improving_config(UUID);
DROP FUNCTION IF EXISTS ensure_single_active_prompt();
DROP FUNCTION IF EXISTS update_self_improving_timestamp();

DROP TABLE IF EXISTS improvement_suggestions CASCADE;
DROP TABLE IF EXISTS reflection_logs CASCADE;
DROP TABLE IF EXISTS self_improving_settings CASCADE;
DROP TABLE IF EXISTS system_prompts CASCADE;
```

---

## Next Steps After Migration

1. Verify all tables and functions exist (use verification queries above)
2. Check that settings were created for existing agents
3. Test the system by creating a test prompt:
   ```sql
   INSERT INTO system_prompts (
     agent_version_id,
     prompt_content,
     prompt_name,
     is_active,
     change_reason
   )
   VALUES (
     (SELECT id FROM agent_versions LIMIT 1),
     'Test prompt for self-improving system',
     'Initial Test Prompt',
     true,
     'initial'
   );
   ```
4. Proceed to configure n8n workflows for the reflection loop

---

## MIGRATION 005: Integração com Fluxo Principal

### Problema Resolvido

O fluxo principal (`GHL - Mottivme - EUA Versionado.json`) usa:
- `crm_historico_mensagens` - Histórico de mensagens dos leads
- `n8n_historico_mensagens` - Memória da IA

Mas o **Reflection Loop** espera:
- `agent_conversations` - Conversas agregadas
- `agent_conversation_messages` - Mensagens individuais

**A Migration 005 resolve isso com duas abordagens:**

### Opção 1: VIEWs de Adaptação (Leitura)
```sql
-- Ver conversas no formato esperado pelo Reflection Loop
SELECT * FROM vw_conversations_for_reflection;

-- Ver todas as mensagens unificadas
SELECT * FROM vw_unified_messages_for_reflection;
```

### Opção 3: Sincronização Automática (Escrita)
Triggers que sincronizam automaticamente:
- `trigger_sync_crm_to_reflection` - Quando insere em `crm_historico_mensagens`
- `trigger_sync_n8n_to_reflection` - Quando insere em `n8n_historico_mensagens`

### Como Executar

1. Execute primeiro as migrations 001-004
2. Depois execute a migration 005:
   ```
   migrations/005_integrate_conversations_for_reflection.sql
   ```

### Verificação Pós-Migration 005

```sql
-- 1. Verificar tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('agent_conversations', 'agent_conversation_messages');

-- 2. Verificar views criadas
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'vw_%reflection%';

-- 3. Verificar triggers criados
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%reflection%';

-- 4. Testar função de busca para Reflection Loop
SELECT * FROM get_conversations_for_reflection(
  p_limit := 10,
  p_only_unanalyzed := true
);
```

### Como o Reflection Loop Deve Usar

```sql
-- Buscar conversas não analisadas para o Reflection Loop
SELECT * FROM get_conversations_for_reflection(
  p_agent_version_id := 'uuid-do-agente', -- opcional
  p_limit := 50,
  p_only_unanalyzed := true
);

-- Retorna:
-- - conversation_id
-- - contact_id
-- - mensagens_total
-- - messages (JSONB array com todas as mensagens)
-- - qa_analyzed (false = precisa analisar)
```

---

## Support

If you encounter any issues:
1. Check the verification queries above
2. Review error messages in Supabase Dashboard > Logs
3. Check the migration SQL file for syntax errors
4. Consult the Self-Improving AI System documentation

Migration files location:
```
migrations/001_self_improving_system.sql
migrations/005_integrate_conversations_for_reflection.sql
```
