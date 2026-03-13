import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getErrorMessage } from "../lib/getErrorMessage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStage =
  | "novo"
  | "ligou"
  | "interessado"
  | "agendou"
  | "won"
  | "lost";

export interface PipelineCard {
  id: string;
  call_id: string | null;
  phone: string | null;
  lead_name: string | null;
  outcome: string | null;
  pipeline_stage: PipelineStage;
  qa_score: number | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface PipelineColumn {
  stage: PipelineStage;
  label: string;
  color: string;
  cards: PipelineCard[];
}

interface DateRangeFilter {
  from: Date;
  to: Date;
}

interface UseColdCallPipelineReturn {
  columns: PipelineColumn[];
  loading: boolean;
  error: string | null;
  updateStage: (callId: string, newStage: PipelineStage) => Promise<void>;
  refetch: () => Promise<void>;
}

// ─── Stage Config ─────────────────────────────────────────────────────────────

export const PIPELINE_STAGE_CONFIG: Record<
  PipelineStage,
  { label: string; color: string }
> = {
  novo: { label: "Novo", color: "#6b7280" },
  ligou: { label: "Ligou", color: "#3b82f6" },
  interessado: { label: "Interessado", color: "#f59e0b" },
  agendou: { label: "Agendou", color: "#10b981" },
  won: { label: "Won", color: "#8b5cf6" },
  lost: { label: "Lost", color: "#ef4444" },
};

const STAGE_ORDER: PipelineStage[] = [
  "novo",
  "ligou",
  "interessado",
  "agendou",
  "won",
  "lost",
];

const AUTO_REFRESH_MS = 30_000;

// ─── Group helper ─────────────────────────────────────────────────────────────

function groupIntoColumns(cards: PipelineCard[]): PipelineColumn[] {
  const map = new Map<PipelineStage, PipelineCard[]>();
  for (const stage of STAGE_ORDER) {
    map.set(stage, []);
  }
  for (const card of cards) {
    const stage = card.pipeline_stage ?? "novo";
    const bucket = map.get(stage);
    if (bucket) {
      bucket.push(card);
    } else {
      const novoBucket = map.get("novo");
      if (novoBucket) novoBucket.push({ ...card, pipeline_stage: "novo" });
    }
  }
  return STAGE_ORDER.map((stage) => ({
    stage,
    label: PIPELINE_STAGE_CONFIG[stage].label,
    color: PIPELINE_STAGE_CONFIG[stage].color,
    cards: map.get(stage) ?? [],
  }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useColdCallPipeline(
  dateRange?: DateRangeFilter,
): UseColdCallPipelineReturn {
  const [columns, setColumns] = useState<PipelineColumn[]>(() =>
    groupIntoColumns([]),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the raw cards for optimistic rollback
  const cardsRef = useRef<PipelineCard[]>([]);

  const fetchPipeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("vw_cold_call_pipeline")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const cards = (data ?? []) as PipelineCard[];
      cardsRef.current = cards;
      setColumns(groupIntoColumns(cards));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      console.error("useColdCallPipeline fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchPipeline, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchPipeline]);

  const updateStage = useCallback(
    async (callId: string, newStage: PipelineStage) => {
      // Optimistic update — move card in local state immediately
      const prevCards = cardsRef.current;
      const updatedCards = prevCards.map((c) =>
        c.id === callId ? { ...c, pipeline_stage: newStage } : c,
      );
      cardsRef.current = updatedCards;
      setColumns(groupIntoColumns(updatedCards));

      try {
        const { error: updateError } = await supabase
          .from("cold_call_logs")
          .update({ pipeline_stage: newStage })
          .eq("id", callId);

        if (updateError) throw updateError;
      } catch (err: unknown) {
        // Rollback on error
        cardsRef.current = prevCards;
        setColumns(groupIntoColumns(prevCards));
        setError(getErrorMessage(err));
        console.error("useColdCallPipeline updateStage error:", err);
      }
    },
    [],
  );

  return { columns, loading, error, updateStage, refetch: fetchPipeline };
}
