import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// Types - AgenticOS Instagram Leads
// ============================================================================

export interface Lead {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  followers_count: number;
  following_count: number;
  is_private: boolean;
  is_business: boolean;
  icp_score: number;
  priority: 'hot' | 'warm' | 'cold' | 'nurturing';
  scored_at: string;
  created_at: string;
  tenant_id: string;
}

export interface UseLeadsOptions {
  tenantId?: string;
  priority?: 'hot' | 'warm' | 'cold' | 'nurturing' | '';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

// ============================================================================
// Hook - useLeads
// ============================================================================

export function useLeads(options: UseLeadsOptions = {}): UseLeadsReturn {
  const {
    tenantId,
    priority,
    search,
    limit = 20,
    offset = 0,
  } = options;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentOffset, setCurrentOffset] = useState<number>(offset);

  // Fetch leads from Supabase
  const fetchLeads = useCallback(async (appendResults: boolean = false, newOffset?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('agentic_instagram_leads')
        .select('*', { count: 'exact' });

      // Apply filters
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(
          `username.ilike.${searchTerm},full_name.ilike.${searchTerm},bio.ilike.${searchTerm}`
        );
      }

      // Order by ICP score descending (best leads first)
      query = query
        .order('icp_score', { ascending: false })
        .order('scored_at', { ascending: false });

      // Pagination - usa newOffset se fornecido, senao 0 para reset
      const effectiveOffset = appendResults && newOffset !== undefined ? newOffset : 0;
      query = query.range(effectiveOffset, effectiveOffset + limit - 1);

      // Execute query
      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Transform data
      const transformedLeads: Lead[] = (data || []).map((row: any) => ({
        id: row.id,
        username: row.username || '',
        full_name: row.full_name || '',
        bio: row.bio || '',
        followers_count: row.followers_count || 0,
        following_count: row.following_count || 0,
        is_private: row.is_private || false,
        is_business: row.is_business || false,
        icp_score: row.icp_score || 0,
        priority: row.priority || 'cold',
        scored_at: row.scored_at || row.created_at,
        created_at: row.created_at,
        tenant_id: row.tenant_id || '',
      }));

      // Update state
      if (appendResults && newOffset !== undefined) {
        setLeads(prev => [...prev, ...transformedLeads]);
        setCurrentOffset(newOffset);
      } else {
        setLeads(transformedLeads);
        setCurrentOffset(0);
      }

      setTotalCount(count || 0);

    } catch (err: any) {
      console.error('[useLeads] Error fetching leads:', err);
      setError(err.message || 'Falha ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, [tenantId, priority, search, limit]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    fetchLeads(false);
  }, [tenantId, priority, search, limit]);

  // Refetch function
  const refetch = useCallback(async () => {
    setCurrentOffset(0);
    await fetchLeads(false);
  }, [fetchLeads]);

  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (loading || leads.length >= totalCount) return;

    const newOffset = currentOffset + limit;
    await fetchLeads(true, newOffset);
  }, [loading, leads.length, totalCount, currentOffset, limit, fetchLeads]);

  // Check if there are more items to load
  const hasMore = leads.length < totalCount;

  return {
    leads,
    loading,
    error,
    totalCount,
    hasMore,
    refetch,
    loadMore,
  };
}

// ============================================================================
// Hook - useLeadById (single lead)
// ============================================================================

export interface UseLeadByIdReturn {
  lead: Lead | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeadById(leadId: string | null): UseLeadByIdReturn {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    if (!leadId) {
      setLead(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('agentic_instagram_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (data) {
        setLead({
          id: data.id,
          username: data.username || '',
          full_name: data.full_name || '',
          bio: data.bio || '',
          followers_count: data.followers_count || 0,
          following_count: data.following_count || 0,
          is_private: data.is_private || false,
          is_business: data.is_business || false,
          icp_score: data.icp_score || 0,
          priority: data.priority || 'cold',
          scored_at: data.scored_at || data.created_at,
          created_at: data.created_at,
          tenant_id: data.tenant_id || '',
        });
      }

    } catch (err: any) {
      console.error('[useLeadById] Error fetching lead:', err);
      setError(err.message || 'Falha ao carregar lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  return {
    lead,
    loading,
    error,
    refetch: fetchLead,
  };
}

// ============================================================================
// Hook - useLeadStats (statistics)
// ============================================================================

export interface LeadStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  nurturing: number;
  avgScore: number;
  scoredToday: number;
}

export interface UseLeadStatsReturn {
  stats: LeadStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLeadStats(tenantId?: string): UseLeadStatsReturn {
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    nurturing: 0,
    avgScore: 0,
    scoredToday: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build base query
      let query = supabase
        .from('agentic_instagram_leads')
        .select('id, priority, icp_score, scored_at', { count: 'exact' });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      const leads = data || [];
      const total = count || 0;

      // Calculate stats
      const hot = leads.filter(l => l.priority === 'hot').length;
      const warm = leads.filter(l => l.priority === 'warm').length;
      const cold = leads.filter(l => l.priority === 'cold').length;
      const nurturing = leads.filter(l => l.priority === 'nurturing').length;

      // Average score
      const avgScore = leads.length > 0
        ? leads.reduce((sum, l) => sum + (l.icp_score || 0), 0) / leads.length
        : 0;

      // Scored today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const scoredToday = leads.filter(l =>
        l.scored_at && new Date(l.scored_at) >= today
      ).length;

      setStats({
        total,
        hot,
        warm,
        cold,
        nurturing,
        avgScore: Math.round(avgScore * 10) / 10,
        scoredToday,
      });

    } catch (err: any) {
      console.error('[useLeadStats] Error fetching stats:', err);
      setError(err.message || 'Falha ao carregar estatisticas');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

export default useLeads;
