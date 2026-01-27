import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useDrilldownLeads
// Busca leads específicos baseado no tipo de métrica selecionada
// ============================================================================

export type MetricType = 
  | 'total_leads'
  | 'leads_novos'
  | 'responderam'
  | 'agendaram'
  | 'compareceram'
  | 'fecharam'
  | 'sem_resposta_24h'
  | 'follow_ups_pendentes'
  | 'leads_esfriando'
  | 'no_shows';

export interface DashboardDrilldownLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  location_id?: string;
  source?: string;
}

interface DrilldownState {
  leads: DashboardDrilldownLead[];
  loading: boolean;
  error: string | null;
  total: number;
}

type Period = 'hoje' | '7d' | '30d' | '90d';

// Mapeamento de status para categorias do funil
const STATUS_NOVOS = ['novo', 'new', 'available', 'new_lead', 'cold'];
const STATUS_RESPONDERAM = ['in_cadence', 'responding', 'replied', 'warm', 'hot', 'qualified', 'responded', 'engaged', 'interested'];
const STATUS_AGENDARAM = ['scheduled', 'call_booked', 'booked', 'appointment', 'proposal', 'agendado'];
const STATUS_COMPARECERAM = ['attended', 'showed_up', 'completed', 'showed', 'compareceu'];
const STATUS_FECHARAM = ['converted', 'won', 'closed', 'customer', 'sale'];
const STATUS_NO_SHOW = ['no_show', 'noshow', 'no-show', 'missed'];

