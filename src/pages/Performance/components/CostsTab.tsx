import React from 'react';
import {
  DollarSign,
  Users,
  Zap,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Cpu,
  Clock,
  ChevronRight
} from 'lucide-react';
import { formatUSD, formatNumber } from '../helpers';
import type { ClientCostSummary } from '../../../hooks/useClientCosts';

const formatDateCost = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface CostsTabProps {
  costClients: any[];
  totalCost: number;
  totalRequests: number;
  avgCostPerRequest: number;
  loadingCosts: boolean;
  errorCosts: any;
  costSummary: any;
  loadingSummary: boolean;
  selectedCostClient: ClientCostSummary | null;
  onSelectCostClient: (client: ClientCostSummary) => void;
  isMobile: boolean;
  dateRange: string;
  selectedMonth: string;
  monthOptions: Array<{ value: string; label: string }>;
  handleRefresh: () => void;
}

export function CostsTab({
  costClients,
  totalCost,
  totalRequests,
  avgCostPerRequest,
  loadingCosts,
  errorCosts,
  costSummary,
  loadingSummary,
  selectedCostClient,
  onSelectCostClient,
  isMobile,
  dateRange,
  selectedMonth,
  monthOptions,
  handleRefresh
}: CostsTabProps) {
  const getPercentage = (value: number) => {
    if (totalCost === 0) return 0;
    return (value / totalCost) * 100;
  };

  return (
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
              dateRange === 'month' ? monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth :
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
            <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp size={14} className="text-blue-500" />
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
                onClick={() => onSelectCostClient(client)}
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
  );
}
