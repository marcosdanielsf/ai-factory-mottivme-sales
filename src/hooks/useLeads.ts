import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lead } from '../types';

export type LeadFilter = 'Todos' | 'Hoje' | 'Amanhã' | 'Agendados';

interface UseLeadsOptions {
  filter?: LeadFilter;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

interface UseLeadsReturn {
  leads: Lead[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Função para formatar data de agendamento
const formatScheduledDate = (dateString: string | null): string | undefined => {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} às ${hours}:${minutes}`;
  } catch {
    return undefined;
  }
};

// Função para mapear status do banco para o tipo Lead
const mapStatus = (dbStatus: string | null): Lead['status'] => {
  const statusMap: Record<string, Lead['status']> = {
    'available': 'new_lead',
    'new': 'new_lead',
    'qualified': 'qualified',
    'call_booked': 'call_booked',
    'scheduled': 'scheduled',
    'proposal': 'proposal',
    'won': 'won',
    'lost': 'lost',
    'hot': 'qualified',
    'warm': 'new_lead',
    'cold': 'new_lead',
  };
  return statusMap[dbStatus?.toLowerCase() || ''] || 'new_lead';
};

export const useLeads = (options: UseLeadsOptions = {}): UseLeadsReturn => {
  const { filter = 'Todos', searchTerm = '', page = 1, pageSize = 20 } = options;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase não configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calcular offset para paginação
      const offset = (page - 1) * pageSize;

      // Query base - usando socialfy_leads que tem dados reais
      let query = supabase
        .from('socialfy_leads')
        .select('*', { count: 'exact' });

      // Aplicar filtro de busca
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      // Aplicar filtros de data/status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      if (filter === 'Hoje') {
        query = query
          .gte('outreach_sent_at', today.toISOString())
          .lt('outreach_sent_at', tomorrow.toISOString());
      } else if (filter === 'Amanhã') {
        query = query
          .gte('outreach_sent_at', tomorrow.toISOString())
          .lt('outreach_sent_at', dayAfterTomorrow.toISOString());
      } else if (filter === 'Agendados') {
        query = query.not('outreach_sent_at', 'is', null);
      }

      // Ordenação e paginação
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching leads:', queryError);
        throw queryError;
      }

      // Mapear dados do Supabase para o formato Lead
      const mappedLeads: Lead[] = (data || []).map((row: any) => ({
        id: row.id,
        ghl_contact_id: row.ghl_contact_id,
        name: row.name || 'Lead sem nome',
        phone: row.phone || row.whatsapp || '',
        email: row.email || '',
        status: row.outreach_sent_at ? 'scheduled' : mapStatus(row.status),
        work_permit: undefined,
        location_country: undefined,
        career_segment: row.vertical,
        budget_range: undefined,
        acquisition_channel: row.source || row.source_channel,
        created_at: row.created_at,
        updated_at: row.updated_at,
        scheduled_date: formatScheduledDate(row.outreach_sent_at || row.scraped_at),
        // Campos extras para enriquecimento
        instagram_handle: row.instagram_handle,
        company: row.company,
        icp_score: row.icp_score,
        avatar_url: row.avatar_url,
      }));

      setLeads(mappedLeads);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, page, pageSize]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, totalCount, loading, error, refetch: fetchLeads };
};

// Hook para buscar lead específico por ID
export const useLeadById = (id: string | null) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !isSupabaseConfigured()) {
      setLead(null);
      return;
    }

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: queryError } = await supabase
          .from('socialfy_leads')
          .select('*')
          .eq('id', id)
          .single();

        if (queryError) throw queryError;

        if (data) {
          setLead({
            id: data.id,
            ghl_contact_id: data.ghl_contact_id,
            name: data.name || 'Lead sem nome',
            phone: data.phone || data.whatsapp || '',
            email: data.email || '',
            status: data.outreach_sent_at ? 'scheduled' : mapStatus(data.status),
            created_at: data.created_at,
            updated_at: data.updated_at,
            scheduled_date: formatScheduledDate(data.outreach_sent_at || data.scraped_at),
          });
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching lead:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  return { lead, loading, error };
};

// Hook para buscar conversas de um lead
export const useLeadConversations = (leadId: string | null) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId || !isSupabaseConfigured()) {
      setMessages([]);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar mensagens da tabela agent_conversation_messages
        // Limite de 500 mensagens por conversa para evitar problemas de performance
        const { data, error: queryError } = await supabase
          .from('agent_conversation_messages')
          .select('*')
          .eq('conversation_id', leadId)
          .order('created_at', { ascending: true })
          .limit(500);

        if (queryError) throw queryError;

        setMessages(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [leadId]);

  return { messages, loading, error };
};
