import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgentVersion } from '../types';

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

      // Buscar versoes — campos leves pra sidebar, campos pesados so quando selecionado
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

      // Tentar buscar por client_id OU por id (para casos onde client_id é null)
      // Usamos or() para cobrir ambos os casos
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

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return { versions, loading, error, refetch: fetchVersions };
};
