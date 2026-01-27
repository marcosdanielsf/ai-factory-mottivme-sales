import React, { useState, useCallback } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useClientPerformance, useAllAgentVersions, DateRangeType, usePerformanceDrilldown, DrilldownFilter } from '../hooks';
import { useToast } from '../hooks/useToast';
import { LeadsDrilldownModal } from '../components/LeadsDrilldownModal';

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
// COMPONENTE PRINCIPAL
// ============================================================================

export const Performance = () => {
  const { showToast } = useToast();

  // Filtros de período (aplicado aos CUSTOS, não aos leads do GHL)
  const [dateRange, setDateRange] = useState<DateRangeType>('30d');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0].value);

  // Filtros de cliente
  const [clientFilter, setClientFilter] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Estado do modal de drill-down
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [drilldownSubtitle, setDrilldownSubtitle] = useState('');
  const [drilldownClientName, setDrilldownClientName] = useState<string | undefined>();
  const [drilldownFilterType, setDrilldownFilterType] = useState<DrilldownFilter>('all');

  // Hook de drill-down
  const {
    leads: drilldownLeads,
    loading: drilldownLoading,
    error: drilldownError,
    fetchLeads,
    clearLeads
  } = usePerformanceDrilldown();

  // Hook com filtros aplicados
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
      await Promise.all([refetch(), refetchVersions()]);
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Trophy className="text-amber-400" size={28} />
            Performance por Cliente
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Métricas de desempenho dos agentes por cliente
          </p>
        </div>

        {/* Filtros de Período (aplicado aos custos) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-secondary border border-border-default rounded-lg p-1">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === '7d' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              7 dias
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === '30d' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              30 dias
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'month' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === 'all' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Seletor de Mês */}
          {dateRange === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
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
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      {showFilters && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-text-muted" />
            <span className="text-xs font-bold text-text-muted uppercase">Filtros:</span>
          </div>

          {/* Dropdown de Cliente */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">Cliente:</label>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-default bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 min-w-[180px]"
            >
              <option value="">Todos os clientes</option>
              {allClients?.map((client) => (
                <option key={client.locationId} value={client.agentName}>
                  {client.agentName}
                </option>
              ))}
            </select>
          </div>

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
            {showInactive ? 'Mostrando inativos' : 'Mostrar inativos'}
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
              Limpar filtros
            </button>
          )}

          {/* Info de inativos */}
          <div className="ml-auto text-xs text-text-muted">
            {!showInactive && (
              <span>Mostrando apenas clientes com atividade de IA nos últimos 30 dias</span>
            )}
          </div>
        </div>
      )}


      {/* Cards de Totais - CLICÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-400" size={20} />
            <h3 className="font-semibold text-red-400">Clientes com Alertas ({alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.locationId}
                className="flex items-center justify-between bg-bg-secondary/50 rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <Bot size={16} className="text-text-muted" />
                  <span className="text-sm text-text-primary">{alert.agentName}</span>
                </div>
                <div className="flex items-center gap-2">
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
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Trophy className="text-amber-400" size={20} />
            Top Performers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ranking.slice(0, 3).map((client, index) => (
              <div
                key={client.locationId}
                className={`relative overflow-hidden rounded-lg p-4 border ${
                  index === 0 ? 'bg-amber-500/5 border-amber-500/30' :
                  index === 1 ? 'bg-slate-400/5 border-slate-400/30' :
                  'bg-orange-700/5 border-orange-700/30'
                }`}
              >
                <div className="absolute top-2 right-2">
                  <RankBadge rank={index + 1} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                    <Bot size={20} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{client.agentName}</p>
                    <p className="text-xs text-text-muted truncate">{client.locationId}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-text-primary">{client.totalLeads}</p>
                    <p className="text-[10px] text-text-muted uppercase">Leads</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-400">{client.taxaResposta}%</p>
                    <p className="text-[10px] text-text-muted uppercase">Resp.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-400">{client.taxaConversaoGeral}%</p>
                    <p className="text-[10px] text-text-muted uppercase">Conv.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Clientes */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Todos os Clientes</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg-tertiary border border-border-default rounded px-2 py-1 text-sm text-text-primary"
            >
              <option value="leads">Volume de Leads</option>
              <option value="conversao">Taxa de Conversão</option>
              <option value="resposta">Taxa de Resposta</option>
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
        ) : (
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

      {/* Seção de Versões por Cliente */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Layers size={20} className="text-purple-400" />
            Versões de Agentes por Cliente
          </h3>
          <span className="text-xs text-text-muted">
            {versionsByLocation.reduce((acc, loc) => acc + loc.versions.length, 0)} versões em {versionsByLocation.length} clientes
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
                  className="w-full flex items-center justify-between p-4 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                      <Bot size={20} className="text-text-muted" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-text-primary">{location.agentName}</p>
                      <p className="text-xs text-text-muted">{location.locationId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{location.versions.length} versões</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        {location.versions.filter(v => v.isActive).length} ativas
                      </span>
                    </div>
                    {expandedLocations.has(location.locationId) ? (
                      <ChevronUp size={20} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={20} className="text-text-muted" />
                    )}
                  </div>
                </button>

                {/* Lista de Versões Expandida */}
                {expandedLocations.has(location.locationId) && (
                  <div className="bg-bg-tertiary/20 border-t border-border-default">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Drill-down de Leads */}
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
    </div>
  );
};

export default Performance;
