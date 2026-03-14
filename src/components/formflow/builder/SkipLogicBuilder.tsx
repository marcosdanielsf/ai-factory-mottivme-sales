import { Plus, X, GitBranch } from "lucide-react";
import type { Field, SkipLogicRule, LogicOperator } from "@/lib/formflow/types";
import { useFormBuilderStore } from "@/lib/formflow/store";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OPERATOR_LABELS: Record<LogicOperator, string> = {
  eq: "é igual a",
  neq: "é diferente de",
  contains: "contém",
  gt: "é maior que",
  lt: "é menor que",
  is_empty: "está vazio",
  is_not_empty: "não está vazio",
};

const OPERATORS_WITHOUT_VALUE: LogicOperator[] = ["is_empty", "is_not_empty"];

// ---------------------------------------------------------------------------
// RuleRow
// ---------------------------------------------------------------------------

interface RuleRowProps {
  rule: SkipLogicRule;
  fieldId: string;
  allFields: Field[];
  currentFieldIndex: number;
}

function RuleRow({
  rule,
  fieldId,
  allFields,
  currentFieldIndex,
}: RuleRowProps) {
  const updateSkipLogicRule = useFormBuilderStore((s) => s.updateSkipLogicRule);
  const removeSkipLogicRule = useFormBuilderStore((s) => s.removeSkipLogicRule);

  // Only fields before the current one can be referenced as conditions
  const referenceableFields = allFields.filter(
    (f) => f.id !== fieldId && f.position < currentFieldIndex,
  );

  // Destination fields = all except current, plus "end"
  const destinationFields = allFields.filter((f) => f.id !== fieldId);

  const needsValue = !OPERATORS_WITHOUT_VALUE.includes(rule.operator);

  function update(changes: Partial<SkipLogicRule>) {
    updateSkipLogicRule(fieldId, rule.id, changes);
  }

  const selectClass =
    "flex-1 min-w-0 bg-surface-primary border border-border-primary rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary";
  const inputClass =
    "flex-1 min-w-0 bg-surface-primary border border-border-primary rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary";

  return (
    <div className="border border-border-primary rounded-lg p-3 space-y-2 bg-surface-primary">
      {/* Condition row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-muted whitespace-nowrap">Se</span>

        {/* Reference field */}
        <select
          value={rule.field_id}
          onChange={(e) => update({ field_id: e.target.value })}
          className={selectClass}
        >
          <option value="">Selecione um campo</option>
          {referenceableFields.length === 0 && (
            <option value={fieldId} disabled>
              (sem campos anteriores)
            </option>
          )}
          {referenceableFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title || `Campo ${f.position + 1}`}
            </option>
          ))}
        </select>

        {/* Operator */}
        <select
          value={rule.operator}
          onChange={(e) =>
            update({ operator: e.target.value as LogicOperator })
          }
          className={selectClass}
        >
          {(Object.keys(OPERATOR_LABELS) as LogicOperator[]).map((op) => (
            <option key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </option>
          ))}
        </select>

        {/* Value (hidden for is_empty / is_not_empty) */}
        {needsValue && (
          <input
            type="text"
            value={rule.value != null ? String(rule.value) : ""}
            onChange={(e) => update({ value: e.target.value })}
            placeholder="Valor..."
            className={inputClass}
          />
        )}
      </div>

      {/* Then row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-muted whitespace-nowrap">
          Ir para
        </span>

        <select
          value={rule.then.go_to}
          onChange={(e) => update({ then: { go_to: e.target.value } })}
          className={selectClass}
        >
          <option value="">Selecione destino</option>
          <option value="end">Encerrar formulário</option>
          {destinationFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title || `Campo ${f.position + 1}`}
            </option>
          ))}
        </select>

        {/* Remove button */}
        <button
          onClick={() => removeSkipLogicRule(fieldId, rule.id)}
          title="Remover regra"
          className="flex-shrink-0 p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-surface-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkipLogicBuilder
// ---------------------------------------------------------------------------

interface SkipLogicBuilderProps {
  field: Field;
}

export function SkipLogicBuilder({ field }: SkipLogicBuilderProps) {
  const fields = useFormBuilderStore((s) => s.fields);
  const addSkipLogicRule = useFormBuilderStore((s) => s.addSkipLogicRule);

  const sorted = [...fields].sort((a, b) => a.position - b.position);
  const currentIndex = sorted.findIndex((f) => f.id === field.id);

  function handleAddRule() {
    const newRule: SkipLogicRule = {
      id: crypto.randomUUID(),
      field_id: field.id,
      operator: "eq",
      value: "",
      then: { go_to: "end" },
    };
    addSkipLogicRule(field.id, newRule);
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-brand-primary" />
        <span className="text-xs font-semibold text-text-primary">
          Skip Logic
        </span>
        <span className="ml-auto text-xs text-text-muted">
          {field.skip_logic.length} regra
          {field.skip_logic.length !== 1 ? "s" : ""}
        </span>
      </div>

      {currentIndex === 0 && (
        <p className="text-xs text-text-muted bg-surface-secondary rounded-lg p-2.5 border border-border-primary">
          Skip logic usa respostas de campos anteriores. Adicione mais campos
          antes deste para criar regras.
        </p>
      )}

      {/* Rules */}
      {field.skip_logic.length > 0 && (
        <div className="space-y-2">
          {field.skip_logic.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              fieldId={field.id}
              allFields={sorted}
              currentFieldIndex={currentIndex}
            />
          ))}
        </div>
      )}

      {field.skip_logic.length === 0 && currentIndex > 0 && (
        <p className="text-xs text-text-muted text-center py-3">
          Nenhuma regra configurada — o formulário avança linearmente
        </p>
      )}

      {/* Add rule button */}
      <button
        onClick={handleAddRule}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border-primary text-xs text-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Adicionar regra
      </button>
    </div>
  );
}
