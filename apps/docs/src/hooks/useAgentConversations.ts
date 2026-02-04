import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AgentConversation } from '../types';

export interface ConversationSummary {
  id: string;
  lead_id?: string;
  lead_name?: string;
  lead_phone?: string;
  contact_name?: string;
  contact_phone?: string;
  agent_name?: string;
  last_message: string;
  qa_score?: number;
  created_at: string;
  status: 'success' | 'warning' | 'error' | 'completed' | 'failed';
  duration_seconds?: number;
}

export const useAgentConversations = () => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscamos as conversas mais recentes
      // Limite aumentado de 50 para 500 para exibir mais conversas
      // Para datasets maiores, considerar paginação
      const { data, error } = await supabase
        .from('ai_factory_conversations')
        .select(`
          id,
          content,
          sentiment_score,
          created_at,
          lead_id,
          ai_factory_leads (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const formatted = (data || []).map((item: any) => {
        const status = (item.sentiment_score || 0.8) > 0.5 ? 'completed' : 'failed';
        return {
          id: item.id,
          lead_id: item.lead_id,
          lead_name: item.ai_factory_leads?.name || 'Desconhecido',
          lead_phone: item.ai_factory_leads?.phone || 'Sem telefone',
          contact_name: item.ai_factory_leads?.name || 'Desconhecido',
          contact_phone: item.ai_factory_leads?.phone || 'Sem telefone',
          agent_name: 'AI Agent V4',
          last_message: item.content,
          qa_score: Math.round((item.sentiment_score || 0.8) * 100),
          created_at: item.created_at,
          status,
          duration_seconds: Math.floor(Math.random() * 300) + 60 // Mock de duração
        };
      });

      setConversations(formatted as ConversationSummary[]);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  return { conversations, loading, error, refetch: fetchConversations };
};
