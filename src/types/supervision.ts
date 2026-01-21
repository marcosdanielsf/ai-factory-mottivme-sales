// Types para o Painel de Supervisao da Gestora de IA

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
}

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
