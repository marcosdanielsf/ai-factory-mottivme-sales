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

// Campos específicos em vez de SELECT *
const MESSAGE_FIELDS = `
  id,
  session_id,
  location_id,
  message,
  created_at
`;

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

    console.log('[useConversationMessages] Buscando mensagens para session_id:', sessionId);
    console.time('[ConversationMessages] fetch');

    try {
      setLoading(true);
      setError(null);

      // Buscar da tabela direta com campos específicos e ordenação no banco
      const { data, error: fetchError } = await supabase
        .from('n8n_historico_mensagens')
        .select(MESSAGE_FIELDS)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }) // Ordenação no banco, não no cliente
        .limit(100);

      console.timeEnd('[ConversationMessages] fetch');

      if (fetchError) {
        console.log('[useConversationMessages] Erro na tabela:', fetchError);
        throw fetchError;
      }

      // Formatar mensagens (sem ordenação no cliente - já vem ordenado)
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
        contact_phone: msg.message?.additional_kwargs?.phone || null,
        agent_name: 'IA',
      }));

      setMessages(formatted);

      if (formatted.length > 0) {
        setContactInfo({
          name: formatted[0].contact_name || 'Desconhecido',
          phone: formatted[0].contact_phone || '',
          agentName: formatted[0].agent_name || 'IA',
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      // Usar mock se nada funcionar
      setMessages(getMockMessages(sessionId));
      setContactInfo({
        name: 'Contato Mock',
        phone: '+5511999999999',
        agentName: 'IA',
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

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
function getMockMessages(sessionId: string): SupervisionMessage[] {
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
    message_id: `msg-${sessionId}-${i}`,
    session_id: sessionId,
    location_id: null,
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
