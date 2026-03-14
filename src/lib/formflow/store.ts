/**
 * FormFlow Zustand Stores
 *
 * Dependências externas:
 *   ./types       — Form, Field, FieldKind, FieldValue, SkipLogicRule
 *   ./skip-logic  — getNextField
 *
 * Padrão: spread manual (sem immer middleware) — consistente com canvasStore.ts.
 */

import { create } from "zustand";
import type {
  Form,
  Field,
  FieldKind,
  FieldValue,
  SkipLogicRule,
} from "./types";
import { getNextField } from "./skip-logic";

// ---------------------------------------------------------------------------
// 1. useFormBuilderStore — estado do editor de formulários
// ---------------------------------------------------------------------------

interface FormBuilderState {
  // Form data
  form: Form | null;
  fields: Field[];
  selectedFieldId: string | null;
  isDirty: boolean;
  isSaving: boolean;

  // Actions — Form
  setForm: (form: Form) => void;
  updateForm: (updates: Partial<Form>) => void;

  // Actions — Fields CRUD
  addField: (type: FieldKind, position?: number) => string;
  updateField: (fieldId: string, updates: Partial<Field>) => void;
  removeField: (fieldId: string) => void;
  reorderFields: (fromIndex: number, toIndex: number) => void;
  duplicateField: (fieldId: string) => void;

  // Actions — Selection
  selectField: (fieldId: string | null) => void;

  // Actions — Skip Logic
  addSkipLogicRule: (fieldId: string, rule: SkipLogicRule) => void;
  updateSkipLogicRule: (
    fieldId: string,
    ruleId: string,
    updates: Partial<SkipLogicRule>,
  ) => void;
  removeSkipLogicRule: (fieldId: string, ruleId: string) => void;

  // Actions — Persistence flags
  markDirty: () => void;
  markSaved: () => void;
  reset: () => void;
}

const builderInitialState = {
  form: null as Form | null,
  fields: [] as Field[],
  selectedFieldId: null as string | null,
  isDirty: false,
  isSaving: false,
};

export const useFormBuilderStore = create<FormBuilderState>()((set, get) => ({
  ...builderInitialState,

  // --- Form ---

  setForm: (form) => {
    set({ form, isDirty: false });
  },

  updateForm: (updates) => {
    const current = get().form;
    if (!current) return;
    set({ form: { ...current, ...updates }, isDirty: true });
  },

  // --- Fields CRUD ---

  addField: (type, position) => {
    const id = crypto.randomUUID();
    const fields = get().fields;
    const formId = get().form?.id ?? "";

    // Determina posição de inserção (default: fim da lista)
    const insertAt =
      position !== undefined
        ? Math.max(0, Math.min(position, fields.length))
        : fields.length;

    const newField: Field = {
      id,
      form_id: formId,
      type,
      title: "",
      required: false,
      position: insertAt,
      properties: {},
      validations: {},
      skip_logic: [],
    };

    // Insere e renumera positions para manter consistência
    const before = fields.slice(0, insertAt);
    const after = fields.slice(insertAt);

    const reindexed = [
      ...before,
      newField,
      ...after.map((f) => ({ ...f, position: f.position + 1 })),
    ];

    set({ fields: reindexed, isDirty: true });
    return id;
  },

  updateField: (fieldId, updates) => {
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
      isDirty: true,
    }));
  },

  removeField: (fieldId) => {
    set((s) => {
      const filtered = s.fields
        .filter((f) => f.id !== fieldId)
        .map((f, idx) => ({ ...f, position: idx }));

      return {
        fields: filtered,
        selectedFieldId:
          s.selectedFieldId === fieldId ? null : s.selectedFieldId,
        isDirty: true,
      };
    });
  },

  reorderFields: (fromIndex, toIndex) => {
    const fields = [...get().fields].sort((a, b) => a.position - b.position);

    if (
      fromIndex < 0 ||
      fromIndex >= fields.length ||
      toIndex < 0 ||
      toIndex >= fields.length
    ) {
      return;
    }

    // Remove do índice de origem e insere no destino
    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);

    // Renumera todos os positions
    const reindexed = fields.map((f, idx) => ({ ...f, position: idx }));

    set({ fields: reindexed, isDirty: true });
  },

  duplicateField: (fieldId) => {
    const fields = get().fields;
    const source = fields.find((f) => f.id === fieldId);
    if (!source) return;

    const newId = crypto.randomUUID();
    const insertAt = source.position + 1;

    const duplicate: Field = {
      ...source,
      id: newId,
      position: insertAt,
      // Limpa skip logic rules no duplicado — regras dependem do ID original
      skip_logic: [],
    };

    const reindexed = fields.map((f) =>
      f.position >= insertAt ? { ...f, position: f.position + 1 } : f,
    );

    set({
      fields: [...reindexed, duplicate].sort((a, b) => a.position - b.position),
      isDirty: true,
    });
  },

  // --- Selection ---

  selectField: (fieldId) => {
    set({ selectedFieldId: fieldId });
  },

  // --- Skip Logic ---

  addSkipLogicRule: (fieldId, rule) => {
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId ? { ...f, skip_logic: [...f.skip_logic, rule] } : f,
      ),
      isDirty: true,
    }));
  },

  updateSkipLogicRule: (fieldId, ruleId, updates) => {
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              skip_logic: f.skip_logic.map((r) =>
                r.id === ruleId ? { ...r, ...updates } : r,
              ),
            }
          : f,
      ),
      isDirty: true,
    }));
  },

  removeSkipLogicRule: (fieldId, ruleId) => {
    set((s) => ({
      fields: s.fields.map((f) =>
        f.id === fieldId
          ? {
              ...f,
              skip_logic: f.skip_logic.filter((r) => r.id !== ruleId),
            }
          : f,
      ),
      isDirty: true,
    }));
  },

  // --- Persistence flags ---

  markDirty: () => set({ isDirty: true }),

  markSaved: () => set({ isDirty: false, isSaving: false }),

  reset: () => set({ ...builderInitialState }),
}));

