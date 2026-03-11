import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface TimelineEvent {
  id: string;
  contact_id: string;
  pipeline_id: string;
  event_type: string;
  from_stage: string | null;
  from_stage_name: string | null;
  to_stage: string | null;
  to_stage_name: string | null;
  stage_color: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  time_in_previous_stage: number | null; // hours
}

export const useCjmTimeline = (contactId: string | null) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!contactId) {
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("vw_cjm_client_timeline")
        .select("*")
        .eq("contact_id", contactId)
        .order("occurred_at", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setEvents((data || []) as TimelineEvent[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("useCjmTimeline error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { events, loading, error, refetch: fetchTimeline };
};
