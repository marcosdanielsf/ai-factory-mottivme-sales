import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface WorkflowCostSummary {
  workflow_name: string;
  workflow_id: string;
  total_cost_usd: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_requests: number;
  avg_cost_per_request: number;
  models_used: string[];
  clients_using: string[];
  total_clients: number;
  last_activity: string;
}

export interface WorkflowClientBreakdown {
  location_name: string;
  total_cost_usd: number;
  total_requests: number;
  total_tokens_input: number;
  total_tokens_output: number;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface UseWorkflowCostsOptions {
  dateRange?: DateRange;
}

interface UseWorkflowCostsReturn {
  workflows: WorkflowCostSummary[];
  totalCost: number;
  totalRequests: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWorkflowCosts = (options: UseWorkflowCostsOptions = {}): UseWorkflowCostsReturn => {
  const { dateRange } = options;

  const [workflows, setWorkflows] = useState<WorkflowCostSummary[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  const fetchWorkflows = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const start = dateRange?.startDate || null;
      const end = dateRange?.endDate || null;
      const needsDateFilter = start !== null || end !== null;

      if (!needsDateFilter) {
        // Usar view agregada
        const { data, error: viewError } = await supabase
          .from('vw_workflow_costs_summary')
          .select('*');

        if (viewError) throw viewError;

        const result: WorkflowCostSummary[] = (data || []).map((row: any) => ({
          workflow_name: row.workflow_name || 'N/A',
          workflow_id: row.workflow_id || '',
          total_cost_usd: row.total_cost_usd || 0,
          total_tokens_input: row.total_tokens_input || 0,
          total_tokens_output: row.total_tokens_output || 0,
          total_requests: row.total_requests || 0,
          avg_cost_per_request: row.avg_cost_per_request || 0,
          models_used: row.models_used || [],
          clients_using: row.clients_using || [],
          total_clients: row.total_clients || 0,
          last_activity: row.last_activity || '',
        }));

        setWorkflows(result);
        setTotalCost(result.reduce((acc, w) => acc + w.total_cost_usd, 0));
        setTotalRequests(result.reduce((acc, w) => acc + w.total_requests, 0));
      } else {
        // Com filtro de data: query direta com agregacao no frontend
        let allData: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('llm_costs')
            .select('workflow_id, workflow_name, custo_usd, tokens_input, tokens_output, modelo_ia, location_name, created_at')
            .not('workflow_name', 'is', null)
            .range(offset, offset + pageSize - 1);

          if (start) query = query.gte('created_at', start.toISOString());
          if (end) query = query.lte('created_at', end.toISOString());

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

        // Agrupar por workflow_name + workflow_id
        const wfMap: Record<string, {
          workflow_name: string;
          workflow_id: string;
          total_cost_usd: number;
          total_tokens_input: number;
          total_tokens_output: number;
          total_requests: number;
          models_used: Set<string>;
          clients_using: Set<string>;
          last_activity: string;
        }> = {};

        allData.forEach((row: any) => {
          const key = `${row.workflow_name}||${row.workflow_id || ''}`;
          if (!wfMap[key]) {
            wfMap[key] = {
              workflow_name: row.workflow_name,
              workflow_id: row.workflow_id || '',
              total_cost_usd: 0,
              total_tokens_input: 0,
              total_tokens_output: 0,
              total_requests: 0,
              models_used: new Set(),
              clients_using: new Set(),
              last_activity: row.created_at,
            };
          }
          const wf = wfMap[key];
          wf.total_cost_usd += row.custo_usd || 0;
          wf.total_tokens_input += row.tokens_input || 0;
          wf.total_tokens_output += row.tokens_output || 0;
          wf.total_requests += 1;
          if (row.modelo_ia) wf.models_used.add(row.modelo_ia);
          if (row.location_name) wf.clients_using.add(row.location_name);
          if (row.created_at > wf.last_activity) wf.last_activity = row.created_at;
        });

        const result: WorkflowCostSummary[] = Object.values(wfMap)
          .map(wf => ({
            ...wf,
            avg_cost_per_request: wf.total_requests > 0 ? wf.total_cost_usd / wf.total_requests : 0,
            models_used: Array.from(wf.models_used),
            clients_using: Array.from(wf.clients_using),
            total_clients: wf.clients_using.size,
          }))
          .sort((a, b) => b.total_cost_usd - a.total_cost_usd);

        setWorkflows(result);
        setTotalCost(result.reduce((acc, w) => acc + w.total_cost_usd, 0));
        setTotalRequests(result.reduce((acc, w) => acc + w.total_requests, 0));
      }
    } catch (err: any) {
      retryCountRef.current += 1;
      setError(err.message || 'Erro ao carregar custos por workflow');
      console.error('Error fetching workflow costs:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  useEffect(() => {
    if (retryCountRef.current > 2) return;
    fetchWorkflows();
  }, [fetchWorkflows]);

  return { workflows, totalCost, totalRequests, loading, error, refetch: fetchWorkflows };
};

// Hook para breakdown de clientes dentro de um workflow
export const useWorkflowClientBreakdown = (workflowName: string | null, dateRange?: DateRange) => {
  const [clients, setClients] = useState<WorkflowClientBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workflowName || !isSupabaseConfigured()) {
      setClients([]);
      return;
    }

    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        setError(null);

        let allData: any[] = [];
        let offset = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          let query = supabase
            .from('llm_costs')
            .select('location_name, custo_usd, tokens_input, tokens_output')
            .eq('workflow_name', workflowName)
            .range(offset, offset + pageSize - 1);

          if (dateRange?.startDate) query = query.gte('created_at', dateRange.startDate.toISOString());
          if (dateRange?.endDate) query = query.lte('created_at', dateRange.endDate.toISOString());

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

        const clientMap: Record<string, WorkflowClientBreakdown> = {};
        allData.forEach((row: any) => {
          const name = row.location_name || 'Desconhecido';
          if (!clientMap[name]) {
            clientMap[name] = {
              location_name: name,
              total_cost_usd: 0,
              total_requests: 0,
              total_tokens_input: 0,
              total_tokens_output: 0,
            };
          }
          clientMap[name].total_cost_usd += row.custo_usd || 0;
          clientMap[name].total_requests += 1;
          clientMap[name].total_tokens_input += row.tokens_input || 0;
          clientMap[name].total_tokens_output += row.tokens_output || 0;
        });

        setClients(
          Object.values(clientMap).sort((a, b) => b.total_cost_usd - a.total_cost_usd)
        );
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching workflow client breakdown:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [workflowName, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  return { clients, loading, error };
};
