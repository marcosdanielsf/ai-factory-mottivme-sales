import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpCircle,
  MinusCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

type Decision = 'UPDATE' | 'MAINTAIN' | 'ROLLBACK';

interface ReflectionLog {
  id: string;
  agent_id: string;
  agent_name: string;
  cycle_number: number;
  decision: Decision;
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

interface ReflectionLogsProps {
  logs: ReflectionLog[];
  isLoading?: boolean;
  onExport?: () => void;
}

const DECISION_CONFIG = {
  UPDATE: {
    label: 'UPDATE',
    icon: ArrowUpCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
    description: 'Prompt foi atualizado com melhorias',
  },
  MAINTAIN: {
    label: 'MAINTAIN',
    icon: MinusCircle,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    description: 'Prompt mantido sem alteracoes',
  },
  ROLLBACK: {
    label: 'ROLLBACK',
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    description: 'Prompt revertido para versao anterior',
  },
};

export const ReflectionLogs: React.FC<ReflectionLogsProps> = ({
  logs,
  isLoading = false,
  onExport,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDecision, setFilterDecision] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');

  // Get unique agents for filter
  const uniqueAgents = Array.from(new Set(logs.map(l => l.agent_name)));

  const filteredLogs = logs.filter((log) => {
    if (filterDecision !== 'all' && log.decision !== filterDecision) return false;
    if (filterAgent !== 'all' && log.agent_name !== filterAgent) return false;
    return true;
  });

  // Stats
  const updateCount = logs.filter(l => l.decision === 'UPDATE').length;
  const maintainCount = logs.filter(l => l.decision === 'MAINTAIN').length;
  const rollbackCount = logs.filter(l => l.decision === 'ROLLBACK').length;
  const avgScoreChange = logs
    .filter(l => l.score_after !== undefined)
    .reduce((acc, l) => acc + ((l.score_after || 0) - l.score_before), 0) / Math.max(logs.filter(l => l.score_after !== undefined).length, 1);

  const getScoreTrend = (before: number, after?: number) => {
    if (after === undefined) return null;
    const diff = after - before;
    if (diff > 0.3) return { icon: TrendingUp, color: 'text-green-400', label: `+${diff.toFixed(1)}` };
    if (diff < -0.3) return { icon: TrendingDown, color: 'text-red-400', label: diff.toFixed(1) };
    return { icon: Minus, color: 'text-text-muted', label: '0' };
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-bg-tertiary rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ArrowUpCircle className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{updateCount}</div>
              <div className="text-xs text-text-muted">Updates</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MinusCircle className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{maintainCount}</div>
              <div className="text-xs text-text-muted">Mantidos</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="text-red-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{rollbackCount}</div>
              <div className="text-xs text-text-muted">Rollbacks</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${avgScoreChange >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {avgScoreChange >= 0 ? (
                <TrendingUp className="text-green-400" size={20} />
              ) : (
                <TrendingDown className="text-red-400" size={20} />
              )}
            </div>
            <div>
              <div className={`text-2xl font-bold ${avgScoreChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {avgScoreChange >= 0 ? '+' : ''}{avgScoreChange.toFixed(2)}
              </div>
              <div className="text-xs text-text-muted">Variacao Media</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-text-muted" />
            <span className="text-sm text-text-muted">Filtrar:</span>
          </div>

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="all">Todas as decisoes</option>
            <option value="UPDATE">UPDATE</option>
            <option value="MAINTAIN">MAINTAIN</option>
            <option value="ROLLBACK">ROLLBACK</option>
          </select>

          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="all">Todos os agentes</option>
            {uniqueAgents.map((agent) => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Logs Timeline */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-12 text-center">
            <RefreshCw size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Nenhum log encontrado</h3>
            <p className="text-text-muted">Ajuste os filtros ou aguarde o proximo ciclo de reflexao.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const decisionConfig = DECISION_CONFIG[log.decision];
            const DecisionIcon = decisionConfig.icon;
            const isExpanded = expandedId === log.id;
            const scoreTrend = getScoreTrend(log.score_before, log.score_after);

            return (
              <div
                key={log.id}
                className={`bg-bg-secondary border rounded-lg overflow-hidden transition-colors ${
                  isExpanded ? decisionConfig.borderColor : 'border-border-default hover:border-border-hover'
                }`}
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Decision Icon */}
                    <div className={`p-3 ${decisionConfig.bgColor} rounded-lg shrink-0`}>
                      <DecisionIcon className={decisionConfig.color} size={24} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${decisionConfig.bgColor} ${decisionConfig.color}`}>
                          {decisionConfig.label}
                        </span>
                        <span className="text-sm font-medium text-text-primary">{log.agent_name}</span>
                        <span className="text-xs text-text-muted">Ciclo #{log.cycle_number}</span>
                      </div>

                      <p className="text-sm text-text-secondary truncate">{log.reasoning}</p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(log.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>{log.conversations_analyzed} conversas</span>
                        <span>{(log.duration_ms / 1000).toFixed(1)}s</span>
                      </div>
                    </div>

                    {/* Score Change */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="text-right">
                          <div className="text-sm text-text-muted">Score</div>
                          <div className="text-lg font-bold text-text-primary">
                            {log.score_before.toFixed(1)}
                            {log.score_after !== undefined && (
                              <span className="text-text-muted mx-1">→</span>
                            )}
                            {log.score_after !== undefined && (
                              <span className={scoreTrend?.color}>{log.score_after.toFixed(1)}</span>
                            )}
                          </div>
                        </div>
                        {scoreTrend && (
                          <div className={`flex items-center gap-1 ${scoreTrend.color}`}>
                            <scoreTrend.icon size={20} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-text-muted" />
                      ) : (
                        <ChevronDown size={16} className="text-text-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t border-border-default pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Changes Made */}
                      {log.changes_made && log.changes_made.length > 0 && (
                        <div className="bg-bg-tertiary rounded-lg p-4">
                          <h5 className="text-xs font-medium text-text-muted uppercase mb-2 flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-green-400" />
                            Mudancas Aplicadas
                          </h5>
                          <ul className="space-y-1">
                            {log.changes_made.map((change, i) => (
                              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                <span className="text-green-400">+</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {log.weaknesses_detected && log.weaknesses_detected.length > 0 && (
                        <div className="bg-bg-tertiary rounded-lg p-4">
                          <h5 className="text-xs font-medium text-text-muted uppercase mb-2 flex items-center gap-1">
                            <XCircle size={12} className="text-red-400" />
                            Fraquezas Detectadas
                          </h5>
                          <ul className="space-y-1">
                            {log.weaknesses_detected.map((weakness, i) => (
                              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                <span className="text-red-400">-</span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Strengths */}
                      {log.strengths_detected && log.strengths_detected.length > 0 && (
                        <div className="bg-bg-tertiary rounded-lg p-4">
                          <h5 className="text-xs font-medium text-text-muted uppercase mb-2 flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-blue-400" />
                            Pontos Fortes
                          </h5>
                          <ul className="space-y-1">
                            {log.strengths_detected.map((strength, i) => (
                              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                <span className="text-blue-400">*</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Full Reasoning */}
                    <div className="mt-4 bg-bg-tertiary rounded-lg p-4">
                      <h5 className="text-xs font-medium text-text-muted uppercase mb-2">Raciocinio Completo</h5>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{log.reasoning}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
