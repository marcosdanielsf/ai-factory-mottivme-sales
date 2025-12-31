import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgentVersion } from '../../types';

export const useAgentVersions = (agentId?: string) => {
  const [versions, setVersions] = useState<AgentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('agent_versions')
        .select('*')
        .order('created_at', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setVersions(data || []);
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