// ---------------------------------------------------------------------------
// 2. useFormPlayerStore — estado do respondente (player)
// ---------------------------------------------------------------------------

interface FormPlayerState {
  // Form data (readonly após init)
  form: Form | null;
  fields: Field[];

  // Player state
  currentFieldIndex: number;
  answers: Record<string, FieldValue>;
  startedAt: Date | null;
  isSubmitting: boolean;
  isComplete: boolean;
  submissionId: string | null;

  // Navigation
  goToNext: () => void;
  goToPrevious: () => void;
  goToField: (fieldId: string) => void;

  // Answers
  setAnswer: (fieldId: string, value: FieldValue) => void;

  // Lifecycle
  initPlayer: (form: Form, fields: Field[]) => void;
  submitForm: () => Promise<void>;
  reset: () => void;

  // Computed — funções que derivam do estado (chamar em componentes via selector)
  getCurrentField: () => Field | null;
  getProgress: () => number;
  getCanGoBack: () => boolean;
  getCanGoNext: () => boolean;
  getTotalFields: () => number;
  getAnsweredFields: () => number;
}

const playerInitialState = {
  form: null as Form | null,
  fields: [] as Field[],
  currentFieldIndex: 0,
  answers: {} as Record<string, FieldValue>,
  startedAt: null as Date | null,
  isSubmitting: false,
  isComplete: false,
  submissionId: null as string | null,
};

export const useFormPlayerStore = create<FormPlayerState>()((set, get) => ({
  ...playerInitialState,

  // --- Computed (funções que derivam do estado) ---

  getCurrentField: (): Field | null => {
    const { fields, currentFieldIndex } = get();
    return fields[currentFieldIndex] ?? null;
  },

  getProgress: (): number => {
    const { fields, currentFieldIndex } = get();
    if (fields.length === 0) return 0;
    return Math.round((currentFieldIndex / fields.length) * 100);
  },

  getCanGoBack: (): boolean => {
    return get().currentFieldIndex > 0;
  },

  getCanGoNext: (): boolean => {
    const { fields, currentFieldIndex, answers } = get();
    const field = fields[currentFieldIndex];
    if (!field) return false;
    if (!field.required) return true;
    const answer = answers[field.id];
    return answer !== undefined && answer !== null && answer !== "";
  },

  getTotalFields: (): number => {
    return get().fields.length;
  },

  getAnsweredFields: (): number => {
    const { fields, answers } = get();
    return fields.filter((f) => {
      const a = answers[f.id];
      return a !== undefined && a !== null && a !== "";
    }).length;
  },

  // --- Navigation ---

  goToNext: () => {
    const { fields, currentFieldIndex, answers } = get();
    const currentField = fields[currentFieldIndex];
    if (!currentField) return;

    // Delega ao skip-logic engine para determinar o próximo campo
    const nextFieldId = getNextField(currentField.id, fields, answers);

    if (nextFieldId === null) {
      // Campo atual não encontrado — erro de dados, não avança
      return;
    }

    if (nextFieldId === "end") {
      // Formulário concluído via skip logic ou último campo
      set({ isComplete: true });
      return;
    }

    const nextIndex = fields.findIndex((f) => f.id === nextFieldId);
    if (nextIndex !== -1) {
      set({ currentFieldIndex: nextIndex });
    }
  },

  goToPrevious: () => {
    const { currentFieldIndex } = get();
    if (currentFieldIndex <= 0) return;
    // Voltar é sempre linear — sem skip logic reverso
    set({ currentFieldIndex: currentFieldIndex - 1 });
  },

  goToField: (fieldId) => {
    const { fields } = get();
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index !== -1) {
      set({ currentFieldIndex: index });
    }
  },

  // --- Answers ---

  setAnswer: (fieldId, value) => {
    set((s) => ({
      answers: { ...s.answers, [fieldId]: value },
    }));
  },

  // --- Lifecycle ---

  initPlayer: (form, fields) => {
    const sorted = [...fields].sort((a, b) => a.position - b.position);
    set({
      form,
      fields: sorted,
      currentFieldIndex: 0,
      answers: {},
      startedAt: new Date(),
      isSubmitting: false,
      isComplete: false,
      submissionId: null,
    });
  },

  submitForm: async () => {
    set({ isSubmitting: true });

    try {
      // TODO: chamar Supabase — inserir em ff_submissions + answers
      const submissionId = crypto.randomUUID();

      set({
        isSubmitting: false,
        isComplete: true,
        submissionId,
      });
    } catch (err: unknown) {
      set({ isSubmitting: false });
      throw err;
    }
  },

  reset: () => set({ ...playerInitialState }),
}));
