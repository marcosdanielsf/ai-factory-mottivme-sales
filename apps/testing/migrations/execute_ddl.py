import psycopg2
import sys

# Supabase connection (pooler mode)
# Try different connection methods
CONNECTION_STRINGS = [
    # Method 1: Direct connection with service role
    "postgresql://postgres.bfumywvwubvernvhjehk:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
    # Method 2: Transaction mode pooler
    "postgresql://postgres.bfumywvwubvernvhjehk:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
]

SQL = """
-- PARTE 5: VIEW LEADS PENDENTES FUU
CREATE OR REPLACE VIEW vw_growth_leads_pending_fuu AS
SELECT
    gl.id as growth_lead_id,
    gl.location_id,
    gl.ghl_contact_id as contact_id,
    gl.name as contact_name,
    gl.phone,
    gl.email,
    gl.instagram_username,
    gl.source_channel,
    gl.funnel_stage,
    gl.lead_temperature,
    gl.lead_score,
    gl.last_contact_at,
    gl.last_response_at,
    gl.total_messages_sent,
    ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(gl.last_contact_at, gl.created_at))) / 3600, 2) as hours_since_contact,
    CASE
        WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(gl.last_contact_at, gl.created_at))) / 3600 < 24
        THEN 'sdr_outbound_instagram'
        ELSE 'sdr_outbound_instagram_reactivation'
    END as suggested_followup_type,
    EXISTS (
        SELECT 1 FROM fuu_queue fq
        WHERE fq.contact_id = gl.ghl_contact_id
        AND fq.location_id = gl.location_id
        AND fq.follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
        AND fq.status IN ('pending', 'in_progress')
    ) as has_active_followup
FROM growth_leads gl
WHERE gl.source_channel = 'instagram_dm'
  AND gl.last_response_at IS NULL
  AND gl.total_messages_sent >= 1
  AND gl.funnel_stage NOT IN ('won', 'lost', 'no_show', 'converted')
  AND gl.ghl_contact_id IS NOT NULL
  AND EXTRACT(EPOCH FROM (NOW() - COALESCE(gl.last_contact_at, gl.created_at))) / 60 >= 15;

-- PARTE 9: INDICES
CREATE INDEX IF NOT EXISTS idx_growth_leads_instagram_pending
ON growth_leads (location_id, source_channel, last_response_at, funnel_stage)
WHERE source_channel = 'instagram_dm'
  AND last_response_at IS NULL
  AND funnel_stage NOT IN ('won', 'lost', 'no_show');

CREATE INDEX IF NOT EXISTS idx_fuu_queue_outbound_active
ON fuu_queue (contact_id, location_id, follow_up_type, status)
WHERE follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
  AND status IN ('pending', 'in_progress');

-- PARTE 10: VIEW METRICAS
CREATE OR REPLACE VIEW vw_fuu_outbound_instagram_metrics AS
SELECT
    fq.location_id,
    fq.follow_up_type,
    DATE(fq.created_at) as date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE fq.status = 'responded') as responded,
    ROUND(
        COUNT(*) FILTER (WHERE fq.status = 'responded')::NUMERIC /
        NULLIF(COUNT(*)::NUMERIC, 0) * 100,
        2
    ) as response_rate_pct
FROM fuu_queue fq
WHERE fq.follow_up_type IN ('sdr_outbound_instagram', 'sdr_outbound_instagram_reactivation')
GROUP BY fq.location_id, fq.follow_up_type, DATE(fq.created_at)
ORDER BY date DESC;
"""

def try_connect_and_execute(conn_str, idx):
    print(f"Trying connection method {idx + 1}...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=10)
        conn.autocommit = True
        cur = conn.cursor()

        # Execute SQL
        cur.execute(SQL)
        print("SUCCESS! DDL executed.")

        # Verify
        cur.execute("SELECT COUNT(*) FROM vw_growth_leads_pending_fuu")
        count = cur.fetchone()[0]
        print(f"View vw_growth_leads_pending_fuu created with {count} rows")

        cur.close()
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        print(f"Connection failed: {str(e)[:100]}")
        return False
    except Exception as e:
        print(f"Error: {str(e)[:200]}")
        return False

# Try each connection method
for idx, conn_str in enumerate(CONNECTION_STRINGS):
    if try_connect_and_execute(conn_str, idx):
        sys.exit(0)

print("\nAll connection methods failed. Please run SQL manually in Supabase Dashboard.")
print("File: migrations/014_parts_5_9_10_ONLY.sql")
sys.exit(1)
