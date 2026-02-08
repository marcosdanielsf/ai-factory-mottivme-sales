import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PhoneCall,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { useIsMobile } from '../hooks/useMediaQuery';

// ─── Hooks (Created by cold-call-hooks agent) ─────────────────────────
import { useColdCalls, ColdCallFilters, ColdCallLog } from '../hooks/useColdCalls';
import { useColdCallMetrics, ColdCallMetricsFilters } from '../hooks/useColdCallMetrics';
import { usePendingRetries } from '../hooks/usePendingRetries';
import { useCostSummary } from '../hooks/useCostSummary';

// ─── Components (Created by cold-call-components agent) ───────────────
import { ColdCallStats } from '../components/coldcall/ColdCallStats';
import { ColdCallChart } from '../components/coldcall/ColdCallChart';
import { ColdCallTable } from '../components/coldcall/ColdCallTable';
import { TranscriptModal } from '../components/coldcall/TranscriptModal';
import { RetryQueue } from '../components/coldcall/RetryQueue';
import { CostOverviewCards } from '../components/coldcall/CostOverviewCards';
import { CostBreakdownChart } from '../components/coldcall/CostBreakdownChart';
import { CostDailyTable } from '../components/coldcall/CostDailyTable';

// ─── Constants ────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 30_000;
const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os Status' },
  { value: 'completed', label: 'Completada' },
  { value: 'answered', label: 'Atendida' },
  { value: 'no_answer', label: 'Sem Resposta' },
  { value: 'failed', label: 'Falhada' },
  { value: 'ringing', label: 'Chamando' },
  { value: 'initiated', label: 'Iniciada' },
];

