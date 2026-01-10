import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  AlertTriangle,
  Trophy,
  MessageSquare,
  Calendar,
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
  Filter
} from 'lucide-react';
import { useClientPerformance, useAllAgentVersions, DateRangeType } from '../src/hooks';
import { useToast } from '../src/hooks/useToast';

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
  trend
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  trend?: { value: number; label: string };
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.value >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
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

  // Filtros de período
  const [dateRange, setDateRange] = useState<DateRangeType>('30d');
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[0].value);

  // Hook com filtro aplicado
  const {
    clients,
    ranking,
    alerts,
    totals,
    loading,
    error,
    refetch
  } = useClientPerformance({
    dateRange,
    month: dateRange === 'month' ? selectedMonth : undefined
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

  // Label do período selecionado
  const periodLabel = useMemo(() => {
    if (dateRange === '7d') return 'Últimos 7 dias';
    if (dateRange === '30d') return 'Últimos 30 dias';
    if (dateRange === 'all') return 'Todo histórico';
    if (dateRange === 'month') {
      const monthOpt = MONTH_OPTIONS.find(m => m.value === selectedMonth);
      return monthOpt?.label || selectedMonth;
    }
    return '';
  }, [dateRange, selectedMonth]);

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

        {/* Filtros de Período */}
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
              Tudo
            </button>
          </div>

          {/* Seletor de Mês (aparece quando dateRange === 'month') */}
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Badge do período */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-text-muted" />
        <span className="text-sm text-text-muted">Período: <span className="text-text-primary font-medium">{periodLabel}</span></span>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clientes"
          value={totals.totalClientes}
          subtitle="com agentes ativos"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Total Leads"
          value={totals.totalLeads.toLocaleString()}
          subtitle="em todos os clientes"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Taxa Resposta Média"
          value={`${totals.taxaRespostMedia.toFixed(1)}%`}
          subtitle="média geral"
          icon={MessageSquare}
          color="green"
        />
        <StatCard
          title="Taxa Conversão Média"
          value={`${totals.taxaConversaoMedia.toFixed(1)}%`}
          subtitle="lead → fechamento"
          icon={Target}
          color="yellow"
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
                      <span className="font-semibold text-text-primary">{client.totalLeads}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-text-primary">{client.leadsResponderam}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-text-primary">{client.leadsAgendaram}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-emerald-400 font-semibold">{client.leadsFecharam}</span>
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
    </div>
  );
};

export default Performance;
