-- ============================================
-- INSTITUTO AMARE - TABELAS DE ROTEIROS
-- ============================================
-- Data: 01/01/2026
-- Cliente: Dr. Luiz Augusto Junior
-- Nomenclatura: amare_* (específica do projeto)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: amare_scripts
-- Roteiros de áudios e vídeos do Instituto Amare
-- ============================================

CREATE TABLE IF NOT EXISTS amare_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL DEFAULT 'sNwLyynZWP6jEtBy1ubf',
  
  script_type TEXT NOT NULL CHECK (script_type IN ('audio', 'video')),
  stage TEXT NOT NULL,
  substage TEXT,
  variation_number INTEGER NOT NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  duration_target TEXT,
  
  version TEXT NOT NULL DEFAULT 'V2.0',
  validation_score INTEGER CHECK (validation_score BETWEEN 0 AND 100),
  validation_status TEXT DEFAULT 'approved' CHECK (validation_status IN ('draft', 'approved', 'in_review', 'rejected')),
  validation_notes TEXT,
  
  primary_objective TEXT,
  secondary_objective TEXT,
  target_avatar TEXT,
  key_triggers JSONB,
  
  media_id UUID,
  recording_status TEXT DEFAULT 'pending' CHECK (recording_status IN ('pending', 'scheduled', 'recorded', 'uploaded', 'live')),
  recording_date TIMESTAMP,
  
  tone_informal_score INTEGER,
  tone_notes TEXT,
  intentional_imperfections TEXT[],
  
  comparison_source TEXT,
  alignment_notes TEXT,
  
  created_by TEXT DEFAULT 'Claude Sonnet 4.5',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_edited_by TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP,
  expected_filename TEXT,
  
  UNIQUE(location_id, stage, substage, variation_number, version)
);

-- Índices
CREATE INDEX idx_amare_scripts_location ON amare_scripts(location_id);
CREATE INDEX idx_amare_scripts_stage ON amare_scripts(stage);
CREATE INDEX idx_amare_scripts_type ON amare_scripts(script_type);
CREATE INDEX idx_amare_scripts_status ON amare_scripts(validation_status);
CREATE INDEX idx_amare_scripts_recording ON amare_scripts(recording_status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_amare_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_amare_scripts_updated_at
  BEFORE UPDATE ON amare_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_amare_scripts_updated_at();

-- ============================================
-- TABELA: amare_script_versions
-- Histórico de versões dos roteiros
-- ============================================

CREATE TABLE IF NOT EXISTS amare_script_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES amare_scripts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  content TEXT NOT NULL,
  change_summary TEXT,
  changed_fields JSONB,
  previous_score INTEGER,
  new_score INTEGER,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  change_reason TEXT
);

CREATE INDEX idx_amare_versions_script ON amare_script_versions(script_id);

-- ============================================
-- TABELA: amare_script_feedback
-- Feedback do Dr. Luiz sobre roteiros
-- ============================================

CREATE TABLE IF NOT EXISTS amare_script_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES amare_scripts(id) ON DELETE CASCADE,
  feedback_by TEXT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('approval', 'revision', 'rejection', 'suggestion')),
  feedback_text TEXT NOT NULL,
  client_score INTEGER CHECK (client_score BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')),
  response_text TEXT,
  response_by TEXT,
  response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  attachments JSONB
);

CREATE INDEX idx_amare_feedback_script ON amare_script_feedback(script_id);

-- ============================================
-- VIEW: amare_scripts_pending
-- Roteiros aprovados aguardando gravação
-- ============================================

CREATE OR REPLACE VIEW amare_scripts_pending AS
SELECT
  id,
  title,
  script_type,
  stage,
  substage,
  variation_number,
  validation_score,
  expected_filename,
  recording_status,
  recording_date
FROM amare_scripts
WHERE
  is_active = TRUE
  AND validation_status = 'approved'
  AND recording_status IN ('pending', 'scheduled')
ORDER BY
  recording_date NULLS LAST,
  validation_score DESC;

-- ============================================
-- FUNÇÃO: amare_get_script_details
-- Retorna detalhes completos de um roteiro
-- ============================================

CREATE OR REPLACE FUNCTION amare_get_script_details(p_script_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'script', row_to_json(s.*),
    'latest_feedback', (
      SELECT json_agg(f.* ORDER BY f.created_at DESC)
      FROM amare_script_feedback f
      WHERE f.script_id = p_script_id
      LIMIT 5
    ),
    'version_history', (
      SELECT json_agg(v.* ORDER BY v.created_at DESC)
      FROM amare_script_versions v
      WHERE v.script_id = p_script_id
      LIMIT 10
    )
  ) INTO v_result
  FROM amare_scripts s
  WHERE s.id = p_script_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: amare_link_to_media
-- Conectar roteiro a mídia gravada
-- ============================================

CREATE OR REPLACE FUNCTION amare_link_to_media(
  p_script_id UUID,
  p_media_id UUID
)
RETURNS JSON AS $$
BEGIN
  UPDATE amare_scripts
  SET
    media_id = p_media_id,
    recording_status = 'uploaded',
    recording_date = NOW(),
    updated_at = NOW()
  WHERE id = p_script_id;

  RETURN json_build_object(
    'success', TRUE,
    'script_id', p_script_id,
    'media_id', p_media_id,
    'status', 'linked'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE amare_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE amare_script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE amare_script_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "amare_scripts_public_read"
  ON amare_scripts FOR SELECT
  TO public USING (true);

CREATE POLICY "amare_scripts_auth_all"
  ON amare_scripts FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "amare_versions_public_read"
  ON amare_script_versions FOR SELECT
  TO public USING (true);

CREATE POLICY "amare_versions_auth_insert"
  ON amare_script_versions FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "amare_feedback_public_read"
  ON amare_script_feedback FOR SELECT
  TO public USING (true);

CREATE POLICY "amare_feedback_auth_all"
  ON amare_script_feedback FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE amare_scripts IS 'Roteiros de áudios e vídeos do Instituto Amare - Dr. Luiz';
COMMENT ON TABLE amare_script_versions IS 'Histórico de versões dos roteiros';
COMMENT ON TABLE amare_script_feedback IS 'Feedback do Dr. Luiz sobre roteiros';

SELECT 'Instituto Amare - Tabelas criadas com sucesso!' as status;
