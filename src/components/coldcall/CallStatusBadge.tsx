import React from 'react';

// ─── Types ───────────────────────────────────────────────

interface CallStatusBadgeProps {
  status?: string;
  outcome?: string;
  size?: 'sm' | 'md';
  className?: string;
}

// ─── Status/Outcome → Style Map ──────────────────────────

type BadgeStyle = { bg: string; text: string; border: string; label: string };

const OUTCOME_STYLES: Record<string, BadgeStyle> = {
  agendou: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    label: 'Agendou',
  },
  interessado: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Interessado',
  },
  nao_atendeu: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Não Atendeu',
  },
  recusou: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Recusou',
  },
  caixa_postal: {
    bg: 'bg-gray-500/15',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    label: 'Caixa Postal',
  },
};

const STATUS_STYLES: Record<string, BadgeStyle> = {
  completed: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    border: 'border-green-500/30',
    label: 'Concluída',
  },
  failed: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/30',
    label: 'Falhou',
  },
  initiated: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Iniciada',
  },
  ringing: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    label: 'Chamando',
  },
  in_progress: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'Em Andamento',
  },
  queued: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'Na Fila',
  },
};

const DEFAULT_STYLE: BadgeStyle = {
  bg: 'bg-gray-500/15',
  text: 'text-gray-400',
  border: 'border-gray-500/30',
  label: '—',
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

// ─── Component ───────────────────────────────────────────

export function CallStatusBadge({
  status,
  outcome,
  size = 'sm',
  className = '',
}: CallStatusBadgeProps) {
  // Outcome takes priority over status
  const key = outcome?.toLowerCase() ?? status?.toLowerCase() ?? '';
  const style =
    OUTCOME_STYLES[key] ?? STATUS_STYLES[key] ?? { ...DEFAULT_STYLE, label: outcome ?? status ?? '—' };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        transition-colors duration-150
        ${style.bg} ${style.text} ${style.border}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.text.replace('text-', 'bg-')}`}
      />
      {style.label}
    </span>
  );
}
