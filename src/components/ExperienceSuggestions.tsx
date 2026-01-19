import React, { useState } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  TrendingUp,
  MessageSquare,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'tone' | 'engagement' | 'compliance' | 'conversion' | 'completeness';
  title: string;
  description: string;
  impact_score: number;
  source: 'llm_evaluation' | 'user_feedback' | 'pattern_detection';
  evidence?: string[];
  suggested_change?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  created_at: string;
  conversation_count?: number;
}

interface ExperienceSuggestionsProps {
  agentId: string;
  agentName: string;
  suggestions: Suggestion[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onApply: (id: string) => Promise<void>;
}

const TYPE_CONFIG = {
  tone: {
    label: 'Tom',
    icon: MessageSquare,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  engagement: {
    label: 'Engajamento',
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  compliance: {
    label: 'Compliance',
    icon: AlertCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  conversion: {
    label: 'Conversao',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  completeness: {
    label: 'Completude',
    icon: CheckCircle2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
};

const SOURCE_LABELS = {
  llm_evaluation: 'Avaliacao IA',
  user_feedback: 'Feedback Usuario',
  pattern_detection: 'Deteccao de Padrao',
};

export const ExperienceSuggestions: React.FC<ExperienceSuggestionsProps> = ({
  agentId,
  agentName,
  suggestions,
  onAccept,
  onReject,
  onApply,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const filteredSuggestions = suggestions.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await onAccept(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await onReject(id, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApply = async (id: string) => {
    setProcessingId(id);
    try {
      await onApply(id);
    } finally {
      setProcessingId(null);
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: Suggestion['status']) => {
    const badges = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pendente' },
      accepted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Aceita' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejeitada' },
      applied: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Aplicada' },
    };
    return badges[status];
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const appliedCount = suggestions.filter(s => s.status === 'applied').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Lightbulb className="text-yellow-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{pendingCount}</div>
              <div className="text-xs text-text-muted">Pendentes</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle2 className="text-blue-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{acceptedCount}</div>
              <div className="text-xs text-text-muted">Aceitas</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Sparkles className="text-green-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{appliedCount}</div>
              <div className="text-xs text-text-muted">Aplicadas</div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="text-purple-400" size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                +{((appliedCount / Math.max(suggestions.length, 1)) * 2.5).toFixed(1)}
              </div>
              <div className="text-xs text-text-muted">Score Estimado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-text-muted" />
          <span className="text-sm text-text-muted">Filtrar:</span>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          <option value="all">Todos os tipos</option>
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-bg-secondary border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="accepted">Aceitas</option>
          <option value="applied">Aplicadas</option>
          <option value="rejected">Rejeitadas</option>
        </select>

        <span className="text-sm text-text-muted ml-auto">
          {filteredSuggestions.length} sugestoes encontradas
        </span>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.length === 0 ? (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-12 text-center">
            <Lightbulb size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Nenhuma sugestao encontrada</h3>
            <p className="text-text-muted">Ajuste os filtros ou aguarde novas sugestoes do sistema.</p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => {
            const typeConfig = TYPE_CONFIG[suggestion.type];
            const TypeIcon = typeConfig.icon;
            const statusBadge = getStatusBadge(suggestion.status);
            const isExpanded = expandedId === suggestion.id;

            return (
              <div
                key={suggestion.id}
                className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden hover:border-border-hover transition-colors"
              >
                {/* Main Row */}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`p-2 ${typeConfig.bgColor} rounded-lg shrink-0`}>
                      <TypeIcon className={typeConfig.color} size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-text-primary">{suggestion.title}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>

                      <p className="text-sm text-text-secondary mb-2">{suggestion.description}</p>

                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span>{SOURCE_LABELS[suggestion.source]}</span>
                        {suggestion.conversation_count && (
                          <span>{suggestion.conversation_count} conversas analisadas</span>
                        )}
                      </div>
                    </div>

                    {/* Impact Score */}
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-bold ${getImpactColor(suggestion.impact_score)}`}>
                        {suggestion.impact_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-text-muted">Impacto</div>
                    </div>

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
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
                    <div className="border-t border-border-default pt-4 space-y-4">
                      {/* Evidence */}
                      {suggestion.evidence && suggestion.evidence.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-text-muted uppercase mb-2">Evidencias</h5>
                          <ul className="space-y-1">
                            {suggestion.evidence.map((e, i) => (
                              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                <span className="text-accent-primary">•</span>
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggested Change */}
                      {suggestion.suggested_change && (
                        <div>
                          <h5 className="text-xs font-medium text-text-muted uppercase mb-2">Mudanca Sugerida</h5>
                          <div className="bg-bg-tertiary p-3 rounded-lg">
                            <code className="text-sm text-text-primary whitespace-pre-wrap">
                              {suggestion.suggested_change}
                            </code>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => setShowRejectModal(suggestion.id)}
                            disabled={processingId === suggestion.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Rejeitar
                          </button>
                          <button
                            onClick={() => handleAccept(suggestion.id)}
                            disabled={processingId === suggestion.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Aceitar
                          </button>
                        </div>
                      )}

                      {suggestion.status === 'accepted' && (
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => handleApply(suggestion.id)}
                            disabled={processingId === suggestion.id}
                            className="flex items-center gap-1 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            <Sparkles size={14} />
                            Aplicar Melhoria
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Rejeitar Sugestao</h3>
            <p className="text-sm text-text-muted mb-4">
              Opcional: descreva o motivo da rejeicao para melhorar futuras sugestoes.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeicao (opcional)..."
              className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none"
              rows={3}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processingId === showRejectModal}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <XCircle size={14} />
                Confirmar Rejeicao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
