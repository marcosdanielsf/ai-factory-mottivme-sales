import React, { useState, useMemo } from 'react';
import { useIrisDashboard } from '../hooks/useIrisDashboard';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  AlertTriangle,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

const CLASSIFICATION_PRIORITY: Record<string, number> = {
  DESLIGAR: 0,
  FADIGA: 1,
  SATURANDO: 2,
  OTIMIZAR: 3,
  ESCALAR: 4,
  MANTER: 5,
  'POUCO DADO': 6,
};

function classificationRowStyle(classification: string | null | undefined) {
  const c = (classification ?? '').toUpperCase();
  if (c === 'DESLIGAR' || c === 'FADIGA')
    return 'bg-red-500/5 border-l-2 border-red-500';
  if (c === 'SATURANDO' || c === 'OTIMIZAR')
    return 'bg-amber-500/5 border-l-2 border-amber-500';
  if (c === 'ESCALAR')
    return 'bg-green-500/5 border-l-2 border-green-500';
  if (c === 'POUCO DADO') return 'opacity-50';
  return '';
}

function priorityOf(classification: string | null | undefined): number {
  return CLASSIFICATION_PRIORITY[(classification ?? '').toUpperCase()] ?? 99;
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function fmtCurrency(value: number | null | undefined, symbol = 'R$'): string {
  if (value == null || isNaN(value)) return '—';
  return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return value.toLocaleString('pt-BR');
}

function fmtPercent(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return `${value.toFixed(2)}%`;
}

function truncate(str: string | null | undefined, max = 40): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ---------------------------------------------------------------------------
// Chart tooltip style
// ---------------------------------------------------------------------------

const chartTooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f9fafb',
};

// ---------------------------------------------------------------------------
// Reusable tiny components
// ---------------------------------------------------------------------------

