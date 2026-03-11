/**
 * Hook para buscar estatísticas do AgenticOS
 * Endpoint: GET /api/stats
 */

import { useState, useCallback, useEffect } from 'react';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_AGENTICOS_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

// ============================================
// TYPES
// ============================================

export interface AgenticOSStats {
  total_leads: number;
  dms_sent_today: number;
  leads_by_source: Record<string, number>;
  campaigns_active?: number;
  campaigns_completed?: number;
  response_rate?: number;
}

export interface UseAgenticOSStatsReturn {
  stats: AgenticOSStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ============================================
// HOOK: useAgenticOSStats
// ============================================

export function useAgenticOSStats(autoFetch = true): UseAgenticOSStatsReturn {
  const [stats, setStats] = useState<AgenticOSStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca estatísticas do AgenticOS
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error details
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();

      // Normalize response to expected format
      const normalizedStats: AgenticOSStats = {
        total_leads: data.total_leads ?? data.leads_count ?? 0,
        dms_sent_today: data.dms_sent_today ?? data.dms_today ?? 0,
        leads_by_source: data.leads_by_source ?? {},
        campaigns_active: data.campaigns_active ?? data.active_campaigns ?? 0,
        campaigns_completed: data.campaigns_completed ?? 0,
        response_rate: data.response_rate ?? 0,
      };

      setStats(normalizedStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching stats';
      setError(message);
      console.error('useAgenticOSStats error:', err);

      // Return fallback empty stats on error
      setStats({
        total_leads: 0,
        dms_sent_today: 0,
        leads_by_source: {},
        campaigns_active: 0,
        campaigns_completed: 0,
        response_rate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export default useAgenticOSStats;
