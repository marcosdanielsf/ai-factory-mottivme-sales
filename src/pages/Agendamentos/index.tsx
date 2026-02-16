import React, { useState, useCallback, useMemo } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  Calendar,
  CheckCircle,
  MessageCircle,
  AlertCircle,
  UserX,
  Users,
  Target,
} from 'lucide-react';
import { MetricCard } from '../../components/MetricCard';
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
  ComposedChart,
  Line,
  Legend,
} from 'recharts';
import { useAccount } from '../../contexts/AccountContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useAgendamentosStats } from '../../hooks/useAgendamentosStats';
import { useCriativoPerformance } from '../../hooks/useCriativoPerformance';
import { useLeadSegmentation } from '../../hooks/useLeadSegmentation';
import { type AgendamentosFilters } from '../../hooks/useAgendamentos';
import { DateRangePicker, DateRange } from '../../components/DateRangePicker';
import { CriativoMetricsTable } from '../../components/charts/CriativoPerformanceChart';
import { EstadoChart, WorkPermitSummary, EstadoMetricsTable } from '../../components/charts/LeadSegmentationCharts';
import { SalesFunnelChart } from '../../components/charts/SalesFunnelChart';

import type { MetricType, OrigemType } from './types';
import { formatDayLabel } from './helpers';
import { DONUT_COLORS } from './constants';
import { ResponsavelSelector } from './components/ResponsavelSelector';
import { LeadsDrawer } from './components/LeadsDrawer';
import { CriativoLeadsDrawer } from './components/CriativoLeadsDrawer';
import { LeadsUtmTable } from './components/LeadsUtmTable';

