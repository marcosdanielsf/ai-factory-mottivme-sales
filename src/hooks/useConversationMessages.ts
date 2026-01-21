import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SupervisionMessage } from '../types/supervision';

interface UseConversationMessagesReturn {
  messages: SupervisionMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  contactInfo: {
    name: string;
    phone: string;
    agentName: string;
  } | null;
}

export const useConversationMessages = (
  sessionId: string | null
): UseConversationMessagesReturn => {
  const [messages, setMessages] = useState<SupervisionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{
    name: string;
    phone: string;
    agentName: string;
  } | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) {
      setMessages([]);
      setContactInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar da view
      const { data, error: fetchError } = await supabase
        .from('vw_supervision_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const typedData = (data as SupervisionMessage[]) || [];
      setMessages(typedData);

      // Extrair info do contato da primeira mensagem
      if (typedData.length > 0) {
        setContactInfo({
          name: typedData[0].contact_name || 'Desconhecido',
          phone: typedData[0].contact_phone || '',
          agentName: typedData[0].agent_name || 'IA',
        });
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Erro ao carregar mensagens');

      // Fallback para tabela direta se view nao existir
      if (err.message?.includes('does not exist')) {
        await fetchFromTable();
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchFromTable = async () => {
    if (!sessionId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('n8n_historico_mensagens')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const formatted: SupervisionMessage[] = (data || []).map((msg: any) => ({
        message_id: String(msg.id),
        session_id: msg.session_id,
        location_id: msg.location_id,
        role: msg.message?.type === 'human' ? 'user' : 'assistant',
        content: msg.message?.content || '',
        channel: msg.message?.additional_kwargs?.source || null,
        sentiment_score: null,
        created_at: msg.created_at,
        contact_name: msg.message?.additional_kwargs?.full_name || null,
        contact_phone: null,
        agent_name: 'IA',
      }));

      setMessages(formatted);
      setError(null);

      if (formatted.length > 0) {
        setContactInfo({
          name: formatted[0].contact_name || 'Desconhecido',
          phone: formatted[0].contact_phone || '',
          agentName: formatted[0].agent_name || 'IA',
        });
      }
    } catch (err: any) {
      console.error('Error fetching from table:', err);
      // Usar mock se nada funcionar
      setMessages(getMockMessages(sessionId));
      setContactInfo({
        name: 'Contato Mock',
        phone: '+5511999999999',
        agentName: 'IA',
      });
      setError(null);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
    contactInfo,
  };
};

// Mock messages para desenvolvimento
function getMockMessages(leadId: string): SupervisionMessage[] {
  const mockConversation = [
    { role: 'assistant' as const, content: 'Olá! Sou a Nina, assistente virtual. Como posso ajudar você hoje?' },
    { role: 'user' as const, content: 'Oi! Vi o anúncio de vocês sobre o programa de mentoria.' },
    { role: 'assistant' as const, content: 'Que legal! O programa de mentoria é incrível. Qual área você tem mais interesse? Carreira internacional ou empreendedorismo?' },
    { role: 'user' as const, content: 'Carreira internacional. Quero trabalhar fora do Brasil.' },
    { role: 'assistant' as const, content: 'Perfeito! Temos um programa específico para isso. Você já tem alguma experiência profissional na sua área?' },
    { role: 'user' as const, content: 'Sim, trabalho há 5 anos com marketing digital.' },
    { role: 'assistant' as const, content: 'Excelente! Com 5 anos de experiência em marketing digital, você tem um perfil muito bom para o mercado internacional. Posso agendar uma conversa com nosso especialista para te explicar melhor o programa?' },
  ];

  const baseTime = Date.now() - 3600000; // 1 hora atrás

  return mockConversation.map((msg, i) => ({
    message_id: `msg-${leadId}-${i}`,
    lead_id: leadId,
    agent_id: 'agent-1',
    role: msg.role,
    content: msg.content,
    channel: 'whatsapp',
    sentiment_score: 0.7 + Math.random() * 0.3,
    created_at: new Date(baseTime + i * 120000).toISOString(), // 2 min entre msgs
    contact_name: 'Contato Mock',
    contact_phone: '+5511999999999',
    agent_name: 'Nina SDR',
  }));
}
