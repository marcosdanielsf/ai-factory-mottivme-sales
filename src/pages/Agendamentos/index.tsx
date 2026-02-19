import React, { useState, useCallback, useMemo } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  LayoutDashboard,
  Target,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useAgendamentosStats } from '../../hooks/useAgendamentosStats';
import { useCriativoPerformance } from '../../hooks/useCriativoPerformance';
import { useLeadSegmentation } from '../../hooks/useLeadSegmentation';
import { type AgendamentosFilters } from '../../hooks/useAgendamentos';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';

import type { MetricType, OrigemType } from './types';
import { formatDayLabel } from './helpers';
import { ResponsavelSelector } from './components/ResponsavelSelector';
import { LeadsDrawer } from './components/LeadsDrawer';
import { CriativoLeadsDrawer } from './components/CriativoLeadsDrawer';

import { OverviewTab } from './components/tabs/OverviewTab';
import { PerformanceTab } from './components/tabs/PerformanceTab';
import { SegmentacaoTab } from './components/tabs/SegmentacaoTab';
import { AgendaTab } from './components/tabs/AgendaTab';

type AgendamentosTab = 'overview' | 'performance' | 'segmentacao' | 'agenda';

const TABS: { id: AgendamentosTab; label: string; icon: React.FC<any> }[] = [
  { id: 'overview', label: 'Visao Geral', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: Target },
  { id: 'segmentacao', label: 'Segmentacao', icon: MapPin },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
];

