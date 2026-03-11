-- =====================================================
-- Content Journey Log — Seed Data (20 entradas)
-- Simula lifecycle de 3 pecas de conteudo:
--   Peca 1: criacao → revisao → rejeicao → revisao → aprovacao → publicacao
--   Peca 2: criacao → revisao → aprovacao → publicacao
--   Peca 3: criacao → revisao → rejeicao → arquivamento
-- Requer tabela: content_journey_log
-- =====================================================

-- IDs fixos das 3 pecas de conteudo (devem existir em content_pieces ou serem UUIDs validos)
-- Se content_pieces nao tiver esses registros, o seed ainda funciona pois
-- content_piece_id eh referencia logica (sem FK forcada nesse schema)

-- Peca 1: Post Instagram — "Como a IA triplicou as vendas de uma clinica"
-- Ciclo completo: criacao → revisao → rejeicao → revisao → aprovacao → publicacao (9 entradas)

INSERT INTO content_journey_log (
  id, content_piece_id, action, actor_id, actor_name, notes, metadata, created_at
) VALUES

-- === PECA 1: Post IG — lifecycle completo (9 entradas) ===
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'created',
  NULL,
  'Dex (Agent)',
  'Copy gerada automaticamente pelo agente Dex com base no brief da campanha SDR',
  '{"platform": "instagram", "type": "post", "word_count": 245, "ai_model": "gpt-4o"}',
  NOW() - INTERVAL '6 days' + INTERVAL '9 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'submitted',
  NULL,
  'Dex (Agent)',
  'Enviado para revisao editorial humana apos passagem pelos Quality Gates',
  '{"quality_gates_passed": 4, "quality_gates_failed": 1, "blocker": "hook_length"}',
  NOW() - INTERVAL '6 days' + INTERVAL '9 hours 12 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'reviewed',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Revisao feita. Hook muito longo e CTA fraco. Precisa de ajuste antes da aprovacao.',
  '{"review_duration_min": 8, "issues_found": ["hook > 15 palavras", "cta generico demais"]}',
  NOW() - INTERVAL '6 days' + INTERVAL '10 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'rejected',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Rejeitado: hook com 22 palavras (max 15) e CTA sem urgencia. Reescrever hook e CTA.',
  '{"rejection_reason": "hook_too_long_and_weak_cta", "iteration": 1}',
  NOW() - INTERVAL '6 days' + INTERVAL '10 hours 5 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'reviewed',
  NULL,
  'Dex (Agent)',
  'Revisao automatica pos-rejeicao: hook reescrito para 11 palavras, CTA com urgencia temporal',
  '{"hook_words": 11, "cta_updated": true, "ai_revision_model": "gpt-4o", "iteration": 2}',
  NOW() - INTERVAL '5 days' + INTERVAL '9 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'submitted',
  NULL,
  'Dex (Agent)',
  'Segunda versao enviada para revisao. Todos os Quality Gates passados.',
  '{"quality_gates_passed": 5, "quality_gates_failed": 0, "iteration": 2}',
  NOW() - INTERVAL '5 days' + INTERVAL '9 hours 8 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'reviewed',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Versao 2 muito melhor. Hook direto ao ponto, CTA com prazo claro. Aprovando.',
  '{"review_duration_min": 5, "issues_found": [], "iteration": 2}',
  NOW() - INTERVAL '5 days' + INTERVAL '11 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'approved',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Aprovado para publicacao. Agendar para segunda-feira as 19h (pico de engajamento).',
  '{"approval_score": 9, "scheduled_for": "2026-02-17T22:00:00Z", "platform": "instagram"}',
  NOW() - INTERVAL '5 days' + INTERVAL '11 hours 3 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000001',
  'published',
  NULL,
  'Sistema (Worker)',
  'Publicado automaticamente via GHL Social Planner no horario agendado',
  '{"platform": "instagram", "post_id": "ig_mock_17820934", "reach_estimate": 1240}',
  NOW() - INTERVAL '4 days' + INTERVAL '22 hours'
),

