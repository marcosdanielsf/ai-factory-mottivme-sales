import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Form, Field, Submission, FormStats } from "../lib/formflow/types";

// ---------------------------------------------------------------------------
// FunnelStep type
// ---------------------------------------------------------------------------

export interface FunnelStep {
  field_id: string;
  field_title: string;
  field_position: number;
  views: number;
  drops: number;
  drop_rate: number; // 0-100
}

// ---------------------------------------------------------------------------
// Raw DB row for vw_ff_form_stats
// ---------------------------------------------------------------------------

interface FormStatsRow {
  form_id: string;
  form_title: string;
  slug: string;
  status: string;
  workspace_id: string;
  total_submissions: number;
  total_views: number;
  total_starts: number;
  completion_rate: number;
  avg_duration_seconds: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFormFlowAnalytics(formId: string) {
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Form
      const { data: formData, error: formErr } = await supabase
        .from("ff_forms")
        .select("*")
        .eq("id", formId)
        .single();

      if (formErr) throw formErr;
      setForm(formData as Form);

      // 2. Fields
      const { data: fieldsData, error: fieldsErr } = await supabase
        .from("ff_fields")
        .select("*")
        .eq("form_id", formId)
        .order("position");

      if (fieldsErr) throw fieldsErr;
      const fieldList = (fieldsData ?? []) as Field[];
      setFields(fieldList);

      // 3. Stats (from view)
      const { data: statsData } = await supabase
        .from("vw_ff_form_stats")
        .select("*")
        .eq("form_id", formId)
        .single();

      if (statsData) {
        const row = statsData as FormStatsRow;
        setStats({
          form_id: row.form_id,
          total_submissions: row.total_submissions ?? 0,
          completion_rate: row.completion_rate ?? 0,
          avg_duration_seconds: row.avg_duration_seconds ?? 0,
          total_views: row.total_views ?? 0,
          total_starts: row.total_starts ?? 0,
        });
      }

      // 4. Submissions (latest 100)
      const { data: submissionsData, error: subErr } = await supabase
        .from("ff_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("completed_at", { ascending: false })
        .limit(100);

      if (subErr) throw subErr;
      setSubmissions((submissionsData ?? []) as Submission[]);

      // 5. Funnel data from analytics_events
      const { data: eventsData } = await supabase
        .from("ff_analytics_events")
        .select("field_id, event_type")
        .eq("form_id", formId)
        .in("event_type", ["field_view", "field_drop"]);

      if (eventsData && fieldList.length > 0) {
        // Count views and drops per field_id
        const viewCounts: Record<string, number> = {};
        const dropCounts: Record<string, number> = {};

        for (const evt of eventsData) {
          if (!evt.field_id) continue;
          if (evt.event_type === "field_view") {
            viewCounts[evt.field_id] = (viewCounts[evt.field_id] ?? 0) + 1;
          } else if (evt.event_type === "field_drop") {
            dropCounts[evt.field_id] = (dropCounts[evt.field_id] ?? 0) + 1;
          }
        }

        const steps: FunnelStep[] = fieldList
          .filter((f) => f.type !== "statement")
          .map((f) => {
            const views = viewCounts[f.id] ?? 0;
            const drops = dropCounts[f.id] ?? 0;
            const drop_rate = views > 0 ? Math.round((drops / views) * 100) : 0;
            return {
              field_id: f.id,
              field_title: f.title,
              field_position: f.position,
              views,
              drops,
              drop_rate,
            };
          })
          .sort((a, b) => a.field_position - b.field_position);

        setFunnelData(steps);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    form,
    fields,
    submissions,
    stats,
    funnelData,
    loading,
    error,
    refresh: load,
  };
}
