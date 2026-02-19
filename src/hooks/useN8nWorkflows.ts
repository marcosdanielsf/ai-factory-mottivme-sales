import { useState, useEffect, useCallback } from 'react';

const N8N_API = 'https://cliente-a1.mentorfy.io/api/v1';

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  tags: { name: string }[];
}

interface N8nExecution {
  id: string;
  finished: boolean;
  startedAt: string;
  stoppedAt: string;
  workflowId: string;
}

interface WorkflowLiveStatus {
  id: string;
  active: boolean;
  updatedAt: string;
  lastExecution?: string;
}

export function useN8nWorkflows(apiKey: string | null) {
  const [statuses, setStatuses] = useState<Map<string, WorkflowLiveStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${N8N_API}/workflows?limit=250`, {
        headers: { 'X-N8N-API-KEY': apiKey },
      });

      if (!res.ok) {
        setError(res.status === 401 ? 'API key invalida' : `Erro ${res.status}`);
        return;
      }

      const data = await res.json();
      const workflows: N8nWorkflow[] = data.data || [];

      const map = new Map<string, WorkflowLiveStatus>();
      for (const wf of workflows) {
        map.set(wf.id, {
          id: wf.id,
          active: wf.active,
          updatedAt: wf.updatedAt,
        });
      }
      setStatuses(map);
    } catch (err) {
      setError('Erro ao conectar com n8n');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const fetchExecutions = useCallback(async (workflowIds: string[]) => {
    if (!apiKey || workflowIds.length === 0) return;

    try {
      const res = await fetch(
        `${N8N_API}/executions?limit=50&status=success`,
        { headers: { 'X-N8N-API-KEY': apiKey } }
      );

      if (!res.ok) return;

      const data = await res.json();
      const executions: N8nExecution[] = data.data || [];

      setStatuses((prev) => {
        const next = new Map(prev);
        for (const exec of executions) {
          const existing = next.get(exec.workflowId);
          if (existing && (!existing.lastExecution || exec.stoppedAt > existing.lastExecution)) {
            next.set(exec.workflowId, {
              ...existing,
              lastExecution: exec.stoppedAt,
            });
          }
        }
        return next;
      });
    } catch {
      // silently fail for executions
    }
  }, [apiKey]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return { statuses, loading, error, refresh: fetchWorkflows, fetchExecutions };
}