export const Agendamentos: React.FC = () => {
  const [selectedResponsavel, setSelectedResponsavel] = useState<string | null>(null);
  const [selectedOrigem, setSelectedOrigem] = useState<OrigemType>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerFilters, setDrawerFilters] = useState<AgendamentosFilters>({});
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);
  const [criativoDrawerOpen, setCriativoDrawerOpen] = useState(false);
  const [selectedCriativo, setSelectedCriativo] = useState('');

  const { selectedAccount } = useAccount();
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
    locationId
  );

  const { estados, workPermit, totals: segmentationTotals, loading: loadingSegmentation } = useLeadSegmentation(
    dateRange,
    locationId
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
      setDrawerTitle('Agendamentos do Mês');
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
    setDrawerTitle(origem === 'trafego' ? '📣 Tráfego Pago' : '🤝 Social Selling');
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

  const donutData = useMemo(() => {
    return porOrigem.map((item) => ({
      name: item.origem === 'trafego' ? 'Tráfego Pago' : 'Social Selling',
      value: item.quantidade,
      origem: item.origem,
    }));
  }, [porOrigem]);

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-secondary border border-border-default rounded px-2 py-1 shadow-lg text-xs">
          <p className="font-medium text-text-primary">{formatDayLabel(label)}</p>
          <p className="text-purple-400">{payload[0].value} agendamentos</p>
        </div>
      );
    }
    return null;
  };

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return '';
    return `${dateRange.startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${dateRange.endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  }, [dateRange]);

  return (
    <div className="bg-bg-primary">
      {/* INLINE HEADER */}
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
              <ResponsavelSelector
                responsaveis={responsaveis}
                selectedName={selectedResponsavel}
                onChange={setSelectedResponsavel}
                isLoading={loading && responsaveis.length === 0}
              />
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
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-4">
        {/* Funil de Conversão */}
        <SalesFunnelChart
          data={{
            totalLeads: criativoTotals.totalLeads,
            totalResponderam: criativoLeads.filter((l: any) => l.etapa_funil && l.etapa_funil.toLowerCase() !== 'novo').length,
            totalAgendaram: stats.totalAgendados,
            totalCompareceram: stats.totalCompleted,
            totalFecharam: criativoTotals.totalFecharam,
          }}
          loading={loadingCriativos || loading}
        />

        {/* ROW 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <MetricCard title="Total de Leads" value={criativoTotals.totalLeads.toLocaleString()} icon={Users} subtext="No período" onClick={() => handleCardClick('leads')} clickable />
          <MetricCard title="Total Agendados" value={stats.totalAgendados.toLocaleString()} icon={CalendarCheck} subtext={`${criativoTotals.totalLeads > 0 ? Math.round((stats.totalAgendados / criativoTotals.totalLeads) * 100) : 0}% dos leads`} onClick={() => handleCardClick('mes')} clickable />
          <MetricCard title="Compareceram" value={criativoTotals.totalCompareceram.toLocaleString()} icon={CheckCircle} subtext={`${criativoTotals.totalAgendaram > 0 ? Math.round((criativoTotals.totalCompareceram / criativoTotals.totalAgendaram) * 100) : 0}% dos agendados`} onClick={() => handleCardClick('comparecimento')} clickable />
          <MetricCard title="Fecharam" value={criativoTotals.totalFecharam.toLocaleString()} icon={Target} subtext={`${criativoTotals.totalCompareceram > 0 ? Math.round((criativoTotals.totalFecharam / criativoTotals.totalCompareceram) * 100) : 0}% dos que compareceram`} onClick={() => handleCardClick('conversao')} clickable />
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          <MetricCard title="Responderam" value={criativoTotals.totalResponderam} icon={MessageCircle} subtext={`${criativoTotals.totalLeads > 0 ? Math.round((criativoTotals.totalResponderam / criativoTotals.totalLeads) * 100) : 0}% dos leads`} clickable />
          <MetricCard title={isCustomDateFilter ? "No Período" : "Hoje"} value={stats.hoje} icon={CalendarDays} onClick={() => handleCardClick('hoje')} clickable />
          <MetricCard title={isCustomDateFilter ? "7d Período" : "Últimos 7 dias"} value={stats.semana} icon={CalendarRange} onClick={() => handleCardClick('semana')} clickable />
          <MetricCard title={isCustomDateFilter ? "30d Período" : "Últimos 30 dias"} value={stats.mes} icon={Calendar} onClick={() => handleCardClick('mes')} clickable />
          <MetricCard title="No-Show" value={stats.totalNoShow} icon={UserX} subtext={`${stats.taxaNoShow}% dos resolvidos`} onClick={() => handleCardClick('noshow')} clickable />
          <MetricCard title="Aguardando" value={stats.totalBooked + stats.totalPendingFeedback} icon={AlertCircle} subtext={`${stats.totalBooked} futuros · ${stats.totalPendingFeedback} s/ feedback`} onClick={() => handleCardClick('pendentes')} clickable />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          {/* Agendamentos CRIADOS no dia */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Agendamentos Criados no Dia</h3>
                <p className="text-[10px] text-text-muted">{dateRangeLabel}</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded bg-blue-500" />
                  <span className="text-text-muted">Agendamentos</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-0.5 bg-emerald-400" />
                  <span className="text-text-muted">Leads</span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="h-72 flex items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-text-muted" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={porDiaCriacao} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} tickCount={8} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-bg-secondary border border-border-default rounded px-2 py-1 shadow-lg text-xs">
                            <p className="font-medium text-text-primary">{formatDayLabel(String(label))}</p>
                            <p className="text-blue-400">{payload[0]?.value} agendamentos</p>
                            <p className="text-emerald-400">{payload[1]?.value} leads</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Agendamentos" barSize={20} />
                  <Line type="monotone" dataKey="leads" stroke="#34d399" strokeWidth={2} dot={false} name="Leads" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Donut Chart - Origem */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Origem dos Leads</h3>
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <RefreshCw size={20} className="animate-spin text-text-muted" />
              </div>
            ) : donutData.every((d) => d.value === 0) ? (
              <div className="h-48 flex flex-col items-center justify-center text-text-muted">
                <CalendarCheck size={32} className="mb-2 opacity-50" />
                <p className="text-xs">Sem dados de origem</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3} cursor="pointer" onClick={handlePieClick}>
                    {donutData.map((entry, index) => (
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

        {/* Tabela de Criativos */}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Funil por Criativo</h3>
          <p className="text-[10px] text-text-muted mb-3">utm_content do Meta Ads · Clique para ver os leads</p>
          <div className="max-h-[400px] overflow-y-auto">
            <CriativoMetricsTable data={criativos} loading={loadingCriativos} onCriativoClick={handleCriativoClick} />
          </div>
        </div>

        {/* Tabela detalhada: Leads x UTM */}
        <LeadsUtmTable leads={criativoLeads} loading={loadingCriativos} locationId={locationId} />

        {/* Segmentação de Leads */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="lg:col-span-2 bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  Leads por Estado
                </h3>
                <p className="text-[10px] text-text-muted">
                  {segmentationTotals.comEstado} de {segmentationTotals.totalLeads} com estado informado
                </p>
              </div>
            </div>
            <EstadoChart data={estados} loading={loadingSegmentation} />
          </div>

          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              Work Permit
            </h3>
            <p className="text-[10px] text-text-muted mb-3">
              {segmentationTotals.comWorkPermit} de {segmentationTotals.totalLeads} com info
            </p>
            <WorkPermitSummary data={workPermit} loading={loadingSegmentation} />
          </div>
        </div>

        {/* Tabela detalhada por Estado */}
        {estados.length > 0 && (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-3 md:p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Funil por Estado</h3>
            <div className="max-h-[300px] overflow-y-auto">
              <EstadoMetricsTable data={estados} loading={loadingSegmentation} />
            </div>
          </div>
        )}

        {/* Agendamentos PARA o dia */}
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porDia} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="data" tickFormatter={formatDayLabel} tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickCount={6} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Leads Drawer */}
      <LeadsDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} title={drawerTitle} filters={drawerFilters} />

      {/* Criativo Leads Drawer */}
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
