import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Save, Eye, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFormBuilderStore } from "@/lib/formflow/store";
import { FieldTypePicker } from "@/components/formflow/builder/FieldTypePicker";
import { FieldList } from "@/components/formflow/builder/FieldList";
import { FieldConfigPanel } from "@/components/formflow/builder/FieldConfigPanel";
import type { Form, Field, FormStatus } from "@/lib/formflow/types";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<FormStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  closed: "Fechado",
  archived: "Arquivado",
};

const STATUS_COLORS: Record<FormStatus, string> = {
  draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  published: "bg-green-500/15 text-green-400 border-green-500/30",
  closed: "bg-red-500/15 text-red-400 border-red-500/30",
  archived: "bg-surface-secondary text-text-muted border-border-primary",
};

function StatusBadge({ status }: { status: FormStatus }) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        STATUS_COLORS[status],
      ].join(" ")}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SaveIndicator
// ---------------------------------------------------------------------------

type SaveState = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  isDirty: boolean;
  saveState: SaveState;
}

function SaveIndicator({ isDirty, saveState }: SaveIndicatorProps) {
  if (saveState === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Salvando...
      </span>
    );
  }
  if (saveState === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Salvo
      </span>
    );
  }
  if (saveState === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-400">
        <AlertCircle className="h-3.5 w-3.5" />
        Erro ao salvar
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        Alterações não salvas
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main Builder
// ---------------------------------------------------------------------------

export function FormFlowBuilder() {
  const { formId } = useParams<{ formId: string }>();

  const { form, fields, isDirty, setForm, markSaved, updateForm } =
    useFormBuilderStore();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  // -------------------------------------------------------------------------
  // Load form + fields from Supabase
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!formId) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [formRes, fieldsRes] = await Promise.all([
          supabase.from("ff_forms").select("*").eq("id", formId).single(),
          supabase
            .from("ff_fields")
            .select("*")
            .eq("form_id", formId)
            .order("position", { ascending: true }),
        ]);

        if (cancelled) return;

        if (formRes.error) throw formRes.error;
        if (fieldsRes.error) throw fieldsRes.error;

        const loadedForm = formRes.data as Form;
        const loadedFields = (fieldsRes.data ?? []) as Field[];

        setForm(loadedForm);
        // Fields are loaded into the store via setForm — but setForm only sets
        // the form entity. We push fields separately via store initializer:
        useFormBuilderStore.setState({ fields: loadedFields, isDirty: false });
        setTitleDraft(loadedForm.title);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Erro ao carregar formulário";
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [formId, setForm]);

  // -------------------------------------------------------------------------
  // Save form + fields to Supabase
  // -------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!form || !formId) return;
    setSaveState("saving");

    try {
      // Upsert each field (insert or update)
      const fieldRows = fields.map((f) => ({
        id: f.id,
        form_id: formId,
        type: f.type,
        title: f.title,
        description: f.description ?? null,
        required: f.required,
        position: f.position,
        properties: f.properties,
        validations: f.validations,
        skip_logic: f.skip_logic,
      }));

      // Get existing field IDs so we can delete removed ones
      const existingIds = fields.map((f) => f.id);

      const [formUpdate, fieldsUpsert] = await Promise.all([
        supabase
          .from("ff_forms")
          .update({
            title: form.title,
            description: form.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", formId),
        supabase.from("ff_fields").upsert(fieldRows, { onConflict: "id" }),
      ]);

      if (formUpdate.error) throw formUpdate.error;
      if (fieldsUpsert.error) throw fieldsUpsert.error;

      // Delete fields removed from the store
      if (existingIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("ff_fields")
          .delete()
          .eq("form_id", formId)
          .not("id", "in", `(${existingIds.join(",")})`);

        if (deleteError) throw deleteError;
      }

      markSaved();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (err: unknown) {
      console.error("[FormFlowBuilder] save error:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 4000);
    }
  }, [form, formId, fields, markSaved]);

  // -------------------------------------------------------------------------
  // Title editing
  // -------------------------------------------------------------------------

  function handleTitleCommit() {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== form?.title) {
      updateForm({ title: trimmed });
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleCommit();
    }
    if (e.key === "Escape") {
      setTitleDraft(form?.title ?? "");
      setIsEditingTitle(false);
    }
  }

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (loadError || !form) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-medium text-text-primary">
            Não foi possível carregar o formulário
          </p>
          <p className="text-xs text-text-muted max-w-xs">
            {loadError ?? "Formulário não encontrado"}
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-border-primary bg-surface-secondary shrink-0">
        {/* Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleCommit}
              onKeyDown={handleTitleKeyDown}
              className="text-sm font-semibold text-text-primary bg-transparent border-b border-brand-primary outline-none min-w-0 w-64"
            />
          ) : (
            <button
              onClick={() => {
                setTitleDraft(form.title);
                setIsEditingTitle(true);
              }}
              className="text-sm font-semibold text-text-primary hover:text-brand-primary transition-colors truncate max-w-xs text-left"
              title="Clique para editar o título"
            >
              {form.title || "Formulário sem título"}
            </button>
          )}

          <StatusBadge status={form.status} />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <SaveIndicator isDirty={isDirty} saveState={saveState} />

          <button
            title="Preview"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-primary text-xs text-text-muted hover:text-text-primary hover:border-border-primary/60 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
            className={[
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isDirty && saveState !== "saving"
                ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                : "bg-surface-primary border border-border-primary text-text-muted cursor-not-allowed",
            ].join(" ")}
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar — FieldTypePicker */}
        <aside className="w-60 shrink-0 border-r border-border-primary bg-surface-secondary overflow-y-auto">
          <div className="p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Tipos de campo
            </p>
            <FieldTypePicker />
          </div>
        </aside>

        {/* Center canvas — FieldList */}
        <main className="flex-1 bg-surface-primary overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6">
            {/* Form description */}
            {form.description && (
              <p className="text-sm text-text-muted mb-6">{form.description}</p>
            )}

            {/* Fields count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-muted">
                {fields.length === 0
                  ? "Nenhum campo"
                  : `${fields.length} campo${fields.length !== 1 ? "s" : ""}`}
              </p>
              {isDirty && (
                <span className="text-xs text-text-muted italic">
                  Alterações não salvas
                </span>
              )}
            </div>

            <FieldList />
          </div>
        </main>

        {/* Right sidebar — FieldConfigPanel */}
        <aside className="w-72 shrink-0 border-l border-border-primary bg-surface-secondary overflow-y-auto">
          <div className="p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Configurações
            </p>
            <FieldConfigPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
