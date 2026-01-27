import React from 'react';
import {
  AlertTriangle,
  XCircle,
  Clock,
  Bug,
  Repeat,
  MessageCircle,
  Shield,
} from 'lucide-react';
import {
  QualitySummary,
  QualityFlagType,
  QualitySeverity,
  severityConfig,
  qualityFlagConfig,
} from '../../types/supervision';

interface QualityBadgeProps {
  summary: QualitySummary | null;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onClick?: () => void;
}

/**
 * Badge que mostra o status de qualidade de uma conversa
 * Exibe a severidade maxima e quantidade de problemas
 */
export const QualityBadge: React.FC<QualityBadgeProps> = ({
  summary,
  size = 'sm',
  showCount = true,
  onClick,
}) => {
  // Se nao tem resumo ou nao tem problemas, nao mostra nada
  if (!summary || summary.total_unresolved === 0) {
    return null;
  }

  const severity = summary.max_severity;
  if (!severity) return null;

  const config = severityConfig[severity];
  const total = summary.total_unresolved;

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-full
        ${config.bgColor} ${config.color}
        ${sizeClasses[size]}
        transition-all hover:scale-110
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
      title={`${total} problema(s) - ${config.label}`}
    >
      <AlertTriangle size={iconSize[size]} />

      {/* Contador */}
      {showCount && total > 1 && (
        <span className={`
          absolute -top-1 -right-1 min-w-[14px] h-[14px]
          flex items-center justify-center
          text-[10px] font-bold rounded-full
          bg-bg-primary border border-current
          ${config.color}
        `}>
          {total > 9 ? '9+' : total}
        </span>
      )}

      {/* Pulse para critico */}
      {severity === 'critical' && (
        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
      )}
    </button>
  );
};

interface QualityFlagIconProps {
  flagType: QualityFlagType;
  size?: number;
  className?: string;
}

/**
 * Icone especifico para cada tipo de flag
 */
export const QualityFlagIcon: React.FC<QualityFlagIconProps> = ({
  flagType,
  size = 16,
  className = '',
}) => {
  const config = qualityFlagConfig[flagType];

  const IconComponent = {
    FUGA_PROMPT: AlertTriangle,
    ERRO_INFO: XCircle,
    TOM_INADEQUADO: MessageCircle,
    NAO_RESPONDEU: Clock,
    REPETITIVO: Repeat,
    BUG_TECNICO: Bug,
  }[flagType];

  return <IconComponent size={size} className={`${config.color} ${className}`} />;
};

interface QualityIndicatorProps {
  summary: QualitySummary | null;
  expanded?: boolean;
}

/**
 * Indicador expandido com detalhes dos tipos de problema
 */
export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  summary,
  expanded = false,
}) => {
  if (!summary || summary.total_unresolved === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-xs">
        <Shield size={14} />
        <span>Sem problemas</span>
      </div>
    );
  }

  const severity = summary.max_severity;
  const config = severity ? severityConfig[severity] : null;

  if (!expanded) {
    return (
      <div className={`flex items-center gap-2 text-xs ${config?.color || 'text-text-muted'}`}>
        <AlertTriangle size={14} />
        <span>{summary.total_unresolved} problema(s)</span>
      </div>
    );
  }

  // Versao expandida com breakdown por tipo
  const flagTypes: { type: QualityFlagType; count: number }[] = [
    { type: 'FUGA_PROMPT', count: summary.fuga_count },
    { type: 'ERRO_INFO', count: summary.erro_count },
    { type: 'NAO_RESPONDEU', count: summary.timeout_count },
    { type: 'BUG_TECNICO', count: summary.bug_count },
  ].filter(f => f.count > 0);

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-sm font-medium ${config?.color || 'text-text-muted'}`}>
        <AlertTriangle size={16} />
        <span>{summary.total_unresolved} problema(s) detectado(s)</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {flagTypes.map(({ type, count }) => {
          const flagConfig = qualityFlagConfig[type];
          return (
            <div
              key={type}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${flagConfig.bgColor} ${flagConfig.color}`}
            >
              <QualityFlagIcon flagType={type} size={12} />
              <span>{flagConfig.label}</span>
              {count > 1 && <span className="font-bold">({count})</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SeverityBadgeProps {
  severity: QualitySeverity;
  size?: 'sm' | 'md';
}

/**
 * Badge de severidade isolado
 */
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'sm',
}) => {
  const config = severityConfig[severity];

  return (
    <span className={`
      px-2 py-0.5 rounded-full text-xs font-medium
      ${config.bgColor} ${config.color}
      ${size === 'md' ? 'px-3 py-1' : ''}
    `}>
      {config.label}
    </span>
  );
};
