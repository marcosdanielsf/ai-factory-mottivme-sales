
import { memo, useCallback, useState, useRef, useEffect } from "react";
import { type NodeProps } from "@xyflow/react";
import type { TextData } from "../../types/elements";
import { useCanvasStore } from "../../store/canvasStore";
import { useSelectionStore } from "../../store/selectionStore";

// ── FreeTextNode — borderless text on canvas ────────────────────────────────────
export const FreeTextNode = memo(({ id, data, selected }: NodeProps) => {
  const textData = data as unknown as TextData;
  const { content, fontSize, fontWeight, color, align } = textData;

  const updateElement = useCanvasStore((s) => s.updateElement);
  const editingId = useSelectionStore((s) => s.editingId);
  const startEdit = useSelectionStore((s) => s.startEdit);
  const commitEdit = useSelectionStore((s) => s.commitEdit);

  const isEditing = editingId === id;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const handleDoubleClick = useCallback(() => {
    startEdit(id);
  }, [id, startEdit]);

  const handleBlur = useCallback(() => {
    updateElement(id, { data: { ...textData, content: draft } });
    commitEdit();
  }, [id, draft, textData, updateElement, commitEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBlur();
      }
    },
    [handleBlur],
  );

  return (
    <div
      className="relative"
      style={{
        minWidth: 40,
        minHeight: 24,
        outline: selected ? "1px dashed rgba(110,231,247,0.4)" : "none",
        outlineOffset: 4,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="nodrag nowheel bg-transparent outline-none resize-none w-full"
          style={{
            fontSize: fontSize || 16,
            fontWeight: fontWeight || "normal",
            color: color || "#e2e8f0",
            textAlign: align || "left",
            fontFamily: "'DM Sans', sans-serif",
            minWidth: 80,
            minHeight: 32,
          }}
          rows={Math.max(1, (draft || "").split("\n").length)}
        />
      ) : (
        <div
          className="whitespace-pre-wrap break-words select-none"
          style={{
            fontSize: fontSize || 16,
            fontWeight: fontWeight || "normal",
            color: color || "#e2e8f0",
            textAlign: align || "left",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {content || (
            <span className="opacity-30 italic">Texto...</span>
          )}
        </div>
      )}
    </div>
  );
});

FreeTextNode.displayName = "FreeTextNode";
