import { GripVertical, X, Copy } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import type { Field } from "@/lib/formflow/types";
import { useFormBuilderStore } from "@/lib/formflow/store";
import { getFieldIcon, getFieldLabel } from "./FieldTypePicker";

interface FieldCardProps {
  field: Field;
  isSelected: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

export function FieldCard({
  field,
  isSelected,
  dragHandleProps,
  isDragging = false,
}: FieldCardProps) {
  const selectField = useFormBuilderStore((s) => s.selectField);
  const removeField = useFormBuilderStore((s) => s.removeField);
  const duplicateField = useFormBuilderStore((s) => s.duplicateField);
  const updateField = useFormBuilderStore((s) => s.updateField);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(field.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when field changes externally
  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(field.title);
    }
  }, [field.title, isEditingTitle]);

  function handleTitleCommit() {
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed !== field.title) {
      updateField(field.id, { title: trimmed });
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleCommit();
    }
    if (e.key === "Escape") {
      setTitleDraft(field.title);
      setIsEditingTitle(false);
    }
  }

  function handleStartEdit(e: React.MouseEvent) {
    // Only start editing if already selected
    if (isSelected) {
      e.stopPropagation();
      setIsEditingTitle(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleCardClick() {
    selectField(field.id);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    removeField(field.id);
  }

  function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    duplicateField(field.id);
  }

  const positionLabel = field.position + 1;
  const displayTitle =
    field.title.trim() !== ""
      ? field.title
      : `Campo ${positionLabel} — ${getFieldLabel(field.type)}`;

  return (
    <div
      onClick={handleCardClick}
      className={[
        "group flex items-center gap-3 px-3 py-3 rounded-lg border cursor-pointer transition-all select-none",
        isSelected
          ? "border-brand-primary bg-surface-primary shadow-sm"
          : "border-border-primary bg-surface-secondary hover:border-border-primary/60 hover:bg-surface-primary",
        isDragging ? "opacity-50 shadow-lg scale-[1.02]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className="flex-shrink-0 text-text-muted opacity-40 group-hover:opacity-70 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Position badge */}
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-primary border border-border-primary text-[10px] font-semibold text-text-muted flex items-center justify-center">
        {positionLabel}
      </span>

      {/* Icon */}
      <span className={isSelected ? "text-brand-primary" : "text-text-muted"}>
        {getFieldIcon(field.type)}
      </span>

      {/* Title / inline edit */}
      <div className="flex-1 min-w-0">
        {isEditingTitle ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleCommit}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm font-medium text-text-primary outline-none border-b border-brand-primary"
            placeholder="Título do campo..."
          />
        ) : (
          <p
            className={[
              "text-sm truncate",
              field.title.trim() !== ""
                ? "font-medium text-text-primary"
                : "text-text-muted italic",
            ].join(" ")}
            onDoubleClick={handleStartEdit}
          >
            {displayTitle}
          </p>
        )}

        {/* Type badge */}
        <span className="text-[10px] text-text-muted">
          {getFieldLabel(field.type)}
        </span>
      </div>

      {/* Required indicator */}
      {field.required && (
        <span className="flex-shrink-0 text-red-500 text-sm font-bold leading-none">
          *
        </span>
      )}

      {/* Actions (visible on hover or selected) */}
      <div
        className={[
          "flex-shrink-0 flex items-center gap-1 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        ].join(" ")}
      >
        <button
          title="Duplicar campo"
          onClick={handleDuplicate}
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          title="Remover campo"
          onClick={handleDelete}
          className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-surface-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
