import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { CjmClientPosition, CjmSlaStatus } from "../types/cjm";

export const useCjmClientPositions = (locationId?: string | null) => {
  const [positions, setPositions] = useState<CjmClientPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch journey states
      let query = supabase
        .from("cjm_journey_state")
        .select(
          "contact_id, pipeline_id, current_stage, entered_stage_at, sla_status",
        );

      if (locationId) {
        query = query.eq("location_id", locationId);
      }

      const { data: journeyData, error: journeyError } = await query;

      if (journeyError) throw journeyError;

      if (!journeyData || journeyData.length === 0) {
        setPositions([]);
        return;
      }

      // Fetch contact names from cjm_events metadata
      const contactIds = [...new Set(journeyData.map((j) => j.contact_id))];

      const { data: eventsData } = await supabase
        .from("cjm_events")
        .select("contact_id, metadata")
        .in("contact_id", contactIds)
        .not("metadata", "is", null)
        .order("occurred_at", { ascending: false });

      // Build contact_id -> name lookup from most recent event metadata
      const nameMap = new Map<string, string>();
      if (eventsData) {
        for (const event of eventsData) {
          if (!nameMap.has(event.contact_id)) {
            const meta = event.metadata as Record<string, unknown> | null;
            const name = meta?.contact_name as string | undefined;
            if (name) {
              nameMap.set(event.contact_id, name);
            }
          }
        }
      }

      const result: CjmClientPosition[] = journeyData.map((j) => {
        const hoursInStage =
          (Date.now() - new Date(j.entered_stage_at).getTime()) / 3600000;
        return {
          contact_id: j.contact_id,
          contact_name:
            nameMap.get(j.contact_id) || j.contact_id.substring(0, 8),
          pipeline_id: j.pipeline_id,
          current_stage: j.current_stage,
          entered_stage_at: j.entered_stage_at,
          sla_status: j.sla_status as CjmSlaStatus,
          hours_in_stage: Math.max(0, hoursInStage),
        };
      });

      setPositions(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar posicoes";
      console.error("useCjmClientPositions error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, loading, error, refetch: fetchPositions };
};
