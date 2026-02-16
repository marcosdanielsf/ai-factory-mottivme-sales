import React from 'react';
import {
  X,
  DollarSign,
  Cpu,
  Hash,
  BarChart3,
  AlertCircle,
  Calendar,
  Clock,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import type { ClientCostSummary } from '../../../hooks/useClientCosts';
import { formatUSD, formatNumber, formatDateCost } from '../helpers';

interface DailyCost {
  date: string;
  cost_usd: number;
  tokens_input: number;
  requests: number;
}

interface CostDetail {
  id: string;
  contact_name: string;
  tipo_acao: string;
  canal: string;
  custo_usd: number;
  created_at: string;
}

interface CostDetailModalProps {
  selectedCostClient: ClientCostSummary;
  onClose: () => void;
  clientCostDetails: CostDetail[];
  dailyCosts: DailyCost[];
  loadingCostDetails: boolean;
  isMobile: boolean;
}

export function CostDetailModal({
  selectedCostClient,
  onClose,
  clientCostDetails,
  dailyCosts,
  loadingCostDetails,
  isMobile
}: CostDetailModalProps) {
  return (
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
            onClick={onClose}
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
  );
}
