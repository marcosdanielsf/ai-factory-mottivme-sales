import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  SupervisionConversation,
  SupervisionFilters,
  SupervisionStatus,
} from '../types/supervision';

interface UseSupervisionPanelReturn {
  conversations: SupervisionConversation[];
  loading: boolean;
  error: string | null;
  filters: SupervisionFilters;
  setFilters: (filters: SupervisionFilters) => void;
  refetch: () => void;
  stats: {
    total: number;
    aiActive: number;
    aiPaused: number;
    scheduled: number;
    converted: number;
  };
}

export const useSupervisionPanel = (): UseSupervisionPanelReturn => {
  const [conversations, setConversations] = useState<SupervisionConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupervisionFilters>({
    status: 'all',
  });

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('vw_supervision_conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(100);

      // Aplicar filtros
      if (filters.status && filters.status !== 'all') {
        query = query.eq('supervision_status', filters.status);
      }

      if (filters.agentId) {
        query = query.eq('agent_id', filters.agentId);
      }

      if (filters.search) {
        query = query.or(
          `contact_name.ilike.%${filters.search}%,contact_phone.ilike.%${filters.search}%,last_message.ilike.%${filters.search}%`
        );
      }

      if (filters.dateFrom) {
        query = query.gte('last_message_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('last_message_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setConversations((data as SupervisionConversation[]) || []);
    } catch (err: any) {
      console.error('Error fetching supervision conversations:', err);
      setError(err.message || 'Erro ao carregar conversas');
      // Fallback para dados mock se view nao existir
      if (err.message?.includes('does not exist')) {
        setConversations(getMockConversations());
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Polling para atualizacoes (cada 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Calcular stats
  const stats = {
    total: conversations.length,
    aiActive: conversations.filter((c) => c.supervision_status === 'ai_active').length,
    aiPaused: conversations.filter((c) => c.supervision_status === 'ai_paused').length,
    scheduled: conversations.filter((c) => c.supervision_status === 'scheduled').length,
    converted: conversations.filter((c) => c.supervision_status === 'converted').length,
  };

  return {
    conversations,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchConversations,
    stats,
  };
};

// Mock data para desenvolvimento
function getMockConversations(): SupervisionConversation[] {
  const statuses: SupervisionStatus[] = [
    'ai_active',
    'ai_active',
    'ai_active',
    'ai_paused',
    'scheduled',
    'converted',
  ];

  const clients = ['Marina Couto', 'Dr. Luiz Augusto', 'Lappe Finances', 'Instituto Amar', 'Clinic Pro'];

  return Array.from({ length: 15 }, (_, i) => ({
    conversation_id: `conv-${i + 1}`,
    session_id: `session-${i + 1}`,
    location_id: `location-${i % 5}`,
    contact_name: [
      'Maria Silva',
      'João Santos',
      'Ana Paula',
      'Carlos Oliveira',
      'Fernanda Lima',
    ][i % 5],
    contact_phone: null,
    contact_email: null,
    client_name: clients[i % clients.length],
    last_message: [
      'Olá! Gostaria de saber mais sobre o programa.',
      'Qual o valor do investimento?',
      'Posso agendar para semana que vem?',
      'Obrigado pelo atendimento!',
      'Tenho interesse, mas preciso pensar.',
    ][i % 5],
    last_message_role: i % 2 === 0 ? 'user' : 'assistant',
    last_message_at: new Date(Date.now() - i * 3600000).toISOString(),
    supervision_status: statuses[i % statuses.length],
    ai_enabled: statuses[i % statuses.length] !== 'ai_paused',
    supervision_notes: i % 3 === 0 ? 'Lead qualificado, aguardando retorno.' : null,
    scheduled_at: statuses[i % statuses.length] === 'scheduled'
      ? new Date(Date.now() + 86400000).toISOString()
      : null,
    converted_at: statuses[i % statuses.length] === 'converted'
      ? new Date(Date.now() - 3600000).toISOString()
      : null,
    supervision_updated_at: new Date(Date.now() - i * 1800000).toISOString(),
    message_count: Math.floor(Math.random() * 20) + 3,
  }));
}
