-- ============================================
-- SELF-IMPROVING AI SYSTEM - MIGRATION 006
-- ============================================
-- Description: Adiciona UNIQUE constraint no contact_id
--              para permitir ON CONFLICT no fluxo principal
-- Author: AI Factory V4 - MOTTIVME
-- Date: 2024-12-30
-- ============================================
--
-- IMPORTANTE: Execute esta migration APENAS se a tabela
-- agent_conversations ja existe e nao tem a constraint
-- ============================================

-- Verificar se o indice unico ja existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_agent_conversations_contact_unique'
  ) THEN
    -- Criar indice unico no contact_id
    CREATE UNIQUE INDEX idx_agent_conversations_contact_unique
      ON agent_conversations(contact_id);

    RAISE NOTICE 'Indice unico criado com sucesso: idx_agent_conversations_contact_unique';
  ELSE
    RAISE NOTICE 'Indice unico ja existe: idx_agent_conversations_contact_unique';
  END IF;
END $$;

-- Verificacao
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'agent_conversations'
  AND indexname LIKE '%contact%';
