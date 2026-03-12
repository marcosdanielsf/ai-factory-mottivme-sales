import { useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getErrorMessage } from "../lib/getErrorMessage";

export interface CostByAgentMode {
  agent_mode: string;
  modelo_ia: string;
  chamadas: number;
  total_usd: number;
  avg_usd_por_chamada: number;
  total_input: number;
  total_output: number;
}

export interface CostByAgent {
  agent_name: string;
  location_name: string;
  modelo_ia: string;
  chamadas: number;
  total_usd: number;
  avg_usd: number;
  total_input: number;
  total_output: number;
}

export interface CostAbTest {
  ab_variant: string;
  modelo_ia: string;
  chamadas: number;
  total_usd: number;
  avg_usd_por_chamada: number;
  avg_input_tokens: number;
  avg_output_tokens: number;
}

export interface CostByFase {
  fase_detectada: string;
  modelo_ia: string;
  chamadas: number;
  total_usd: number;
  avg_usd: number;
  avg_prompt_chars: number;
}

export interface CostDaily {
  dia: string;
  workflow_name: string | null;
  modelo_ia: string;
  chamadas: number;
  total_usd: number;
}

interface DateRange {
  start: string;
  end: string;
}

interface UseCostAnalyticsReturn {
  byAgentMode: CostByAgentMode[];
  byAgent: CostByAgent[];
  abTest: CostAbTest[];
  byFase: CostByFase[];
  daily: CostDaily[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasData: boolean;
}

export const useCostAnalytics = (
  dateRange?: DateRange,
): UseCostAnalyticsReturn => {
  const [byAgentMode, setByAgentMode] = useState<CostByAgentMode[]>([]);
  const [byAgent, setByAgent] = useState<CostByAgent[]>([]);
  const [abTest, setAbTest] = useState<CostAbTest[]>([]);
  const [byFase, setByFase] = useState<CostByFase[]>([]);
  const [daily, setDaily] = useState<CostDaily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase nao configurado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!dateRange) {
        const [modeRes, agentRes, abRes, faseRes, dailyRes] = await Promise.all(
          [
            supabase.from("vw_costs_by_agent_mode").select("*"),
            supabase.from("vw_costs_by_agent").select("*"),
            supabase.from("vw_costs_ab_test").select("*"),
            supabase.from("vw_costs_by_fase").select("*"),
            supabase.from("vw_costs_daily").select("*").limit(60),
          ],
        );

        if (modeRes.error)
          console.warn("vw_costs_by_agent_mode:", modeRes.error.message);
        if (agentRes.error)
          console.warn("vw_costs_by_agent:", agentRes.error.message);
        if (abRes.error) console.warn("vw_costs_ab_test:", abRes.error.message);
        if (faseRes.error)
          console.warn("vw_costs_by_fase:", faseRes.error.message);
        if (dailyRes.error)
          console.warn("vw_costs_daily:", dailyRes.error.message);

        setByAgentMode(
          (modeRes.data || []).map((r: any) => ({
            agent_mode: r.agent_mode,
            modelo_ia: r.modelo_ia,
            chamadas: r.chamadas || 0,
            total_usd: parseFloat(r.total_usd) || 0,
            avg_usd_por_chamada: parseFloat(r.avg_usd_por_chamada) || 0,
            total_input: r.total_input || 0,
            total_output: r.total_output || 0,
          })),
        );

        setByAgent(
          (agentRes.data || []).map((r: any) => ({
            agent_name: r.agent_name,
            location_name: r.location_name,
            modelo_ia: r.modelo_ia,
            chamadas: r.chamadas || 0,
            total_usd: parseFloat(r.total_usd) || 0,
            avg_usd: parseFloat(r.avg_usd) || 0,
            total_input: r.total_input || 0,
            total_output: r.total_output || 0,
          })),
        );

        setAbTest(
          (abRes.data || []).map((r: any) => ({
            ab_variant: r.ab_variant,
            modelo_ia: r.modelo_ia,
            chamadas: r.chamadas || 0,
            total_usd: parseFloat(r.total_usd) || 0,
            avg_usd_por_chamada: parseFloat(r.avg_usd_por_chamada) || 0,
            avg_input_tokens: r.avg_input_tokens || 0,
            avg_output_tokens: r.avg_output_tokens || 0,
          })),
        );

        setByFase(
          (faseRes.data || []).map((r: any) => ({
            fase_detectada: r.fase_detectada,
            modelo_ia: r.modelo_ia,
            chamadas: r.chamadas || 0,
            total_usd: parseFloat(r.total_usd) || 0,
            avg_usd: parseFloat(r.avg_usd) || 0,
            avg_prompt_chars: r.avg_prompt_chars || 0,
          })),
        );

        setDaily(
          (dailyRes.data || []).map((r: any) => ({
            dia: r.dia,
            workflow_name: r.workflow_name,
            modelo_ia: r.modelo_ia,
            chamadas: r.chamadas || 0,
            total_usd: parseFloat(r.total_usd) || 0,
          })),
        );
        return;
      }

