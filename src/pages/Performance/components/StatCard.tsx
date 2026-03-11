import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
  clickable = false
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: { value: number; label: string };
  onClick?: () => void;
  clickable?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const isClickable = clickable || !!onClick;

  return (
    <div
      onClick={onClick}
      className={`bg-bg-secondary border border-border-default rounded-lg p-4 transition-all ${
        isClickable
          ? 'cursor-pointer hover:border-accent-primary/50 hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-accent-primary/5 group'
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1">
            {title}
            {isClickable && (
              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-primary" />
            )}
          </p>
          <p className={`text-2xl font-bold text-text-primary mt-1 ${isClickable ? 'group-hover:text-accent-primary transition-colors' : ''}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]} ${isClickable ? 'group-hover:scale-110 transition-transform' : ''}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-xs text-text-muted font-mono">#{rank}</span>;
}

export function PercentageBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const colorClass: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-blue-500'
  };

  return (
    <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${colorClass[color] || 'bg-blue-500'} transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export function ClickableCell({
  value,
  onClick,
  highlight = false,
  className = ''
}: {
  value: number | string;
  onClick?: () => void;
  highlight?: boolean;
  className?: string;
}) {
  if (!onClick) {
    return <span className={className}>{value}</span>;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        px-2 py-1 rounded-md transition-all
        hover:bg-accent-primary/10 hover:text-accent-primary
        active:scale-95 cursor-pointer
        ${highlight ? 'font-semibold text-emerald-400' : 'text-text-primary'}
        ${className}
      `}
      title="Clique para ver detalhes"
    >
      {value}
    </button>
  );
}

export function AlertBadge({ type }: { type: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    baixa_resposta: { label: 'Baixa Resposta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    baixa_conversao: { label: 'Baixa Conversão', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    custo_sem_resultado: { label: 'Custo Alto', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    score_baixo: { label: 'Score Baixo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
  };

  const config = configs[type] || { label: type, color: 'bg-gray-500/20 text-gray-400' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${config.color}`}>
      {config.label}
    </span>
  );
}

export function ToggleSwitch({
  isOn,
  onToggle,
  disabled = false,
  loading = false
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || loading}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${isOn ? 'bg-emerald-500' : 'bg-bg-tertiary'}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isOn ? 'translate-x-6' : 'translate-x-1'}
          ${loading ? 'animate-pulse' : ''}
        `}
      />
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-400' },
    draft: { label: 'Rascunho', color: 'bg-amber-500/20 text-amber-400' },
    published: { label: 'Publicado', color: 'bg-blue-500/20 text-blue-400' },
    archived: { label: 'Arquivado', color: 'bg-gray-500/20 text-gray-400' }
  };
  const config = configs[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
