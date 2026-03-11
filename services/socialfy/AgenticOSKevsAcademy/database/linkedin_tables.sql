-- ============================================
-- LinkedIn Agent Tables
-- Run in Supabase SQL Editor
-- ============================================

-- Leads table
CREATE TABLE IF NOT EXISTS linkedin_leads (
    id SERIAL PRIMARY KEY,
    linkedin_url TEXT UNIQUE NOT NULL,
    full_name TEXT,
    first_name TEXT,
    headline TEXT,
    company TEXT,
    title TEXT,
    location TEXT,
    industry TEXT,
    connections_count INTEGER,
    source TEXT,  -- 'sales_nav', 'search', 'csv', 'scraper'
    icp_score INTEGER,  -- 0-100
    priority TEXT CHECK (priority IN ('hot', 'warm', 'cold', 'skip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_url ON linkedin_leads(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_priority ON linkedin_leads(priority);
CREATE INDEX IF NOT EXISTS idx_linkedin_leads_score ON linkedin_leads(icp_score DESC);

-- Connection requests sent
CREATE TABLE IF NOT EXISTS linkedin_connections_sent (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES linkedin_leads(id),
    linkedin_url TEXT NOT NULL,
    connection_note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    account_used TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_linkedin_conn_url ON linkedin_connections_sent(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_conn_status ON linkedin_connections_sent(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_conn_sent_at ON linkedin_connections_sent(sent_at);

-- Messages sent
CREATE TABLE IF NOT EXISTS linkedin_messages_sent (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES linkedin_leads(id),
    linkedin_url TEXT NOT NULL,
    message_sent TEXT,
    template_used TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'replied')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_at TIMESTAMP WITH TIME ZONE,
    account_used TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_linkedin_msg_url ON linkedin_messages_sent(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_msg_sent_at ON linkedin_messages_sent(sent_at);

-- Agent runs log
CREATE TABLE IF NOT EXISTS linkedin_dm_runs (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    mode TEXT NOT NULL CHECK (mode IN ('connection', 'message', 'hybrid')),
    connections_sent INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'error', 'stopped')),
    error_log TEXT,
    account_used TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_linkedin_runs_status ON linkedin_dm_runs(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_runs_started ON linkedin_dm_runs(started_at);

-- Daily stats (agregado)
CREATE TABLE IF NOT EXISTS linkedin_daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    account_used TEXT NOT NULL,
    connections_sent INTEGER DEFAULT 0,
    connections_accepted INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_replied INTEGER DEFAULT 0,
    UNIQUE(date, account_used)
);

CREATE INDEX IF NOT EXISTS idx_linkedin_stats_date ON linkedin_daily_stats(date);

-- ============================================
-- Sample Data (opcional - comentado)
-- ============================================

-- INSERT INTO linkedin_leads (linkedin_url, full_name, headline, company, title, industry, icp_score, priority) VALUES
-- ('https://linkedin.com/in/johndoe', 'John Doe', 'CEO at TechStartup | SaaS Founder', 'TechStartup', 'CEO', 'Technology', 85, 'hot'),
-- ('https://linkedin.com/in/janesmith', 'Jane Smith', 'VP Marketing at GrowthCo', 'GrowthCo', 'VP Marketing', 'Marketing', 75, 'warm'),
-- ('https://linkedin.com/in/bobwilson', 'Bob Wilson', 'Senior Developer at BigCorp', 'BigCorp', 'Senior Developer', 'Technology', 45, 'cold');

-- ============================================
-- RLS Policies (opcional para multi-tenant)
-- ============================================

-- ALTER TABLE linkedin_leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE linkedin_connections_sent ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE linkedin_messages_sent ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE linkedin_dm_runs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Views úteis
-- ============================================

-- Pipeline view: leads por status
CREATE OR REPLACE VIEW linkedin_pipeline AS
SELECT 
    l.id,
    l.linkedin_url,
    l.full_name,
    l.company,
    l.title,
    l.icp_score,
    l.priority,
    CASE 
        WHEN m.id IS NOT NULL THEN 'messaged'
        WHEN c.status = 'accepted' THEN 'connected'
        WHEN c.status = 'pending' THEN 'pending'
        ELSE 'new'
    END as pipeline_status,
    c.sent_at as connection_sent_at,
    c.accepted_at as connection_accepted_at,
    m.sent_at as message_sent_at
FROM linkedin_leads l
LEFT JOIN linkedin_connections_sent c ON l.linkedin_url = c.linkedin_url
LEFT JOIN linkedin_messages_sent m ON l.linkedin_url = m.linkedin_url
ORDER BY l.icp_score DESC NULLS LAST;

-- Stats view: métricas do dia
CREATE OR REPLACE VIEW linkedin_today_stats AS
SELECT 
    COUNT(DISTINCT c.id) FILTER (WHERE c.sent_at::date = CURRENT_DATE) as connections_sent_today,
    COUNT(DISTINCT c.id) FILTER (WHERE c.accepted_at::date = CURRENT_DATE) as connections_accepted_today,
    COUNT(DISTINCT m.id) FILTER (WHERE m.sent_at::date = CURRENT_DATE) as messages_sent_today,
    COUNT(DISTINCT c.id) FILTER (WHERE c.sent_at >= NOW() - INTERVAL '7 days') as connections_sent_week
FROM linkedin_connections_sent c
CROSS JOIN linkedin_messages_sent m;

-- ============================================
-- Functions
-- ============================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_linkedin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER linkedin_leads_updated_at
    BEFORE UPDATE ON linkedin_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_linkedin_updated_at();
