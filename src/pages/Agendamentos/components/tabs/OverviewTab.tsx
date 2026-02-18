import React from 'react';
import {
  Users,
  CalendarCheck,
  CheckCircle,
  Target,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MetricCard } from '../../../../components/MetricCard';
import { FunnelSummaryBar } from '../FunnelSummaryBar';
import { formatDayLabel } from '../../helpers';
import { DONUT_COLORS } from '../../constants';
import type { MetricType, OrigemType } from '../../types';

interface OverviewTabProps {
  stats: {
    totalAgendados: number;
    totalCompleted: number;
  };
  criativoTotals: {
    totalLeads: number;
    totalResponderam: number;
    totalAgendaram: number;
    totalCompareceram: number;
    totalFecharam: number;
  };
  criativoLeads: any[];
  porDia: any[];
  porDiaCriacao: any[];
  porOrigem: { origem: string; quantidade: number }[];
  loading: boolean;
  loadingCriativos: boolean;
  dateRangeLabel: string;
  onCardClick: (metric: MetricType) => void;
  onBarClick: (data: any) => void;
  onPieClick: (data: any) => void;
}

export function OverviewTab({
  stats,
  criativoTotals,
  criativoLeads,
  porDia,
  porDiaCriacao,
  porOrigem,
  loading,
  loadingCriativos,
  dateRangeLabel,
  onCardClick,
  onBarClick,
  onPieClick,
}: OverviewTabProps) {
  const funnelData = {
    totalLeads: criativoTotals.totalLeads,
    totalResponderam: criativoLeads.filter((l: any) => l.etapa_funil && l.etapa_funil.toLowerCase() !== 'novo').length,
    totalAgendaram: stats.totalAgendados,
    totalCompareceram: stats.totalCompleted,
    totalFecharam: criativoTotals.totalFecharam,
  };

  const donutData = porOrigem.map((item) => ({
    name: item.origem === 'trafego' ? 'Trafego Pago' : 'Social Selling',
    value: item.quantidade,
    origem: item.origem,
  }));

  return (
    <div className="space-y-4">
      <FunnelSummaryBar data={funnelData} loading={loadingCriativos || loading} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total de Leads"
          value={criativoTotals.totalLeads.toLocaleString()}
          icon={Users}
          subtext="No periodo"
          onClick={() => onCardClick('leads')}
          clickable
        />
        <MetricCard
          title="Total Agendados"
          value={stats.totalAgendados.toLocaleString()}
          icon={CalendarCheck}
          subtext={`${criativoTotals.totalLeads > 0 ? Math.round((stats.totalAgendados / criativoTotals.totalLeads) * 100) : 0}% dos leads`}
          onClick={() => onCardClick('mes')}
          clickable
        />
        <MetricCard
          title="Compareceram"
          value={criativoTotals.totalCompareceram.toLocaleString()}
          icon={CheckCircle}
          subtext={`${criativoTotals.totalAgendaram > 0 ? Math.round((criativoTotals.totalCompareceram / criativoTotals.totalAgendaram) * 100) : 0}% dos agendados`}
          onClick={() => onCardClick('comparecimento')}
          clickable
        />
        <MetricCard
          title="Fecharam"
          value={criativoTotals.totalFecharam.toLocaleString()}
          icon={Target}
          subtext={`${criativoTotals.totalCompareceram > 0 ? Math.round((criativoTotals.totalFecharam / criativoTotals.totalCompareceram) * 100) : 0}% dos que compareceram`}
          onClick={() => onCardClick('conversao')}
          clickable
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Agendamentos por Dia</h3>
              <p className="text-[10px] text-text-muted">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-blue-500" />
                <span className="text-text-muted">Agendamentos</span>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="h-72 flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-text-muted" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porDia} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickCount={8} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-bg-secondary border border-border-default rounded px-2 py-1 shadow-lg text-xs">
                          <p className="font-medium text-text-primary">{formatDayLabel(String(label))}</p>
                          <p className="text-blue-400">{payload[0]?.value} agendamentos</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} cursor="pointer" onClick={onBarClick} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Origem dos Leads</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <RefreshCw size={20} className="animate-spin text-text-muted" />
            </div>
          ) : donutData.every((d) => d.value === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center text-text-muted">
              <CalendarDays size={32} className="mb-2 opacity-50" />
              <p className="text-xs">Sem dados de origem</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={onPieClick}
                >
                  {donutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={28} formatter={(value) => <span className="text-text-primary text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
