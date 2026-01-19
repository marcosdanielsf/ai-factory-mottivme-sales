-- ============================================
-- TABELA DE ROTEIROS (SCRIPTS) - INSTITUTO AMAR
-- ============================================
-- Data: 01/01/2026
-- Projeto: Sistema de armazenamento de roteiros versionados
-- Cliente: Dr. Luiz Augusto Junior - Instituto Amar
-- ============================================

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: scripts_library
-- Armazena todos os roteiros de áudios e vídeos
-- ============================================

CREATE TABLE IF NOT EXISTS scripts_library (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL DEFAULT 'sNwLyynZWP6jEtBy1ubf',

  -- Tipo e categorização
  script_type TEXT NOT NULL CHECK (script_type IN ('audio', 'video')),
  stage TEXT NOT NULL CHECK (stage IN (
    'ativacao',
    'conexao',
    'qualificacao',
    'objecoes',
    'nutricao',
    'transicao',
    'pos_consulta',
    'reengajamento'
  )),
  substage TEXT, -- ex: 'objecao_marido', 'objecao_preco', 'bemvindo', 'dor'
  variation_number INTEGER NOT NULL CHECK (variation_number BETWEEN 1 AND 20),

  -- Conteúdo do roteiro
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- O roteiro completo em texto
  duration_target TEXT, -- ex: "45-60s", "2-3min"

  -- Metadados de validação
  version TEXT NOT NULL DEFAULT 'V2.0',
  validation_score INTEGER CHECK (validation_score BETWEEN 0 AND 100),
  validation_status TEXT CHECK (validation_status IN ('draft', 'approved', 'in_review', 'rejected')),
  validation_notes TEXT,

  -- Objetivos e foco
  primary_objective TEXT, -- ex: "Vender pro marido", "Urgência + desconto"
  secondary_objective TEXT,
  target_avatar TEXT, -- ex: "Mulher 40+ empresária"
  key_triggers JSONB, -- ex: ["R$ 300 desconto", "3x parcelamento", "agenda lotada"]

  -- Relacionamento com mídia gravada
  media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
  recording_status TEXT DEFAULT 'pending' CHECK (recording_status IN ('pending', 'scheduled', 'recorded', 'uploaded', 'live')),
  recording_date TIMESTAMP,

  -- Tom e estilo (baseado nas transcrições)
  tone_informal_score INTEGER CHECK (tone_informal_score BETWEEN 0 AND 100),
  tone_notes TEXT, -- ex: "Usar: vc, pra, tá, né?, menina, meu amor"
  intentional_imperfections TEXT[], -- ex: ["pausas", "ai", "olha", "né?"]

  -- Análise comparativa
  comparison_source TEXT, -- ex: "Transcrição Kickoff linha 99"
  alignment_notes TEXT,

  -- Auditoria
  created_by TEXT DEFAULT 'Claude Sonnet 4.5',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_edited_by TEXT,

  -- Status geral
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP,

  -- Nome do arquivo esperado (para upload posterior)
  expected_filename TEXT, -- ex: "v1_ativacao_bemvindo.mp3"

  UNIQUE(location_id, stage, substage, variation_number, version)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_scripts_location ON scripts_library(location_id);
CREATE INDEX idx_scripts_stage ON scripts_library(stage);
CREATE INDEX idx_scripts_substage ON scripts_library(substage);
CREATE INDEX idx_scripts_type ON scripts_library(script_type);
CREATE INDEX idx_scripts_validation_status ON scripts_library(validation_status);
CREATE INDEX idx_scripts_recording_status ON scripts_library(recording_status);
CREATE INDEX idx_scripts_version ON scripts_library(version);
CREATE INDEX idx_scripts_active ON scripts_library(is_active) WHERE is_active = TRUE;

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scripts_updated_at
  BEFORE UPDATE ON scripts_library
  FOR EACH ROW
  EXECUTE FUNCTION update_scripts_updated_at();

-- ============================================
-- TABELA: script_versions (Histórico de versões)
-- ============================================

CREATE TABLE IF NOT EXISTS script_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts_library(id) ON DELETE CASCADE,

  -- Versão
  version_number INTEGER NOT NULL,
  version_label TEXT, -- ex: "V1.0", "V2.0", "V2.1"

  -- Conteúdo da versão
  content TEXT NOT NULL,

  -- Mudanças
  change_summary TEXT,
  changed_fields JSONB, -- ex: {"tone": "mais informal", "triggers": "adicionado R$300"}

  -- Scores antes/depois
  previous_score INTEGER,
  new_score INTEGER,

  -- Auditoria
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Motivo da mudança
  change_reason TEXT
);

