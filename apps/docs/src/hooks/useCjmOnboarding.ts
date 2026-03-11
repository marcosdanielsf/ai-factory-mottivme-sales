import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface OnboardingStep {
  id: string;
  step_key: string;
  step_name: string;
  step_order: number;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
}

const DEFAULT_STEPS: Array<
  Pick<OnboardingStep, "step_key" | "step_name" | "step_order">
> = [
  { step_order: 1, step_key: "kickoff_call", step_name: "Reuniao de Kickoff" },
  {
    step_order: 2,
    step_key: "ghl_setup",
    step_name: "Setup GHL (Sub-account + Pipelines)",
  },
  {
    step_order: 3,
    step_key: "agent_config",
    step_name: "Configuracao do Agente IA",
  },
  {
    step_order: 4,
    step_key: "workflow_activation",
    step_name: "Ativacao Workflows n8n",
  },
  {
    step_order: 5,
    step_key: "test_validation",
    step_name: "Teste e Validacao",
  },
  { step_order: 6, step_key: "go_live", step_name: "Go Live + Monitoramento" },
];

export const useCjmOnboarding = (
  contactId: string | null,
  locationId: string | null,
) => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSteps = useCallback(async () => {
    if (!contactId || !locationId) {
      setSteps([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("cjm_onboarding_steps")
        .select(
          "id, step_key, step_name, step_order, completed, completed_at, completed_by, notes",
        )
        .eq("contact_id", contactId)
        .eq("location_id", locationId)
        .order("step_order", { ascending: true });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        // First load: seed the 6 default steps via upsert
        const seeds = DEFAULT_STEPS.map((s) => ({
          location_id: locationId,
          contact_id: contactId,
          step_key: s.step_key,
          step_name: s.step_name,
          step_order: s.step_order,
          completed: false,
        }));

        const { data: inserted, error: upsertError } = await supabase
          .from("cjm_onboarding_steps")
          .upsert(seeds, { onConflict: "location_id,contact_id,step_key" })
          .select(
            "id, step_key, step_name, step_order, completed, completed_at, completed_by, notes",
          )
          .order("step_order", { ascending: true });

        if (upsertError) throw upsertError;

        setSteps((inserted || []) as OnboardingStep[]);
      } else {
        setSteps(data as OnboardingStep[]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("useCjmOnboarding error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [contactId, locationId]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const toggleStep = useCallback(
    async (stepKey: string, completed: boolean) => {
      if (!contactId || !locationId) return;

      try {
        setError(null);

        const patch: Record<string, unknown> = {
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        };

        const { data, error: updateError } = await supabase
          .from("cjm_onboarding_steps")
          .update(patch)
          .eq("contact_id", contactId)
          .eq("location_id", locationId)
          .eq("step_key", stepKey)
          .select(
            "id, step_key, step_name, step_order, completed, completed_at, completed_by, notes",
          )
          .single();

        if (updateError) throw updateError;

        if (data) {
          setSteps((prev) =>
            prev.map((s) =>
              s.step_key === stepKey ? (data as OnboardingStep) : s,
            ),
          );
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        console.error("useCjmOnboarding toggleStep error:", err);
        setError(message);
      }
    },
    [contactId, locationId],
  );

  return { steps, toggleStep, loading, error, refetch: fetchSteps };
};
