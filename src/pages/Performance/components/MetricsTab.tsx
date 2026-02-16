import React from 'react';
import {
  AlertTriangle,
  Trophy,
  Bot,
  RefreshCw,
  Users
} from 'lucide-react';
import { StatCard, RankBadge, PercentageBar, ClickableCell, AlertBadge } from './StatCard';

interface MetricsTabProps {
  clients: any[];
  sortedClients: any[];
  alerts: any[];
  ranking: any[];
  totals: any;
  loading: boolean;
  error: any;
  isMobile: boolean;
  sortBy: 'leads' | 'conversao' | 'resposta';
  setSortBy: (sortBy: 'leads' | 'conversao' | 'resposta') => void;
  openDrilldown: (title: string, filterType: string, clientName?: string, subtitle?: string) => void;
}

export function MetricsTab({
  clients,
  sortedClients,
  alerts,
  ranking,
  totals,
  loading,
  error,
  isMobile,
  sortBy,
  setSortBy,
  openDrilldown
}: MetricsTabProps) {
  return (
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
  );
}
