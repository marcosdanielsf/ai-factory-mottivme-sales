
import { memo, useCallback, useState, useRef, useEffect } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { StickyData } from "../../types/elements";
import { useCanvasStore } from "../../store/canvasStore";
import { useSelectionStore } from "../../store/selectionStore";

// ── Sticky color palette ────────────────────────────────────────────────────────
const STICKY_COLORS: Record<
  StickyData["color"],
  { bg: string; border: string; text: string }
> = {
  yellow: { bg: "#fef9c3", border: "#facc15", text: "#713f12" },
  blue: { bg: "#dbeafe", border: "#60a5fa", text: "#1e3a5f" },
  green: { bg: "#dcfce7", border: "#4ade80", text: "#14532d" },
  pink: { bg: "#fce7f3", border: "#f472b6", text: "#831843" },
  purple: { bg: "#ede9fe", border: "#a78bfa", text: "#3b0764" },
};

// ── StickyNoteNode ──────────────────────────────────────────────────────────────
export const StickyNoteNode = memo(({ id, data, selected }: NodeProps) => {
  const stickyData = data as unknown as StickyData;
  const { content, color, fontSize } = stickyData;
  const palette = STICKY_COLORS[color] ?? STICKY_COLORS.yellow;

  const updateElement = useCanvasStore((s) => s.updateElement);
  const editingId = useSelectionStore((s) => s.editingId);
  const startEdit = useSelectionStore((s) => s.startEdit);
  const commitEdit = useSelectionStore((s) => s.commitEdit);

  const isEditing = editingId === id;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setDraft(content);
  }, [content]);

  const handleDoubleClick = useCallback(() => {
    startEdit(id);
  }, [id, startEdit]);

  const handleBlur = useCallback(() => {
    updateElement(id, { data: { ...stickyData, content: draft } });
    commitEdit();
  }, [id, draft, stickyData, updateElement, commitEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBlur();
      }
    },
    [handleBlur],
  );

  return (
    <>
      <NodeResizer
        color={palette.border}
        isVisible={selected}
        minWidth={120}
        minHeight={80}
      />

      <div
        className="w-full h-full rounded-md shadow-md transition-shadow duration-150 overflow-hidden"
        style={{
          backgroundColor: palette.bg,
          border: `2px solid ${selected ? palette.border : palette.border + "80"}`,
          boxShadow: selected
            ? `0 0 0 2px ${palette.border}40, 0 4px 16px rgba(0,0,0,0.3)`
            : "0 2px 8px rgba(0,0,0,0.2)",
          minWidth: 120,
          minHeight: 80,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Fold corner */}
        <div
          className="absolute top-0 right-0 w-4 h-4"
          style={{
            background: `linear-gradient(135deg, transparent 50%, ${palette.border}40 50%)`,
          }}
        />

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="nodrag nowheel w-full h-full p-3 resize-none outline-none bg-transparent"
            style={{
              color: palette.text,
              fontSize: fontSize || 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        ) : (
          <div
            className="w-full h-full p-3 whitespace-pre-wrap break-words"
            style={{
              color: palette.text,
              fontSize: fontSize || 14,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {content || (
              <span className="opacity-40 italic">
                Clique duplo para editar...
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
});

StickyNoteNode.displayName = "StickyNoteNode";
