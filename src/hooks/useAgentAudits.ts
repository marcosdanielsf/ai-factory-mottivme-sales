import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from "../lib/getErrorMessage";

// ============================================================================
// HOOK: useAgentAudits
// Busca scorecards de auditoria de conversas reais por agente.
// Fonte: vw_agent_audit_scorecard + vw_agent_audit_history
// ============================================================================

// --- Types ---

export interface AuditFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  dimension: string;
  title: string;
  evidence: string;
  recommendation: string;
  conversation_id?: string;
}

export interface AuditMetrics {
  scheduling_rate?: number;
  qualification_rate?: number;
  avg_messages_per_conversation?: number;
  escalation_rate?: number;
  [key: string]: number | undefined;
}

export interface AuditRecommendation {
  priority: 'P0' | 'P1' | 'P2';
  action: string;
  expected_impact: string;
}

export interface AuditScores {
  tool_calls: number;
  phase_flow: number;
  compliance: number;
  hallucination: number;
  escalation: number;
  conversion: number;
  anti_repetition: number;
  mode_correctness: number;
}

export interface AgentAuditScorecard {
  id: string;
  agentVersionId: string;
  locationId: string;
  agentName: string;
  agentVersion: string;
  conversationsCount: number;
  messagesCount: number;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  healthScore: number;
  scores: AuditScores;
  findings: AuditFinding[];
  metrics: AuditMetrics;
  recommendations: AuditRecommendation[];
  auditedBy: string;
  modelUsed: string | null;
  notes: string | null;
  auditedAt: string;
  trendHealth: number | null;
  totalAudits: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
}

export interface AuditHistoryEntry {
  id: string;
  agentVersionId: string;
  agentName: string;
  agentVersion: string;
  locationId: string;
  healthScore: number;
  scores: AuditScores;
  conversationsCount: number;
  messagesCount: number;
  findings: AuditFinding[];
  auditedAt: string;
}

const DEFAULT_SCORES: AuditScores = {
  tool_calls: 0, phase_flow: 0, compliance: 0, hallucination: 0,
  escalation: 0, conversion: 0, anti_repetition: 0, mode_correctness: 0,
};

const SCORE_KEYS = Object.keys(DEFAULT_SCORES) as (keyof AuditScores)[];

function parseScores(raw: any): AuditScores {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SCORES };
  const result = { ...DEFAULT_SCORES };
  for (const key of SCORE_KEYS) {
    if (typeof raw[key] === 'number') result[key] = raw[key];
  }
  return result;
}

// --- Hook: useAgentAudits ---

export const useAgentAudits = (locationId?: string) => {
  const [scorecards, setScorecards] = useState<AgentAuditScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchScorecards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('vw_agent_audit_scorecard')
        .select('*')
        .order('health_score', { ascending: true });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      const mapped: AgentAuditScorecard[] = (data || []).map((row: any) => ({
        id: row.id,
        agentVersionId: row.agent_version_id,
        locationId: row.location_id,
        agentName: row.agent_name,
        agentVersion: row.agent_version,
        conversationsCount: row.conversations_count || 0,
        messagesCount: row.messages_count || 0,
        dateRangeStart: row.date_range_start,
        dateRangeEnd: row.date_range_end,
        healthScore: Number(row.health_score) || 0,
        scores: parseScores(row.scores),
        findings: row.findings || [],
        metrics: row.metrics || {},
        recommendations: row.recommendations || [],
        auditedBy: row.audited_by || 'claude',
        modelUsed: row.model_used,
        notes: row.notes,
        auditedAt: row.audited_at,
        trendHealth: row.trend_health ? Number(row.trend_health) : null,
        totalAudits: row.total_audits || 0,
        healthStatus: row.health_status || 'critical',
      }));

      setScorecards(mapped);
    } catch (err: unknown) {
      console.error('Erro ao buscar auditorias:', err);
      setError(getErrorMessage(err) || 'Erro ao carregar auditorias');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchScorecards();
  }, [fetchScorecards]);

  return { scorecards, loading, error, refetch: fetchScorecards };
};

// --- Hook: useAgentAuditHistory ---

export const useAgentAuditHistory = (agentVersionId?: string) => {
  const [history, setHistory] = useState<AuditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!agentVersionId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agentVersionId)) {
      setError('ID de versão inválido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('vw_agent_audit_history')
        .select('*')
        .eq('agent_version_id', agentVersionId)
        .order('audited_at', { ascending: true });

      if (err) throw err;

      const mapped: AuditHistoryEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        agentVersionId: row.agent_version_id,
        agentName: row.agent_name,
        agentVersion: row.agent_version,
        locationId: row.location_id,
        healthScore: Number(row.health_score) || 0,
        scores: parseScores(row.scores),
        conversationsCount: row.conversations_count || 0,
        messagesCount: row.messages_count || 0,
        findings: row.findings || [],
        auditedAt: row.audited_at,
      }));

      setHistory(mapped);
    } catch (err: unknown) {
      console.error('Erro ao buscar histórico de auditorias:', err);
      setError(getErrorMessage(err) || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [agentVersionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
};
