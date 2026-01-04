-- =====================================================
-- VERIFICAR SE O REGISTRO EXISTE
-- =====================================================

-- 1. Buscar pelo ID do Google Drive que acabou de chegar
SELECT *
FROM call_recordings
WHERE gdrive_file_id = '1d3S1cDAFTqvhZms0o_ye8x6QIaIH2L2SOKTvrpXZOeA';

-- 2. Ver TODOS os registros (últimos 10)
SELECT id, gdrive_file_id, status, location_id, created_at
FROM call_recordings
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver quantos registros têm status = 'movido'
SELECT COUNT(*) as total_movidos
FROM call_recordings
WHERE status = 'movido';

-- =====================================================
-- SE NÃO EXISTIR, CRIAR REGISTRO DE TESTE
-- =====================================================

-- ANTES DE RODAR ISSO, ME CONFIRME:
-- Você tem uma tabela 'locations' com um location_id válido?

INSERT INTO call_recordings (
  gdrive_file_id,
  location_id,
  contact_id,
  nome_lead,
  telefone,
  gdrive_url,
  status,
  created_at
) VALUES (
  '1d3S1cDAFTqvhZms0o_ye8x6QIaIH2L2SOKTvrpXZOeA',
  'COLOQUE_UM_LOCATION_ID_VALIDO_AQUI',  -- Ex: 'cd1uyzpJox6XPt4Vct8Y'
  'contato_teste_001',
  'Dra. Eline Lôbo',
  '(71) 98807-9472',
  'https://docs.google.com/document/d/1d3S1cDAFTqvhZms0o_ye8x6QIaIH2L2SOKTvrpXZOeA/edit',
  'movido',
  NOW()
)
ON CONFLICT (gdrive_file_id) DO UPDATE
SET status = 'movido',
    updated_at = NOW()
RETURNING *;
