import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Agent, AgentVersion } from '../../types';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      // Buscar de agent_versions com JOIN para pegar nome do cliente
      // Usamos uma estratégia para pegar apenas a versão mais recente de cada client_id
      const { data, error } = await supabase
        .from('agent_versions')
        .select(`
          client_id,
          status,
          created_at,
          avg_score_overall,
          clients (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Tabela agent_versions não encontrada. Usando mock agents.');
          const mockAgents: Agent[] = [
            { id: '1', name: 'SDR Vendas', slug: 'sdr-vendas', created_at: new Date().toISOString(), status: 'production', avg_score: 8.5 },
            { id: '2', name: 'Closer Tech', slug: 'closer-tech', created_at: new Date().toISOString(), status: 'production', avg_score: 9.1 },
            { id: '3', name: 'Suporte IA', slug: 'suporte-ia', created_at: new Date().toISOString(), status: 'draft', avg_score: 7.2 }
          ];
          setAgents(mockAgents);
          return;
        }
        throw error;
      }

      if (!data || data.length === 0) {
        const mockAgents: Agent[] = [
          { id: '1', name: 'SDR Vendas', slug: 'sdr-vendas', created_at: new Date().toISOString(), status: 'production', avg_score: 8.5 },
          { id: '2', name: 'Closer Tech', slug: 'closer-tech', created_at: new Date().toISOString(), status: 'production', avg_score: 9.1 },
          { id: '3', name: 'Suporte IA', slug: 'suporte-ia', created_at: new Date().toISOString(), status: 'draft', avg_score: 7.2 }
        ];
        setAgents(mockAgents);
        return;
      }

      // Agrupar por client_id para ter apenas um "Agente" por cliente
      const uniqueAgentsMap = new Map();
      
      data.forEach((version: any) => {
        const clientId = version.clients?.id || version.client_id;
        if (!clientId) return;
        
        if (!uniqueAgentsMap.has(clientId)) {
          uniqueAgentsMap.set(clientId, {
            id: clientId, // O ID do Agente agora é o ID do Cliente
            name: version.clients?.nome || `Agente ${clientId.slice(0, 8)}`,
            slug: version.clients?.nome?.toLowerCase().replace(/\s+/g, '-') || clientId,
            created_at: version.created_at,
            status: version.status,
            avg_score: version.avg_score_overall || 0,
          });
        }
      });

      setAgents(Array.from(uniqueAgentsMap.values()));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  return { agents, loading, error, refetch: fetchAgents };
};
