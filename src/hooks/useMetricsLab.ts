import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
// Mock data removed — empty state when no ads data for selected period
import type {
  LeadScoreRow,
  CriativoARC,
  FunnelAd,
  FunnelStep,
  PeriodDeltas,
  HeatmapRow,
  ConversionTimeStats,
  AnomalyRow,
  FunnelLead,
} from "../pages/MetricsLab/types";

// ─── Raw DB shapes ──────────────────────────────────────────────────────────

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
  thumbnail_url: string | null;
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

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
    ad_name: adName ?? "Sem nome",
    campaign_name: campaignName ?? "N/A",
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
  const map = new Map<
    string,
    {
      ad_name: string | null;
      campaign_name: string | null;
      sumSpend: number;
      sumConversions: number;
      sumConversionValue: number;
      // Campos brutos para media ponderada por volume (nao media simples de rates)
      sumImpressions: number;
      sumVideo3s: number;
      sumVideoP75: number;
      sumOutbound: number;
      sumClicks: number;
      // Fallback: acumula rates pre-calculados caso campos brutos sejam nulos
      hookRateSum: number;
      holdRateSum: number;
      bodyRateSum: number;
      ctrLinkSum: number;
      count: number;
    }
  >();

  for (const row of rows) {
    const existing = map.get(row.ad_id);
    if (existing) {
      existing.sumSpend += Number(row.spend) || 0;
      existing.sumConversions += Number(row.conversions) || 0;
      existing.sumConversionValue += Number(row.conversion_value) || 0;
      existing.sumImpressions += Number(row.impressions) || 0;
      existing.sumVideo3s += Number(row.video_views_3s) || 0;
      existing.sumVideoP75 += Number(row.video_p75) || 0;
      existing.sumOutbound += Number(row.outbound_clicks) || 0;
      existing.sumClicks += Number(row.clicks) || 0;
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
        sumImpressions: Number(row.impressions) || 0,
        sumVideo3s: Number(row.video_views_3s) || 0,
        sumVideoP75: Number(row.video_p75) || 0,
        sumOutbound: Number(row.outbound_clicks) || 0,
        sumClicks: Number(row.clicks) || 0,
        hookRateSum: Number(row.hook_rate) || 0,
        holdRateSum: Number(row.hold_rate) || 0,
        bodyRateSum: Number(row.body_rate) || 0,
        ctrLinkSum: Number(row.ctr_link) || 0,
        count: 1,
      });
    }
  }

  return Array.from(map.entries())
    .map(([adId, m]) => {
      // Media ponderada por volume: usar campos brutos quando disponiveis,
      // fallback para media simples dos rates pre-calculados quando nao ha dados brutos.
      const hookRate =
        m.sumImpressions > 0
          ? (m.sumVideo3s / m.sumImpressions) * 100
          : m.count > 0
            ? m.hookRateSum / m.count
            : 0;
      const holdRate =
        m.sumVideo3s > 0
          ? (m.sumVideoP75 / m.sumVideo3s) * 100
          : m.count > 0
            ? m.holdRateSum / m.count
            : 0;
      const bodyRate =
        m.sumImpressions > 0
          ? (m.sumOutbound / m.sumImpressions) * 100
          : m.count > 0
            ? m.bodyRateSum / m.count
            : 0;
      const ctrLink =
        m.sumImpressions > 0
          ? (m.sumClicks / m.sumImpressions) * 100
          : m.count > 0
            ? m.ctrLinkSum / m.count
            : 0;
      return mapCriativoARC(
        adId,
        m.ad_name,
        m.campaign_name,
        m.sumSpend,
        m.sumConversions,
        m.sumConversionValue,
        hookRate,
        holdRate,
        bodyRate,
        ctrLink,
      );
    })
    .sort((a, b) => b.gasto - a.gasto);
}

// ─── Raw Funnel Tracking shape ──────────────────────────────────────────────

interface RawFunnelTracking {
  ad_id: string;
  attribution_level: string;
  total_leads: number;
  novo: number;
  em_contato: number;
  agendou: number;
  no_show: number;
  perdido: number;
  won: number;
  won_value: number;
}

interface MergedFunnelTracking extends RawFunnelTracking {
  inferred_leads: number;
}

// ─── Aggregation for Funil por Anuncio ──────────────────────────────────────

