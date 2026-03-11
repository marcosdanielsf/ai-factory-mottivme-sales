import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { QualityGatesResult } from '../../../hooks/useQualityGates';

interface QualityGatesBadgeProps {
  result: QualityGatesResult;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG = {
  pass: {
    icon: ShieldCheck,
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    label: 'Quality OK',
  },
  warn: {
    icon: ShieldAlert,
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Avisos',
  },
  block: {
    icon: ShieldX,
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Bloqueado',
  },
} as const;

export function QualityGatesBadge({ result, onClick, className = '' }: QualityGatesBadgeProps) {
  const config = STATUS_CONFIG[result.overallStatus];
  const Icon = config.icon;

  const summary =
    result.overallStatus === 'block'
      ? `${result.blockers} bloqueio${result.blockers !== 1 ? 's' : ''}`
      : result.overallStatus === 'warn'
      ? `${result.warnings} aviso${result.warnings !== 1 ? 's' : ''}`
      : `${result.passed}/${result.gates.length} OK`;

  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver quality gates"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-opacity hover:opacity-80 ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{summary}</span>
    </button>
  );
}