CREATE INDEX idx_script_versions_script_id ON script_versions(script_id);
CREATE INDEX idx_script_versions_created_at ON script_versions(created_at DESC);

-- ============================================
-- TABELA: script_feedback (Feedback do cliente)
-- ============================================

CREATE TABLE IF NOT EXISTS script_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES scripts_library(id) ON DELETE CASCADE,

  -- Feedback
  feedback_by TEXT NOT NULL, -- ex: "Dr. Luiz", "Mariana"
  feedback_type TEXT CHECK (feedback_type IN ('approval', 'revision', 'rejection', 'suggestion')),
  feedback_text TEXT NOT NULL,

  -- Score dado pelo cliente
  client_score INTEGER CHECK (client_score BETWEEN 1 AND 5),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')),

  -- Resposta
  response_text TEXT,
  response_by TEXT,
  response_at TIMESTAMP,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),

  -- Anexos (se houver)
  attachments JSONB -- ex: [{"type": "audio", "url": "..."}]
);

CREATE INDEX idx_script_feedback_script_id ON script_feedback(script_id);
CREATE INDEX idx_script_feedback_status ON script_feedback(status);
CREATE INDEX idx_script_feedback_created_at ON script_feedback(created_at DESC);

-- ============================================
-- VIEW: scripts_with_media
-- Combina roteiros com mídias gravadas
-- ============================================

CREATE OR REPLACE VIEW scripts_with_media AS
SELECT
  s.id as script_id,
  s.title,
  s.script_type,
  s.stage,
  s.substage,
  s.variation_number,
  s.content,
  s.validation_score,
  s.validation_status,
  s.recording_status,
  s.expected_filename,

  -- Dados da mídia (se existir)
  m.id as media_id,
  m.media_url,
  m.media_filename,
  m.usage_count,
  m.last_used_at,

  -- Status combinado
  CASE
    WHEN m.id IS NOT NULL THEN 'gravado'
    WHEN s.recording_status = 'scheduled' THEN 'agendado'
    ELSE 'pendente'
  END as combined_status

FROM scripts_library s
LEFT JOIN media_library m ON s.media_id = m.id
WHERE s.is_active = TRUE
ORDER BY s.stage, s.substage, s.variation_number;

-- ============================================
-- VIEW: scripts_pending_recording
-- Roteiros aprovados mas ainda não gravados
-- ============================================

CREATE OR REPLACE VIEW scripts_pending_recording AS
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
FROM scripts_library
WHERE
  is_active = TRUE
  AND validation_status = 'approved'
  AND recording_status IN ('pending', 'scheduled')
ORDER BY
  recording_date NULLS LAST,
  stage,
  variation_number;

-- ============================================
-- FUNÇÃO: get_script_details
-- Retorna detalhes completos de um roteiro
-- ============================================

CREATE OR REPLACE FUNCTION get_script_details(p_script_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'script', row_to_json(s.*),
    'media', row_to_json(m.*),
    'latest_feedback', (
      SELECT json_agg(f.* ORDER BY f.created_at DESC)
      FROM script_feedback f
      WHERE f.script_id = p_script_id
      LIMIT 5
    ),
    'version_history', (
      SELECT json_agg(v.* ORDER BY v.created_at DESC)
      FROM script_versions v
      WHERE v.script_id = p_script_id
      LIMIT 10
    )
  ) INTO v_result
  FROM scripts_library s
  LEFT JOIN media_library m ON s.media_id = m.id
  WHERE s.id = p_script_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: approve_script
-- Aprovar roteiro para gravação
-- ============================================

