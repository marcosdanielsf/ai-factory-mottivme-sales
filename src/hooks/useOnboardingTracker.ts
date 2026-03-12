import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingVertical =
  | "clinica"
  | "imobiliaria"
  | "servicos"
  | "ecommerce"
  | "educacao"
  | "outro";

export type OnboardingStatus =
  | "em_andamento"
  | "concluido"
  | "atrasado"
  | "cancelado";

export const ONBOARDING_STEPS = [
  {
    number: 1,
    key: "contrato_assinado",
    label: "Contrato Assinado",
    icon: "FileCheck",
  },
  {
    number: 2,
    key: "dados_coletados",
    label: "Dados Coletados",
    icon: "ClipboardList",
  },
  { number: 3, key: "location_ghl", label: "Location GHL", icon: "MapPin" },
  {
    number: 4,
    key: "agent_version_criado",
    label: "Agent Version",
    icon: "Bot",
  },
  {
    number: 5,
    key: "workflow_n8n_ativo",
    label: "Workflow n8n",
    icon: "Workflow",
  },
  { number: 6, key: "primeiro_lead", label: "Primeiro Lead", icon: "UserPlus" },
  { number: 7, key: "review_48h", label: "Review 48h", icon: "CheckCircle" },
] as const;

export interface OnboardingChecklistItem {
  id: string;
  onboarding_id: string;
  step_number: number;
  step_key: string;
  step_label: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
}

export interface ClientOnboarding {
  id: string;
  client_id: string | null;
  client_name: string;
  vertical: OnboardingVertical;
  current_step: number;
  status: OnboardingStatus;
  assigned_to: string | null;
  sla_deadline: string | null;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  // From view
  steps_completed: number;
  total_steps: number;
  progress_pct: number;
  hours_elapsed: number;
  is_sla_at_risk: boolean;
  is_sla_breached: boolean;
  next_step: number | null;
  // Joined
  checklist?: OnboardingChecklistItem[];
}

