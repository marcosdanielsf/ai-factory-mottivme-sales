import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useAllAgentVersions
// Busca versoes ativas de agentes agrupadas por location.
// toggleActive REMOVIDO (v1.1) — upgrades via upgrade_agent_version() RPC.
// ============================================================================

export interface AgentVersionItem {
  id: string;
  locationId: string;
  agentName: string;
  version: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalTestRuns: number;
  lastTestScore: number | null;
  avgScoreOverall: number;
}

export interface LocationVersionGroup {
  locationId: string;
  agentName: string;
  versions: AgentVersionItem[];
}

interface AllAgentVersionsState {
  versions: AgentVersionItem[];
  loading: boolean;
  error: string | null;
}

export const useAllAgentVersions = () => {
  const [state, setState] = useState<AllAgentVersionsState>({
    versions: [],
    loading: true,
    error: null
  });
  const fetchedRef = useRef(false);

  const fetchVersions = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('agent_versions')
        .select('*')
        .not('location_id', 'is', null)
        .order('location_id', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const versions: AgentVersionItem[] = (data || []).map((row: any) => ({
        id: row.id,
        locationId: row.location_id,
        agentName: row.agent_name || 'Sem nome',
        version: row.version || '1.0.0',
        status: row.status || 'draft',
        isActive: row.is_active || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        totalTestRuns: row.total_test_runs || 0,
        lastTestScore: row.last_test_score || null,
        avgScoreOverall: row.avg_score_overall || 0
      }));

      setState({
        versions,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Erro ao buscar versões:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar versões'
      }));
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchVersions();
  }, [fetchVersions]);

  // Agrupar versões por location_id
  const versionsByLocation: LocationVersionGroup[] = Object.values(
    state.versions.reduce((acc, version) => {
      const key = version.locationId;
      if (!acc[key]) {
        acc[key] = {
          locationId: key,
          agentName: version.agentName,
          versions: []
        };
      }
      acc[key].versions.push(version);
      return acc;
    }, {} as Record<string, LocationVersionGroup>)
  );

  return {
    ...state,
    versionsByLocation,
    refetch: fetchVersions
  };
};

export default useAllAgentVersions;
