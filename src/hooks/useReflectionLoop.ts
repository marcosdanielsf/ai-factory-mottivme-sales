import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface ReflectionLog {
  id: string;
  agent_id: string;
  agent_name: string;
  cycle_number: number;
  decision: 'UPDATE' | 'MAINTAIN' | 'ROLLBACK';
  reasoning: string;
  score_before: number;
  score_after?: number;
  changes_made?: string[];
  weaknesses_detected?: string[];
  strengths_detected?: string[];
  conversations_analyzed: number;
  created_at: string;
  duration_ms: number;
}

interface Suggestion {
  id: string;
  type: 'tone' | 'engagement' | 'compliance' | 'conversion' | 'completeness';
  title: string;
  description: string;
  impact_score: number;
  source: 'llm_evaluation' | 'user_feedback' | 'pattern_detection';
  evidence?: string[];
  suggested_change?: string;
  example?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  created_at: string;
  conversation_count?: number;
}

interface ReflectionConfig {
  reflection_interval_hours: number;
  min_conversations_before_reflection: number;
  update_threshold: number;
  weakness_repeat_threshold: number;
  significant_drop_threshold: number;
  auto_apply_minor_fixes: boolean;
  require_approval_for_major_changes: boolean;
  pause_on_low_score: boolean;
  low_score_threshold: number;
  notify_on_update: boolean;
  notify_on_weakness_pattern: boolean;
  notify_on_score_drop: boolean;
  notification_channels: string[];
  max_changes_per_cycle: number;
  cooldown_after_change_hours: number;
}

interface ReflectionStats {
  total_improvements: number;
  applied_improvements: number;
  pending_suggestions: number;
  avg_score_improvement: number;
}

const DEFAULT_CONFIG: ReflectionConfig = {
  reflection_interval_hours: 24,
  min_conversations_before_reflection: 50,
  update_threshold: 7.0,
  weakness_repeat_threshold: 3,
  significant_drop_threshold: 1.5,
  auto_apply_minor_fixes: false,
  require_approval_for_major_changes: true,
  pause_on_low_score: true,
  low_score_threshold: 5.0,
  notify_on_update: true,
  notify_on_weakness_pattern: true,
  notify_on_score_drop: true,
  notification_channels: ['email', 'slack'],
  max_changes_per_cycle: 3,
  cooldown_after_change_hours: 4,
};

