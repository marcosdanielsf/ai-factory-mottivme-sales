import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { getErrorMessage } from "../../lib/getErrorMessage";

// Tipos locais para a visao task-centric
export type ExecutorType = 'agent' | 'worker' | 'clone' | 'human';

export interface AiosTaskExpanded {
  id: string;
  title: string;
  description: string | null;
  status: string;
  cost: number;
  created_at: string;
  completed_at: string | null;
  story_id: string;
  phase_id: string;
  assigned_agent_id: string | null;
  // Campos enriquecidos
  agent_name: string | null;
  story_title: string | null;
  squad_id: string | null;
  squad_name: string | null;
  // Derivado do metadata/config do agente
  executor_type: ExecutorType;
  duration_ms: number | null;
}

export interface TaskDaySummary {
  date: string;
  count: number;
  cost: number;
}

export interface ExecutorDistribution {
  executor_type: ExecutorType;
  count: number;
  cost: number;
  label: string;
  color: string;
}

export interface TaskSuggestion {
  task_title: string;
  agent_name: string;
  count: number;
  avg_cost: number;
  total_cost: number;
  suggestion: string;
}

interface UseAiosTasksExpandedFilters {
  squad_id?: string;
  agent_id?: string;
  period?: '7d' | '30d' | '90d';
  executor_type?: ExecutorType | 'all';
  status?: string | 'all';
}

const EXECUTOR_COLORS: Record<ExecutorType, string> = {
  agent: '#6366f1',
  worker: '#10b981',
  clone: '#f59e0b',
  human: '#8b5cf6',
};

const EXECUTOR_LABELS: Record<ExecutorType, string> = {
  agent: 'Agent',
  worker: 'Worker',
  clone: 'Clone',
  human: 'Humano',
};

function getDateFrom(period: '7d' | '30d' | '90d'): string {
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 7);
  else if (period === '30d') d.setDate(d.getDate() - 30);
  else d.setDate(d.getDate() - 90);
  return d.toISOString();
}

function inferExecutorType(agentConfig: Record<string, unknown> | null): ExecutorType {
  if (!agentConfig) return 'agent';
  const mode = (agentConfig.executor_type as string) ?? (agentConfig.mode as string) ?? '';
  if (mode === 'worker') return 'worker';
  if (mode === 'clone') return 'clone';
  if (mode === 'human') return 'human';
  return 'agent';
}

