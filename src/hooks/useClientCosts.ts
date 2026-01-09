import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Tipos para custos de cliente
export interface ClientCostSummary {
  location_id: string;
  location_name: string;
  total_cost_usd: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_requests: number;
  models_used: string[];
  avg_cost_per_request: number;
  last_activity?: string;
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
  workflow_name: string;
  contact_name: string;
  modelo_ia: string;
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;
  canal: string;
  tipo_acao: string;
}

interface UseClientCostsOptions {
  dateRange?: 'today' | '7d' | '30d' | 'all';
}

interface UseClientCostsReturn {
  clients: ClientCostSummary[];
  totalCost: number;
  totalRequests: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Helper para calcular data de inicio
const getStartDate = (range: string): Date | null => {
  const now = new Date();
  switch (range) {
    case 'today':
      now.setHours(0, 0, 0, 0);
      return now;
    case '7d':
      now.setDate(now.getDate() - 7);
      return now;
    case '30d':
      now.setDate(now.getDate() - 30);
      return now;
    default:
      return null;
  }
};

export const useClientCosts = (options: UseClientCostsOptions = {}): UseClientCostsReturn => {
  const { dateRange = '30d' } = options;

  const [clients, setClients] = useState<ClientCostSummary[]>([]);
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

      // Query base
      let query = supabase
        .from('llm_costs')
        .select('location_id, location_name, custo_usd, tokens_input, tokens_output, modelo_ia, created_at');

      // Aplicar filtro de data
      const startDate = getStartDate(dateRange);
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching costs:', queryError);
        throw queryError;
      }

      // Agrupar por location_id
      const clientCosts: Record<string, {
        location_id: string;
        location_name: string;
        total_cost_usd: number;
        total_tokens_input: number;
        total_tokens_output: number;
        total_requests: number;
        models_used: Set<string>;
        last_activity: string;
      }> = {};

      (data || []).forEach((row: any) => {
        const lid = row.location_id || 'unknown';
        if (!clientCosts[lid]) {
          clientCosts[lid] = {
            location_id: lid,
            location_name: row.location_name || 'Desconhecido',
            total_cost_usd: 0,
            total_tokens_input: 0,
            total_tokens_output: 0,
            total_requests: 0,
            models_used: new Set(),
            last_activity: row.created_at,
          };
        }
        clientCosts[lid].total_cost_usd += row.custo_usd || 0;
        clientCosts[lid].total_tokens_input += row.tokens_input || 0;
        clientCosts[lid].total_tokens_output += row.tokens_output || 0;
        clientCosts[lid].total_requests += 1;
        if (row.modelo_ia) clientCosts[lid].models_used.add(row.modelo_ia);
        if (row.created_at > clientCosts[lid].last_activity) {
          clientCosts[lid].last_activity = row.created_at;
        }
      });

      // Converter para array e calcular medias
      const result: ClientCostSummary[] = Object.values(clientCosts)
        .map(c => ({
          ...c,
          models_used: Array.from(c.models_used),
          avg_cost_per_request: c.total_requests > 0 ? c.total_cost_usd / c.total_requests : 0,
        }))
        .sort((a, b) => b.total_cost_usd - a.total_cost_usd);

      // Calcular totais
      const total = result.reduce((acc, c) => acc + c.total_cost_usd, 0);
      const requests = result.reduce((acc, c) => acc + c.total_requests, 0);

      setClients(result);
      setTotalCost(total);
      setTotalRequests(requests);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar custos');
      console.error('Error fetching costs:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  return { clients, totalCost, totalRequests, loading, error, refetch: fetchCosts };
};

// Hook para custos detalhados de um cliente especifico
export const useClientCostDetails = (locationId: string | null, options: UseClientCostsOptions = {}) => {
  const { dateRange = '30d' } = options;

  const [costs, setCosts] = useState<ClientCostDetail[]>([]);
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId || !isSupabaseConfigured()) {
      setCosts([]);
      setDailyCosts([]);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('llm_costs')
          .select('*')
          .eq('location_id', locationId)
          .order('created_at', { ascending: false })
          .limit(100);

        const startDate = getStartDate(dateRange);
        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        // Mapear detalhes
        const details: ClientCostDetail[] = (data || []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
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
  }, [locationId, dateRange]);

  return { costs, dailyCosts, loading, error };
};

// Hook para custos globais (resumo geral)
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

        const { data, error: queryError } = await supabase
          .from('llm_costs')
          .select('location_id, custo_usd, tokens_input, tokens_output, modelo_ia');

        if (queryError) throw queryError;

        const uniqueClients = new Set((data || []).map((r: any) => r.location_id));
        const totalCost = (data || []).reduce((acc: number, r: any) => acc + (r.custo_usd || 0), 0);
        const totalTokens = (data || []).reduce((acc: number, r: any) => acc + (r.tokens_input || 0) + (r.tokens_output || 0), 0);

        // Contar modelos
        const modelCount: Record<string, number> = {};
        (data || []).forEach((r: any) => {
          if (r.modelo_ia) {
            modelCount[r.modelo_ia] = (modelCount[r.modelo_ia] || 0) + 1;
          }
        });
        const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        setSummary({
          total_cost_usd: totalCost,
          total_tokens: totalTokens,
          total_requests: data?.length || 0,
          total_clients: uniqueClients.size,
          avg_cost_per_client: uniqueClients.size > 0 ? totalCost / uniqueClients.size : 0,
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
