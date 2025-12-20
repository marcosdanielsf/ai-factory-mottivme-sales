export type Vertical = 'clinicas' | 'financeiro' | 'servicos' | 'mentores' | 'outros';
export type ClientStatus = 'prospect' | 'cliente' | 'churned' | 'reativado';

export interface Client {
  id: string;
  ghl_contact_id?: string;
  nome: string;
  empresa: string;
  telefone: string;
  email: string;
  vertical: Vertical;
  status: ClientStatus;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AgentVersion {
  id: string;
  client_id: string;
  versao: string;
  system_prompt: string;
  tools_config?: Record<string, any>;
  compliance_rules?: Record<string, any>;
  personality_config?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  deployed_at?: string;
}

export interface Metric {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: any;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface CallRecording {
  id: string;
  client_id: string;
  tipo: 'diagnostico' | 'kickoff' | 'acompanhamento' | 'suporte';
  titulo: string;
  status: 'pendente' | 'processando' | 'analisado' | 'erro';
  date: string;
}

export interface PromptChangeRequest {
  id: string;
  client_name: string;
  version: string;
  type: 'revisao' | 'hotfix' | 'rollback';
  requested_at: string;
  changes_summary: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  scheduled_date: string;
  status: 'scheduled' | 'completed' | 'no-show';
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  created_at: string;
}