-- =========================================
-- SUPABASE SETUP - INSTITUTO AMAR
-- Sistema de Rotação de Mídia
-- =========================================
-- Location ID: sNwLyynZWP6jEtBy1ubf
-- Projeto: mottivme-instituto-amar
-- Data: 01/01/2026
-- =========================================

-- =========================================
-- 1. EXTENSÕES
-- =========================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 2. TABELA: media_library
-- =========================================

CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id TEXT NOT NULL DEFAULT 'sNwLyynZWP6jEtBy1ubf',
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video', 'image')),
  stage TEXT NOT NULL CHECK (stage IN (
    'ativacao',
    'conexao',
    'qualificacao',
    'objecoes',
    'nutricao',
    'transicao',
    'pos_consulta'
  )),
  substage TEXT, -- ex: 'objecao_marido', 'objecao_preco'
  variation_number INTEGER NOT NULL CHECK (variation_number BETWEEN 1 AND 20),
  media_url TEXT NOT NULL,
  media_filename TEXT NOT NULL,
  file_size_mb NUMERIC(10,2),
  duration_seconds INTEGER, -- para áudios/vídeos
  description TEXT,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by TEXT, -- user que fez upload
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =========================================
-- 3. ÍNDICES
-- =========================================

-- Índice principal para queries de rotação
CREATE INDEX idx_media_rotation
ON media_library(location_id, stage, media_type, is_active, usage_count);

-- Índice para busca por substage (objeções específicas)
CREATE INDEX idx_media_substage
ON media_library(location_id, substage, is_active, usage_count)
WHERE substage IS NOT NULL;

-- Índice para análise temporal
CREATE INDEX idx_media_usage_tracking
ON media_library(location_id, last_used_at DESC);

-- Índice para metadata (queries JSONB)
CREATE INDEX idx_media_metadata
ON media_library USING GIN (metadata);

-- =========================================
-- 4. FUNÇÃO: update_updated_at_column()
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 5. TRIGGER: auto_update_timestamp
-- =========================================

CREATE TRIGGER auto_update_timestamp
BEFORE UPDATE ON media_library
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 6. FUNÇÃO: get_least_used_media()
-- =========================================
-- Retorna a mídia MENOS usada para balanceamento

