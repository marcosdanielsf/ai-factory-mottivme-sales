-- Migration: Fix vw_agendamentos_unified - Deduplicate records
-- Date: 2026-02-09
-- Problem: UNION ALL creates duplicates when same appointment exists in both
--          app_dash_principal (historico) and appointments_log (realtime)
-- Solution: Use ROW_NUMBER() to deduplicate by (contato_nome, agendamento_data)
--           Priority: realtime > historico (realtime has phone + location_id)
--           Same source tie-break: most recent data_criacao DESC
-- Impact: ~289 duplicate groups out of 3336 total rows

-- ============================================================
-- BACKUP: Original view definition (for rollback)
-- ============================================================
/*
CREATE OR REPLACE VIEW public.vw_agendamentos_unified AS
 SELECT (app_dash_principal.id)::text AS id,
    app_dash_principal.data_e_hora_do_agendamento_bposs AS agendamento_data,
    app_dash_principal.contato_principal AS contato_nome,
    app_dash_principal.celular_contato AS contato_telefone,
    app_dash_principal.email_comercial_contato AS contato_email,
    app_dash_principal.lead_usuario_responsavel AS responsavel_nome,
    app_dash_principal.location_id,
    app_dash_principal.tipo_do_agendamento AS agendamento_tipo,
    app_dash_principal.status,
    app_dash_principal.fonte_do_lead_bposs AS fonte,
    app_dash_principal.data_criada AS data_criacao,
    'historico'::text AS source
   FROM app_dash_principal
  WHERE (app_dash_principal.data_e_hora_do_agendamento_bposs IS NOT NULL)
UNION ALL
 SELECT (appointments_log.id)::text AS id,
    appointments_log.appointment_date AS agendamento_data,
    appointments_log.contact_name AS contato_nome,
    appointments_log.contact_phone AS contato_telefone,
    appointments_log.contact_email AS contato_email,
    appointments_log.location_name AS responsavel_nome,
    appointments_log.location_id,
    appointments_log.appointment_type AS agendamento_tipo,
    'booked'::dashmottivmesales_status_enum AS status,
    NULL::character varying AS fonte,
    appointments_log.created_at AS data_criacao,
    'realtime'::text AS source
   FROM appointments_log;
*/

-- ============================================================
-- NEW VIEW: Deduplicated version
-- ============================================================
CREATE OR REPLACE VIEW public.vw_agendamentos_unified AS
WITH all_agendamentos AS (
    -- Source 1: Historico (app_dash_principal)
    SELECT
        (app_dash_principal.id)::text AS id,
        app_dash_principal.data_e_hora_do_agendamento_bposs AS agendamento_data,
        app_dash_principal.contato_principal AS contato_nome,
        app_dash_principal.celular_contato AS contato_telefone,
        app_dash_principal.email_comercial_contato AS contato_email,
        app_dash_principal.lead_usuario_responsavel AS responsavel_nome,
        app_dash_principal.location_id,
        app_dash_principal.tipo_do_agendamento AS agendamento_tipo,
        app_dash_principal.status,
        app_dash_principal.fonte_do_lead_bposs AS fonte,
        app_dash_principal.data_criada AS data_criacao,
        'historico'::text AS source
    FROM app_dash_principal
    WHERE app_dash_principal.data_e_hora_do_agendamento_bposs IS NOT NULL

    UNION ALL

    -- Source 2: Realtime (appointments_log)
    SELECT
        (appointments_log.id)::text AS id,
        appointments_log.appointment_date AS agendamento_data,
        appointments_log.contact_name AS contato_nome,
        appointments_log.contact_phone AS contato_telefone,
        appointments_log.contact_email AS contato_email,
        appointments_log.location_name AS responsavel_nome,
        appointments_log.location_id,
        appointments_log.appointment_type AS agendamento_tipo,
        'booked'::dashmottivmesales_status_enum AS status,
        NULL::character varying AS fonte,
        appointments_log.created_at AS data_criacao,
        'realtime'::text AS source
    FROM appointments_log
),
-- Deduplication: group by matching key, prefer realtime over historico
ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY
                COALESCE(contato_nome, contato_email, id),
                agendamento_data
            ORDER BY
                -- Prefer realtime (has phone + richer data)
                CASE WHEN source = 'realtime' THEN 0 ELSE 1 END,
                -- Tie-break: most recent record
                data_criacao DESC NULLS LAST
        ) AS rn
    FROM all_agendamentos
)
SELECT
    id,
    agendamento_data,
    contato_nome,
    contato_telefone,
    contato_email,
    responsavel_nome,
    location_id,
    agendamento_tipo,
    status,
    fonte,
    data_criacao,
    source
FROM ranked
WHERE rn = 1;

-- ============================================================
-- ROLLBACK (if needed):
-- ============================================================
-- Run the original view definition from the BACKUP section above
