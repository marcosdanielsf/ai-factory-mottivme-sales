import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface DropOffRow {
  location_id: string;
  pipeline_id: string;
  stage_key: string;
  stage_name: string;
  stage_order: number;
  total_entered: number;
  total_advanced: number;
  total_dropped: number;
  drop_off_rate: number; // percentage 0-100
}

export const useCjmDropOff = (pipelineId?: string) => {
  const [rows, setRows] = useState<DropOffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDropOff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("vw_cjm_drop_off").select("*");

      if (pipelineId) {
        query = query.eq("pipeline_id", pipelineId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const sorted = ((data || []) as DropOffRow[]).sort(
        (a, b) => a.stage_order - b.stage_order,
      );

      setRows(sorted);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar drop-off";
      console.error("useCjmDropOff error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    fetchDropOff();
  }, [fetchDropOff]);

  return { rows, loading, error, refetch: fetchDropOff };
};