export const Agendamentos: React.FC = () => {
  const [tab, setTab] = useState<AgendamentosTab>('overview');
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);
  const [selectedOrigem, setSelectedOrigem] = useState<OrigemType>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerFilters, setDrawerFilters] = useState<AgendamentosFilters>({});
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);
  const [criativoDrawerOpen, setCriativoDrawerOpen] = useState(false);
  const [selectedCriativo, setSelectedCriativo] = useState('');

  const { selectedAccount, isClientUser } = useAccount();
  const isAdmin = useIsAdmin();

  const locationId = useMemo(() => {
    if (selectedAccount?.location_id) {
      return selectedAccount.location_id;
    }
    return null;
  }, [selectedAccount]);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

  const isCustomDateFilter = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    const now = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(now.getDate() - 30);
    defaultStart.setHours(0, 0, 0, 0);
    const startDiff = Math.abs(dateRange.startDate.getTime() - defaultStart.getTime());
    return startDiff > 24 * 60 * 60 * 1000;
  }, [dateRange]);

  const { stats, porDia, porDiaCriacao, porOrigem, responsaveis, loading, error, refetch } = useAgendamentosStats(
    selectedResponsavel,
    dateRange,
    locationId
  );

  const { criativos, origens, leads: criativoLeads, totals: criativoTotals, loading: loadingCriativos } = useCriativoPerformance(
    dateRange,
    locationId,
    selectedResponsavel
  );

  const { estados, workPermit, totals: segmentationTotals, loading: loadingSegmentation } = useLeadSegmentation(
    dateRange,
    locationId,
    selectedResponsavel
  );

  const buildFilters = useCallback((): AgendamentosFilters => {
    const filters: AgendamentosFilters = {
      responsavel: selectedResponsavel,
      locationId: locationId,
    };
    if (selectedOrigem) filters.origem = selectedOrigem;
    if (selectedDay) filters.day = selectedDay;
    return filters;
  }, [selectedResponsavel, selectedOrigem, selectedDay, locationId]);

  const handleCardClick = useCallback((metric: MetricType) => {
    const now = new Date();
    const filters = buildFilters();
    setActiveMetric(metric);

    if (metric === 'hoje') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      filters.startDate = today;
      filters.endDate = todayEnd;
      setDrawerTitle('Agendamentos Hoje');
    } else if (metric === 'semana') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      filters.startDate = weekAgo;
      filters.endDate = now;
      setDrawerTitle('Agendamentos da Semana');
    } else if (metric === 'mes') {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      filters.startDate = monthAgo;
      filters.endDate = now;
      setDrawerTitle('Agendamentos do Mes');
    } else if (metric === 'comparecimento') {
      filters.status = 'completed';
      setDrawerTitle('Comparecimentos');
    } else if (metric === 'noshow') {
      filters.status = 'no_show';
      setDrawerTitle('No-Show');
    } else if (metric === 'pendentes') {
      filters.status = 'booked';
      setDrawerTitle('Aguardando');
    }

    setDrawerFilters(filters);
    setDrawerOpen(true);
  }, [buildFilters]);

  const handleBarClick = useCallback((data: any) => {
    if (!data?.data) return;
    const day = data.data;
    setSelectedDay(day);
    setActiveMetric(null);
    const filters = buildFilters();
    filters.day = day;
    setDrawerFilters(filters);
    setDrawerTitle(`Agendamentos em ${formatDayLabel(day)}`);
    setDrawerOpen(true);
  }, [buildFilters]);

  const handlePieClick = useCallback((data: any) => {
    if (!data?.origem) return;
    const origem = data.origem as OrigemType;
    setSelectedOrigem(origem);
    setActiveMetric(null);
    const filters = buildFilters();
    filters.origem = origem;
    setDrawerFilters(filters);
    setDrawerTitle(origem === 'trafego' ? 'Trafego Pago' : 'Social Selling');
    setDrawerOpen(true);
  }, [buildFilters]);

  const handleCriativoClick = useCallback((criativo: string) => {
    setSelectedCriativo(criativo);
    setCriativoDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveMetric(null);
    setSelectedDay(null);
  }, []);

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return '';
    return `${dateRange.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${dateRange.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }, [dateRange]);

  return (
    <div className="bg-bg-primary">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-border-default">
        <div className="px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <CalendarCheck size={20} className="text-violet-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Agendamentos</h1>
                <p className="text-xs text-text-muted">{dateRangeLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              {!isClientUser && <ResponsavelSelector
                responsaveis={responsaveis}
                selectedName={selectedResponsavel}
                onChange={setSelectedResponsavel}
                isLoading={loading && responsaveis.length === 0}
              />}
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 border border-border-default"
                title="Atualizar dados"
              >
                <RefreshCw size={16} className={`text-text-muted ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="px-4 md:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {tab === 'overview' && (
          <OverviewTab
            stats={stats}
            criativoTotals={criativoTotals}
            criativoLeads={criativoLeads}
            porDia={porDia}
            porDiaCriacao={porDiaCriacao}
            porOrigem={porOrigem}
            loading={loading}
            loadingCriativos={loadingCriativos}
            dateRangeLabel={dateRangeLabel}
            onCardClick={handleCardClick}
            onBarClick={handleBarClick}
            onPieClick={handlePieClick}
          />
        )}

        {tab === 'performance' && (
          <PerformanceTab
            stats={stats}
            criativoTotals={criativoTotals}
            criativos={criativos}
            criativoLeads={criativoLeads}
            loadingCriativos={loadingCriativos}
            locationId={locationId}
            onCardClick={handleCardClick}
            onCriativoClick={handleCriativoClick}
          />
        )}

        {tab === 'segmentacao' && (
          <SegmentacaoTab
            estados={estados}
            workPermit={workPermit}
            segmentationTotals={segmentationTotals}
            loadingSegmentation={loadingSegmentation}
          />
        )}

        {tab === 'agenda' && (
          <AgendaTab
            stats={stats}
            porDia={porDia}
            loading={loading}
            isCustomDateFilter={isCustomDateFilter}
            dateRangeLabel={dateRangeLabel}
            onCardClick={handleCardClick}
            onBarClick={handleBarClick}
          />
        )}
      </div>

      {/* Drawers — always mounted outside tabs */}
      <LeadsDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} title={drawerTitle} filters={drawerFilters} />
      <CriativoLeadsDrawer
        isOpen={criativoDrawerOpen}
        onClose={() => setCriativoDrawerOpen(false)}
        criativoName={selectedCriativo}
        leads={criativoLeads}
        locationId={locationId}
      />
    </div>
  );
};

export default Agendamentos;
