import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CampanhaMetrics } from '../../types';

interface CampanhasTabProps {
  campanhas: CampanhaMetrics[];
  loading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

export const CampanhasTab: React.FC<CampanhasTabProps> = ({ campanhas, loading }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (loading) {
    return <div className="p-8 text-text-muted">Carregando campanhas...</div>;
  }

  const toggleExpand = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted w-8"></th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Campanha</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Gasto</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Impressoes</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Cliques</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">CTR</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">CPC</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">CPM</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Conversas</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">$/Conversa</th>
            </tr>
          </thead>
          <tbody>
            {campanhas.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-text-muted text-sm">
                  Sem dados de campanhas para o periodo selecionado
                </td>
              </tr>
            ) : (
              campanhas.map((campanha) => {
                const isExpanded = expanded.has(campanha.campaign_name);
                const hasAds = campanha.ads.length > 1;

                return (
                  <React.Fragment key={campanha.campaign_name}>
                    {/* Campanha row */}
                    <tr
                      className={`border-b border-border-default hover:bg-bg-hover transition-colors ${hasAds ? 'cursor-pointer' : ''}`}
                      onClick={() => hasAds && toggleExpand(campanha.campaign_name)}
                    >
                      <td className="px-3 py-2 text-center">
                        {hasAds && (
                          isExpanded
                            ? <ChevronDown size={14} className="text-text-muted" />
                            : <ChevronRight size={14} className="text-text-muted" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-text-primary font-medium max-w-[250px] truncate" title={campanha.campaign_name}>
                        {campanha.campaign_name}
                        {hasAds && (
                          <span className="ml-2 text-xs text-text-muted">({campanha.ads.length} ads)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-text-primary font-medium">{formatCurrency(campanha.totalSpend)}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatNumber(campanha.totalImpressions)}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatNumber(campanha.totalClicks)}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{campanha.ctr.toFixed(2)}%</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatCurrency(campanha.avgCpc)}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatCurrency(campanha.avgCpm)}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatNumber(campanha.totalConversas)}</td>
                      <td className="px-3 py-2 text-sm text-text-secondary">{formatCurrency(campanha.custoPorConversa)}</td>
                    </tr>

                    {/* Expanded ads rows */}
                    {isExpanded && campanha.ads.map((ad) => (
                      <tr key={`${ad.ad_id}-${ad.data_relatorio}`} className="border-b border-border-default bg-bg-primary/50">
                        <td className="px-3 py-1.5"></td>
                        <td className="px-3 py-1.5 text-xs text-text-muted pl-8 max-w-[250px] truncate" title={ad.ad_name || ''}>
                          {ad.ad_name || 'Sem nome'}
                          <span className="ml-2 text-text-muted/60">{ad.data_relatorio}</span>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{formatCurrency(ad.spend || 0)}</td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{formatNumber(ad.impressions || 0)}</td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{formatNumber(ad.clicks || 0)}</td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">
                          {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'}%
                        </td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{formatCurrency(ad.cpc || 0)}</td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{formatCurrency(ad.cpm || 0)}</td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">{formatNumber(ad.conversas_iniciadas || 0)}</td>
                        <td className="px-3 py-1.5 text-xs text-text-muted">
                          {ad.conversas_iniciadas > 0 ? formatCurrency((ad.spend || 0) / ad.conversas_iniciadas) : '-'}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {campanhas.length > 0 && (
        <div className="px-3 py-2 border-t border-border-default text-xs text-text-muted">
          {campanhas.length} campanhas
        </div>
      )}
    </div>
  );
};
