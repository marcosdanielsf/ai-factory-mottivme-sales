import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Agent } from '../types';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

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

      // 2. Buscar agent_versions (select('*') ok aqui — poucos agentes, ~15-30 rows)
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

      // Agrupar por client_id
      // Guardar a versão mais recente E a versão ativa (se existir)
      const agentMap = new Map<string, { latest: any; active: any | null }>();

      for (const version of data) {
        const agentKey = version.client_id || version.id;
        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, { latest: version, active: version.is_active ? version : null });
        } else {
          const entry = agentMap.get(agentKey)!;
          if (version.is_active && !entry.active) {
            entry.active = version;
          }
        }
      }

      // Mapear para o formato Agent
      // Prioridade pro location: versão ATIVA > versão mais recente
      const mappedAgents: Agent[] = Array.from(agentMap.values()).map(({ latest, active }) => {
        const ref = active || latest; // preferir ativa pra resolver location
        const locationName = ref.location_id ? locationMap.get(ref.location_id) : null;
        const agent = latest; // dados gerais da mais recente
        return {
          id: agent.client_id || agent.id,
          name: locationName || ref.agent_name || agent.agent_name || 'Agente Sem Nome',
          agentName: ref.agent_name || agent.agent_name || '',
          locationId: ref.location_id || agent.location_id || '',
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
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
};
