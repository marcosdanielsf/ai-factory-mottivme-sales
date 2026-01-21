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
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <DollarSign size={28} className="text-accent-primary" />
            <h1 className="text-3xl font-semibold">Custos por Cliente</h1>
          </div>
          <p className="text-text-secondary">Monitore o consumo de IA e custos por cliente.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex bg-bg-tertiary/50 rounded-lg border border-border-default p-1">
            {[
              { value: 'today', label: 'Hoje' },
              { value: '7d', label: '7 dias' },
              { value: '30d', label: '30 dias' },
              { value: 'month', label: 'Mês' },
              { value: 'all', label: 'Todos' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as DateRange)}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
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
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border-default bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50"
            >
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}

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
              {allClients.map((client) => (
                <option key={client.location_name} value={client.location_name}>
                  {client.location_name}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Custo Total</span>
            <div className="p-2 bg-accent-primary/10 rounded-lg">
              <DollarSign size={16} className="text-accent-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {loading ? '...' : formatUSD(totalCost)}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Periodo: {
              dateRange === 'all' ? 'Todo historico' :
              dateRange === 'today' ? 'Hoje' :
              dateRange === 'month' ? availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth :
              `Ultimos ${dateRange}`
            }
          </p>
        </div>

        {/* Total Clients */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Clientes Ativos</span>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users size={16} className="text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {loading ? '...' : clients.length}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Locations com consumo
          </p>
        </div>

        {/* Total Requests */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Requisicoes</span>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap size={16} className="text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {loading ? '...' : formatNumber(totalRequests)}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Chamadas de IA
          </p>
        </div>

        {/* Avg Cost per Request */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Custo Medio</span>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp size={16} className="text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {loading || totalRequests === 0 ? '...' : formatUSD(totalCost / totalRequests)}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Por requisicao
          </p>
        </div>
      </div>

      {/* Global Summary */}
      {!loadingSummary && (
        <div className="bg-gradient-to-r from-accent-primary/5 to-blue-500/5 border border-accent-primary/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-accent-primary" />
            <span className="text-xs font-bold text-accent-primary uppercase tracking-wider">Resumo Global (Todo Historico)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-muted">Total Gasto</p>
              <p className="text-lg font-bold text-text-primary">{formatUSD(summary.total_cost_usd)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Total Tokens</p>
              <p className="text-lg font-bold text-text-primary">{formatNumber(summary.total_tokens)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Media por Cliente</p>
              <p className="text-lg font-bold text-text-primary">{formatUSD(summary.avg_cost_per_client)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Modelo Principal</p>
              <p className="text-lg font-bold text-text-primary truncate">{summary.top_model}</p>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-default flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{selectedClient.location_name}</h2>
                <p className="text-xs text-text-muted font-mono mt-1">
                  {selectedClient.location_ids?.length > 1
                    ? `${selectedClient.location_ids.length} location IDs`
                    : selectedClient.location_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-bg-tertiary rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Client Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-bg-primary border border-border-default rounded-lg p-4">
                  <p className="text-xs text-text-muted">Custo Total</p>
                  <p className="text-xl font-bold text-accent-primary">{formatUSD(selectedClient.total_cost_usd)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-4">
                  <p className="text-xs text-text-muted">Requisicoes</p>
                  <p className="text-xl font-bold text-text-primary">{formatNumber(selectedClient.total_requests)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-4">
                  <p className="text-xs text-text-muted">Tokens Input</p>
                  <p className="text-xl font-bold text-text-primary">{formatNumber(selectedClient.total_tokens_input)}</p>
                </div>
                <div className="bg-bg-primary border border-border-default rounded-lg p-4">
                  <p className="text-xs text-text-muted">Custo Medio</p>
                  <p className="text-xl font-bold text-text-primary">{formatUSD(selectedClient.avg_cost_per_request)}</p>
                </div>
              </div>

              {/* Daily Costs */}
              {dailyCosts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Calendar size={14} />
                    Custos por Dia
                  </h3>
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
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Clock size={14} />
                  Atividade Recente
                </h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="animate-spin text-text-muted" size={24} />
                  </div>
                ) : clientDetails.length > 0 ? (
                  <div className="space-y-2">
                    {clientDetails.slice(0, 10).map((detail) => (
                      <div
                        key={detail.id}
                        className="bg-bg-primary border border-border-default rounded-lg p-3 flex items-center justify-between hover:border-accent-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-bg-tertiary rounded-lg">
                            <MessageSquare size={14} className="text-text-muted" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{detail.contact_name}</p>
                            <p className="text-xs text-text-muted">{detail.tipo_acao} via {detail.canal}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent-primary font-mono">{formatUSD(detail.custo_usd)}</p>
                          <p className="text-xs text-text-muted">{formatDate(detail.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-4">Nenhuma atividade encontrada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="border border-border-default rounded-lg bg-bg-secondary overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border-default bg-bg-tertiary">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users size={16} />
            Custos por Cliente
          </h2>
        </div>

        <div className="divide-y divide-border-default">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-bg-tertiary"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-bg-tertiary rounded w-32"></div>
                      <div className="h-3 bg-bg-tertiary rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-bg-tertiary rounded w-20"></div>
                </div>
              </div>
            ))
          ) : clients.length > 0 ? (
            clients.map((client) => (
              <div
                key={client.location_name}
                onClick={() => setSelectedClient(client)}
                className="p-5 hover:bg-bg-hover transition-all cursor-pointer group"
              >
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
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-bg-tertiary rounded-full flex items-center justify-center text-text-muted mb-4">
                <DollarSign size={40} className="opacity-20" />
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-1">Nenhum custo registrado</h3>
              <p className="text-sm text-text-muted max-w-xs">
                Os custos de IA aparecerão aqui conforme os agentes processam conversas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
