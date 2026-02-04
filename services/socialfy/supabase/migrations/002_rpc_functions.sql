-- RPC Functions for Edge Functions
-- Run this in your Supabase SQL Editor

-- Increment agent executions counter
CREATE OR REPLACE FUNCTION increment_agent_executions(agent_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE socialfy_ai_agents
  SET
    total_executions = total_executions + 1,
    last_executed_at = NOW()
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment campaign leads count
CREATE OR REPLACE FUNCTION increment_campaign_leads(p_campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE socialfy_campaigns
  SET leads_count = leads_count + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment campaign responses count
CREATE OR REPLACE FUNCTION increment_campaign_responses(p_campaign_id UUID)
RETURNS void AS $$
DECLARE
  v_leads_count INTEGER;
  v_responses_count INTEGER;
BEGIN
  UPDATE socialfy_campaigns
  SET responses_count = responses_count + 1
  WHERE id = p_campaign_id
  RETURNING leads_count, responses_count INTO v_leads_count, v_responses_count;

  -- Update conversion rate
  IF v_leads_count > 0 THEN
    UPDATE socialfy_campaigns
    SET conversion_rate = ROUND((v_responses_count::DECIMAL / v_leads_count::DECIMAL) * 100, 2)
    WHERE id = p_campaign_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment campaign meetings count
CREATE OR REPLACE FUNCTION increment_campaign_meetings(p_campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE socialfy_campaigns
  SET meetings_count = meetings_count + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment cadence usage count
CREATE OR REPLACE FUNCTION increment_cadence_usage(p_cadence_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE socialfy_cadences
  SET times_used = times_used + 1
  WHERE id = p_cadence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_organization_id UUID)
RETURNS TABLE (
  total_leads BIGINT,
  active_cadences BIGINT,
  meetings_this_week BIGINT,
  show_rate DECIMAL,
  total_pipeline_value DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM socialfy_leads WHERE organization_id = p_organization_id) as total_leads,
    (SELECT COUNT(*) FROM socialfy_lead_cadences lc
     JOIN socialfy_leads l ON l.id = lc.lead_id
     WHERE l.organization_id = p_organization_id AND lc.status = 'active') as active_cadences,
    (SELECT COUNT(*) FROM socialfy_pipeline_deals
     WHERE organization_id = p_organization_id
     AND stage = 'scheduled'
     AND meeting_scheduled_at >= DATE_TRUNC('week', NOW())
     AND meeting_scheduled_at < DATE_TRUNC('week', NOW()) + INTERVAL '1 week') as meetings_this_week,
    (SELECT
      CASE
        WHEN COUNT(*) FILTER (WHERE stage = 'scheduled') > 0
        THEN ROUND(
          COUNT(*) FILTER (WHERE stage = 'won')::DECIMAL /
          (COUNT(*) FILTER (WHERE stage = 'scheduled') + COUNT(*) FILTER (WHERE stage = 'won'))::DECIMAL * 100,
          2
        )
        ELSE 0
      END
     FROM socialfy_pipeline_deals WHERE organization_id = p_organization_id) as show_rate,
    (SELECT COALESCE(SUM(value), 0) FROM socialfy_pipeline_deals
     WHERE organization_id = p_organization_id AND stage NOT IN ('lost')) as total_pipeline_value,
    (SELECT
      CASE
        WHEN SUM(leads_count) > 0
        THEN ROUND(SUM(responses_count)::DECIMAL / SUM(leads_count)::DECIMAL * 100, 2)
        ELSE 0
      END
     FROM socialfy_campaigns WHERE organization_id = p_organization_id AND status = 'active') as conversion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get leads due for cadence processing
CREATE OR REPLACE FUNCTION get_due_cadence_leads(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  lead_cadence_id UUID,
  lead_id UUID,
  lead_name TEXT,
  cadence_id UUID,
  cadence_name TEXT,
  current_step INTEGER,
  next_activity_channel TEXT,
  next_activity_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.id as lead_cadence_id,
    l.id as lead_id,
    l.name as lead_name,
    c.id as cadence_id,
    c.name as cadence_name,
    lc.current_step,
    lc.next_activity_channel,
    lc.next_activity_type
  FROM socialfy_lead_cadences lc
  JOIN socialfy_leads l ON l.id = lc.lead_id
  JOIN socialfy_cadences c ON c.id = lc.cadence_id
  WHERE lc.status = 'active'
  AND lc.next_activity_at <= NOW()
  ORDER BY lc.next_activity_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update show rate guard status
CREATE OR REPLACE FUNCTION update_show_rate_guard(
  p_deal_id UUID,
  p_channel TEXT,
  p_status TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE socialfy_pipeline_deals
  SET show_rate_guard = COALESCE(show_rate_guard, '{}'::jsonb) || jsonb_build_object(p_channel, p_status)
  WHERE id = p_deal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset daily usage for all accounts (run via cron)
CREATE OR REPLACE FUNCTION reset_daily_account_usage()
RETURNS void AS $$
BEGIN
  UPDATE socialfy_connected_accounts
  SET
    daily_usage = 0,
    last_reset_at = NOW()
  WHERE DATE(last_reset_at) < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment account usage
CREATE OR REPLACE FUNCTION increment_account_usage(p_account_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS TABLE (
  current_usage INTEGER,
  daily_limit INTEGER,
  is_rate_limited BOOLEAN
) AS $$
DECLARE
  v_usage INTEGER;
  v_limit INTEGER;
BEGIN
  UPDATE socialfy_connected_accounts
  SET daily_usage = daily_usage + p_amount
  WHERE id = p_account_id
  RETURNING daily_usage, socialfy_connected_accounts.daily_limit INTO v_usage, v_limit;

  -- Check if rate limited
  IF v_usage >= v_limit THEN
    UPDATE socialfy_connected_accounts
    SET status = 'rate_limited'
    WHERE id = p_account_id;
  END IF;

  RETURN QUERY SELECT v_usage, v_limit, v_usage >= v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_agent_executions TO authenticated;
GRANT EXECUTE ON FUNCTION increment_campaign_leads TO authenticated;
GRANT EXECUTE ON FUNCTION increment_campaign_responses TO authenticated;
GRANT EXECUTE ON FUNCTION increment_campaign_meetings TO authenticated;
GRANT EXECUTE ON FUNCTION increment_cadence_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_cadence_leads TO authenticated;
GRANT EXECUTE ON FUNCTION update_show_rate_guard TO authenticated;
GRANT EXECUTE ON FUNCTION reset_daily_account_usage TO service_role;
GRANT EXECUTE ON FUNCTION increment_account_usage TO authenticated;
