import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { CjmStageConfig } from "../types/cjm";

export const useCjmStageConfig = (locationId?: string | null) => {
  const [stageConfigs, setStageConfigs] = useState<CjmStageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("cjm_stage_config")
        .select("*")
        .order("pipeline_id")
        .order("stage_order");

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setStageConfigs((data || []) as CjmStageConfig[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar stage configs";
      console.error("useCjmStageConfig error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const updateStageConfig = useCallback(
    async (id: string, changes: Partial<CjmStageConfig>) => {
      // Optimistic update
      setStageConfigs((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...changes } : s)),
      );

      const { error: updateError } = await supabase
        .from("cjm_stage_config")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        console.error("useCjmStageConfig update error:", updateError);
        // Rollback: refetch from DB
        fetchConfigs();
      }
    },
    [fetchConfigs],
  );

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    stageConfigs,
    updateStageConfig,
    loading,
    error,
    refetch: fetchConfigs,
  };
};
