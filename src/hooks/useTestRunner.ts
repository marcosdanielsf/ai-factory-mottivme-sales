import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from "../lib/getErrorMessage";

// API base URL from env
const TEST_API_URL = import.meta.env.VITE_TEST_API_URL || 'http://localhost:8000';

// Types
export interface TestScenario {
  id: string;
  label: string;
  description: string;
}

export const AVAILABLE_SCENARIOS: TestScenario[] = [
  { id: 'inbound', label: 'Inbound', description: 'Lead chega por canal de entrada (site, WhatsApp, anúncio)' },
  { id: 'follow_up', label: 'Follow-up', description: 'Reengajamento de lead que esfriou ou não respondeu' },
  { id: 'edge_cases', label: 'Edge Cases', description: 'Cenários atípicos: objeções fortes, spam, perguntas fora do escopo' },
  { id: 'social_seller', label: 'Social Seller', description: 'Abordagem proativa via redes sociais (DM, comentários)' },
];

export interface AgentVersionOption {
  id: string;
  agent_name: string;
  version: string;
  location_id?: string;
  status?: string;
}

export type TestRunnerStatus = 'idle' | 'running' | 'completed' | 'error';

export interface TestRunResult {
  run_id: string;
  status: TestRunnerStatus;
  progress?: number;
  score_overall?: number;
  passed_tests?: number;
  failed_tests?: number;
  total_tests?: number;
  scenarios?: Array<{
    scenario_name: string;
    status: 'passed' | 'failed';
    score: number;
    lead_persona?: string;
    total_turns?: number;
    duration_seconds?: number;
    conversation?: Array<{ role: string; content: string }>;
  }>;
  error?: string;
  started_at?: string;
  completed_at?: string;
}

export const useTestRunner = () => {
  const [status, setStatus] = useState<TestRunnerStatus>('idle');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [result, setResult] = useState<TestRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentVersions, setAgentVersions] = useState<AgentVersionOption[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch available agent versions from Supabase
  const fetchAgentVersions = useCallback(async () => {
    try {
      setLoadingAgents(true);
      const { data, error: fetchError } = await supabase
        .from('agent_versions')
        .select('id, agent_name, version, location_id, status')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Deduplicate by agent_name + location_id, keeping latest
      const seen = new Map<string, AgentVersionOption>();
      (data || []).forEach((av: any) => {
        const key = `${av.agent_name}_${av.location_id || 'none'}`;
        if (!seen.has(key)) {
          seen.set(key, {
            id: av.id,
            agent_name: av.agent_name || 'Agente sem nome',
            version: av.version || 'v1.0',
            location_id: av.location_id,
            status: av.status,
          });
        }
      });

      setAgentVersions(Array.from(seen.values()));
    } catch (err: unknown) {
      console.error('Error fetching agent versions:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingAgents(false);
    }
  }, []);

  // Run a test
  const runTest = useCallback(async (
    agentVersionId: string,
    scenarios: string[],
    customContext?: string
  ) => {
    try {
      setStatus('running');
      setError(null);
      setResult(null);

      const response = await fetch(`${TEST_API_URL}/api/tests/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_version_id: agentVersionId,
          scenarios,
          custom_context: customContext || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const runId = data.run_id;
      setCurrentRunId(runId);

      // Start polling
      startPolling(runId);

      return runId;
    } catch (err: unknown) {
      console.error('Error running test:', err);
      setStatus('error');
      setError(getErrorMessage(err) || 'Erro ao iniciar teste');
      return null;
    }
  }, []);

  // Poll status
  const startPolling = useCallback((runId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const poll = async () => {
      try {
        const response = await fetch(`${TEST_API_URL}/api/tests/status/${runId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: TestRunResult = await response.json();
        
        setResult(data);

        if (data.status === 'completed' || data.status === 'error') {
          setStatus(data.status);
          if (data.error) setError(data.error);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err: unknown) {
        console.error('Polling error:', err);
        // Don't stop polling on transient errors, but count failures
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    pollingRef.current = setInterval(poll, 3000);
  }, []);

  // Get results for a specific agent version
  const getResults = useCallback(async (agentVersionId: string) => {
    try {
      const response = await fetch(`${TEST_API_URL}/api/tests/results/${agentVersionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err: unknown) {
      console.error('Error fetching results:', err);
      return null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStatus('idle');
    setCurrentRunId(null);
    setResult(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    // State
    status,
    currentRunId,
    result,
    error,
    agentVersions,
    loadingAgents,
    // Actions
    runTest,
    getResults,
    fetchAgentVersions,
    reset,
  };
};
