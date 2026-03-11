import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface SendMessageOptions {
  sessionId: string;
  locationId: string;
  contactId?: string;
  message: string;
  channel?: 'instagram' | 'whatsapp' | 'sms' | 'email';
}

interface UseSendMessageReturn {
  sending: boolean;
  error: string | null;
  sendMessage: (options: SendMessageOptions) => Promise<boolean>;
  clearError: () => void;
}

// Webhook do n8n para enviar mensagens
const N8N_SEND_MESSAGE_WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK_SEND_MESSAGE ||
  'https://mottivme.app.n8n.cloud/webhook/supervision-send-message';

/**
 * Hook para enviar mensagens manuais via painel de supervisão.
 *
 * Fluxo:
 * 1. Chama webhook n8n com dados da mensagem
 * 2. n8n envia via GHL API
 * 3. Mensagem é registrada no histórico
 * 4. IA é pausada automaticamente
 */
export const useSendMessage = (
  onSuccess?: () => void
): UseSendMessageReturn => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pauseAI = useCallback(async (sessionId: string, locationId: string) => {
    try {
      // Verificar se já existe estado
      const { data: existing } = await supabase
        .from('supervision_states')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        await supabase
          .from('supervision_states')
          .update({
            status: 'manual_takeover',
            ai_enabled: false,
            updated_by: 'gestora',
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);
      } else {
        await supabase
          .from('supervision_states')
          .insert({
            session_id: sessionId,
            location_id: locationId,
            status: 'manual_takeover',
            ai_enabled: false,
            updated_by: 'gestora',
          });
      }
    } catch (err) {
      console.error('Erro ao pausar IA:', err);
      // Não bloquear envio se falhar
    }
  }, []);

  const sendMessage = useCallback(
    async (options: SendMessageOptions): Promise<boolean> => {
      const { sessionId, locationId, contactId, message, channel = 'instagram' } = options;

      if (!message.trim()) {
        setError('Mensagem não pode estar vazia');
        return false;
      }

      try {
        setSending(true);
        setError(null);

        console.log('[SendMessage] Enviando mensagem:', {
          sessionId,
          locationId,
          channel,
          messageLength: message.length,
        });

        // 1. Pausar IA automaticamente
        await pauseAI(sessionId, locationId);

        // 2. Enviar via webhook n8n
        const response = await fetch(N8N_SEND_MESSAGE_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'send_message',
            session_id: sessionId,
            location_id: locationId,
            contact_id: contactId,
            message: message.trim(),
            channel,
            sender: 'gestora',
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ${response.status}`);
        }

        const result = await response.json();
        console.log('[SendMessage] Resposta:', result);

        // 3. Registrar mensagem localmente no histórico (otimista)
        await supabase.from('n8n_historico_mensagens').insert({
          session_id: sessionId,
          location_id: locationId,
          message: {
            type: 'human',
            content: message.trim(),
            additional_kwargs: {
              source: channel,
              sender: 'gestora',
              manual: true,
            },
          },
        });

        onSuccess?.();
        return true;
      } catch (err: any) {
        console.error('[SendMessage] Erro:', err);
        setError(err.message || 'Erro ao enviar mensagem');
        return false;
      } finally {
        setSending(false);
      }
    },
    [pauseAI, onSuccess]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sending,
    error,
    sendMessage,
    clearError,
  };
};
