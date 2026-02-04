import React, { useState, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  AlertTriangle,
  Trophy,
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus,
  Bot,
  Building2,
  Zap,
  Layers,
  ToggleLeft,
  ToggleRight,
  Clock,
  Hash,
  Filter,
  Eye,
  EyeOff,
  Search,
  ExternalLink,
  MoreVertical,
  Cpu,
  Calendar,
  X,
  BarChart3,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useClientPerformance, useAllAgentVersions, usePerformanceDrilldown, DrilldownFilter } from '../hooks';
import {
  useClientCosts,
  useClientCostDetails,
  useGlobalCostSummary,
  ClientCostSummary
} from '../hooks/useClientCosts';
import { useToast } from '../hooks/useToast';
import { LeadsDrilldownModal } from '../components/LeadsDrilldownModal';
import { DateRangePicker, DateRange } from '../components/DateRangePicker';
import { SearchableSelect, SelectOption } from '../components/SearchableSelect';

// Gerar lista de meses disponíveis
const generateMonthOptions = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return months;
};

const MONTH_OPTIONS = generateMonthOptions();

// Tipo para as tabs
type TabType = 'metrics' | 'costs';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
  clickable = false
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: { value: number; label: string };
  onClick?: () => void;
  clickable?: boolean;
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  const isClickable = clickable || !!onClick;

  return (
    <div 
      onClick={onClick}
      className={`bg-bg-secondary border border-border-default rounded-lg p-4 transition-all ${
        isClickable 
          ? 'cursor-pointer hover:border-accent-primary/50 hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-accent-primary/5 group' 
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1">
            {title}
            {isClickable && (
              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-primary" />
            )}
          </p>
          <p className={`text-2xl font-bold text-text-primary mt-1 ${isClickable ? 'group-hover:text-accent-primary transition-colors' : ''}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]} ${isClickable ? 'group-hover:scale-110 transition-transform' : ''}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-xs text-text-muted font-mono">#{rank}</span>;
};

const PercentageBar = ({ value, color = 'blue' }: { value: number; color?: string }) => {
  const colorClass = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  }[color] || 'bg-blue-500';

  return (
    <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

// Célula clicável para drill-down na tabela
const ClickableCell = ({
  value,
  onClick,
  highlight = false,
  className = ''
}: {
  value: number | string;
  onClick?: () => void;
  highlight?: boolean;
  className?: string;
}) => {
  if (!onClick) {
    return <span className={className}>{value}</span>;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        px-2 py-1 rounded-md transition-all
        hover:bg-accent-primary/10 hover:text-accent-primary
        active:scale-95 cursor-pointer
        ${highlight ? 'font-semibold text-emerald-400' : 'text-text-primary'}
        ${className}
      `}
      title="Clique para ver detalhes"
    >
      {value}
    </button>
  );
};

const AlertBadge = ({ type }: { type: string }) => {
  const configs: Record<string, { label: string; color: string }> = {
    baixa_resposta: { label: 'Baixa Resposta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    baixa_conversao: { label: 'Baixa Conversão', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    custo_sem_resultado: { label: 'Custo Alto', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    score_baixo: { label: 'Score Baixo', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
  };

  const config = configs[type] || { label: type, color: 'bg-gray-500/20 text-gray-400' };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${config.color}`}>
      {config.label}
    </span>
  );
};

