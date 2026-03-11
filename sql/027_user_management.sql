-- ================================================================
-- USER MANAGEMENT SYSTEM
-- ================================================================
-- Migration: 027_user_management.sql
-- Criado: 2026-02-11
-- Descrição: Função RPC para administradores listarem todos os usuários
-- ================================================================

-- Função para admins listarem usuários com suas locations
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  location_id TEXT,
  location_name TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é admin (por email)
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

  -- Retornar usuários com suas locations
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::TEXT as email,
    u.created_at,
    u.last_sign_in_at,
    ul.location_id,
    COALESCE(gl.location_name, ul.location_id) as location_name,
    ul.role
  FROM user_locations ul
  JOIN auth.users u ON ul.user_id = u.id
  LEFT JOIN ghl_locations gl ON ul.location_id = gl.id::TEXT
  ORDER BY u.email, gl.location_name;
END;
$$;

-- Garantir permissão de execução
GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;

-- RLS: permitir admins lerem user_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_user_locations' AND tablename = 'user_locations'
  ) THEN
    CREATE POLICY admin_read_user_locations ON user_locations
      FOR SELECT
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
        OR auth.uid() = user_id
      );
  END IF;
END $$;

COMMENT ON FUNCTION admin_list_users() IS 'Lista todos os usuários do sistema com suas locations. Apenas administradores podem executar.';
