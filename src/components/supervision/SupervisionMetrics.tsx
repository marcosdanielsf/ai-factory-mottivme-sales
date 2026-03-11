import React, { useMemo, useState } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Clock,
  Target,
} from 'lucide-react';
import {
  SupervisionConversation,
  supervisionStatusConfig,
  FilterOption,
  lostReasonConfig,
  LostReason,
} from '../../types/supervision';
import { useSupervisionMetrics } from '../../hooks/useSupervisionMetrics';

interface SupervisionMetricsProps {
  conversations: SupervisionConversation[];
  filterOptions?: {
    locations: FilterOption[];
    channels: FilterOption[];
    etapasFunil: FilterOption[];
    responsaveis: FilterOption[];
  };
}

interface MetricCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  change?: number;
}

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
] as const;

type PeriodFilter = typeof PERIOD_OPTIONS[number]['value'];

export const SupervisionMetrics: React.FC<SupervisionMetricsProps> = ({ conversations, filterOptions }) => {
  const [viewMode, setViewMode] = useState<'geral' | 'individual'>('geral');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  // Buscar metricas reais via RPC do Supabase (cobre todos os leads, nao apenas os 50 carregados)
  const daysBack = periodFilter !== 'all' ? parseInt(periodFilter) : null;
  const { data: serverMetrics, loading: serverLoading } = useSupervisionMetrics({
    locationId: clientFilter,
    channel: channelFilter,
    daysBack,
  });

  // Apply local filters before computing metrics (fallback client-side)
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    if (periodFilter !== 'all') {
      const days = parseInt(periodFilter);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((c) => new Date(c.last_message_at) >= cutoff);
    }

    if (clientFilter) {
      filtered = filtered.filter((c) => c.location_id === clientFilter);
    }

    if (channelFilter) {
      filtered = filtered.filter((c) => c.channel === channelFilter);
    }

    return filtered;
  }, [conversations, periodFilter, clientFilter, channelFilter]);

  const metrics = useMemo(() => {
    // Usar dados reais do servidor quando disponivel
    if (serverMetrics) {
      const s = serverMetrics.by_status ?? {};
      const total = serverMetrics.total ?? 0;
      const noResponse = serverMetrics.no_response ?? 0;
      const converted = s['converted'] ?? 0;
      const lost = s['lost'] ?? 0;
      return {
        total,
        aiActive: s['ai_active'] ?? 0,
        aiPaused: s['ai_paused'] ?? 0,
        scheduled: s['scheduled'] ?? 0,
        converted,
        lost,
        archived: s['archived'] ?? 0,
        noResponse,
        conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : '0',
        lossRate: total > 0 ? ((lost / total) * 100).toFixed(1) : '0',
        responseRate: total > 0 ? (((total - noResponse) / total) * 100).toFixed(1) : '0',
      };
    }

    // Fallback: calculo client-side com os dados carregados (ate 50 leads)
    const total = filteredConversations.length;
    const aiActive = filteredConversations.filter((c) => c.supervision_status === 'ai_active').length;
    const aiPaused = filteredConversations.filter((c) => c.supervision_status === 'ai_paused').length;
    const scheduled = filteredConversations.filter((c) => c.supervision_status === 'scheduled').length;
    const converted = filteredConversations.filter((c) => c.supervision_status === 'converted').length;
    const lost = filteredConversations.filter((c) => c.supervision_status === 'lost').length;
    const archived = filteredConversations.filter((c) => c.supervision_status === 'archived').length;
    const noResponse = filteredConversations.filter((c) => c.last_message_role === 'user').length;

    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';
    const lossRate = total > 0 ? ((lost / total) * 100).toFixed(1) : '0';
    const responseRate = total > 0 ? (((total - noResponse) / total) * 100).toFixed(1) : '0';

    return {
      total, aiActive, aiPaused, scheduled, converted, lost, archived, noResponse,
      conversionRate, lossRate, responseRate,
    };
  }, [serverMetrics, filteredConversations]);

  // Group by responsavel — usar dados do servidor quando disponivel
  const byResponsavel = useMemo(() => {
    if (serverMetrics?.by_responsavel) {
      return serverMetrics.by_responsavel.map((r) => ({
        name: r.name,
        total: r.total,
        converted: r.converted,
        scheduled: r.scheduled,
        lost: r.lost,
        noResponse: r.no_response,
        conversionRate: r.total > 0
          ? ((r.converted / r.total) * 100).toFixed(1)
          : '0',
      }));
    }

    // Fallback client-side
    const groups: Record<string, SupervisionConversation[]> = {};
    filteredConversations.forEach((c) => {
      const resp = c.usuario_responsavel || 'Sem responsavel';
      if (!groups[resp]) groups[resp] = [];
      groups[resp].push(c);
    });
    return Object.entries(groups)
      .map(([name, convs]) => ({
        name,
        total: convs.length,
        converted: convs.filter((c) => c.supervision_status === 'converted').length,
        scheduled: convs.filter((c) => c.supervision_status === 'scheduled').length,
        lost: convs.filter((c) => c.supervision_status === 'lost').length,
        noResponse: convs.filter((c) => c.last_message_role === 'user').length,
        conversionRate: convs.length > 0
          ? ((convs.filter((c) => c.supervision_status === 'converted').length / convs.length) * 100).toFixed(1)
          : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [serverMetrics, filteredConversations]);

  // Group by client — usar dados do servidor quando disponivel
  const byClient = useMemo(() => {
    if (serverMetrics?.by_client) {
      return serverMetrics.by_client.map((c) => ({
        name: c.client_name,
        total: c.total,
        converted: c.converted,
        lost: c.lost,
      }));
    }

    // Fallback client-side
    const groups: Record<string, SupervisionConversation[]> = {};
    filteredConversations.forEach((c) => {
      const client = c.client_name || 'Sem cliente';
      if (!groups[client]) groups[client] = [];
      groups[client].push(c);
    });
    return Object.entries(groups)
      .map(([name, convs]) => ({
        name,
        total: convs.length,
        converted: convs.filter((c) => c.supervision_status === 'converted').length,
        lost: convs.filter((c) => c.supervision_status === 'lost').length,
      }))
      .sort((a, b) => b.total - a.total);
  }, [serverMetrics, filteredConversations]);

  // Lost reasons — usar dados do servidor quando disponivel
  const lostReasons = useMemo(() => {
    if (serverMetrics?.lost_reasons) {
      return serverMetrics.lost_reasons.map((l) => ({
        reason: l.reason,
        count: l.cnt,
      }));
    }

    // Fallback client-side
    const reasons: Record<string, number> = {};
    filteredConversations
      .filter((c) => c.supervision_status === 'lost')
      .forEach((c) => {
        const reason = c.lost_reason || 'nao_especificado';
        reasons[reason] = (reasons[reason] || 0) + 1;
      });
    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [serverMetrics, filteredConversations]);

  const cards: MetricCard[] = [
    { label: 'Total de Leads', value: metrics.total, icon: <Users size={18} />, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
    { label: 'IA Ativa', value: metrics.aiActive, icon: <MessageSquare size={18} />, color: 'text-green-400', bgColor: 'bg-green-400/10' },
    { label: 'Agendados', value: metrics.scheduled, icon: <Calendar size={18} />, color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
    { label: 'Convertidos', value: metrics.converted, icon: <CheckCircle size={18} />, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { label: 'Perdidos', value: metrics.lost, icon: <XCircle size={18} />, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    { label: 'Taxa Conversao', value: `${metrics.conversionRate}%`, icon: <TrendingUp size={18} />, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' },
    { label: 'Taxa Perda', value: `${metrics.lossRate}%`, icon: <ArrowDownRight size={18} />, color: 'text-red-400', bgColor: 'bg-red-400/10' },
    { label: 'Sem Resposta', value: metrics.noResponse, icon: <Clock size={18} />, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <BarChart3 size={20} className="text-accent-primary" />
          Metricas do Time
          {/* Indicador de fonte dos dados */}
          {serverLoading ? (
            <span className="text-[10px] px-2 py-0.5 bg-bg-hover text-text-muted rounded-full animate-pulse">
              Carregando...
            </span>
          ) : serverMetrics ? (
            <span className="text-[10px] px-2 py-0.5 bg-green-400/10 text-green-400 rounded-full">
              Dados completos ({metrics.total} leads)
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-full">
              Dados parciais ({metrics.total} leads)
            </span>
          )}
        </h2>
        <div className="flex bg-bg-hover rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('geral')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'geral' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Visao Geral
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'individual' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Por Vendedor
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Periodo */}
        <div className="flex bg-bg-hover rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriodFilter(opt.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                periodFilter === opt.value
                  ? 'bg-accent-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Cliente */}
        {filterOptions?.locations && filterOptions.locations.length > 0 && (
          <select
            value={clientFilter ?? ''}
            onChange={(e) => setClientFilter(e.target.value || null)}
            className="px-2 py-1 bg-bg-primary border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="">Todos Clientes</option>
            {filterOptions.locations.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label} ({loc.count})
              </option>
            ))}
          </select>
        )}

        {/* Canal */}
        {filterOptions?.channels && filterOptions.channels.length > 0 && (
          <select
            value={channelFilter ?? ''}
            onChange={(e) => setChannelFilter(e.target.value || null)}
            className="px-2 py-1 bg-bg-primary border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="">Todos Canais</option>
            {filterOptions.channels.map((ch) => (
              <option key={ch.value} value={ch.value}>
                {ch.label} ({ch.count})
              </option>
            ))}
          </select>
        )}

        {/* Indicador de filtros ativos */}
        {(periodFilter !== 'all' || clientFilter || channelFilter) && (
          <button
            onClick={() => { setPeriodFilter('all'); setClientFilter(null); setChannelFilter(null); }}
            className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary border border-border-default rounded-lg transition-colors"
          >
            Limpar filtros
          </button>
        )}

        {/* Contador de resultados filtrados */}
        {(periodFilter !== 'all' || clientFilter || channelFilter) && (
          <span className="text-xs text-text-muted ml-auto">
            {filteredConversations.length} de {conversations.length} leads
          </span>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-bg-secondary border border-border-default rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {viewMode === 'geral' ? (
        <>
          {/* Funil Visual */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target size={16} className="text-accent-primary" />
              Funil de Conversao
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Total Leads', value: metrics.total, color: 'bg-blue-400', pct: 100 },
                { label: 'IA Ativa', value: metrics.aiActive, color: 'bg-green-400', pct: metrics.total > 0 ? (metrics.aiActive / metrics.total) * 100 : 0 },
                { label: 'Agendados', value: metrics.scheduled, color: 'bg-purple-400', pct: metrics.total > 0 ? (metrics.scheduled / metrics.total) * 100 : 0 },
                { label: 'Convertidos', value: metrics.converted, color: 'bg-emerald-400', pct: metrics.total > 0 ? (metrics.converted / metrics.total) * 100 : 0 },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-24 shrink-0">{step.label}</span>
                  <div className="flex-1 h-6 bg-bg-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} rounded-full transition-all flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(step.pct, 2)}%` }}
                    >
                      {step.pct > 15 && (
                        <span className="text-[10px] text-white font-medium">{step.value}</span>
                      )}
                    </div>
                  </div>
                  {step.pct <= 15 && (
                    <span className="text-xs text-text-muted w-8">{step.value}</span>
                  )}
                  <span className="text-xs text-text-muted w-12 text-right">{step.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Client */}
          <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Performance por Cliente</h3>
            <div className="space-y-2">
              {byClient.slice(0, 8).map((client) => (
                <div key={client.name} className="flex items-center justify-between py-1.5 border-b border-border-default/30 last:border-0">
                  <span className="text-sm text-text-primary truncate flex-1">{client.name}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-text-muted">{client.total} leads</span>
                    <span className="text-xs text-emerald-400">{client.converted} conv</span>
                    <span className="text-xs text-red-400">{client.lost} perd</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lost Reasons */}
          {(lostReasons.length > 0 || metrics.lost > 0) && (
            <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <XCircle size={16} className="text-red-400" />
                Motivos de Perda
                <span className="text-xs text-text-muted ml-1">({metrics.lost} total)</span>
              </h3>
              <div className="space-y-2">
                {lostReasons.map(({ reason, count }) => {
                  const pct = metrics.lost > 0 ? (count / metrics.lost) * 100 : 0;
                  return (
                    <div key={reason} className="flex items-center gap-3">
                      <span className="text-xs text-text-secondary w-40 truncate">
                        {lostReasonConfig[reason as LostReason]?.label || reason.replace(/_/g, ' ')}
                      </span>
                      <div className="flex-1 h-4 bg-bg-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400/60 rounded-full"
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted w-16 text-right">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Tabela resumo com todos os motivos (inclusive zerados) */}
              <div className="mt-3 pt-3 border-t border-border-default/30 grid grid-cols-2 gap-2">
                {Object.entries(lostReasonConfig).map(([key, config]) => {
                  const count = lostReasons.find((r) => r.reason === key)?.count || 0;
                  return (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-text-muted truncate pr-2">{config.label}</span>
                      <span className={count > 0 ? 'text-red-400 font-medium shrink-0' : 'text-text-muted shrink-0'}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Individual View - Performance by Responsavel */
        <div className="space-y-3">
          {byResponsavel.map((resp) => (
            <div key={resp.name} className="bg-bg-secondary border border-border-default rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center">
                    <UserCheck size={16} className="text-accent-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{resp.name}</h4>
                    <p className="text-xs text-text-muted">{resp.total} leads totais</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-400/10">
                  <ArrowUpRight size={12} className="text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">{resp.conversionRate}%</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-bg-primary rounded-lg">
                  <p className="text-lg font-bold text-text-primary">{resp.total}</p>
                  <p className="text-[10px] text-text-muted">Total</p>
                </div>
                <div className="text-center p-2 bg-bg-primary rounded-lg">
                  <p className="text-lg font-bold text-purple-400">{resp.scheduled}</p>
                  <p className="text-[10px] text-text-muted">Agendados</p>
                </div>
                <div className="text-center p-2 bg-bg-primary rounded-lg">
                  <p className="text-lg font-bold text-emerald-400">{resp.converted}</p>
                  <p className="text-[10px] text-text-muted">Convertidos</p>
                </div>
                <div className="text-center p-2 bg-bg-primary rounded-lg">
                  <p className="text-lg font-bold text-red-400">{resp.lost}</p>
                  <p className="text-[10px] text-text-muted">Perdidos</p>
                </div>
              </div>
            </div>
          ))}

          {byResponsavel.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">
              Nenhum dado de responsavel disponivel
            </div>
          )}
        </div>
      )}
    </div>
  );
};