export function useReflectionLoop() {
  const [logs, setLogs] = useState<ReflectionLog[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [config, setConfig] = useState<ReflectionConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<ReflectionStats>({
    total_improvements: 0,
    applied_improvements: 0,
    pending_suggestions: 0,
    avg_score_improvement: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsResult, suggestionsResult, settingsResult] = await Promise.all([
        supabase
          .from('reflection_logs')
          .select('*, agent_versions(agent_name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('improvement_suggestions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('self_improving_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
      ]);

      // --- Logs ---
      if (logsResult.error) {
        console.warn('[useReflectionLoop] reflection_logs error:', logsResult.error.message);
      }
      const logsData = logsResult.data || [];
      const transformedLogs: ReflectionLog[] = logsData.map((log: any, index: number) => {
        const scoreBreakdown = log.score_breakdown || {};
        const reflectionCompleta = scoreBreakdown.reflection_completa?.reflection || {};
        const analiseGeral = reflectionCompleta.analise_geral || {};
        const scoreGeral = reflectionCompleta.score_geral || log.overall_score || 0;

        return {
          id: log.id,
          agent_id: log.agent_version_id,
          agent_name: log.agent_versions?.agent_name || 'Agente',
          cycle_number: logsData.length - index,
          decision: log.action_taken === 'escalate' ? 'UPDATE' : 'MAINTAIN',
          reasoning: log.action_reason || reflectionCompleta.status || 'Analise realizada',
          score_before: scoreGeral,
          score_after: undefined,
          changes_made: reflectionCompleta.proximos_passos?.slice(0, 3) || [],
          weaknesses_detected: analiseGeral.pontos_fracos?.slice(0, 3) || log.weaknesses || [],
          strengths_detected: analiseGeral.pontos_fortes?.slice(0, 3) || log.strengths || [],
          conversations_analyzed: log.conversations_analyzed || 0,
          created_at: log.created_at,
          duration_ms: log.execution_time_ms || 10000,
        };
      });
      setLogs(transformedLogs);

      // --- Suggestions (from improvement_suggestions table) ---
      if (suggestionsResult.error) {
        console.warn('[useReflectionLoop] improvement_suggestions error:', suggestionsResult.error.message);
      }
      const suggestionsData = suggestionsResult.data || [];

      const typeMap: Record<string, Suggestion['type']> = {
        tone: 'tone',
        engagement: 'engagement',
        compliance: 'compliance',
        conversion: 'conversion',
        completeness: 'completeness',
      };

      const transformedSuggestions: Suggestion[] = suggestionsData.map((s: any) => {
        const firstLine = (s.diff_summary || s.suggestion_text || '').split('\n')[0] || 'Melhoria Sugerida';
        return {
          id: s.id,
          type: typeMap[s.suggestion_type] || typeMap[s.category] || 'engagement',
          title: firstLine.slice(0, 100),
          description: s.diff_summary || s.suggestion_text || '',
          impact_score: Math.min(10, (s.confidence_score || 0.5) * 10),
          source: (s.source as Suggestion['source']) || 'llm_evaluation',
          evidence: s.evidence ? (Array.isArray(s.evidence) ? s.evidence : [s.evidence]) : [],
          suggested_change: s.suggested_prompt_change || s.suggested_change,
          example: s.example,
          status: s.status || 'pending',
          created_at: s.created_at,
          conversation_count: s.conversation_count,
        };
      });
      setSuggestions(transformedSuggestions);

      // --- Config (from self_improving_settings) ---
      if (settingsResult.error) {
        console.warn('[useReflectionLoop] self_improving_settings error:', settingsResult.error.message);
      }
      if (settingsResult.data) {
        const d = settingsResult.data;
        setConfig({
          reflection_interval_hours: d.reflection_interval_hours ?? DEFAULT_CONFIG.reflection_interval_hours,
          min_conversations_before_reflection: d.min_conversations_before_reflection ?? DEFAULT_CONFIG.min_conversations_before_reflection,
          update_threshold: d.update_threshold ?? DEFAULT_CONFIG.update_threshold,
          weakness_repeat_threshold: d.weakness_repeat_threshold ?? DEFAULT_CONFIG.weakness_repeat_threshold,
          significant_drop_threshold: d.significant_drop_threshold ?? DEFAULT_CONFIG.significant_drop_threshold,
          auto_apply_minor_fixes: d.auto_apply_minor_fixes ?? DEFAULT_CONFIG.auto_apply_minor_fixes,
          require_approval_for_major_changes: d.require_approval_for_major_changes ?? DEFAULT_CONFIG.require_approval_for_major_changes,
          pause_on_low_score: d.pause_on_low_score ?? DEFAULT_CONFIG.pause_on_low_score,
          low_score_threshold: d.low_score_threshold ?? DEFAULT_CONFIG.low_score_threshold,
          notify_on_update: d.notify_on_update ?? DEFAULT_CONFIG.notify_on_update,
          notify_on_weakness_pattern: d.notify_on_weakness_pattern ?? DEFAULT_CONFIG.notify_on_weakness_pattern,
          notify_on_score_drop: d.notify_on_score_drop ?? DEFAULT_CONFIG.notify_on_score_drop,
          notification_channels: d.notification_channels ?? DEFAULT_CONFIG.notification_channels,
          max_changes_per_cycle: d.max_changes_per_cycle ?? DEFAULT_CONFIG.max_changes_per_cycle,
          cooldown_after_change_hours: d.cooldown_after_change_hours ?? DEFAULT_CONFIG.cooldown_after_change_hours,
        });
      }

      // --- Stats ---
      const applied = transformedSuggestions.filter(s => s.status === 'applied').length;
      const accepted = transformedSuggestions.filter(s => s.status === 'accepted').length;
      const pending = transformedSuggestions.filter(s => s.status === 'pending').length;
      const avgScore = logsData.length > 0
        ? logsData.reduce((acc: number, l: any) => {
            const score = l.score_breakdown?.reflection_completa?.reflection?.score_geral || l.overall_score || 0;
            return acc + score;
          }, 0) / logsData.length
        : 0;

      setStats({
        total_improvements: transformedSuggestions.length,
        applied_improvements: applied + accepted,
        pending_suggestions: pending,
        avg_score_improvement: avgScore,
      });

    } catch (err: any) {
      console.error('[useReflectionLoop] Error:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Mutations ---

  const acceptSuggestion = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('improvement_suggestions')
      .update({ status: 'accepted', reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (err) throw new Error(`Erro ao aceitar sugestao: ${err.message}`);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'accepted' as const } : s));
    setStats(prev => ({
      ...prev,
      pending_suggestions: prev.pending_suggestions - 1,
      applied_improvements: prev.applied_improvements + 1,
    }));
  }, []);

  const rejectSuggestion = useCallback(async (id: string, reason?: string) => {
    const { error: err } = await supabase
      .from('improvement_suggestions')
      .update({
        status: 'rejected',
        review_notes: reason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (err) throw new Error(`Erro ao rejeitar sugestao: ${err.message}`);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' as const } : s));
    setStats(prev => ({
      ...prev,
      pending_suggestions: prev.pending_suggestions - 1,
    }));
  }, []);

  const applySuggestion = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('improvement_suggestions')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', id);

    if (err) throw new Error(`Erro ao aplicar sugestao: ${err.message}`);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: 'applied' as const } : s));
  }, []);

  const saveConfig = useCallback(async (newConfig: ReflectionConfig) => {
    const { error: err } = await supabase
      .from('self_improving_settings')
      .upsert({
        id: 'default',
        ...newConfig,
        updated_at: new Date().toISOString(),
      });

    if (err) throw new Error(`Erro ao salvar config: ${err.message}`);
    setConfig(newConfig);
  }, []);

  return {
    logs,
    suggestions,
    config,
    stats,
    loading,
    error,
    refetch: fetchData,
    acceptSuggestion,
    rejectSuggestion,
    applySuggestion,
    saveConfig,
  };
}