// Toggle Switch Component
const ToggleSwitch = ({
  isOn,
  onToggle,
  disabled = false,
  loading = false
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  loading?: boolean;
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || loading}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${isOn ? 'bg-emerald-500' : 'bg-bg-tertiary'}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${isOn ? 'translate-x-6' : 'translate-x-1'}
          ${loading ? 'animate-pulse' : ''}
        `}
      />
    </button>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-400' },
    draft: { label: 'Rascunho', color: 'bg-amber-500/20 text-amber-400' },
    published: { label: 'Publicado', color: 'bg-blue-500/20 text-blue-400' },
    archived: { label: 'Arquivado', color: 'bg-gray-500/20 text-gray-400' }
  };
  const config = configs[status] || { label: status, color: 'bg-gray-500/20 text-gray-400' };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// ============================================================================
// HELPERS DE FORMATAÇÃO (para custos)
// ============================================================================

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
};

const formatNumber = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

const formatDateCost = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const Performance = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();

  // Estado da Tab ativa
  const [activeTab, setActiveTab] = useState<TabType>('metrics');

  // Filtros de período - DateRange igual ao Agendamentos
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  });

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
    customDateRange: dateRange,
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
    customDateRange: dateRange,
    clientName: clientFilter || undefined,
    showInactive,
    inactiveDays: 30
  });

  // Hook de resumo global de custos
  const { summary: costSummary, loading: loadingSummary } = useGlobalCostSummary();

  // Hook de detalhes de custo do cliente selecionado
  const { costs: clientCostDetails, dailyCosts, loading: loadingCostDetails } = useClientCostDetails(
    selectedCostClient?.location_name || null,
    { dateRange, month: dateRange === 'month' ? selectedMonth : undefined }
  );

  const {
    versionsByLocation,
    loading: versionsLoading,
    updating: versionUpdating,
    toggleActive,
    refetch: refetchVersions
  } = useAllAgentVersions();

  // Converter allClients para formato SelectOption
  const clientOptions: SelectOption[] = useMemo(() =>
    (allClients || []).map(client => ({
      id: client.agentName,
      label: client.agentName,
      count: client.metrics?.totalLeads || 0,
    })),
    [allClients]
  );

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

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
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

        {/* Filtros de Período */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {/* DateRangePicker - Padronizado */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

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
            <SearchableSelect
              options={clientOptions}
              selectedId={clientFilter || null}
              onChange={(id) => setClientFilter(id || '')}
              allLabel="Todos os Clientes"
              searchPlaceholder="Buscar cliente..."
              isLoading={loading}
              icon="building"
            />
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
          icon={Building2}
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
          color="purple"
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
          icon={MessageSquare}
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
          icon={Target}
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

      {/* ============================================================================ */}
      {/* CONTEÚDO DA TAB: MÉTRICAS */}
      {/* ============================================================================ */}
      {activeTab === 'metrics' && (
        <>
          {/* Alertas */}
          {alerts.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="text-red-400" size={18} />
                <h3 className="font-semibold text-red-400 text-sm md:text-base">Alertas ({alerts.length})</h3>
              </div>
              <div className="space-y-2">
                {alerts.slice(0, isMobile ? 3 : 5).map((alert) => (
                  <div
                    key={alert.locationId}
                    className="flex flex-col md:flex-row md:items-center justify-between bg-bg-secondary/50 rounded-lg px-3 md:px-4 py-2 gap-2"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <Bot size={14} className="text-text-muted flex-shrink-0" />
                      <span className="text-xs md:text-sm text-text-primary truncate">{alert.agentName}</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-wrap pl-6 md:pl-0">
                      {alert.alertaBaixaResposta && <AlertBadge type="baixa_resposta" />}
                      {alert.alertaBaixaConversao && <AlertBadge type="baixa_conversao" />}
                      {alert.alertaCustoSemResultado && <AlertBadge type="custo_sem_resultado" />}
                      {alert.alertaScoreBaixo && <AlertBadge type="score_baixo" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ranking Top 3 */}
          {ranking.length > 0 && (
            <div className="bg-bg-secondary border border-border-default rounded-lg p-4 md:p-6">
              <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-3 md:mb-4 text-sm md:text-base">
                <Trophy className="text-amber-400" size={18} />
                Top Performers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {ranking.slice(0, 3).map((client, index) => (
                  <div
                    key={client.locationId}
                    className={`relative overflow-hidden rounded-lg p-3 md:p-4 border ${
                      index === 0 ? 'bg-amber-500/5 border-amber-500/30' :
                      index === 1 ? 'bg-slate-400/5 border-slate-400/30' :
                      'bg-orange-700/5 border-orange-700/30'
                    }`}
                  >
                    <div className="absolute top-2 right-2">
                      <RankBadge rank={index + 1} />
                    </div>
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                        <Bot size={isMobile ? 16 : 20} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="font-semibold text-text-primary truncate text-sm md:text-base">{client.agentName}</p>
                        <p className="text-[10px] md:text-xs text-text-muted truncate">{client.locationId}</p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-base md:text-lg font-bold text-text-primary">{client.totalLeads}</p>
                        <p className="text-[9px] md:text-[10px] text-text-muted uppercase">Leads</p>
                      </div>
                      <div>
                        <p className="text-base md:text-lg font-bold text-emerald-400">{client.taxaResposta}%</p>
                        <p className="text-[9px] md:text-[10px] text-text-muted uppercase">Resp.</p>
                      </div>
                      <div>
                        <p className="text-base md:text-lg font-bold text-amber-400">{client.taxaConversaoGeral}%</p>
                        <p className="text-[9px] md:text-[10px] text-text-muted uppercase">Conv.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabela de Clientes */}
          <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            <div className="p-3 md:p-4 border-b border-border-default flex items-center justify-between">
              <h3 className="font-semibold text-text-primary text-sm md:text-base">Todos os Clientes</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted hidden md:inline">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-xs md:text-sm text-text-primary"
                >
                  <option value="leads">Leads</option>
                  <option value="conversao">Conversão</option>
                  <option value="resposta">Resposta</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="animate-spin mx-auto text-text-muted mb-2" size={24} />
                <p className="text-sm text-text-muted">Carregando dados...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertTriangle className="mx-auto text-red-400 mb-2" size={24} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : sortedClients.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="mx-auto text-text-muted mb-2" size={24} />
                <p className="text-sm text-text-muted">Nenhum cliente encontrado</p>
                <p className="text-xs text-text-muted mt-1">Execute a migration SQL primeiro</p>
              </div>
            ) : isMobile ? (
              /* VERSÃO MOBILE - Cards */
              <div className="divide-y divide-border-default">
                {sortedClients.map((client, index) => (
                  <div key={client.locationId} className="p-4 space-y-3">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary text-xs font-mono text-text-muted">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate">{client.agentName}</p>
                          <p className="text-[10px] text-text-muted flex items-center gap-1 truncate">
                            <Bot size={10} />
                            {client.locationId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-text-muted">$</span>
                        <span className="font-mono text-text-primary text-sm">{client.custoTotalUsd.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Métricas Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => openDrilldown(`Leads - ${client.agentName}`, 'all', client.agentName, `${client.totalLeads} leads totais`)}
                        className="bg-bg-tertiary/50 rounded-lg p-2 text-center hover:bg-bg-tertiary transition-colors"
                      >
                        <p className="text-sm font-bold text-text-primary">{client.totalLeads}</p>
                        <p className="text-[9px] text-text-muted uppercase">Leads</p>
                      </button>
                      <button
                        onClick={() => openDrilldown(`Responderam - ${client.agentName}`, 'responderam', client.agentName, `${client.leadsResponderam} leads`)}
                        className="bg-bg-tertiary/50 rounded-lg p-2 text-center hover:bg-bg-tertiary transition-colors"
                      >
                        <p className="text-sm font-bold text-text-primary">{client.leadsResponderam}</p>
                        <p className="text-[9px] text-text-muted uppercase">Resp.</p>
                      </button>
                      <button
                        onClick={() => openDrilldown(`Agendaram - ${client.agentName}`, 'agendaram', client.agentName, `${client.leadsAgendaram} leads`)}
                        className="bg-bg-tertiary/50 rounded-lg p-2 text-center hover:bg-bg-tertiary transition-colors"
                      >
                        <p className="text-sm font-bold text-text-primary">{client.leadsAgendaram}</p>
                        <p className="text-[9px] text-text-muted uppercase">Agend.</p>
                      </button>
                      <button
                        onClick={() => openDrilldown(`Fecharam - ${client.agentName}`, 'fecharam', client.agentName, `${client.leadsFecharam} leads`)}
                        className="bg-emerald-500/10 rounded-lg p-2 text-center hover:bg-emerald-500/20 transition-colors"
                      >
                        <p className="text-sm font-bold text-emerald-400">{client.leadsFecharam}</p>
                        <p className="text-[9px] text-text-muted uppercase">Fechou</p>
                      </button>
                    </div>

                    {/* Taxas */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-muted">Tx Resposta</span>
                          <span className={`text-xs font-medium ${client.taxaResposta >= 15 ? 'text-emerald-400' : client.taxaResposta >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                            {client.taxaResposta}%
                          </span>
                        </div>
                        <PercentageBar value={client.taxaResposta} color={client.taxaResposta >= 15 ? 'green' : client.taxaResposta >= 5 ? 'yellow' : 'red'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-text-muted">Tx Conversão</span>
                          <span className={`text-xs font-medium ${client.taxaConversaoGeral >= 10 ? 'text-emerald-400' : client.taxaConversaoGeral >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                            {client.taxaConversaoGeral}%
                          </span>
                        </div>
                        <PercentageBar value={client.taxaConversaoGeral * 2} color={client.taxaConversaoGeral >= 10 ? 'green' : client.taxaConversaoGeral >= 3 ? 'yellow' : 'red'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* VERSÃO DESKTOP - Tabela */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-bg-tertiary/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Cliente / Agente</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Leads</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Responderam</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Agendaram</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Fecharam</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Tx Resp.</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Tx Conv.</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wide">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {sortedClients.map((client, index) => (
                      <tr key={client.locationId} className="hover:bg-bg-tertiary/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary text-xs font-mono text-text-muted">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{client.agentName}</p>
                              <p className="text-xs text-text-muted flex items-center gap-1">
                                <Bot size={12} />
                                {client.locationId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ClickableCell
                            value={client.totalLeads}
                            className="font-semibold"
                            onClick={() => openDrilldown(
                              `Leads - ${client.agentName}`,
                              'all',
                              client.agentName,
                              `${client.totalLeads} leads totais`
                            )}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ClickableCell
                            value={client.leadsResponderam}
                            onClick={() => openDrilldown(
                              `Leads que Responderam - ${client.agentName}`,
                              'responderam',
                              client.agentName,
                              `${client.leadsResponderam} leads que avançaram no funil`
                            )}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ClickableCell
                            value={client.leadsAgendaram}
                            onClick={() => openDrilldown(
                              `Leads que Agendaram - ${client.agentName}`,
                              'agendaram',
                              client.agentName,
                              `${client.leadsAgendaram} leads que agendaram reunião`
                            )}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ClickableCell
                            value={client.leadsFecharam}
                            highlight
                            onClick={() => openDrilldown(
                              `Leads Convertidos - ${client.agentName}`,
                              'fecharam',
                              client.agentName,
                              `${client.leadsFecharam} leads que fecharam negócio`
                            )}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-medium ${client.taxaResposta >= 15 ? 'text-emerald-400' : client.taxaResposta >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                              {client.taxaResposta}%
                            </span>
                            <PercentageBar
                              value={client.taxaResposta}
                              color={client.taxaResposta >= 15 ? 'green' : client.taxaResposta >= 5 ? 'yellow' : 'red'}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-medium ${client.taxaConversaoGeral >= 10 ? 'text-emerald-400' : client.taxaConversaoGeral >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                              {client.taxaConversaoGeral}%
                            </span>
                            <PercentageBar
                              value={client.taxaConversaoGeral * 2}
                              color={client.taxaConversaoGeral >= 10 ? 'green' : client.taxaConversaoGeral >= 3 ? 'yellow' : 'red'}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs text-text-muted">$</span>
                          <span className="font-mono text-text-primary">{client.custoTotalUsd.toFixed(2)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================================ */}
      {/* CONTEÚDO DA TAB: CUSTOS DETALHADOS */}
      {/* ============================================================================ */}
      {activeTab === 'costs' && (
        <>
          {/* Error Alert */}
          {errorCosts && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <p className="text-red-500 font-medium">Erro ao carregar custos</p>
                <p className="text-red-400 text-sm">{errorCosts}</p>
              </div>
              <button onClick={handleRefresh} className="ml-auto text-red-500 hover:underline text-sm">
                Tentar novamente
              </button>
            </div>
          )}

          {/* Cards de Resumo de Custos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Total Cost */}
            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">Custo Total</span>
                <div className="p-1.5 md:p-2 bg-accent-primary/10 rounded-lg">
                  <DollarSign size={14} className="text-accent-primary" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary truncate">
                {loadingCosts ? '...' : formatUSD(totalCost)}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Periodo: {
                  dateRange === 'all' ? 'Todo historico' :
                  dateRange === 'month' ? MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || selectedMonth :
                  `Últimos ${dateRange}`
                }
              </p>
            </div>

            {/* Total Clients */}
            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">Clientes</span>
                <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
                  <Users size={14} className="text-blue-500" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary">
                {loadingCosts ? '...' : costClients.length}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Locations com consumo
              </p>
            </div>

            {/* Total Requests */}
            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">Requests</span>
                <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                  <Zap size={14} className="text-green-500" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary">
                {loadingCosts ? '...' : formatNumber(totalRequests)}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Chamadas de IA
              </p>
            </div>

            {/* Avg Cost per Request */}
            <div className="bg-bg-secondary border border-border-default rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="text-[10px] md:text-xs font-bold text-text-muted uppercase tracking-wider">Custo Médio</span>
                <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp size={14} className="text-purple-500" />
                </div>
              </div>
              <div className="text-lg md:text-2xl font-bold text-text-primary truncate">
                {loadingCosts || totalRequests === 0 ? '...' : formatUSD(totalCost / totalRequests)}
              </div>
              <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
                Por requisição
              </p>
            </div>
          </div>

          {/* Global Summary */}
          {!loadingSummary && (
            <div className="bg-gradient-to-r from-accent-primary/5 to-blue-500/5 border border-accent-primary/20 rounded-xl p-3 md:p-5">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <BarChart3 size={14} className="text-accent-primary" />
                <span className="text-[10px] md:text-xs font-bold text-accent-primary uppercase tracking-wider">Resumo Global (Todo Histórico)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div>
                  <p className="text-[10px] md:text-xs text-text-muted">Total Gasto</p>
                  <p className="text-sm md:text-lg font-bold text-text-primary truncate">{formatUSD(costSummary.total_cost_usd)}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-text-muted">Total Tokens</p>
                  <p className="text-sm md:text-lg font-bold text-text-primary">{formatNumber(costSummary.total_tokens)}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-text-muted">Média/Cliente</p>
                  <p className="text-sm md:text-lg font-bold text-text-primary truncate">{formatUSD(costSummary.avg_cost_per_client)}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-text-muted">Top Model</p>
                  <p className="text-sm md:text-lg font-bold text-text-primary truncate">{costSummary.top_model}</p>
                </div>
              </div>
            </div>
          )}

          {/* Clients Table (Costs) */}
          <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
            <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Users size={16} />
                Custos por Cliente
              </h2>
            </div>

            <div className="divide-y divide-border-default">
              {loadingCosts ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 md:p-5 animate-pulse">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-bg-tertiary flex-shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-bg-tertiary rounded w-24 md:w-32"></div>
                          <div className="h-3 bg-bg-tertiary rounded w-16 md:w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-bg-tertiary rounded w-16 md:w-20"></div>
                    </div>
                  </div>
                ))
              ) : costClients.length > 0 ? (
                costClients.map((client) => (
                  <div
                    key={client.location_name}
                    onClick={() => setSelectedCostClient(client)}
                    className="p-4 md:p-5 hover:bg-bg-hover active:bg-bg-hover transition-all cursor-pointer group"
                  >
                    {isMobile ? (
                      /* VERSÃO MOBILE - Card Layout */
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary/20 to-blue-500/20 border border-accent-primary/20 flex items-center justify-center text-sm font-bold text-accent-primary flex-shrink-0">
                              {client.location_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-text-primary text-sm truncate">
                                {client.location_name}
                              </h3>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {client.models_used[0] || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-accent-primary font-mono">
                              {formatUSD(client.total_cost_usd)}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-[10px] text-text-muted">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Zap size={10} />
                              {formatNumber(client.total_requests)} req
                            </span>
                            <span className="flex items-center gap-1">
                              <Cpu size={10} />
                              {formatNumber(client.total_tokens_input)} tokens
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-text-muted" />
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                          <div
                            className="bg-accent-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(getPercentage(client.total_cost_usd), 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* VERSÃO DESKTOP - Row Layout */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary/20 to-blue-500/20 border border-accent-primary/20 flex items-center justify-center text-lg font-bold text-accent-primary group-hover:border-accent-primary/40 transition-colors">
                            {client.location_name.substring(0, 2).toUpperCase()}
                          </div>

                          {/* Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                                {client.location_name}
                              </h3>
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-bold uppercase">
                                {client.models_used[0] || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Zap size={10} />
                                {formatNumber(client.total_requests)} requests
                              </span>
                              <span className="flex items-center gap-1">
                                <Cpu size={10} />
                                {formatNumber(client.total_tokens_input)} tokens
                              </span>
                              {client.last_activity && (
                                <span className="flex items-center gap-1">
                                  <Clock size={10} />
                                  {formatDateCost(client.last_activity)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cost & Progress */}
                        <div className="flex items-center gap-6">
                          {/* Progress Bar */}
                          <div className="hidden md:block w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-text-muted">{getPercentage(client.total_cost_usd).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                              <div
                                className="bg-accent-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(getPercentage(client.total_cost_usd), 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Cost */}
                          <div className="text-right min-w-[100px]">
                            <p className="text-lg font-bold text-accent-primary font-mono">
                              {formatUSD(client.total_cost_usd)}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {formatUSD(client.avg_cost_per_request)}/req
                            </p>
                          </div>

                          {/* Arrow */}
                          <ChevronRight size={20} className="text-text-muted group-hover:text-accent-primary transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                    <DollarSign size={32} className="opacity-20" />
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-text-primary mb-1">Nenhum custo registrado</h3>
                  <p className="text-xs md:text-sm text-text-muted max-w-xs">
                    Os custos de IA aparecerão aqui conforme os agentes processam conversas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Seção de Versões por Cliente - Sempre visível */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border-default flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm md:text-base">
            <Layers size={18} className="text-purple-400" />
            <span className="hidden md:inline">Versões de Agentes por Cliente</span>
            <span className="md:hidden">Versões</span>
          </h3>
          <span className="text-[10px] md:text-xs text-text-muted">
            {versionsByLocation.reduce((acc, loc) => acc + loc.versions.length, 0)} versões
          </span>
        </div>

        {versionsLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-text-muted mb-2" size={24} />
            <p className="text-sm text-text-muted">Carregando versões...</p>
          </div>
        ) : versionsByLocation.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="mx-auto text-text-muted mb-2" size={24} />
            <p className="text-sm text-text-muted">Nenhuma versão encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {versionsByLocation.map((location) => (
              <div key={location.locationId}>
                {/* Header do Cliente */}
                <button
                  onClick={() => toggleLocationExpanded(location.locationId)}
                  className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                      <Bot size={isMobile ? 16 : 20} className="text-text-muted" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium text-text-primary text-sm md:text-base truncate">{location.agentName}</p>
                      <p className="text-[10px] md:text-xs text-text-muted truncate hidden md:block">{location.locationId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-[10px] md:text-xs text-text-muted">{location.versions.length}</span>
                      <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {location.versions.filter(v => v.isActive).length} <span className="hidden md:inline">ativas</span>
                      </span>
                    </div>
                    {expandedLocations.has(location.locationId) ? (
                      <ChevronUp size={18} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={18} className="text-text-muted" />
                    )}
                  </div>
                </button>

                {/* Lista de Versões Expandida */}
                {expandedLocations.has(location.locationId) && (
                  <div className="bg-bg-tertiary/20 border-t border-border-default">
                    {isMobile ? (
                      /* VERSÃO MOBILE - Cards de versões */
                      <div className="divide-y divide-border-default/50 p-3 space-y-2">
                        {location.versions.map((version) => (
                          <div key={version.id} className="bg-bg-primary rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-text-primary">v{version.version}</span>
                                  <StatusBadge status={version.status} />
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                                  <span>{version.totalTestRuns} testes</span>
                                  {version.lastTestScore !== null && (
                                    <span className={version.lastTestScore >= 7 ? 'text-emerald-400' : version.lastTestScore >= 4 ? 'text-amber-400' : 'text-red-400'}>
                                      Score: {version.lastTestScore.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ToggleSwitch
                                isOn={version.isActive}
                                onToggle={() => handleToggleVersion(version.id, version.isActive)}
                                loading={versionUpdating === version.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* VERSÃO DESKTOP - Tabela */
                      <table className="w-full">
                        <thead>
                          <tr className="bg-bg-tertiary/50">
                            <th className="text-left py-2 px-4 text-xs font-medium text-text-muted uppercase">Versão</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-text-muted uppercase">Status</th>
                            <th className="text-center py-2 px-4 text-xs font-medium text-text-muted uppercase">Testes</th>
                            <th className="text-center py-2 px-4 text-xs font-medium text-text-muted uppercase">Score</th>
                            <th className="text-left py-2 px-4 text-xs font-medium text-text-muted uppercase">Atualizado</th>
                            <th className="text-center py-2 px-4 text-xs font-medium text-text-muted uppercase">Ativo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default/50">
                          {location.versions.map((version) => (
                            <tr key={version.id} className="hover:bg-bg-tertiary/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Hash size={14} className="text-text-muted" />
                                  <span className="font-mono text-sm text-text-primary">{version.version}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status={version.status} />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-sm text-text-primary">{version.totalTestRuns}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {version.lastTestScore !== null ? (
                                  <span className={`text-sm font-medium ${
                                    version.lastTestScore >= 7 ? 'text-emerald-400' :
                                    version.lastTestScore >= 4 ? 'text-amber-400' : 'text-red-400'
                                  }`}>
                                    {version.lastTestScore.toFixed(1)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-text-muted">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                  <Clock size={12} />
                                  {formatDate(version.updatedAt)}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <ToggleSwitch
                                    isOn={version.isActive}
                                    onToggle={() => handleToggleVersion(version.id, version.isActive)}
                                    loading={versionUpdating === version.id}
                                  />
                                  <span className={`text-xs ${version.isActive ? 'text-emerald-400' : 'text-text-muted'}`}>
                                    {version.isActive ? 'ON' : 'OFF'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Drill-down de Leads (Tab Métricas) */}
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

      {/* Modal de Detalhes de Custo por Cliente (Tab Custos) */}
      {selectedCostClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className={`bg-bg-secondary border border-border-default rounded-2xl w-full overflow-hidden shadow-2xl ${
            isMobile ? 'h-full max-h-full rounded-none' : 'max-w-4xl max-h-[90vh]'
          }`}>
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-border-default flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg md:text-xl font-bold text-text-primary truncate">{selectedCostClient.location_name}</h2>
                <p className="text-[10px] md:text-xs text-text-muted font-mono mt-1 truncate">
                  {selectedCostClient.location_ids?.length > 1
                    ? `${selectedCostClient.location_ids.length} location IDs`
                    : selectedCostClient.location_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedCostClient(null)}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className={`p-4 md:p-6 overflow-y-auto ${isMobile ? 'h-[calc(100%-80px)]' : 'max-h-[calc(90vh-120px)]'}`}>
              {/* Client Summary */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Custo Total</p>
                  <p className="text-base md:text-xl font-bold text-accent-primary truncate">{formatUSD(selectedCostClient.total_cost_usd)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Requisições</p>
                  <p className="text-base md:text-xl font-bold text-text-primary">{formatNumber(selectedCostClient.total_requests)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Tokens Input</p>
                  <p className="text-base md:text-xl font-bold text-text-primary">{formatNumber(selectedCostClient.total_tokens_input)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Custo Médio</p>
                  <p className="text-base md:text-xl font-bold text-text-primary truncate">{formatUSD(selectedCostClient.avg_cost_per_request)}</p>
                </div>
              </div>

              {/* Daily Costs */}
              {dailyCosts.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <h3 className="text-sm font-bold text-text-primary mb-2 md:mb-3 flex items-center gap-2">
                    <Calendar size={14} />
                    Custos por Dia
                  </h3>
                  {isMobile ? (
                    /* VERSÃO MOBILE - Cards */
                    <div className="space-y-2">
                      {dailyCosts.slice(0, 5).map((day) => (
                        <div key={day.date} className="bg-bg-primary border border-border-default rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{day.date}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                              <span>{formatNumber(day.tokens_input)} tokens</span>
                              <span>{day.requests} req</span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-accent-primary font-mono">{formatUSD(day.cost_usd)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* VERSÃO DESKTOP - Tabela */
                    <div className="bg-bg-primary border border-border-default rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-bg-tertiary">
                          <tr>
                            <th className="text-left p-3 text-xs font-bold text-text-muted uppercase">Data</th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">Custo</th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">Tokens</th>
                            <th className="text-right p-3 text-xs font-bold text-text-muted uppercase">Requests</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                          {dailyCosts.slice(0, 7).map((day) => (
                            <tr key={day.date} className="hover:bg-bg-hover">
                              <td className="p-3 font-medium">{day.date}</td>
                              <td className="p-3 text-right text-accent-primary font-mono">{formatUSD(day.cost_usd)}</td>
                              <td className="p-3 text-right text-text-muted">{formatNumber(day.tokens_input)}</td>
                              <td className="p-3 text-right text-text-muted">{day.requests}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-2 md:mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  Atividade Recente
                </h3>
                {loadingCostDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-text-muted" size={24} />
                  </div>
                ) : clientCostDetails.length > 0 ? (
                  <div className="space-y-2">
                    {clientCostDetails.slice(0, isMobile ? 5 : 10).map((detail) => (
                      <div
                        key={detail.id}
                        className="bg-bg-primary border border-border-default rounded-lg p-3 flex items-center justify-between hover:border-accent-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="p-1.5 md:p-2 bg-bg-tertiary rounded-lg flex-shrink-0">
                            <MessageSquare size={12} className="text-text-muted" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-medium text-text-primary truncate">{detail.contact_name}</p>
                            <p className="text-[10px] md:text-xs text-text-muted truncate">{detail.tipo_acao} via {detail.canal}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-xs md:text-sm font-bold text-accent-primary font-mono">{formatUSD(detail.custo_usd)}</p>
                          <p className="text-[10px] md:text-xs text-text-muted">{formatDateCost(detail.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-4 text-sm">Nenhuma atividade encontrada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
