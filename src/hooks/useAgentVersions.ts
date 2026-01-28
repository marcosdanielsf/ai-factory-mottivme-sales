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

      // Buscar versoes - tentar por client_id primeiro, depois por id se for um ID de versao
      let query = supabase
        .from('agent_versions')
        .select('*')
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
