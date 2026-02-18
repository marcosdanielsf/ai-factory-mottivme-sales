import React from 'react';
import { CalendarDays, CalendarRange, Calendar, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard } from '../../../../components/MetricCard';
import { formatDayLabel } from '../../helpers';
import type { MetricType } from '../../types';

interface AgendaTabProps {
  stats: {
    hoje: number;
    semana: number;
    mes: number;
  };
  porDia: any[];
  loading: boolean;
  isCustomDateFilter: boolean;
  dateRangeLabel: string;
  onCardClick: (metric: MetricType) => void;
  onBarClick: (data: any) => void;
}

export function AgendaTab({
  stats,
  porDia,
  loading,
  isCustomDateFilter,
  dateRangeLabel,
  onCardClick,
  onBarClick,
}: AgendaTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <MetricCard
          title={isCustomDateFilter ? 'No Periodo' : 'Hoje'}
          value={stats.hoje}
          icon={CalendarDays}
          onClick={() => onCardClick('hoje')}
          clickable
        />
        <MetricCard
          title={isCustomDateFilter ? '7d Periodo' : 'Ultimos 7 dias'}
          value={stats.semana}
          icon={CalendarRange}
          onClick={() => onCardClick('semana')}
          clickable
        />
        <MetricCard
          title={isCustomDateFilter ? '30d Periodo' : 'Ultimos 30 dias'}
          value={stats.mes}
          icon={Calendar}
          onClick={() => onCardClick('mes')}
          clickable
        />
      </div>

      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Agendamentos Para o Dia</h3>
            <p className="text-[10px] text-text-muted">Marcados para acontecer em cada dia · {dateRangeLabel}</p>
          </div>
        </div>
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <RefreshCw size={20} className="animate-spin text-text-muted" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porDia} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} tickCount={6} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-bg-secondary border border-border-default rounded px-2 py-1 shadow-lg text-xs">
                        <p className="font-medium text-text-primary">{formatDayLabel(label)}</p>
                        <p className="text-purple-400">{payload[0].value} agendamentos</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} cursor="pointer" onClick={onBarClick} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
