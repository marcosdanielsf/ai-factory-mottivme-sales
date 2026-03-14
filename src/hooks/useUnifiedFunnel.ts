import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

export interface UnifiedDailyRow {
  dia: string;
  gasto: number;
  impressoes: number;
  cliques: number;
  mensagens: number;
  ctr: number;
  tx_conversao_msg: number;
  total_leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  receita: number;
  cpl: number | null;
  cpa: number | null;
  roas: number;
}

export interface UnifiedSummary {
  location_id: string;
  dias_com_dados: number;
  primeiro_dia: string;
  ultimo_dia: string;
  gasto_total: number;
  impressoes_total: number;
  cliques_total: number;
  mensagens_total: number;
  total_leads: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
  receita_total: number;
  tx_resposta: number;
  tx_agendamento: number;
  tx_comparecimento: number;
  tx_fechamento: number;
  cpl: number | null;
  cpa: number | null;
  roas: number;
  ctr: number;
}

interface UseUnifiedFunnelOptions {
  locationId: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  periodDays?: number;
}

export function useUnifiedFunnel({
  locationId,
  dateFrom,
  dateTo,
  periodDays = 30,
}: UseUnifiedFunnelOptions) {
  const [daily, setDaily] = useState<UnifiedDailyRow[]>([]);
  const [summary, setSummary] = useState<UnifiedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveDateFrom = useMemo(() => {
    if (dateFrom) return dateFrom.toISOString().split("T")[0];
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    return d.toISOString().split("T")[0];
  }, [dateFrom, periodDays]);

  const effectiveDateTo = useMemo(() => {
    if (dateTo) return dateTo.toISOString().split("T")[0];
    return new Date().toISOString().split("T")[0];
  }, [dateTo]);

  useEffect(() => {
    if (!locationId) {
      setDaily([]);
      setSummary(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [dailyRes, summaryRes] = await Promise.all([
          supabase.rpc("get_unified_daily", {
            p_location_id: locationId,
            p_date_from: effectiveDateFrom,
            p_date_to: effectiveDateTo,
          }),
          supabase.rpc("get_unified_summary", {
            p_location_id: locationId,
            p_date_from: effectiveDateFrom,
            p_date_to: effectiveDateTo,
          }),
        ]);

        if (cancelled) return;

        if (dailyRes.error) throw dailyRes.error;
        if (summaryRes.error) throw summaryRes.error;

        const dailyData = (dailyRes.data || []).map(
          (row: Record<string, unknown>) => ({
            ...row,
            gasto: Number(row.gasto) || 0,
            impressoes: Number(row.impressoes) || 0,
            cliques: Number(row.cliques) || 0,
            mensagens: Number(row.mensagens) || 0,
            ctr: Number(row.ctr) || 0,
            tx_conversao_msg: Number(row.tx_conversao_msg) || 0,
            total_leads: Number(row.total_leads) || 0,
            responderam: Number(row.responderam) || 0,
            agendaram: Number(row.agendaram) || 0,
            compareceram: Number(row.compareceram) || 0,
            fecharam: Number(row.fecharam) || 0,
            receita: Number(row.receita) || 0,
            cpl: row.cpl != null ? Number(row.cpl) : null,
            cpa: row.cpa != null ? Number(row.cpa) : null,
            roas: Number(row.roas) || 0,
          }),
        ) as UnifiedDailyRow[];

        setDaily(dailyData);

        const summaryRow = summaryRes.data?.[0];
        if (summaryRow) {
          setSummary({
            ...summaryRow,
            gasto_total: Number(summaryRow.gasto_total) || 0,
            impressoes_total: Number(summaryRow.impressoes_total) || 0,
            cliques_total: Number(summaryRow.cliques_total) || 0,
            mensagens_total: Number(summaryRow.mensagens_total) || 0,
            total_leads: Number(summaryRow.total_leads) || 0,
            responderam: Number(summaryRow.responderam) || 0,
            agendaram: Number(summaryRow.agendaram) || 0,
            compareceram: Number(summaryRow.compareceram) || 0,
            fecharam: Number(summaryRow.fecharam) || 0,
            receita_total: Number(summaryRow.receita_total) || 0,
            tx_resposta: Number(summaryRow.tx_resposta) || 0,
            tx_agendamento: Number(summaryRow.tx_agendamento) || 0,
            tx_comparecimento: Number(summaryRow.tx_comparecimento) || 0,
            tx_fechamento: Number(summaryRow.tx_fechamento) || 0,
            cpl: summaryRow.cpl != null ? Number(summaryRow.cpl) : null,
            cpa: summaryRow.cpa != null ? Number(summaryRow.cpa) : null,
            roas: Number(summaryRow.roas) || 0,
            ctr: Number(summaryRow.ctr) || 0,
          } as UnifiedSummary);
        } else {
          setSummary(null);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error("useUnifiedFunnel error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [locationId, effectiveDateFrom, effectiveDateTo]);

  return { daily, summary, loading, error };
}
