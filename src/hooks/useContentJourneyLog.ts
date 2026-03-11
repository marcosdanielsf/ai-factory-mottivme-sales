import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type JourneyAction =
  | 'created'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export interface JourneyLogEntry {
  id: string;
  content_piece_id: string;
  action: JourneyAction;
  actor_id: string | null;
  actor_name: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface JourneyInsightsSummary {
  totalActions: number;
  reviews: number;
  rejections: number;
  approvals: number;
  avgTimeBetweenActionsHours: number | null;
  firstActionAt: string | null;
  lastActionAt: string | null;
}

interface UseContentJourneyLogReturn {
  entries: JourneyLogEntry[];
  loading: boolean;
  error: string | null;
  insights: JourneyInsightsSummary;
  addEntry: (action: JourneyAction, notes?: string, metadata?: Record<string, unknown>) => Promise<boolean>;
  refetch: () => void;
}

function computeInsights(entries: JourneyLogEntry[]): JourneyInsightsSummary {
  if (entries.length === 0) {
    return {
      totalActions: 0,
      reviews: 0,
      rejections: 0,
      approvals: 0,
      avgTimeBetweenActionsHours: null,
      firstActionAt: null,
      lastActionAt: null,
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const reviews = entries.filter(e => e.action === 'reviewed').length;
  const rejections = entries.filter(e => e.action === 'rejected').length;
  const approvals = entries.filter(e => e.action === 'approved').length;

  let avgTimeBetweenActionsHours: number | null = null;
  if (sorted.length >= 2) {
    const totalMs =
      new Date(sorted[sorted.length - 1].created_at).getTime() -
      new Date(sorted[0].created_at).getTime();
    avgTimeBetweenActionsHours = totalMs / (sorted.length - 1) / 1000 / 3600;
  }

  return {
    totalActions: entries.length,
    reviews,
    rejections,
    approvals,
    avgTimeBetweenActionsHours,
    firstActionAt: sorted[0].created_at,
    lastActionAt: sorted[sorted.length - 1].created_at,
  };
}

export function useContentJourneyLog(contentPieceId: string | null): UseContentJourneyLogReturn {
  const [entries, setEntries] = useState<JourneyLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!contentPieceId) {
      setEntries([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: sbError } = await supabase
        .from('content_journey_log')
        .select('*')
        .eq('content_piece_id', contentPieceId)
        .order('created_at', { ascending: true });

      if (sbError) throw sbError;
      setEntries((data as JourneyLogEntry[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar journey log');
      setEntries([]);
    }

    setLoading(false);
  }, [contentPieceId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = useCallback(
    async (
      action: JourneyAction,
      notes?: string,
      metadata: Record<string, unknown> = {}
    ): Promise<boolean> => {
      if (!contentPieceId) return false;

      try {
        const { error: sbError } = await supabase
          .from('content_journey_log')
          .insert({
            content_piece_id: contentPieceId,
            action,
            notes: notes || null,
            metadata,
          });

        if (sbError) throw sbError;
        await fetchEntries();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar acao');
        return false;
      }
    },
    [contentPieceId, fetchEntries]
  );

  const insights = computeInsights(entries);

  return {
    entries,
    loading,
    error,
    insights,
    addEntry,
    refetch: fetchEntries,
  };
}
