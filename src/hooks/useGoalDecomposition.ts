/**
 * useGoalDecomposition — Hook para Goal Decomposer
 *
 * CRUD completo: fetch, decompose (IA), confirm (bulk insert), update KR, cascade
 * Tabelas: goal_decompositions, business_okrs, business_key_results,
 *          business_suggested_funnels, business_actions, vertical_benchmarks
 */

import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  decomposeGoal,
  type DecomposeInput,
  type DecomposeResult,
  type DecomposeOKR,
  type Benchmark,
} from "../lib/goal-decomposer";

// =============================================================
// Types (DB rows)
// =============================================================

export interface GoalDecomposition {
  id: string;
  location_id: string;
  year: number;
  annual_target: number;
  business_model: string;
  monthly_distribution:
    | { month: number; target: number; reasoning: string }[]
    | null;
  ai_config: Record<string, unknown> | null;
  progress_percentage: number;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessOKR {
  id: string;
  decomposition_id: string;
  location_id: string;
  title: string;
  description: string | null;
  quarter: number;
  year: number;
  category: string | null;
  progress_percentage: number;
  is_achieved: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined
  key_results?: BusinessKeyResult[];
  funnels?: BusinessFunnel[];
  actions?: BusinessAction[];
}

export interface BusinessKeyResult {
  id: string;
  okr_id: string;
  location_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  data_source: string | null;
  data_source_config: Record<string, unknown> | null;
  benchmark_value: number | null;
  benchmark_label: string | null;
  progress_percentage: number;
  status: string;
  is_achieved: boolean;
  sort_order: number;
}

export interface BusinessFunnel {
  id: string;
  okr_id: string;
  location_id: string;
  funnel_type: string;
  channel: string | null;
  suggested_budget: number | null;
  expected_leads: number | null;
  expected_conversion_rate: number | null;
  is_active: boolean;
  notes: string | null;
}

export interface BusinessAction {
  id: string;
  okr_id: string;
  location_id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
}

// =============================================================
// Hook
// =============================================================

export function useGoalDecomposition(locationId: string | null) {
  const [decomposition, setDecomposition] = useState<GoalDecomposition | null>(
    null,
  );
  const [okrs, setOkrs] = useState<BusinessOKR[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------
  // Fetch decomposition + OKRs + KRs + Funnels + Actions
  // -----------------------------------------------------------
  const fetchDecomposition = useCallback(async () => {
    if (!locationId) return;
    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();

      // Fetch decomposition for current year
      const { data: decomp, error: decompErr } = await supabase
        .from("goal_decompositions")
        .select("*")
        .eq("location_id", locationId)
        .eq("year", currentYear)
        .maybeSingle();

      if (decompErr) throw decompErr;

      if (!decomp) {
        setDecomposition(null);
        setOkrs([]);
        setLoading(false);
        return;
      }

      setDecomposition(decomp);

      // Fetch OKRs with nested data
      const { data: okrRows, error: okrErr } = await supabase
        .from("business_okrs")
        .select("*")
        .eq("decomposition_id", decomp.id)
        .order("quarter", { ascending: true })
        .order("sort_order", { ascending: true });

      if (okrErr) throw okrErr;
      if (!okrRows?.length) {
        setOkrs([]);
        setLoading(false);
        return;
      }

      const okrIds = okrRows.map((o) => o.id);

      // Fetch KRs, Funnels, Actions in parallel
      const [krsRes, funnelsRes, actionsRes] = await Promise.all([
        supabase
          .from("business_key_results")
          .select("*")
          .in("okr_id", okrIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("business_suggested_funnels")
          .select("*")
          .in("okr_id", okrIds),
        supabase
          .from("business_actions")
          .select("*")
          .in("okr_id", okrIds)
          .order("priority", { ascending: true }),
      ]);

      if (krsRes.error) throw krsRes.error;
      if (funnelsRes.error) throw funnelsRes.error;
      if (actionsRes.error) throw actionsRes.error;

      // Group by OKR
      const enrichedOkrs: BusinessOKR[] = okrRows.map((okr) => ({
        ...okr,
        key_results: (krsRes.data || []).filter((kr) => kr.okr_id === okr.id),
        funnels: (funnelsRes.data || []).filter((f) => f.okr_id === okr.id),
        actions: (actionsRes.data || []).filter((a) => a.okr_id === okr.id),
      }));

      setOkrs(enrichedOkrs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar decomposicao",
      );
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // -----------------------------------------------------------
  // Fetch benchmarks
  // -----------------------------------------------------------
  const fetchBenchmarks = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("vertical_benchmarks")
      .select("*");

    if (!err && data) setBenchmarks(data);
  }, []);

  // -----------------------------------------------------------
  // Auto-fetch on mount / location change
  // -----------------------------------------------------------
  useEffect(() => {
    fetchDecomposition();
    fetchBenchmarks();
  }, [fetchDecomposition, fetchBenchmarks]);

  // -----------------------------------------------------------
  // Decompose with AI (returns result for editing before confirm)
  // -----------------------------------------------------------
  const decompose = useCallback(
    async (input: DecomposeInput): Promise<DecomposeResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await decomposeGoal(input, benchmarks);
        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro na decomposicao IA";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [benchmarks],
  );

  // -----------------------------------------------------------
  // Confirm decomposition (bulk insert to Supabase)
  // -----------------------------------------------------------
  const confirmDecomposition = useCallback(
    async (input: DecomposeInput, result: DecomposeResult): Promise<string> => {
      if (!locationId) throw new Error("location_id obrigatorio");
      setLoading(true);
      setError(null);

      try {
        const currentYear = new Date().getFullYear();

        // 1. Upsert goal_decompositions
        const { data: decomp, error: decompErr } = await supabase
          .from("goal_decompositions")
          .upsert(
            {
              location_id: locationId,
              year: currentYear,
              annual_target: input.annual_target,
              business_model: input.business_model,
              monthly_distribution: result.monthly_distribution,
              ai_config: {
                model: "gemini-2.0-flash",
                temperature: 0.7,
                timestamp: new Date().toISOString(),
                benchmarks_used:
                  benchmarks.filter(
                    (b) => b.business_model === input.business_model,
                  ).length > 0,
              },
              progress_percentage: 0,
              is_achieved: false,
            },
            { onConflict: "location_id,year" },
          )
          .select("id")
          .single();

        if (decompErr || !decomp)
          throw decompErr || new Error("Falha ao salvar decomposicao");

        const decompId = decomp.id;

        // 2. Delete existing OKRs (cascade deletes KRs, Funnels, Actions)
        await supabase
          .from("business_okrs")
          .delete()
          .eq("decomposition_id", decompId);

        // 3. Insert OKRs sequentially (need IDs for children)
        for (let oi = 0; oi < result.okrs.length; oi++) {
          const okr: DecomposeOKR = result.okrs[oi];

          const { data: okrRow, error: okrErr } = await supabase
            .from("business_okrs")
            .insert({
              decomposition_id: decompId,
              location_id: locationId,
              title: okr.title,
              description: okr.description || null,
              quarter: okr.quarter,
              year: currentYear,
              category: okr.category,
              progress_percentage: 0,
              is_achieved: false,
              sort_order: oi,
            })
            .select("id")
            .single();

          if (okrErr || !okrRow)
            throw okrErr || new Error(`Falha ao salvar OKR: ${okr.title}`);
          const okrId = okrRow.id;

          // 4. Insert Key Results
          if (okr.key_results?.length) {
            const krRows = okr.key_results.map((kr, ki) => ({
              okr_id: okrId,
              location_id: locationId,
              title: kr.title,
              target_value: kr.target,
              current_value: 0,
              unit: kr.unit,
              data_source: kr.data_source || "manual",
              data_source_config: null,
              benchmark_value: kr.benchmark || null,
              benchmark_label: kr.benchmark_label || null,
              progress_percentage: 0,
              status: "no_data",
              is_achieved: false,
              sort_order: ki,
            }));

            const { error: krErr } = await supabase
              .from("business_key_results")
              .insert(krRows);

            if (krErr) throw krErr;
          }

          // 5. Insert Funnels
          if (okr.funnels?.length) {
            const funnelRows = okr.funnels.map((f) => ({
              okr_id: okrId,
              location_id: locationId,
              funnel_type: f.type,
              channel: f.channel || null,
              suggested_budget: f.budget,
              expected_leads: f.expected_leads,
              expected_conversion_rate: f.conversion_rate,
              is_active: false,
              notes: null,
            }));

            const { error: funnelErr } = await supabase
              .from("business_suggested_funnels")
              .insert(funnelRows);

            if (funnelErr) throw funnelErr;
          }

          // 6. Insert Actions
          if (okr.actions?.length) {
            const actionRows = okr.actions.map((a) => ({
              okr_id: okrId,
              location_id: locationId,
              title: a.title,
              description: a.description || null,
              priority: a.priority || "p3",
              status: "pending",
              due_date: null,
            }));

            const { error: actionErr } = await supabase
              .from("business_actions")
              .insert(actionRows);

            if (actionErr) throw actionErr;
          }
        }

        // 7. Refetch
        await fetchDecomposition();

        return decompId;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao confirmar decomposicao";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [locationId, benchmarks, fetchDecomposition],
  );

  // -----------------------------------------------------------
  // Update KR current_value + trigger cascade
  // -----------------------------------------------------------
  const updateKeyResult = useCallback(
    async (krId: string, currentValue: number) => {
      setError(null);

      try {
        // Update current_value
        const { error: updateErr } = await supabase
          .from("business_key_results")
          .update({ current_value: currentValue })
          .eq("id", krId);

        if (updateErr) throw updateErr;

        // Trigger cascade via RPC
        const { error: cascadeErr } = await supabase.rpc(
          "cascade_kr_progress",
          { p_kr_id: krId },
        );

        if (cascadeErr) throw cascadeErr;

        // Refetch to sync UI
        await fetchDecomposition();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar KR");
        throw err;
      }
    },
    [fetchDecomposition],
  );

  // -----------------------------------------------------------
  // Toggle funnel active/inactive
  // -----------------------------------------------------------
  const toggleFunnel = useCallback(
    async (funnelId: string, isActive: boolean) => {
      const { error: err } = await supabase
        .from("business_suggested_funnels")
        .update({ is_active: isActive })
        .eq("id", funnelId);

      if (err) {
        setError(err.message);
        return;
      }
      await fetchDecomposition();
    },
    [fetchDecomposition],
  );

  // -----------------------------------------------------------
  // Update action status
  // -----------------------------------------------------------
  const updateAction = useCallback(
    async (actionId: string, status: string) => {
      const { error: err } = await supabase
        .from("business_actions")
        .update({ status })
        .eq("id", actionId);

      if (err) {
        setError(err.message);
        return;
      }
      await fetchDecomposition();
    },
    [fetchDecomposition],
  );

  // -----------------------------------------------------------
  // Delete decomposition (cascade deletes everything)
  // -----------------------------------------------------------
  const deleteDecomposition = useCallback(async () => {
    if (!decomposition) return;

    const { error: err } = await supabase
      .from("goal_decompositions")
      .delete()
      .eq("id", decomposition.id);

    if (err) {
      setError(err.message);
      return;
    }

    setDecomposition(null);
    setOkrs([]);
  }, [decomposition]);

  return {
    // State
    decomposition,
    okrs,
    benchmarks,
    loading,
    error,

    // Actions
    decompose,
    confirmDecomposition,
    updateKeyResult,
    toggleFunnel,
    updateAction,
    deleteDecomposition,
    refetch: fetchDecomposition,
  };
}
