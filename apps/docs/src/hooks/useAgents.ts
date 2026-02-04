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

      // Buscar da tabela agent_versions e agrupar por client_id
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

      // Agrupar por client_id para obter agentes únicos
      // Usar a versão mais recente de cada client_id como referência
      const agentMap = new Map<string, any>();

      for (const version of data) {
        // Usar client_id como identificador do agente
        const agentKey = version.client_id || version.id;

        if (!agentMap.has(agentKey)) {
          agentMap.set(agentKey, version);
        }
        // Como já ordenamos por updated_at desc, a primeira ocorrência é a mais recente
      }

      // Mapear para o formato Agent esperado pelo Dashboard
      const mappedAgents: Agent[] = Array.from(agentMap.values()).map((agent: any) => ({
        id: agent.client_id || agent.id, // Usar client_id como ID do agente
        name: agent.agent_name || agent.clients?.nome || 'Agente Sem Nome',
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
      }));

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
