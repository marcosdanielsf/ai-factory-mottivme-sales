-- ============================================================
-- 026_prospector_tables.sql
-- Tabelas do modulo Prospector (campanhas, fila, templates, logs)
-- Nota: dm_templates ja existe com id integer, usando prospector_dm_templates
-- ============================================================

-- 1. CAMPAIGNS
CREATE TABLE IF NOT EXISTS prospector_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  vertical text NOT NULL CHECK (vertical IN ('clinicas', 'coaches', 'infoprodutores')),
  channels text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida')),
  total_leads int DEFAULT 0,
  leads_processed int DEFAULT 0,
  dms_sent int DEFAULT 0,
  replies int DEFAULT 0,
  conversions int DEFAULT 0,
  daily_limit int DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. QUEUE LEADS
CREATE TABLE IF NOT EXISTS prospector_queue_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES prospector_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text,
  avatar_url text,
  channel text NOT NULL CHECK (channel IN ('instagram', 'linkedin', 'whatsapp')),
  stage text NOT NULL DEFAULT 'warm_up',
  temperature text NOT NULL DEFAULT 'cold' CHECK (temperature IN ('hot', 'warm', 'cold')),
  icp_tier text NOT NULL DEFAULT 'C' CHECK (icp_tier IN ('A', 'B', 'C')),
  next_action text,
  next_action_at timestamptz,
  bio_highlight text,
  city text,
  followers int,
  created_at timestamptz DEFAULT now()
);

-- 3. PROSPECTOR DM TEMPLATES (separada da dm_templates legada)
CREATE TABLE IF NOT EXISTS prospector_dm_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('instagram', 'linkedin', 'whatsapp')),
  stage text NOT NULL,
  vertical text NOT NULL,
  content text NOT NULL,
  variant text DEFAULT 'A',
  reply_rate numeric DEFAULT 0,
  times_sent int DEFAULT 0,
  times_replied int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. DM LOGS (analytics)
CREATE TABLE IF NOT EXISTS prospector_dm_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES prospector_campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES prospector_queue_leads(id) ON DELETE SET NULL,
  template_id uuid REFERENCES prospector_dm_templates(id) ON DELETE SET NULL,
  channel text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  replied_at timestamptz,
  converted_at timestamptz
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_prosp_queue_campaign ON prospector_queue_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prosp_queue_channel ON prospector_queue_leads(channel);
CREATE INDEX IF NOT EXISTS idx_prosp_queue_stage ON prospector_queue_leads(stage);
CREATE INDEX IF NOT EXISTS idx_prosp_queue_next_action ON prospector_queue_leads(next_action_at);
CREATE INDEX IF NOT EXISTS idx_prosp_templates_channel ON prospector_dm_templates(channel);
CREATE INDEX IF NOT EXISTS idx_prosp_templates_stage ON prospector_dm_templates(stage);
CREATE INDEX IF NOT EXISTS idx_prosp_dm_logs_campaign ON prospector_dm_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_prosp_dm_logs_sent ON prospector_dm_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_prosp_dm_logs_channel ON prospector_dm_logs(channel);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prospector_campaigns_updated') THEN
    CREATE TRIGGER trg_prospector_campaigns_updated
      BEFORE UPDATE ON prospector_campaigns
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prosp_dm_templates_updated') THEN
    CREATE TRIGGER trg_prosp_dm_templates_updated
      BEFORE UPDATE ON prospector_dm_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE prospector_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospector_queue_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospector_dm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospector_dm_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospector_campaigns' AND policyname = 'Allow all for authenticated') THEN
    CREATE POLICY "Allow all for authenticated" ON prospector_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospector_queue_leads' AND policyname = 'Allow all for authenticated') THEN
    CREATE POLICY "Allow all for authenticated" ON prospector_queue_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospector_dm_templates' AND policyname = 'Allow all for authenticated') THEN
    CREATE POLICY "Allow all for authenticated" ON prospector_dm_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prospector_dm_logs' AND policyname = 'Allow all for authenticated') THEN
    CREATE POLICY "Allow all for authenticated" ON prospector_dm_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE POLICY "Service role full access" ON prospector_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prospector_queue_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prospector_dm_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON prospector_dm_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