function KpiCard({
  icon: Icon,
  label,
  value,
  color = 'text-accent-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-bg-tertiary ${color}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-text-primary truncate">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort column type
// ---------------------------------------------------------------------------

type SortKey =
  | 'classification'
  | 'ad_name'
  | 'campaign_name'
  | 'spend'
  | 'leads'
  | 'cpl'
  | 'ctr'
  | 'cpc'
  | 'frequency'
  | 'status';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const IrisDashboard = () => {
  const {
    accounts,
    creatives,
    funnels,
    alerts,
    trends,
    loading,
    error,
    refetch,
    clientFilter,
    setClientFilter,
  } = useIrisDashboard();

  const [sortKey, setSortKey] = useState<SortKey>('classification');
  const [sortAsc, setSortAsc] = useState(true);

  // ---- Client names for filter dropdown ----
  const clientNames = useMemo(() => {
    if (!accounts) return [];
    const names = Array.from(new Set(accounts.map((a: any) => a.client_name).filter(Boolean)));
    return names.sort() as string[];
  }, [accounts]);

  // ---- Aggregated KPIs ----
  const kpis = useMemo(() => {
    if (!accounts || accounts.length === 0)
      return { spend: 0, leads: 0, cpl: 0, ctr: 0, activeCampaigns: 0, currency: 'R$' };

    let totalSpend = 0;
    let totalLeads = 0;
    let totalImpressions = 0;
    let weightedCtr = 0;
    let activeCampaigns = 0;
    const currencyCounts: Record<string, number> = {};

    for (const a of accounts) {
      const spend = Number(a.spend) || 0;
      const leads = Number(a.leads) || 0;
      const impressions = Number(a.impressions) || 0;
      const ctr = Number(a.ctr) || 0;
      const campaigns = Number(a.active_campaigns) || 0;
      const cur = a.currency || 'BRL';

      totalSpend += spend;
      totalLeads += leads;
      totalImpressions += impressions;
      weightedCtr += ctr * impressions;
      activeCampaigns += campaigns;
      currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;
    }

    const avgCtr = totalImpressions > 0 ? weightedCtr / totalImpressions : 0;
    const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    // majority currency
    let currency = 'R$';
    let maxCount = 0;
    for (const [cur, count] of Object.entries(currencyCounts)) {
      if (count > maxCount) {
        maxCount = count;
        currency = cur === 'USD' ? '$' : 'R$';
      }
    }

    return { spend: totalSpend, leads: totalLeads, cpl: avgCpl, ctr: avgCtr, activeCampaigns, currency };
  }, [accounts]);

  const pendingAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((a: any) => a.status === 'pending' || !a.status);
  }, [alerts]);

  // ---- Last update ----
  const lastUpdate = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const dates = accounts.map((a: any) => a.snapshot_date).filter(Boolean).sort();
    return dates[dates.length - 1] ?? null;
  }, [accounts]);

  // ---- Trend chart data ----
  const trendData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    const grouped: Record<string, { date: string; spend: number; leads: number }> = {};
    for (const t of trends) {
      const d = t.snapshot_date;
      if (!d) continue;
      if (!grouped[d]) grouped[d] = { date: d, spend: 0, leads: 0 };
      grouped[d].spend += Number(t.spend) || 0;
      grouped[d].leads += Number(t.leads) || 0;
    }
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [trends]);

  // ---- Sorted creatives ----
  const sortedCreatives = useMemo(() => {
    if (!creatives || creatives.length === 0) return [];
    const arr = [...creatives];
    arr.sort((a: any, b: any) => {
      let valA: any;
      let valB: any;
      if (sortKey === 'classification') {
        valA = priorityOf(a.classification);
        valB = priorityOf(b.classification);
      } else if (sortKey === 'ad_name' || sortKey === 'campaign_name' || sortKey === 'status') {
        valA = (a[sortKey] ?? '').toLowerCase();
        valB = (b[sortKey] ?? '').toLowerCase();
      } else {
        valA = Number(a[sortKey]) || 0;
        valB = Number(b[sortKey]) || 0;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [creatives, sortKey, sortAsc]);

  // ---- Funnel data ----
  const funnelAgg = useMemo(() => {
    if (!funnels || funnels.length === 0) return null;
    let leads = 0;
    let replied = 0;
    let scheduled = 0;
    let closed = 0;
    let revenue = 0;
    let spend = 0;

    for (const f of funnels) {
      leads += Number(f.leads_generated) || 0;
      replied += Number(f.replied) || 0;
      scheduled += Number(f.scheduled) || 0;
      closed += Number(f.closed) || 0;
      revenue += Number(f.revenue) || 0;
      spend += Number(f.spend) || 0;
    }

    const roas = spend > 0 ? revenue / spend : 0;
    return { leads, replied, scheduled, closed, revenue, spend, roas };
  }, [funnels]);

  // ---- Sort handler ----
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={12} className="opacity-30" />;
    return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  // ============================
  // RENDER
  // ============================

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={32} className="animate-spin text-accent-primary" />
          <p className="text-text-secondary text-sm">Carregando IRIS...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle size={40} className="text-accent-error" />
          <p className="text-text-primary font-medium">Erro ao carregar dados</p>
          <p className="text-text-secondary text-sm max-w-md">{String(error)}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Empty
  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eye size={40} className="text-text-muted" />
          <p className="text-text-primary font-medium">Nenhum dado encontrado</p>
          <p className="text-text-secondary text-sm">Verifique se as contas Meta estão configuradas no IRIS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Activity size={24} className="text-accent-primary" />
            IRIS — Meta Ads Monitor
          </h1>
          {lastUpdate && (
            <p className="text-xs text-text-muted mt-1">
              Última atualização: {new Date(lastUpdate).toLocaleDateString('pt-BR')}{' '}
              {new Date(lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Client filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={clientFilter ?? ''}
              onChange={(e) => setClientFilter(e.target.value || null)}
              className="pl-8 pr-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary text-sm appearance-none cursor-pointer hover:bg-bg-hover transition-colors focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="">Todos os Clientes</option>
              {clientNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={refetch}
            className="p-2 bg-bg-secondary border border-border-default rounded-lg text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. KPI CARDS                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard
          icon={DollarSign}
          label="Investimento Total"
          value={fmtCurrency(kpis.spend, kpis.currency)}
          color="text-accent-primary"
        />
        <KpiCard
          icon={Users}
          label="Total Leads"
          value={fmtNumber(kpis.leads)}
          color="text-accent-success"
        />
        <KpiCard
          icon={Target}
          label="CPL Médio"
          value={fmtCurrency(kpis.cpl, kpis.currency)}
          color={kpis.cpl > 50 ? 'text-accent-error' : 'text-accent-success'}
        />
        <KpiCard
          icon={MousePointer}
          label="CTR Médio"
          value={fmtPercent(kpis.ctr)}
          color={kpis.ctr < 1 ? 'text-accent-warning' : 'text-accent-success'}
        />
        <KpiCard
          icon={Zap}
          label="Campanhas Ativas"
          value={fmtNumber(kpis.activeCampaigns)}
          color="text-accent-primary"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertas"
          value={String(pendingAlerts.length)}
          color={pendingAlerts.length > 0 ? 'text-accent-error' : 'text-text-muted'}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SPEND vs LEADS TREND                                            */}
      {/* ------------------------------------------------------------------ */}
      {trendData.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent-primary" />
            Investimento vs Leads (30 dias)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis
                  yAxisId="spend"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="leads"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: any, name: string) =>
                    name === 'spend'
                      ? [`${kpis.currency} ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Investimento']
                      : [Number(value).toLocaleString('pt-BR'), 'Leads']
                  }
                  labelFormatter={(label: string) => {
                    const d = new Date(label);
                    return d.toLocaleDateString('pt-BR');
                  }}
                />
                <Line
                  yAxisId="spend"
                  type="monotone"
                  dataKey="spend"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="leads"
                  type="monotone"
                  dataKey="leads"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 rounded" /> Investimento
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 rounded" /> Leads
            </span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. CREATIVES TABLE                                                 */}
      {/* ------------------------------------------------------------------ */}
      {sortedCreatives.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            🎨 Criativos
            <span className="text-xs text-text-muted font-normal ml-1">
              ({sortedCreatives.length})
            </span>
          </h2>

          <div className="overflow-x-auto -mx-4 md:-mx-6">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-default">
                  {(
                    [
                      ['classification', 'Class.'],
                      ['ad_name', 'Anúncio'],
                      ['campaign_name', 'Campanha'],
                      ['spend', 'Gasto'],
                      ['leads', 'Leads'],
                      ['cpl', 'CPL'],
                      ['ctr', 'CTR'],
                      ['cpc', 'CPC'],
                      ['frequency', 'Freq.'],
                      ['status', 'Status'],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-3 py-2 text-left cursor-pointer hover:text-text-secondary transition-colors select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {label} <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedCreatives.map((c: any, idx: number) => (
                  <tr
                    key={c.id ?? idx}
                    className={`border-b border-border-default/50 hover:bg-bg-hover transition-colors ${classificationRowStyle(c.classification)}`}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span title={c.classification ?? ''}>
                        {c.classification_emoji ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span title={c.ad_name ?? ''} className="text-text-primary">
                        {truncate(c.ad_name)}
                      </span>
                      {c.fatigue_signals && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-accent-warning">
                          {c.fatigue_signals}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                      {truncate(c.campaign_name, 30)}
                    </td>
                    <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">
                      {fmtCurrency(c.spend, kpis.currency)}
                    </td>
                    <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">
                      {fmtNumber(c.leads)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={
                          Number(c.cpl) > 50
                            ? 'text-accent-error'
                            : Number(c.cpl) > 30
                              ? 'text-accent-warning'
                              : 'text-accent-success'
                        }
                      >
                        {fmtCurrency(c.cpl, kpis.currency)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={
                          Number(c.ctr) < 1
                            ? 'text-accent-error'
                            : Number(c.ctr) < 2
                              ? 'text-accent-warning'
                              : 'text-accent-success'
                        }
                      >
                        {fmtPercent(c.ctr)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-text-primary whitespace-nowrap">
                      {fmtCurrency(c.cpc, kpis.currency)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={
                          Number(c.frequency) > 3
                            ? 'text-accent-error'
                            : Number(c.frequency) > 2
                              ? 'text-accent-warning'
                              : 'text-text-primary'
                        }
                      >
                        {c.frequency != null ? Number(c.frequency).toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          c.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-accent-success'
                            : 'bg-red-500/10 text-accent-error'
                        }`}
                      >
                        {c.status ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. FUNNEL                                                          */}
      {/* ------------------------------------------------------------------ */}
      {funnelAgg && funnelAgg.leads > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Target size={18} className="text-accent-primary" />
            Funil de Conversão
            {funnelAgg.roas > 0 && (
              <span className="ml-auto text-xs font-normal text-accent-success">
                ROAS {funnelAgg.roas.toFixed(2)}x
              </span>
            )}
          </h2>

          <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
            {(
              [
                { label: 'Leads Gerados', value: funnelAgg.leads },
                { label: 'Responderam', value: funnelAgg.replied },
                { label: 'Agendaram', value: funnelAgg.scheduled },
                { label: 'Fecharam', value: funnelAgg.closed },
              ] as { label: string; value: number }[]
            ).map((step, i, arr) => {
              const prevValue = i > 0 ? arr[i - 1].value : step.value;
              const convRate = prevValue > 0 ? (step.value / prevValue) * 100 : 0;
              const isBottleneck = i > 0 && convRate < 20;

              return (
                <React.Fragment key={step.label}>
                  {i > 0 && (
                    <div className="flex items-center justify-center md:px-1 py-1 md:py-0">
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-[10px] font-medium ${
                            isBottleneck ? 'text-accent-error' : 'text-text-muted'
                          }`}
                        >
                          {convRate.toFixed(0)}%
                        </span>
                        <span className="text-text-muted">→</span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`flex-1 rounded-lg p-3 text-center border ${
                      isBottleneck
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-border-default bg-bg-tertiary'
                    }`}
                  >
                    <p className="text-xl font-bold text-text-primary">{fmtNumber(step.value)}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{step.label}</p>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 6. ALERTS                                                          */}
      {/* ------------------------------------------------------------------ */}
      {pendingAlerts.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 md:p-6">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-accent-warning" />
            Alertas Pendentes
            <span className="ml-2 text-xs bg-accent-error/20 text-accent-error px-2 py-0.5 rounded-full font-normal">
              {pendingAlerts.length}
            </span>
          </h2>

          <div className="space-y-2">
            {pendingAlerts.map((alert: any, idx: number) => {
              const isCritical =
                alert.severity === 'critical' || alert.severity === 'high';
              return (
                <div
                  key={alert.id ?? idx}
                  className={`border-l-2 rounded-r-lg p-3 bg-bg-tertiary ${
                    isCritical ? 'border-red-500' : 'border-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {alert.title ?? 'Alerta'}
                      </p>
                      {alert.details && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {alert.details}
                        </p>
                      )}
                    </div>
                    {alert.client_name && (
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {alert.client_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IrisDashboard;
