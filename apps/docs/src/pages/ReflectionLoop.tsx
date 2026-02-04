import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Lightbulb, CheckCircle2, Clock, TrendingUp, Settings, History, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ReflectionSettings } from '../components/ReflectionSettings';
import { ReflectionLogs } from '../components/ReflectionLogs';
import { ExperienceSuggestions } from '../components/ExperienceSuggestions';

interface ReflectionStats {
  total_improvements: number;
  applied_improvements: number;
  pending_suggestions: number;
  avg_score_improvement: number;
}

// Default config for reflection settings
const DEFAULT_CONFIG = {
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

type TabType = 'suggestions' | 'logs' | 'settings';

export const ReflectionLoop = () => {
  const [activeTab, setActiveTab] = useState<TabType>('suggestions');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [stats, setStats] = useState<ReflectionStats>({
    total_improvements: 0,
    applied_improvements: 0,
    pending_suggestions: 0,
    avg_score_improvement: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar reflection_logs do Supabase
      const { data: logsData, error: logsError } = await supabase
        .from('reflection_logs')
        .select('*, agent_versions(agent_name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!logsError && logsData && logsData.length > 0) {
        // Transformar dados para formato esperado pelo componente
        const transformedLogs = logsData.map((log: any, index: number) => {
          const scoreBreakdown = log.score_breakdown || {};
          const reflectionCompleta = scoreBreakdown.reflection_completa?.reflection || {};
          const analiseGeral = reflectionCompleta.analise_geral || {};

          // Score pode estar em score_geral ou overall_score
          const scoreGeral = reflectionCompleta.score_geral || log.overall_score || 0;

          return {
            id: log.id,
            agent_id: log.agent_version_id,
            agent_name: log.agent_versions?.agent_name || 'Agente',
            cycle_number: logsData.length - index,
            decision: log.action_taken === 'escalate' ? 'UPDATE' : 'MAINTAIN',
            reasoning: log.action_reason || reflectionCompleta.status || 'Analise realizada',
            score_before: scoreGeral,
            score_after: scoreGeral,
            changes_made: reflectionCompleta.proximos_passos?.slice(0, 3) || [],
            weaknesses_detected: analiseGeral.pontos_fracos?.slice(0, 3) || log.weaknesses || [],
            strengths_detected: analiseGeral.pontos_fortes?.slice(0, 3) || log.strengths || [],
            conversations_analyzed: log.conversations_analyzed || 0,
            created_at: log.created_at,
            duration_ms: log.execution_time_ms || 10000,
          };
        });

        setLogs(transformedLogs);

        // Extrair sugestoes dos logs (recomendacoes_priorizadas)
        const extractedSuggestions: any[] = [];
        logsData.forEach((log: any) => {
          const scoreBreakdown = log.score_breakdown || {};
          const reflectionCompleta = scoreBreakdown.reflection_completa?.reflection || {};
          const recomendacoes = reflectionCompleta.recomendacoes_priorizadas || [];

          recomendacoes.forEach((rec: any, idx: number) => {
            // Mapear prioridade para tipo
            const prioridade = rec.prioridade?.toLowerCase() || '';
            const type = prioridade.includes('cr') ? 'compliance' :
                        prioridade.includes('alta') ? 'engagement' :
                        prioridade.includes('m') ? 'tone' : 'conversion';

            extractedSuggestions.push({
              id: `${log.id}-${idx}`,
              type,
              title: rec.titulo || 'Melhoria Sugerida',
              description: rec.problema || rec.solucao,
              impact_score: prioridade.includes('cr') ? 9.5 :
                           prioridade.includes('alta') ? 8.0 :
                           prioridade.includes('m') ? 6.5 : 5.0,
              source: 'llm_evaluation' as const,
              evidence: [rec.impacto || ''],
              suggested_change: rec.solucao,
              example: rec.exemplo_pratico,
              status: 'pending' as const,
              created_at: log.created_at,
              conversation_count: log.conversations_analyzed || 0,
            });
          });
        });

        setSuggestions(extractedSuggestions.slice(0, 15));

        // Calcular estatisticas
        const totalImprovements = extractedSuggestions.length;
        const appliedImprovements = logsData.filter((l: any) => l.action_taken === 'escalate').length;
        const avgScore = logsData.reduce((acc: number, l: any) => {
          const score = l.score_breakdown?.reflection_completa?.reflection?.score_geral || l.overall_score || 0;
          return acc + score;
        }, 0) / Math.max(logsData.length, 1);

        setStats({
          total_improvements: totalImprovements,
          applied_improvements: appliedImprovements,
          pending_suggestions: extractedSuggestions.filter(s => s.status === 'pending').length,
          avg_score_improvement: avgScore > 0 ? avgScore : 0,
        });
      }
    } catch (err) {
      console.error('Error fetching reflection data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers for suggestions
  const handleAcceptSuggestion = async (id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'accepted' as const } : s
    ));
  };

  const handleRejectSuggestion = async (id: string, reason?: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' as const } : s
    ));
  };

  const handleApplySuggestion = async (id: string) => {
    setSuggestions(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'applied' as const } : s
    ));
  };

  // Handler for settings
  const handleSaveConfig = async (newConfig: typeof config) => {
    setConfig(newConfig);
    // TODO: Save to Supabase
  };

  // Handler for export logs
  const handleExportLogs = () => {
    const csv = logs.map(log =>
      `${log.created_at},${log.agent_name},${log.decision},${log.score_before},${log.score_after || ''},${log.conversations_analyzed}`
    ).join('\n');

    const blob = new Blob([`Data,Agente,Decisao,Score Antes,Score Depois,Conversas\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflection-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tabs = [
    { id: 'suggestions' as const, label: 'Sugestoes', icon: Lightbulb, count: suggestions.filter(s => s.status === 'pending').length },
    { id: 'logs' as const, label: 'Historico', icon: History, count: logs.length },
    { id: 'settings' as const, label: 'Configuracoes', icon: Settings },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <RefreshCw className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Reflection Loop</h1>
              <p className="text-text-muted">Sistema de auto-melhoria continua dos agentes</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Lightbulb className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stats.total_improvements}</div>
              <div className="text-xs text-text-muted">Melhorias Identificadas</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stats.applied_improvements}</div>
              <div className="text-xs text-text-muted">Melhorias Aplicadas</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="text-yellow-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{stats.pending_suggestions}</div>
              <div className="text-xs text-text-muted">Aguardando Aprovacao</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">+{stats.avg_score_improvement.toFixed(1)}</div>
              <div className="text-xs text-text-muted">Melhoria Media no Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-default">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-primary text-accent-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'bg-bg-tertiary text-text-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'suggestions' && (
          <ExperienceSuggestions
            agentId="all"
            agentName="Todos os Agentes"
            suggestions={suggestions}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            onApply={handleApplySuggestion}
          />
        )}

        {activeTab === 'logs' && (
          <ReflectionLogs
            logs={logs}
            isLoading={loading}
            onExport={handleExportLogs}
          />
        )}

        {activeTab === 'settings' && (
          <ReflectionSettings
            agentId="default"
            agentName="Configuracao Global"
            currentConfig={config}
            onSave={handleSaveConfig}
          />
        )}
      </div>
    </div>
  );
};
