-- ============================================
-- SELF-IMPROVING AI SYSTEM - MIGRATION 004
-- ============================================
-- Description: Insere conversas de teste para testar o Reflection Loop
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-27
-- ============================================

-- IMPORTANTE: Execute esta migration apenas para TESTES
-- Estas conversas sao ficticias para validar o workflow

-- ============================================
-- PASSO 1: Verificar agentes ativos disponiveis
-- ============================================

-- Execute primeiro para ver os agentes disponiveis:
-- SELECT id, agent_name, client_id FROM agent_versions WHERE is_active = true LIMIT 5;

-- ============================================
-- PASSO 2: Inserir conversas de teste
-- ============================================

-- Inserir conversas de teste para o PRIMEIRO agente ativo encontrado
WITH agente AS (
  SELECT id as agent_version_id
  FROM agent_versions
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1
)
INSERT INTO agent_conversations (
  id,
  agent_version_id,
  contact_id,
  conversation_id,
  channel,
  status,
  outcome,
  mensagens_total,
  started_at,
  ended_at,
  qa_analyzed,
  qa_score
)
SELECT
  gen_random_uuid(),
  agente.agent_version_id,
  'test_contact_' || n,
  'test_conv_' || n,
  CASE (n % 2) WHEN 0 THEN 'whatsapp' ELSE 'instagram' END,
  'completed',
  CASE
    WHEN n <= 3 THEN 'scheduled'
    WHEN n <= 6 THEN 'lost'
    WHEN n <= 8 THEN 'warmed'
    ELSE 'in_progress'
  END,
  (5 + (n * 2)),
  NOW() - INTERVAL '1 day' * n,
  NOW() - INTERVAL '1 day' * n + INTERVAL '30 minutes',
  true,
  CASE
    WHEN n <= 3 THEN 8.5 + (random() * 1.5)
    WHEN n <= 6 THEN 4.0 + (random() * 2.0)
    WHEN n <= 8 THEN 6.0 + (random() * 2.0)
    ELSE 7.0 + (random() * 2.0)
  END
FROM agente, generate_series(1, 10) as n;

-- ============================================
-- PASSO 3: Inserir mensagens para as conversas
-- ============================================

-- Mensagens para conversas AGENDADAS (outcome = 'scheduled')
INSERT INTO agent_conversation_messages (
  id,
  conversation_id,
  message_text,
  is_from_lead,
  created_at
)
SELECT
  gen_random_uuid(),
  ac.id,
  CASE msg_num
    WHEN 1 THEN 'Ola, vi o anuncio de voces e tenho interesse'
    WHEN 2 THEN 'Oi! Que otimo ter voce aqui! Posso te ajudar com mais informacoes sobre nossos servicos. Qual sua principal necessidade hoje?'
    WHEN 3 THEN 'Quero saber mais sobre os precos e como funciona'
    WHEN 4 THEN 'Claro! Nossos planos comecam em R$ 997/mes e incluem atendimento completo. O ideal seria uma conversa rapida para eu entender melhor seu cenario. Temos horario disponivel amanha as 10h ou 15h, qual prefere?'
    WHEN 5 THEN 'Pode ser amanha as 10h'
    WHEN 6 THEN 'Perfeito! Agendado para amanha as 10h. Vou te enviar o link da reuniao por aqui. Ate la!'
    WHEN 7 THEN 'Obrigado, ate amanha!'
  END,
  CASE WHEN msg_num % 2 = 1 THEN true ELSE false END,
  ac.started_at + INTERVAL '2 minutes' * msg_num
FROM agent_conversations ac
CROSS JOIN generate_series(1, 7) as msg_num
WHERE ac.outcome = 'scheduled'
  AND ac.contact_id LIKE 'test_contact_%';

-- Mensagens para conversas PERDIDAS (outcome = 'lost')
INSERT INTO agent_conversation_messages (
  id,
  conversation_id,
  message_text,
  is_from_lead,
  created_at
)
SELECT
  gen_random_uuid(),
  ac.id,
  CASE msg_num
    WHEN 1 THEN 'Oi, quanto custa o servico?'
    WHEN 2 THEN 'Ola! Nossos planos comecam em R$ 997/mes. Posso te explicar os beneficios?'
    WHEN 3 THEN 'Muito caro pra mim'
    WHEN 4 THEN 'Entendo! Temos opcoes mais acessiveis tambem. Qual seria seu orcamento?'
    WHEN 5 THEN 'Nao tenho orcamento no momento'
    WHEN 6 THEN 'Sem problemas! Quando estiver pronto, estaremos aqui. Quer que eu te envie mais informacoes por email?'
  END,
  CASE WHEN msg_num % 2 = 1 THEN true ELSE false END,
  ac.started_at + INTERVAL '3 minutes' * msg_num
