import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { DateRange } from '../components/DateRangePicker';
import type {
  FbAdPerformance,
  AdsWithLeads,
  AdsSummaryByDate,
  AdsOverview,
  CampanhaMetrics,
} from '../pages/AdsPerformance/types';

interface UseAdsPerformanceReturn {
  overview: AdsOverview;
  campanhas: CampanhaMetrics[];
  criativos: FbAdPerformance[];
  porDia: AdsSummaryByDate[];
  adsWithLeads: AdsWithLeads[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_OVERVIEW: AdsOverview = {
  totalSpend: 0,
  totalImpressions: 0,
  totalClicks: 0,
  totalConversas: 0,
  avgCpc: 0,
  avgCpm: 0,
  custoPorConversa: 0,
  ctr: 0,
};

function getDefaultStartDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDefaultEndDate(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export const useAdsPerformance = (
  dateRange?: DateRange | null,
  locationId?: string | null,
): UseAdsPerformanceReturn => {
  const [rawAds, setRawAds] = useState<FbAdPerformance[]>([]);
  const [rawAdsWithLeads, setRawAdsWithLeads] = useState<AdsWithLeads[]>([]);
  const [rawSummary, setRawSummary] = useState<AdsSummaryByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase nao configurado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = dateRange?.startDate || getDefaultStartDate();
      const endDate = dateRange?.endDate || getDefaultEndDate();
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Q1: fb_ads_performance raw data
      let adsQuery = supabase
        .from('fb_ads_performance')
        .select('*')
        .gte('data_relatorio', startStr)
        .lte('data_relatorio', endStr)
        .order('data_relatorio', { ascending: false })
        .limit(10000);

      if (locationId) adsQuery = adsQuery.eq('location_id', locationId);

      // Q2: vw_ads_with_leads (join com leads)
      let leadsQuery = supabase
        .from('vw_ads_with_leads')
        .select('*')
        .gte('data_relatorio', startStr)
        .lte('data_relatorio', endStr)
        .limit(10000);

      if (locationId) leadsQuery = leadsQuery.eq('location_id', locationId);

      // Q3: vw_ads_summary_by_date (agregado diario)
      let summaryQuery = supabase
        .from('vw_ads_summary_by_date')
        .select('*')
        .gte('data_relatorio', startStr)
        .lte('data_relatorio', endStr)
        .order('data_relatorio', { ascending: true })
        .limit(1000);

      if (locationId) summaryQuery = summaryQuery.eq('location_id', locationId);

      const [adsResult, leadsResult, summaryResult] = await Promise.all([
        adsQuery,
        leadsQuery,
        summaryQuery,
      ]);

      if (adsResult.error) throw new Error(adsResult.error.message);
      if (leadsResult.error) console.warn('[AdsPerformance] vw_ads_with_leads error:', leadsResult.error.message);
      if (summaryResult.error) console.warn('[AdsPerformance] vw_ads_summary_by_date error:', summaryResult.error.message);

      setRawAds((adsResult.data || []) as FbAdPerformance[]);
      setRawAdsWithLeads((leadsResult.data || []) as AdsWithLeads[]);
      setRawSummary((summaryResult.data || []) as AdsSummaryByDate[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados de ads';
      setError(message);
      console.error('[AdsPerformance Error]', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime(), locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const computed = useMemo(() => {
    // Overview totals
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversas = 0;
    let cpcSum = 0;
    let cpmSum = 0;
    let cpcCount = 0;
    let cpmCount = 0;

    for (const ad of rawAds) {
      totalSpend += ad.spend || 0;
      totalImpressions += ad.impressions || 0;
      totalClicks += ad.clicks || 0;
      totalConversas += ad.conversas_iniciadas || 0;
      if (ad.cpc != null) { cpcSum += ad.cpc; cpcCount++; }
      if (ad.cpm != null) { cpmSum += ad.cpm; cpmCount++; }
    }

    const overview: AdsOverview = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversas,
      avgCpc: cpcCount > 0 ? cpcSum / cpcCount : 0,
      avgCpm: cpmCount > 0 ? cpmSum / cpmCount : 0,
      custoPorConversa: totalConversas > 0 ? totalSpend / totalConversas : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    };

    // Campanhas agrupadas
    const campanhaMap = new Map<string, {
      campaign_id: string | null;
      spend: number;
      impressions: number;
      clicks: number;
      conversas: number;
      ads: FbAdPerformance[];
    }>();

    for (const ad of rawAds) {
      const key = ad.campaign_name || 'Sem Campanha';
      const existing = campanhaMap.get(key);
      if (existing) {
        existing.spend += ad.spend || 0;
        existing.impressions += ad.impressions || 0;
        existing.clicks += ad.clicks || 0;
        existing.conversas += ad.conversas_iniciadas || 0;
        existing.ads.push(ad);
      } else {
        campanhaMap.set(key, {
          campaign_id: ad.campaign_id,
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          conversas: ad.conversas_iniciadas || 0,
          ads: [ad],
        });
      }
    }

    const campanhas: CampanhaMetrics[] = Array.from(campanhaMap.entries())
      .map(([campaign_name, m]) => ({
        campaign_name,
        campaign_id: m.campaign_id,
        totalSpend: m.spend,
        totalImpressions: m.impressions,
        totalClicks: m.clicks,
        totalConversas: m.conversas,
        avgCpc: m.clicks > 0 ? m.spend / m.clicks : 0,
        avgCpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
        custoPorConversa: m.conversas > 0 ? m.spend / m.conversas : 0,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        ads: m.ads,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    return { overview, campanhas };
  }, [rawAds]);

  return {
    overview: computed.overview || EMPTY_OVERVIEW,
    campanhas: computed.campanhas || [],
    criativos: rawAds,
    porDia: rawSummary,
    adsWithLeads: rawAdsWithLeads,
    loading,
    error,
    refetch: fetchData,
  };
};

export default useAdsPerformance;
