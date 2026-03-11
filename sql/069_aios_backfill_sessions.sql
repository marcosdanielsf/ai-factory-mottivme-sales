-- migration: 069_aios_backfill_sessions.sql
-- autor: supabase-dba agent
-- data: 2026-03-10
-- descricao: Fase 4 AIOS-Claude Code Integration
--   - CREATE FUNCTION fn_backfill_aios_from_sessions()
--   - Processa session_events historicos agrupados por session_id
--   - Infere agente pelo agent_type mais frequente na sessao
--   - Popula aios_agent_executions + aios_cost_events + atualiza contadores

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_backfill_aios_from_sessions()
RETURNS TABLE(sessions_processed INT, executions_created INT, agents_updated INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sessions_processed INT := 0;
    v_executions_created INT := 0;
    v_agents_updated INT := 0;
    rec RECORD;
    v_agent_id UUID;
    v_execution_id UUID;
    v_cost_per_tool NUMERIC(10,6);
    v_estimated_cost NUMERIC(10,6);
BEGIN
    -- Process each session that has agent_type events but no existing aios_agent_execution
    FOR rec IN
        WITH session_stats AS (
            SELECT
                se.session_id,
                -- Most frequent agent_type in this session
                (SELECT agent_type FROM session_events se2
                 WHERE se2.session_id = se.session_id
                   AND se2.agent_type IS NOT NULL
                 GROUP BY agent_type ORDER BY count(*) DESC LIMIT 1
                ) AS dominant_agent,
                -- Model (most frequent non-null)
                (SELECT model_used FROM session_events se3
                 WHERE se3.session_id = se.session_id
                   AND se3.model_used IS NOT NULL AND se3.model_used != 'unknown'
                 GROUP BY model_used ORDER BY count(*) DESC LIMIT 1
                ) AS model,
                count(*) FILTER (WHERE se.event_type = 'tool_use') AS tool_count,
                count(*) FILTER (WHERE se.error_occurred = true) AS error_count,
                count(*) FILTER (WHERE se.tool_name IN ('Edit', 'Write')) AS files_modified,
                min(se.created_at) AS first_event,
                max(se.created_at) AS last_event
            FROM session_events se
            GROUP BY se.session_id
        )
        SELECT
            ss.*,
            am.aios_agent_id,
            EXTRACT(EPOCH FROM (ss.last_event - ss.first_event))::int AS duration_sec
        FROM session_stats ss
        JOIN aios_agent_map am ON am.agent_key = ss.dominant_agent
        -- Skip sessions already backfilled (check by session time range in executions)
        WHERE NOT EXISTS (
            SELECT 1 FROM aios_agent_executions ae
            WHERE ae.agent_id = am.aios_agent_id
              AND ae.started_at BETWEEN ss.first_event - interval '1 minute' AND ss.first_event + interval '1 minute'
        )
        ORDER BY ss.first_event
    LOOP
        -- Calculate estimated cost
        v_cost_per_tool := CASE
            WHEN rec.model ILIKE '%opus%'  THEN 0.015
            WHEN rec.model ILIKE '%haiku%' THEN 0.0003
            ELSE 0.003
        END;
        v_estimated_cost := COALESCE(rec.tool_count, 0) * v_cost_per_tool;

        -- INSERT execution
        INSERT INTO aios_agent_executions (
            agent_id, started_at, completed_at, status, model,
            cost, duration_ms, error_message
        ) VALUES (
            rec.aios_agent_id,
            rec.first_event,
            rec.last_event,
            CASE WHEN COALESCE(rec.error_count, 0) > 3 THEN 'failed' ELSE 'completed' END,
            COALESCE(rec.model, 'unknown'),
            v_estimated_cost,
            rec.duration_sec * 1000,
            CASE WHEN COALESCE(rec.error_count, 0) > 0
                 THEN rec.error_count || ' errors (backfilled)'
                 ELSE NULL
            END
        )
        RETURNING id INTO v_execution_id;

        -- INSERT cost event
        IF v_estimated_cost > 0 THEN
            INSERT INTO aios_cost_events (
                agent_id, execution_id, model,
                input_tokens, output_tokens, cost, event_type
            ) VALUES (
                rec.aios_agent_id,
                v_execution_id,
                COALESCE(rec.model, 'unknown'),
                COALESCE(rec.tool_count, 0) * 1000,
                COALESCE(rec.tool_count, 0) * 500,
                v_estimated_cost,
                'llm_call'
            );
        END IF;

        v_sessions_processed := v_sessions_processed + 1;
        v_executions_created := v_executions_created + 1;
    END LOOP;

    -- Update agent counters from all executions
    UPDATE aios_agents a SET
        total_executions = sub.exec_count,
        total_cost = sub.total_cost,
        last_active_at = sub.last_active
    FROM (
        SELECT
            ae.agent_id,
            count(*) AS exec_count,
            COALESCE(sum(ae.cost), 0) AS total_cost,
            max(ae.completed_at) AS last_active
        FROM aios_agent_executions ae
        JOIN aios_agents ag ON ag.id = ae.agent_id AND ag.agent_source = 'claude_code'
        GROUP BY ae.agent_id
    ) sub
    WHERE a.id = sub.agent_id;

    -- Count updated agents
    SELECT count(*) INTO v_agents_updated
    FROM aios_agents
    WHERE agent_source = 'claude_code' AND total_executions > 0;

    RETURN QUERY SELECT v_sessions_processed, v_executions_created, v_agents_updated;
END;
$$;

COMMENT ON FUNCTION public.fn_backfill_aios_from_sessions() IS 'Backfill: processa session_events historicos e popula aios_agent_executions + cost_events. Idempotente (skip duplicatas).';

COMMIT;

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP FUNCTION IF EXISTS public.fn_backfill_aios_from_sessions();
