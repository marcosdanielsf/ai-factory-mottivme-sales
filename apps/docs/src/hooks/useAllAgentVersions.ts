import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// HOOK: useAllAgentVersions
// Busca TODAS as versões de agentes (não só a última)
// Permite ativar/desativar versões via is_active
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
  updating: string | null;
}

export const useAllAgentVersions = () => {
  const [state, setState] = useState<AllAgentVersionsState>({
    versions: [],
    loading: true,
    error: null,
    updating: null
  });

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
        error: null,
        updating: null
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

  // Toggle is_active
  const toggleActive = useCallback(async (versionId: string, newValue: boolean) => {
    setState(prev => ({ ...prev, updating: versionId }));

    try {
      const { error } = await supabase
        .from('agent_versions')
        .update({ is_active: newValue, updated_at: new Date().toISOString() })
        .eq('id', versionId);

      if (error) throw error;

      // Atualizar estado local
      setState(prev => ({
        ...prev,
        versions: prev.versions.map(v =>
          v.id === versionId ? { ...v, isActive: newValue } : v
        ),
        updating: null
      }));

      return { success: true };

    } catch (error: any) {
      console.error('Erro ao atualizar is_active:', error);
      setState(prev => ({ ...prev, updating: null }));
      return { success: false, error: error.message };
    }
  }, []);

  useEffect(() => {
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
    toggleActive,
    refetch: fetchVersions
  };
};

export default useAllAgentVersions;
