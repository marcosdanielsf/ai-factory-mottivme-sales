
// --- Tipos Principais (Espelhados do Supabase) ---

export interface Lead {
  id: string;
  ghl_contact_id?: string;
  name: string;
  phone: string;
  email: string;
  status: 'new_lead' | 'qualified' | 'call_booked' | 'proposal' | 'won' | 'lost';
  work_permit?: boolean;
  location_country?: string;
  career_segment?: string;
  budget_range?: string;
  acquisition_channel?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string; // 'SDR', 'Closer', 'Support'
  description?: string;
  base_personality?: string;
  current_version_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  version_number: string;
  system_prompt: string;
  prompts_por_modo?: Record<string, string>; // { first_contact: "...", scheduler: "..." }
  change_log?: string;
  parent_version_id?: string;
  conversion_rate?: number;
  avg_interactions_to_goal?: number;
  status: 'production' | 'sandbox' | 'archived' | 'draft';
  created_at: string;
}

export interface AgentConversation {
  id: string;
  lead_id?: string;
  agent_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  channel?: string;
  tokens_used?: number;
  cost_usd?: number;
  sentiment_score?: number;
  created_at: string;
}

export interface SalesCall {
  id: string;
  lead_id?: string;
  closer_agent_id?: string;
  audio_url?: string;
  transcript_text?: string;
  analysis_data?: Record<string, any>; // JSONB
  deal_outcome?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface Contract {
  id: string;
  lead_id?: string;
  amount_value?: number;
  product_name?: string;
  payment_terms?: string;
  status: 'draft' | 'generated' | 'sent' | 'viewed' | 'signed';
  contract_url?: string;
  signed_at?: string;
  created_at: string;
}

export interface FactoryArtifact {
  id: string;
  lead_id?: string;
  artifact_type: string; // 'persona_analysis', 'objection_map', 'tone_guide'
  title?: string;
  content?: string;
  created_at: string;
}

export interface ImprovementLog {
  id: string;
  agent_id?: string;
  evaluated_version_id?: string;
  issue_detected: string;
  suggested_fix?: string;
  severity?: 'high' | 'medium' | 'low';
  is_implemented: boolean;
  created_at: string;
}

export interface AgentTestRun {
  id: string;
  agent_version_id?: string;
  total_tests?: number;
  passed_tests?: number;
  failed_tests?: number;
  html_report_url?: string;
  status?: 'running' | 'completed' | 'failed';
  created_at: string;
}

// --- Tipos Legados/Auxiliares (Mantidos para não quebrar UI temporariamente) ---
export interface Metric {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}
