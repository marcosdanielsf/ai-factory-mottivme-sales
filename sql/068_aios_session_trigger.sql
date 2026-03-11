-- migration: 068_aios_session_trigger.sql
-- autor: supabase-dba agent
-- data: 2026-03-10
-- descricao: Fase 2 AIOS-Claude Code Integration
--   - CREATE FUNCTION fn_session_to_aios() — converte session_summary em aios_agent_executions + aios_cost_events
--   - CREATE TRIGGER trg_session_to_aios AFTER INSERT ON session_events

BEGIN;

-- ============================================================
-- 1. Funcao que converte session_summary → aios_*
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_session_to_aios()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id     UUID;
    v_execution_id UUID;
    v_model        TEXT;
    v_cost_per_tool NUMERIC(10,6);
    v_estimated_cost NUMERIC(10,6);
    v_tool_count   INT;
    v_duration_ms  INT;
BEGIN
    -- Somente processa session_summary
    IF NEW.event_type != 'session_summary' THEN
        RETURN NEW;
    END IF;

    -- 1. Lookup agent_key → aios_agents.id
    IF NEW.aios_agent_key IS NOT NULL THEN
        SELECT am.aios_agent_id INTO v_agent_id
        FROM public.aios_agent_map am
        WHERE am.agent_key = NEW.aios_agent_key;
    END IF;

    -- Fallback: tentar pelo agent_type da session_events
    IF v_agent_id IS NULL AND NEW.agent_type IS NOT NULL THEN
        SELECT am.aios_agent_id INTO v_agent_id
        FROM public.aios_agent_map am
        WHERE am.agent_key = NEW.agent_type;
    END IF;

    -- Se nenhum agente mapeado, sair silenciosamente
    IF v_agent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Extrair dados
    v_model := COALESCE(NEW.model_used, 'unknown');
    v_tool_count := COALESCE(NEW.tool_count, 0);
    v_duration_ms := COALESCE(NEW.duration_minutes, 0) * 60 * 1000;

    -- 3. Calcular custo estimado por modelo
    v_cost_per_tool := CASE
        WHEN v_model ILIKE '%opus%'  THEN 0.015
        WHEN v_model ILIKE '%haiku%' THEN 0.0003
        ELSE 0.003  -- sonnet / unknown
    END;
    v_estimated_cost := v_tool_count * v_cost_per_tool;

    -- 4. INSERT aios_agent_executions
    INSERT INTO public.aios_agent_executions (
        agent_id, started_at, completed_at, status, model,
        cost, duration_ms, error_message
    ) VALUES (
        v_agent_id,
        NEW.created_at - (COALESCE(NEW.duration_minutes, 0) || ' minutes')::interval,
        NEW.created_at,
        CASE WHEN COALESCE(NEW.error_count, 0) > 0 THEN 'failed' ELSE 'completed' END,
        v_model,
        v_estimated_cost,
        v_duration_ms,
        CASE WHEN COALESCE(NEW.error_count, 0) > 0
             THEN NEW.error_count || ' errors in session'
             ELSE NULL
        END
    )
    RETURNING id INTO v_execution_id;

    -- 5. INSERT aios_cost_events
    IF v_estimated_cost > 0 THEN
        INSERT INTO public.aios_cost_events (
            agent_id, execution_id, model,
            input_tokens, output_tokens, cost, event_type
        ) VALUES (
            v_agent_id,
            v_execution_id,
            v_model,
            v_tool_count * 1000,   -- estimativa: 1K input tokens por tool
            v_tool_count * 500,    -- estimativa: 500 output tokens por tool
            v_estimated_cost,
            'llm_call'
        );
    END IF;

    -- 6. UPDATE aios_agents contadores
    UPDATE public.aios_agents SET
        total_executions = total_executions + 1,
        total_cost = total_cost + v_estimated_cost,
        last_active_at = NEW.created_at,
        status = 'idle'
    WHERE id = v_agent_id;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_session_to_aios() IS 'Trigger function: converte session_summary em aios_agent_executions + aios_cost_events. Custos sao estimados.';

-- ============================================================
-- 2. Trigger AFTER INSERT em session_events
-- ============================================================
DROP TRIGGER IF EXISTS trg_session_to_aios ON public.session_events;

CREATE TRIGGER trg_session_to_aios
    AFTER INSERT ON public.session_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'session_summary')
    EXECUTE FUNCTION public.fn_session_to_aios();

COMMENT ON TRIGGER trg_session_to_aios ON public.session_events IS 'Dispara apos INSERT de session_summary para popular aios_agent_executions e aios_cost_events';

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_session_to_aios ON public.session_events;
-- DROP FUNCTION IF EXISTS public.fn_session_to_aios();
-- COMMIT;
