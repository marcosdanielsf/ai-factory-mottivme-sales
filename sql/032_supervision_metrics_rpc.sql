-- RPC: get_supervision_metrics
-- Criado em: 2026-02-22
-- Proposito: Agregar metricas completas da supervisao CRM no servidor,
--            cobrindo todos os leads (sem limite de paginacao do frontend).
-- Usada em: src/hooks/useSupervisionMetrics.ts → src/components/supervision/SupervisionMetrics.tsx

CREATE OR REPLACE FUNCTION get_supervision_metrics(
  p_location_id TEXT DEFAULT NULL,
  p_channel TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH filtered AS (
    SELECT * FROM vw_supervision_conversations_v4
    WHERE (p_location_id IS NULL OR location_id = p_location_id)
      AND (p_channel IS NULL OR channel = p_channel)
      AND (p_days_back IS NULL OR last_message_at >= NOW() - (p_days_back || ' days')::INTERVAL)
  ),
  status_counts AS (
    SELECT supervision_status, COUNT(*) as cnt
    FROM filtered GROUP BY supervision_status
  ),
  client_counts AS (
    SELECT client_name, COUNT(*) as total,
      COUNT(*) FILTER (WHERE supervision_status = 'converted') as converted,
      COUNT(*) FILTER (WHERE supervision_status = 'lost') as lost
    FROM filtered GROUP BY client_name ORDER BY total DESC LIMIT 20
  ),
  lost_reasons_agg AS (
    SELECT COALESCE(lost_reason, 'nao_especificado') as reason, COUNT(*) as cnt
    FROM filtered WHERE supervision_status = 'lost'
    GROUP BY lost_reason ORDER BY cnt DESC
  ),
  responsavel_counts AS (
    SELECT COALESCE(usuario_responsavel, 'Sem responsavel') as name,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE supervision_status = 'converted') as converted,
      COUNT(*) FILTER (WHERE supervision_status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE supervision_status = 'lost') as lost,
      COUNT(*) FILTER (WHERE last_message_role = 'user') as no_response
    FROM filtered GROUP BY usuario_responsavel ORDER BY total DESC
  )
  SELECT json_build_object(
    'total', (SELECT COUNT(*) FROM filtered),
    'no_response', (SELECT COUNT(*) FROM filtered WHERE last_message_role = 'user'),
    'by_status', (SELECT COALESCE(json_object_agg(supervision_status, cnt), '{}'::json) FROM status_counts),
    'by_client', (SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json) FROM client_counts c),
    'lost_reasons', (SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json) FROM lost_reasons_agg l),
    'by_responsavel', (SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) FROM responsavel_counts r)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissao para o role anon/authenticated chamar via supabase.rpc()
GRANT EXECUTE ON FUNCTION get_supervision_metrics(TEXT, TEXT, INTEGER) TO anon, authenticated;
