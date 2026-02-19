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

      // Agrupar por client_id (ignorar versoes sem client_id)
      // Guardar a versao mais recente E a versao ativa (se existir)
      const agentMap = new Map<string, { latest: any; active: any | null }>();

      const isVersionActive = (v: any) =>
        v.is_active || v.validation_status === 'active' || v.validation_status === 'production';

      for (const version of data) {
        if (!version.client_id) continue;
        const agentKey = version.client_id;
        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, { latest: version, active: isVersionActive(version) ? version : null });
        } else {
          const entry = agentMap.get(agentKey)!;
          if (isVersionActive(version) && !entry.active) {
            entry.active = version;
          }
        }
      }

      // Mapear para o formato Agent
      // Prioridade pro location: versao ATIVA > versao mais recente
      const mappedAgents: Agent[] = Array.from(agentMap.values()).map(({ latest, active }) => {
        const ref = active || latest;
        const locationName = ref.location_id ? locationMap.get(ref.location_id) : null;
        const agent = latest;
        const agentName = ref.agent_name || agent.agent_name || '';
        return {
          id: agent.client_id,
          name: locationName || agentName || '',
          agentName,
          locationId: ref.location_id || agent.location_id || '',
          slug: agent.slug || agent.client_id || agent.id,
          created_at: agent.created_at,
          updated_at: agent.updated_at,
          status: agent.status || 'draft',
          avg_score: agent.last_test_score || agent.validation_score || 0,
          version: agent.version_number || agent.version || '1.0.0',
          is_active: !!active,
          system_prompt: agent.system_prompt,
          hyperpersonalization: agent.hyperpersonalization,
          total_test_runs: agent.total_test_runs || 0,
          framework_approved: agent.framework_approved || false
        };
      }).filter(a => a.name || a.agentName); // remover agentes sem nome algum

      // Desambiguar nomes duplicados: append agentName quando location repete
      const nameCount = new Map<string, number>();
      for (const a of mappedAgents) {
        nameCount.set(a.name, (nameCount.get(a.name) || 0) + 1);
      }
      for (const a of mappedAgents) {
        if (nameCount.get(a.name)! > 1 && a.agentName && a.agentName !== a.name) {
          a.name = `${a.name} — ${a.agentName}`;
        }
      }

      // Ordenar por nome
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
