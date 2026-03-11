-- Migration 066: RLS para agent_versions
-- Objetivo: Proteger prompts de agentes por location_id via user_locations
-- Rollback: ALTER TABLE agent_versions DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 1. Habilitar RLS
-- ===========================================

ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. Policy: Admin full access
-- Admins (email whitelist) podem tudo
-- ===========================================

DROP POLICY IF EXISTS "admin_full_access_agent_versions" ON agent_versions;
CREATE POLICY "admin_full_access_agent_versions" ON agent_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('ceo@marcosdaniels.com', 'marcos@mottiv.me', 'marcosdanielsf@gmail.com')
    )
  );

-- ===========================================
-- 3. Policy: Client SELECT
-- Usuarios autenticados veem apenas agent_versions
-- das locations que tem acesso via user_locations
-- ===========================================

DROP POLICY IF EXISTS "client_select_agent_versions" ON agent_versions;
CREATE POLICY "client_select_agent_versions" ON agent_versions
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id
      FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

-- ===========================================
-- 4. Policy: Client UPDATE (limitado)
-- Clientes podem atualizar apenas versoes
-- das suas locations (para aprovacoes no portal)
-- ===========================================

DROP POLICY IF EXISTS "client_update_agent_versions" ON agent_versions;
CREATE POLICY "client_update_agent_versions" ON agent_versions
  FOR UPDATE USING (
    location_id IN (
      SELECT ul.location_id
      FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

-- ===========================================
-- 5. Sem INSERT/DELETE para clientes
-- Criacao de versoes e feita via RPC
-- (upgrade_agent_version roda como SECURITY DEFINER)
-- ===========================================

-- ===========================================
-- 6. Indice para performance da policy
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_agent_versions_location_id
  ON agent_versions(location_id);

-- ===========================================
-- 7. Verificacao pos-migration
-- ===========================================

-- Confirmar RLS ativo:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'agent_versions';
-- Deve retornar: rowsecurity = true

-- Confirmar policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'agent_versions';
-- Deve retornar 3 policies: admin_full_access, client_select, client_update
