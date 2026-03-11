# Supabase Migrations - MOTTIVME AI Factory

## Ordem de Execucao

Execute os arquivos na seguinte ordem no **Supabase SQL Editor**:

### 1. STEP1_create_tables.sql
Cria todas as tabelas, indices, triggers e seed data inicial.

**Tabelas criadas:**
- agencies
- sub_accounts
- user_profiles
- clients
- agent_versions
- leads
- conversations
- agent_metrics
- prompt_change_requests
- knowledge_base
- audit_log

### 2. STEP2_rls_policies.sql
Habilita Row Level Security (RLS) e cria todas as policies.

**Funcoes criadas:**
- get_user_agency_id()
- get_user_sub_account_id()
- get_user_role()
- is_super_admin()
- is_agency_user()
- is_sub_account_user()
- sub_account_in_user_agency()

## Como Executar

1. Acesse o Supabase Dashboard
2. Va em **SQL Editor**
3. Copie e cole o conteudo de `STEP1_create_tables.sql`
4. Clique em **Run**
5. Verifique se aparece "STEP 1 COMPLETE"
6. Copie e cole o conteudo de `STEP2_rls_policies.sql`
7. Clique em **Run**
8. Verifique se aparece "STEP 2 COMPLETE"

## Arquivos Legados (NAO USAR)

Os seguintes arquivos sao versoes antigas e podem ser ignorados:
- 000_complete_setup.sql
- 001_agency_subaccount_structure.sql
- 002_rls_policies.sql

## Troubleshooting

### Erro: "relation X does not exist"
Execute STEP1 primeiro antes de STEP2.

### Erro: "column X does not exist"
Verifique se STEP1 foi executado com sucesso.

### Erro: "policy already exists"
Execute este comando antes de rodar STEP2 novamente:
```sql
-- Remover todas as policies existentes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
  END LOOP;
END $$;
```
