-- planning_tokens: tokens unicos para clientes acessarem o wizard de planejamento publico
-- Rota publica: /#/p/:token

CREATE TABLE IF NOT EXISTS planning_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_name TEXT NOT NULL,
  location_id TEXT,
  config JSONB DEFAULT '{}',
  plan_data JSONB,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index para lookup rapido por token ativo
CREATE INDEX idx_planning_tokens_token ON planning_tokens(token) WHERE is_active = true;

-- RLS
ALTER TABLE planning_tokens ENABLE ROW LEVEL SECURITY;

-- Leitura anonima por token ativo (nao expirado)
CREATE POLICY "Leitura publica por token ativo"
  ON planning_tokens FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RPC segura para salvar plan_data (anonimo so altera plan_data e updated_at)
CREATE OR REPLACE FUNCTION save_public_plan(p_token TEXT, p_plan_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE planning_tokens
  SET plan_data = p_plan_data, updated_at = now()
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  RETURN FOUND;
END;
$$;

-- Owner full access (quem criou o token)
CREATE POLICY "Owner full access"
  ON planning_tokens FOR ALL
  USING (auth.uid() = created_by);

-- Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION update_planning_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_planning_tokens_updated_at
  BEFORE UPDATE ON planning_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_tokens_updated_at();
