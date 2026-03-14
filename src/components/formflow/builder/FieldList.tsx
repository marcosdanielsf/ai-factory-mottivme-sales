import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LayoutGrid } from "lucide-react";
import type { Field } from "@/lib/formflow/types";
import { useFormBuilderStore } from "@/lib/formflow/store";
import { FieldCard } from "./FieldCard";

// ---------------------------------------------------------------------------
// Sortable wrapper
// ---------------------------------------------------------------------------

interface SortableFieldItemProps {
  field: Field;
  isSelected: boolean;
}

function SortableFieldItem({ field, isSelected }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldCard
        field={field}
        isSelected={isSelected}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldList
// ---------------------------------------------------------------------------

export function FieldList() {
  const fields = useFormBuilderStore((s) => s.fields);
  const selectedFieldId = useFormBuilderStore((s) => s.selectedFieldId);
  const reorderFields = useFormBuilderStore((s) => s.reorderFields);

  const sorted = [...fields].sort((a, b) => a.position - b.position);
  const ids = sorted.map((f) => f.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sorted.findIndex((f) => f.id === active.id);
    const toIndex = sorted.findIndex((f) => f.id === over.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderFields(fromIndex, toIndex);
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-border-primary flex items-center justify-center mb-3">
          <LayoutGrid className="h-5 w-5 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">
          Nenhum campo adicionado
        </p>
        <p className="text-xs text-text-muted">
          Selecione um tipo de campo na barra lateral para começar
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sorted.map((field) => (
            <SortableFieldItem
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
