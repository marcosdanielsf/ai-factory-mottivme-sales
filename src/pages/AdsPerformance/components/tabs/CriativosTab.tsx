import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../helpers';
import type { FbAdPerformance, AdsWithLeads } from '../../types';

interface CriativosTabProps {
  criativos: FbAdPerformance[];
  adsWithLeads: AdsWithLeads[];
  loading: boolean;
}

type SortKey = 'spend' | 'impressions' | 'clicks' | 'conversas_iniciadas' | 'cpc' | 'cpm';

const SortIcon = ({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) => {
  if (sortKey !== col) return null;
  return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
};

export const CriativosTab: React.FC<CriativosTabProps> = ({ criativos, adsWithLeads, loading }) => {
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortAsc, setSortAsc] = useState(false);

  const ads = useMemo(() => {
    // Agregar por ad_id (deduplica datas)
    const adMap = new Map<string, {
      ad_id: string;
      ad_name: string;
      campaign_name: string;
      status: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversas_iniciadas: number;
    }>();

    for (const ad of criativos) {
      const key = ad.ad_id;
      const existing = adMap.get(key);
      if (existing) {
        existing.spend += ad.spend || 0;
        existing.impressions += ad.impressions || 0;
        existing.clicks += ad.clicks || 0;
        existing.conversas_iniciadas += ad.conversas_iniciadas || 0;
      } else {
        adMap.set(key, {
          ad_id: ad.ad_id,
          ad_name: ad.ad_name || 'Sem nome',
          campaign_name: ad.campaign_name || 'Sem campanha',
          status: ad.status || '-',
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          conversas_iniciadas: ad.conversas_iniciadas || 0,
        });
      }
    }

    // Build leads lookup by ad_id
    const leadsLookup = new Map<string, { leads_gerados: number; leads_agendaram: number }>();
    for (const awl of adsWithLeads) {
      const key = awl.ad_id;
      const existing = leadsLookup.get(key);
      if (existing) {
        existing.leads_gerados += awl.leads_gerados || 0;
        existing.leads_agendaram += awl.leads_agendaram || 0;
      } else {
        leadsLookup.set(key, {
          leads_gerados: awl.leads_gerados || 0,
          leads_agendaram: awl.leads_agendaram || 0,
        });
      }
    }

    // Compute derived metrics and sort
    const result = Array.from(adMap.values()).map(ad => {
      const leadsEntry = leadsLookup.get(ad.ad_id);
      const leadsGerados = leadsEntry?.leads_gerados || 0;
      const leadsAgendaram = leadsEntry?.leads_agendaram || 0;
      return {
        ...ad,
        cpc: ad.clicks > 0 ? ad.spend / ad.clicks : 0,
        cpm: ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
        custoPorConversa: ad.conversas_iniciadas > 0 ? ad.spend / ad.conversas_iniciadas : 0,
        leads_gerados: leadsGerados,
        leads_agendaram: leadsAgendaram,
        custoPorLead: leadsGerados > 0 ? ad.spend / leadsGerados : 0,
      };
    });

    result.sort((a, b) => {
      const aVal = a[sortKey] || 0;
      const bVal = b[sortKey] || 0;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [criativos, adsWithLeads, sortKey, sortAsc]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const thClass = "px-3 py-2 text-left text-xs font-medium text-text-muted cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap";

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Ad</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Campanha</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">Status</th>
              <th className={thClass} onClick={() => handleSort('impressions')}>
                <span className="flex items-center gap-1">Impressoes <SortIcon col="impressions" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('clicks')}>
                <span className="flex items-center gap-1">Cliques <SortIcon col="clicks" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('spend')}>
                <span className="flex items-center gap-1">Gasto <SortIcon col="spend" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('cpc')}>
                <span className="flex items-center gap-1">CPC <SortIcon col="cpc" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('cpm')}>
                <span className="flex items-center gap-1">CPM <SortIcon col="cpm" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className={thClass} onClick={() => handleSort('conversas_iniciadas')}>
                <span className="flex items-center gap-1">Conversas <SortIcon col="conversas_iniciadas" sortKey={sortKey} sortAsc={sortAsc} /></span>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted whitespace-nowrap">$/Conversa</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted whitespace-nowrap">Leads</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted whitespace-nowrap">Agendaram</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-text-muted whitespace-nowrap">$/Lead</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-3 py-8 text-center text-text-muted text-sm">
                  Sem dados de criativos para o periodo selecionado
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad.ad_id} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                  <td className="px-3 py-2 text-sm text-text-primary max-w-[200px] truncate" title={ad.ad_name}>
                    {ad.ad_name}
                  </td>
                  <td className="px-3 py-2 text-sm text-text-secondary max-w-[150px] truncate" title={ad.campaign_name}>
                    {ad.campaign_name}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      ad.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{formatNumber(ad.impressions)}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{formatNumber(ad.clicks)}</td>
                  <td className="px-3 py-2 text-sm text-text-primary font-medium">{formatCurrency(ad.spend)}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{formatCurrency(ad.cpc)}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{formatCurrency(ad.cpm)}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{formatNumber(ad.conversas_iniciadas)}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{formatCurrency(ad.custoPorConversa)}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{ad.leads_gerados || '-'}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">{ad.leads_agendaram || '-'}</td>
                  <td className="px-3 py-2 text-sm text-text-secondary">
                    {ad.custoPorLead > 0 ? formatCurrency(ad.custoPorLead) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {ads.length > 0 && (
        <div className="px-3 py-2 border-t border-border-default text-xs text-text-muted">
          {ads.length} criativos
        </div>
      )}
    </div>
  );
};
