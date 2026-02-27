import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgentVersion, AgentVersionHistoryEntry } from '../types';

export const useAgentVersions = (agentId?: string) => {
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!agentId) {
      setVersions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar versoes ativas da tabela principal
      let query = supabase
        .from('agent_versions')
        .select(`
          id, client_id, agent_name, location_id,
          created_at, updated_at, status, is_active, validation_status,
          version, last_test_score, validation_score,
          total_test_runs, framework_approved, deployment_notes,
          system_prompt, prompts_by_mode,
          compliance_rules, personality_config, business_config,
          tools_config, hyperpersonalization, qualification_config,
          avg_score_overall, avg_score_dimensions,
          clients:client_id (
            id,
            nome,
            empresa,
            vertical,
            status
          )
        `)
        .order('created_at', { ascending: false });

      query = query.or(`client_id.eq.${agentId},id.eq.${agentId}`);

      const { data: versionsData, error: versionsError } = await query;

      if (versionsError) throw versionsError;

      setVersions(versionsData || []);
    } catch (err: any) {
      console.error('Error fetching agent versions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  // Buscar historico de versoes (ativa + archived) via view
  const fetchHistory = useCallback(async (sourceVersionId: string): Promise<AgentVersionHistoryEntry[]> => {
    const { data, error: historyError } = await supabase
      .from('agent_version_history')
      .select('*')
      .eq('source_version_id', sourceVersionId)
      .order('version_timestamp', { ascending: false });

    if (historyError) {
      console.error('Error fetching version history:', historyError);
      return [];
    }

    return (data || []) as AgentVersionHistoryEntry[];
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, error, refetch: fetchVersions, fetchHistory };
};
