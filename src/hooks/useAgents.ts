import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Agent } from '../types';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Buscar locations (mesma fonte do painel Admin)
      const { data: locations } = await supabase
        .from('ghl_locations')
        .select('location_id, location_name');

      const locationMap = new Map<string, string>();
      if (locations) {
        for (const loc of locations) {
          locationMap.set(loc.location_id, loc.location_name);
        }
      }

      // 2. Buscar agent_versions
      const { data, error } = await supabase
        .from('agent_versions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching agents:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setAgents([]);
        return;
      }

      // Agrupar por client_id — usar a versão mais recente como referência
      const agentMap = new Map<string, any>();

      for (const version of data) {
        const agentKey = version.client_id || version.id;
        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, version);
        }
      }

      // Mapear para o formato Agent
      // name = nome da LOCATION (ghl_locations) — mesmo do painel Admin
      // agentName = nome do AGENTE (versão mais recente) — subtítulo
      const mappedAgents: Agent[] = Array.from(agentMap.values()).map((agent: any) => {
        const locationName = agent.location_id ? locationMap.get(agent.location_id) : null;
        return {
          id: agent.client_id || agent.id,
          name: locationName || agent.agent_name || 'Agente Sem Nome',
          agentName: agent.agent_name || '',
          locationId: agent.location_id || '',
          slug: agent.slug || agent.client_id || agent.id,
          created_at: agent.created_at,
          updated_at: agent.updated_at,
          status: agent.status || 'draft',
          avg_score: agent.last_test_score || agent.validation_score || 0,
          version: agent.version_number || agent.version || '1.0.0',
          is_active: agent.is_active || false,
          system_prompt: agent.system_prompt,
          hyperpersonalization: agent.hyperpersonalization,
          total_test_runs: agent.total_test_runs || 0,
          framework_approved: agent.framework_approved || false
        };
      });

      // Ordenar por nome (mesmo do Admin)
      mappedAgents.sort((a, b) => a.name.localeCompare(b.name));

      setAgents(mappedAgents);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agentes');
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
};
