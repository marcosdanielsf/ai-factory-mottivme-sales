import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { JarvisAlert } from './types';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function generateId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useJarvisAlerts(): {
  alerts: JarvisAlert[];
  dismissAlert: (id: string) => void;
  activeCount: number;
} {
  const [alerts, setAlerts] = useState<JarvisAlert[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addAlert = useCallback((newAlert: Omit<JarvisAlert, 'id' | 'timestamp' | 'dismissed'>) => {
    setAlerts((prev) => {
      // Avoid duplicate alerts with same title
      const exists = prev.some((a) => a.title === newAlert.title && !a.dismissed);
      if (exists) return prev;
      return [
        ...prev,
        {
          ...newAlert,
          id: generateId(),
          timestamp: new Date().toISOString(),
          dismissed: false,
        },
      ];
    });
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a))
    );
  }, []);

  // Supabase Realtime: watch aios_agents for status='error'
  useEffect(() => {
    try {
      const channel = supabase
        .channel('jarvis-agents-watch')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'aios_agents',
          },
          (payload) => {
            try {
              const record = payload.new as { status?: string; name?: string };
              if (record.status === 'error') {
                addAlert({
                  severity: 'critical',
                  title: `Agente em erro: ${record.name ?? 'Desconhecido'}`,
                  message: `O agente "${record.name ?? 'Desconhecido'}" entrou em estado de erro e requer atenção.`,
                });
              }
            } catch {
              // silently ignore
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    } catch {
      // Silently ignore Realtime failures
    }

    return () => {
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [addAlert]);

  // Polling: check for hot leads without response
  const pollHotLeads = useCallback(async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .gt('updated_at', oneHourAgo)
        .is('response', null)
        .limit(100);

      if (error || !data) return;

      const count = data.length;
      if (count > 0) {
        addAlert({
          severity: 'medium',
          title: `${count} hot lead${count > 1 ? 's' : ''} sem resposta`,
          message: `${count} lead${count > 1 ? 's' : ''} atualizado${count > 1 ? 's' : ''} na última hora ainda aguarda${count > 1 ? 'm' : ''} resposta.`,
        });
      }
    } catch {
      // Silently ignore query failures
    }
  }, [addAlert]);

  useEffect(() => {
    // Initial poll
    pollHotLeads();

    // Set up interval
    pollTimerRef.current = setInterval(pollHotLeads, POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [pollHotLeads]);

  const activeCount = alerts.filter((a) => !a.dismissed).length;

  return { alerts, dismissAlert, activeCount };
}
