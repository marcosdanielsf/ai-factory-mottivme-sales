import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ============================================================================
// Types
// ============================================================================

export interface ClientHealth {
  location_id: string;
  agent_name: string;
  is_active: boolean;
  score_overall: number;
  score_engagement: number;
  score_scheduling: number;
  score_satisfaction: number;
  score_activity: number;
  score_payment: number;
  risk_level: "critical" | "at_risk" | "healthy" | "excellent";
  total_leads_30d: number;
  leads_responded_30d: number;
  leads_scheduled_30d: number;
  leads_last_7d: number;
  last_lead_at: string | null;
}

export interface HealthSnapshot {
  snapshot_date: string;
  score_overall: number;
  score_engagement: number;
  score_scheduling: number;
  score_satisfaction: number;
  score_activity: number;
  score_payment: number;
}

export interface HealthSummary {
  totalClients: number;
  excellent: number;
  healthy: number;
  atRisk: number;
  critical: number;
  avgScore: number;
}

interface UseHealthScoreReturn {
  clients: ClientHealth[];
  summary: HealthSummary;
  history: HealthSnapshot[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  saveManualInput: (
    locationId: string,
    dimension: "satisfaction" | "payment",
    score: number,
    notes?: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

// ============================================================================
// Hook
// ============================================================================

export function useHealthScore(): UseHealthScoreReturn {
  const [clients, setClients] = useState<ClientHealth[]>([]);
  const [history, setHistory] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch health scores from view
      const { data, error: fetchError } = await supabase
        .from("vw_client_health_score")
        .select("*")
        .order("score_overall", { ascending: false });

      if (fetchError) throw fetchError;

      setClients((data as ClientHealth[]) ?? []);

      // Fetch history snapshots (last 30 days, aggregated)
      const { data: snapData, error: snapError } = await supabase
        .from("client_health_snapshots")
        .select(
          "snapshot_date, score_overall, score_engagement, score_scheduling, score_satisfaction, score_activity, score_payment",
        )
        .gte(
          "snapshot_date",
          new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        )
        .order("snapshot_date", { ascending: true });

      if (snapError) {
        console.warn("Erro ao carregar historico de snapshots:", snapError);
      }

      if (snapData && snapData.length > 0) {
        // Aggregate by date: accumulate sum + count, then compute average
        const accum = new Map<
          string,
          { sum: number; count: number; row: HealthSnapshot }
        >();
        for (const row of snapData) {
          const entry = accum.get(row.snapshot_date);
          if (!entry) {
            accum.set(row.snapshot_date, {
              sum: row.score_overall,
              count: 1,
              row: row as HealthSnapshot,
            });
          } else {
            entry.sum += row.score_overall;
            entry.count += 1;
          }
        }
        const averaged: HealthSnapshot[] = [];
        for (const [, entry] of accum) {
          averaged.push({
            ...entry.row,
            score_overall: Math.round((entry.sum / entry.count) * 10) / 10,
          });
        }
        setHistory(averaged);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar health scores",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary: HealthSummary = {
    totalClients: clients.length,
    excellent: clients.filter((c) => c.risk_level === "excellent").length,
    healthy: clients.filter((c) => c.risk_level === "healthy").length,
    atRisk: clients.filter((c) => c.risk_level === "at_risk").length,
    critical: clients.filter((c) => c.risk_level === "critical").length,
    avgScore:
      clients.length > 0
        ? Math.round(
            clients.reduce((sum, c) => sum + c.score_overall, 0) /
              clients.length,
          )
        : 0,
  };

  const saveManualInput = useCallback(
    async (
      locationId: string,
      dimension: "satisfaction" | "payment",
      score: number,
      notes?: string,
    ) => {
      try {
        const { error: rpcError } = await supabase.rpc(
          "save_health_manual_input",
          {
            p_location_id: locationId,
            p_dimension: dimension,
            p_score: score,
            p_notes: notes ?? null,
          },
        );

        if (rpcError) throw rpcError;

        // Refresh data after saving
        await fetchData();
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao salvar",
        };
      }
    },
    [fetchData],
  );

  return {
    clients,
    summary,
    history,
    loading,
    error,
    refresh: fetchData,
    saveManualInput,
  };
}