      // Com dateRange: query direta em llm_costs com filtro de data e agregação no frontend
      let allRows: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let q = supabase
          .from("llm_costs")
          .select(
            "agent_mode, agent_name, location_name, modelo_ia, ab_variant, fase_detectada, " +
              "workflow_name, custo_usd, tokens_input, tokens_output, prompt_size_chars, created_at",
          )
          .gte("created_at", dateRange.start)
          .lte("created_at", dateRange.end)
          .range(offset, offset + pageSize - 1);

        const { data, error: qErr } = await q;
        if (qErr) throw qErr;
        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // --- byAgentMode ---
      const modeMap = new Map<string, CostByAgentMode>();
      for (const r of allRows) {
        const k = `${r.agent_mode || "N/A"}||${r.modelo_ia || "N/A"}`;
        const prev = modeMap.get(k) ?? {
          agent_mode: r.agent_mode || "N/A",
          modelo_ia: r.modelo_ia || "N/A",
          chamadas: 0,
          total_usd: 0,
          avg_usd_por_chamada: 0,
          total_input: 0,
          total_output: 0,
        };
        prev.chamadas += 1;
        prev.total_usd += parseFloat(r.custo_usd) || 0;
        prev.total_input += r.tokens_input || 0;
        prev.total_output += r.tokens_output || 0;
        modeMap.set(k, prev);
      }
      setByAgentMode(
        Array.from(modeMap.values()).map((v) => ({
          ...v,
          total_usd: Math.round(v.total_usd * 1e6) / 1e6,
          avg_usd_por_chamada: v.chamadas > 0 ? v.total_usd / v.chamadas : 0,
        })),
      );

      // --- byAgent ---
      const agentMap = new Map<string, CostByAgent>();
      for (const r of allRows) {
        const k = `${r.agent_name || "N/A"}||${r.location_name || "N/A"}||${r.modelo_ia || "N/A"}`;
        const prev = agentMap.get(k) ?? {
          agent_name: r.agent_name || "N/A",
          location_name: r.location_name || "N/A",
          modelo_ia: r.modelo_ia || "N/A",
          chamadas: 0,
          total_usd: 0,
          avg_usd: 0,
          total_input: 0,
          total_output: 0,
        };
        prev.chamadas += 1;
        prev.total_usd += parseFloat(r.custo_usd) || 0;
        prev.total_input += r.tokens_input || 0;
        prev.total_output += r.tokens_output || 0;
        agentMap.set(k, prev);
      }
      setByAgent(
        Array.from(agentMap.values()).map((v) => ({
          ...v,
          total_usd: Math.round(v.total_usd * 1e6) / 1e6,
          avg_usd: v.chamadas > 0 ? v.total_usd / v.chamadas : 0,
        })),
      );

