// Views: vw_lead_funnel_e2e, vw_reply_rate_by_account, vw_cost_per_lead
import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAccountData } from "./useAccountData";
import { DateRange } from "../components/DateRangePicker";

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export interface IGFunnelStage {
  stage: string;
  count: number;
}

export interface IGReplyRateByAccount {
  approach_type: string;
  month: string;
  total_dms_sent: number;
  total_replied: number;
  total_scheduled: number;
  reply_rate_pct: number;
  schedule_rate_pct: number;
  avg_time_to_reply_hours: number;
  location_id?: string;
}

export interface IGCostPerLead {
  month: string;
  leads_contacted: number;
  leads_replied: number;
  leads_scheduled: number;
  total_ai_cost_usd: number;
  cost_per_lead_contacted_usd: number;
  cost_per_lead_replied_usd: number;
  cost_per_scheduled_usd: number;
  location_id?: string;
}

export interface IGProspectorData {
  funnelStages: IGFunnelStage[];
  replyRates: IGReplyRateByAccount[];
  costPerLead: IGCostPerLead[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// Ordem canonica dos stages do funil
// ============================================================================
const STAGE_ORDER = [
  "prospected",
  "warming",
  "warm",
  "dm_ready",
  "first_contact",
  "replied",
  "won",
  "already_active",
  "lost",
];

// Helper: extrair "YYYY-MM" de uma Date
const toYearMonth = (d: Date): string => d.toISOString().slice(0, 7);

// ============================================================================
// HOOK: useIGProspectorData
// Agrega dados das 3 views Supabase do Instagram Prospector para o dashboard.
// Filtra por activeLocationId quando disponivel (cliente ou admin vendo subconta).
// Usa Promise.allSettled para queries paralelas — falha parcial retorna dados parciais.
//
// IMPORTANTE: vw_lead_funnel_e2e retorna 1 linha por lead (nao agregada).
// O hook agrega em contagens por funnel_stage no frontend.
//
// Parametros opcionais (retroativamente compativel):
//   locationIdOverride — sobrescreve o activeLocationId do contexto
//   dateRange — filtra dados por periodo (FILT-02)
//   stageFilter — filtra funnelStages por stage especifico (FILT-03)
//   Polling automatico 30s sem interacao do usuario (DASH-03)
// ============================================================================

export function useIGProspectorData(
  locationIdOverride?: string | null,
  dateRange?: DateRange | null,
  stageFilter?: string | null,
): IGProspectorData {
  const { activeLocationId } = useAccountData();

  // Use override if explicitly provided (including null for "all"), otherwise fall back to context
  const effectiveLocationId =
    locationIdOverride !== undefined ? locationIdOverride : activeLocationId;

  const [funnelStages, setFunnelStages] = useState<IGFunnelStage[]>([]);
  const [replyRates, setReplyRates] = useState<IGReplyRateByAccount[]>([]);
  const [costPerLead, setCostPerLead] = useState<IGCostPerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Montar queries — adicionar filtro location_id quando effectiveLocationId estiver disponivel
    // NOTA: vw_lead_funnel_e2e retorna 1 row por lead (50k+).
    // Filtramos funnel_stage NOT NULL para pegar apenas leads no pipeline ativo.
    let funnelQuery = supabase
      .from("vw_lead_funnel_e2e")
      .select("funnel_stage")
      .not("funnel_stage", "is", null);
    if (effectiveLocationId) {
      funnelQuery = funnelQuery.eq("location_id", effectiveLocationId);
    }
    // Aplicar filtro de data em vw_lead_funnel_e2e (coluna first_contact_at)
    if (dateRange?.startDate) {
      funnelQuery = funnelQuery.gte(
        "first_contact_at",
        dateRange.startDate.toISOString(),
      );
    }
    if (dateRange?.endDate) {
      funnelQuery = funnelQuery.lte(
        "first_contact_at",
        dateRange.endDate.toISOString(),
      );
    }

    // Montar replyRateQuery com suporte a filtro de data (coluna month)
    let replyRateQuery = effectiveLocationId
      ? supabase
          .from("vw_reply_rate_by_account")
          .select("*")
          .eq("location_id", effectiveLocationId)
      : supabase.from("vw_reply_rate_by_account").select("*");
    if (dateRange?.startDate) {
      replyRateQuery = replyRateQuery.gte(
        "month",
        toYearMonth(dateRange.startDate),
      );
    }
    if (dateRange?.endDate) {
      replyRateQuery = replyRateQuery.lte(
        "month",
        toYearMonth(dateRange.endDate),
      );
    }

    // Montar costQuery com suporte a filtro de data (coluna month)
    let costQuery = effectiveLocationId
      ? supabase
          .from("vw_cost_per_lead")
          .select("*")
          .eq("location_id", effectiveLocationId)
      : supabase.from("vw_cost_per_lead").select("*");
    if (dateRange?.startDate) {
      costQuery = costQuery.gte("month", toYearMonth(dateRange.startDate));
    }
    if (dateRange?.endDate) {
      costQuery = costQuery.lte("month", toYearMonth(dateRange.endDate));
    }

    // Executar 3 queries em paralelo — falha parcial nao bloqueia as demais
    const [funnelResult, replyRateResult, costResult] =
      await Promise.allSettled([funnelQuery, replyRateQuery, costQuery]);

    const errors: string[] = [];

    // Processar vw_lead_funnel_e2e — agregar por funnel_stage
    if (funnelResult.status === "fulfilled") {
      const { data, error: err } = funnelResult.value;
      if (err) {
        console.error("[useIGProspectorData] vw_lead_funnel_e2e error:", err);
        errors.push("vw_lead_funnel_e2e: " + err.message);
      } else {
        // Agregar: contar leads por funnel_stage
        const stageCounts: Record<string, number> = {};
        for (const row of data ?? []) {
          const stage = String(
            (row as Record<string, unknown>).funnel_stage ?? "unknown",
          );
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
        // Ordenar por STAGE_ORDER
        const mapped: IGFunnelStage[] = Object.entries(stageCounts)
          .sort(([a], [b]) => {
            const ia = STAGE_ORDER.indexOf(a);
            const ib = STAGE_ORDER.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          })
          .map(([stage, count]) => ({ stage, count }));
        // Aplicar stageFilter (FILT-03) — filtra stages exibidos no frontend
        const filtered = stageFilter
          ? mapped.filter((s) => s.stage === stageFilter)
          : mapped;
        setFunnelStages(filtered);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_lead_funnel_e2e fetch failed:",
        funnelResult.reason,
      );
      errors.push("vw_lead_funnel_e2e: fetch failed");
    }

    // Processar vw_reply_rate_by_account — campos reais da view
    if (replyRateResult.status === "fulfilled") {
      const { data, error: err } = replyRateResult.value;
      if (err) {
        console.error(
          "[useIGProspectorData] vw_reply_rate_by_account error:",
          err,
        );
        errors.push("vw_reply_rate_by_account: " + err.message);
      } else {
        const mapped: IGReplyRateByAccount[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            approach_type: String(row.approach_type ?? ""),
            month: String(row.month ?? ""),
            total_dms_sent: Number(row.total_dms_sent ?? 0),
            total_replied: Number(row.total_replied ?? 0),
            total_scheduled: Number(row.total_scheduled ?? 0),
            reply_rate_pct: Number(row.reply_rate_pct ?? 0),
            schedule_rate_pct: Number(row.schedule_rate_pct ?? 0),
            avg_time_to_reply_hours: Number(row.avg_time_to_reply_hours ?? 0),
            location_id:
              row.location_id != null ? String(row.location_id) : undefined,
          }),
        );
        setReplyRates(mapped);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_reply_rate_by_account fetch failed:",
        replyRateResult.reason,
      );
      errors.push("vw_reply_rate_by_account: fetch failed");
    }

    // Processar vw_cost_per_lead — campos reais da view
    if (costResult.status === "fulfilled") {
      const { data, error: err } = costResult.value;
      if (err) {
        console.error("[useIGProspectorData] vw_cost_per_lead error:", err);
        errors.push("vw_cost_per_lead: " + err.message);
      } else {
        const mapped: IGCostPerLead[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            month: String(row.month ?? ""),
            leads_contacted: Number(row.leads_contacted ?? 0),
            leads_replied: Number(row.leads_replied ?? 0),
            leads_scheduled: Number(row.leads_scheduled ?? 0),
            total_ai_cost_usd: Number(row.total_ai_cost_usd ?? 0),
            cost_per_lead_contacted_usd: Number(
              row.cost_per_lead_contacted_usd ?? 0,
            ),
            cost_per_lead_replied_usd: Number(
              row.cost_per_lead_replied_usd ?? 0,
            ),
            cost_per_scheduled_usd: Number(row.cost_per_scheduled_usd ?? 0),
            location_id:
              row.location_id != null ? String(row.location_id) : undefined,
          }),
        );
        setCostPerLead(mapped);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_cost_per_lead fetch failed:",
        costResult.reason,
      );
      errors.push("vw_cost_per_lead: fetch failed");
    }

    if (errors.length > 0) {
      setError(errors.join("; "));
    }

    setLoading(false);
  }, [effectiveLocationId, dateRange, stageFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling automatico a cada 30s — DASH-03
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    funnelStages,
    replyRates,
    costPerLead,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useIGProspectorData;
