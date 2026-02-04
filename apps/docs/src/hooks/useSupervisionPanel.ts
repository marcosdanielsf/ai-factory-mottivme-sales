import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

// Campos específicos em vez de SELECT *
const CONVERSATION_FIELDS = `
  conversation_id,
  session_id,
  location_id,
  contact_name,
  contact_phone,
  contact_email,
  client_name,
  last_message,
  last_message_role,
  last_message_at,
  supervision_status,
  ai_enabled,
  supervision_notes,
  scheduled_at,
  converted_at,
  supervision_updated_at,
  message_count,
  channel
`;

// View a usar (v4 corrige duplicatas e nomes)
const SUPERVISION_VIEW = 'vw_supervision_conversations_v4';

export const useSupervisionPanel = (): UseSupervisionPanelReturn => {
  const [conversations, setConversations] = useState<SupervisionConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupervisionFilters>({
    status: 'all',
  });

  // Debounce do search - evita queries excessivas
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search || '');
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.time('[SupervisionPanel] fetch-conversations');

      // Usa a view original (v3 tinha bugs de nomes e duplicatas)
      let query = supabase
        .from(SUPERVISION_VIEW)
        .select(CONVERSATION_FIELDS)
        .order('last_message_at', { ascending: false })
        .limit(50); // Reduzido de 100 para 50 para melhor performance

      // Aplicar filtros basicos
      if (filters.status && filters.status !== 'all') {
        query = query.eq('supervision_status', filters.status);
      }

      // Usar debouncedSearch em vez de filters.search
      if (debouncedSearch) {
        query = query.or(
          `contact_name.ilike.%${debouncedSearch}%,contact_phone.ilike.%${debouncedSearch}%,last_message.ilike.%${debouncedSearch}%`
        );
      }

      if (filters.dateFrom) {
        query = query.gte('last_message_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('last_message_at', filters.dateTo);
      }

      // Novos filtros (Fase 2)
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }

      if (filters.channel) {
        query = query.eq('channel', filters.channel);
      }

      if (filters.etapaFunil) {
        query = query.eq('etapa_funil', filters.etapaFunil);
      }

      if (filters.responsavel) {
        query = query.eq('usuario_responsavel', filters.responsavel);
      }

      // Filtro de qualidade (Fase 3) - desabilitado temporariamente (campo não existe na view original)
      // TODO: Adicionar quality_issues_count na view vw_supervision_conversations
      // if (filters.hasQualityIssues) {
      //   query = query.gt('quality_issues_count', 0);
      // }

      // Filtro sem resposta (Fase 4) - última mensagem foi do user (lead)
      if (filters.noResponse) {
        query = query.eq('last_message_role', 'user');
      }

      const { data, error: fetchError } = await query;

      console.timeEnd('[SupervisionPanel] fetch-conversations');

      if (fetchError) throw fetchError;

      // Dedupe por conversation_id (workaround para bug na view)
      const uniqueConversations = data ? 
        Array.from(new Map((data as SupervisionConversation[]).map(c => [c.conversation_id, c])).values()) 
        : [];
      
      console.log(`[SupervisionPanel] Carregadas ${data?.length || 0} conversas (${uniqueConversations.length} únicas)`);
      setConversations(uniqueConversations);
    } catch (err: any) {
      console.timeEnd('[SupervisionPanel] fetch-conversations');
      console.error('Error fetching supervision conversations:', err);

      // Fallback para mock se view nao existir
      if (err.message?.includes('does not exist') || err.message?.includes('vw_supervision_conversations')) {
        try {
          console.log('[SupervisionPanel] Tentando fallback para view antiga...');
          // Tenta view antiga
          const { data: fallbackData } = await supabase
            .from('vw_supervision_conversations')
            .select(CONVERSATION_FIELDS)
            .order('last_message_at', { ascending: false })
            .limit(50);

          if (fallbackData) {
            setConversations(fallbackData as SupervisionConversation[]);
            setError(null);
            return;
          }
        } catch {
          // Se falhar, usa mock
          setConversations(getMockConversations());
          setError(null);
          return;
        }
      }

      setError(err.message || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.dateFrom, filters.dateTo, filters.locationId, filters.channel, filters.etapaFunil, filters.responsavel, filters.hasQualityIssues, filters.noResponse, debouncedSearch]);

  // Fetch inicial e quando filtros mudam
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Polling SEPARADO - usa ref para evitar stale closure
  const fetchConversationsRef = useRef(fetchConversations);
  fetchConversationsRef.current = fetchConversations;

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[SupervisionPanel] Polling triggered');
      fetchConversationsRef.current();
    }, 60000); // 60s

    return () => clearInterval(interval);
  }, []); // Array vazio - usa ref

  // Stats memoizadas - evita recálculo a cada render
  const stats = useMemo(() => ({
    total: conversations.length,
    aiActive: conversations.filter((c) => c.supervision_status === 'ai_active').length,
    aiPaused: conversations.filter((c) => c.supervision_status === 'ai_paused').length,
    scheduled: conversations.filter((c) => c.supervision_status === 'scheduled').length,
    converted: conversations.filter((c) => c.supervision_status === 'converted').length,
  }), [conversations]);

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
