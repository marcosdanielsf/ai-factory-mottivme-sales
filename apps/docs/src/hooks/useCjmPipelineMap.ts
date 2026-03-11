import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { CjmPipelineFlowRow, PipelineMapData } from "../types/cjm";

export const useCjmPipelineMap = (locationId?: string | null) => {
  const [pipelines, setPipelines] = useState<PipelineMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("vw_cjm_pipeline_flow").select("*");

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const rows = (data || []) as CjmPipelineFlowRow[];

      // Group rows by pipeline_id
      const pipelineMap = new Map<string, PipelineMapData>();

      for (const row of rows) {
        if (!pipelineMap.has(row.pipeline_id)) {
          pipelineMap.set(row.pipeline_id, {
            pipeline_id: row.pipeline_id,
            pipeline_name: row.pipeline_name,
            stages: [],
          });
        }

        const pipeline = pipelineMap.get(row.pipeline_id)!;
        pipeline.stages.push({
          ...row,
          clients: [], // Populated by merging with useCjmClientPositions
        });
      }

      // Sort stages within each pipeline by stage_order
      for (const pipeline of pipelineMap.values()) {
        pipeline.stages.sort((a, b) => a.stage_order - b.stage_order);
      }

      setPipelines(Array.from(pipelineMap.values()));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar pipelines";
      console.error("useCjmPipelineMap error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  return { pipelines, loading, error, refetch: fetchPipelines };
};