CREATE OR REPLACE FUNCTION approve_script(
  p_script_id UUID,
  p_approved_by TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE scripts_library
  SET
    validation_status = 'approved',
    recording_status = 'pending',
    validation_notes = COALESCE(p_notes, validation_notes),
    last_edited_by = p_approved_by,
    updated_at = NOW()
  WHERE id = p_script_id
  RETURNING json_build_object(
    'success', TRUE,
    'script_id', id,
    'title', title,
    'status', validation_status
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: link_script_to_media
-- Conectar roteiro a mídia gravada
-- ============================================

CREATE OR REPLACE FUNCTION link_script_to_media(
  p_script_id UUID,
  p_media_id UUID
)
RETURNS JSON AS $$
BEGIN
  UPDATE scripts_library
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

ALTER TABLE scripts_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura pública
CREATE POLICY "Allow public read access"
  ON scripts_library FOR SELECT
  TO public
  USING (true);

-- Policy: Permitir inserção autenticada
CREATE POLICY "Allow authenticated insert"
  ON scripts_library FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Permitir atualização autenticada
CREATE POLICY "Allow authenticated update"
  ON scripts_library FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Mesmas policies para script_versions
CREATE POLICY "Allow public read versions"
  ON script_versions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert versions"
  ON script_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Mesmas policies para script_feedback
CREATE POLICY "Allow public read feedback"
  ON script_feedback FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert feedback"
  ON script_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update feedback"
  ON script_feedback FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE scripts_library IS 'Armazena todos os roteiros de áudios e vídeos do Instituto Amar com versionamento e validação';
COMMENT ON TABLE script_versions IS 'Histórico de versões dos roteiros para auditoria';
COMMENT ON TABLE script_feedback IS 'Feedback do cliente sobre os roteiros';

COMMENT ON COLUMN scripts_library.validation_score IS 'Score de 0-100 baseado na análise de alinhamento com transcrições';
COMMENT ON COLUMN scripts_library.tone_informal_score IS 'Score de informalidade (85% = bom, 95% = excelente)';
COMMENT ON COLUMN scripts_library.key_triggers IS 'JSONB com gatilhos principais: ["R$ 300", "3x", "agenda lotada"]';

-- ============================================
-- DADOS INICIAIS (EXEMPLO)
-- ============================================

-- Inserir um exemplo de roteiro
INSERT INTO scripts_library (
  script_type,
  stage,
  substage,
  variation_number,
  title,
  content,
  duration_target,
  version,
  validation_score,
  validation_status,
  validation_notes,
  primary_objective,
  target_avatar,
  key_triggers,
  tone_informal_score,
  tone_notes,
  intentional_imperfections,
  expected_filename,
  recording_status
) VALUES (
  'audio',
  'objecoes',
  'objecao_marido',
  1,
  'ÁUDIO 1 - Objeção do Marido',
  E'Oi [NOME]! Tudo bem?\n\nOlha, a equipe me contou que vc tá pensando em fazer o tratamento mas quer conversar com seu marido antes. E tá TUDO BEM, viu?\n\nMas deixa eu te falar uma coisa que eu falo pra TODAS as mulheres que passam aqui...\n\nSua saúde é SUA. Seu corpo é SEU. E a decisão final? É SUA, meu amor.\n\nSe ele te ama de verdade, ele vai APOIAR a sua decisão de cuidar de você, tá?\n\nE olha, mulher que cuida dela mesma, que se sente bem, que tem energia... ela cuida MELHOR de todo mundo ao redor.\n\nEntão pensa com carinho, tá? E qualquer dúvida, a gente tá aqui pra te ajudar! 💛',
  '45-60s',
  'V2.0',
  95,
  'approved',
  'Aborda DIRETAMENTE o maior gargalo identificado nas transcrições (Diagnóstico linha 14 + Kickoff linha 20)',
  'Vender pro marido / Empoderar mulher',
  'Mulher 40+ empresária/profissional liberal',
  '["autonomia feminina", "aprovação do marido", "empoderamento", "cuidar de si"]',
  85,
  'Usar: vc, tá, né?, meu amor. Tom conversacional e acolhedor.',
  ARRAY['pausas naturais', 'tá?', 'viu?', 'meu amor'],
  'v1_objecao_marido.mp3',
  'pending'
) ON CONFLICT DO NOTHING;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

SELECT 'Scripts library tables created successfully!' as status;
