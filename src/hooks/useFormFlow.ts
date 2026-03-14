import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Form, Field, FormStats, Workspace } from "../lib/formflow/types";
import { getErrorMessage } from "../lib/getErrorMessage";

// ---------------------------------------------------------------------------
// Types internos
// ---------------------------------------------------------------------------

export interface FormWithStats extends Form {
  stats: FormStats | null;
}

interface UseFormFlowReturn {
  forms: FormWithStats[];
  loading: boolean;
  error: string | null;
  workspace: Workspace | null;
  listForms: () => Promise<void>;
  getForm: (formId: string) => Promise<{ form: Form; fields: Field[] } | null>;
  createForm: (title: string) => Promise<Form | null>;
  updateForm: (
    formId: string,
    updates: Partial<
      Pick<
        Form,
        "title" | "description" | "settings" | "webhook_url" | "ghl_mapping"
      >
    >,
  ) => Promise<Form | null>;
  deleteForm: (formId: string) => Promise<boolean>;
  publishForm: (formId: string) => Promise<Form | null>;
  closeForm: (formId: string) => Promise<Form | null>;
  getFields: (formId: string) => Promise<Field[]>;
  saveFields: (formId: string, fields: Field[]) => Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove acentos e caracteres especiais, converte para lowercase com hífens.
 * Append 4 chars aleatórios para garantir unicidade.
 */
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

export function useFormFlow(): UseFormFlowReturn {
  const [forms, setForms] = useState<FormWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // --- Workspace ---

  const getOrCreateWorkspace =
    useCallback(async (): Promise<Workspace | null> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return null;

        // Busca workspace existente do usuário
        const { data: existing, error: fetchError } = await supabase
          .from("ff_workspaces")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          return existing as Workspace;
        }

        // Cria workspace se não existir
        const { data: created, error: createError } = await supabase
          .from("ff_workspaces")
          .insert({
            name: "Meu Workspace",
            owner_id: user.id,
            settings: {},
          })
          .select()
          .single();

        if (createError) throw createError;
        return created as Workspace;
      } catch (err: unknown) {
        console.error("Error in getOrCreateWorkspace:", err);
        return null;
      }
    }, []);

  // --- Forms ---

  const listForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ws = workspace ?? (await getOrCreateWorkspace());
      if (!ws) {
        setForms([]);
        return;
      }

      if (!workspace) {
        setWorkspace(ws);
      }

      // Busca forms do workspace
      const { data: formsData, error: formsError } = await supabase
        .from("ff_forms")
        .select("*")
        .eq("workspace_id", ws.id)
        .order("created_at", { ascending: false });

      if (formsError) throw formsError;

      if (!formsData || formsData.length === 0) {
        setForms([]);
        return;
      }

      // Busca stats da view para todos os forms
      const formIds = formsData.map((f) => f.id);
      const { data: statsData, error: statsError } = await supabase
        .from("vw_ff_form_stats")
        .select("*")
        .in("form_id", formIds);

      if (statsError) {
        console.warn("Error fetching form stats:", statsError);
      }

      const statsMap = new Map<string, FormStats>();
      (statsData || []).forEach((s) => {
        statsMap.set(s.form_id, s as FormStats);
      });

      const formsWithStats: FormWithStats[] = formsData.map((f) => ({
        ...(f as Form),
        stats: statsMap.get(f.id) ?? null,
      }));

      setForms(formsWithStats);
    } catch (err: unknown) {
      console.error("Error listing forms:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspace, getOrCreateWorkspace]);

  const getForm = useCallback(
    async (formId: string): Promise<{ form: Form; fields: Field[] } | null> => {
      try {
        const { data: formData, error: formError } = await supabase
          .from("ff_forms")
          .select("*")
          .eq("id", formId)
          .single();

        if (formError) throw formError;

        const { data: fieldsData, error: fieldsError } = await supabase
          .from("ff_fields")
          .select("*")
          .eq("form_id", formId)
          .order("position", { ascending: true });

        if (fieldsError) throw fieldsError;

        return {
          form: formData as Form,
          fields: (fieldsData || []) as Field[],
        };
      } catch (err: unknown) {
        console.error("Error getting form:", err);
        return null;
      }
    },
    [],
  );

  const createForm = useCallback(
    async (title: string): Promise<Form | null> => {
      try {
        const ws = workspace ?? (await getOrCreateWorkspace());
        if (!ws) return null;

        if (!workspace) setWorkspace(ws);

        // Gera slug único — tenta até encontrar um disponível
        let slug = slugify(title);
        let attempts = 0;

        while (attempts < 5) {
          const { data: existing } = await supabase
            .from("ff_forms")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

          if (!existing) break;
          slug = slugify(title);
          attempts++;
        }

        const { data, error: createError } = await supabase
          .from("ff_forms")
          .insert({
            workspace_id: ws.id,
            title,
            slug,
            status: "draft",
            settings: {},
            ghl_mapping: null,
          })
          .select()
          .single();

        if (createError) throw createError;

        const newForm: FormWithStats = { ...(data as Form), stats: null };
        setForms((prev) => [newForm, ...prev]);
        return data as Form;
      } catch (err: unknown) {
        console.error("Error creating form:", err);
        setError(getErrorMessage(err));
        return null;
      }
    },
    [workspace, getOrCreateWorkspace],
  );

  const updateForm = useCallback(
    async (
      formId: string,
      updates: Partial<
        Pick<
          Form,
          "title" | "description" | "settings" | "webhook_url" | "ghl_mapping"
        >
      >,
    ): Promise<Form | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from("ff_forms")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", formId)
          .select()
          .single();

        if (updateError) throw updateError;

        setForms((prev) =>
          prev.map((f) => (f.id === formId ? { ...f, ...(data as Form) } : f)),
        );
        return data as Form;
      } catch (err: unknown) {
        console.error("Error updating form:", err);
        setError(getErrorMessage(err));
        return null;
      }
    },
    [],
  );

  const deleteForm = useCallback(async (formId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("ff_forms")
        .delete()
        .eq("id", formId);

      if (deleteError) throw deleteError;

      setForms((prev) => prev.filter((f) => f.id !== formId));
      return true;
    } catch (err: unknown) {
      console.error("Error deleting form:", err);
      setError(getErrorMessage(err));
      return false;
    }
  }, []);

  const publishForm = useCallback(
    async (formId: string): Promise<Form | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from("ff_forms")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          })
          .eq("id", formId)
          .select()
          .single();

        if (updateError) throw updateError;

        setForms((prev) =>
          prev.map((f) => (f.id === formId ? { ...f, ...(data as Form) } : f)),
        );
        return data as Form;
      } catch (err: unknown) {
        console.error("Error publishing form:", err);
        setError(getErrorMessage(err));
        return null;
      }
    },
    [],
  );

  const closeForm = useCallback(
    async (formId: string): Promise<Form | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from("ff_forms")
          .update({ status: "closed" })
          .eq("id", formId)
          .select()
          .single();

        if (updateError) throw updateError;

        setForms((prev) =>
          prev.map((f) => (f.id === formId ? { ...f, ...(data as Form) } : f)),
        );
        return data as Form;
      } catch (err: unknown) {
        console.error("Error closing form:", err);
        setError(getErrorMessage(err));
        return null;
      }
    },
    [],
  );

  // --- Fields ---

  const getFields = useCallback(async (formId: string): Promise<Field[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from("ff_fields")
        .select("*")
        .eq("form_id", formId)
        .order("position", { ascending: true });

      if (fetchError) throw fetchError;
      return (data || []) as Field[];
    } catch (err: unknown) {
      console.error("Error getting fields:", err);
      return [];
    }
  }, []);

  /**
   * Estratégia DELETE → INSERT para evitar conflitos de position.
   * Mais simples e seguro para upserts em lote com reordenações.
   */
  const saveFields = useCallback(
    async (formId: string, fields: Field[]): Promise<boolean> => {
      try {
        // Deleta todos os fields do form
        const { error: deleteError } = await supabase
          .from("ff_fields")
          .delete()
          .eq("form_id", formId);

        if (deleteError) throw deleteError;

        if (fields.length === 0) return true;

        // Insere todos os fields com posições normalizadas
        const fieldsToInsert = fields.map((f, idx) => ({
          id: f.id,
          form_id: formId,
          type: f.type,
          title: f.title,
          description: f.description ?? null,
          required: f.required,
          position: idx,
          properties: f.properties,
          validations: f.validations,
          skip_logic: f.skip_logic,
        }));

        const { error: insertError } = await supabase
          .from("ff_fields")
          .insert(fieldsToInsert);

        if (insertError) throw insertError;
        return true;
      } catch (err: unknown) {
        console.error("Error saving fields:", err);
        setError(getErrorMessage(err));
        return false;
      }
    },
    [],
  );

  // --- Inicialização ---

  useEffect(() => {
    listForms();
  }, [listForms]);

  return {
    forms,
    loading,
    error,
    workspace,
    listForms,
    getForm,
    createForm,
    updateForm,
    deleteForm,
    publishForm,
    closeForm,
    getFields,
    saveFields,
  };
}
