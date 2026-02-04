// Types para o Painel de Supervisao da Gestora de IA

// =====================================================
// QUALITY FLAGS - Sistema de Deteccao de Problemas
// =====================================================

export type QualityFlagType =
  | 'FUGA_PROMPT'      // Resposta fora do escopo/guardrails
  | 'ERRO_INFO'        // Informacao incorreta sobre negocio
  | 'TOM_INADEQUADO'   // Tom ou linguagem inapropriada
  | 'NAO_RESPONDEU'    // Timeout ou sem resposta
  | 'REPETITIVO'       // Loop/resposta duplicada
  | 'BUG_TECNICO';     // Resposta truncada ou erro tecnico

export type QualitySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface QualityFlag {
  id: string;
  session_id: string;
  message_id: string;
  location_id: string | null;
  flag_type: QualityFlagType;
  severity: QualitySeverity;
  description: string;
  evidence: string | null;
  expected_behavior: string | null;
  analyzed_by: string;
  analysis_model: string | null;
  confidence_score: number | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  client_name?: string;
}

export interface QualitySummary {
  session_id: string;
  location_id: string | null;
  total_unresolved: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  fuga_count: number;
  erro_count: number;
  timeout_count: number;
  bug_count: number;
  max_severity: QualitySeverity | null;
  last_flag_at: string | null;
  total_flags: number;
  total_resolved: number;
}

// Configuracao visual dos tipos de flag
export const qualityFlagConfig: Record<
  QualityFlagType,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  FUGA_PROMPT: {
    label: 'Fuga do Prompt',
    icon: 'AlertTriangle',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  ERRO_INFO: {
    label: 'Erro de Info',
    icon: 'XCircle',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  TOM_INADEQUADO: {
    label: 'Tom Inadequado',
    icon: 'MessageCircle',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  NAO_RESPONDEU: {
    label: 'Nao Respondeu',
    icon: 'Clock',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  REPETITIVO: {
    label: 'Repetitivo',
    icon: 'Repeat',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  BUG_TECNICO: {
    label: 'Bug Tecnico',
    icon: 'Bug',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
};

// Configuracao visual das severidades
export const severityConfig: Record<
  QualitySeverity,
  { label: string; color: string; bgColor: string; priority: number }
> = {
  critical: {
    label: 'Critico',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    priority: 4,
  },
  high: {
    label: 'Alto',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/15',
    priority: 3,
  },
  medium: {
    label: 'Medio',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    priority: 2,
  },
  low: {
    label: 'Baixo',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    priority: 1,
  },
};

// =====================================================
// SUPERVISION TYPES
// =====================================================

export type SupervisionStatus =
  | 'ai_active'
  | 'ai_paused'
  | 'manual_takeover'
  | 'scheduled'
  | 'converted'
  | 'archived';

export interface SupervisionConversation {
  conversation_id: string;
  session_id: string;
  location_id: string | null;

  // Dados do contato
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;

  // Dados do cliente (location)
  client_name: string | null;

  // Ultima mensagem
  last_message: string | null;
  last_message_role: 'user' | 'assistant' | 'system';
  last_message_at: string;

  // Estado de supervisao
  supervision_status: SupervisionStatus;
  ai_enabled: boolean;
  supervision_notes: string | null;
  scheduled_at: string | null;
  converted_at: string | null;
  supervision_updated_at: string | null;

  // Metricas
  message_count: number;

  // Campos de filtro (Fase 2)
  channel?: string | null;
  instagram_username?: string | null;
  etapa_funil?: string | null;
  usuario_responsavel?: string | null;
}

export interface SupervisionMessage {
  message_id: string;
  session_id: string;
  location_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  channel: string | null;
  sentiment_score: number | null;
  created_at: string;

  // Info adicional
  contact_name: string | null;
  contact_phone: string | null;
  agent_name: string | null;
}

export interface SupervisionState {
  id: string;
  conversation_id: string;
  lead_id: string | null;
  agent_id: string | null;
  status: SupervisionStatus;
  ai_enabled: boolean;
  notes: string | null;
  scheduled_at: string | null;
  converted_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupervisionFilters {
  status?: SupervisionStatus | 'all';
  agentId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  // Novos filtros (Fase 2)
  locationId?: string | null;
  channel?: string | null;
  etapaFunil?: string | null;
  responsavel?: string | null;
  // Filtro de qualidade (Fase 3)
  hasQualityIssues?: boolean;
  // Filtro sem resposta (Fase 4)
  noResponse?: boolean;
}

// Opcao de filtro para dropdowns
export interface FilterOption {
  filter_type: 'location' | 'channel' | 'etapa_funil' | 'responsavel';
  value: string;
  label: string;
  count: number;
}

// Configuracao de canais
export const channelConfig: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram', icon: 'Instagram', color: 'text-pink-400' },
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle', color: 'text-green-400' },
  sms: { label: 'SMS', icon: 'Smartphone', color: 'text-blue-400' },
  facebook: { label: 'Facebook', icon: 'Facebook', color: 'text-blue-500' },
  email: { label: 'Email', icon: 'Mail', color: 'text-gray-400' },
  unknown: { label: 'Outro', icon: 'MessageSquare', color: 'text-text-muted' },
};

export interface SupervisionAction {
  type: 'pause_ai' | 'resume_ai' | 'mark_scheduled' | 'mark_converted' | 'add_note' | 'archive';
  conversationId: string;
  payload?: {
    notes?: string;
    scheduledAt?: string;
  };
}

// Badge colors por status
export const supervisionStatusConfig: Record<
  SupervisionStatus,
  { label: string; color: string; bgColor: string }
> = {
  ai_active: {
    label: 'IA Ativa',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  ai_paused: {
    label: 'IA Pausada',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  manual_takeover: {
    label: 'Manual',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  scheduled: {
    label: 'Agendado',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  converted: {
    label: 'Convertido',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  archived: {
    label: 'Arquivado',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
};
