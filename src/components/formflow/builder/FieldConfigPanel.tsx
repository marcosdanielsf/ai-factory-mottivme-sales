import { useState } from "react";
import { Plus, X, Settings2, GitBranch } from "lucide-react";
import type { Field, FieldChoice } from "@/lib/formflow/types";
import { useFormBuilderStore } from "@/lib/formflow/store";
import { getFieldLabel } from "./FieldTypePicker";
import { SkipLogicBuilder } from "./SkipLogicBuilder";

// ---------------------------------------------------------------------------
// Small reusable primitives
// ---------------------------------------------------------------------------

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}
function Label({ children, htmlFor }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-text-muted mb-1"
    >
      {children}
    </label>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
function TextInput({ label, id, ...props }: TextInputProps) {
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        id={id}
        className="w-full bg-surface-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
        {...props}
      />
    </div>
  );
}

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
function NumberInput({ label, id, ...props }: NumberInputProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        className="w-full bg-surface-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
        {...props}
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-primary">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative w-10 h-5 rounded-full transition-colors focus:outline-none",
          checked
            ? "bg-brand-primary"
            : "bg-surface-primary border border-border-primary",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChoicesEditor
// ---------------------------------------------------------------------------

interface ChoicesEditorProps {
  choices: FieldChoice[];
  onChange: (choices: FieldChoice[]) => void;
}
function ChoicesEditor({ choices, onChange }: ChoicesEditorProps) {
  function addChoice() {
    const newChoice: FieldChoice = {
      id: crypto.randomUUID(),
      label: "",
      value: crypto.randomUUID().slice(0, 8),
    };
    onChange([...choices, newChoice]);
  }

  function updateChoice(id: string, label: string) {
    onChange(
      choices.map((c) =>
        c.id === id
          ? { ...c, label, value: label.toLowerCase().replace(/\s+/g, "_") }
          : c,
      ),
    );
  }

  function removeChoice(id: string) {
    onChange(choices.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-2">
      <Label>Opções</Label>
      {choices.map((choice, idx) => (
        <div key={choice.id} className="flex items-center gap-2">
          <span className="text-xs text-text-muted w-5 text-right shrink-0">
            {idx + 1}.
          </span>
          <input
            value={choice.label}
            onChange={(e) => updateChoice(choice.id, e.target.value)}
            placeholder={`Opção ${idx + 1}`}
            className="flex-1 bg-surface-primary border border-border-primary rounded px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary"
          />
          <button
            onClick={() => removeChoice(choice.id)}
            className="shrink-0 p-1 rounded text-text-muted hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addChoice}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border-primary text-xs text-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar opção
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TypeSpecificConfig
// ---------------------------------------------------------------------------

interface TypeSpecificConfigProps {
  field: Field;
  onChange: (updates: Partial<Field>) => void;
}

function TypeSpecificConfig({ field, onChange }: TypeSpecificConfigProps) {
  const p = field.properties;

  function updateProps(partial: Partial<typeof p>) {
    onChange({ properties: { ...p, ...partial } });
  }

  switch (field.type) {
    case "short_text":
    case "long_text":
    case "email":
    case "phone":
    case "date":
      return (
        <TextInput
          label="Placeholder"
          value={p.placeholder ?? ""}
          onChange={(e) => updateProps({ placeholder: e.target.value })}
          placeholder="Ex: Digite aqui..."
        />
      );

    case "single_choice":
    case "multiple_choice":
      return (
        <ChoicesEditor
          choices={p.choices ?? []}
          onChange={(choices) => updateProps({ choices })}
        />
      );

    case "yes_no":
      return (
        <p className="text-xs text-text-muted">
          Campo Sim / Não — sem configuração adicional.
        </p>
      );

    case "rating":
      return (
        <NumberInput
          label="Máximo de estrelas"
          value={p.max ?? 5}
          min={2}
          max={10}
          onChange={(e) => updateProps({ max: Number(e.target.value) })}
        />
      );

    case "scale":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Mínimo"
              value={p.min ?? 0}
              onChange={(e) => updateProps({ min: Number(e.target.value) })}
            />
            <NumberInput
              label="Máximo"
              value={p.max ?? 10}
              onChange={(e) => updateProps({ max: Number(e.target.value) })}
            />
          </div>
          <NumberInput
            label="Incremento (step)"
            value={p.step ?? 1}
            min={1}
            onChange={(e) => updateProps({ step: Number(e.target.value) })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Label mínimo"
              value={p.min_label ?? ""}
              onChange={(e) => updateProps({ min_label: e.target.value })}
              placeholder="Ex: Péssimo"
            />
            <TextInput
              label="Label máximo"
              value={p.max_label ?? ""}
              onChange={(e) => updateProps({ max_label: e.target.value })}
              placeholder="Ex: Ótimo"
            />
          </div>
        </div>
      );

    case "file_upload":
      return (
        <div className="space-y-3">
          <NumberInput
            label="Tamanho máximo (MB)"
            value={p.max_file_size_mb ?? 10}
            min={1}
            max={100}
            onChange={(e) =>
              updateProps({ max_file_size_mb: Number(e.target.value) })
            }
          />
          <div>
            <Label>Tipos aceitos (MIME, um por linha)</Label>
            <textarea
              rows={3}
              value={(p.accepted_types ?? []).join("\n")}
              onChange={(e) =>
                updateProps({
                  accepted_types: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder={"image/png\nimage/jpeg\napplication/pdf"}
              className="w-full bg-surface-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>
        </div>
      );

    case "statement":
      return (
        <TextInput
          label="Texto do botão"
          value={p.button_text ?? ""}
          onChange={(e) => updateProps({ button_text: e.target.value })}
          placeholder="Ex: Continuar"
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// FieldConfigPanel
// ---------------------------------------------------------------------------

type ActiveTab = "config" | "logic";

export function FieldConfigPanel() {
  const fields = useFormBuilderStore((s) => s.fields);
  const selectedFieldId = useFormBuilderStore((s) => s.selectedFieldId);
  const updateField = useFormBuilderStore((s) => s.updateField);

  const [activeTab, setActiveTab] = useState<ActiveTab>("config");

  const field = fields.find((f) => f.id === selectedFieldId) ?? null;

  // Empty state
  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center px-4">
        <div className="w-10 h-10 rounded-xl bg-surface-primary border border-border-primary flex items-center justify-center mb-3">
          <Settings2 className="h-5 w-5 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">
          Nenhum campo selecionado
        </p>
        <p className="text-xs text-text-muted">
          Clique em um campo para configurar
        </p>
      </div>
    );
  }

  function update(updates: Partial<Field>) {
    updateField(field!.id, updates);
  }

  const tabClass = (tab: ActiveTab) =>
    [
      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors",
      activeTab === tab
        ? "border-brand-primary text-brand-primary"
        : "border-transparent text-text-muted hover:text-text-primary",
    ].join(" ");

  return (
    <div className="flex flex-col h-full">
      {/* Field header */}
      <div className="mb-4 pb-4 border-b border-border-primary">
        <p className="text-xs text-text-muted mb-0.5">
          {getFieldLabel(field.type)}
        </p>
        <p className="text-sm font-medium text-text-primary truncate">
          {field.title || "Campo sem título"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-primary mb-4">
        <button
          className={tabClass("config")}
          onClick={() => setActiveTab("config")}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Config
        </button>
        <button
          className={tabClass("logic")}
          onClick={() => setActiveTab("logic")}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Skip Logic
          {field.skip_logic.length > 0 && (
            <span className="ml-1 bg-brand-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {field.skip_logic.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activeTab === "config" && (
          <>
            {/* Core fields */}
            <TextInput
              label="Título"
              value={field.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Digite a pergunta..."
            />

            <div>
              <Label htmlFor="field-desc">Descrição</Label>
              <textarea
                id="field-desc"
                rows={2}
                value={field.description ?? ""}
                onChange={(e) =>
                  update({ description: e.target.value || undefined })
                }
                placeholder="Instrução adicional (opcional)"
                className="w-full bg-surface-primary border border-border-primary rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary resize-none"
              />
            </div>

            <Toggle
              label="Obrigatório"
              checked={field.required}
              onChange={(v) => update({ required: v })}
            />

            {/* Divider */}
            <hr className="border-border-primary" />

            {/* Type-specific */}
            <TypeSpecificConfig field={field} onChange={update} />

            {/* Validations (text types only) */}
            {(field.type === "short_text" || field.type === "long_text") && (
              <>
                <hr className="border-border-primary" />
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Validações
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberInput
                      label="Mín. caracteres"
                      value={field.validations.min_length ?? ""}
                      min={0}
                      placeholder="—"
                      onChange={(e) =>
                        update({
                          validations: {
                            ...field.validations,
                            min_length: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                    <NumberInput
                      label="Máx. caracteres"
                      value={field.validations.max_length ?? ""}
                      min={0}
                      placeholder="—"
                      onChange={(e) =>
                        update({
                          validations: {
                            ...field.validations,
                            max_length: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <TextInput
                    label="Regex (padrão)"
                    value={field.validations.pattern ?? ""}
                    onChange={(e) =>
                      update({
                        validations: {
                          ...field.validations,
                          pattern: e.target.value || undefined,
                        },
                      })
                    }
                    placeholder="Ex: ^[0-9]{11}$"
                  />
                  <TextInput
                    label="Mensagem de erro customizada"
                    value={field.validations.custom_error ?? ""}
                    onChange={(e) =>
                      update({
                        validations: {
                          ...field.validations,
                          custom_error: e.target.value || undefined,
                        },
                      })
                    }
                    placeholder="Ex: Informe um CPF válido"
                  />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "logic" && <SkipLogicBuilder field={field} />}
      </div>
    </div>
  );
}