export const useDrilldownLeads = (
  metricType: MetricType | null,
  period: Period = '30d'
) => {
  const [state, setState] = useState<DrilldownState>({
    leads: [],
    loading: false,
    error: null,
    total: 0
  });

  const fetchLeads = useCallback(async () => {
    if (!metricType) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Calcular data de início baseado no período
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'hoje':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Buscar leads da tabela socialfy_leads
      let query = supabase
        .from('socialfy_leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('updated_at', { ascending: false });

      // Aplicar filtros baseado no tipo de métrica
      const { data: allLeads, error: leadsError } = await query;

      if (leadsError) throw leadsError;

      let filteredLeads: any[] = [];
      const oneDayMs = 24 * 60 * 60 * 1000;
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

      // Buscar IDs de leads que responderam (têm mensagem de usuário)
      const { data: respondedData } = await supabase
        .from('ai_factory_conversations')
        .select('lead_id')
        .eq('role', 'user')
        .gte('created_at', startDate.toISOString());

      const respondedLeadIds = new Set(
        (respondedData || []).map((c: any) => c.lead_id).filter(Boolean)
      );

      switch (metricType) {
        case 'total_leads':
          filteredLeads = allLeads || [];
          break;

        case 'leads_novos':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            return STATUS_NOVOS.includes(status);
          });
          break;

        case 'responderam':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            const hasResponse = respondedLeadIds.has(lead.id);
            return hasResponse ||
              STATUS_RESPONDERAM.includes(status) ||
              STATUS_AGENDARAM.includes(status) ||
              STATUS_COMPARECERAM.includes(status) ||
              STATUS_FECHARAM.includes(status);
          });
          break;

        case 'agendaram':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            return STATUS_AGENDARAM.includes(status) ||
              STATUS_COMPARECERAM.includes(status) ||
              STATUS_FECHARAM.includes(status);
          });
          break;

        case 'compareceram':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            return STATUS_COMPARECERAM.includes(status) ||
              STATUS_FECHARAM.includes(status);
          });
          break;

        case 'fecharam':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            return STATUS_FECHARAM.includes(status);
          });
          break;

        case 'sem_resposta_24h':
          filteredLeads = (allLeads || []).filter(lead => {
            const created = new Date(lead.created_at);
            const status = (lead.status || '').toLowerCase().trim();
            const timeSinceCreated = now.getTime() - created.getTime();
            return timeSinceCreated > oneDayMs && STATUS_NOVOS.includes(status);
          });
          break;

        case 'follow_ups_pendentes':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            // Leads que estão em processo mas ainda não agendaram
            return STATUS_RESPONDERAM.includes(status) && 
              !STATUS_AGENDARAM.includes(status);
          });
          break;

        case 'leads_esfriando':
          filteredLeads = (allLeads || []).filter(lead => {
            const updated = new Date(lead.updated_at || lead.created_at);
            const status = (lead.status || '').toLowerCase().trim();
            const timeSinceUpdated = now.getTime() - updated.getTime();
            return ['warm', 'interested', 'engaged'].includes(status) && 
              timeSinceUpdated > threeDaysMs;
          });
          break;

        case 'no_shows':
          filteredLeads = (allLeads || []).filter(lead => {
            const status = (lead.status || '').toLowerCase().trim();
            return STATUS_NO_SHOW.includes(status);
          });
          break;

        default:
          filteredLeads = [];
      }

      // Buscar última mensagem de cada lead
      const leadIds = filteredLeads.map(l => l.id);
      let messagesMap: Record<string, { content: string; created_at: string }> = {};

      if (leadIds.length > 0) {
        // Buscar mensagens em batches para evitar query muito grande
        const batchSize = 50;
        for (let i = 0; i < leadIds.length; i += batchSize) {
          const batch = leadIds.slice(i, i + batchSize);
          const { data: messagesData } = await supabase
            .from('n8n_historico_mensagens')
            .select('lead_id, content, created_at')
            .in('lead_id', batch)
            .order('created_at', { ascending: false });

          (messagesData || []).forEach((msg: any) => {
            if (!messagesMap[msg.lead_id]) {
              messagesMap[msg.lead_id] = {
                content: msg.content,
                created_at: msg.created_at
              };
            }
          });
        }

        // Fallback: tentar ai_factory_conversations se n8n_historico_mensagens não tiver dados
        if (Object.keys(messagesMap).length === 0) {
          for (let i = 0; i < leadIds.length; i += batchSize) {
            const batch = leadIds.slice(i, i + batchSize);
            const { data: conversationsData } = await supabase
              .from('ai_factory_conversations')
              .select('lead_id, content, created_at')
              .in('lead_id', batch)
              .order('created_at', { ascending: false });

            (conversationsData || []).forEach((msg: any) => {
              if (!messagesMap[msg.lead_id]) {
                messagesMap[msg.lead_id] = {
                  content: msg.content,
                  created_at: msg.created_at
                };
              }
            });
          }
        }
      }

      // Formatar leads para exibição
      const formattedLeads: DashboardDrilldownLead[] = filteredLeads.map(lead => ({
        id: lead.id,
        name: lead.name || lead.nome || lead.full_name || 'Sem nome',
        phone: lead.phone || lead.telefone || lead.whatsapp || '-',
        email: lead.email || undefined,
        status: lead.status || 'unknown',
        created_at: lead.created_at,
        updated_at: lead.updated_at || lead.created_at,
        last_message: messagesMap[lead.id]?.content || undefined,
        last_message_at: messagesMap[lead.id]?.created_at || undefined,
        location_id: lead.location_id || lead.locationId || undefined,
        source: lead.source || lead.acquisition_channel || undefined
      }));

      setState({
        leads: formattedLeads,
        loading: false,
        error: null,
        total: formattedLeads.length
      });

    } catch (error: any) {
      console.error('Erro ao buscar leads para drill-down:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar leads'
      }));
    }
  }, [metricType, period]);

  useEffect(() => {
    if (metricType) {
      fetchLeads();
    } else {
      setState({ leads: [], loading: false, error: null, total: 0 });
    }
  }, [metricType, period, fetchLeads]);

  return {
    ...state,
    refetch: fetchLeads
  };
};

export default useDrilldownLeads;
