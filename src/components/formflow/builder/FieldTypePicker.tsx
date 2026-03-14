import {
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Star,
  SlidersHorizontal,
  Mail,
  Phone,
  Calendar,
  Upload,
  MessageSquare,
} from "lucide-react";
import type { FieldKind } from "@/lib/formflow/types";
import { useFormBuilderStore } from "@/lib/formflow/store";

// ---------------------------------------------------------------------------
// Field type definitions
// ---------------------------------------------------------------------------

interface FieldTypeOption {
  kind: FieldKind;
  label: string;
  icon: React.ReactNode;
}

interface FieldTypeGroup {
  label: string;
  types: FieldTypeOption[];
}

const FIELD_TYPE_GROUPS: FieldTypeGroup[] = [
  {
    label: "Texto",
    types: [
      {
        kind: "short_text",
        label: "Texto curto",
        icon: <Type className="h-4 w-4" />,
      },
      {
        kind: "long_text",
        label: "Texto longo",
        icon: <AlignLeft className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Escolha",
    types: [
      {
        kind: "single_choice",
        label: "Escolha única",
        icon: <CircleDot className="h-4 w-4" />,
      },
      {
        kind: "multiple_choice",
        label: "Múltipla escolha",
        icon: <CheckSquare className="h-4 w-4" />,
      },
      {
        kind: "yes_no",
        label: "Sim / Não",
        icon: <ToggleLeft className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Escala",
    types: [
      {
        kind: "rating",
        label: "Avaliação",
        icon: <Star className="h-4 w-4" />,
      },
      {
        kind: "scale",
        label: "Escala",
        icon: <SlidersHorizontal className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Contato",
    types: [
      { kind: "email", label: "E-mail", icon: <Mail className="h-4 w-4" /> },
      {
        kind: "phone",
        label: "Telefone",
        icon: <Phone className="h-4 w-4" />,
      },
      { kind: "date", label: "Data", icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    label: "Mídia",
    types: [
      {
        kind: "file_upload",
        label: "Upload",
        icon: <Upload className="h-4 w-4" />,
      },
    ],
  },
  {
    label: "Apresentação",
    types: [
      {
        kind: "statement",
        label: "Enunciado",
        icon: <MessageSquare className="h-4 w-4" />,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FieldTypePicker() {
  const addField = useFormBuilderStore((s) => s.addField);
  const selectField = useFormBuilderStore((s) => s.selectField);

  function handleAdd(kind: FieldKind) {
    const newId = addField(kind);
    selectField(newId);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted leading-relaxed">
        Clique em um tipo para adicionar ao formulário
      </p>

      {FIELD_TYPE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.types.map(({ kind, label, icon }) => (
              <button
                key={kind}
                onClick={() => handleAdd(kind)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-surface-primary transition-colors text-left group"
              >
                <span className="text-text-muted group-hover:text-brand-primary transition-colors">
                  {icon}
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Export helper to get icon by kind (used in other components)
export function getFieldIcon(kind: FieldKind): React.ReactNode {
  const all = FIELD_TYPE_GROUPS.flatMap((g) => g.types);
  const found = all.find((t) => t.kind === kind);
  return found?.icon ?? <Type className="h-4 w-4" />;
}

// Export helper to get label by kind
export function getFieldLabel(kind: FieldKind): string {
  const all = FIELD_TYPE_GROUPS.flatMap((g) => g.types);
  const found = all.find((t) => t.kind === kind);
  return found?.label ?? kind;
}
