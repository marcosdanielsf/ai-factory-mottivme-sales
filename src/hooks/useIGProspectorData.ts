// Views: vw_lead_funnel_e2e, vw_reply_rate_by_account, vw_cost_per_lead
import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAccountData } from "./useAccountData";

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export interface IGFunnelStage {
  stage: string;
  count: number;
  ig_account?: string;
  location_id?: string;
}

export interface IGReplyRateByAccount {
  ig_account: string;
  dms_sent: number;
  replies: number;
  reply_rate: number;
  location_id?: string;
}

export interface IGCostPerLead {
  ig_account: string;
  total_cost: number;
  leads_count: number;
  cost_per_lead: number;
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
// HOOK: useIGProspectorData
// Agrega dados das 3 views Supabase do Instagram Prospector para o dashboard.
// Filtra por activeLocationId quando disponivel (cliente ou admin vendo subconta).
// Usa Promise.allSettled para queries paralelas — falha parcial retorna dados parciais.
// ============================================================================

export function useIGProspectorData(): IGProspectorData {
  const { activeLocationId } = useAccountData();

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

    // Montar queries — adicionar filtro location_id quando activeLocationId estiver disponivel
    const funnelQuery = activeLocationId
      ? supabase
          .from("vw_lead_funnel_e2e")
          .select("*")
          .eq("location_id", activeLocationId)
      : supabase.from("vw_lead_funnel_e2e").select("*");

    const replyRateQuery = activeLocationId
      ? supabase
          .from("vw_reply_rate_by_account")
          .select("*")
          .eq("location_id", activeLocationId)
      : supabase.from("vw_reply_rate_by_account").select("*");

    const costQuery = activeLocationId
      ? supabase
          .from("vw_cost_per_lead")
          .select("*")
          .eq("location_id", activeLocationId)
      : supabase.from("vw_cost_per_lead").select("*");

    // Executar 3 queries em paralelo — falha parcial nao bloqueia as demais
    const [funnelResult, replyRateResult, costResult] =
      await Promise.allSettled([funnelQuery, replyRateQuery, costQuery]);

    const errors: string[] = [];

    // Processar vw_lead_funnel_e2e
    if (funnelResult.status === "fulfilled") {
      const { data, error: err } = funnelResult.value;
      if (err) {
        console.error("[useIGProspectorData] vw_lead_funnel_e2e error:", err);
        errors.push("vw_lead_funnel_e2e: " + err.message);
      } else {
        const mapped: IGFunnelStage[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            stage: String(row.stage ?? ""),
            count: Number(row.count ?? 0),
            ig_account:
              row.ig_account != null ? String(row.ig_account) : undefined,
            location_id:
              row.location_id != null ? String(row.location_id) : undefined,
          }),
        );
        setFunnelStages(mapped);
      }
    } else {
      console.error(
        "[useIGProspectorData] vw_lead_funnel_e2e fetch failed:",
        funnelResult.reason,
      );
      errors.push("vw_lead_funnel_e2e: fetch failed");
    }

    // Processar vw_reply_rate_by_account
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
            ig_account: String(row.ig_account ?? ""),
            dms_sent: Number(row.dms_sent ?? 0),
            replies: Number(row.replies ?? 0),
            reply_rate: Number(row.reply_rate ?? 0),
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

    // Processar vw_cost_per_lead
    if (costResult.status === "fulfilled") {
      const { data, error: err } = costResult.value;
      if (err) {
        console.error("[useIGProspectorData] vw_cost_per_lead error:", err);
        errors.push("vw_cost_per_lead: " + err.message);
      } else {
        const mapped: IGCostPerLead[] = (data ?? []).map(
          (row: Record<string, unknown>) => ({
            ig_account: String(row.ig_account ?? ""),
            total_cost: Number(row.total_cost ?? 0),
            leads_count: Number(row.leads_count ?? 0),
            cost_per_lead: Number(row.cost_per_lead ?? 0),
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
  }, [activeLocationId]);

  useEffect(() => {
    fetchData();
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