FROM agent_conversations ac
CROSS JOIN generate_series(1, 6) as msg_num
WHERE ac.outcome = 'lost'
  AND ac.contact_id LIKE 'test_contact_%';

-- Mensagens para conversas AQUECIDAS (outcome = 'warmed')
INSERT INTO agent_conversation_messages (
  id,
  conversation_id,
  message_text,
  is_from_lead,
  created_at
)
SELECT
  gen_random_uuid(),
  ac.id,
  CASE msg_num
    WHEN 1 THEN 'Boa tarde, gostaria de informacoes'
    WHEN 2 THEN 'Boa tarde! Claro, fico feliz em ajudar. Sobre qual servico voce gostaria de saber mais?'
    WHEN 3 THEN 'Vi que voces trabalham com automacao de vendas'
    WHEN 4 THEN 'Isso mesmo! Ajudamos empresas a aumentar suas vendas com IA. Voce ja usa alguma ferramenta de automacao?'
    WHEN 5 THEN 'Ainda nao, estou pesquisando'
    WHEN 6 THEN 'Otimo! Posso te mostrar como funciona na pratica. Prefere uma demonstracao ao vivo ou posso enviar um video?'
    WHEN 7 THEN 'Me manda o video primeiro'
    WHEN 8 THEN 'Perfeito! Vou enviar agora. Depois me conta o que achou!'
  END,
  CASE WHEN msg_num % 2 = 1 THEN true ELSE false END,
  ac.started_at + INTERVAL '2 minutes' * msg_num
FROM agent_conversations ac
CROSS JOIN generate_series(1, 8) as msg_num
WHERE ac.outcome = 'warmed'
  AND ac.contact_id LIKE 'test_contact_%';

-- Mensagens para conversas EM ANDAMENTO (outcome = 'in_progress')
INSERT INTO agent_conversation_messages (
  id,
  conversation_id,
  message_text,
  is_from_lead,
  created_at
)
SELECT
  gen_random_uuid(),
  ac.id,
  CASE msg_num
    WHEN 1 THEN 'Ola!'
    WHEN 2 THEN 'Oi! Tudo bem? Como posso te ajudar hoje?'
    WHEN 3 THEN 'Quero saber sobre a empresa'
    WHEN 4 THEN 'Claro! Somos especialistas em solucoes de IA para vendas. O que voce gostaria de saber especificamente?'
  END,
  CASE WHEN msg_num % 2 = 1 THEN true ELSE false END,
  ac.started_at + INTERVAL '2 minutes' * msg_num
FROM agent_conversations ac
CROSS JOIN generate_series(1, 4) as msg_num
WHERE ac.outcome = 'in_progress'
  AND ac.contact_id LIKE 'test_contact_%';

-- ============================================
-- PASSO 4: Atualizar contagem de mensagens
-- ============================================

UPDATE agent_conversations ac
SET mensagens_total = (
  SELECT COUNT(*)
  FROM agent_conversation_messages acm
  WHERE acm.conversation_id = ac.id
)
WHERE ac.contact_id LIKE 'test_contact_%';

-- ============================================
-- VERIFICACAO
-- ============================================

-- Ver conversas criadas
SELECT
  ac.id,
  av.agent_name,
  ac.outcome,
  ac.mensagens_total,
  ac.qa_score,
  ac.started_at
FROM agent_conversations ac
JOIN agent_versions av ON av.id = ac.agent_version_id
WHERE ac.contact_id LIKE 'test_contact_%'
ORDER BY ac.started_at DESC;

-- Ver mensagens criadas
SELECT
  ac.outcome,
  COUNT(acm.id) as total_mensagens
FROM agent_conversations ac
JOIN agent_conversation_messages acm ON acm.conversation_id = ac.id
WHERE ac.contact_id LIKE 'test_contact_%'
GROUP BY ac.outcome;

-- Resumo
SELECT
  'Conversas de teste criadas' as descricao,
  COUNT(*) as quantidade
FROM agent_conversations
WHERE contact_id LIKE 'test_contact_%'
UNION ALL
SELECT
  'Mensagens de teste criadas',
  COUNT(*)
FROM agent_conversation_messages acm
JOIN agent_conversations ac ON ac.id = acm.conversation_id
WHERE ac.contact_id LIKE 'test_contact_%';
