import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_LEAD_SCORE_ROWS, MOCK_CRIATIVOS_ARC, MOCK_FUNNEL_ADS } from '../pages/MetricsLab/mockData';
import type { LeadScoreRow, CriativoARC, FunnelAd, FunnelStep, FunnelTracking } from '../pages/MetricsLab/types';

// ─── Raw DB shapes ──────────────────────────────────────────────────────────

interface RawLeadScoreRow {
  ad_id: string;
  ad_name: string | null;
  adset_name: string | null;
  campaign_name: string | null;
  account_name: string | null;
  gasto: number;
  leads: number;
  cpl: number;
  resp_pct: number;
  score: number;
  potencial: string;
  total_conversoes: number;
  avg_ctr_link: number | null;
  avg_hook_rate: number | null;
  avg_hold_rate: number | null;
  avg_body_rate: number | null;
}

interface RawAdRow {
  ad_id: string;
  ad_name: string | null;
  adset_name: string | null;
  campaign_name: string | null;
  account_name: string | null;
  data_relatorio: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number | null;
  ctr_link: number | null;
  hook_rate: number | null;
  hold_rate: number | null;
  body_rate: number | null;
  video_views_3s: number | null;
  video_p75: number | null;
  outbound_clicks: number | null;
  conversas_iniciadas: number;
  custo_por_conversa: number | null;
  conversions: number | null;
  conversion_value: number | null;
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

function mapLeadScoreRow(row: RawLeadScoreRow): LeadScoreRow {
  return {
    ad_id: row.ad_id,
    ad_name: row.ad_name ?? 'Sem nome',
    adset_name: row.adset_name ?? 'N/A',
    campaign_name: row.campaign_name ?? 'N/A',
    gasto: Number(row.gasto) || 0,
    leads: Number(row.leads) || 0,
    cpl: Number(row.cpl) || 0,
    resp_pct: Number(row.resp_pct) || 0,
    score: Number(row.score) || 0,
    potencial: (row.potencial as LeadScoreRow['potencial']) ?? 'desqualificado',
    top_drivers: [],
    top_detractors: [],
  };
}

function mapCriativoARC(
  adId: string,
  adName: string | null,
  campaignName: string | null,
  sumSpend: number,
  sumConversions: number,
  sumConversionValue: number,
  avgHookRate: number,
  avgHoldRate: number,
  avgBodyRate: number,
  avgCtrLink: number,
): CriativoARC {
  const roas = sumSpend > 0 ? sumConversionValue / sumSpend : 0;
  return {
    ad_id: adId,
    ad_name: adName ?? 'Sem nome',
    campaign_name: campaignName ?? 'N/A',
    preview_url: null,
    ad_url: null,
    hook_rate: Number(avgHookRate.toFixed(2)),
    hold_rate: Number(avgHoldRate.toFixed(2)),
    body_rate: Number(avgBodyRate.toFixed(2)),
    ctr: Number(avgCtrLink.toFixed(4)),
    roas: Number(roas.toFixed(2)),
    gasto: Number(sumSpend.toFixed(2)),
    vendas: sumConversions,
    benchmark_atencao: avgHookRate > 30,
    benchmark_retencao: avgHoldRate > 2.5,
    benchmark_conversao: avgBodyRate > 2.5,
  };
}

// ─── Aggregation for Criativos ARC ──────────────────────────────────────────

function buildCriativosARC(rows: RawAdRow[]): CriativoARC[] {
  const map = new Map<string, {
    ad_name: string | null;
    campaign_name: string | null;
    sumSpend: number;
    sumConversions: number;
    sumConversionValue: number;
    hookRateSum: number;
    holdRateSum: number;
    bodyRateSum: number;
    ctrLinkSum: number;
    count: number;
  }>();

  for (const row of rows) {
    const existing = map.get(row.ad_id);
    if (existing) {
      existing.sumSpend += Number(row.spend) || 0;
      existing.sumConversions += Number(row.conversions) || 0;
      existing.sumConversionValue += Number(row.conversion_value) || 0;
      existing.hookRateSum += Number(row.hook_rate) || 0;
      existing.holdRateSum += Number(row.hold_rate) || 0;
      existing.bodyRateSum += Number(row.body_rate) || 0;
      existing.ctrLinkSum += Number(row.ctr_link) || 0;
      existing.count += 1;
    } else {
      map.set(row.ad_id, {
        ad_name: row.ad_name,
        campaign_name: row.campaign_name,
        sumSpend: Number(row.spend) || 0,
        sumConversions: Number(row.conversions) || 0,
        sumConversionValue: Number(row.conversion_value) || 0,
        hookRateSum: Number(row.hook_rate) || 0,
        holdRateSum: Number(row.hold_rate) || 0,
        bodyRateSum: Number(row.body_rate) || 0,
        ctrLinkSum: Number(row.ctr_link) || 0,
        count: 1,
      });
    }
  }

  return Array.from(map.entries())
    .map(([adId, m]) =>
      mapCriativoARC(
        adId,
        m.ad_name,
        m.campaign_name,
        m.sumSpend,
        m.sumConversions,
        m.sumConversionValue,
        m.count > 0 ? m.hookRateSum / m.count : 0,
        m.count > 0 ? m.holdRateSum / m.count : 0,
        m.count > 0 ? m.bodyRateSum / m.count : 0,
        m.count > 0 ? m.ctrLinkSum / m.count : 0,
      ),
    )
    .sort((a, b) => b.gasto - a.gasto);
}

// ─── Raw Funnel Tracking shape ──────────────────────────────────────────────

interface RawFunnelTracking {
  ad_id: string;
  total_leads: number;
  novo: number;
  em_contato: number;
  agendou: number;
  no_show: number;
  perdido: number;
  won: number;
  won_value: number;
}

// ─── Aggregation for Funil por Anuncio ──────────────────────────────────────

function buildFunnelAds(rows: RawAdRow[], trackingMap?: Map<string, RawFunnelTracking>): FunnelAd[] {
  // Group rows by ad_id, keeping rows sorted by data_relatorio asc for trend
  const map = new Map<string, {
    ad_name: string | null;
    campaign_name: string | null;
    rows: RawAdRow[];
  }>();

  for (const row of rows) {
    const existing = map.get(row.ad_id);
    if (existing) {
      existing.rows.push(row);
    } else {
      map.set(row.ad_id, {
        ad_name: row.ad_name,
        campaign_name: row.campaign_name,
        rows: [row],
      });
    }
  }

  return Array.from(map.entries()).map(([adId, m]) => {
    // Sort rows ascending for sparkline trends
    const sorted = [...m.rows].sort(
      (a, b) => a.data_relatorio.localeCompare(b.data_relatorio),
    );
    // Take last 7 days for trend
    const trendRows = sorted.slice(-7);

    // Aggregate totals
    let sumImpressions = 0;
    let sumClicks = 0;
    let sumSpend = 0;
    let sumReach = 0;
    let sumVideo3s = 0;
    let sumVideoP75 = 0;
    let sumOutbound = 0;
    let sumConversas = 0;
    let sumConversions = 0;
    let ctrLinkSum = 0;
    let hookRateSum = 0;
    let holdRateSum = 0;
    let bodyRateSum = 0;
    let rateCount = 0;

    for (const r of m.rows) {
      sumImpressions += Number(r.impressions) || 0;
      sumClicks += Number(r.clicks) || 0;
      sumSpend += Number(r.spend) || 0;
      sumReach += Number(r.reach) || 0;
      sumVideo3s += Number(r.video_views_3s) || 0;
      sumVideoP75 += Number(r.video_p75) || 0;
      sumOutbound += Number(r.outbound_clicks) || 0;
      sumConversas += Number(r.conversas_iniciadas) || 0;
      sumConversions += Number(r.conversions) || 0;
      ctrLinkSum += Number(r.ctr_link) || 0;
      hookRateSum += Number(r.hook_rate) || 0;
      holdRateSum += Number(r.hold_rate) || 0;
      bodyRateSum += Number(r.body_rate) || 0;
      rateCount += 1;
    }

    const avgCtrLink = rateCount > 0 ? ctrLinkSum / rateCount : 0;
    const avgHookRate = rateCount > 0 ? hookRateSum / rateCount : 0;
    const avgHoldRate = rateCount > 0 ? holdRateSum / rateCount : 0;
    const avgBodyRate = rateCount > 0 ? bodyRateSum / rateCount : 0;
    const cpm = sumImpressions > 0 ? (sumSpend / sumImpressions) * 1000 : 0;
    const cpc = sumClicks > 0 ? sumSpend / sumClicks : 0;
    const cpa = sumConversions > 0 ? sumSpend / sumConversions : 0;

    // Build trend arrays (7 days) — only for steps that show in funnel
    const trendImpressoes = trendRows.map((r) => Number(r.impressions) || 0);
    const trendCliques = trendRows.map((r) => Number(r.clicks) || 0);
    const trendVideo3s = trendRows.map((r) => Number(r.video_views_3s) || 0);
    const trendVideoP75 = trendRows.map((r) => Number(r.video_p75) || 0);
    const trendConversas = trendRows.map((r) => Number(r.conversas_iniciadas) || 0);
    const trendConversions = trendRows.map((r) => Number(r.conversions) || 0);

    // Build all candidate steps, then filter out zeros
    const allFbSteps: FunnelStep[] = [
      {
        key: 'impressoes',
        label: 'Impressoes',
        value: sumImpressions,
        cost_metric: cpm > 0 ? Number(cpm.toFixed(2)) : null,
        cost_label: cpm > 0 ? 'CPM' : null,
        conversion_rate: null,
        trend: trendImpressoes,
      },
      {
        key: 'cliques',
        label: 'Cliques',
        value: sumClicks,
        cost_metric: cpc > 0 ? Number(cpc.toFixed(2)) : null,
        cost_label: cpc > 0 ? 'CPC' : null,
        conversion_rate: sumImpressions > 0
          ? Number(((sumClicks / sumImpressions) * 100).toFixed(2))
          : null,
        trend: trendCliques,
      },
      {
        key: 'video_3s',
        label: 'Views 3s',
        value: sumVideo3s,
        cost_metric: null,
        cost_label: null,
        conversion_rate: avgHookRate > 0 ? Number(avgHookRate.toFixed(1)) : null,
        trend: trendVideo3s,
      },
      {
        key: 'video_p75',
        label: 'Assistiu 75%',
        value: sumVideoP75,
        cost_metric: null,
        cost_label: null,
        conversion_rate: avgHoldRate > 0 ? Number(avgHoldRate.toFixed(1)) : null,
        trend: trendVideoP75,
      },
      {
        key: 'conversas',
        label: 'Conversas',
        value: sumConversas,
        cost_metric: sumConversas > 0 ? Number((sumSpend / sumConversas).toFixed(2)) : null,
        cost_label: sumConversas > 0 ? 'CPConv' : null,
        conversion_rate:
          sumClicks > 0
            ? Number(((sumConversas / sumClicks) * 100).toFixed(1))
            : null,
        trend: trendConversas,
      },
      {
        key: 'conversoes',
        label: 'Vendas FB',
        value: sumConversions,
        cost_metric: cpa > 0 ? Number(cpa.toFixed(2)) : null,
        cost_label: cpa > 0 ? 'CPA' : null,
        conversion_rate:
          sumConversas > 0
            ? Number(((sumConversions / sumConversas) * 100).toFixed(1))
            : null,
        trend: trendConversions,
      },
    ];

    // Filter: keep Impressoes always, hide zero-value steps
    const steps: FunnelStep[] = allFbSteps.filter(
      s => s.key === 'impressoes' || s.value > 0,
    );

    // ─── GHL Tracking Steps (from vw_funnel_tracking_by_ad) ───────────
    const tracking = trackingMap?.get(adId);
    if (tracking && tracking.total_leads > 0) {
      const t = tracking;
      const cpLead = t.total_leads > 0 ? sumSpend / t.total_leads : 0;
      const cpAgendamento = t.agendou > 0 ? sumSpend / t.agendou : 0;

      const compareceu = Math.max(t.agendou - t.no_show, 0);

      steps.push(
        {
          key: 'ghl_separator',
          label: '── GHL ──',
          value: 0,
          cost_metric: null,
          cost_label: null,
          conversion_rate: null,
          trend: [],
        },
        {
          key: 'ghl_leads',
          label: 'Leads',
          value: t.total_leads,
          cost_metric: cpLead > 0 ? Number(cpLead.toFixed(2)) : null,
          cost_label: cpLead > 0 ? 'CPL' : null,
          conversion_rate: null, // cross-source, no meaningful %
          trend: [],
        },
        {
          key: 'ghl_em_contato',
          label: 'Respondeu',
          value: t.em_contato,
          cost_metric: null,
          cost_label: null,
          conversion_rate: t.total_leads > 0
            ? Number(((t.em_contato / t.total_leads) * 100).toFixed(1))
            : null,
          trend: [],
        },
        {
          key: 'ghl_agendou',
          label: 'Agendou',
          value: t.agendou,
          cost_metric: cpAgendamento > 0 ? Number(cpAgendamento.toFixed(2)) : null,
          cost_label: cpAgendamento > 0 ? 'CPA' : null,
          conversion_rate: t.em_contato > 0
            ? Number(((t.agendou / t.em_contato) * 100).toFixed(1))
            : null,
          trend: [],
        },
        {
          key: 'ghl_compareceu',
          label: 'Compareceu',
          value: compareceu,
          cost_metric: null,
          cost_label: null,
          conversion_rate: t.agendou > 0
            ? Number(((compareceu / t.agendou) * 100).toFixed(1))
            : null,
          trend: [],
        },
        {
          key: 'ghl_won',
          label: 'Fechou',
          value: t.won,
          cost_metric: t.won > 0 ? Number((sumSpend / t.won).toFixed(2)) : null,
          cost_label: t.won > 0 ? 'CAC' : null,
          conversion_rate: compareceu > 0
            ? Number(((t.won / compareceu) * 100).toFixed(1))
            : null,
          trend: [],
        },
      );
    }

    return {
      ad_id: adId,
      ad_name: m.ad_name ?? 'Sem nome',
      campaign_name: m.campaign_name ?? 'N/A',
      steps,
      won_value: tracking?.won_value ?? 0,
    };
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseMetricsLabReturn {
  leadScoreRows: LeadScoreRow[];
  criativosARC: CriativoARC[];
  funnelAds: FunnelAd[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  accounts: string[];
  unattributedCount: number;
}

export const useMetricsLab = (
  accountName?: string | null,
  dateRange?: { startDate: Date | null; endDate: Date | null },
): UseMetricsLabReturn => {
  const [rawLeadScore, setRawLeadScore] = useState<RawLeadScoreRow[]>([]);
  const [rawAds, setRawAds] = useState<RawAdRow[]>([]);
  const [rawTracking, setRawTracking] = useState<RawFunnelTracking[]>([]);
  const [unattributedCount, setUnattributedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn('[MetricsLab] Supabase nao configurado — usando mock data');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Q1: Lead Score view
      let leadQuery = supabase
        .from('vw_metrics_lab_lead_score')
        .select('*')
        .order('score', { ascending: false })
        .limit(500);

      if (accountName) {
        leadQuery = leadQuery.eq('account_name', accountName);
      }

      // Helper para formatar data como YYYY-MM-DD
      const formatDateISO = (d: Date): string => d.toISOString().split('T')[0];

      // Q2: fb_ads_performance with video columns (criativos + funil)
      let adsQuery = supabase
        .from('fb_ads_performance')
        .select(
          'ad_id, ad_name, adset_name, campaign_name, account_name, data_relatorio, ' +
          'impressions, clicks, spend, reach, ctr_link, hook_rate, hold_rate, body_rate, ' +
          'video_views_3s, video_p75, outbound_clicks, conversas_iniciadas, ' +
          'custo_por_conversa, conversions, conversion_value',
        )
        .order('data_relatorio', { ascending: true });

      if (accountName) {
        adsQuery = adsQuery.eq('account_name', accountName);
      }

      if (dateRange?.startDate) {
        adsQuery = adsQuery.gte('data_relatorio', formatDateISO(dateRange.startDate));
      }
      if (dateRange?.endDate) {
        adsQuery = adsQuery.lte('data_relatorio', formatDateISO(dateRange.endDate));
      }

      adsQuery = adsQuery.limit(5000);

      // Q3: Funnel tracking from GHL (vw_funnel_tracking_by_ad)
      const trackingQuery = supabase
        .from('vw_funnel_tracking_by_ad')
        .select('*');

      // Q4: Count unattributed leads (sem ad_id)
      const unattributedQuery = supabase
        .from('n8n_schedule_tracking')
        .select('*', { count: 'exact', head: true })
        .or('ad_id.is.null,ad_id.eq.NULL,ad_id.eq.null,ad_id.eq.undefined,ad_id.eq.');

      const [leadResult, adsResult, trackingResult, unattributedResult] = await Promise.all([
        leadQuery, adsQuery, trackingQuery, unattributedQuery,
      ]);

      const queryErrors = [leadResult.error, adsResult.error, trackingResult.error]
        .filter(Boolean)
        .map(e => e!.message);
      if (queryErrors.length > 0) {
        console.warn('[MetricsLab] Query errors:', queryErrors);
        setError(queryErrors.join(' | '));
      }

      setRawLeadScore(((leadResult.data ?? []) as unknown) as RawLeadScoreRow[]);
      setRawAds(((adsResult.data ?? []) as unknown) as RawAdRow[]);
      setRawTracking(((trackingResult.data ?? []) as unknown) as RawFunnelTracking[]);
      setUnattributedCount(unattributedResult.count ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar Metrics Lab';
      setError(message);
      console.error('[MetricsLab Error]', err);
    } finally {
      setLoading(false);
    }
  }, [accountName, dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const computed = useMemo(() => {
    // Unique account names from lead score view (no filter applied to get all)
    const accountSet = new Set<string>();
    for (const r of rawLeadScore) {
      if (r.account_name) accountSet.add(r.account_name);
    }
    for (const r of rawAds) {
      if (r.account_name) accountSet.add(r.account_name);
    }
    const accounts = Array.from(accountSet).sort();

    // Lead Score rows — fall back to mock if empty
    const leadScoreRows: LeadScoreRow[] =
      rawLeadScore.length > 0
        ? rawLeadScore.map(mapLeadScoreRow)
        : MOCK_LEAD_SCORE_ROWS;

    // Criativos ARC — fall back to mock if empty
    const criativosARC: CriativoARC[] =
      rawAds.length > 0
        ? buildCriativosARC(rawAds)
        : MOCK_CRIATIVOS_ARC;

    // Build tracking map (ad_id → GHL funnel data)
    const trackingMap = new Map<string, RawFunnelTracking>();
    for (const t of rawTracking) {
      trackingMap.set(t.ad_id, t);
    }

    // Funil por Anuncio — fall back to mock if empty
    const funnelAds: FunnelAd[] =
      rawAds.length > 0
        ? buildFunnelAds(rawAds, trackingMap)
        : MOCK_FUNNEL_ADS;

    return { leadScoreRows, criativosARC, funnelAds, accounts };
  }, [rawLeadScore, rawAds, rawTracking]);

  return {
    leadScoreRows: computed.leadScoreRows,
    criativosARC: computed.criativosARC,
    funnelAds: computed.funnelAds,
    accounts: computed.accounts,
    loading,
    error,
    refetch: fetchData,
    unattributedCount,
  };
};
