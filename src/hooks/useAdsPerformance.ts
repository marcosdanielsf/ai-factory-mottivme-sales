import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { DateRange } from "../components/DateRangePicker";
import { calcDelta } from "../pages/AdsPerformance/helpers";
import { useUnifiedFunnel } from "./useUnifiedFunnel";
import type {
  FbAdPerformance,
  AdsWithLeads,
  AdsSummaryByDate,
  AdsOverview,
  AdsPeriodDeltas,
  CampanhaMetrics,
  AdsetMetrics,
  AdAggregate,
  FunnelData,
  AdsAnomaly,
} from "../pages/AdsPerformance/types";

// ============================================================================
// HOOK: useAdsPerformance v2.0 — Semantic Layer Integration
// Per-ad attribution data from fb_ads_performance + vw_funnel_tracking_enhanced
// + Unified funnel totals from vw_unified_funnel (when locationId provided)
// ============================================================================

export interface UnifiedFunnelTotals {
  totalLeads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
}

interface UseAdsPerformanceReturn {
  overview: AdsOverview;
  periodDeltas: AdsPeriodDeltas;
  campanhas: CampanhaMetrics[];
  adsets: AdsetMetrics[];
  anuncios: AdAggregate[];
  criativos: FbAdPerformance[];
  porDia: AdsSummaryByDate[];
  adsWithLeads: AdsWithLeads[];
  accounts: string[];
  funnelData: FunnelData[];
  anomalies: AdsAnomaly[];
  unifiedTotals: UnifiedFunnelTotals | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_OVERVIEW: AdsOverview = {
  totalSpend: 0,
  totalImpressions: 0,
  totalClicks: 0,
  totalConversas: 0,
  totalReach: 0,
  totalReactions: 0,
  totalFormSubmissions: 0,
  avgCpc: 0,
  avgCpm: 0,
  custoPorConversa: 0,
  custoPorCadastro: 0,
  ctr: 0,
  leadsQualificados: 0,
  custoPorLeadQualificado: 0,
};

const EMPTY_DELTAS: AdsPeriodDeltas = {
  spend: null,
  impressions: null,
  clicks: null,
  conversas: null,
  reactions: null,
  formSubmissions: null,
  custoPorConversa: null,
  custoPorCadastro: null,
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
  accountName?: string | null,
  dateRange?: DateRange | null,
  locationId?: string | null,
): UseAdsPerformanceReturn => {
  // ── Semantic Layer: unified funnel totals (when locationId provided) ──
  const unified = useUnifiedFunnel({
    locationId: locationId ?? null,
    dateFrom: dateRange?.startDate ?? null,
    dateTo: dateRange?.endDate ?? null,
  });
  const [rawAds, setRawAds] = useState<FbAdPerformance[]>([]);
  const [rawAdsWithLeads, setRawAdsWithLeads] = useState<AdsWithLeads[]>([]);
  const [prevAds, setPrevAds] = useState<FbAdPerformance[]>([]);
  const [rawFunnel, setRawFunnel] = useState<FunnelData[]>([]);
  const [rawAnomalies, setRawAnomalies] = useState<AdsAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase nao configurado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = dateRange?.startDate || getDefaultStartDate();
      const endDate = dateRange?.endDate || getDefaultEndDate();
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      // Previous period (same duration, immediately before)
      const periodMs = endDate.getTime() - startDate.getTime();
      const prevEnd = new Date(startDate.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - periodMs);
      const prevStartStr = prevStart.toISOString().split("T")[0];
      const prevEndStr = prevEnd.toISOString().split("T")[0];

      // Q1: fb_ads_performance raw data (current period)
      let adsQuery = supabase
        .from("fb_ads_performance")
        .select("*")
        .gte("data_relatorio", startStr)
        .lte("data_relatorio", endStr)
        .order("data_relatorio", { ascending: false })
        .limit(10000);

      if (accountName) adsQuery = adsQuery.eq("account_name", accountName);

      // Q2: vw_ads_with_leads (join com leads) — sem filtro por account_name (view nao tem)
      const leadsQuery = supabase
        .from("vw_ads_with_leads")
        .select("*")
        .gte("data_relatorio", startStr)
        .lte("data_relatorio", endStr)
        .limit(10000);

      // Q4: fb_ads_performance previous period (para deltas)
      let prevQuery = supabase
        .from("fb_ads_performance")
        .select(
          "spend,impressions,clicks,conversas_iniciadas,reach,post_reactions,form_submissions",
        )
        .gte("data_relatorio", prevStartStr)
        .lte("data_relatorio", prevEndStr)
        .limit(10000);

      if (accountName) prevQuery = prevQuery.eq("account_name", accountName);

      // Q4: vw_funnel_tracking_enhanced (funil completo)
      // View nao tem coluna data — sem filtro temporal (dados agregados)
      const funnelQuery = supabase
        .from("vw_funnel_tracking_enhanced")
        .select("*")
        .limit(500);

      // Q5: vw_ads_anomaly_detection (anomalias — 7d vs 30d, sem filtro externo)
      const anomalyQuery = supabase
        .from("vw_ads_anomaly_detection")
        .select("*")
        .eq("is_anomaly", true)
        .limit(100);

      const [adsResult, leadsResult, prevResult, funnelResult, anomalyResult] =
        await Promise.all([
          adsQuery,
          leadsQuery,
          prevQuery,
          funnelQuery,
          anomalyQuery,
        ]);

      if (adsResult.error) throw new Error(adsResult.error.message);
      if (leadsResult.error)
        console.warn(
          "[AdsPerformance] vw_ads_with_leads error:",
          leadsResult.error.message,
        );
      if (prevResult.error)
        console.warn(
          "[AdsPerformance] prev period error:",
          prevResult.error.message,
        );
      if (funnelResult.error)
        console.warn(
          "[AdsPerformance] vw_funnel_tracking_enhanced error:",
          funnelResult.error.message,
        );
      if (anomalyResult.error)
        console.warn(
          "[AdsPerformance] vw_ads_anomaly_detection error:",
          anomalyResult.error.message,
        );

      setRawAds((adsResult.data || []) as FbAdPerformance[]);
      setRawAdsWithLeads((leadsResult.data || []) as AdsWithLeads[]);
      setPrevAds((prevResult.data || []) as FbAdPerformance[]);
      setRawFunnel((funnelResult.data || []) as FunnelData[]);
      setRawAnomalies((anomalyResult.data || []) as AdsAnomaly[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados de ads";
      setError(message);
      console.error("[AdsPerformance Error]", err);
    } finally {
      setLoading(false);
    }
  }, [
    dateRange?.startDate?.getTime(),
    dateRange?.endDate?.getTime(),
    accountName,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const computed = useMemo(() => {
    // --- Current period overview ---
    let totalSpend = 0,
      totalImpressions = 0,
      totalClicks = 0,
      totalConversas = 0;
    let totalReach = 0,
      totalReactions = 0,
      totalFormSubmissions = 0;

    for (const ad of rawAds) {
      totalSpend += ad.spend || 0;
      totalImpressions += ad.impressions || 0;
      totalClicks += ad.clicks || 0;
      totalConversas += ad.conversas_iniciadas || 0;
      totalReach += ad.reach || 0;
      totalReactions += ad.post_reactions || 0;
      totalFormSubmissions += ad.form_submissions || 0;
    }

    // Leads qualificados: agendou + won (do funnel)
    let leadsQualificados = 0;
    for (const f of rawFunnel) {
      leadsQualificados += (f.agendou || 0) + (f.won || 0);
    }

    const overview: AdsOverview = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversas,
      totalReach,
      totalReactions,
      totalFormSubmissions,
      avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      avgCpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      custoPorConversa: totalConversas > 0 ? totalSpend / totalConversas : 0,
      custoPorCadastro:
        totalFormSubmissions > 0 ? totalSpend / totalFormSubmissions : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      leadsQualificados,
      custoPorLeadQualificado:
        leadsQualificados > 0 && totalSpend > 0
          ? totalSpend / leadsQualificados
          : 0,
    };

    // --- Previous period totals ---
    let prevSpend = 0,
      prevImpressions = 0,
      prevClicks = 0,
      prevConversas = 0;
    let prevReactions = 0,
      prevFormSubmissions = 0;

    for (const ad of prevAds) {
      prevSpend += ad.spend || 0;
      prevImpressions += ad.impressions || 0;
      prevClicks += ad.clicks || 0;
      prevConversas += ad.conversas_iniciadas || 0;
      prevReactions += ad.post_reactions || 0;
      prevFormSubmissions += ad.form_submissions || 0;
    }

    const prevCustoPorConversa =
      prevConversas > 0 ? prevSpend / prevConversas : 0;
    const prevCustoPorCadastro =
      prevFormSubmissions > 0 ? prevSpend / prevFormSubmissions : 0;

    const periodDeltas: AdsPeriodDeltas = {
      spend: calcDelta(totalSpend, prevSpend),
      impressions: calcDelta(totalImpressions, prevImpressions),
      clicks: calcDelta(totalClicks, prevClicks),
      conversas: calcDelta(totalConversas, prevConversas),
      reactions: calcDelta(totalReactions, prevReactions),
      formSubmissions: calcDelta(totalFormSubmissions, prevFormSubmissions),
      custoPorConversa: calcDelta(
        overview.custoPorConversa,
        prevCustoPorConversa,
      ),
      custoPorCadastro: calcDelta(
        overview.custoPorCadastro,
        prevCustoPorCadastro,
      ),
    };

    // --- Campanhas agrupadas (por ID, fallback nome) ---
    const campanhaMap = new Map<
      string,
      {
        campaign_id: string | null;
        campaign_name: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversas: number;
        reach: number;
        reactions: number;
        formSubmissions: number;
        ads: FbAdPerformance[];
      }
    >();

    for (const ad of rawAds) {
      const key = ad.campaign_id || ad.campaign_name || "Sem Campanha";
      const existing = campanhaMap.get(key);
      if (existing) {
        existing.spend += ad.spend || 0;
        existing.impressions += ad.impressions || 0;
        existing.clicks += ad.clicks || 0;
        existing.conversas += ad.conversas_iniciadas || 0;
        existing.reach += ad.reach || 0;
        existing.reactions += ad.post_reactions || 0;
        existing.formSubmissions += ad.form_submissions || 0;
        existing.ads.push(ad);
      } else {
        campanhaMap.set(key, {
          campaign_id: ad.campaign_id,
          campaign_name: ad.campaign_name || "Sem Campanha",
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          conversas: ad.conversas_iniciadas || 0,
          reach: ad.reach || 0,
          reactions: ad.post_reactions || 0,
          formSubmissions: ad.form_submissions || 0,
          ads: [ad],
        });
      }
    }

    const campanhas: CampanhaMetrics[] = Array.from(campanhaMap.entries())
      .map(([_, m]) => ({
        campaign_name: m.campaign_name,
        campaign_id: m.campaign_id,
        totalSpend: m.spend,
        totalImpressions: m.impressions,
        totalClicks: m.clicks,
        totalConversas: m.conversas,
        totalReach: m.reach,
        totalReactions: m.reactions,
        totalFormSubmissions: m.formSubmissions,
        avgCpc: m.clicks > 0 ? m.spend / m.clicks : 0,
        avgCpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
        custoPorConversa: m.conversas > 0 ? m.spend / m.conversas : 0,
        custoPorCadastro:
          m.formSubmissions > 0 ? m.spend / m.formSubmissions : 0,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        ads: m.ads,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    // --- Adsets agrupados (por ID, fallback nome) ---
    const adsetMap = new Map<
      string,
      {
        adset_id: string | null;
        adset_name: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversas: number;
        reach: number;
        reactions: number;
        formSubmissions: number;
      }
    >();

    for (const ad of rawAds) {
      const key = ad.adset_id || ad.adset_name || "Sem Conjunto";
      const existing = adsetMap.get(key);
      if (existing) {
        existing.spend += ad.spend || 0;
        existing.impressions += ad.impressions || 0;
        existing.clicks += ad.clicks || 0;
        existing.conversas += ad.conversas_iniciadas || 0;
        existing.reach += ad.reach || 0;
        existing.reactions += ad.post_reactions || 0;
        existing.formSubmissions += ad.form_submissions || 0;
      } else {
        adsetMap.set(key, {
          adset_id: ad.adset_id,
          adset_name: ad.adset_name || "Sem Conjunto",
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          conversas: ad.conversas_iniciadas || 0,
          reach: ad.reach || 0,
          reactions: ad.post_reactions || 0,
          formSubmissions: ad.form_submissions || 0,
        });
      }
    }

    const adsets: AdsetMetrics[] = Array.from(adsetMap.entries())
      .map(([_, m]) => ({
        adset_name: m.adset_name,
        adset_id: m.adset_id,
        totalSpend: m.spend,
        totalImpressions: m.impressions,
        totalClicks: m.clicks,
        totalConversas: m.conversas,
        totalReach: m.reach,
        totalReactions: m.reactions,
        totalFormSubmissions: m.formSubmissions,
        avgCpc: m.clicks > 0 ? m.spend / m.clicks : 0,
        avgCpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
        custoPorConversa: m.conversas > 0 ? m.spend / m.conversas : 0,
        custoPorCadastro:
          m.formSubmissions > 0 ? m.spend / m.formSubmissions : 0,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    // --- Anuncios agregados (deduplica datas) ---
    const adMap = new Map<
      string,
      {
        ad_name: string;
        campaign_name: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversas: number;
        reach: number;
        reactions: number;
        formSubmissions: number;
      }
    >();

    for (const ad of rawAds) {
      const key = ad.ad_id;
      const existing = adMap.get(key);
      if (existing) {
        existing.spend += ad.spend || 0;
        existing.impressions += ad.impressions || 0;
        existing.clicks += ad.clicks || 0;
        existing.conversas += ad.conversas_iniciadas || 0;
        existing.reach += ad.reach || 0;
        existing.reactions += ad.post_reactions || 0;
        existing.formSubmissions += ad.form_submissions || 0;
      } else {
        adMap.set(key, {
          ad_name: ad.ad_name || "Sem nome",
          campaign_name: ad.campaign_name || "Sem campanha",
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          conversas: ad.conversas_iniciadas || 0,
          reach: ad.reach || 0,
          reactions: ad.post_reactions || 0,
          formSubmissions: ad.form_submissions || 0,
        });
      }
    }

    const anuncios: AdAggregate[] = Array.from(adMap.entries())
      .map(([ad_id, m]) => ({
        ad_id,
        ad_name: m.ad_name,
        campaign_name: m.campaign_name,
        totalSpend: m.spend,
        totalImpressions: m.impressions,
        totalClicks: m.clicks,
        totalConversas: m.conversas,
        totalReach: m.reach,
        totalReactions: m.reactions,
        totalFormSubmissions: m.formSubmissions,
        avgCpc: m.clicks > 0 ? m.spend / m.clicks : 0,
        avgCpm: m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0,
        custoPorConversa: m.conversas > 0 ? m.spend / m.conversas : 0,
        custoPorCadastro:
          m.formSubmissions > 0 ? m.spend / m.formSubmissions : 0,
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    // --- Accounts (lista unica para dropdown) ---
    const accountSet = new Set<string>();
    for (const ad of rawAds) {
      if (ad.account_name) accountSet.add(ad.account_name);
    }
    const accounts = Array.from(accountSet).sort();

    // --- porDia (agregado diario computado do rawAds, respeita filtro account) ---
    const dayMap = new Map<
      string,
      {
        spend: number;
        impressions: number;
        clicks: number;
        conversas: number;
        reach: number;
        reactions: number;
        formSubmissions: number;
        adIds: Set<string>;
      }
    >();

    for (const ad of rawAds) {
      const key = ad.data_relatorio;
      const existing = dayMap.get(key);
      if (existing) {
        existing.spend += ad.spend || 0;
        existing.impressions += ad.impressions || 0;
        existing.clicks += ad.clicks || 0;
        existing.conversas += ad.conversas_iniciadas || 0;
        existing.reach += ad.reach || 0;
        existing.reactions += ad.post_reactions || 0;
        existing.formSubmissions += ad.form_submissions || 0;
        existing.adIds.add(ad.ad_id);
      } else {
        dayMap.set(key, {
          spend: ad.spend || 0,
          impressions: ad.impressions || 0,
          clicks: ad.clicks || 0,
          conversas: ad.conversas_iniciadas || 0,
          reach: ad.reach || 0,
          reactions: ad.post_reactions || 0,
          formSubmissions: ad.form_submissions || 0,
          adIds: new Set([ad.ad_id]),
        });
      }
    }

    const porDia: AdsSummaryByDate[] = Array.from(dayMap.entries())
      .map(([data_relatorio, d]) => ({
        data_relatorio,
        total_spend: d.spend,
        total_impressions: d.impressions,
        total_clicks: d.clicks,
        total_conversas: d.conversas,
        total_reach: d.reach,
        total_reactions: d.reactions,
        total_form_submissions: d.formSubmissions,
        avg_cpc: d.clicks > 0 ? d.spend / d.clicks : null,
        avg_cpm: d.impressions > 0 ? (d.spend / d.impressions) * 1000 : null,
        avg_ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : null,
        avg_frequency: d.reach > 0 ? d.impressions / d.reach : null,
        ads_count: d.adIds.size,
        location_id: null,
      }))
      .sort((a, b) => a.data_relatorio.localeCompare(b.data_relatorio));

    return {
      overview,
      periodDeltas,
      campanhas,
      adsets,
      anuncios,
      accounts,
      porDia,
    };
  }, [rawAds, prevAds, rawFunnel]);

  // ── Unified funnel totals (semantic layer cross-reference) ──
  const unifiedTotals: UnifiedFunnelTotals | null = unified.summary
    ? {
        totalLeads: unified.summary.total_leads,
        responderam: unified.summary.responderam,
        agendaram: unified.summary.agendaram,
        compareceram: unified.summary.compareceram,
        fecharam: unified.summary.fecharam,
      }
    : null;

  return {
    overview: computed.overview || EMPTY_OVERVIEW,
    periodDeltas: computed.periodDeltas || EMPTY_DELTAS,
    campanhas: computed.campanhas || [],
    adsets: computed.adsets || [],
    anuncios: computed.anuncios || [],
    accounts: computed.accounts || [],
    criativos: rawAds,
    porDia: computed.porDia || [],
    adsWithLeads: rawAdsWithLeads,
    funnelData: rawFunnel,
    anomalies: rawAnomalies,
    unifiedTotals,
    loading: loading || (locationId ? unified.loading : false),
    error: error || unified.error,
    refetch: fetchData,
  };
};

export default useAdsPerformance;
