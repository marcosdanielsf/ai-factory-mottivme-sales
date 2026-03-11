-- ============================================================================
-- 054: RLS para tabelas da vertical imobiliaria
-- Mesmo padrao do sistema: filtro por location_id via user_locations
-- ============================================================================

-- imob_imoveis
ALTER TABLE imob_imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY imob_imoveis_select ON imob_imoveis
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_imoveis_insert ON imob_imoveis
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_imoveis_update ON imob_imoveis
  FOR UPDATE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_imoveis_delete ON imob_imoveis
  FOR DELETE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
      AND ul.role = 'admin'
    )
  );

-- imob_leads_perfil
ALTER TABLE imob_leads_perfil ENABLE ROW LEVEL SECURITY;

CREATE POLICY imob_leads_perfil_select ON imob_leads_perfil
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_leads_perfil_insert ON imob_leads_perfil
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_leads_perfil_update ON imob_leads_perfil
  FOR UPDATE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

-- imob_visitas
ALTER TABLE imob_visitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY imob_visitas_select ON imob_visitas
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_visitas_insert ON imob_visitas
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_visitas_update ON imob_visitas
  FOR UPDATE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

-- imob_indicacoes
ALTER TABLE imob_indicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY imob_indicacoes_select ON imob_indicacoes
  FOR SELECT USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_indicacoes_insert ON imob_indicacoes
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );

CREATE POLICY imob_indicacoes_update ON imob_indicacoes
  FOR UPDATE USING (
    location_id IN (
      SELECT ul.location_id FROM user_locations ul
      WHERE ul.user_id = auth.uid()
    )
  );
