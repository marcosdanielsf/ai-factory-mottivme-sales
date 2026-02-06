import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart3, RefreshCw, Download } from 'lucide-react';
import { exportToCSV, generateFilename } from '../../lib/export-utils';
import { salesOpsDAO, type ClientInfo, type TrendData } from '../../lib/supabase-sales-ops';
import { ClientSelector } from './components/ClientSelector';
import { OverviewCards } from './components/OverviewCards';
import { FuuQueueCard } from './components/FuuQueueCard';
import { FunnelChart } from './components/FunnelChart';
import { ActivityChart } from './components/ActivityChart';
import { ConversionTable } from './components/ConversionTable';
import { LeadsDrawer } from './components/LeadsDrawer';
import type { LeadFilterType } from '../../lib/supabase-sales-ops';
import { AlertBanner } from './components/AlertBanner';
import { PeriodFilter } from './components/PeriodFilter';
import { AgentLeaderboard } from './components/AgentLeaderboard';
import { LeadDemographicsWidget } from '../../components/LeadDemographicsWidget';
import { useAccount } from '../../contexts/AccountContext';
import { useIsAdmin } from '../../hooks/useIsAdmin';

export const SalesOps = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [manualLocationId, setManualLocationId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [periodDays, setPeriodDays] = useState(30);

  // Account context for multi-tenancy
  const { selectedAccount, isViewingSubconta } = useAccount();
  const isAdmin = useIsAdmin();

  // Effective location ID: prioritize context selection
  // - If selectedAccount has location_id -> use it (works for both admin selecting subconta and client user)
  // - Otherwise use manual dropdown selection (null = all)
  const selectedLocationId = useMemo(() => {
    if (selectedAccount?.location_id) {
      return selectedAccount.location_id;
    }
    return manualLocationId;
  }, [selectedAccount, manualLocationId]);

  // Show client selector only for admin in admin mode
  const showClientSelector = isAdmin && !isViewingSubconta;

  // Dashboard data
  const [totals, setTotals] = useState({ totalAtivos: 0, totalInativos: 0, totalLeads: 0, mediaFollowUps: 0 });
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [funnel, setFunnel] = useState<{ follow_up_count: number; quantidade: number; percentual: number }[]>([]);
  const [activity, setActivity] = useState<{ data: string; mensagens_enviadas: number; leads_contactados: number }[]>([]);
  const [conversao, setConversao] = useState<any[]>([]);
  const [leadsProntos, setLeadsProntos] = useState(0);
  
  // Período para comparação de tendências (em dias)
  const trendPeriodDays = 7;

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerFilterType, setDrawerFilterType] = useState<LeadFilterType>('ativos');

  const loadData = async (locationId: string | null = null, days: number = 30) => {
    setIsLoading(true);
    try {
      const [clientsData, totalsData, trendData, funnelData, activityData, conversaoData, leadsData] = await Promise.all([
        salesOpsDAO.getClients(),
        salesOpsDAO.getTotals(locationId ?? undefined),
        salesOpsDAO.getTotalsWithTrend(trendPeriodDays, locationId ?? undefined),
        salesOpsDAO.getAggregatedFunnel(locationId ?? undefined),
        salesOpsDAO.getAggregatedAtividade(days, locationId ?? undefined),
        salesOpsDAO.getConversao(locationId ?? undefined),
        salesOpsDAO.getTotalLeadsProntos(locationId ?? undefined),
      ]);

      setClients(clientsData);
      setTotals(totalsData);
      setTrends(trendData.trends);
      setFunnel(funnelData);
      setActivity(activityData);
      setConversao(conversaoData);
      setLeadsProntos(leadsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading Sales Ops data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedLocationId, periodDays);
  }, [selectedLocationId, periodDays]);

  const handleRefresh = () => {
    loadData(selectedLocationId, periodDays);
  };

  // Handler para abrir drawer de cards
  const handleCardClick = useCallback((filterType: LeadFilterType, title: string) => {
    setDrawerFilterType(filterType);
    setDrawerTitle(title);
    setDrawerOpen(true);
  }, []);

  // Handler para abrir drawer do funil
  const handleFunnelClick = useCallback((filterType: LeadFilterType, title: string) => {
    setDrawerFilterType(filterType);
    setDrawerTitle(title);
    setDrawerOpen(true);
  }, []);

  // Handler para fechar drawer
  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Handler para alerta de leads esfriando
  const handleEsfriandoClick = useCallback(() => {
    setDrawerFilterType('esfriando');
    setDrawerTitle('Leads Esfriando (+48h)');
    setDrawerOpen(true);
  }, []);

  // Handler para FuuQueueCard
  const handleFuuQueueClick = useCallback(() => {
    setDrawerFilterType('fuu_scheduled');
    setDrawerTitle('📅 Follow-ups Agendados');
    setDrawerOpen(true);
  }, []);

  // Handler para cliques na tabela de conversão (por etapa + status)
  const handleConversionCellClick = useCallback((filterType: string, title: string) => {
    setDrawerFilterType(filterType as LeadFilterType);
    setDrawerTitle(title);
    setDrawerOpen(true);
  }, []);

  // Handler para exportar dados do dashboard
  const handleExport = useCallback(() => {
    // Prepara dados do resumo
    const summaryData = [{
      tipo: 'Resumo',
      leads_ativos: totals.totalAtivos,
      leads_inativos: totals.totalInativos,
      total_leads: totals.totalLeads,
      media_follow_ups: totals.mediaFollowUps,
      leads_prontos: leadsProntos,
    }];

    // Prepara dados do funil
    const funnelData = funnel.map(f => ({
      tipo: 'Funil',
      follow_ups: f.follow_up_count,
      quantidade: f.quantidade,
      percentual: `${f.percentual}%`,
    }));

    // Prepara dados de conversão
    const conversionData = conversao.map(c => ({
      tipo: 'Conversão',
      cliente: c.location_name || 'N/A',
      leads_ativos: c.leads_ativos || 0,
      leads_inativos: c.leads_inativos || 0,
      taxa_conversao: c.taxa_conversao ? `${c.taxa_conversao}%` : 'N/A',
    }));

    // Combina todos os dados
    const allData = [...summaryData, ...funnelData, ...conversionData];
    
    const filename = generateFilename('sales-ops-dashboard');
    exportToCSV(allData, filename);
  }, [totals, funnel, conversao, leadsProntos]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-bg-secondary">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="text-blue-500" size={18} />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-text-primary">Sales Ops Dashboard</h1>
                <p className="text-xs md:text-sm text-text-muted">
                  Metricas de follow-up e conversao
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {showClientSelector && (
                <ClientSelector
                  clients={clients}
                  selectedId={manualLocationId}
                  onChange={setManualLocationId}
                  isLoading={isLoading}
                />
              )}
              <PeriodFilter
                selected={periodDays}
                onChange={setPeriodDays}
              />
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 bg-bg-hover border border-border-default rounded-lg text-xs md:text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                title="Exportar CSV"
              >
                <Download size={14} />
                <span className="hidden md:inline">Exportar</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 bg-bg-hover border border-border-default rounded-lg text-xs md:text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden md:inline">Atualizar</span>
              </button>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-[10px] md:text-xs text-text-muted mt-2">
              Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Alert Banner - Leads Esfriando */}
      <AlertBanner 
        locationId={selectedLocationId} 
        onViewClick={handleEsfriandoClick} 
      />

      {/* Content */}
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Overview Cards - com indicadores de tendência */}
        <OverviewCards
          leadsAtivos={totals.totalAtivos}
          leadsInativos={totals.totalInativos}
          mediaFollowUps={totals.mediaFollowUps}
          leadsProntos={leadsProntos}
          isLoading={isLoading}
          onCardClick={handleCardClick}
          trends={trends}
          periodLabel="sem"
        />

        {/* FuuQueue Card - Follow-ups Agendados (destaque) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <FuuQueueCard
            locationId={selectedLocationId}
            isLoading={isLoading}
            onClick={handleFuuQueueClick}
          />
        </div>

        {/* Lead Demographics - Work Permit & State Distribution */}
        <LeadDemographicsWidget locationId={selectedLocationId ?? undefined} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Funnel Chart - agora clicável */}
          <FunnelChart 
            data={funnel} 
            isLoading={isLoading} 
            onBarClick={handleFunnelClick}
          />
          <ActivityChart data={activity} isLoading={isLoading} />
        </div>

        {/* Agent Leaderboard + Conversion Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Agent Leaderboard - Performance dos Agentes IA */}
          <div className="lg:col-span-1">
            <AgentLeaderboard 
              locationId={selectedLocationId} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* Conversion Table */}
          <div className="lg:col-span-2">
            <ConversionTable 
              data={conversao} 
              isLoading={isLoading}
              locationId={selectedLocationId}
              onCellClick={handleConversionCellClick}
            />
          </div>
        </div>
      </div>

      {/* Leads Drawer */}
      <LeadsDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        title={drawerTitle}
        filterType={drawerFilterType}
        locationId={selectedLocationId}
      />
    </div>
  );
};

export default SalesOps;