function buildFunnelAds(
  rows: RawAdRow[],
  trackingMap?: Map<string, MergedFunnelTracking>,
): FunnelAd[] {
  // Group rows by ad_id, keeping rows sorted by data_relatorio asc for trend
  const map = new Map<
    string,
    {
      ad_name: string | null;
      campaign_name: string | null;
      rows: RawAdRow[];
    }
  >();

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
    const sorted = [...m.rows].sort((a, b) =>
      a.data_relatorio.localeCompare(b.data_relatorio),
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
    // Fallback: acumula rates pre-calculados para uso quando campos brutos sao nulos
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

    // Media ponderada por volume (campos brutos) com fallback para media simples
    const avgCtrLink =
      sumImpressions > 0
        ? (sumClicks / sumImpressions) * 100
        : rateCount > 0
          ? ctrLinkSum / rateCount
          : 0;
    const avgHookRate =
      sumImpressions > 0
        ? (sumVideo3s / sumImpressions) * 100
        : rateCount > 0
          ? hookRateSum / rateCount
          : 0;
    const avgHoldRate =
      sumVideo3s > 0
        ? (sumVideoP75 / sumVideo3s) * 100
        : rateCount > 0
          ? holdRateSum / rateCount
          : 0;
    const avgBodyRate =
      sumImpressions > 0
        ? (sumOutbound / sumImpressions) * 100
        : rateCount > 0
          ? bodyRateSum / rateCount
          : 0;
    const cpm = sumImpressions > 0 ? (sumSpend / sumImpressions) * 1000 : 0;
    const cpc = sumClicks > 0 ? sumSpend / sumClicks : 0;
    const cpa = sumConversions > 0 ? sumSpend / sumConversions : 0;

    // Build trend arrays (7 days) — only for steps that show in funnel
    const trendImpressoes = trendRows.map((r) => Number(r.impressions) || 0);
    const trendCliques = trendRows.map((r) => Number(r.clicks) || 0);
    const trendVideo3s = trendRows.map((r) => Number(r.video_views_3s) || 0);
    const trendVideoP75 = trendRows.map((r) => Number(r.video_p75) || 0);
    const trendConversas = trendRows.map(
      (r) => Number(r.conversas_iniciadas) || 0,
    );
    const trendConversions = trendRows.map((r) => Number(r.conversions) || 0);

    // Build all candidate steps, then filter out zeros
    const allFbSteps: FunnelStep[] = [
      {
        key: "impressoes",
        label: "Impressoes",
        value: sumImpressions,
        cost_metric: cpm > 0 ? Number(cpm.toFixed(2)) : null,
        cost_label: cpm > 0 ? "CPM" : null,
        conversion_rate: null,
        trend: trendImpressoes,
      },
      {
        key: "cliques",
        label: "Cliques",
        value: sumClicks,
        cost_metric: cpc > 0 ? Number(cpc.toFixed(2)) : null,
        cost_label: cpc > 0 ? "CPC" : null,
        conversion_rate:
          sumImpressions > 0
            ? Number(((sumClicks / sumImpressions) * 100).toFixed(2))
            : null,
        trend: trendCliques,
      },
      {
        key: "video_3s",
        label: "Views 3s",
        value: sumVideo3s,
        cost_metric: null,
        cost_label: null,
        conversion_rate:
          avgHookRate > 0 ? Number(avgHookRate.toFixed(1)) : null,
        trend: trendVideo3s,
      },
      {
        key: "video_p75",
        label: "Assistiu 75%",
        value: sumVideoP75,
        cost_metric: null,
        cost_label: null,
        conversion_rate:
          avgHoldRate > 0 ? Number(avgHoldRate.toFixed(1)) : null,
        trend: trendVideoP75,
      },
      {
        key: "conversas",
        label: "Conversas",
        value: sumConversas,
        cost_metric:
          sumConversas > 0
            ? Number((sumSpend / sumConversas).toFixed(2))
            : null,
        cost_label: sumConversas > 0 ? "CPConv" : null,
        conversion_rate:
          sumClicks > 0
            ? Number(((sumConversas / sumClicks) * 100).toFixed(1))
            : null,
        trend: trendConversas,
      },
      {
        key: "conversoes",
        label: "Vendas FB",
        value: sumConversions,
        cost_metric: cpa > 0 ? Number(cpa.toFixed(2)) : null,
        cost_label: cpa > 0 ? "CPA" : null,
        conversion_rate:
          sumConversas > 0
            ? Number(((sumConversions / sumConversas) * 100).toFixed(1))
            : null,
        trend: trendConversions,
      },
    ];

    // Filter: keep Impressoes always, hide zero-value steps
    const steps: FunnelStep[] = allFbSteps.filter(
      (s) => s.key === "impressoes" || s.value > 0,
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
          key: "ghl_separator",
          label: "── GHL ──",
          value: 0,
          cost_metric: null,
          cost_label: null,
          conversion_rate: null,
          trend: [],
        },
        {
          key: "ghl_leads",
          label: "Leads",
          value: t.total_leads,
          cost_metric: cpLead > 0 ? Number(cpLead.toFixed(2)) : null,
          cost_label: cpLead > 0 ? "CPL" : null,
          conversion_rate: null, // cross-source, no meaningful %
          trend: [],
        },
        {
          key: "ghl_em_contato",
          label: "Respondeu",
          value: t.em_contato,
          cost_metric: null,
          cost_label: null,
          conversion_rate:
            t.total_leads > 0
              ? Number(((t.em_contato / t.total_leads) * 100).toFixed(1))
              : null,
          trend: [],
        },
        {
          key: "ghl_agendou",
          label: "Agendou",
          value: t.agendou,
          cost_metric:
            cpAgendamento > 0 ? Number(cpAgendamento.toFixed(2)) : null,
          cost_label: cpAgendamento > 0 ? "CPA" : null,
          conversion_rate:
            t.em_contato > 0
              ? Number(((t.agendou / t.em_contato) * 100).toFixed(1))
              : null,
          trend: [],
        },
        {
          key: "ghl_compareceu",
          label: "Compareceu",
          value: compareceu,
          cost_metric: null,
          cost_label: null,
          conversion_rate:
            t.agendou > 0
              ? Number(((compareceu / t.agendou) * 100).toFixed(1))
              : null,
          trend: [],
        },
        {
          key: "ghl_won",
          label: "Fechou",
          value: t.won,
          cost_metric: t.won > 0 ? Number((sumSpend / t.won).toFixed(2)) : null,
          cost_label: t.won > 0 ? "CAC" : null,
          conversion_rate:
            compareceu > 0
              ? Number(((t.won / compareceu) * 100).toFixed(1))
              : null,
          trend: [],
        },
      );
    }

    const rawLevel = tracking?.attribution_level ?? "exact";
    const attributionLevel: FunnelAd["attribution_level"] =
      rawLevel === "unattributed_inferred"
        ? "unattributed_inferred"
        : tracking?.inferred_leads && tracking.inferred_leads > 0
          ? "campaign_inferred"
          : "exact";

    return {
      ad_id: adId,
      ad_name: m.ad_name ?? "Sem nome",
      campaign_name: m.campaign_name ?? "N/A",
      steps,
      won_value: tracking?.won_value ?? 0,
      attribution_level: attributionLevel,
      inferred_leads: tracking?.inferred_leads ?? 0,
    };
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

