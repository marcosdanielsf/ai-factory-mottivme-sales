import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  agents as staticAgents,
  hooks as staticHooks,
  workflows as staticWorkflows,
  memoryFiles as staticMemoryFiles,
  memoryCategories as staticMemoryCategories,
  constitution as staticConstitution,
  systemStats as staticSystemStats,
  type AgentConfig,
  type HookConfig,
  type WorkflowConfig,
  type MemoryFile,
  type ConstitutionArticle,
  type SystemStats,
} from '../pages/SystemV4/data';

interface SystemConfigData {
  agents: AgentConfig[];
  hooks: HookConfig[];
  workflows: WorkflowConfig[];
  memoryFiles: MemoryFile[];
  memoryCategories: { name: string; count: number }[];
  constitution: ConstitutionArticle[];
  systemStats: SystemStats;
}

interface UseSystemConfigResult {
  data: SystemConfigData;
  loading: boolean;
  error: string | null;
  source: 'supabase' | 'static';
  refetch: () => void;
}

const staticFallback: SystemConfigData = {
  agents: staticAgents,
  hooks: staticHooks,
  workflows: staticWorkflows,
  memoryFiles: staticMemoryFiles,
  memoryCategories: staticMemoryCategories,
  constitution: staticConstitution,
  systemStats: staticSystemStats,
};

const CONFIG_KEYS = [
  'agents', 'hooks', 'workflows', 'memory_files',
  'memory_categories', 'constitution', 'system_stats',
] as const;

export function useSystemConfig(): UseSystemConfigResult {
  const [data, setData] = useState<SystemConfigData>(staticFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'static'>('static');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: rows, error: fetchError } = await supabase
        .from('system_config')
        .select('key, value')
        .in('key', [...CONFIG_KEYS]);

      if (fetchError) throw fetchError;

      if (!rows || rows.length === 0) {
        setData(staticFallback);
        setSource('static');
        return;
      }

      const configMap = new Map(rows.map((r) => [r.key, r.value]));

      setData({
        agents: configMap.get('agents') ?? staticAgents,
        hooks: configMap.get('hooks') ?? staticHooks,
        workflows: configMap.get('workflows') ?? staticWorkflows,
        memoryFiles: configMap.get('memory_files') ?? staticMemoryFiles,
        memoryCategories: configMap.get('memory_categories') ?? staticMemoryCategories,
        constitution: configMap.get('constitution') ?? staticConstitution,
        systemStats: configMap.get('system_stats') ?? staticSystemStats,
      });
      setSource('supabase');
    } catch (err) {
      console.error('[useSystemConfig] Fallback para dados estaticos:', err);
      setData(staticFallback);
      setSource('static');
      setError(err instanceof Error ? err.message : 'Erro ao buscar config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { data, loading, error, source, refetch: fetchConfig };
}
