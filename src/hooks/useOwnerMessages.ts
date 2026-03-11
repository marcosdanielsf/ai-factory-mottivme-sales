import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface OwnerMessage {
  id: string;
  phone_to: string;
  contact_name: string | null;
  content: string;
  is_group: boolean;
  group_jid: string | null;
  word_count: number | null;
  message_timestamp: string;
  instance_id: string;
  created_at: string;
}

export interface WritingStats {
  dia: string;
  total_msgs: number;
  avg_words: number;
  group_msgs: number;
  direct_msgs: number;
}

export interface PersonalityProfile {
  tom_de_voz: string;
  vocabulario_frequente: string[];
  comprimento_medio_mensagem: number;
  emojis_frequentes: string[];
  padroes_saudacao: string[];
  padroes_despedida: string[];
  nivel_assertividade: string;
  girias_expressoes: string[];
  estilo_instrucoes: string;
  estilo_pedidos: string;
  uso_pontuacao: string;
  resumo_geral: string;
}

export const useOwnerMessages = () => {
  const [messages, setMessages] = useState<OwnerMessage[]>([]);
  const [stats, setStats] = useState<WritingStats[]>([]);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMessages = useCallback(async (limit = 100) => {
    try {
      setLoading(true);
      setError(null);

      const [msgsResult, statsResult, profileResult, countResult] = await Promise.all([
        supabase
          .from('owner_messages')
          .select('*')
          .order('message_timestamp', { ascending: false })
          .limit(limit),
        supabase
          .from('vw_owner_writing_stats')
          .select('*')
          .limit(30),
        supabase
          .from('jarvis_memories')
          .select('content')
          .eq('category', 'personality_profile')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('owner_messages')
          .select('id', { count: 'exact', head: true }),
      ]);

      if (msgsResult.error) throw msgsResult.error;
      if (statsResult.error) throw statsResult.error;

      setMessages(msgsResult.data || []);
      setStats(statsResult.data || []);
      setTotalCount(countResult.count || 0);

      if (profileResult.data?.content) {
        try {
          setProfile(JSON.parse(profileResult.data.content));
        } catch {
          setProfile(null);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mensagens';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  return { messages, stats, profile, loading, error, totalCount, refetch: fetchMessages };
};