export function useAiosTasksExpanded(filters: UseAiosTasksExpandedFilters = {}) {
  const [rawTasks, setRawTasks] = useState<AiosTaskExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const period = filters.period ?? '30d';
  // Memoizar dateFrom para evitar recalculo a cada render (getDateFrom usa new Date())
  const dateFrom = useMemo(() => getDateFrom(period), [period]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar tasks com join em stories e agentes
      let query = supabase
        .from('aios_tasks')
        .select(`
          id,
          title,
          description,
          status,
          cost,
          created_at,
          completed_at,
          story_id,
          phase_id,
          assigned_agent_id,
          aios_stories!story_id (
            title,
            squad_id,
            aios_squads!squad_id (
              id,
              name
            )
          ),
          aios_agents!assigned_agent_id (
            name,
            config
          )
        `)
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters.agent_id) {
        query = query.eq('assigned_agent_id', filters.agent_id);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const expanded: AiosTaskExpanded[] = (data ?? []).map((t: any) => {
        const story = t.aios_stories as any;
        const agent = t.aios_agents as any;
        const squad = story?.aios_squads as any;
        const agentConfig = agent?.config ?? null;
        const executorType = inferExecutorType(agentConfig);

        // Estimar duracao a partir de created_at e completed_at
        let duration_ms: number | null = null;
        if (t.completed_at && t.created_at) {
          duration_ms = new Date(t.completed_at).getTime() - new Date(t.created_at).getTime();
        }

        return {
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          cost: Number(t.cost ?? 0),
          created_at: t.created_at,
          completed_at: t.completed_at,
          story_id: t.story_id,
          phase_id: t.phase_id,
          assigned_agent_id: t.assigned_agent_id,
          agent_name: agent?.name ?? null,
          story_title: story?.title ?? null,
          squad_id: squad?.id ?? null,
          squad_name: squad?.name ?? null,
          executor_type: executorType,
          duration_ms,
        };
      });

      // Filtrar por squad e executor_type em memoria
      let filtered = expanded;
      if (filters.squad_id) {
        filtered = filtered.filter((t) => t.squad_id === filters.squad_id);
      }
      if (filters.executor_type && filters.executor_type !== 'all') {
        filtered = filtered.filter((t) => t.executor_type === filters.executor_type);
      }

      setRawTasks(filtered);
    } catch (err: unknown) {
      setError(getErrorMessage(err) ?? 'Erro desconhecido');
    }

    setLoading(false);
  }, [dateFrom, filters.agent_id, filters.squad_id, filters.executor_type, filters.status]);

  useEffect(() => {
    if (!filters.agent_id && !filters.squad_id && !filters.executor_type && !filters.status) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
    }
    fetchData();
  }, [fetchData, filters.agent_id, filters.squad_id, filters.executor_type, filters.status]);

  // KPIs derivados
  const kpis = useMemo(() => {
    const total = rawTasks.length;
    const totalCost = rawTasks.reduce((s, t) => s + t.cost, 0);
    const completed = rawTasks.filter((t) => t.status === 'completed').length;

    // Tasks por dia
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const tasksPerDay = days > 0 ? total / days : 0;

    // Por tipo de executor
    const byExecutor: Record<string, number> = {};
    for (const t of rawTasks) {
      byExecutor[t.executor_type] = (byExecutor[t.executor_type] ?? 0) + 1;
    }

    // Economia estimada de tokens: tasks concluidas por worker custam menos
    const workerTasks = rawTasks.filter((t) => t.executor_type === 'worker' && t.status === 'completed');
    const agentAvgCost = rawTasks
      .filter((t) => t.executor_type === 'agent' && t.status === 'completed')
      .reduce((s, t, _, arr) => s + t.cost / arr.length, 0);
    const economiaEstimada = workerTasks.reduce((s, t) => {
      const diff = agentAvgCost - t.cost;
      return s + (diff > 0 ? diff : 0);
    }, 0);

    return {
      total,
      totalCost,
      completed,
      tasksPerDay,
      byExecutor,
      economiaEstimada,
    };
  }, [rawTasks, period]);

  // Timeline por dia
  const timeline = useMemo<TaskDaySummary[]>(() => {
    const map: Record<string, { count: number; cost: number }> = {};
    for (const t of rawTasks) {
      const day = t.created_at.slice(0, 10);
      if (!map[day]) map[day] = { count: 0, cost: 0 };
      map[day].count++;
      map[day].cost += t.cost;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }, [rawTasks]);

  // Distribuicao por executor
  const executorDistribution = useMemo<ExecutorDistribution[]>(() => {
    const map: Record<ExecutorType, { count: number; cost: number }> = {
      agent: { count: 0, cost: 0 },
      worker: { count: 0, cost: 0 },
      clone: { count: 0, cost: 0 },
      human: { count: 0, cost: 0 },
    };
    for (const t of rawTasks) {
      map[t.executor_type].count++;
      map[t.executor_type].cost += t.cost;
    }
    return (Object.keys(map) as ExecutorType[])
      .filter((k) => map[k].count > 0)
      .map((k) => ({
        executor_type: k,
        count: map[k].count,
        cost: map[k].cost,
        label: EXECUTOR_LABELS[k],
        color: EXECUTOR_COLORS[k],
      }))
      .sort((a, b) => b.count - a.count);
  }, [rawTasks]);

  // Sugestoes de conversao agent → worker
  const conversionSuggestions = useMemo<TaskSuggestion[]>(() => {
    const agentTasks = rawTasks.filter((t) => t.executor_type === 'agent' && t.status === 'completed');

    // Agrupar por titulo + agente
    const map: Record<string, { count: number; total_cost: number; agent_name: string }> = {};
    for (const t of agentTasks) {
      const key = `${t.title}|||${t.agent_name ?? 'unknown'}`;
      if (!map[key]) map[key] = { count: 0, total_cost: 0, agent_name: t.agent_name ?? 'unknown' };
      map[key].count++;
      map[key].total_cost += t.cost;
    }

    return Object.entries(map)
      .filter(([, v]) => v.count >= 3) // Repetida 3+ vezes
      .map(([key, v]) => {
        const [task_title] = key.split('|||');
        return {
          task_title,
          agent_name: v.agent_name,
          count: v.count,
          avg_cost: v.total_cost / v.count,
          total_cost: v.total_cost,
          suggestion: `Executada ${v.count}x pelo agente ${v.agent_name}. Converter para Worker pode reduzir custo.`,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [rawTasks]);

  return {
    tasks: rawTasks,
    loading,
    error,
    refetch: fetchData,
    kpis,
    timeline,
    executorDistribution,
    conversionSuggestions,
  };
}
