import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";

export interface SankeyFlowRow {
  location_id: string;
  pipeline_id: string;
  from_stage: string;
  from_stage_name: string;
  from_stage_order: number;
  to_stage: string;
  to_stage_name: string;
  to_stage_order: number;
  flow_count: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const buildSankeyData = (flows: SankeyFlowRow[]): SankeyData => {
  // Collect unique stages sorted by order
  const stageMap = new Map<string, { name: string; order: number }>();

  for (const f of flows) {
    if (!stageMap.has(f.from_stage)) {
      stageMap.set(f.from_stage, {
        name: f.from_stage_name,
        order: f.from_stage_order,
      });
    }
    if (!stageMap.has(f.to_stage)) {
      stageMap.set(f.to_stage, {
        name: f.to_stage_name,
        order: f.to_stage_order,
      });
    }
  }

  const sortedStages = Array.from(stageMap.entries()).sort(
    ([, a], [, b]) => a.order - b.order,
  );

  const nodes: SankeyNode[] = sortedStages.map(([, v]) => ({ name: v.name }));
  const stageKeyToIndex = new Map<string, number>(
    sortedStages.map(([key], idx) => [key, idx]),
  );

  const links: SankeyLink[] = flows
    .map((f) => ({
      source: stageKeyToIndex.get(f.from_stage) ?? 0,
      target: stageKeyToIndex.get(f.to_stage) ?? 0,
      value: f.flow_count,
    }))
    .filter((l) => l.source !== l.target && l.value > 0);

  return { nodes, links };
};

export const useCjmSankeyFlow = (pipelineId?: string) => {
  const [flows, setFlows] = useState<SankeyFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("vw_cjm_sankey_flow").select("*");

      if (pipelineId) {
        query = query.eq("pipeline_id", pipelineId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setFlows((data || []) as SankeyFlowRow[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar fluxo Sankey";
      console.error("useCjmSankeyFlow error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  const sankeyData = useMemo(() => buildSankeyData(flows), [flows]);

  return { flows, sankeyData, loading, error, refetch: fetchFlows };
};
