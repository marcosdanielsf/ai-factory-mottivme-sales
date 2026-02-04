import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: usePerformanceDrilldown
// Busca leads detalhados para drill-down na página de Performance
// Permite filtrar por cliente (responsável) e status do funil
// ============================================================================

export interface PerformanceDrilldownLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  responsavel: string;
  funil: string;
  tag: string;
  valorEstimado: number | null;
  lastMessage: string | null;
  createdAt: string | null;
}

export type DrilldownFilter = 
  | 'all'           // Todos os leads
  | 'responderam'   // Leads que avançaram (não são new_lead)
  | 'agendaram'     // status = booked, no_show, completed, won
  | 'fecharam'      // status = won
  | 'clientes';     // Lista de clientes (agregado)

interface UseDrilldownOptions {
  clientName?: string;    // Filtrar por cliente específico (lead_usuario_responsavel)
  filter: DrilldownFilter;
}

interface DrilldownState {
  leads: PerformanceDrilldownLead[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

// Mapeamento de status para filtros
const STATUS_MAP: Record<DrilldownFilter, string[]> = {
  all: [], // Todos
  responderam: ['booked', 'no_show', 'completed', 'qualifying', 'won', 'lost'], // Não new_lead
  agendaram: ['booked', 'no_show', 'completed', 'won'], // Agendaram
  fecharam: ['won'], // Apenas won
  clientes: [], // Não usado para leads, apenas agregação
};

export const usePerformanceDrilldown = () => {
  const [state, setState] = useState<DrilldownState>({
    leads: [],
    loading: false,
    error: null,
    totalCount: 0,
  });

  const fetchLeads = useCallback(async (options: UseDrilldownOptions) => {
    const { clientName, filter } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Buscar da tabela app_dash_principal (dados GHL)
      let query = supabase
        .from('app_dash_principal')
        .select('*');

      // Filtrar por cliente (responsável)
      if (clientName) {
        query = query.eq('lead_usuario_responsavel', clientName);
      }

      // Filtrar por status
      const statusList = STATUS_MAP[filter];
      if (statusList && statusList.length > 0) {
        query = query.in('status', statusList);
      } else if (filter === 'responderam') {
        // "Responderam" significa NÃO new_lead
        query = query.neq('status', 'new_lead');
      }

      // Ordenar por data de criação (se disponível) ou nome
      query = query.order('lead_usuario_responsavel', { ascending: true });

      // Limitar a 500 resultados para performance
      query = query.limit(500);

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Transformar dados para o formato esperado
      const leads: PerformanceDrilldownLead[] = (data || []).map((row: any) => ({
        id: row.id || row.lead_id || `${row.lead_usuario_responsavel}-${Math.random()}`,
        name: row.lead_nome || row.nome || 'Sem nome',
        phone: row.lead_telefone || row.telefone || '-',
        email: row.lead_email || row.email || '-',
        status: row.status || 'unknown',
        responsavel: row.lead_usuario_responsavel || 'SEM RESPONSÁVEL',
        funil: row.funil || '-',
        tag: row.tag || '-',
        valorEstimado: row.valor_estimado || row.monetary_value || null,
        lastMessage: row.ultima_mensagem || row.last_message || null,
        createdAt: row.created_at || row.data_criacao || null,
      }));

      setState({
        leads,
        loading: false,
        error: null,
        totalCount: leads.length,
      });

      return { success: true, data: leads };

    } catch (error: any) {
      console.error('[DrilldownError]', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao buscar leads',
      }));
      return { success: false, error: error.message };
    }
  }, []);

  const clearLeads = useCallback(() => {
    setState({
      leads: [],
      loading: false,
      error: null,
      totalCount: 0,
    });
  }, []);

  return {
    ...state,
    fetchLeads,
    clearLeads,
  };
};

export default usePerformanceDrilldown;