export interface OnboardingTemplate {
  id: string;
  vertical: string;
  template_name: string;
  steps: Array<{
    step_number: number;
    step_key: string;
    step_label: string;
    description: string;
    default_checklist: string[];
  }>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboardingTracker() {
  const [onboardings, setOnboardings] = useState<ClientOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchOnboardings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Busca dados da view
      const { data: rows, error: viewErr } = await supabase
        .from("vw_onboarding_tracker")
        .select("*")
        .order("started_at", { ascending: false });

      if (viewErr) throw new Error(viewErr.message);
      if (!rows || rows.length === 0) {
        setOnboardings([]);
        return;
      }

      // 2. Busca todos os checklist items de uma vez
      const ids = rows.map((r: ClientOnboarding) => r.id);
      const { data: checklistRows, error: chkErr } = await supabase
        .from("onboarding_checklist_items")
        .select("*")
        .in("onboarding_id", ids)
        .order("step_number", { ascending: true });

      if (chkErr) throw new Error(chkErr.message);

      // 3. Agrupa checklist por onboarding_id
      const checklistByOnboarding: Record<string, OnboardingChecklistItem[]> =
        {};
      for (const item of (checklistRows ?? []) as OnboardingChecklistItem[]) {
        if (!checklistByOnboarding[item.onboarding_id]) {
          checklistByOnboarding[item.onboarding_id] = [];
        }
        checklistByOnboarding[item.onboarding_id].push(item);
      }

      // 4. Monta objetos finais
      const merged: ClientOnboarding[] = rows.map((row: ClientOnboarding) => ({
        ...row,
        checklist: checklistByOnboarding[row.id] ?? [],
      }));

      setOnboardings(merged);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar onboardings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ── create ─────────────────────────────────────────────────────────────────

  const createOnboarding = useCallback(
    async (data: {
      client_name: string;
      vertical: OnboardingVertical;
      assigned_to?: string;
      notes?: string;
    }): Promise<ClientOnboarding | null> => {
      setError(null);
      try {
        const slaDeadline = new Date(
          Date.now() + 48 * 60 * 60 * 1000,
        ).toISOString();

        // 1. Cria o onboarding principal
        const { data: inserted, error: insertErr } = await supabase
          .from("client_onboardings")
          .insert({
            client_name: data.client_name,
            vertical: data.vertical,
            assigned_to: data.assigned_to ?? null,
            notes: data.notes ?? null,
            current_step: 1,
            status: "em_andamento" satisfies OnboardingStatus,
            sla_deadline: slaDeadline,
          })
          .select("id")
          .single();

        if (insertErr) throw new Error(insertErr.message);
        if (!inserted) throw new Error("Insert não retornou dados");

        // 2. Cria os 7 itens do checklist
        const checklistItems = ONBOARDING_STEPS.map((step) => ({
          onboarding_id: inserted.id,
          step_number: step.number,
          step_key: step.key,
          step_label: step.label,
          is_completed: false,
          completed_at: null,
          completed_by: null,
          notes: null,
        }));

        const { error: chkInsertErr } = await supabase
          .from("onboarding_checklist_items")
          .insert(checklistItems);

        if (chkInsertErr) throw new Error(chkInsertErr.message);

        await fetchOnboardings();

        // Retorna o registro criado a partir do estado atualizado
        const updated = onboardings.find((o) => o.id === inserted.id) ?? null;
        return updated;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao criar onboarding";
        setError(msg);
        return null;
      }
    },
    [fetchOnboardings, onboardings],
  );

  // ── toggleChecklistItem ────────────────────────────────────────────────────

  const toggleChecklistItem = useCallback(
    async (itemId: string, completed: boolean): Promise<void> => {
      setError(null);
      try {
        // 1. Atualiza o item
        const { data: updatedItem, error: updateErr } = await supabase
          .from("onboarding_checklist_items")
          .update({
            is_completed: completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq("id", itemId)
          .select("onboarding_id, step_number")
          .single();

        if (updateErr) throw new Error(updateErr.message);
        if (!updatedItem) throw new Error("Item não encontrado");

        const onboardingId: string = updatedItem.onboarding_id;

        // 2. Busca todos os itens deste onboarding para calcular estado
        const { data: allItems, error: allErr } = await supabase
          .from("onboarding_checklist_items")
          .select("step_number, is_completed")
          .eq("onboarding_id", onboardingId)
          .order("step_number", { ascending: true });

        if (allErr) throw new Error(allErr.message);

        const items = (allItems ?? []) as Array<{
          step_number: number;
          is_completed: boolean;
        }>;
        const allCompleted = items.every((i) => i.is_completed);
        const nextIncomplete = items.find((i) => !i.is_completed);
        const nextStep = nextIncomplete ? nextIncomplete.step_number : null;

        // 3. Atualiza o onboarding com o próximo step e status
        const onboardingUpdate: {
          current_step?: number;
          status?: OnboardingStatus;
          completed_at?: string | null;
        } = {};

        if (nextStep !== null) {
          onboardingUpdate.current_step = nextStep;
        }

        if (allCompleted) {
          onboardingUpdate.status = "concluido";
          onboardingUpdate.completed_at = new Date().toISOString();
        }

        if (Object.keys(onboardingUpdate).length > 0) {
          const { error: upErr } = await supabase
            .from("client_onboardings")
            .update(onboardingUpdate)
            .eq("id", onboardingId);

          if (upErr) throw new Error(upErr.message);
        }

        await fetchOnboardings();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao atualizar checklist",
        );
      }
    },
    [fetchOnboardings],
  );

  // ── updateOnboarding ───────────────────────────────────────────────────────

  const updateOnboarding = useCallback(
    async (id: string, data: Partial<ClientOnboarding>): Promise<void> => {
      setError(null);
      try {
        // Remove campos computados da view antes de tentar atualizar
        const {
          steps_completed: _sc,
          total_steps: _ts,
          progress_pct: _pp,
          hours_elapsed: _he,
          is_sla_at_risk: _iar,
          is_sla_breached: _ib,
          next_step: _ns,
          checklist: _cl,
          ...updatePayload
        } = data;

        const { error: updateErr } = await supabase
          .from("client_onboardings")
          .update(updatePayload)
          .eq("id", id);

        if (updateErr) throw new Error(updateErr.message);

        await fetchOnboardings();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao atualizar onboarding",
        );
      }
    },
    [fetchOnboardings],
  );

  // ── deleteOnboarding ───────────────────────────────────────────────────────

  const deleteOnboarding = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      // Cascade no banco deleta os checklist items automaticamente
      const { error: deleteErr } = await supabase
        .from("client_onboardings")
        .delete()
        .eq("id", id);

      if (deleteErr) throw new Error(deleteErr.message);

      setOnboardings((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao excluir onboarding",
      );
    }
  }, []);

  // ── fetchTemplates ─────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async (): Promise<
    OnboardingTemplate[]
  > => {
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("onboarding_templates")
        .select("*")
        .order("vertical", { ascending: true });

      if (fetchErr) throw new Error(fetchErr.message);
      return (data ?? []) as OnboardingTemplate[];
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar templates",
      );
      return [];
    }
  }, []);

  // ── effect ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchOnboardings();
  }, [fetchOnboardings]);

  // ── return ─────────────────────────────────────────────────────────────────

  return {
    onboardings,
    loading,
    error,
    createOnboarding,
    toggleChecklistItem,
    updateOnboarding,
    deleteOnboarding,
    fetchTemplates,
    refetch: fetchOnboardings,
  };
}
