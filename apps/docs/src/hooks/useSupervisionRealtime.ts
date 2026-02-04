import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupervisionRealtimeOptions {
  onNewMessage?: (payload: any) => void;
  onConversationUpdate?: (payload: any) => void;
  onSupervisionStateChange?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Hook para escutar atualizações em tempo real do painel de supervisão.
 *
 * Escuta:
 * - Novas mensagens em n8n_historico_mensagens
 * - Mudanças em supervision_states
 * 
 * OTIMIZAÇÃO: Usa debounce para evitar múltiplos refetches em sequência
 */
export const useSupervisionRealtime = ({
  onNewMessage,
  onConversationUpdate,
  onSupervisionStateChange,
  enabled = true,
}: UseSupervisionRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribed = useRef(false);

  // Refs para callbacks - evita re-criar channel quando callbacks mudam
  const onNewMessageRef = useRef(onNewMessage);
  const onConversationUpdateRef = useRef(onConversationUpdate);
  const onSupervisionStateChangeRef = useRef(onSupervisionStateChange);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Atualiza refs
  onNewMessageRef.current = onNewMessage;
  onConversationUpdateRef.current = onConversationUpdate;
  onSupervisionStateChangeRef.current = onSupervisionStateChange;

  // Debounced update - agrupa múltiplos eventos em um único refetch
  const debouncedUpdate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      console.log('[Realtime] Debounced update triggered');
      onConversationUpdateRef.current?.({});
    }, 500); // Aguarda 500ms sem novos eventos
  }, []);

  const subscribe = useCallback(() => {
    if (!enabled || isSubscribed.current) return;

    console.log('[Realtime] Iniciando subscription...');

    // Criar canal único para supervisão
    const channel = supabase
      .channel('supervision-realtime')
      // Escutar novas mensagens
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_historico_mensagens',
        },
        (payload) => {
          console.log('[Realtime] Nova mensagem:', payload);
          onNewMessageRef.current?.(payload);
          debouncedUpdate(); // Usa debounce em vez de chamar direto
        }
      )
      // Escutar mudanças no estado de supervisão
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'supervision_states',
        },
        (payload) => {
          console.log('[Realtime] Supervision state change:', payload);
          onSupervisionStateChangeRef.current?.(payload);
          debouncedUpdate(); // Usa debounce em vez de chamar direto
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
        }
      });

    channelRef.current = channel;
  }, [enabled, debouncedUpdate]); // Removido callbacks das deps!

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log('[Realtime] Desconectando...');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribed.current = false;
    }
  }, []);

  useEffect(() => {
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    isSubscribed: isSubscribed.current,
    reconnect: () => {
      unsubscribe();
      subscribe();
    },
  };
};

/**
 * Hook específico para escutar mensagens de uma conversa.
 * Usa session_id para filtrar apenas mensagens relevantes.
 */
export const useConversationRealtime = (
  sessionId: string | null,
  onNewMessage: (message: any) => void
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId) {
      // Limpar subscription anterior se sessionId for null
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    console.log('[Realtime] Escutando conversa:', sessionId);

    const channel = supabase
      .channel(`conversation-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'n8n_historico_mensagens',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[Realtime] Nova mensagem na conversa:', payload);

          // Formatar mensagem para o formato esperado
          const msg = payload.new as any;
          const formattedMessage = {
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
          };

          onNewMessage(formattedMessage);
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Conversa ${sessionId} status:`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId, onNewMessage]);
};
