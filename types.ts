// AI FACTORY SCHEMA TYPES

export type ValidationStatus = 'draft' | 'validating' | 'validated' | 'failed' | 'active' | 'deprecated';
export type TestResultStatus = 'pass' | 'fail' | 'warning';

// Tabela: leads (Sales OS)
export interface Lead {
  id: string;
  created_at: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'demo_booked' | 'closed' | 'churned';
  tags: string[];
  ghl_contact_id?: string;
  scheduled_date?: string;
}

// Tabela: agent_versions (V3 Core)
export interface AgentVersion {
  id: string;
  client_id?: string; // Nullable if generic template
  version_number: string;
  system_prompt: string;
  
  // V3 Hyperpersonalization
  hyperpersonalization_config?: {
    tone: string;
    forbidden_words: string[];
    knowledge_base_ids: string[];
  };
  
  // V4 Validation Integration
  validation_status: ValidationStatus;
  validation_score?: number; // 0-100
  
  created_at: string;
  is_active: boolean;
}

// Tabela: agenttest_runs (V4 Python Framework Results)
export interface AgentTestRun {
  id: string;
  version_id: string;
  run_at: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  html_report_url?: string; // Link to the detailed Python report
  status: 'running' | 'completed' | 'error';
  summary?: string;
}

// Tabela: qa_analyses (V3 Monitoring - "The Analyst")
export interface QaAnalysis {
  id: string;
  conversation_id: string;
  analyzed_at: string;
  score: number; // 0-100
  issues_detected: string[];
  suggested_improvements?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// UI Helpers (Legacy/Display)
export interface Metric {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  source: 'n8n_monitor' | 'python_validator';
  timestamp: string;
  status: 'new' | 'read' | 'archived';
  client_name?: string;
}

export interface Client {
  id: string;
  empresa: string;
  vertical: string;
  status: string;
  nome: string;
  email: string;
  telefone: string;
}

export interface Call {
  id: string;
  titulo: string;
  tipo: string;
  date: string;
  status: string;
}

export interface ApprovalRequest {
  id: string;
  client_name: string;
  version: string;
  type: string;
  requested_at: string;
  changes_summary: string;
}