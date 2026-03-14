"use client";

/**
 * GHLMappingConfig — Painel de mapeamento de campos FormFlow → GoHighLevel.
 * Exibe tabela de campos do formulário com inputs para custom_field_id do GHL.
 * Sugere mapeamentos automáticos por tipo/título do campo.
 */

import { useState, useEffect } from "react";
import { Zap, Save, Loader2, Info } from "lucide-react";
import { autoDetectGHLField } from "@/lib/formflow/ghl-sync";
import type { Field, Form, GHLMapping } from "@/lib/formflow/types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const FIELD_KIND_LABELS: Record<string, string> = {
  short_text: "Texto curto",
  long_text: "Texto longo",
  multiple_choice: "Múltipla escolha",
  single_choice: "Escolha única",
  rating: "Avaliação",
  scale: "Escala",
  email: "E-mail",
  phone: "Telefone",
  date: "Data",
  file_upload: "Arquivo",
  statement: "Declaração",
  yes_no: "Sim/Não",
};

// Campos GHL comuns como sugestões no datalist
const GHL_FIELD_SUGGESTIONS = [
  "contact.email",
  "contact.phone",
  "contact.firstName",
  "contact.lastName",
  "contact.companyName",
  "contact.website",
  "contact.address1",
  "contact.city",
  "contact.state",
  "contact.country",
  "contact.postalCode",
  "contact.source",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GHLMappingConfigProps {
  form: Form;
  fields: Field[];
  onSave: (mapping: GHLMapping | null) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GHLMappingConfig({
  form,
  fields,
  onSave,
}: GHLMappingConfigProps) {
  // Inicializa o mapa com os valores existentes ou sugestões automáticas
  const [fieldMap, setFieldMap] = useState<Record<string, string>>(() => {
    const existing = form.ghl_mapping?.contact_field_map ?? {};
    const initial: Record<string, string> = {};

    for (const field of fields) {
      if (field.type === "statement") continue;
      if (existing[field.id] !== undefined) {
        initial[field.id] = existing[field.id];
      } else {
        // Sugestão automática somente para campos ainda não mapeados
        initial[field.id] = autoDetectGHLField(field) ?? "";
      }
    }

    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Re-inicializa se os campos do formulário mudarem
  useEffect(() => {
    setFieldMap((prev) => {
      const next: Record<string, string> = {};
      for (const field of fields) {
        if (field.type === "statement") continue;
        next[field.id] =
          prev[field.id] !== undefined
            ? prev[field.id]
            : (autoDetectGHLField(field) ?? "");
      }
      return next;
    });
  }, [fields]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function handleChange(fieldId: string, value: string) {
    setFieldMap((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSave() {
    setIsSaving(true);

    // Filtra entradas vazias
    const cleanMap: Record<string, string> = {};
    for (const [fieldId, ghlField] of Object.entries(fieldMap)) {
      if (ghlField.trim()) {
        cleanMap[fieldId] = ghlField.trim();
      }
    }

    const mapping: GHLMapping | null =
      Object.keys(cleanMap).length > 0 ? { contact_field_map: cleanMap } : null;

    try {
      await onSave(mapping);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally {
      setIsSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const mappableFields = fields.filter((f) => f.type !== "statement");
  const datalistId = "ghl-field-suggestions";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-brand-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Mapeamento GHL
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Associe campos do formulário a campos de contato no GoHighLevel.
          </p>
        </div>
      </div>

      {/* Info badge */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-brand-primary/5 border border-brand-primary/20">
        <Info className="h-3.5 w-3.5 text-brand-primary shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Use{" "}
          <code className="font-mono text-brand-primary">contact.email</code>,{" "}
          <code className="font-mono text-brand-primary">contact.phone</code>{" "}
          para campos nativos, ou{" "}
          <code className="font-mono text-brand-primary">cf_abc123</code> para
          campos customizados do GHL.
        </p>
      </div>

      {/* Datalist de sugestões */}
      <datalist id={datalistId}>
        {GHL_FIELD_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {/* Tabela de mapeamento */}
      {mappableFields.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-6">
          Adicione campos ao formulário para configurar o mapeamento.
        </p>
      ) : (
        <div className="border border-border-primary rounded-lg overflow-hidden">
          {/* Header da tabela */}
          <div className="grid grid-cols-2 gap-0 bg-surface-secondary border-b border-border-primary">
            <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              Campo do Form
            </div>
            <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-l border-border-primary">
              Campo GHL
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border-primary">
            {mappableFields.map((field) => {
              const suggestion = autoDetectGHLField(field);
              const currentValue = fieldMap[field.id] ?? "";
              const isAutoFilled =
                suggestion !== null && currentValue === suggestion;

              return (
                <div key={field.id} className="grid grid-cols-2 gap-0">
                  {/* Coluna: campo do form */}
                  <div className="px-3 py-2.5 flex flex-col justify-center min-w-0">
                    <p
                      className="text-xs font-medium text-text-primary truncate"
                      title={field.title || "(sem título)"}
                    >
                      {field.title || (
                        <span className="italic text-text-muted">
                          (sem título)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {FIELD_KIND_LABELS[field.type] ?? field.type}
                    </p>
                  </div>

                  {/* Coluna: campo GHL */}
                  <div className="px-2 py-2 border-l border-border-primary flex items-center">
                    <div className="relative w-full">
                      <input
                        type="text"
                        list={datalistId}
                        value={currentValue}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder="contact.email"
                        className={[
                          "w-full bg-transparent border rounded px-2 py-1.5 text-xs text-text-primary",
                          "placeholder:text-text-muted focus:outline-none transition-colors",
                          isAutoFilled
                            ? "border-brand-primary/40 text-brand-primary/80"
                            : "border-border-primary focus:border-brand-primary/60",
                        ].join(" ")}
                      />
                      {isAutoFilled && (
                        <span
                          title="Sugerido automaticamente"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-brand-primary/60"
                        >
                          <Zap className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botão salvar */}
      <button
        onClick={handleSave}
        disabled={isSaving || mappableFields.length === 0}
        className={[
          "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors",
          isSaving || mappableFields.length === 0
            ? "bg-surface-primary border border-border-primary text-text-muted cursor-not-allowed"
            : savedOk
              ? "bg-green-600/20 border border-green-500/30 text-green-400"
              : "bg-brand-primary text-white hover:bg-brand-primary/90",
        ].join(" ")}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Salvando...
          </>
        ) : savedOk ? (
          <>
            <Save className="h-3.5 w-3.5" />
            Mapeamento salvo
          </>
        ) : (
          <>
            <Save className="h-3.5 w-3.5" />
            Salvar mapeamento
          </>
        )}
      </button>
    </div>
  );
}
