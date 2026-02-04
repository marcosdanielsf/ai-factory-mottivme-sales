import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { QualityFlag, QualitySummary, QualityFlagType, QualitySeverity } from '../types/supervision';

interface UseQualityFlagsResult {
  flags: QualityFlag[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  resolveFlag: (flagId: string, notes?: string) => Promise<boolean>;
}

interface UseQualitySummaryResult {
  summaries: Map<string, QualitySummary>;
  loading: boolean;
  getSummary: (sessionId: string) => QualitySummary | null;
  refetch: () => void;
}

/**
 * Hook para buscar flags de qualidade de uma conversa especifica
 */
export function useQualityFlags(sessionId: string | null): UseQualityFlagsResult {
  const [flags, setFlags] = useState<QualityFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!sessionId) {
      setFlags([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('vw_quality_flags_detail')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFlags(data || []);
    } catch (err) {
      console.error('[useQualityFlags] Erro ao buscar flags:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar flags');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const resolveFlag = useCallback(async (flagId: string, notes?: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('conversation_quality_flags')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: 'gestora', // TODO: pegar user_id real
          resolution_notes: notes || null,
        })
        .eq('id', flagId);

      if (updateError) throw updateError;

      // Atualiza localmente
      setFlags(prev => prev.map(f =>
        f.id === flagId
          ? { ...f, is_resolved: true, resolved_at: new Date().toISOString() }
          : f
      ));

      return true;
    } catch (err) {
      console.error('[useQualityFlags] Erro ao resolver flag:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    loading,
    error,
    refetch: fetchFlags,
    resolveFlag,
  };
}

/**
 * Hook para buscar resumo de flags de todas as conversas (para badges)
 * OTIMIZADO: Usa serialização de IDs para evitar re-renders infinitos
 */
export function useQualitySummary(sessionIds?: string[]): UseQualitySummaryResult {
  const [summaries, setSummaries] = useState<Map<string, QualitySummary>>(new Map());
  const [loading, setLoading] = useState(false);

  // Serializa IDs para comparação estável (evita re-renders)
  const sessionIdsKey = sessionIds?.sort().join(',') || '';

  const fetchSummaries = useCallback(async () => {
    // Não busca se não houver IDs
    if (!sessionIdsKey) {
      setSummaries(new Map());
      return;
    }

    setLoading(true);
    console.time('[QualitySummary] fetch');

    try {
      const ids = sessionIdsKey.split(',');
      
      const { data, error } = await supabase
        .from('vw_conversation_quality_summary')
        .select('*')
        .in('session_id', ids);

      if (error) throw error;

      // Converte para Map para acesso rapido O(1)
      const summaryMap = new Map<string, QualitySummary>();
      (data || []).forEach(summary => {
        summaryMap.set(summary.session_id, summary);
      });

      setSummaries(summaryMap);
      console.timeEnd('[QualitySummary] fetch');
    } catch (err) {
      console.error('[useQualitySummary] Erro ao buscar resumos:', err);
      console.timeEnd('[QualitySummary] fetch');
    } finally {
      setLoading(false);
    }
  }, [sessionIdsKey]); // Depende da string, não do array

  const getSummary = useCallback((sessionId: string): QualitySummary | null => {
    return summaries.get(sessionId) || null;
  }, [summaries]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  return {
    summaries,
    loading,
    getSummary,
    refetch: fetchSummaries,
  };
}

/**
 * Hook para real-time de novos flags
 */
export function useQualityFlagsRealtime(
  onNewFlag: (flag: QualityFlag) => void,
  onFlagResolved: (flagId: string) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('quality-flags-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_quality_flags',
        },
        (payload) => {
          console.log('[QualityFlags] Novo flag detectado:', payload.new);
          onNewFlag(payload.new as QualityFlag);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_quality_flags',
          filter: 'is_resolved=eq.true',
        },
        (payload) => {
          console.log('[QualityFlags] Flag resolvido:', payload.new);
          onFlagResolved((payload.new as QualityFlag).id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onNewFlag, onFlagResolved]);
}

/**
 * Helper para criar um flag manualmente (via UI)
 */
export async function createQualityFlag(params: {
  sessionId: string;
  messageId: string;
  locationId?: string;
  flagType: QualityFlagType;
  severity: QualitySeverity;
  description: string;
  evidence?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_quality_flags')
      .insert({
        session_id: params.sessionId,
        message_id: params.messageId,
        location_id: params.locationId || null,
        flag_type: params.flagType,
        severity: params.severity,
        description: params.description,
        evidence: params.evidence || null,
        analyzed_by: 'gestora', // TODO: user_id real
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[createQualityFlag] Erro:', err);
    return null;
  }
}