      // --- abTest ---
      const abMap = new Map<
        string,
        CostAbTest & { sum_input: number; sum_output: number }
      >();
      for (const r of allRows) {
        const k = `${r.ab_variant || "N/A"}||${r.modelo_ia || "N/A"}`;
        const prev = abMap.get(k) ?? {
          ab_variant: r.ab_variant || "N/A",
          modelo_ia: r.modelo_ia || "N/A",
          chamadas: 0,
          total_usd: 0,
          avg_usd_por_chamada: 0,
          avg_input_tokens: 0,
          avg_output_tokens: 0,
          sum_input: 0,
          sum_output: 0,
        };
        prev.chamadas += 1;
        prev.total_usd += parseFloat(r.custo_usd) || 0;
        prev.sum_input += r.tokens_input || 0;
        prev.sum_output += r.tokens_output || 0;
        abMap.set(k, prev);
      }
      setAbTest(
        Array.from(abMap.values()).map(({ sum_input, sum_output, ...v }) => ({
          ...v,
          total_usd: Math.round(v.total_usd * 1e6) / 1e6,
          avg_usd_por_chamada: v.chamadas > 0 ? v.total_usd / v.chamadas : 0,
          avg_input_tokens: v.chamadas > 0 ? sum_input / v.chamadas : 0,
          avg_output_tokens: v.chamadas > 0 ? sum_output / v.chamadas : 0,
        })),
      );

      // --- byFase ---
      const faseMap = new Map<string, CostByFase & { sum_prompt: number }>();
      for (const r of allRows) {
        const k = `${r.fase_detectada || "N/A"}||${r.modelo_ia || "N/A"}`;
        const prev = faseMap.get(k) ?? {
          fase_detectada: r.fase_detectada || "N/A",
          modelo_ia: r.modelo_ia || "N/A",
          chamadas: 0,
          total_usd: 0,
          avg_usd: 0,
          avg_prompt_chars: 0,
          sum_prompt: 0,
        };
        prev.chamadas += 1;
        prev.total_usd += parseFloat(r.custo_usd) || 0;
        prev.sum_prompt += r.prompt_size_chars || 0;
        faseMap.set(k, prev);
      }
      setByFase(
        Array.from(faseMap.values()).map(({ sum_prompt, ...v }) => ({
          ...v,
          total_usd: Math.round(v.total_usd * 1e6) / 1e6,
          avg_usd: v.chamadas > 0 ? v.total_usd / v.chamadas : 0,
          avg_prompt_chars: v.chamadas > 0 ? sum_prompt / v.chamadas : 0,
        })),
      );

      // --- daily ---
      const dailyMap = new Map<string, CostDaily>();
      for (const r of allRows) {
        const dia = (r.created_at as string).split("T")[0];
        const k = `${dia}||${r.workflow_name || "N/A"}||${r.modelo_ia || "N/A"}`;
        const prev = dailyMap.get(k) ?? {
          dia,
          workflow_name: r.workflow_name || null,
          modelo_ia: r.modelo_ia || "N/A",
          chamadas: 0,
          total_usd: 0,
        };
        prev.chamadas += 1;
        prev.total_usd += parseFloat(r.custo_usd) || 0;
        dailyMap.set(k, prev);
      }
      setDaily(
        Array.from(dailyMap.values())
          .map((v) => ({
            ...v,
            total_usd: Math.round(v.total_usd * 1e6) / 1e6,
          }))
          .sort((a, b) => a.dia.localeCompare(b.dia)),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dateRange?.start, dateRange?.end]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const hasData =
    byAgentMode.length > 0 ||
    byAgent.length > 0 ||
    abTest.length > 0 ||
    byFase.length > 0;

  return {
    byAgentMode,
    byAgent,
    abTest,
    byFase,
    daily,
    loading,
    error,
    refetch: fetchAll,
    hasData,
  };
};
