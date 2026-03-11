import { useState, useEffect, useCallback, useRef } from 'react';

export const N8N_BASE = 'https://cliente-a1.mentorfy.io';
const N8N_API = `${N8N_BASE}/api/v1`;

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface N8nExecutionRaw {
  id: string;
  workflowId?: string;
  status?: string;
  finished?: boolean;
  startedAt: string;
  stoppedAt?: string | null;
}

export interface PipelineAgent {
  id: string;
  name: string;
  shortName: string;
  description: string;
  nodeCount: number;
  order: number;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting' | 'unknown';
  startedAt: string;
  stoppedAt: string | null;
  workflowName: string;
}

export interface AgentStats {
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgDurationMs: number;
  lastExecution: string | null;
  isActive: boolean;
}

export interface SquadStats {
  totalExecutions: number;
  successRate: number;
  errorsToday: number;
  avgDurationMs: number;
}

// ═══════════════════════════════════════════════════════════════════════
// PIPELINE CONFIG — adicione novos agentes aqui
// ═══════════════════════════════════════════════════════════════════════

const SQUAD_PIPELINE: PipelineAgent[] = [
  {
    id: 'Gzkzaav9Yyx8kmpU',
    name: '01-Organizador-Calls',
    shortName: 'Organizador',
    description: 'Classifica e organiza calls do Google Drive',
    nodeCount: 23,
    order: 1,
  },
  {
    id: 'JiTZQcq7Tt2c5Xol',
    name: '02-AI-Agent-Head-Vendas-V2',
    shortName: 'Head Vendas AI',
    description: 'Analisa call, da notas e move lead para etapa correta',
    nodeCount: 30,
    order: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════

export function useSquadAI() {
  const [executions, setExecutions] = useState<Map<string, Execution[]>>(new Map());
  const [agentStats, setAgentStats] = useState<Map<string, AgentStats>>(new Map());
  const [squadStats, setSquadStats] = useState<SquadStats>({
    totalExecutions: 0,
    successRate: 0,
    errorsToday: 0,
    avgDurationMs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  const [apiKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mottivme_n8n_api_key');
    } catch {
      return null;
    }
  });

  const fetchAllExecutions = useCallback(async () => {
    if (!apiKey) {
      setError('API key do n8n nao configurada. Adicione em Configuracoes.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allExecs = new Map<string, Execution[]>();

      await Promise.all(
        SQUAD_PIPELINE.map(async (agent) => {
          const res = await fetch(
            `${N8N_API}/executions?workflowId=${agent.id}&limit=50`,
            { headers: { 'X-N8N-API-KEY': apiKey } }
          );

          if (!res.ok) {
            if (res.status === 401) throw new Error('API key invalida');
            return;
          }

          const data = await res.json();
          const raw: N8nExecutionRaw[] = data.data || [];
          const execs: Execution[] = raw.map((e) => ({
            id: e.id,
            workflowId: e.workflowId || agent.id,
            status: (e.status as Execution['status']) || (e.finished ? 'success' : 'error'),
            startedAt: e.startedAt,
            stoppedAt: e.stoppedAt ?? null,
            workflowName: agent.shortName,
          }));
          allExecs.set(agent.id, execs);
        })
      );

      setExecutions(allExecs);

      // Calculate per-agent stats
      const stats = new Map<string, AgentStats>();
      let totalAll = 0;
      let successAll = 0;
      let errorsToday = 0;
      let totalDurationMs = 0;
      let durationCount = 0;
      const todayLocal = new Date().toLocaleDateString('sv'); // YYYY-MM-DD local timezone

      for (const agent of SQUAD_PIPELINE) {
        const execs = allExecs.get(agent.id) || [];
        const successCount = execs.filter((e) => e.status === 'success').length;
        const errorCount = execs.filter((e) => e.status === 'error').length;

        let agentDurationMs = 0;
        let agentDurationCount = 0;

        for (const e of execs) {
          if (e.startedAt && e.stoppedAt) {
            const dur = new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime();
            if (dur > 0) {
              agentDurationMs += dur;
              agentDurationCount++;
              totalDurationMs += dur;
              durationCount++;
            }
          }
          if (e.status === 'error' && e.startedAt && new Date(e.startedAt).toLocaleDateString('sv') === todayLocal) {
            errorsToday++;
          }
        }

        stats.set(agent.id, {
          totalExecutions: execs.length,
          successCount,
          errorCount,
          successRate: execs.length > 0 ? Math.round((successCount / execs.length) * 100) : 0,
          avgDurationMs: agentDurationCount > 0 ? agentDurationMs / agentDurationCount : 0,
          lastExecution: execs.length > 0 ? execs[0].startedAt : null,
          isActive: true,
        });

        totalAll += execs.length;
        successAll += successCount;
      }

      setAgentStats(stats);
      setSquadStats({
        totalExecutions: totalAll,
        successRate: totalAll > 0 ? Math.round((successAll / totalAll) * 100) : 0,
        errorsToday,
        avgDurationMs: durationCount > 0 ? totalDurationMs / durationCount : 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar execucoes');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchAllExecutions();
    }
  }, [fetchAllExecutions]);

  return {
    pipeline: SQUAD_PIPELINE,
    executions,
    agentStats,
    squadStats,
    loading,
    error,
    refresh: fetchAllExecutions,
  };
}
