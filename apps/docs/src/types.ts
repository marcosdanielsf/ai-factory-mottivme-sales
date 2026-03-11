
// --- Tipos Principais (Espelhados do Supabase) ---

export interface Lead {
  id: string;
  ghl_contact_id?: string;
  name: string;
  phone: string;
  email: string;
  status: 'new_lead' | 'qualified' | 'call_booked' | 'proposal' | 'won' | 'lost' | 'scheduled'; // Added 'scheduled' for legacy compat
  work_permit?: boolean;
  location_country?: string;
  career_segment?: string;
  budget_range?: string;
  acquisition_channel?: string;
  created_at: string;
  updated_at: string;
  scheduled_date?: string; // Legacy compat
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

// --- Score Dimensions (Sistema 0-10) ---
export interface ScoreDimensions {
  tone?: number; // Tom de voz (0-10)
  engagement?: number; // Engajamento (0-10)
  compliance?: number; // Aderência ao script (0-10)
  accuracy?: number; // Precisão das informações (0-10)
  empathy?: number; // Empatia (0-10)
  efficiency?: number; // Eficiência (0-10)
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  agent_name?: string;
  version_number: string;
  version?: string; // Fallback se o banco usar 'version'
  system_prompt: string;
  prompts_por_modo?: Record<string, string>;
  hyperpersonalization?: Record<string, any>;
  change_log?: string;
  parent_version_id?: string;
  conversion_rate?: number;
  avg_interactions_to_goal?: number;
  status: 'production' | 'sandbox' | 'archived' | 'draft' | 'pending_approval' | 'active';
  validation_status?: 'production' | 'sandbox' | 'archived' | 'draft' | 'pending_approval' | 'active';
  created_at: string;
  deployed_at?: string;
  is_active?: boolean;
  
  // Relacionamento com cliente
  client_id?: string;
  location_id?: string;
  clients?: {
    id?: string;
    nome?: string;
    empresa?: string;
    telefone?: string;
    email?: string;
    vertical?: string;
    status?: string;
  };

  // 8 Campos de Configuração do Agente
  tools_config?: Record<string, any>;
  compliance_rules?: Record<string, any>;
  personality_config?: Record<string, any>;
  qualification_config?: Record<string, any>;
  business_config?: Record<string, any>;
  followup_scripts?: Record<string, any>;
  deployment_notes?: string;

  // Métricas agregadas de testes
  avg_score_overall?: number;
  avg_score_dimensions?: ScoreDimensions;
  total_test_runs?: number;
  last_test_at?: string;
  validation_score?: number;
  last_test_score?: number;
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
  agent_id?: string;
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
  run_at?: string; // Data da execução do teste

  // Sistema de Scores (0-10) - Novo padrão consolidado
  score_overall?: number; // Score geral (0-10)
  score_dimensions?: ScoreDimensions; // Scores por dimensão
  execution_time_ms?: number; // Tempo de execução em ms
  created_by?: string; // 'system', user_id, ou 'ci/cd'

  // Campos extras para exibição
  agent_name?: string;
  agent_version?: string;
  client_name?: string;
  location_id?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];

  // Campos para validação
  lead_classification?: string;
  sales_score?: number;
  total_tokens?: number;
  test_details?: any[];
  validation_status?: string;
  system_prompt?: string;
  business_config?: Record<string, any>;

  // Campos para E2E
  e2e_scenarios?: any[];

  // Deprecated: Scores antigos (mantidos para compatibilidade temporária)
  /** @deprecated Use score_dimensions.tone */
  tone_score?: number;
  /** @deprecated Use score_dimensions.engagement */
  engagement_score?: number;
  /** @deprecated Use score_dimensions.compliance */
  compliance_score?: number;
  /** @deprecated Use score_overall */
  completeness_score?: number;
  /** @deprecated Usar conversion_rate em AgentVersion */
  conversion_score?: number;
}

// --- Tipos de Views (Performance Otimizada) ---
export interface AgentPerformanceSummary {
  agent_id: string;
  slug: string;
  name: string;
  role: string;
  is_active: boolean;
  total_versions: number;
  current_version_id?: string;
  current_version?: string;
  current_status?: string;
  qualified_leads: number;
  total_interactions: number;
  conversion_rate_pct: number;
  total_tests_passed: number;
  total_tests_failed: number;
  total_tests_run: number;
  test_pass_rate_pct: number;
  last_version_created?: string;
  last_test_run?: string;
}

export interface VersionComparison {
  version_id: string;
  agent_id: string;
  agent_name: string;
  version_number: string;
  status: string;
  created_at: string;
  deployed_at?: string;
  conversion_rate?: number;
  avg_interactions_to_goal?: number;
  test_runs_count: number;
  total_passed: number;
  total_failed: number;
  improvement_suggestions_count: number;
  conversations_count: number;
  parent_version_number?: string;
}

export interface DashboardMetrics {
  total_active_agents: number;
  total_leads: number;
  qualified_leads: number;
  global_conversion_rate_pct: number;
  versions_in_production: number;
  versions_pending_approval: number;
  tests_last_24h: number;
  conversations_last_24h: number;
}

export interface PendingApproval {
  version_id: string;
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  version_number: string;
  description?: string;
  created_at: string;
  status: string;
  previous_version?: string;
  tests_passed?: number;
  tests_failed?: number;
  requested_by: string;
}

export interface ScoreEvolution {
  agent_id: string;
  agent_name: string;
  slug: string;
  version_id: string;
  version_number: string;
  status: string;
  created_at: string;
  deployed_at?: string;
  avg_score_overall?: number;
  avg_score_dimensions?: ScoreDimensions;
  total_test_runs?: number;
  last_test_at?: string;
  previous_version?: string;
  previous_avg_score?: number;
  score_delta?: number;
  improvement_pct?: number;
}

export interface ScoreDimensionsDetail {
  test_run_id: string;
  created_at: string;
  agent_name: string;
  version_number: string;
  score_overall?: number;
  score_tone?: number;
  score_engagement?: number;
  score_compliance?: number;
  score_accuracy?: number;
  score_empathy?: number;
  score_efficiency?: number;
  total_tests?: number;
  passed_tests?: number;
  failed_tests?: number;
  execution_time_ms?: number;
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

export interface Client {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  vertical: string;
  status: string;
  created_at: string;
  avatar: string;
  revenue: number;
  score: number;
}

export interface CallRecording {
  id: string;
  clientName: string;
  date: string;
  duration: string;
  status: 'qualified' | 'rejected' | 'pending';
  summary: string;
  tags: string[];
}

export interface PromptChangeRequest {
  id: string;
  agentName: string;
  requestedBy: string;
  date: string;
  type: 'refinement' | 'correction' | 'behavior';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
}
