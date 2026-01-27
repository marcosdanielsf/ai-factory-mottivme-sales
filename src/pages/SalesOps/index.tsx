import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { salesOpsDAO, type ClientInfo } from '../../lib/supabase-sales-ops';
import { ClientSelector } from './components/ClientSelector';
import { OverviewCards } from './components/OverviewCards';
import { FunnelChart } from './components/FunnelChart';
import { ActivityChart } from './components/ActivityChart';
import { ConversionTable } from './components/ConversionTable';
import { LeadsDrawer, type LeadFilterType } from './components/LeadsDrawer';

export const SalesOps = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Dashboard data
  const [totals, setTotals] = useState({ totalAtivos: 0, totalInativos: 0, totalLeads: 0, mediaFollowUps: 0 });
  const [funnel, setFunnel] = useState<{ follow_up_count: number; quantidade: number; percentual: number }[]>([]);
  const [activity, setActivity] = useState<{ data: string; mensagens_enviadas: number; leads_contactados: number }[]>([]);
  const [conversao, setConversao] = useState<any[]>([]);
  const [leadsProntos, setLeadsProntos] = useState(0);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerFilterType, setDrawerFilterType] = useState<LeadFilterType>('ativos');

  const loadData = async (locationId: string | null = null) => {
    setIsLoading(true);
    try {
      const [clientsData, totalsData, funnelData, activityData, conversaoData, leadsData] = await Promise.all([
        salesOpsDAO.getClients(),
        salesOpsDAO.getTotals(),
        salesOpsDAO.getAggregatedFunnel(),
        salesOpsDAO.getAggregatedAtividade(30),
        salesOpsDAO.getConversao(locationId ?? undefined),
        salesOpsDAO.getTotalLeadsProntos(locationId ?? undefined),
      ]);

      setClients(clientsData);
      setTotals(totalsData);
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
    loadData(selectedLocationId);
  }, [selectedLocationId]);

  const handleRefresh = () => {
    loadData(selectedLocationId);
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

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="border-b border-border-default bg-bg-secondary">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="text-blue-500" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-text-primary">Sales Ops Dashboard</h1>
                <p className="text-sm text-text-muted">
                  Metricas de follow-up e conversao em tempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ClientSelector
                clients={clients}
                selectedId={selectedLocationId}
                onChange={setSelectedLocationId}
                isLoading={isLoading}
              />
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-bg-hover border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-xs text-text-muted mt-2">
              Ultima atualizacao: {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Overview Cards - agora clicáveis */}
        <OverviewCards
          leadsAtivos={totals.totalAtivos}
          leadsInativos={totals.totalInativos}
          mediaFollowUps={totals.mediaFollowUps}
          leadsProntos={leadsProntos}
          isLoading={isLoading}
          onCardClick={handleCardClick}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart - agora clicável */}
          <FunnelChart 
            data={funnel} 
            isLoading={isLoading} 
            onBarClick={handleFunnelClick}
          />
          <ActivityChart data={activity} isLoading={isLoading} />
        </div>

        {/* Conversion Table */}
        <ConversionTable data={conversao} isLoading={isLoading} />
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