// ─── Period delta helpers ─────────────────────────────────────────────────────

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

interface AggregatedPeriodMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number; // conversas_iniciadas as proxy for leads
}

function aggregateAdRows(rows: RawAdRow[]): AggregatedPeriodMetrics {
  let spend = 0;
  let impressions = 0;
  let clicks = 0;
  let leads = 0;
  for (const r of rows) {
    spend += Number(r.spend) || 0;
    impressions += Number(r.impressions) || 0;
    clicks += Number(r.clicks) || 0;
    leads += Number(r.conversas_iniciadas) || 0;
  }
  return { spend, impressions, clicks, leads };
}

interface UseMetricsLabReturn {
  leadScoreRows: LeadScoreRow[];
  criativosARC: CriativoARC[];
  funnelAds: FunnelAd[];
  heatmapData: HeatmapRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  accounts: string[];
  unattributedCount: number;
  periodDeltas: PeriodDeltas | null;
  conversionTimeMap: Map<string, ConversionTimeStats> | null;
  anomalies: AnomalyRow[];
  fetchFunnelLeads: (adId: string) => Promise<FunnelLead[]>;
}

export const useMetricsLab = (
  accountName?: string | null,
  dateRange?: { startDate: Date | null; endDate: Date | null },
): UseMetricsLabReturn => {
  const [rawAds, setRawAds] = useState<RawAdRow[]>([]);
  const [rawAdsPrev, setRawAdsPrev] = useState<RawAdRow[]>([]);
  const [rawTracking, setRawTracking] = useState<RawFunnelTracking[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapRow[]>([]);
  const [rawConversionTime, setRawConversionTime] = useState<
    ConversionTimeStats[]
  >([]);
  const [rawAnomalies, setRawAnomalies] = useState<AnomalyRow[]>([]);
  const [unattributedCount, setUnattributedCount] = useState(0);
  const [mappedAccounts, setMappedAccounts] = useState<string[]>([]);
  const [adNameCache, setAdNameCache] = useState<
    Map<
      string,
      { ad_name: string; campaign_name: string; account_name: string }
    >
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn("[MetricsLab] Supabase nao configurado — usando mock data");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Helper para formatar data como YYYY-MM-DD
      const formatDateISO = (d: Date): string => d.toISOString().split("T")[0];

      // Q0: Buscar account_names permitidos (apenas clientes ativos com agent_versions)
      const { data: mappingRows, error: mappingErr } = await supabase
        .from("ad_account_mapping")
        .select("account_name")
        .eq("is_active", true);

      if (mappingErr) {
        console.error(
          "[MetricsLab] ad_account_mapping query falhou:",
          mappingErr.message,
        );
        setError(
          "Falha ao carregar mapeamento de contas: " + mappingErr.message,
        );
        setLoading(false);
        return;
      }
      const allowedAccounts = (mappingRows ?? []).map(
        (r: { account_name: string }) => r.account_name,
      );
      setMappedAccounts(allowedAccounts);

      // Se nao ha contas mapeadas, nada a mostrar
      if (allowedAccounts.length === 0) {
        setRawAds([]);
        setRawAdsPrev([]);
        setRawTracking([]);
        setUnattributedCount(0);
        setLoading(false);
        return;
      }

      // Q2: fb_ads_performance with video columns (criativos + funil)
      let adsQuery = supabase
        .from("fb_ads_performance")
        .select(
          "ad_id, ad_name, adset_name, campaign_name, account_name, data_relatorio, " +
            "impressions, clicks, spend, reach, ctr_link, hook_rate, hold_rate, body_rate, " +
            "video_views_3s, video_p75, outbound_clicks, conversas_iniciadas, " +
            "custo_por_conversa, conversions, conversion_value, thumbnail_url",
        )
        .in("account_name", accountName ? [accountName] : allowedAccounts)
        .order("data_relatorio", { ascending: true });

      if (dateRange?.startDate) {
        adsQuery = adsQuery.gte(
          "data_relatorio",
          formatDateISO(dateRange.startDate),
        );
      }
      if (dateRange?.endDate) {
        adsQuery = adsQuery.lte(
          "data_relatorio",
          formatDateISO(dateRange.endDate),
        );
      }

      adsQuery = adsQuery.limit(5000);

      // Q2b: Previous period for comparison (same duration, shifted back)
      let adsPrevQuery = supabase
        .from("fb_ads_performance")
        .select(
          "ad_id, ad_name, adset_name, campaign_name, account_name, data_relatorio, " +
            "impressions, clicks, spend, reach, ctr_link, hook_rate, hold_rate, body_rate, " +
            "video_views_3s, video_p75, outbound_clicks, conversas_iniciadas, " +
            "custo_por_conversa, conversions, conversion_value",
        )
        .in("account_name", accountName ? [accountName] : allowedAccounts)
        .order("data_relatorio", { ascending: true });

      if (dateRange?.startDate && dateRange?.endDate) {
        const rangeMs =
          dateRange.endDate.getTime() - dateRange.startDate.getTime();
        const prevEnd = new Date(dateRange.startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - rangeMs);
        prevEnd.setHours(23, 59, 59, 999);
        prevStart.setHours(0, 0, 0, 0);
        adsPrevQuery = adsPrevQuery
          .gte("data_relatorio", formatDateISO(prevStart))
          .lte("data_relatorio", formatDateISO(prevEnd));
      }

      adsPrevQuery = adsPrevQuery.limit(5000);

      // Q3: Funnel tracking — query direta em n8n_schedule_tracking com filtro de data
      // As views pre-agregadas (vw_funnel_tracking_enhanced) nao aceitam filtro de data,
      // causando discrepancia entre o funil FB (filtrado) e GHL (tudo acumulado).
      // Agora consultamos os leads brutos e agregamos no frontend.
      let trackingQuery = supabase
        .from("n8n_schedule_tracking")
        .select("ad_id, etapa_funil, unique_id, utm_campaign")
        .not("ad_id", "is", null)
        .neq("ad_id", "NULL")
        .neq("ad_id", "null")
        .neq("ad_id", "undefined")
        .neq("ad_id", "")
        .limit(5000);

      if (dateRange?.startDate) {
        // Fix timezone: alinhar com data_relatorio DATE do FB Ads (que e UTC midnight).
        // setUTCHours(0,0,0,0) garante que o start seja 00:00 UTC do mesmo dia calendario.
        const startUTC = new Date(dateRange.startDate);
        startUTC.setUTCHours(0, 0, 0, 0);
        trackingQuery = trackingQuery.gte("created_at", startUTC.toISOString());
      }
      if (dateRange?.endDate) {
        // setUTCHours(23,59,59,999) cobre o dia inteiro em UTC — mesmo dia que data_relatorio.
        const endUTC = new Date(dateRange.endDate);
        endUTC.setUTCHours(23, 59, 59, 999);
        trackingQuery = trackingQuery.lte("created_at", endUTC.toISOString());
      }

      // Q3b: Leads sem ad_id mas com agente_ia SDR/Instagram — "Paid (nao rastreado)"
      // Esses leads provavelmente vieram de trafego pago mas perderam UTM no trajeto.
      let unattributedInferredQuery = supabase
        .from("n8n_schedule_tracking")
        .select("etapa_funil, unique_id")
        .or(
          "ad_id.is.null,ad_id.eq.NULL,ad_id.eq.null,ad_id.eq.undefined,ad_id.eq.",
        )
        .in("agente_ia", [
          "sdrcarreira",
          "sdr_inbound",
          "social_seller_instagram",
        ])
        .eq("source", "instagram")
        .limit(2000);

      if (dateRange?.startDate) {
        const startUTC = new Date(dateRange.startDate);
        startUTC.setUTCHours(0, 0, 0, 0);
        unattributedInferredQuery = unattributedInferredQuery.gte(
          "created_at",
          startUTC.toISOString(),
        );
      }
      if (dateRange?.endDate) {
        const endUTC = new Date(dateRange.endDate);
        endUTC.setUTCHours(23, 59, 59, 999);
        unattributedInferredQuery = unattributedInferredQuery.lte(
          "created_at",
          endUTC.toISOString(),
        );
      }

      const [trackingResult, unattributedInferredResult] = await Promise.all([
        trackingQuery,
        unattributedInferredQuery,
      ]);

      // Q4: Count unattributed leads (sem ad_id) — tambem filtrado por data
      let unattributedQuery = supabase
        .from("n8n_schedule_tracking")
        .select("*", { count: "exact", head: true })
        .or(
          "ad_id.is.null,ad_id.eq.NULL,ad_id.eq.null,ad_id.eq.undefined,ad_id.eq.",
        );

      if (dateRange?.startDate) {
        unattributedQuery = unattributedQuery.gte(
          "created_at",
          dateRange.startDate.toISOString(),
        );
      }
      if (dateRange?.endDate) {
        const endOfDay = new Date(dateRange.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        unattributedQuery = unattributedQuery.lte(
          "created_at",
          endOfDay.toISOString(),
        );
      }

      // Q5: Heatmap de horarios — fallback gracioso se view nao existir
      const heatmapQuery = supabase
        .from("vw_ads_hourly_heatmap")
        .select(
          "hour_of_day, day_of_week, total_leads, leads_agendou, leads_won, conversion_rate",
        )
        .limit(168); // 7 dias x 24 horas

      const [adsResult, adsPrevResult, unattributedResult, heatmapResult] =
        await Promise.all([
          adsQuery,
          adsPrevQuery,
          unattributedQuery,
          heatmapQuery,
        ]);

      const queryErrors = [adsResult.error, trackingResult.error]
        .filter(Boolean)
        .map((e) => e!.message);
      if (queryErrors.length > 0) {
        console.warn("[MetricsLab] Query errors:", queryErrors);
        setError(queryErrors.join(" | "));
      }

      setRawAds((adsResult.data ?? []) as unknown as RawAdRow[]);
      setRawAdsPrev((adsPrevResult.data ?? []) as unknown as RawAdRow[]);
      setUnattributedCount(unattributedResult.count ?? 0);

      // Agregar leads brutos em RawFunnelTracking por ad_id (substitui a view pre-agregada)
      const rawTrackingRows = (trackingResult.data ?? []) as {
        ad_id: string;
        etapa_funil: string | null;
        unique_id: string;
      }[];
      const trackingAgg = new Map<
        string,
        {
          total: number;
          novo: number;
          em_contato: number;
          agendou: number;
          no_show: number;
          perdido: number;
          contactIds: string[];
          isUnattributedInferred?: boolean;
        }
      >();
      for (const r of rawTrackingRows) {
        if (!r.ad_id || r.ad_id.trim().length <= 5) continue;
        const agg = trackingAgg.get(r.ad_id) ?? {
          total: 0,
          novo: 0,
          em_contato: 0,
          agendou: 0,
          no_show: 0,
          perdido: 0,
          contactIds: [],
        };
        agg.total++;
        const etapa = (r.etapa_funil ?? "Novo").trim();
        if (etapa === "Novo") agg.novo++;
        else if (etapa === "Em Contato") agg.em_contato++;
        else if (etapa === "Agendou") agg.agendou++;
        else if (etapa === "No-show") agg.no_show++;
        else if (etapa === "Perdido") agg.perdido++;
        if (r.unique_id) agg.contactIds.push(r.unique_id);
        trackingAgg.set(r.ad_id, agg);
      }

      // Agregar leads unattributed_inferred sob pseudo-id fixo
      const UNATTRIBUTED_INFERRED_ID = "__unattributed_inferred__";
      const unattributedInferredRows = (unattributedInferredResult.data ??
        []) as { etapa_funil: string | null; unique_id: string }[];
      if (unattributedInferredRows.length > 0) {
        const agg = trackingAgg.get(UNATTRIBUTED_INFERRED_ID) ?? {
          total: 0,
          novo: 0,
          em_contato: 0,
          agendou: 0,
          no_show: 0,
          perdido: 0,
          contactIds: [],
          isUnattributedInferred: true,
        };
        for (const r of unattributedInferredRows) {
          agg.total++;
          const etapa = (r.etapa_funil ?? "Novo").trim();
          if (etapa === "Novo") agg.novo++;
          else if (etapa === "Em Contato") agg.em_contato++;
          else if (etapa === "Agendou") agg.agendou++;
          else if (etapa === "No-show") agg.no_show++;
          else if (etapa === "Perdido") agg.perdido++;
          if (r.unique_id) agg.contactIds.push(r.unique_id);
        }
        trackingAgg.set(UNATTRIBUTED_INFERRED_ID, agg);
      }

      // Buscar won/won_value das oportunidades GHL para os contact_ids do periodo
      // Inclui tanto leads com ad_id quanto unattributed_inferred
      const allContactIds = [
        ...rawTrackingRows.map((r) => r.unique_id),
        ...unattributedInferredRows.map((r) => r.unique_id),
      ].filter(Boolean);
      const wonMap = new Map<
        string,
        { status: string; monetary_value: number }
      >();
      if (allContactIds.length > 0) {
        try {
          // Supabase .in() aceita ate ~2000 itens; dividir em batches se necessario
          const batchSize = 500;
          for (let i = 0; i < allContactIds.length; i += batchSize) {
            const batch = allContactIds.slice(i, i + batchSize);
            const { data: oppData } = await supabase
              .from("ghl_opportunities")
              .select("contact_id, status, monetary_value")
              .in("contact_id", batch);
            if (oppData) {
              for (const o of oppData as {
                contact_id: string;
                status: string;
                monetary_value: number | null;
              }[]) {
                const existing = wonMap.get(o.contact_id);
                if (!existing || o.status === "won") {
                  wonMap.set(o.contact_id, {
                    status: o.status,
                    monetary_value: o.monetary_value ?? 0,
                  });
                }
              }
            }
          }
        } catch {
          console.warn("[MetricsLab] ghl_opportunities query falhou");
        }
      }

      // Montar RawFunnelTracking[] agregado
      const aggregatedTracking: RawFunnelTracking[] = Array.from(
        trackingAgg.entries(),
      ).map(([adId, agg]) => {
        let won = 0;
        let wonValue = 0;
        for (const cid of agg.contactIds) {
          const opp = wonMap.get(cid);
          if (opp?.status === "won") {
            won++;
            wonValue += opp.monetary_value;
          }
        }
        const attributionLevel:
          | "exact"
          | "campaign_inferred"
          | "unattributed_inferred" = agg.isUnattributedInferred
          ? "unattributed_inferred"
          : "exact";
        return {
          ad_id: adId,
          attribution_level: attributionLevel,
          total_leads: agg.total,
          novo: agg.novo,
          em_contato: agg.em_contato,
          agendou: agg.agendou,
          no_show: agg.no_show,
          perdido: agg.perdido,
          won,
          won_value: wonValue,
        };
      });
      setRawTracking(aggregatedTracking);

      // Lookup ad names for tracking-only ad_ids (not in current period's fb_ads_performance)
      const currentAdIds = new Set(
        (adsResult.data ?? []).map((r: { ad_id: string }) => r.ad_id),
      );
      const trackingOnlyIds = Array.from(trackingAgg.keys()).filter(
        (id) => id !== "__unattributed_inferred__" && !currentAdIds.has(id),
      );
      if (trackingOnlyIds.length > 0) {
        try {
          const { data: nameRows } = await supabase
            .from("fb_ads_performance")
            .select("ad_id, ad_name, campaign_name, account_name")
            .in("ad_id", trackingOnlyIds)
            .not("ad_name", "is", null)
            .limit(500);
          if (nameRows && nameRows.length > 0) {
            const cache = new Map(adNameCache);
            for (const r of nameRows as {
              ad_id: string;
              ad_name: string;
              campaign_name: string;
              account_name: string;
            }[]) {
              if (!cache.has(r.ad_id) && r.ad_name) {
                cache.set(r.ad_id, {
                  ad_name: r.ad_name,
                  campaign_name: r.campaign_name ?? "N/A",
                  account_name: r.account_name ?? "N/A",
                });
              }
            }
            setAdNameCache(cache);
          }
        } catch {
          console.warn("[MetricsLab] ad name lookup falhou");
        }
      }

      // Heatmap: fallback gracioso se view nao existir (retorna [] sem lancar erro)
      if (!heatmapResult.error) {
        setHeatmapData((heatmapResult.data ?? []) as unknown as HeatmapRow[]);
      } else {
        console.warn(
          "[MetricsLab] vw_ads_hourly_heatmap nao disponivel:",
          heatmapResult.error.message,
        );
        setHeatmapData([]);
      }

      // Q6: Conversion time stats — fallback gracioso se view nao existir
      try {
        const convTimeResult = await supabase
          .from("vw_conversion_time_stats")
          .select("*")
          .limit(500);
        if (!convTimeResult.error) {
          setRawConversionTime(
            (convTimeResult.data ?? []) as unknown as ConversionTimeStats[],
          );
        } else {
          console.warn(
            "[MetricsLab] vw_conversion_time_stats indisponivel:",
            convTimeResult.error.message,
          );
        }
      } catch {
        console.warn("[MetricsLab] vw_conversion_time_stats nao existe ainda");
      }

      // Q7: Anomaly detection — fallback gracioso se view nao existir
      try {
        const anomalyResult = await supabase
          .from("vw_ads_anomaly_detection")
          .select("*")
          .eq("is_anomaly", true)
          .limit(100);
        if (!anomalyResult.error) {
          setRawAnomalies(
            (anomalyResult.data ?? []) as unknown as AnomalyRow[],
          );
        } else {
          console.warn(
            "[MetricsLab] vw_ads_anomaly_detection indisponivel:",
            anomalyResult.error.message,
          );
        }
      } catch {
        console.warn("[MetricsLab] vw_ads_anomaly_detection nao existe ainda");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar Metrics Lab";
      setError(message);
      console.error("[MetricsLab Error]", err);
    } finally {
      setLoading(false);
    }
  }, [
    accountName,
    dateRange?.startDate?.getTime(),
    dateRange?.endDate?.getTime(),
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const computed = useMemo(() => {
    // Accounts from ad_account_mapping (always available, not dependent on date range)
    const accounts = [...mappedAccounts].sort();

    // Build tracking map FIRST — needed by score calculation and funnelAds
    const trackingMap = new Map<string, MergedFunnelTracking>();
    for (const t of rawTracking) {
      const existing = trackingMap.get(t.ad_id);
      if (existing) {
        existing.total_leads += Number(t.total_leads) || 0;
        existing.novo += Number(t.novo) || 0;
        existing.em_contato += Number(t.em_contato) || 0;
        existing.agendou += Number(t.agendou) || 0;
        existing.no_show += Number(t.no_show) || 0;
        existing.perdido += Number(t.perdido) || 0;
        existing.won += Number(t.won) || 0;
        existing.won_value += Number(t.won_value) || 0;
        if (t.attribution_level === "campaign_inferred") {
          existing.inferred_leads += Number(t.total_leads) || 0;
        }
      } else {
        trackingMap.set(t.ad_id, {
          ...t,
          inferred_leads:
            t.attribution_level === "campaign_inferred"
              ? Number(t.total_leads) || 0
              : 0,
        });
      }
    }

    // Build thumbnail map from rawAds (first non-null per ad_id)
    const thumbnailMap = new Map<string, string>();
    for (const r of rawAds) {
      if (r.thumbnail_url && !thumbnailMap.has(r.ad_id)) {
        thumbnailMap.set(r.ad_id, r.thumbnail_url);
      }
    }

    // ─── Lead Score: calculate from rawAds + trackingMap (date-filtered) ───
    // Aggregate rawAds by ad_id for score calculation
    const adAggMap = new Map<
      string,
      {
        ad_name: string | null;
        adset_name: string | null;
        campaign_name: string | null;
        sumSpend: number;
        sumConversas: number;
        ctrLinkSum: number;
        count: number;
      }
    >();
    for (const r of rawAds) {
      const existing = adAggMap.get(r.ad_id);
      if (existing) {
        existing.sumSpend += Number(r.spend) || 0;
        existing.sumConversas += Number(r.conversas_iniciadas) || 0;
        existing.ctrLinkSum += Number(r.ctr_link) || 0;
        existing.count += 1;
      } else {
        adAggMap.set(r.ad_id, {
          ad_name: r.ad_name,
          adset_name: r.adset_name,
          campaign_name: r.campaign_name,
          sumSpend: Number(r.spend) || 0,
          sumConversas: Number(r.conversas_iniciadas) || 0,
          ctrLinkSum: Number(r.ctr_link) || 0,
          count: 1,
        });
      }
    }

    // Inject tracking-only ads into adAggMap (leads exist but no FB ads data for this period)
    for (const [adId] of trackingMap.entries()) {
      if (adId === "__unattributed_inferred__") continue;
      if (!adAggMap.has(adId)) {
        const cached = adNameCache.get(adId);
        adAggMap.set(adId, {
          ad_name: cached?.ad_name ?? null,
          adset_name: null,
          campaign_name: cached?.campaign_name ?? null,
          sumSpend: 0,
          sumConversas: 0,
          ctrLinkSum: 0,
          count: 0,
        });
      }
    }

    // Calculate score per ad_id using real leads from n8n_schedule_tracking
    const hasAnyData = adAggMap.size > 0;
    const leadScoreRows: LeadScoreRow[] = hasAnyData
      ? Array.from(adAggMap.entries())
          .map(([adId, agg]) => {
            const tracking = trackingMap.get(adId);
            // leads = real GHL leads from n8n_schedule_tracking (not clicks)
            const realLeads = tracking?.total_leads ?? 0;
            const responded = tracking?.em_contato ?? 0;
            const won = tracking?.won ?? 0;
            const wonValue = tracking?.won_value ?? 0;
            const spend = agg.sumSpend;
            const cpl = realLeads > 0 ? spend / realLeads : 0;
            const respPct = realLeads > 0 ? (responded / realLeads) * 100 : 0;
            const avgCtrLink = agg.count > 0 ? agg.ctrLinkSum / agg.count : 0;

            // Score 0-100 (4 components x 25pts each)
            // C1: CTR de link (3% = 25pts)
            const comp1 = Math.min(25, avgCtrLink * 8);
            // C2: Taxa de resposta (100% = 25pts)
            const comp2 = Math.min(25, respPct / 4);
            // C3: Taxa de fechamento (5% close = 25pts)
            const wonRate = realLeads > 0 ? (won / realLeads) * 100 : 0;
            const comp3 = Math.min(25, wonRate * 5);
            // C4: Eficiencia CPL (R$0 = 25pts, R$100+ = 0pts)
            const comp4 =
              spend > 0 && realLeads > 0
                ? Math.min(25, 25 - Math.min(25, cpl / 4))
                : 0;

            const score = Math.min(
              100,
              Math.max(0, Math.round(comp1 + comp2 + comp3 + comp4)),
            );
            const potencial: LeadScoreRow["potencial"] =
              score >= 70
                ? "alto"
                : score >= 40
                  ? "medio"
                  : score >= 20
                    ? "baixo"
                    : "desqualificado";

            const roas = spend > 0 && wonValue > 0 ? wonValue / spend : 0;
            const drivers =
              won > 0
                ? [
                    {
                      label: `${won} fechamentos GHL`,
                      value: won,
                      pct: Math.round(wonRate),
                    },
                    ...(roas > 0
                      ? [
                          {
                            label: `ROAS ${roas.toFixed(1)}x`,
                            value: roas,
                            pct: Math.round(roas * 10),
                          },
                        ]
                      : []),
                  ]
                : [];

            return {
              ad_id: adId,
              ad_name: agg.ad_name ?? "Sem nome",
              adset_name: agg.adset_name ?? "N/A",
              campaign_name: agg.campaign_name ?? "N/A",
              gasto: spend,
              leads: realLeads,
              cpl,
              resp_pct: respPct,
              score,
              potencial,
              top_drivers: drivers.slice(0, 3),
              top_detractors: [],
              thumbnail_url: thumbnailMap.get(adId) ?? null,
            };
          })
          .sort((a, b) => b.score - a.score)
      : [];

    // Period deltas — compare current vs previous period aggregates
    let periodDeltas: PeriodDeltas | null = null;
    if (rawAds.length > 0) {
      const curr = aggregateAdRows(rawAds);
      const prev = aggregateAdRows(rawAdsPrev);

      const currCtr =
        curr.impressions > 0 ? (curr.clicks / curr.impressions) * 100 : 0;
      const prevCtr =
        prev.impressions > 0 ? (prev.clicks / prev.impressions) * 100 : 0;

      // CPL: current uses real GHL lead count, previous uses conversas_iniciadas as proxy
      // (tracking data for previous period is not fetched — approximation is acceptable)
      const totalRealLeads = leadScoreRows.reduce((s, r) => s + r.leads, 0);
      const totalSpend = leadScoreRows.reduce((s, r) => s + r.gasto, 0);
      const currCpl = totalRealLeads > 0 ? totalSpend / totalRealLeads : 0;
      const prevCpl = prev.leads > 0 ? prev.spend / prev.leads : 0;

      periodDeltas = {
        spend_delta: calcDelta(curr.spend, prev.spend),
        impressions_delta: calcDelta(curr.impressions, prev.impressions),
        clicks_delta: calcDelta(curr.clicks, prev.clicks),
        ctr_delta: calcDelta(currCtr, prevCtr),
        cpl_delta:
          currCpl > 0 && prevCpl > 0 ? calcDelta(currCpl, prevCpl) : null,
        leads_delta: calcDelta(curr.leads, prev.leads),
      };
    }

    // Criativos ARC — fall back to mock if empty
    const criativosARC: CriativoARC[] =
      rawAds.length > 0 ? buildCriativosARC(rawAds) : [];

    // Funil por Anuncio — show if FB ads OR tracking data exists
    const UNATTRIBUTED_INFERRED_ID = "__unattributed_inferred__";
    const baseFunnelAds: FunnelAd[] = hasAnyData
      ? buildFunnelAds(rawAds, trackingMap)
      : [];

    // Injetar entrada de leads "Paid (nao rastreado)" se existirem leads unattributed_inferred
    const unattributedTracking = trackingMap.get(UNATTRIBUTED_INFERRED_ID);
    const funnelAds: FunnelAd[] = [...baseFunnelAds];
    if (unattributedTracking && unattributedTracking.total_leads > 0) {
      const t = unattributedTracking;
      const unattributedFunnelAd: FunnelAd = {
        ad_id: UNATTRIBUTED_INFERRED_ID,
        ad_name: "Paid (nao rastreado)",
        campaign_name: "Instagram — sem UTM de anuncio",
        won_value: t.won_value,
        attribution_level: "unattributed_inferred",
        inferred_leads: t.total_leads,
        steps: [
          {
            key: "ghl_separator",
            label: "── GHL ──",
            value: 0,
            cost_metric: null,
            cost_label: null,
            conversion_rate: null,
            trend: [],
          },
          {
            key: "ghl_leads",
            label: "Leads",
            value: t.total_leads,
            cost_metric: null,
            cost_label: null,
            conversion_rate: null,
            trend: [],
          },
          {
            key: "ghl_em_contato",
            label: "Respondeu",
            value: t.em_contato,
            cost_metric: null,
            cost_label: null,
            conversion_rate:
              t.total_leads > 0
                ? Number(((t.em_contato / t.total_leads) * 100).toFixed(1))
                : null,
            trend: [],
          },
          {
            key: "ghl_agendou",
            label: "Agendou",
            value: t.agendou,
            cost_metric: null,
            cost_label: null,
            conversion_rate:
              t.em_contato > 0
                ? Number(((t.agendou / t.em_contato) * 100).toFixed(1))
                : null,
            trend: [],
          },
          {
            key: "ghl_compareceu",
            label: "Compareceu",
            value: Math.max(t.agendou - t.no_show, 0),
            cost_metric: null,
            cost_label: null,
            conversion_rate:
              t.agendou > 0
                ? Number(
                    (
                      (Math.max(t.agendou - t.no_show, 0) / t.agendou) *
                      100
                    ).toFixed(1),
                  )
                : null,
            trend: [],
          },
          {
            key: "ghl_won",
            label: "Fechou",
            value: t.won,
            cost_metric: null,
            cost_label: null,
            conversion_rate:
              Math.max(t.agendou - t.no_show, 0) > 0
                ? Number(
                    (
                      (t.won / Math.max(t.agendou - t.no_show, 0)) *
                      100
                    ).toFixed(1),
                  )
                : null,
            trend: [],
          },
        ],
      };
      funnelAds.push(unattributedFunnelAd);
    }

    // Conversion time map keyed by ad_id
    const conversionTimeMap: Map<string, ConversionTimeStats> | null =
      rawConversionTime.length > 0
        ? new Map(rawConversionTime.map((r) => [r.ad_id, r]))
        : null;

    return {
      leadScoreRows,
      criativosARC,
      funnelAds,
      accounts,
      periodDeltas,
      conversionTimeMap,
    };
  }, [
    rawAds,
    rawAdsPrev,
    rawTracking,
    rawConversionTime,
    mappedAccounts,
    adNameCache,
  ]);

  // ─── Drill-down: busca leads individuais de um anuncio ──────────────────────
  // Query em 2 etapas: (1) n8n_schedule_tracking, (2) enriquecer com ghl_opportunities
  // Nao usa embedded select porque nao existe FK formal entre as tabelas.

  interface RawScheduleRow {
    unique_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    etapa_funil: string | null;
    created_at: string;
    responded: boolean | null;
  }

  const fetchFunnelLeads = useCallback(
    async (adId: string): Promise<FunnelLead[]> => {
      if (!isSupabaseConfigured()) return [];

      // Step 1: buscar leads da tabela de tracking
      // Nota: unique_id = GHL contact_id (nao existe coluna contact_id separada)
      const { data, error: qErr } = await supabase
        .from("n8n_schedule_tracking")
        .select(
          "unique_id, first_name, last_name, phone, email, etapa_funil, created_at, responded",
        )
        .eq("ad_id", adId)
        .order("created_at", { ascending: false })
        .limit(500);

      if (qErr || !data || data.length === 0) {
        if (qErr)
          console.warn("[MetricsLab] fetchFunnelLeads error:", qErr.message);
        return [];
      }

      const rows = data as unknown as RawScheduleRow[];

      // Step 2: enriquecer com oportunidades GHL (query separada, sem FK)
      const contactIds = rows.map((r) => r.unique_id).filter(Boolean);
      let oppMap = new Map<
        string,
        { status: string; monetary_value: number | null }
      >();

      if (contactIds.length > 0) {
        try {
          const { data: oppData } = await supabase
            .from("ghl_opportunities")
            .select("contact_id, status, monetary_value")
            .in("contact_id", contactIds);

          if (oppData) {
            for (const o of oppData as {
              contact_id: string;
              status: string;
              monetary_value: number | null;
            }[]) {
              // Guardar apenas a primeira oportunidade por contato (ou a won se existir)
              const existing = oppMap.get(o.contact_id);
              if (!existing || o.status === "won") {
                oppMap.set(o.contact_id, {
                  status: o.status,
                  monetary_value: o.monetary_value,
                });
              }
            }
          }
        } catch {
          console.warn(
            "[MetricsLab] ghl_opportunities query falhou — continuando sem dados de oportunidade",
          );
        }
      }

      return rows.map((r) => {
        const opp = oppMap.get(r.unique_id);
        return {
          unique_id: r.unique_id,
          contact_id: r.unique_id,
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
          phone: r.phone ?? null,
          email: r.email ?? null,
          etapa_funil: r.etapa_funil ?? "Novo",
          created_at: r.created_at,
          responded: r.responded ?? null,
          opp_status: opp?.status ?? null,
          monetary_value: opp?.monetary_value
            ? Number(opp.monetary_value)
            : null,
        };
      });
    },
    [],
  );

  return {
    leadScoreRows: computed.leadScoreRows,
    criativosARC: computed.criativosARC,
    funnelAds: computed.funnelAds,
    heatmapData,
    accounts: computed.accounts,
    periodDeltas: computed.periodDeltas,
    conversionTimeMap: computed.conversionTimeMap,
    anomalies: rawAnomalies,
    loading,
    error,
    refetch: fetchData,
    unattributedCount,
    fetchFunnelLeads,
  };
};