-- === PECA 2: Story IG — lifecycle rapido (5 entradas) ===
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000002',
  'created',
  NULL,
  'Pixel (Agent)',
  'Story criada automaticamente baseada no post aprovado. Adaptacao para formato vertical.',
  '{"platform": "instagram_stories", "type": "story", "based_on": "f1000000-0000-0000-0000-000000000001"}',
  NOW() - INTERVAL '4 days' + INTERVAL '8 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000002',
  'submitted',
  NULL,
  'Pixel (Agent)',
  'Story enviada para aprovacao rapida. Quality Gates: 4/4 passados.',
  '{"quality_gates_passed": 4, "quality_gates_failed": 0}',
  NOW() - INTERVAL '4 days' + INTERVAL '8 hours 3 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000002',
  'reviewed',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Story bem estruturada. Swipe-up link correto. Aprovando diretamente.',
  '{"review_duration_min": 3}',
  NOW() - INTERVAL '4 days' + INTERVAL '9 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000002',
  'approved',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Aprovado. Publicar junto com o post principal.',
  '{"approval_score": 8, "publish_with": "f1000000-0000-0000-0000-000000000001"}',
  NOW() - INTERVAL '4 days' + INTERVAL '9 hours 5 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000002',
  'published',
  NULL,
  'Sistema (Worker)',
  'Story publicada com sucesso via API Instagram Business',
  '{"platform": "instagram_stories", "story_id": "ig_story_mock_98340", "expires_at": "2026-02-14T22:00:00Z"}',
  NOW() - INTERVAL '4 days' + INTERVAL '22 hours 5 minutes'
),

-- === PECA 3: Email — lifecycle com arquivamento (6 entradas) ===
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000003',
  'created',
  NULL,
  'Scribe (Agent)',
  'Email de nurturing semana 3 gerado automaticamente. Foco: caso de sucesso + prova social.',
  '{"type": "email", "sequence": "nurturing", "week": 3, "ai_model": "claude-3-5-sonnet"}',
  NOW() - INTERVAL '3 days' + INTERVAL '8 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000003',
  'submitted',
  NULL,
  'Scribe (Agent)',
  'Email enviado para revisao. Quality Gate: tamanho acima do limite (2.340 chars, max 2.000).',
  '{"quality_gates_passed": 3, "quality_gates_failed": 1, "blocker": "content_size"}',
  NOW() - INTERVAL '3 days' + INTERVAL '8 hours 6 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000003',
  'reviewed',
  'b0000000-0000-0000-0000-000000000009',
  'Andre (Revisor)',
  'Email muito longo. Leitores moveis nao chegam ao CTA. Precisa cortar pelo menos 400 chars.',
  '{"review_duration_min": 12, "char_count": 2340, "suggested_cut": 400}',
  NOW() - INTERVAL '2 days' + INTERVAL '10 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000003',
  'rejected',
  'b0000000-0000-0000-0000-000000000009',
  'Andre (Revisor)',
  'Rejeitado por excesso de conteudo. Campanha foi reprioritizada — email pode ser arquivado.',
  '{"rejection_reason": "content_too_long_plus_repriority", "archival_suggestion": true}',
  NOW() - INTERVAL '2 days' + INTERVAL '10 hours 8 minutes'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000003',
  'reviewed',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Avaliou opcoes: reescrever vs arquivar. Decisao: arquivar — tema sera coberto em video.',
  '{"decision": "archive", "reason": "covered_by_video_content"}',
  NOW() - INTERVAL '1 day' + INTERVAL '11 hours'
),
(
  gen_random_uuid(),
  'f1000000-0000-0000-0000-000000000003',
  'archived',
  'b0000000-0000-0000-0000-000000000008',
  'Marcos Daniels',
  'Arquivado. Conteudo pode ser reaproveitado como base para roteiro de video.',
  '{"archived_reason": "repurpose_as_video_script", "reuse_potential": "high"}',
  NOW() - INTERVAL '1 day' + INTERVAL '11 hours 5 minutes'
);
