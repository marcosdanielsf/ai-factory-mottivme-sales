import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart, CartesianGrid,
} from 'recharts';
import { DollarSign, Eye, MousePointer, MessageCircle, Heart, FileText, Target, Megaphone, RefreshCw, UserCheck } from 'lucide-react';
import { MetricCard } from '../../../../components/MetricCard';
import { formatCurrency, formatNumber, formatDayLabel, formatPct, formatDelta, deltaDirection, calcConnectRate } from '../../helpers';
import type { AdsOverview, AdsSummaryByDate, AdsPeriodDeltas } from '../../types';

interface OverviewTabProps {
  overview: AdsOverview;
  porDia: AdsSummaryByDate[];
  periodDeltas: AdsPeriodDeltas;
  loading: boolean;
  dateRangeLabel: string;
}

const tooltipStyle = { backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' };

export const OverviewTab: React.FC<OverviewTabProps> = ({ overview, porDia, periodDeltas, loading, dateRangeLabel }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  const chartData = useMemo(() => porDia.map(d => ({
    data: d.data_relatorio,
    clicks: d.total_clicks || 0,
    cadastros: d.total_form_submissions || 0,
    conversas: d.total_conversas || 0,
    spend: d.total_spend || 0,
    reach: d.total_reach || 0,
    cpc: d.total_clicks > 0 ? d.total_spend / d.total_clicks : 0,
    ctr: d.avg_ctr || (d.total_impressions > 0 ? (d.total_clicks / d.total_impressions) * 100 : 0),
    cpm: d.avg_cpm || (d.total_impressions > 0 ? (d.total_spend / d.total_impressions) * 1000 : 0),
    connectRate: calcConnectRate(d.total_conversas || 0, d.total_clicks || 0),
  })), [porDia]);

  return (
    <div className="space-y-4">
      {/* Bloco 1 — KPI Strip (9 cards, 2 rows) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Valor Usado"
          value={formatCurrency(overview.totalSpend)}
          icon={DollarSign}
          trend={formatDelta(periodDeltas.spend)}
          trendDirection={deltaDirection(periodDeltas.spend)}
          subtext="No periodo"
        />
        <MetricCard
          title="Impressoes"
          value={formatNumber(overview.totalImpressions)}
          icon={Eye}
          trend={formatDelta(periodDeltas.impressions)}
          trendDirection={deltaDirection(periodDeltas.impressions)}
          subtext={`CPM: ${formatCurrency(overview.avgCpm)}`}
        />
        <MetricCard
          title="Cliques no Link"
          value={formatNumber(overview.totalClicks)}
          icon={MousePointer}
          trend={formatDelta(periodDeltas.clicks)}
          trendDirection={deltaDirection(periodDeltas.clicks)}
          subtext={`CTR: ${formatPct(overview.ctr)} | CPC: ${formatCurrency(overview.avgCpc)}`}
        />
        <MetricCard
          title="Reacoes"
          value={formatNumber(overview.totalReactions)}
          icon={Heart}
          trend={formatDelta(periodDeltas.reactions)}
          trendDirection={deltaDirection(periodDeltas.reactions)}
          subtext="Curtidas, amei, etc."
        />
        <MetricCard
          title="Cadastros Formulario"
          value={formatNumber(overview.totalFormSubmissions)}
          icon={FileText}
          trend={formatDelta(periodDeltas.formSubmissions)}
          trendDirection={deltaDirection(periodDeltas.formSubmissions)}
          subtext={overview.custoPorCadastro > 0 ? `Custo: ${formatCurrency(overview.custoPorCadastro)}/cad` : 'Sem cadastros'}
        />
        <MetricCard
          title="Conversas Iniciadas"
          value={formatNumber(overview.totalConversas)}
          icon={MessageCircle}
          trend={formatDelta(periodDeltas.conversas)}
          trendDirection={deltaDirection(periodDeltas.conversas)}
          subtext={`Custo: ${formatCurrency(overview.custoPorConversa)}/conversa`}
        />
        <MetricCard
          title="Custo/Cadastro"
          value={overview.custoPorCadastro > 0 ? formatCurrency(overview.custoPorCadastro) : '-'}
          icon={Target}
          trend={formatDelta(periodDeltas.custoPorCadastro)}
          trendDirection={deltaDirection(periodDeltas.custoPorCadastro, true)}
          subtext="Menor = melhor"
        />
        <MetricCard
          title="Custo/Conversa"
          value={overview.custoPorConversa > 0 ? formatCurrency(overview.custoPorConversa) : '-'}
          icon={Megaphone}
          trend={formatDelta(periodDeltas.custoPorConversa)}
          trendDirection={deltaDirection(periodDeltas.custoPorConversa, true)}
          subtext="Menor = melhor"
        />
        <MetricCard
          title="Leads Qualificados"
          value={formatNumber(overview.leadsQualificados)}
          icon={UserCheck}
          subtext={overview.leadsQualificados > 0 ? `CPL: ${formatCurrency(overview.custoPorLeadQualificado)}` : 'Agendou + Fechou'}
        />
      </div>

      {/* Bloco 2 — Stacked Bar Chart (Cliques + Cadastros + Conversas) */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Desempenho Diario</h3>
            <p className="text-[10px] text-text-muted">{dateRangeLabel} — Cliques, Cadastros e Conversas empilhados</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" /><span className="text-text-muted">Cliques</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-400" /><span className="text-text-muted">Cadastros</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500" /><span className="text-text-muted">Conversas</span></div>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(l) => formatDayLabel(String(l))}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { clicks: 'Cliques', cadastros: 'Cadastros', conversas: 'Conversas' };
                  return [formatNumber(value), labels[name] || name];
                }}
              />
              <Bar dataKey="clicks" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cadastros" stackId="a" fill="#f59e0b" />
              <Bar dataKey="conversas" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">Sem dados para o periodo</div>
        )}
      </div>

      {/* Bloco 3 — Multi-line: Gasto + Alcance + Cliques + CPC */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Gasto, Alcance, Cliques e CPC</h3>
            <p className="text-[10px] text-text-muted">{dateRangeLabel}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-500" /><span className="text-text-muted">Gasto (R$)</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-500" /><span className="text-text-muted">Alcance</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400" /><span className="text-text-muted">Cliques</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500" /><span className="text-text-muted">CPC (R$)</span></div>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#888' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#f59e0b' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(l) => formatDayLabel(String(l))}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = { spend: 'Gasto', reach: 'Alcance', clicks: 'Cliques', cpc: 'CPC' };
                  const isCurrency = name === 'spend' || name === 'cpc';
                  return [isCurrency ? formatCurrency(value) : formatNumber(value), labels[name] || name];
                }}
              />
              <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="reach" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#f87171" strokeWidth={1.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="cpc" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-text-muted text-sm">Sem dados para o periodo</div>
        )}
      </div>

      {/* Bloco 4 + 5 side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* Bloco 4 — CTR + CPM */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">CTR e CPM</h3>
              <p className="text-[10px] text-text-muted">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-cyan-400" /><span className="text-text-muted">CTR %</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-rose-400" /><span className="text-text-muted">CPM R$</span></div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#22d3ee' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#fb7185' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(l) => formatDayLabel(String(l))}
                  formatter={(value: number, name: string) => {
                    if (name === 'ctr') return [formatPct(value), 'CTR'];
                    return [formatCurrency(value), 'CPM'];
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="ctr" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="cpm" stroke="#fb7185" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">Sem dados</div>
          )}
        </div>

        {/* Bloco 5 — Connect Rate % */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Connect Rate</h3>
              <p className="text-[10px] text-text-muted">{dateRangeLabel} — Conversas / Cliques x 100</p>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="w-2 h-2 rounded bg-emerald-400" /><span className="text-text-muted">Connect Rate %</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(l) => formatDayLabel(String(l))}
                  formatter={(value: number) => [formatPct(value), 'Connect Rate']}
                />
                <Line type="monotone" dataKey="connectRate" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">Sem dados</div>
          )}
        </div>
      </div>
    </div>
  );
};
