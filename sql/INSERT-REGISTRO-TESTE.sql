-- =====================================================
-- INSERIR REGISTRO DE TESTE PARA O WORKFLOW FUNCIONAR
-- =====================================================

INSERT INTO call_recordings (
  id,
  gdrive_file_id,
  gdrive_url,
  titulo,
  tipo,
  location_id,
  contact_id,
  contact_name,
  contact_phone,
  nome_lead,
  telefone,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  '1d3S1cDAFTqvhZms0o_ye8x6QIaIH2L2SOKTvrpXZOeA',
  'https://docs.google.com/document/d/1d3S1cDAFTqvhZms0o_ye8x6QIaIH2L2SOKTvrpXZOeA/edit',
  '16 - Kickoff - Dra. Eline Lôbo - (71) 98807-9472 - cd1uyzpJox6XPt4Vct8Y - 2025-12-19_11-43 - 2025-12-19_11-52',
  'kickoff',
  'cd1uyzpJox6XPt4Vct8Y',  -- Location ID extraído do nome do arquivo
  'contato_teste_eline',
  'Dra. Eline Lôbo',
  '(71) 98807-9472',
  'Dra. Eline Lôbo',
  '71988079472',
  'movido',  -- STATUS IMPORTANTE: 'movido' para a query funcionar
  NOW()
)
ON CONFLICT (gdrive_file_id) DO UPDATE
SET
  status = 'movido',
  location_id = EXCLUDED.location_id,
  contact_name = EXCLUDED.contact_name,
  contact_phone = EXCLUDED.contact_phone,
  nome_lead = EXCLUDED.nome_lead,
  telefone = EXCLUDED.telefone
RETURNING *;

-- =====================================================
-- VERIFICAR SE INSERIU
-- =====================================================

SELECT *
FROM call_recordings
WHERE gdrive_file_id = '1d3S1cDAFTqvhZms0o_ye8x6QIaIH2L2SOKTvrpXZOeA';
