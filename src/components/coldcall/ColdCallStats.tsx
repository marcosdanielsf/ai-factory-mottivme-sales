import React from 'react';
import {
  Phone,
  PhoneCall,
  CalendarCheck,
  Timer,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatCard } from '../ui/StatCard';

// ─── Types ───────────────────────────────────────────────

interface ColdCallMetricsAggregated {
  total_calls: number;
  answered_calls: number;
  connection_rate: number;      // 0–100
  appointments: number;
  avg_duration_seconds: number;
  conversion_rate: number;       // 0–100
  pending_retries: number;

  // Optional trend data (vs previous period)
  total_calls_trend?: number;
  connection_rate_trend?: number;
  appointments_trend?: number;
  avg_duration_trend?: number;
  conversion_rate_trend?: number;
  pending_retries_trend?: number;
}

interface ColdCallStatsProps {
  metrics: ColdCallMetricsAggregated;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface CardDef {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trendKey: keyof ColdCallMetricsAggregated;
}

// ─── Component ───────────────────────────────────────────

export function ColdCallStats({ metrics, className = '' }: ColdCallStatsProps) {
  const cards: CardDef[] = [
    {
      label: 'Total Ligações',
      value: metrics.total_calls,
      icon: Phone,
      trendKey: 'total_calls_trend',
    },
    {
      label: 'Taxa Conexão',
      value: `${metrics.connection_rate.toFixed(1)}%`,
      icon: PhoneCall,
      trendKey: 'connection_rate_trend',
    },
    {
      label: 'Agendamentos',
      value: metrics.appointments,
      icon: CalendarCheck,
      trendKey: 'appointments_trend',
    },
    {
      label: 'Duração Média',
      value: formatDuration(metrics.avg_duration_seconds),
      icon: Timer,
      trendKey: 'avg_duration_trend',
    },
    {
      label: 'Taxa Conversão',
      value: `${metrics.conversion_rate.toFixed(1)}%`,
      icon: TrendingUp,
      trendKey: 'conversion_rate_trend',
    },
    {
      label: 'Pendentes Retry',
      value: metrics.pending_retries,
      icon: RotateCcw,
      trendKey: 'pending_retries_trend',
    },
  ];

  return (
    <div
      className={`
        grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4
        ${className}
      `}
    >
      {cards.map((card) => {
        const trendVal = metrics[card.trendKey] as number | undefined;
        const trendProp =
          trendVal != null ? { value: trendVal, label: 'vs período ant.' } : undefined;
        return (
          <StatCard
            key={card.label}
            value={card.value}
            label={card.label}
            icon={card.icon as LucideIcon}
            trend={trendProp}
          />
        );
      })}
    </div>
  );
}
