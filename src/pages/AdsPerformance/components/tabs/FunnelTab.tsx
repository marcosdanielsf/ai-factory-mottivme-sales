import React, { useMemo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../helpers';
import type { FunnelData, AdsAnomaly } from '../../types';

interface FunnelTabProps {
  funnelData: FunnelData[];
  anomalies: AdsAnomaly[];
  loading: boolean;
}

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export const FunnelTab: React.FC<FunnelTabProps> = ({ funnelData, anomalies, loading }) => {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  const anomalyMap = useMemo(() => {
    const map = new Map<string, AdsAnomaly>();
    for (const a of anomalies) {
      if (a.is_anomaly) map.set(a.ad_id, a);
    }
    return map;
  }, [anomalies]);

  // Aggregate funnel totals across all attribution levels
  const totals = useMemo(() => {
    let impressions = 0, clicks = 0, conversas = 0, leads = 0;
    let novo = 0, emContato = 0, agendou = 0, noShow = 0, perdido = 0, won = 0;
    let wonValue = 0, totalSpend = 0;

    for (const f of funnelData) {
      impressions += f.total_impressions || 0;
      clicks += f.total_clicks || 0;
      conversas += f.total_conversas || 0;
      leads += f.total_leads || 0;
      novo += f.novo || 0;
      emContato += f.em_contato || 0;
      agendou += f.agendou || 0;
      noShow += f.no_show || 0;
      perdido += f.perdido || 0;
      won += f.won || 0;
      wonValue += f.won_value || 0;
      totalSpend += f.total_spend || 0;
    }

    return { impressions, clicks, conversas, leads, novo, emContato, agendou, noShow, perdido, won, wonValue, totalSpend };
  }, [funnelData]);

  const steps: FunnelStep[] = [
    { label: 'Impressoes', value: totals.impressions, color: '#64748b' },
    { label: 'Cliques', value: totals.clicks, color: '#3b82f6' },
    { label: 'Conversas', value: totals.conversas, color: '#8b5cf6' },
    { label: 'Leads', value: totals.leads, color: '#06b6d4' },
    { label: 'Em Contato', value: totals.emContato, color: '#f59e0b' },
    { label: 'Agendou', value: totals.agendou, color: '#10b981' },
    { label: 'Fechou', value: totals.won, color: '#22c55e' },
  ];

  const maxValue = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="space-y-4">
      {/* Funnel visualization */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4 md:p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Funil de Conversao</h3>

        <div className="space-y-2">
          {steps.map((step, i) => {
            const widthPct = Math.max((step.value / maxValue) * 100, 4);
            const prevValue = i > 0 ? steps[i - 1].value : 0;
            const convRate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null;

            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-24 text-xs text-text-muted text-right shrink-0">{step.label}</div>
                <div className="flex-1 relative">
                  <div
                    className="h-8 rounded-md flex items-center px-3 transition-all"
                    style={{ width: `${widthPct}%`, backgroundColor: step.color, minWidth: '60px' }}
                  >
                    <span className="text-xs font-medium text-white">{formatNumber(step.value)}</span>
                  </div>
                </div>
                <div className="w-16 text-xs text-text-muted shrink-0">
                  {convRate && <span>{convRate}%</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-border-default">
          <div>
            <p className="text-xs text-text-muted">Gasto Total</p>
            <p className="text-lg font-semibold text-text-primary">{formatCurrency(totals.totalSpend)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Receita (Won)</p>
            <p className="text-lg font-semibold text-accent-success">{formatCurrency(totals.wonValue)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">ROAS</p>
            <p className="text-lg font-semibold text-text-primary">
              {totals.totalSpend > 0 && totals.wonValue > 0
                ? (totals.wonValue / totals.totalSpend).toFixed(2) + 'x'
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">CPL Qualificado</p>
            <p className="text-lg font-semibold text-text-primary">
              {totals.agendou + totals.won > 0 && totals.totalSpend > 0
                ? formatCurrency(totals.totalSpend / (totals.agendou + totals.won))
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Attribution breakdown table */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h3 className="text-sm font-semibold text-text-primary">Detalhamento por Anuncio/Campanha</h3>
          <p className="text-xs text-text-muted mt-0.5">Atribuicao em 3 niveis: exato, inferido por UTM, nao atribuido</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Anuncio/Campanha</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Atribuicao</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Leads</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Agendou</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Won</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Receita</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">Gasto</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">CPL</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-text-muted">ROAS</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-text-muted w-8"></th>
              </tr>
            </thead>
            <tbody>
              {funnelData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-text-muted text-sm">
                    Sem dados de funil disponiveis
                  </td>
                </tr>
              ) : (
                funnelData
                  .sort((a, b) => (b.total_leads || 0) - (a.total_leads || 0))
                  .map((row, i) => {
                    const hasAnomaly = row.ad_id ? anomalyMap.has(row.ad_id) : false;
                    const anomaly = row.ad_id ? anomalyMap.get(row.ad_id) : undefined;
                    const roas = row.total_spend > 0 && row.won_value > 0
                      ? (row.won_value / row.total_spend).toFixed(2) + 'x'
                      : '-';

                    const levelBadge: Record<string, { label: string; cls: string }> = {
                      exact: { label: 'Exato', cls: 'bg-green-500/10 text-green-400' },
                      utm_campaign_inferred: { label: 'UTM', cls: 'bg-yellow-500/10 text-yellow-400' },
                      unattributed: { label: 'N/A', cls: 'bg-red-500/10 text-red-400' },
                    };
                    const badge = levelBadge[row.attribution_level] || levelBadge.unattributed;

                    const displayName = row.ad_name || row.campaign_name || 'Nao atribuido';

                    return (
                      <tr key={`${row.attribution_level}-${row.attribution_key || 'unattr'}-${i}`} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                        <td className="px-3 py-2 text-sm text-text-primary max-w-[220px] truncate" title={displayName}>
                          {displayName}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-text-secondary text-right">{formatNumber(row.total_leads)}</td>
                        <td className="px-3 py-2 text-sm text-text-secondary text-right">{formatNumber(row.agendou)}</td>
                        <td className="px-3 py-2 text-sm text-accent-success text-right font-medium">{formatNumber(row.won)}</td>
                        <td className="px-3 py-2 text-sm text-accent-success text-right">{formatCurrency(row.won_value)}</td>
                        <td className="px-3 py-2 text-sm text-text-secondary text-right">{formatCurrency(row.total_spend)}</td>
                        <td className="px-3 py-2 text-sm text-text-secondary text-right">{row.cpl != null ? formatCurrency(row.cpl) : '-'}</td>
                        <td className="px-3 py-2 text-sm text-text-secondary text-right">{roas}</td>
                        <td className="px-3 py-2 text-center">
                          {hasAnomaly && (() => {
                            const parts = [
                              anomaly?.cpl_delta_pct != null && `CPL: ${anomaly.cpl_delta_pct.toFixed(0)}%`,
                              anomaly?.ctr_delta_pct != null && `CTR: ${anomaly.ctr_delta_pct.toFixed(0)}%`,
                            ].filter(Boolean).join(' | ') || 'Anomalia detectada';
                            return (
                              <span title={parts}>
                                <AlertTriangle size={14} className="text-amber-400" />
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
        {funnelData.length > 0 && (
          <div className="px-3 py-2 border-t border-border-default text-xs text-text-muted flex items-center justify-between">
            <span>{funnelData.length} linhas</span>
            {anomalies.filter(a => a.is_anomaly).length > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle size={12} />
                {anomalies.filter(a => a.is_anomaly).length} anomalias detectadas
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
