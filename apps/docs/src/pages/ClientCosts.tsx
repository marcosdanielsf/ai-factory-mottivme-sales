import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  Cpu,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Calendar,
  X,
  Clock,
  Zap,
  MessageSquare,
  BarChart3,
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import {
  useClientCosts,
  useClientCostDetails,
  useGlobalCostSummary,
  ClientCostSummary
} from '../hooks/useClientCosts';
import { useIsMobile } from '../hooks/useMediaQuery';

type DateRange = 'today' | '7d' | '30d' | 'all' | 'month';

// Gerar lista de meses disponíveis (últimos 12 meses)
const getAvailableMonths = () => {
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

export const ClientCosts = () => {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedClient, setSelectedClient] = useState<ClientCostSummary | null>(null);

  // Novos filtros
  const [clientFilter, setClientFilter] = useState<string>(''); // Filtro por cliente específico
  const [showInactive, setShowInactive] = useState<boolean>(false); // Mostrar inativos
  const [showFilters, setShowFilters] = useState<boolean>(false); // Toggle painel de filtros

  const availableMonths = getAvailableMonths();

  // Hooks de dados
  const { clients, allClients, totalCost, totalRequests, loading, error, refetch } = useClientCosts({
    dateRange,
    month: dateRange === 'month' ? selectedMonth : undefined,
    clientName: clientFilter || undefined,
    showInactive,
    inactiveDays: 30
  });
  const { summary, loading: loadingSummary } = useGlobalCostSummary();
  const { costs: clientDetails, dailyCosts, loading: loadingDetails } = useClientCostDetails(
    selectedClient?.location_name || null,
    { dateRange, month: dateRange === 'month' ? selectedMonth : undefined }
  );

  const handleRefresh = async () => {
    await refetch();
    showToast('Dados de custos atualizados', 'info');
  };

  // Formatar valor em USD
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Formatar numeros grandes
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calcular percentual do total
  const getPercentage = (value: number) => {
    if (totalCost === 0) return 0;
    return (value / totalCost) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <div className="flex items-center gap-2 md:gap-3 mb-1">
            <DollarSign size={isMobile ? 24 : 28} className="text-accent-primary" />
            <h1 className="text-xl md:text-3xl font-semibold">Custos por Cliente</h1>
          </div>
          <p className="text-text-secondary text-sm md:text-base">Monitore o consumo de IA e custos por cliente.</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap w-full md:w-auto">
          {/* Date Range Selector - Compacto no mobile */}
          <div className="flex bg-bg-tertiary/50 rounded-lg border border-border-default p-1 overflow-x-auto flex-1 md:flex-none">
            {[
              { value: 'today', label: isMobile ? 'Hoje' : 'Hoje' },
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: 'month', label: 'Mês' },
              { value: 'all', label: 'Todos' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as DateRange)}
                disabled={loading}
                className={`px-2 md:px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  dateRange === option.value
                    ? 'bg-bg-secondary text-accent-primary shadow-sm border border-border-default'
                    : 'text-text-muted hover:text-text-primary'
                } disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Month Selector - só aparece quando dateRange é 'month' */}
          {dateRange === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={loading}
              className="px-2 md:px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 max-w-[120px] md:max-w-none"
            >
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {isMobile ? month.value : month.label}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-all ${
                showFilters || clientFilter || showInactive
                  ? 'text-accent-primary bg-accent-primary/10 border-accent-primary/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary border-border-default'
              }`}
              title="Filtros avançados"
            >
              <Filter size={18} />
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
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
              {allClients.map((client) => (
                <option key={client.location_name} value={client.location_name}>
                  {client.location_name}
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
              <span className="md:hidden">Inativos</span>
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
              <span>Mostrando apenas clientes com atividade nos últimos 30 dias</span>
            )}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <p className="text-red-500 font-medium">Erro ao carregar custos</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <button onClick={handleRefresh} className="ml-auto text-red-500 hover:underline text-sm">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Summary Cards */}
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
            {loading ? '...' : formatUSD(totalCost)}
          </div>
          <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
            Periodo: {
              dateRange === 'all' ? 'Todo historico' :
              dateRange === 'today' ? 'Hoje' :
              dateRange === 'month' ? availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth :
              `Ultimos ${dateRange}`
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
            {loading ? '...' : clients.length}
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
            {loading ? '...' : formatNumber(totalRequests)}
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
            {loading || totalRequests === 0 ? '...' : formatUSD(totalCost / totalRequests)}
          </div>
          <p className="text-[10px] md:text-xs text-text-muted mt-1 hidden md:block">
            Por requisicao
          </p>
        </div>
      </div>

      {/* Global Summary */}
      {!loadingSummary && (
        <div className="bg-gradient-to-r from-accent-primary/5 to-blue-500/5 border border-accent-primary/20 rounded-xl p-3 md:p-5">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <BarChart3 size={14} className="text-accent-primary" />
            <span className="text-[10px] md:text-xs font-bold text-accent-primary uppercase tracking-wider">Resumo Global</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">Total Gasto</p>
              <p className="text-sm md:text-lg font-bold text-text-primary truncate">{formatUSD(summary.total_cost_usd)}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">Total Tokens</p>
              <p className="text-sm md:text-lg font-bold text-text-primary">{formatNumber(summary.total_tokens)}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">Média/Cliente</p>
              <p className="text-sm md:text-lg font-bold text-text-primary truncate">{formatUSD(summary.avg_cost_per_client)}</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-text-muted">Top Model</p>
              <p className="text-sm md:text-lg font-bold text-text-primary truncate">{summary.top_model}</p>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
          <div className={`bg-bg-secondary border border-border-default rounded-2xl w-full overflow-hidden shadow-2xl ${
            isMobile ? 'h-full max-h-full rounded-none' : 'max-w-4xl max-h-[90vh]'
          }`}>
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-border-default flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg md:text-xl font-bold text-text-primary truncate">{selectedClient.location_name}</h2>
                <p className="text-[10px] md:text-xs text-text-muted font-mono mt-1 truncate">
                  {selectedClient.location_ids?.length > 1
                    ? `${selectedClient.location_ids.length} location IDs`
                    : selectedClient.location_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
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
                  <p className="text-base md:text-xl font-bold text-accent-primary truncate">{formatUSD(selectedClient.total_cost_usd)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Requisicoes</p>
                  <p className="text-base md:text-xl font-bold text-text-primary">{formatNumber(selectedClient.total_requests)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Tokens Input</p>
                  <p className="text-base md:text-xl font-bold text-text-primary">{formatNumber(selectedClient.total_tokens_input)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-3 md:p-4">
                  <p className="text-[10px] md:text-xs text-text-muted">Custo Medio</p>
                  <p className="text-base md:text-xl font-bold text-text-primary truncate">{formatUSD(selectedClient.avg_cost_per_request)}</p>
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
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-text-muted" size={24} />
                  </div>
                ) : clientDetails.length > 0 ? (
                  <div className="space-y-2">
                    {clientDetails.slice(0, isMobile ? 5 : 10).map((detail) => (
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
                          <p className="text-[10px] md:text-xs text-text-muted">{formatDate(detail.created_at)}</p>
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

      {/* Clients Table */}
      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
        <div className="p-3 md:p-4 border-b border-border-default bg-bg-tertiary">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users size={16} />
            Custos por Cliente
          </h2>
        </div>

        <div className="divide-y divide-border-default">
          {loading ? (
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
          ) : clients.length > 0 ? (
            clients.map((client) => (
              <div
                key={client.location_name}
                onClick={() => setSelectedClient(client)}
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
                              {formatDate(client.last_activity)}
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
    </div>
  );
};
