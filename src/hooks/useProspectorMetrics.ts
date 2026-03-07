import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { DateRange } from "../components/DateRangePicker";

// ============================================================================
// HOOK: useProspectorMetrics
// Agrega metricas de engajamento do Instagram Prospector por conta IG
// Campos usados: ig_account, funnel_stage, likes_given, comments_given,
//                story_replies_given
// Tabela: growth_leads
// ============================================================================

export interface ProspectorAccountMetrics {
  ig_account: string;
  dms_sent: number;
  total_likes: number;
  total_comments: number;
  total_story_replies: number;
  total_processed: number;
  total_actions: number; // likes + comments + story_replies + dms_sent
}

export interface ProspectorMetrics {
  accounts: ProspectorAccountMetrics[];
  totals: {
    dms_sent: number;
    total_likes: number;
    total_comments: number;
    total_story_replies: number;
    total_actions: number;
  };
  loading: boolean;
  refetch: () => void;
}

const EMPTY_TOTALS = {
  dms_sent: 0,
  total_likes: 0,
  total_comments: 0,
  total_story_replies: 0,
  total_actions: 0,
};

export function useProspectorMetrics(dateRange: DateRange): ProspectorMetrics {
  const [accounts, setAccounts] = useState<ProspectorAccountMetrics[]>([]);
  const [totals, setTotals] = useState({ ...EMPTY_TOTALS });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const startDate =
      dateRange?.startDate ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d;
      })();

    const endDate =
      dateRange?.endDate ||
      (() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
      })();

    try {
      setLoading(true);

      // Fetch apenas os campos necessarios — tabela ~130K rows, filtrar por range
      const { data, error } = await supabase
        .from("growth_leads")
        .select(
          "ig_account,funnel_stage,likes_given,comments_given,story_replies_given",
        )
        .not("ig_account", "is", null)
        .gte("updated_at", startDate.toISOString())
        .lte("updated_at", endDate.toISOString());

      if (error) {
        console.error("[useProspectorMetrics] Supabase error:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setAccounts([]);
        setTotals({ ...EMPTY_TOTALS });
        setLoading(false);
        return;
      }

      // Agregacao client-side por ig_account
      const accountMap = new Map<
        string,
        {
          dms_sent: number;
          total_likes: number;
          total_comments: number;
          total_story_replies: number;
          total_processed: number;
        }
      >();

      for (const row of data) {
        const account = row.ig_account as string;
        if (!account) continue;

        if (!accountMap.has(account)) {
          accountMap.set(account, {
            dms_sent: 0,
            total_likes: 0,
            total_comments: 0,
            total_story_replies: 0,
            total_processed: 0,
          });
        }

        const entry = accountMap.get(account)!;
        entry.total_processed++;

        if (row.funnel_stage === "contacted") {
          entry.dms_sent++;
        }

        entry.total_likes += (row.likes_given as number) || 0;
        entry.total_comments += (row.comments_given as number) || 0;
        entry.total_story_replies += (row.story_replies_given as number) || 0;
      }

      // Converter para array com total_actions calculado
      const accountsArray: ProspectorAccountMetrics[] = Array.from(
        accountMap.entries(),
      )
        .map(([ig_account, metrics]) => ({
          ig_account,
          ...metrics,
          total_actions:
            metrics.dms_sent +
            metrics.total_likes +
            metrics.total_comments +
            metrics.total_story_replies,
        }))
        .sort((a, b) => b.total_actions - a.total_actions);

      // Calcular totais globais
      const newTotals = accountsArray.reduce(
        (acc, a) => ({
          dms_sent: acc.dms_sent + a.dms_sent,
          total_likes: acc.total_likes + a.total_likes,
          total_comments: acc.total_comments + a.total_comments,
          total_story_replies: acc.total_story_replies + a.total_story_replies,
          total_actions: acc.total_actions + a.total_actions,
        }),
        { ...EMPTY_TOTALS },
      );

      setAccounts(accountsArray);
      setTotals(newTotals);
    } catch (err) {
      console.error("[useProspectorMetrics] Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.startDate?.getTime(), dateRange?.endDate?.getTime()]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { accounts, totals, loading, refetch: fetchData };
}

export default useProspectorMetrics;
