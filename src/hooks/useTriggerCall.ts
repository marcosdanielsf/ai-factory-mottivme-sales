import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────

export interface TriggerCallParams {
  phoneNumber: string;
  leadName?: string;
  leadContext?: string;
  promptId?: string;
  promptOverride?: string;
}

export type CallStatusValue =
  | 'initiating'
  | 'ringing'
  | 'connected'
  | 'in_progress'
  | 'completed'
  | 'failed';

export interface CallStatus {
  callId: string;
  status: CallStatusValue;
  duration?: number;
  transcript?: string;
  outcome?: string;
}

interface UseTriggerCallReturn {
  triggerCall: (params: TriggerCallParams) => Promise<void>;
  hangup: () => Promise<void>;
  callStatus: CallStatus | null;
  loading: boolean;
  hangingUp: boolean;
  error: string | null;
  reset: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────

const PIPECAT_API_URL =
  import.meta.env.VITE_PIPECAT_API_URL ?? 'http://localhost:8765';

const POLL_INTERVAL_MS = 2_000;

const TERMINAL_STATUSES: ReadonlySet<CallStatusValue> = new Set([
  'completed',
  'failed',
]);

// ─── Hook ─────────────────────────────────────────────────────────────

export function useTriggerCall(): UseTriggerCallReturn {
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [hangingUp, setHangingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      abortRef.current?.abort();
    };
  }, []);

  // ─── Fetch prompt from Supabase ──────────────────────────────────

  const fetchPrompt = useCallback(async (promptId: string): Promise<string> => {
    const { data, error: dbError } = await supabase
      .from('cold_call_prompts')
      .select('system_prompt')
      .eq('id', promptId)
      .single();

    if (dbError || !data) {
      throw new Error(dbError?.message ?? 'Prompt não encontrado');
    }

    return data.system_prompt as string;
  }, []);

  // ─── Poll call status ────────────────────────────────────────────

  const startPolling = useCallback((callId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${PIPECAT_API_URL}/calls/${callId}`, {
          signal: abortRef.current?.signal,
        });

        if (!res.ok) return;

        const data = (await res.json()) as {
          status?: CallStatusValue;
          duration?: number;
          transcript?: string;
          outcome?: string;
        };

        const status: CallStatus = {
          callId,
          status: data.status ?? 'in_progress',
          duration: data.duration,
          transcript: data.transcript,
          outcome: data.outcome,
        };

        setCallStatus(status);

        if (TERMINAL_STATUSES.has(status.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setLoading(false);
        }
      } catch {
        // Silently ignore poll errors – will retry on next interval
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // ─── Trigger the call ────────────────────────────────────────────

  const triggerCall = useCallback(
    async (params: TriggerCallParams) => {
      setError(null);
      setLoading(true);
      setCallStatus(null);

      // Cancel any previous in-flight requests
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        // Resolve system prompt
        let systemPrompt = params.promptOverride;

        if (!systemPrompt && params.promptId) {
          systemPrompt = await fetchPrompt(params.promptId);
        }

        // Set initiating status immediately
        setCallStatus({
          callId: '',
          status: 'initiating',
        });

        const body: Record<string, unknown> = {
          phone_number: params.phoneNumber,
        };
        if (params.leadName) body.lead_name = params.leadName;
        if (params.leadContext) body.lead_context = params.leadContext;
        if (systemPrompt) body.system_prompt = systemPrompt;

        const res = await fetch(`${PIPECAT_API_URL}/outbound-call`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(errBody || `Erro ${res.status}`);
        }

        const data = (await res.json()) as { call_id?: string; callId?: string };
        const callId = data.call_id ?? data.callId ?? '';

        if (!callId) throw new Error('API não retornou call_id');

        setCallStatus({
          callId,
          status: 'ringing',
        });

        startPolling(callId);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const message =
          err instanceof Error ? err.message : 'Erro desconhecido ao iniciar ligação';
        setError(message);
        setCallStatus(null);
        setLoading(false);
      }
    },
    [fetchPrompt, startPolling],
  );

  // ─── Hangup ──────────────────────────────────────────────────────

  const hangup = useCallback(async () => {
    const callId = callStatus?.callId;
    if (!callId) return;

    setHangingUp(true);
    try {
      await fetch(`${PIPECAT_API_URL}/calls/${callId}/hangup`, {
        method: 'POST',
        signal: abortRef.current?.signal,
      });
    } catch {
      // Ignore errors — call may already be ended
    } finally {
      setHangingUp(false);
    }
  }, [callStatus?.callId]);

  // ─── Reset ───────────────────────────────────────────────────────

  const reset = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    abortRef.current?.abort();
    setCallStatus(null);
    setLoading(false);
    setError(null);
  }, []);

  return { triggerCall, hangup, callStatus, loading, hangingUp, error, reset };
}
