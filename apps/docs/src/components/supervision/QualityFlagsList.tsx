import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
} from 'lucide-react';
import {
  QualityFlag,
  qualityFlagConfig,
  severityConfig,
} from '../../types/supervision';
import { QualityFlagIcon, SeverityBadge } from './QualityBadge';

interface QualityFlagsListProps {
  flags: QualityFlag[];
  loading: boolean;
  onResolve: (flagId: string, notes?: string) => Promise<boolean>;
}

/**
 * Lista de flags de qualidade de uma conversa
 * Mostra problemas detectados com opcao de resolver
 */
export const QualityFlagsList: React.FC<QualityFlagsListProps> = ({
  flags,
  loading,
  onResolve,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const unresolvedFlags = flags.filter(f => !f.is_resolved);
  const resolvedFlags = flags.filter(f => f.is_resolved);

  const handleResolve = async (flagId: string) => {
    setResolving(flagId);
    const success = await onResolve(flagId, resolutionNotes || undefined);
    if (success) {
      setExpandedId(null);
      setResolutionNotes('');
    }
    setResolving(null);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-text-muted">
        <Clock size={20} className="mx-auto mb-2 animate-spin" />
        Carregando flags...
      </div>
    );
  }

  if (flags.length === 0) {
    return (
      <div className="p-4 text-center">
        <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
        <p className="text-sm text-text-secondary">Nenhum problema detectado</p>
        <p className="text-xs text-text-muted">A IA esta operando normalmente</p>
      </div>
    );
  }

  const FlagItem = ({ flag, isExpanded }: { flag: QualityFlag; isExpanded: boolean }) => {
    const config = qualityFlagConfig[flag.flag_type];
    const severity = severityConfig[flag.severity];

    return (
      <div
        className={`
          border rounded-lg mb-2 overflow-hidden transition-all
          ${flag.is_resolved
            ? 'border-border-default bg-bg-primary/50 opacity-60'
            : `border-${severity.color.replace('text-', '')} ${severity.bgColor}`
          }
        `}
      >
        {/* Header */}
        <button
          onClick={() => setExpandedId(isExpanded ? null : flag.id)}
          className="w-full p-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <QualityFlagIcon flagType={flag.flag_type} size={18} />
            <div>
              <p className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </p>
              <p className="text-xs text-text-muted">
                {new Date(flag.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={flag.severity} />
            {flag.is_resolved ? (
              <CheckCircle size={16} className="text-green-400" />
            ) : (
              isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-border-default">
            {/* Descricao */}
            <div className="pt-3">
              <p className="text-xs text-text-muted mb-1">Descricao</p>
              <p className="text-sm text-text-primary">{flag.description}</p>
            </div>

            {/* Evidencia */}
            {flag.evidence && (
              <div>
                <p className="text-xs text-text-muted mb-1">Evidencia</p>
                <div className="p-2 bg-bg-hover rounded text-xs font-mono text-text-secondary">
                  "{flag.evidence}"
                </div>
              </div>
            )}

            {/* Comportamento Esperado */}
            {flag.expected_behavior && (
              <div>
                <p className="text-xs text-text-muted mb-1">Esperado</p>
                <p className="text-sm text-text-secondary">{flag.expected_behavior}</p>
              </div>
            )}

            {/* Confidence */}
            {flag.confidence_score && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-muted">Confianca:</p>
                <div className="flex-1 h-1.5 bg-bg-hover rounded-full">
                  <div
                    className="h-full bg-accent-primary rounded-full"
                    style={{ width: `${flag.confidence_score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">
                  {Math.round(flag.confidence_score * 100)}%
                </span>
              </div>
            )}

            {/* Resolver */}
            {!flag.is_resolved && (
              <div className="pt-2 space-y-2">
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Notas de resolucao (opcional)..."
                  className="w-full h-16 px-2 py-1.5 bg-bg-primary border border-border-default rounded text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary"
                />
                <button
                  onClick={() => handleResolve(flag.id)}
                  disabled={resolving === flag.id}
                  className="w-full px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {resolving === flag.id ? 'Resolvendo...' : 'Marcar como Resolvido'}
                </button>
              </div>
            )}

            {/* Info resolucao */}
            {flag.is_resolved && flag.resolution_notes && (
              <div className="pt-2 border-t border-border-default">
                <p className="text-xs text-green-400 mb-1">Resolvido</p>
                <p className="text-xs text-text-muted">{flag.resolution_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Problemas nao resolvidos */}
      {unresolvedFlags.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-400" />
            Problemas Ativos ({unresolvedFlags.length})
          </h4>
          {unresolvedFlags.map(flag => (
            <FlagItem
              key={flag.id}
              flag={flag}
              isExpanded={expandedId === flag.id}
            />
          ))}
        </div>
      )}

      {/* Historico resolvido */}
      {resolvedFlags.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400" />
            Resolvidos ({resolvedFlags.length})
          </h4>
          {resolvedFlags.slice(0, 3).map(flag => (
            <FlagItem
              key={flag.id}
              flag={flag}
              isExpanded={expandedId === flag.id}
            />
          ))}
          {resolvedFlags.length > 3 && (
            <p className="text-xs text-text-muted text-center py-2">
              + {resolvedFlags.length - 3} resolvidos
            </p>
          )}
        </div>
      )}
    </div>
  );
};
