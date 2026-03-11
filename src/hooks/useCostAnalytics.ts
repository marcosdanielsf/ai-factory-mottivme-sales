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

export const useCostAnalytics = (): UseCostAnalyticsReturn => {
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

      const [modeRes, agentRes, abRes, faseRes, dailyRes] = await Promise.all([
        supabase.from("vw_costs_by_agent_mode").select("*"),
        supabase.from("vw_costs_by_agent").select("*"),
        supabase.from("vw_costs_ab_test").select("*"),
        supabase.from("vw_costs_by_fase").select("*"),
        supabase.from("vw_costs_daily").select("*").limit(60),
      ]);

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
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
