-- ============================================================
-- 027_prospector_cron.sql
-- Cron job: process-prospector-queue every hour 9h-20h BRT (12h-23h UTC)
-- Uses pg_cron + pg_net to call the Edge Function
-- ============================================================

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule: every hour at minute 0, hours 12-23 UTC (9h-20h BRT)
SELECT cron.schedule(
  'prospector-queue-hourly',
  '0 12-23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bfumywvwubvernvhjehk.supabase.co/functions/v1/process-prospector-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMzc5OSwiZXhwIjoyMDY2OTc5Nzk5fQ.fdTsdGlSqemXzrXEU4ov1SUpeDn_3bSjOingqkSAWQE',
      'Content-Type', 'application/json'
    ),
    body := '{"dry_run": false}'::jsonb
  );
  $$
);
