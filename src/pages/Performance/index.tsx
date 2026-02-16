import React, { useState, useCallback } from 'react';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Trophy,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Search,
  BarChart3
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useClientPerformance, useAllAgentVersions, DateRangeType, usePerformanceDrilldown, DrilldownFilter } from '../../hooks';
import {
  useClientCosts,
  useClientCostDetails,
  useGlobalCostSummary,
  ClientCostSummary
} from '../../hooks/useClientCosts';
import { useToast } from '../../hooks/useToast';
import { LeadsDrilldownModal } from '../../components/LeadsDrilldownModal';
import { StatCard } from './components/StatCard';
import { MONTH_OPTIONS, formatDateFull } from './helpers';
import type { TabType } from './types';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const Performance: React.FC = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Estado da Tab ativa
  const [activeTab, setActiveTab] = useState<TabType>('metrics');

  // Filtros de período (aplicado aos CUSTOS, não aos leads do GHL)
  const [dateRange, setDateRange] = useState<DateRangeType>('30d');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0].value);

  // Converter dateRange string para objeto DateRange para useClientCosts
  const convertToDateRange = useCallback((range: DateRangeType, month?: string): { startDate: Date | null; endDate: Date | null } => {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    switch (range) {
      case '7d': {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
      }
      case '30d': {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
      }
      case 'month': {
        if (month) {
          const [year, monthNum] = month.split('-').map(Number);
          const start = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
          const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
          return { startDate: start, endDate: monthEnd };
        }
        return { startDate: null, endDate: null };
      }
      case 'all':
      default:
        return { startDate: null, endDate: null };
    }
  }, []);

  const dateRangeObj = convertToDateRange(dateRange, selectedMonth);

  // Filtros de cliente
  const [clientFilter, setClientFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Estado do modal de drill-down (métricas)
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownSubtitle, setDrilldownSubtitle] = useState('');
  const [drilldownClientName, setDrilldownClientName] = useState<string | undefined>();
  const [drilldownFilterType, setDrilldownFilterType] = useState<DrilldownFilter>('all');

  // Estado do modal de custos por cliente
  const [selectedCostClient, setSelectedCostClient] = useState<ClientCostSummary | null>(null);

  // Hook de drill-down
  const {
    leads: drilldownLeads,
    loading: drilldownLoading,
    error: drilldownError,
    fetchLeads,
    clearLeads
  } = usePerformanceDrilldown();

  // Hook de Performance com filtros aplicados
  const {
    clients,
    allClients,
    ranking,
    alerts,
    totals,
    loading,
    error,
    refetch
  } = useClientPerformance({
    dateRange,
    month: dateRange === 'month' ? selectedMonth : undefined,
    clientName: clientFilter || undefined,
    showInactive,
    inactiveDays: 30
  });

  // Hook de Custos
  const {
    clients: costClients,
    allClients: allCostClients,
    totalCost,
    totalRequests,
    loading: loadingCosts,
    error: errorCosts,
    refetch: refetchCosts
  } = useClientCosts({
    dateRange: dateRangeObj,
    clientName: clientFilter || undefined,
    showInactive,
    inactiveDays: 30
  });

  // Hook de resumo global de custos
  const { summary: costSummary, loading: loadingSummary } = useGlobalCostSummary();

  // Hook de detalhes de custo do cliente selecionado
  const { costs: clientCostDetails, dailyCosts, loading: loadingCostDetails } = useClientCostDetails(
    selectedCostClient?.location_name || null,
    { dateRange: dateRangeObj }
  );

  const {
    versionsByLocation,
    loading: versionsLoading,
    updating: versionUpdating,
    toggleActive,
    refetch: refetchVersions
  } = useAllAgentVersions();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'leads' | 'conversao' | 'resposta'>('leads');
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  // Função para abrir drill-down
  const openDrilldown = useCallback(async (
    title: string,
    filter: DrilldownFilter,
    clientName?: string,
    subtitle?: string
  ) => {
    setDrilldownTitle(title);
    setDrilldownSubtitle(subtitle || '');
    setDrilldownClientName(clientName);
    setDrilldownFilterType(filter);
    setDrilldownOpen(true);

    await fetchLeads({ filter, clientName });
  }, [fetchLeads]);

  // Função para fechar drill-down
  const closeDrilldown = useCallback(() => {
    setDrilldownOpen(false);
    clearLeads();
  }, [clearLeads]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    showToast('Atualizando dados...', 'info');
    try {
      await Promise.all([refetch(), refetchCosts(), refetchVersions()]);
      showToast('Dados atualizados', 'success');
    } catch (err) {
      showToast('Erro ao atualizar', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleVersion = async (versionId: string, currentValue: boolean) => {
    const result = await toggleActive(versionId, !currentValue);
    if (result.success) {
      showToast(`Versão ${!currentValue ? 'ativada' : 'desativada'}`, 'success');
    } else {
      showToast(`Erro: ${result.error}`, 'error');
    }
  };

  const toggleLocationExpanded = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Ordenar clientes
  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === 'leads') return b.totalLeads - a.totalLeads;
    if (sortBy === 'conversao') return b.taxaConversaoGeral - a.taxaConversaoGeral;
    if (sortBy === 'resposta') return b.taxaResposta - a.taxaResposta;
    return 0;
  });

  // Calcular percentual do total para custos
  const getPercentage = (value: number) => {
    if (totalCost === 0) return 0;
    return (value / totalCost) * 100;
  };

  const avgCostPerRequest = totalRequests === 0 ? 0 : totalCost / totalRequests;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Trophy className="text-amber-400" size={isMobile ? 24 : 28} />
            Performance de Clientes
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            Métricas de desempenho e custos dos agentes por cliente
          </p>
        </div>

        {/* Filtros de Período (aplicado aos custos) */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* Date Range - Compacto no mobile */}
          <div className="flex items-center bg-bg-secondary border border-border-default rounded-lg p-1 overflow-x-auto">
            {[
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: 'month', label: 'Mês' },
              { value: 'all', label: 'Todos' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value as any)}
                className={`px-2 md:px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
                  dateRange === opt.value ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Seletor de Mês */}
          {dateRange === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-bg-secondary border border-border-default rounded-lg px-2 md:px-3 py-2 text-xs md:text-sm text-text-primary flex-shrink-0"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{isMobile ? opt.value : opt.label}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 p-2 md:px-3 md:py-2 rounded-lg border transition-all ${
                showFilters || clientFilter || showInactive
                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                  : 'bg-bg-secondary border-border-default text-text-muted hover:text-text-primary'
              }`}
              title="Filtrar por cliente"
            >
              <Filter size={16} />
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 p-2 md:px-4 md:py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden md:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Métricas | Custos Detalhados */}
      <div className="flex items-center bg-bg-secondary border border-border-default rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'metrics'
              ? 'bg-accent-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Target size={16} />
          <span className="hidden md:inline">Métricas</span>
        </button>
        <button
          onClick={() => setActiveTab('costs')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'costs'
              ? 'bg-accent-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <DollarSign size={16} />
          <span className="hidden md:inline">Custos Detalhados</span>
        </button>
      </div>

      {/* Painel de Filtros Avançados */}
      {showFilters && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-4 space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase">Filtros:</span>
          </div>

          {/* Dropdown de Cliente */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted hidden md:inline">Cliente:</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              disabled={loading}
              className="flex-1 md:flex-none px-3 py-1.5 text-xs font-medium rounded-lg border border-border-default bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 w-full md:min-w-[180px]"
            >
              <option value="">Todos os clientes</option>
              {allClients?.map((client) => (
                <option key={client.locationId} value={client.agentName}>
                  {client.agentName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Mostrar Inativos */}
            <button
              onClick={() => setShowInactive(!showInactive)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                showInactive
                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                  : 'bg-bg-primary border-border-default text-text-muted hover:text-text-primary'
              }`}
            >
              {showInactive ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden md:inline">{showInactive ? 'Mostrando inativos' : 'Mostrar inativos'}</span>
              <span className="md:hidden">{showInactive ? 'Inativos' : 'Inativos'}</span>
            </button>

            {/* Limpar Filtros */}
            {(clientFilter || showInactive) && (
              <button
                onClick={() => {
                  setClientFilter('');
                  setShowInactive(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Info de inativos - escondido no mobile */}
          <div className="hidden md:block md:ml-auto text-xs text-text-muted">
            {!showInactive && (
              <span>Mostrando apenas clientes com atividade de IA nos últimos 30 dias</span>
            )}
          </div>
        </div>
      )}

      {/* Cards de Totais - CLICÁVEIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Clientes"
          value={totals.totalClientes}
          subtitle="com agentes ativos • clique para ver lista"
          icon={Users}
          color="blue"
          clickable
          onClick={() => openDrilldown(
            'Lista de Clientes',
            'clientes',
            undefined,
            `${totals.totalClientes} clientes com agentes ativos`
          )}
        />
        <StatCard
          title="Total Leads"
          value={totals.totalLeads.toLocaleString()}
          subtitle="em todos os clientes • clique para ver"
          icon={Users}
          color="blue"
          clickable
          onClick={() => openDrilldown(
            'Todos os Leads',
            'all',
            undefined,
            `${totals.totalLeads.toLocaleString()} leads em todos os clientes`
          )}
        />
        <StatCard
          title="Taxa Resposta Média"
          value={`${totals.taxaRespostMedia.toFixed(1)}%`}
          subtitle="clique para ver leads que responderam"
          icon={Target}
          color="green"
          clickable
          onClick={() => openDrilldown(
            'Leads que Responderam',
            'responderam',
            undefined,
            `${totals.totalResponderam.toLocaleString()} leads que avançaram no funil`
          )}
        />
        <StatCard
          title="Taxa Conversão Média"
          value={`${totals.taxaConversaoMedia.toFixed(1)}%`}
          subtitle="clique para ver leads convertidos"
          icon={TrendingUp}
          color="yellow"
          clickable
          onClick={() => openDrilldown(
            'Leads Convertidos (Fecharam)',
            'fecharam',
            undefined,
            `${totals.totalFecharam.toLocaleString()} leads que fecharam negócio`
          )}
        />
      </div>

      {/* Placeholder tabs content */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <p className="text-text-muted text-center">
          {activeTab === 'metrics' ? 'MetricsTab component will be rendered here' : 'CostsTab component will be rendered here'}
        </p>
      </div>

      {/* Placeholder AgentVersionsSection */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <p className="text-text-muted text-center">AgentVersionsSection component will be rendered here</p>
      </div>

      {/* LeadsDrilldownModal */}
      <LeadsDrilldownModal
        isOpen={drilldownOpen}
        onClose={closeDrilldown}
        leads={drilldownLeads}
        loading={drilldownLoading}
        error={drilldownError}
        title={drilldownTitle}
        subtitle={drilldownSubtitle}
        clientName={drilldownClientName}
        filterType={drilldownFilterType}
      />

      {/* Placeholder CostDetailModal */}
      {selectedCostClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
            <p className="text-text-primary">CostDetailModal for {selectedCostClient.location_name}</p>
            <button
              onClick={() => setSelectedCostClient(null)}
              className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
