import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Tipos para custos de cliente
export interface ClientCostSummary {
  location_id: string; // Pode conter múltiplos IDs separados por vírgula
  location_name: string;
  total_cost_usd: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_requests: number;
  total_conversations: number; // Contatos únicos (distinct contact_id)
  models_used: string[];
  canais_used: string[];
  avg_cost_per_request: number;
  last_activity?: string;
  location_ids: string[]; // Lista de todos os location_ids associados
}

export interface DailyCost {
  date: string;
  cost_usd: number;
  tokens_input: number;
  tokens_output: number;
  requests: number;
}

export interface ClientCostDetail {
  id: string;
  created_at: string;
  workflow_id: string;
  workflow_name: string;
  contact_name: string;
  modelo_ia: string;
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;
  canal: string;
  tipo_acao: string;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface UseClientCostsOptions {
  dateRange?: DateRange;
  clientName?: string; // Filtrar por cliente específico
  canalFilter?: string; // Filtrar por canal (sentinel, api, whatsapp, etc.)
  workflowFilter?: string; // Filtrar por workflow_name
  showInactive?: boolean; // Mostrar clientes inativos (sem atividade nos últimos 30 dias)
  inactiveDays?: number; // Dias para considerar inativo (padrão: 30)
}

interface UseClientCostsReturn {
  clients: ClientCostSummary[];
  allClients: ClientCostSummary[]; // Todos os clientes (para dropdown)
  allCanais: string[]; // Todos os canais disponíveis (para dropdown)
  allWorkflows: string[]; // Todos os workflows disponíveis (para dropdown)
  totalCost: number;
  totalRequests: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}


export const useClientCosts = (options: UseClientCostsOptions = {}): UseClientCostsReturn => {
  const {
    dateRange,
    clientName,
    canalFilter,
    workflowFilter,
    showInactive = false,
    inactiveDays = 30
  } = options;

  const [clients, setClients] = useState<ClientCostSummary[]>([]);
  const [allClients, setAllClients] = useState<ClientCostSummary[]>([]); // Para dropdown
  const [allCanais, setAllCanais] = useState<string[]>([]); // Para dropdown de canal
  const [allWorkflows, setAllWorkflows] = useState<string[]>([]); // Para dropdown de workflow
  const [totalCost, setTotalCost] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCosts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar se precisa filtrar por data
      const start = dateRange?.startDate || null;
      const end = dateRange?.endDate || null;
      const needsDateFilter = start !== null || end !== null;

      let result: ClientCostSummary[] = [];

      if (!needsDateFilter && !workflowFilter) {
        // Usar view agregada quando não há filtro de data (resolve limite de 1000 registros)
        const { data: viewData, error: viewError } = await supabase
          .from('vw_client_costs_summary')
          .select('*');

        if (viewError) {
          console.warn('[useClientCosts] View não disponível, usando fallback:', viewError.message);
          // Fallback para query direta se view não existir
          throw viewError;
        }

        result = (viewData || []).map((row: any) => ({
          location_id: row.location_id || 'unknown',
          location_name: row.location_name,
          total_cost_usd: row.total_cost_usd || 0,
          total_tokens_input: row.total_tokens_input || 0,
          total_tokens_output: row.total_tokens_output || 0,
          total_requests: row.total_requests || 0,
          total_conversations: row.total_conversations || 0,
          models_used: row.models_used || [],
          canais_used: row.canais_used || [],
          avg_cost_per_request: row.avg_cost_per_request || 0,
          last_activity: row.last_activity,
          location_ids: row.location_ids || [row.location_id || 'unknown'],
        }));
      } else {
        // Com filtro de data, precisa fazer query direta com agregação no frontend
        // Usar paginação para buscar todos os registros
        let allData: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('llm_costs')
            .select('location_id, location_name, custo_usd, tokens_input, tokens_output, modelo_ia, canal, contact_id, workflow_name, created_at')
            .range(offset, offset + pageSize - 1);

          if (start) {
            query = query.gte('created_at', start.toISOString());
          }
          if (end) {
            query = query.lte('created_at', end.toISOString());
          }
          if (canalFilter) {
            query = query.eq('canal', canalFilter);
          }
          if (workflowFilter) {
            query = query.eq('workflow_name', workflowFilter);
          }

          const { data, error: queryError } = await query;

          if (queryError) throw queryError;

          if (data && data.length > 0) {
            allData = allData.concat(data);
            offset += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        // Agrupar por location_name
        const clientCosts: Record<string, {
          location_ids: Set<string>;
          contact_ids: Set<string>;
          location_name: string;
          total_cost_usd: number;
          total_tokens_input: number;
          total_tokens_output: number;
          total_requests: number;
          models_used: Set<string>;
          canais_used: Set<string>;
          last_activity: string;
        }> = {};

        allData.forEach((row: any) => {
          const clientName = row.location_name || 'Desconhecido';
          const lid = row.location_id || 'unknown';

          if (!clientCosts[clientName]) {
            clientCosts[clientName] = {
              location_ids: new Set(),
              contact_ids: new Set(),
              location_name: clientName,
              total_cost_usd: 0,
              total_tokens_input: 0,
              total_tokens_output: 0,
              total_requests: 0,
              models_used: new Set(),
              canais_used: new Set(),
              last_activity: row.created_at,
            };
          }
          clientCosts[clientName].location_ids.add(lid);
          if (row.contact_id) clientCosts[clientName].contact_ids.add(row.contact_id);
          clientCosts[clientName].total_cost_usd += row.custo_usd || 0;
          clientCosts[clientName].total_tokens_input += row.tokens_input || 0;
          clientCosts[clientName].total_tokens_output += row.tokens_output || 0;
          clientCosts[clientName].total_requests += 1;
          if (row.modelo_ia) clientCosts[clientName].models_used.add(row.modelo_ia);
          if (row.canal) clientCosts[clientName].canais_used.add(row.canal);
          if (row.created_at > clientCosts[clientName].last_activity) {
            clientCosts[clientName].last_activity = row.created_at;
          }
        });

        result = Object.values(clientCosts)
          .map(c => {
            const locationIdsArray = Array.from(c.location_ids);
            return {
              ...c,
              location_id: locationIdsArray[0] || 'unknown',
              location_ids: locationIdsArray,
              total_conversations: c.contact_ids.size,
              models_used: Array.from(c.models_used),
              canais_used: Array.from(c.canais_used),
              avg_cost_per_request: c.total_requests > 0 ? c.total_cost_usd / c.total_requests : 0,
            };
          })
          .sort((a, b) => b.total_cost_usd - a.total_cost_usd);
      }

      // Guardar todos os clientes para o dropdown
      setAllClients(result);

      // Extrair canais únicos
      const canaisSet = new Set<string>();
      result.forEach(c => c.canais_used?.forEach((canal: string) => canaisSet.add(canal)));
      setAllCanais(Array.from(canaisSet).sort());

      // Extrair workflows únicos (query leve, apenas nomes distintos)
      try {
        const { data: wfData } = await supabase
          .from('llm_costs')
          .select('workflow_name')
          .not('workflow_name', 'is', null)
          .limit(1000);
        const wfSet = new Set<string>();
        (wfData || []).forEach((r: any) => { if (r.workflow_name) wfSet.add(r.workflow_name); });
        setAllWorkflows(Array.from(wfSet).sort());
      } catch { /* ignore */ }

      // Aplicar filtros
      let filteredResult = result;

      // Filtro por cliente específico
      if (clientName) {
        filteredResult = filteredResult.filter(c =>
          c.location_name.toLowerCase() === clientName.toLowerCase()
        );
      }

      // Filtro por canal
      if (canalFilter) {
        filteredResult = filteredResult.filter(c =>
          c.canais_used?.some((canal: string) => canal === canalFilter)
        );
      }

      // Filtro de ativos/inativos (baseado em última atividade)
      if (!showInactive) {
        const inactiveThreshold = new Date();
        inactiveThreshold.setDate(inactiveThreshold.getDate() - inactiveDays);
        filteredResult = filteredResult.filter(c => {
          if (!c.last_activity) return false;
          return new Date(c.last_activity) >= inactiveThreshold;
        });
      }

      // Calcular totais (baseado nos filtrados)
      const total = filteredResult.reduce((acc, c) => acc + c.total_cost_usd, 0);
      const requests = filteredResult.reduce((acc, c) => acc + c.total_requests, 0);

      setClients(filteredResult);
      setTotalCost(total);
      setTotalRequests(requests);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar custos');
      console.error('Error fetching costs:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate, dateRange?.endDate, clientName, canalFilter, workflowFilter, showInactive, inactiveDays]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  return { clients, allClients, allCanais, allWorkflows, totalCost, totalRequests, loading, error, refetch: fetchCosts };
};

// Hook para custos detalhados de um cliente especifico
// Agora recebe location_name ao invés de location_id
export const useClientCostDetails = (locationName: string | null, options: UseClientCostsOptions = {}) => {
  const { dateRange } = options;

  const [costs, setCosts] = useState<ClientCostDetail[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationName || !isSupabaseConfigured()) {
      setCosts([]);
      setDailyCosts([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar por location_name ao invés de location_id
        // Aumentado limite para 500 (detalhes do cliente podem ter muitos registros)
        let query = supabase
          .from('llm_costs')
          .select('*')
          .eq('location_name', locationName)
          .order('created_at', { ascending: false })
          .limit(500);

        // Aplicar filtro de data
        if (dateRange?.startDate) {
          query = query.gte('created_at', dateRange.startDate.toISOString());
        }
        if (dateRange?.endDate) {
          query = query.lte('created_at', dateRange.endDate.toISOString());
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        // Mapear detalhes
        const details: ClientCostDetail[] = (data || []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          workflow_id: row.workflow_id || '',
          workflow_name: row.workflow_name || 'N/A',
          contact_name: row.contact_name || 'N/A',
          modelo_ia: row.modelo_ia || 'N/A',
          tokens_input: row.tokens_input || 0,
          tokens_output: row.tokens_output || 0,
          custo_usd: row.custo_usd || 0,
          canal: row.canal || 'N/A',
          tipo_acao: row.tipo_acao || 'N/A',
        }));

        setCosts(details);

        // Calcular custos diarios
        const dailyMap: Record<string, DailyCost> = {};
        (data || []).forEach((row: any) => {
          const date = new Date(row.created_at).toISOString().split('T')[0];
          if (!dailyMap[date]) {
            dailyMap[date] = { date, cost_usd: 0, tokens_input: 0, tokens_output: 0, requests: 0 };
          }
          dailyMap[date].cost_usd += row.custo_usd || 0;
          dailyMap[date].tokens_input += row.tokens_input || 0;
          dailyMap[date].tokens_output += row.tokens_output || 0;
          dailyMap[date].requests += 1;
        });

        setDailyCosts(Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date)));
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching cost details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [locationName, dateRange?.startDate, dateRange?.endDate]);

  return { costs, dailyCosts, loading, error };
};

// Hook para custos globais (resumo geral)
// Usa view vw_global_cost_summary para evitar limite de 1000 registros
export const useGlobalCostSummary = () => {
  const [summary, setSummary] = useState({
    total_cost_usd: 0,
    total_tokens: 0,
    total_requests: 0,
    total_clients: 0,
    avg_cost_per_client: 0,
    top_model: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);

        // Tentar usar view agregada primeiro
        const { data: viewData, error: viewError } = await supabase
          .from('vw_global_cost_summary')
          .select('*')
          .single();

        if (!viewError && viewData) {
          setSummary({
            total_cost_usd: viewData.total_cost_usd || 0,
            total_tokens: viewData.total_tokens || 0,
            total_requests: viewData.total_requests || 0,
            total_clients: viewData.total_clients || 0,
            avg_cost_per_client: viewData.avg_cost_per_client || 0,
            top_model: viewData.top_model || 'N/A',
          });
          return;
        }

        // Fallback: usar view de clientes para calcular
        console.warn('[useGlobalCostSummary] View não disponível, usando fallback');
        const { data: clientsData, error: clientsError } = await supabase
          .from('vw_client_costs_summary')
          .select('*');

        if (clientsError) throw clientsError;

        const totalCost = (clientsData || []).reduce((acc: number, r: any) => acc + (r.total_cost_usd || 0), 0);
        const totalTokens = (clientsData || []).reduce((acc: number, r: any) => acc + (r.total_tokens_input || 0) + (r.total_tokens_output || 0), 0);
        const totalRequests = (clientsData || []).reduce((acc: number, r: any) => acc + (r.total_requests || 0), 0);
        const totalClients = clientsData?.length || 0;

        // Pegar modelo mais usado do primeiro cliente (ordenado por custo)
        const topModel = clientsData?.[0]?.models_used?.[0] || 'N/A';

        setSummary({
          total_cost_usd: totalCost,
          total_tokens: totalTokens,
          total_requests: totalRequests,
          total_clients: totalClients,
          avg_cost_per_client: totalClients > 0 ? totalCost / totalClients : 0,
          top_model: topModel,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { summary, loading, error };
};
