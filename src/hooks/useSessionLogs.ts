import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SessionSummary {
  session_id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_min: number | null;
  tool_count: number;
  tool_counts: Record<string, number> | null;
  agents_used: string[] | null;
  files_modified: string[] | null;
  first_prompt: string | null;
}

interface UseSessionLogsResult {
  sessions: SessionSummary[];
  loading: boolean;
  error: string | null;
  totalToday: number;
  totalMinutesToday: number;
  avgDuration: number;
  fetchMore: () => void;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export function useSessionLogs(): UseSessionLogsResult {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSessions = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError } = await supabase
        .from('vw_session_summary')
        .select('*')
        .order('started_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      if (!data || data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (pageNum === 0) {
        setSessions(data || []);
      } else {
        setSessions((prev) => [...prev, ...(data || [])]);
      }
    } catch (err) {
      console.error('[useSessionLogs] Error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar sessoes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(0);
  }, [fetchSessions]);

  const fetchMore = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSessions(nextPage);
  }, [page, hasMore, loading, fetchSessions]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStr = todayStart.toISOString();

  const todaySessions = sessions.filter(
    (s) => s.started_at && s.started_at >= todayStr
  );

  const totalToday = todaySessions.length;
  const totalMinutesToday = todaySessions.reduce(
    (sum, s) => sum + (s.duration_min || 0), 0
  );

  const sessionsWithDuration = sessions.filter((s) => s.duration_min && s.duration_min > 0);
  const avgDuration = sessionsWithDuration.length > 0
    ? Math.round(sessionsWithDuration.reduce((sum, s) => sum + (s.duration_min || 0), 0) / sessionsWithDuration.length * 10) / 10
    : 0;

  return {
    sessions,
    loading,
    error,
    totalToday,
    totalMinutesToday,
    avgDuration,
    fetchMore,
    hasMore,
  };
}