const OUTCOME_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os Resultados' },
  { value: 'agendou', label: 'Agendou' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'nao_atendeu', label: 'Não Atendeu' },
  { value: 'recusou', label: 'Recusou' },
  { value: 'caixa_postal', label: 'Caixa Postal' },
  { value: 'erro', label: 'Erro' },
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const ColdCallDashboard = () => {
  const isMobile = useIsMobile();

  // ─── Date range state (default: last 30 days) ────────────────────
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  // ─── Filter state ─────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // ─── Selected call for transcript modal ───────────────────────────
  const [selectedCall, setSelectedCall] = useState<ColdCallLog | null>(null);

  // ─── Build filters for useColdCalls ───────────────────────────────
  const callFilters = useMemo<ColdCallFilters>(() => {
    const f: ColdCallFilters = {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    };
    if (statusFilter) f.status = statusFilter;
    if (outcomeFilter) f.outcome = outcomeFilter;
    if (searchTerm) f.search = searchTerm;
    if (dateRange.startDate && dateRange.endDate) {
      f.dateRange = { from: dateRange.startDate, to: dateRange.endDate };
    }
    return f;
  }, [statusFilter, outcomeFilter, searchTerm, dateRange, page]);

  // ─── Build filters for useColdCallMetrics ─────────────────────────
  const metricsFilters = useMemo<ColdCallMetricsFilters>(() => {
    const f: ColdCallMetricsFilters = {};
    if (dateRange.startDate && dateRange.endDate) {
      f.dateRange = { from: dateRange.startDate, to: dateRange.endDate };
    }
    return f;
  }, [dateRange]);

  // ─── Hooks ────────────────────────────────────────────────────────
  const {
    calls,
    loading: callsLoading,
    error: callsError,
    total,
    refetch: refetchCalls,
  } = useColdCalls(callFilters);

  const {
    metrics,
    loading: metricsLoading,
    refetch: refetchMetrics,
  } = useColdCallMetrics(metricsFilters);

  const {
    retries,
    loading: retriesLoading,
    refetch: refetchRetries,
  } = usePendingRetries();

  const {
    data: costData,
    loading: costLoading,
    error: costError,
    refetch: refetchCosts,
  } = useCostSummary(30);

  // ─── Auto-refresh every 30s ───────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCalls();
      refetchMetrics();
      refetchRetries();
      refetchCosts();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [refetchCalls, refetchMetrics, refetchRetries, refetchCosts]);

  // ─── Reset page on filter change ─────────────────────────────────
  useEffect(() => {
    setPage(1);
  }, [statusFilter, outcomeFilter, searchTerm, dateRange]);

  // ─── Refresh all ──────────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchCalls(), refetchMetrics(), refetchRetries(), refetchCosts()]);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetchCalls, refetchMetrics, refetchRetries, refetchCosts]);

  // ─── Active filter count ──────────────────────────────────────────
  const activeFilterCount = [statusFilter, outcomeFilter, searchTerm].filter(Boolean).length;

  // ─── Clear all filters ────────────────────────────────────────────
  const clearFilters = () => {
    setStatusFilter('');
    setOutcomeFilter('');
    setSearchTerm('');
  };

  // ─── Pagination ───────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ─── Transform metrics for ColdCallStats component ────────────────
  // ColdCallStats expects: total_calls, answered_calls, connection_rate,
  // appointments, avg_duration_seconds, conversion_rate, pending_retries
  const statsMetrics = useMemo(() => ({
    total_calls: metrics.totalCalls,
    answered_calls: metrics.answered,
    connection_rate: metrics.totalCalls > 0
      ? parseFloat(((metrics.answered / metrics.totalCalls) * 100).toFixed(1))
      : 0,
    appointments: metrics.scheduled,
    avg_duration_seconds: metrics.avgDuration,
    conversion_rate: metrics.conversionRate,
    pending_retries: retries.length,
  }), [metrics, retries.length]);

  // ─── Transform dailyData for ColdCallChart ────────────────────────
  // ColdCallChart expects: { date, total, answered, appointments }[]
  const chartData = useMemo(() =>
    metrics.dailyData.map((d) => ({
      date: d.date,
      total: d.totalCalls,
      answered: d.answered,
      appointments: d.scheduled,
    })),
  [metrics.dailyData]);

  // ─── Transform retries for RetryQueue component ───────────────────
  // RetryQueue expects: { id, lead_name, lead_phone, attempt_number, ... }
  const retryQueueData = useMemo(() =>
    retries.map((r) => ({
      id: r.id,
      lead_name: r.lead_name ?? undefined,
      lead_phone: r.phone ?? undefined,
      attempt_number: r.attempt_number ?? 1,
      reason: r.outcome ?? undefined,
      next_retry_at: r.last_attempt_at ?? undefined,
    })),
  [retries]);

  // ─── Error state ──────────────────────────────────────────────────
  if (callsError) {
    return (
      <div className="bg-bg-primary min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar dados</h2>
          <p className="text-text-muted max-w-md mb-6">{callsError}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded-lg text-sm transition-colors"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4 md:space-y-6">

        {/* ─── HEADER ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary flex items-center gap-2">
              <PhoneCall size={isMobile ? 22 : 26} className="text-accent-primary" />
              Cold Call Dashboard
            </h1>
            <p className="text-text-muted text-xs md:text-sm mt-1">
              Monitoramento de ligações em tempo real
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ─── STATS GRID (6 cards) ────────────────────────────────── */}
        {metricsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
                <div className="h-3 bg-bg-hover rounded w-24 mb-3" />
                <div className="h-7 bg-bg-hover rounded w-16 mb-1" />
                <div className="h-2 bg-bg-hover rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <ColdCallStats metrics={statsMetrics} />
        )}

        {/* ─── CHART + RETRY QUEUE ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <ColdCallChart
              data={chartData}
              loading={metricsLoading}
            />
          </div>
          <div className="lg:col-span-1">
            {retriesLoading ? (
              <div className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-bg-hover rounded w-32 mb-4" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-bg-hover rounded mb-2" />
                ))}
              </div>
            ) : (
              <RetryQueue retries={retryQueueData} />
            )}
          </div>
        </div>

        {/* ─── COSTS SECTION ────────────────────────────────────────── */}
        <div className="pt-6 border-t border-border-default">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Custos</h2>
              <p className="text-xs text-text-muted">Análise detalhada de gastos por componente</p>
            </div>
          </div>

          {costLoading ? (
            <div className="space-y-6">
              {/* Skeleton Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg" />
                    </div>
                    <div className="h-8 bg-bg-hover rounded w-20 mb-2" />
                    <div className="h-4 bg-bg-hover rounded w-24 mb-1" />
                    <div className="h-3 bg-bg-hover rounded w-28" />
                  </div>
                ))}
              </div>

              {/* Skeleton Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                    <div className="h-5 bg-bg-hover rounded w-40 mb-6" />
                    <div className="h-64 bg-bg-hover rounded" />
                  </div>
                ))}
              </div>
            </div>
          ) : costError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-300 mb-1">
                      Erro ao carregar dados de custos
                    </h3>
                    <p className="text-xs text-red-300/80">{costError}</p>
                  </div>
                </div>
                <button
                  onClick={refetchCosts}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-sm font-medium text-red-300 transition-all active:scale-95"
                >
                  <RefreshCw size={16} />
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : costData ? (
            <div className="space-y-4 md:space-y-6">
              <CostOverviewCards
                totalCost={costData.total_cost}
                avgCostPerCall={costData.avg_cost_per_call}
                totalCalls={costData.total_calls}
                breakdown={costData.breakdown}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <CostBreakdownChart breakdown={costData.breakdown} />
                <CostDailyTable daily={costData.daily} />
              </div>
            </div>
          ) : null}
        </div>

        {/* ─── FILTERS ─────────────────────────────────────────────── */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          {/* Mobile filter toggle */}
          {isMobile && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full mb-3 text-sm font-medium text-text-primary"
            >
              <span className="flex items-center gap-2">
                <Filter size={16} />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="bg-accent-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          <div
            className={`grid grid-cols-1 md:grid-cols-4 gap-3 ${
              isMobile && !showFilters ? 'hidden' : ''
            }`}
          >
            {/* Search */}
            <div className="md:col-span-2 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted">
                <Search size={16} className="opacity-50" />
              </div>
              <input
                type="text"
                placeholder="Buscar nome, telefone ou ID..."
                className="w-full pl-10 pr-10 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-text-primary placeholder:text-text-muted"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <select
              className="px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-text-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Outcome filter */}
            <select
              className="px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-text-primary"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
            >
              {OUTCOME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active filters summary */}
          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs border-t border-border-default pt-3">
              <p className="text-text-muted">
                <span className="text-text-primary font-semibold">{total}</span> ligações encontradas
              </p>
              <button
                onClick={clearFilters}
                className="text-accent-primary hover:underline font-medium"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* ─── TABLE ───────────────────────────────────────────────── */}
        <ColdCallTable
          calls={calls as any[]}
          onViewTranscript={(call) => setSelectedCall(call as unknown as ColdCallLog)}
          loading={callsLoading}
        />

        {/* ─── PAGINATION ──────────────────────────────────────────── */}
        {totalPages > 1 && !callsLoading && (
          <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border border-border-default rounded-lg">
            <p className="text-xs text-text-muted">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de{' '}
              <span className="font-medium text-text-secondary">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-text-secondary px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── TRANSCRIPT MODAL ────────────────────────────────────── */}
        <TranscriptModal
          isOpen={!!selectedCall}
          onClose={() => setSelectedCall(null)}
          call={selectedCall as any}
        />

        {/* ─── Auto-refresh indicator ──────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted pb-4">
          <Loader2 size={10} className="animate-spin opacity-50" />
          Atualização automática a cada 30s
        </div>
      </div>
    </div>
  );
};

export default ColdCallDashboard;
