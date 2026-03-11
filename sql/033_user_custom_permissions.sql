-- ================================================================
-- USER CUSTOM PERMISSIONS
-- ================================================================
-- Migration: 033_user_custom_permissions.sql
-- Criado: 2026-02-23
-- Descricao: Adiciona coluna custom_permissions JSONB em user_locations
--            para override granular de permissoes por usuario/location.
--            Quando NULL, usa defaults do role. Quando preenchido, faz merge.
-- Rollback: ALTER TABLE user_locations DROP COLUMN IF EXISTS custom_permissions;
-- ================================================================

-- 1. Adicionar coluna
ALTER TABLE user_locations ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT NULL;

COMMENT ON COLUMN user_locations.custom_permissions IS 'Override granular de permissoes. NULL = defaults do role. JSONB com keys tipo canAccessDashboard: true/false.';

-- 2. Atualizar RPC admin_list_users para retornar custom_permissions
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  location_id TEXT,
  location_name TEXT,
  role TEXT,
  custom_permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuario atual e admin (por email)
  IF NOT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND au.email IN (
      'ceo@marcosdaniels.com',
      'marcos@mottiv.me',
      'marcosdanielsf@gmail.com',
      'marcos@mottivme.com',
      'marcos@socialfy.me',
      'admin@mottivme.com',
      'gustavo@mottivme.com'
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Retornar usuarios com suas locations + custom_permissions
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::TEXT as email,
    u.created_at,
    u.last_sign_in_at,
    ul.location_id,
    COALESCE(gl.location_name, ul.location_id) as location_name,
    ul.role,
    ul.custom_permissions
  FROM user_locations ul
  JOIN auth.users u ON ul.user_id = u.id
  LEFT JOIN ghl_locations gl ON ul.location_id = gl.id::TEXT
  ORDER BY u.email, gl.location_name;
END;
$$;

-- 3. Garantir permissao de execucao
GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;

-- 4. Policy para admins poderem UPDATE custom_permissions em user_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_update_user_locations' AND tablename = 'user_locations'
  ) THEN
    CREATE POLICY admin_update_user_locations ON user_locations
      FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT au.id FROM auth.users au
          WHERE au.email IN (
            'ceo@marcosdaniels.com',
            'marcos@mottiv.me',
            'marcosdanielsf@gmail.com',
            'marcos@mottivme.com',
            'marcos@socialfy.me',
            'admin@mottivme.com',
            'gustavo@mottivme.com'
          )
        )
      );
  END IF;
END $$;
