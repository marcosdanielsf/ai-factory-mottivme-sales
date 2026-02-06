-- Migration 021: User Locations e Sistema de Convites
-- Objetivo: Multi-tenancy - relacionar usuarios com locations GHL

-- ===========================================
-- TABELA: user_locations
-- Relaciona usuarios Supabase com locations GHL
-- ===========================================

CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, location_id)
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON user_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_role ON user_locations(role);

-- Comentarios
COMMENT ON TABLE user_locations IS 'Relacionamento entre usuarios Supabase e locations GHL para multi-tenancy';
COMMENT ON COLUMN user_locations.role IS 'admin: acesso total, client: acesso a propria subconta, viewer: somente leitura';

-- ===========================================
-- TABELA: location_invites
-- Convites para novos usuarios acessarem locations
-- ===========================================

CREATE TABLE IF NOT EXISTS location_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client', 'viewer')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_invites_token ON location_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON location_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_location ON location_invites(location_id);
CREATE INDEX IF NOT EXISTS idx_invites_expires ON location_invites(expires_at) WHERE used_at IS NULL;

-- Comentarios
COMMENT ON TABLE location_invites IS 'Convites para usuarios acessarem locations especificas';
COMMENT ON COLUMN location_invites.token IS 'Token unico para link de convite';
COMMENT ON COLUMN location_invites.expires_at IS 'Expira em 7 dias por padrao';

-- ===========================================
-- RLS: Row Level Security
-- ===========================================

-- Habilitar RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_invites ENABLE ROW LEVEL SECURITY;

-- Lista de emails admin (usar em todas as policies)
-- Nota: Em producao, considerar usar uma tabela de roles

-- Policies para user_locations
DROP POLICY IF EXISTS "admin_full_access_user_locations" ON user_locations;
CREATE POLICY "admin_full_access_user_locations" ON user_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('ceo@marcosdaniels.com', 'marcos@mottiv.me', 'marcosdanielsf@gmail.com')
    )
  );

DROP POLICY IF EXISTS "client_own_locations" ON user_locations;
CREATE POLICY "client_own_locations" ON user_locations
  FOR SELECT USING (user_id = auth.uid());

-- Policies para location_invites
DROP POLICY IF EXISTS "admin_full_access_invites" ON location_invites;
CREATE POLICY "admin_full_access_invites" ON location_invites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN ('ceo@marcosdaniels.com', 'marcos@mottiv.me', 'marcosdanielsf@gmail.com')
    )
  );

-- Qualquer um pode ler convite pelo token (para validar)
DROP POLICY IF EXISTS "anyone_read_invite_by_token" ON location_invites;
CREATE POLICY "anyone_read_invite_by_token" ON location_invites
  FOR SELECT USING (true);

-- ===========================================
-- FUNCAO: accept_invite
-- Aceita um convite e cria o relacionamento user_location
-- ===========================================

CREATE OR REPLACE FUNCTION accept_invite(invite_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Buscar usuario atual
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario nao autenticado');
  END IF;

  -- Buscar convite valido
  SELECT * INTO v_invite
  FROM location_invites
  WHERE token = invite_token
    AND used_at IS NULL
    AND expires_at > NOW();

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite invalido ou expirado');
  END IF;

  -- Verificar se ja existe relacionamento
  IF EXISTS (
    SELECT 1 FROM user_locations
    WHERE user_id = v_user_id AND location_id = v_invite.location_id
  ) THEN
    -- Marcar convite como usado mesmo assim
    UPDATE location_invites SET used_at = NOW() WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', true, 'message', 'Acesso ja existia', 'location_id', v_invite.location_id);
  END IF;

  -- Criar relacionamento
  INSERT INTO user_locations (user_id, location_id, role, invited_by)
  VALUES (v_user_id, v_invite.location_id, v_invite.role, v_invite.created_by);

  -- Marcar convite como usado
  UPDATE location_invites SET used_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Acesso concedido',
    'location_id', v_invite.location_id,
    'role', v_invite.role
  );
END;
$$;

-- Permissao para usuarios autenticados chamarem a funcao
GRANT EXECUTE ON FUNCTION accept_invite(TEXT) TO authenticated;

-- ===========================================
-- FUNCAO: get_user_locations
-- Retorna locations que o usuario tem acesso
-- ===========================================

CREATE OR REPLACE FUNCTION get_user_locations()
RETURNS TABLE (
  location_id TEXT,
  role TEXT,
  location_name TEXT,
  location_logo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ul.location_id,
    ul.role,
    gl.name as location_name,
    gl.logo_url as location_logo
  FROM user_locations ul
  LEFT JOIN ghl_locations gl ON ul.location_id = gl.id
  WHERE ul.user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_locations() TO authenticated;

-- ===========================================
-- SEED: Dar acesso admin a todas as locations existentes
-- ===========================================

-- Inserir admin em todas as locations
INSERT INTO user_locations (user_id, location_id, role)
SELECT
  u.id,
  gl.id,
  'admin'
FROM auth.users u
CROSS JOIN ghl_locations gl
WHERE u.email IN ('ceo@marcosdaniels.com', 'marcos@mottiv.me', 'marcosdanielsf@gmail.com')
ON CONFLICT (user_id, location_id) DO NOTHING;
