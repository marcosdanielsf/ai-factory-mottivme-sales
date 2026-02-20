import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Eye, MousePointer, MessageCircle, RefreshCw } from 'lucide-react';
import { MetricCard } from '../../../../components/MetricCard';
import { formatCurrency, formatNumber, formatDayLabel } from '../../helpers';
import type { AdsOverview, AdsSummaryByDate, CampanhaMetrics } from '../../types';

interface OverviewTabProps {
  overview: AdsOverview;
  porDia: AdsSummaryByDate[];
  campanhas: CampanhaMetrics[];
  loading: boolean;
  dateRangeLabel: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6a4', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b'];

export const OverviewTab: React.FC<OverviewTabProps> = ({ overview, porDia, campanhas, loading, dateRangeLabel }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  const pieData = campanhas
    .filter(c => c.totalSpend > 0)
    .slice(0, 8)
    .map(c => ({
      name: c.campaign_name.length > 25 ? c.campaign_name.substring(0, 25) + '...' : c.campaign_name,
      value: c.totalSpend,
    }));

  const chartData = porDia.map(d => ({
    data: d.data_relatorio,
    spend: d.total_spend || 0,
    clicks: d.total_clicks || 0,
    impressions: d.total_impressions || 0,
    conversas: d.total_conversas || 0,
  }));

  return (
    <div className="space-y-4">
      {/* Cards de metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Gasto Total"
          value={formatCurrency(overview.totalSpend)}
          icon={DollarSign}
          subtext="No periodo"
        />
        <MetricCard
          title="Impressoes"
          value={formatNumber(overview.totalImpressions)}
          icon={Eye}
          subtext={`CPM: ${formatCurrency(overview.avgCpm)}`}
        />
        <MetricCard
          title="Cliques"
          value={formatNumber(overview.totalClicks)}
          icon={MousePointer}
          subtext={`CTR: ${overview.ctr.toFixed(2)}% | CPC: ${formatCurrency(overview.avgCpc)}`}
        />
        <MetricCard
          title="Conversas Iniciadas"
          value={formatNumber(overview.totalConversas)}
          icon={MessageCircle}
          subtext={`Custo: ${formatCurrency(overview.custoPorConversa)}/conversa`}
        />
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Gasto diario */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Gasto Diario (R$)</h3>
              <p className="text-[10px] text-text-muted">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-blue-500" />
                <span className="text-text-muted">Gasto</span>
              </div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickCount={8} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-bg-secondary border border-border-default rounded px-2 py-1 shadow-lg text-xs">
                          <p className="font-medium text-text-primary">{formatDayLabel(String(label))}</p>
                          <p className="text-blue-400">{formatCurrency(payload[0]?.value)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">
              Sem dados para o periodo selecionado
            </div>
          )}
        </div>

        {/* Pie por campanha */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Gasto por Campanha</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }} />
                <Legend verticalAlign="bottom" height={28} formatter={(value) => <span className="text-text-primary text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">
              Sem dados para o periodo selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
