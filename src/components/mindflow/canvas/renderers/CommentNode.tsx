
import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CommentData } from "../../types/elements";
import { useCanvasStore } from "../../store/canvasStore";
import { useSelectionStore } from "../../store/selectionStore";

export const CommentNode = memo(({ id, data, selected }: NodeProps) => {
  const commentData = data as unknown as CommentData;
  const { author, content, resolved, replies, createdAt } = commentData;
  const [expanded, setExpanded] = useState(false);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  const toggleResolved = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateElement(id, {
        data: { ...commentData, resolved: !resolved },
      });
    },
    [id, commentData, resolved, updateElement],
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // Collapsed: small bubble
  if (!expanded) {
    return (
      <>
        <div
          onClick={toggleExpand}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all"
          style={{
            background: resolved
              ? "rgba(52,211,153,0.15)"
              : "rgba(251,191,36,0.15)",
            border: `2px solid ${resolved ? "#34D399" : "#FBBF24"}`,
            boxShadow: selected
              ? `0 0 0 2px ${resolved ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)"}`
              : "0 2px 8px rgba(0,0,0,0.4)",
          }}
          title={`${author}: ${content}`}
        >
          <span className="text-sm">{resolved ? "\u2713" : "\u{1F4AC}"}</span>
        </div>
        {replies.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F472B6] text-white text-[9px] font-bold flex items-center justify-center">
            {replies.length}
          </div>
        )}
      </>
    );
  }

  // Expanded: full card
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: resolved ? "#34D399" : "#FBBF24",
          border: "none",
          width: 6,
          height: 6,
        }}
      />

      <div
        className="rounded-xl overflow-hidden transition-all duration-150 select-none"
        style={{
          width: 260,
          border: `2px solid ${resolved ? "#34D399" : "#FBBF24"}`,
          backgroundColor: resolved
            ? "rgba(52,211,153,0.06)"
            : "rgba(251,191,36,0.06)",
          boxShadow: selected
            ? `0 0 0 2px ${resolved ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}, 0 8px 32px rgba(0,0,0,0.3)`
            : "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{
            backgroundColor: resolved
              ? "rgba(52,211,153,0.1)"
              : "rgba(251,191,36,0.1)",
          }}
        >
          <span className="text-xs font-bold text-slate-200 flex-1 truncate">
            {author}
          </span>
          <span className="text-[10px] text-slate-600">
            {formatDate(createdAt)}
          </span>
          <button
            onClick={toggleResolved}
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium cursor-pointer transition-colors"
            style={{
              background: resolved
                ? "rgba(52,211,153,0.15)"
                : "rgba(251,191,36,0.15)",
              color: resolved ? "#34D399" : "#FBBF24",
              border: `1px solid ${resolved ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)"}`,
            }}
          >
            {resolved ? "Resolvido" : "Aberto"}
          </button>
          <button
            onClick={toggleExpand}
            className="text-slate-600 hover:text-slate-300 cursor-pointer text-xs"
          >
            {"\u2715"}
          </button>
        </div>

        {/* Content */}
        <div className="px-3 py-2">
          <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="px-3 pb-2 space-y-1.5">
            <div className="h-px bg-white/[0.06]" />
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="pl-2 border-l-2 border-white/[0.08]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    {reply.author}
                  </span>
                  <span className="text-[9px] text-slate-700">
                    {formatDate(reply.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: resolved ? "#34D399" : "#FBBF24",
          border: "none",
          width: 6,
          height: 6,
        }}
      />
    </>
  );
});

CommentNode.displayName = "CommentNode";
