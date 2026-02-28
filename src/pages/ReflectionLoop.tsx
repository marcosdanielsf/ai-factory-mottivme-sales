import { useState } from 'react';
import { RefreshCw, Lightbulb, CheckCircle2, Clock, TrendingUp, Settings, History } from 'lucide-react';
import { ReflectionSettings } from '../components/ReflectionSettings';
import { ReflectionLogs } from '../components/ReflectionLogs';
import { ExperienceSuggestions } from '../components/ExperienceSuggestions';
import { useReflectionLoop } from '../hooks/useReflectionLoop';

type TabType = 'suggestions' | 'logs' | 'settings';

export const ReflectionLoop = () => {
  const [activeTab, setActiveTab] = useState<TabType>('suggestions');
  const {
    logs,
    suggestions,
    config,
    stats,
    loading,
    refetch: fetchData,
    acceptSuggestion,
    rejectSuggestion,
    applySuggestion,
    saveConfig,
  } = useReflectionLoop();

  const handleAcceptSuggestion = async (id: string) => {
    try {
      await acceptSuggestion(id);
    } catch (err) {
      console.error('Erro ao aceitar sugestao:', err);
    }
  };

  const handleRejectSuggestion = async (id: string, reason?: string) => {
    try {
      await rejectSuggestion(id, reason);
    } catch (err) {
      console.error('Erro ao rejeitar sugestao:', err);
    }
  };

  const handleApplySuggestion = async (id: string) => {
    try {
      await applySuggestion(id);
    } catch (err) {
      console.error('Erro ao aplicar sugestao:', err);
    }
  };

  const handleSaveConfig = async (newConfig: typeof config) => {
    try {
      await saveConfig(newConfig);
    } catch (err) {
      console.error('Erro ao salvar config:', err);
    }
  };

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
