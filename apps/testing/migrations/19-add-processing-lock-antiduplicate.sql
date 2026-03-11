-- ============================================================
-- MIGRATION 19: Add Processing Lock - Anti-Duplicação
-- Problema: Workflow disparando 2x para mesma mensagem
-- Solução: Lock otimista com timestamp + debounce window
-- ============================================================

-- 1. Adicionar colunas de controle de lock
ALTER TABLE n8n_schedule_tracking
ADD COLUMN IF NOT EXISTS processing_lock_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS processing_execution_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_inbound_message_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS debounce_until TIMESTAMPTZ DEFAULT NULL;

-- 2. Criar índice para queries de lock
CREATE INDEX IF NOT EXISTS idx_schedule_tracking_lock
ON n8n_schedule_tracking(unique_id, processing_lock_at)
WHERE processing_lock_at IS NOT NULL;

-- 3. Função para tentar adquirir lock (retorna true se conseguiu)
CREATE OR REPLACE FUNCTION try_acquire_processing_lock(
  p_unique_id TEXT,
  p_execution_id TEXT,
  p_message_id TEXT DEFAULT NULL,
  p_debounce_seconds INT DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_lock TIMESTAMPTZ;
  v_debounce_until TIMESTAMPTZ;
  v_last_message_id TEXT;
  v_lock_timeout INTERVAL := INTERVAL '2 minutes'; -- Lock expira em 2 min
BEGIN
  -- Buscar estado atual
  SELECT
    processing_lock_at,
    debounce_until,
    last_inbound_message_id
  INTO v_current_lock, v_debounce_until, v_last_message_id
  FROM n8n_schedule_tracking
  WHERE unique_id = p_unique_id
  FOR UPDATE SKIP LOCKED; -- Evita deadlock

  -- Se não encontrou registro, criar e adquirir lock
  IF NOT FOUND THEN
    INSERT INTO n8n_schedule_tracking (unique_id, processing_lock_at, processing_execution_id, last_inbound_message_id, debounce_until, ativo, created_at)
    VALUES (p_unique_id, NOW(), p_execution_id, p_message_id, NOW() + (p_debounce_seconds || ' seconds')::INTERVAL, true, NOW())
    ON CONFLICT (unique_id) DO NOTHING;
    RETURN TRUE;
  END IF;

  -- Verificar debounce (mesma mensagem em < X segundos)
  IF v_debounce_until IS NOT NULL AND NOW() < v_debounce_until THEN
    RAISE NOTICE 'Debounce ativo até %, rejeitando', v_debounce_until;
    RETURN FALSE;
  END IF;

  -- Verificar se é mesma mensagem (dedup por message_id)
  IF p_message_id IS NOT NULL AND v_last_message_id = p_message_id THEN
    RAISE NOTICE 'Mensagem % já processada, rejeitando', p_message_id;
    RETURN FALSE;
  END IF;

  -- Verificar se lock expirou
  IF v_current_lock IS NOT NULL AND NOW() < (v_current_lock + v_lock_timeout) THEN
    RAISE NOTICE 'Lock ativo até %, rejeitando', v_current_lock + v_lock_timeout;
    RETURN FALSE;
  END IF;

  -- Adquirir lock
  UPDATE n8n_schedule_tracking
  SET
    processing_lock_at = NOW(),
    processing_execution_id = p_execution_id,
    last_inbound_message_id = COALESCE(p_message_id, last_inbound_message_id),
    debounce_until = NOW() + (p_debounce_seconds || ' seconds')::INTERVAL
  WHERE unique_id = p_unique_id;

  RETURN TRUE;
END;
$$;

-- 4. Função para liberar lock
CREATE OR REPLACE FUNCTION release_processing_lock(
  p_unique_id TEXT,
  p_execution_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE n8n_schedule_tracking
  SET
    processing_lock_at = NULL,
    processing_execution_id = NULL
  WHERE unique_id = p_unique_id
    AND processing_execution_id = p_execution_id; -- Só libera se for dono

  RETURN FOUND;
END;
$$;

-- 5. Função para limpar locks órfãos (cron job)
CREATE OR REPLACE FUNCTION cleanup_orphan_locks()
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_cleaned INT;
BEGIN
  UPDATE n8n_schedule_tracking
  SET
    processing_lock_at = NULL,
    processing_execution_id = NULL
  WHERE processing_lock_at IS NOT NULL
    AND processing_lock_at < NOW() - INTERVAL '5 minutes';

  GET DIAGNOSTICS v_cleaned = ROW_COUNT;
  RETURN v_cleaned;
END;
$$;

-- 6. Adicionar comentários
COMMENT ON COLUMN n8n_schedule_tracking.processing_lock_at IS 'Timestamp do lock atual. NULL = disponível';
COMMENT ON COLUMN n8n_schedule_tracking.processing_execution_id IS 'ID da execution que tem o lock';
COMMENT ON COLUMN n8n_schedule_tracking.last_inbound_message_id IS 'ID da última mensagem processada (dedup)';
COMMENT ON COLUMN n8n_schedule_tracking.debounce_until IS 'Não processar novas mensagens até este timestamp';

COMMENT ON FUNCTION try_acquire_processing_lock IS 'Tenta adquirir lock para processar conversa. Retorna TRUE se conseguiu.';
COMMENT ON FUNCTION release_processing_lock IS 'Libera lock após processamento. Só libera se for o dono.';
COMMENT ON FUNCTION cleanup_orphan_locks IS 'Limpa locks órfãos (executions que crasharam). Rodar via cron.';

-- ============================================================
-- COMO USAR NO N8N:
--
-- 1. NO INÍCIO DO WORKFLOW (após receber mensagem):
--    SELECT try_acquire_processing_lock(
--      '{{ $json.contact.id }}',        -- unique_id
--      '{{ $execution.id }}',           -- execution_id
--      '{{ $json.message.id || null }}', -- message_id (opcional)
--      5                                 -- debounce_seconds
--    ) as lock_acquired;
--
--    Se lock_acquired = false, PARAR EXECUÇÃO (duplicata)
--
-- 2. NO FINAL DO WORKFLOW (após enviar resposta):
--    SELECT release_processing_lock(
--      '{{ $json.contact.id }}',
--      '{{ $execution.id }}'
--    );
-- ============================================================
