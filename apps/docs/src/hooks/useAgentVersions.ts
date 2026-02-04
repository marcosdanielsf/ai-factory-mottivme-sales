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

      // Buscar versoes com JOIN na tabela clients pra trazer nome do cliente
      let query = supabase
        .from('agent_versions')
        .select(`
          *,
          clients:client_id (
            id,
            nome,
            empresa,
            telefone,
            email,
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
