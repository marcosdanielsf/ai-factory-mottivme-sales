import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface HealthScoreRow {
  contact_id: string;
  location_id: string;
  pipeline_id: string;
  current_stage: string;
  health_score: number;
}

interface UseCjmHealthScoresResult {
  scores: Map<string, number>;
  loading: boolean;
  error: string | null;
}

export function useCjmHealthScores(
  locationId?: string | null,
): UseCjmHealthScoresResult {
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchScores = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("vw_cjm_health_scores")
          .select("contact_id, health_score");

        if (locationId) {
          query = query.eq("location_id", locationId);
        }

        const { data, error: queryError } = await query;

        if (cancelled) return;

        if (queryError) {
          setError(queryError.message);
          return;
        }

        const map = new Map<string, number>();
        (data as HealthScoreRow[]).forEach((row) => {
          map.set(row.contact_id, row.health_score);
        });

        setScores(map);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchScores();

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  return { scores, loading, error };
}
