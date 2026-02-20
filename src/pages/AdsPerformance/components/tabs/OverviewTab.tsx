import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Eye, MousePointer, MessageCircle, TrendingUp, Activity } from 'lucide-react';
import type { AdsOverview, AdsSummaryByDate, CampanhaMetrics } from '../../types';

interface OverviewTabProps {
  overview: AdsOverview;
  porDia: AdsSummaryByDate[];
  campanhas: CampanhaMetrics[];
  loading: boolean;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6a4', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const MetricCard = ({ icon: Icon, label, value, subtitle, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) => (
  <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`p-1.5 rounded-md ${color}`}>
        <Icon size={16} />
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
    <div className="text-xl font-semibold text-text-primary">{value}</div>
    {subtitle && <div className="text-xs text-text-muted mt-1">{subtitle}</div>}
  </div>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({ overview, porDia, campanhas, loading }) => {
  if (loading) {
    return <div className="p-8 text-text-muted">Carregando metricas...</div>;
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
    <div className="space-y-6">
      {/* Cards de metricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Gasto Total"
          value={formatCurrency(overview.totalSpend)}
          color="bg-blue-500/10 text-blue-400"
        />
        <MetricCard
          icon={Eye}
          label="Impressoes"
          value={formatNumber(overview.totalImpressions)}
          color="bg-purple-500/10 text-purple-400"
        />
        <MetricCard
          icon={MousePointer}
          label="Cliques"
          value={formatNumber(overview.totalClicks)}
          subtitle={`CTR: ${overview.ctr.toFixed(2)}%`}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <MetricCard
          icon={MessageCircle}
          label="Conversas Iniciadas"
          value={formatNumber(overview.totalConversas)}
          color="bg-amber-500/10 text-amber-400"
        />
        <MetricCard
          icon={TrendingUp}
          label="CPC Medio"
          value={formatCurrency(overview.avgCpc)}
          color="bg-cyan-500/10 text-cyan-400"
        />
        <MetricCard
          icon={Activity}
          label="CPM Medio"
          value={formatCurrency(overview.avgCpm)}
          color="bg-pink-500/10 text-pink-400"
        />
        <MetricCard
          icon={DollarSign}
          label="Custo por Conversa"
          value={formatCurrency(overview.custoPorConversa)}
          color="bg-orange-500/10 text-orange-400"
        />
        <MetricCard
          icon={MousePointer}
          label="CTR"
          value={`${overview.ctr.toFixed(2)}%`}
          color="bg-indigo-500/10 text-indigo-400"
        />
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gasto diario */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-primary mb-4">Gasto Diario (R$)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                <XAxis
                  dataKey="data"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T12:00:00');
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                  labelFormatter={(v) => {
                    const d = new Date(v + 'T12:00:00');
                    return d.toLocaleDateString('pt-BR');
                  }}
                />
                <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">
              Sem dados para o periodo selecionado
            </div>
          )}
        </div>

        {/* Pie por campanha */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
          <h3 className="text-sm font-medium text-text-primary mb-4">Gasto por Campanha</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: '8px',
                    color: 'var(--color-text-primary)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: 'var(--color-text-muted)' }}
                />
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
