-- =============================================
-- MIGRAÇÃO: Restaurar memória de agent_conversation_messages
-- =============================================
-- Problema: ~99.887 registros foram deletados de n8n_historico_mensagens
--           quando a coluna location_id foi adicionada
-- Solução: Migrar dados de agent_conversation_messages (5.119 registros)
-- =============================================

-- 1. Verificar contagens ANTES
SELECT 'ANTES DA MIGRAÇÃO' as status;
SELECT 'n8n_historico_mensagens' as tabela, COUNT(*) as registros FROM n8n_historico_mensagens;
SELECT 'agent_conversation_messages' as tabela, COUNT(*) as registros FROM agent_conversation_messages;

-- 2. Inserir mensagens que NÃO existem ainda
-- Usando session_id = contact_id da agent_conversations
INSERT INTO n8n_historico_mensagens (session_id, message, created_at, location_id)
SELECT
    ac.contact_id as session_id,
    jsonb_build_object(
        'type', CASE WHEN acm.is_from_lead THEN 'human' ELSE 'ai' END,
        'content', acm.message_text,
        'tool_calls', '[]'::jsonb,
        'additional_kwargs', '{}'::jsonb,
        'response_metadata', '{}'::jsonb,
        'invalid_tool_calls', '[]'::jsonb
    ) as message,
    acm.created_at,
    COALESCE(
        -- Tentar pegar location_id de um registro existente com mesmo session_id
        (SELECT location_id FROM n8n_historico_mensagens WHERE session_id = ac.contact_id LIMIT 1),
        -- Ou usar location_id do schedule_tracking
        (SELECT location_id FROM n8n_schedule_tracking WHERE unique_id = ac.contact_id LIMIT 1),
        -- Fallback para location padrão (Instituto Amare)
        'sNwLyynZWP6jEtBy1ubf'
    ) as location_id
FROM agent_conversation_messages acm
JOIN agent_conversations ac ON ac.id = acm.conversation_id
WHERE NOT EXISTS (
    -- Não inserir duplicados (mesmo session_id + created_at aproximado)
    SELECT 1 FROM n8n_historico_mensagens nhm
    WHERE nhm.session_id = ac.contact_id
    AND nhm.created_at BETWEEN acm.created_at - INTERVAL '5 seconds' AND acm.created_at + INTERVAL '5 seconds'
)
ORDER BY acm.created_at;

-- 3. Verificar contagens DEPOIS
SELECT 'DEPOIS DA MIGRAÇÃO' as status;
SELECT 'n8n_historico_mensagens' as tabela, COUNT(*) as registros FROM n8n_historico_mensagens;

-- 4. Verificar amostra dos dados migrados
SELECT 'AMOSTRA DOS DADOS MIGRADOS' as status;
SELECT
    session_id,
    message->>'type' as tipo,
    LEFT(message->>'content', 50) as conteudo,
    created_at,
    location_id
FROM n8n_historico_mensagens
WHERE id > 99887  -- IDs novos (depois da deleção)
ORDER BY created_at DESC
LIMIT 10;