CREATE OR REPLACE FUNCTION get_least_used_media(
  p_location_id TEXT,
  p_stage TEXT,
  p_media_type TEXT,
  p_substage TEXT DEFAULT NULL
)
RETURNS TABLE (
  media_id UUID,
  media_url TEXT,
  variation_number INTEGER,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    media_library.media_url,
    media_library.variation_number,
    media_library.usage_count
  FROM media_library
  WHERE location_id = p_location_id
    AND stage = p_stage
    AND media_type = p_media_type
    AND is_active = true
    AND (p_substage IS NULL OR substage = p_substage)
  ORDER BY usage_count ASC, random() -- Menor uso + aleatoriedade
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 7. FUNÇÃO: increment_usage()
-- =========================================
-- Incrementa contador após uso

CREATE OR REPLACE FUNCTION increment_usage(p_media_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE media_library
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = p_media_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 8. VIEW: media_usage_stats
-- =========================================
-- Estatísticas de uso por etapa

CREATE OR REPLACE VIEW media_usage_stats AS
SELECT
  location_id,
  stage,
  substage,
  media_type,
  COUNT(*) as total_variations,
  SUM(usage_count) as total_uses,
  AVG(usage_count) as avg_uses_per_variation,
  MIN(usage_count) as min_uses,
  MAX(usage_count) as max_uses,
  STDDEV(usage_count) as stddev_uses,
  -- Coeficiente de variação (quanto menor, mais balanceado)
  CASE
    WHEN AVG(usage_count) > 0
    THEN STDDEV(usage_count) / AVG(usage_count)
    ELSE 0
  END as coefficient_of_variation
FROM media_library
WHERE is_active = true
GROUP BY location_id, stage, substage, media_type
ORDER BY location_id, stage, media_type;

-- =========================================
-- 9. VIEW: media_balance_report
-- =========================================
-- Relatório de balanceamento (quais estão desbalanceadas?)

CREATE OR REPLACE VIEW media_balance_report AS
SELECT
  location_id,
  stage,
  substage,
  media_type,
  total_variations,
  total_uses,
  avg_uses_per_variation,
  coefficient_of_variation,
  CASE
    WHEN coefficient_of_variation < 0.1 THEN 'Muito Balanceado'
    WHEN coefficient_of_variation < 0.3 THEN 'Balanceado'
    WHEN coefficient_of_variation < 0.5 THEN 'Moderado'
    ELSE 'Desbalanceado'
  END as balance_status
FROM media_usage_stats
ORDER BY coefficient_of_variation DESC;

-- =========================================
-- 10. RLS (Row Level Security)
-- =========================================

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir tudo (simplificado para MVP)
-- Em produção, refinar com autenticação
CREATE POLICY "Allow all operations"
ON media_library
FOR ALL
USING (true)
WITH CHECK (true);

-- =========================================
-- 11. DADOS INICIAIS (Placeholders)
-- =========================================
-- Inserir estrutura vazia para Dr. Luiz

INSERT INTO media_library
(location_id, media_type, stage, substage, variation_number, media_url, media_filename, description, is_active)
VALUES

-- ATIVAÇÃO - Boas-vindas (5 variações)
('sNwLyynZWP6jEtBy1ubf', 'audio', 'ativacao', NULL, 1, 'PLACEHOLDER', 'v1_ativacao_bemvindo.mp3', 'Áudio boas-vindas Dr. Luiz - Variação 1', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'ativacao', NULL, 2, 'PLACEHOLDER', 'v2_ativacao_bemvindo.mp3', 'Áudio boas-vindas Dr. Luiz - Variação 2', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'ativacao', NULL, 3, 'PLACEHOLDER', 'v3_ativacao_bemvindo.mp3', 'Áudio boas-vindas Dr. Luiz - Variação 3', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'ativacao', NULL, 4, 'PLACEHOLDER', 'v4_ativacao_bemvindo.mp3', 'Áudio boas-vindas Dr. Luiz - Variação 4', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'ativacao', NULL, 5, 'PLACEHOLDER', 'v5_ativacao_bemvindo.mp3', 'Áudio boas-vindas Dr. Luiz - Variação 5', false),

-- CONEXÃO - Entender dor (3 variações)
('sNwLyynZWP6jEtBy1ubf', 'audio', 'conexao', NULL, 1, 'PLACEHOLDER', 'v1_conexao_dor.mp3', 'Áudio conexão empática - Variação 1', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'conexao', NULL, 2, 'PLACEHOLDER', 'v2_conexao_dor.mp3', 'Áudio conexão empática - Variação 2', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'conexao', NULL, 3, 'PLACEHOLDER', 'v3_conexao_dor.mp3', 'Áudio conexão empática - Variação 3', false),

-- OBJEÇÕES - Marido (2 variações)
('sNwLyynZWP6jEtBy1ubf', 'audio', 'objecoes', 'objecao_marido', 1, 'PLACEHOLDER', 'v1_objecao_marido.mp3', 'Áudio objeção marido - Autonomia - Variação 1', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'objecoes', 'objecao_marido', 2, 'PLACEHOLDER', 'v2_objecao_marido.mp3', 'Áudio objeção marido - Autonomia - Variação 2', false),

-- OBJEÇÕES - Preço (2 variações)
('sNwLyynZWP6jEtBy1ubf', 'audio', 'objecoes', 'objecao_preco', 1, 'PLACEHOLDER', 'v1_objecao_preco.mp3', 'Áudio objeção preço - Investimento - Variação 1', false),
('sNwLyynZWP6jEtBy1ubf', 'audio', 'objecoes', 'objecao_preco', 2, 'PLACEHOLDER', 'v2_objecao_preco.mp3', 'Áudio objeção preço - Investimento - Variação 2', false),

-- VÍDEOS EDUCATIVOS (3 temas)
('sNwLyynZWP6jEtBy1ubf', 'video', 'nutricao', 'menopausa', 1, 'PLACEHOLDER', 'v1_video_menopausa.mp4', 'Vídeo: 3 Erros que Pioram a Menopausa', false),
('sNwLyynZWP6jEtBy1ubf', 'video', 'nutricao', 'emagrecimento', 1, 'PLACEHOLDER', 'v1_video_emagrecimento.mp4', 'Vídeo: Por Que Você NÃO Consegue Emagrecer', false),
('sNwLyynZWP6jEtBy1ubf', 'video', 'nutricao', 'longevidade', 1, 'PLACEHOLDER', 'v1_video_longevidade.mp4', 'Vídeo: Longevidade - O Que a Medicina NÃO Te Conta', false);

-- =========================================
-- 12. QUERIES ÚTEIS
-- =========================================

-- Query 1: Buscar mídia menos usada (ativação)
COMMENT ON FUNCTION get_least_used_media IS
'Uso: SELECT * FROM get_least_used_media(''sNwLyynZWP6jEtBy1ubf'', ''ativacao'', ''audio'');';

-- Query 2: Ver estatísticas gerais
COMMENT ON VIEW media_usage_stats IS
'Uso: SELECT * FROM media_usage_stats WHERE location_id = ''sNwLyynZWP6jEtBy1ubf'';';

-- Query 3: Relatório de balanceamento
COMMENT ON VIEW media_balance_report IS
'Uso: SELECT * FROM media_balance_report WHERE balance_status = ''Desbalanceado'';';

-- Query 4: Atualizar URL após upload
-- UPDATE media_library
-- SET media_url = 'https://[supabase-project].supabase.co/storage/v1/object/public/media/v1_ativacao.mp3',
--     is_active = true
-- WHERE location_id = 'sNwLyynZWP6jEtBy1ubf'
--   AND stage = 'ativacao'
--   AND variation_number = 1;

-- Query 5: Resetar contadores (útil para testes)
-- UPDATE media_library
-- SET usage_count = 0,
--     last_used_at = NULL
-- WHERE location_id = 'sNwLyynZWP6jEtBy1ubf';

-- =========================================
-- 13. STORAGE BUCKET SETUP
-- =========================================
-- Via interface Supabase:
-- 1. Ir em Storage → New Bucket
-- 2. Nome: media_instituto_amar
-- 3. Public: YES (para GHL acessar via URL)
-- 4. File size limit: 50 MB
-- 5. Allowed MIME types: audio/*, video/*, image/*

-- Estrutura de pastas:
-- /media_instituto_amar
--   /audios
--     /ativacao
--     /conexao
--     /objecoes
--   /videos
--     /nutricao
--     /depoimentos
--   /images
--     /antes-depois
--     /infograficos

-- =========================================
-- FIM DO SETUP
-- =========================================

-- Verificar instalação:
SELECT
  'Total de mídias cadastradas' as check_item,
  COUNT(*)::text as value
FROM media_library
WHERE location_id = 'sNwLyynZWP6jEtBy1ubf'

UNION ALL

SELECT
  'Mídias ativas' as check_item,
  COUNT(*)::text as value
FROM media_library
WHERE location_id = 'sNwLyynZWP6jEtBy1ubf' AND is_active = true

UNION ALL

SELECT
  'Estrutura placeholders criada' as check_item,
  CASE
    WHEN COUNT(*) = 15 THEN '✅ OK'
    ELSE '❌ ERRO'
  END as value
FROM media_library
WHERE location_id = 'sNwLyynZWP6jEtBy1ubf';

-- Expected output:
-- ✅ 15 mídias cadastradas
-- ✅ 0 mídias ativas (aguardando upload)
-- ✅ Estrutura placeholders criada: OK
