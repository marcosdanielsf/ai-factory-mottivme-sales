import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ============================================================================
// HOOK: useFunnelMetrics v3.0 — Semantic Layer
// Usa vw_unified_funnel via RPCs get_unified_summary / get_unified_daily
// Fonte unica de verdade: mesmos numeros em todos os dashboards
// Alertas ainda vem de n8n_schedule_tracking (dados de lead individual)
// ============================================================================

export interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

export interface UrgentAlerts {
  leadsSemResposta24h: number;
  followupsFalhados: number;
  leadsEsfriando: number;
  noShows: number;
}

export interface FollowupPerformance {
  locationId: string;
  followUpType: string;
  totalFollowups: number;
  pendentes: number;
  responderam: number;
  taxaResposta: number;
  mediaTentativasResposta: number;
  mediaHorasResposta: number;
}

export interface EngagementMetrics {
  followupsPerLead: number;
  tentativaQueConverte: string;
  taxaResposta: number;
  tempoAteResposta: string;
}

interface FunnelMetricsState {
  funnel: FunnelStage[];
  alerts: UrgentAlerts;
  followupPerformance: FollowupPerformance[];
  engagement: EngagementMetrics;
  loading: boolean;
  error: string | null;
}

type Period = "hoje" | "7d" | "30d" | "90d";

const PERIOD_DAYS: Record<Period, number> = {
  hoje: 0,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const useFunnelMetrics = (
  period: Period = "30d",
  locationId?: string | null,
) => {
  const [state, setState] = useState<FunnelMetricsState>({
    funnel: [],
    alerts: {
      leadsSemResposta24h: 0,
      followupsFalhados: 0,
      leadsEsfriando: 0,
      noShows: 0,
    },
    followupPerformance: [],
    engagement: {
      followupsPerLead: 0,
      tentativaQueConverte: "-",
      taxaResposta: 0,
      tempoAteResposta: "-",
    },
    loading: true,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case "hoje":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const dateFrom = startDate.toISOString().split("T")[0];
      const dateTo = now.toISOString().split("T")[0];

      // ========================================
      // FONTE UNICA: vw_unified_funnel via RPC
      // ========================================
      let totalLeads = 0;
      let responderam = 0;
      let agendaram = 0;
      let compareceram = 0;
      let fecharam = 0;

      if (locationId) {
        // Single location: use RPC
        const { data, error: rpcError } = await supabase.rpc(
          "get_unified_summary",
          {
            p_location_id: locationId,
            p_date_from: dateFrom,
            p_date_to: dateTo,
          },
        );
        if (rpcError) throw rpcError;
        const row = data?.[0];
        if (row) {
          totalLeads = Number(row.total_leads) || 0;
          responderam = Number(row.responderam) || 0;
          agendaram = Number(row.agendaram) || 0;
          compareceram = Number(row.compareceram) || 0;
          fecharam = Number(row.fecharam) || 0;
        }
      } else {
        // All locations: query view directly with date filter
        const { data, error: viewError } = await supabase
          .from("vw_unified_funnel")
          .select("total_leads, responderam, agendaram, compareceram, fecharam")
          .gte("dia", dateFrom)
          .lte("dia", dateTo);
        if (viewError) throw viewError;
        if (data) {
          for (const row of data) {
            totalLeads += Number(row.total_leads) || 0;
            responderam += Number(row.responderam) || 0;
            agendaram += Number(row.agendaram) || 0;
            compareceram += Number(row.compareceram) || 0;
            fecharam += Number(row.fecharam) || 0;
          }
        }
      }

      const funnelData: FunnelStage[] = [
        { stage: "Leads Novos", count: totalLeads, color: "#3b82f6" },
        { stage: "Responderam", count: responderam, color: "#6366f1" },
        { stage: "Agendaram", count: agendaram, color: "#8b5cf6" },
        { stage: "Compareceram", count: compareceram, color: "#a855f7" },
        { stage: "Fecharam", count: fecharam, color: "#22c55e" },
      ];

      // ========================================
      // ALERTAS: dados de lead individual
      // ========================================
      const oneDayAgo = new Date(
        now.getTime() - 24 * 60 * 60 * 1000,
      ).toISOString();
      const twoDaysAgo = new Date(
        now.getTime() - 48 * 60 * 60 * 1000,
      ).toISOString();

      let alertQuery = supabase
        .from("n8n_schedule_tracking")
        .select("etapa_funil, responded, created_at, ativo")
        .gte("created_at", startDate.toISOString());

      if (locationId) {
        alertQuery = alertQuery.eq("location_id", locationId);
      }

      const { data: alertData } = await alertQuery;

      let semResposta24h = 0;
      let perdidos = 0;
      let esfriando = 0;
      let noShows = 0;

      if (alertData) {
        for (const lead of alertData) {
          const etapa = (lead.etapa_funil || "").toLowerCase();
          if (etapa === "novo" && lead.created_at < oneDayAgo) semResposta24h++;
          if (etapa === "perdido") perdidos++;
          if (
            etapa === "novo" &&
            lead.ativo === true &&
            lead.created_at < twoDaysAgo
          )
            esfriando++;
          if (etapa === "no-show") noShows++;
        }
      }

      const alertsData: UrgentAlerts = {
        leadsSemResposta24h: semResposta24h,
        followupsFalhados: perdidos,
        leadsEsfriando: esfriando,
        noShows: noShows,
      };

      // ========================================
      // Engagement metrics (derived from funnel)
      // ========================================
      const taxaResposta =
        totalLeads > 0 ? Math.round((responderam / totalLeads) * 100) : 0;

      let tentativaQueConverte = "-";
      if (taxaResposta > 50) tentativaQueConverte = "1a";
      else if (taxaResposta > 30) tentativaQueConverte = "2a";
      else if (taxaResposta > 15) tentativaQueConverte = "3a";
      else if (taxaResposta > 5) tentativaQueConverte = "4a+";

      const performance: FollowupPerformance[] = [
        {
          locationId: locationId || "all",
          followUpType: "multi-channel",
          totalFollowups: totalLeads,
          pendentes: Math.max(0, totalLeads - responderam),
          responderam,
          taxaResposta,
          mediaTentativasResposta:
            taxaResposta > 0 ? parseFloat((100 / taxaResposta).toFixed(1)) : 0,
          mediaHorasResposta: 24,
        },
      ];

      const engagement: EngagementMetrics = {
        followupsPerLead:
          totalLeads > 0
            ? parseFloat((responderam / totalLeads).toFixed(1))
            : 0,
        tentativaQueConverte,
        taxaResposta,
        tempoAteResposta: "24h",
      };

      setState({
        funnel: funnelData,
        alerts: alertsData,
        followupPerformance: performance,
        engagement,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Erro ao buscar metricas do funil:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, [period, locationId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...state,
    refetch: fetchMetrics,
  };
};

export default useFunnelMetrics;
