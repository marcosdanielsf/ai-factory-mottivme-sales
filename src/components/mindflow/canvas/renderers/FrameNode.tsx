
import { memo, useCallback, useState, useRef, useEffect } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import type { FrameData } from "../../types/elements";
import { useCanvasStore } from "../../store/canvasStore";
import { useSelectionStore } from "../../store/selectionStore";

// ── FrameNode — grouping container with title ───────────────────────────────────
export const FrameNode = memo(({ id, data, selected }: NodeProps) => {
  const frameData = data as unknown as FrameData;
  const { title, background, borderColor } = frameData;

  const updateElement = useCanvasStore((s) => s.updateElement);
  const editingId = useSelectionStore((s) => s.editingId);
  const startEdit = useSelectionStore((s) => s.startEdit);
  const commitEdit = useSelectionStore((s) => s.commitEdit);

  const isEditing = editingId === id;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  const handleDoubleClick = useCallback(() => {
    startEdit(id);
  }, [id, startEdit]);

  const handleBlur = useCallback(() => {
    updateElement(id, { data: { ...frameData, title: draft } });
    commitEdit();
  }, [id, draft, frameData, updateElement, commitEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        handleBlur();
      }
    },
    [handleBlur],
  );

  const borderClr = borderColor || "rgba(110,231,247,0.3)";
  const bgClr = background || "rgba(110,231,247,0.04)";

  return (
    <>
      <NodeResizer
        color={borderClr}
        isVisible={selected}
        minWidth={200}
        minHeight={150}
      />

      <div
        className="w-full h-full rounded-lg overflow-visible"
        style={{
          backgroundColor: bgClr,
          border: `1.5px ${selected ? "solid" : "dashed"} ${borderClr}`,
          boxShadow: selected ? `0 0 0 2px ${borderClr}40` : undefined,
        }}
      >
        {/* Title bar at top */}
        <div
          className="absolute -top-7 left-1 flex items-center gap-1.5"
          onDoubleClick={handleDoubleClick}
        >
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            {isEditing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="nodrag bg-transparent outline-none text-[10px] text-slate-300 uppercase tracking-wider font-medium border-b border-slate-600 w-32"
              />
            ) : (
              title || "Frame"
            )}
          </span>
        </div>
      </div>
    </>
  );
});

FrameNode.displayName = "FrameNode";
