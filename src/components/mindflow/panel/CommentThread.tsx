
import { useState, useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import type { CommentData, CommentReply } from "../types/elements";

function formatDate(iso: string) {
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
}

function CommentItem({
  elementId,
  commentData,
}: {
  elementId: string;
  commentData: CommentData;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const toggleResolved = useCallback(() => {
    updateElement(elementId, {
      data: { ...commentData, resolved: !commentData.resolved },
    });
  }, [elementId, commentData, updateElement]);

  const addReply = useCallback(() => {
    if (!replyText.trim()) return;
    const reply: CommentReply = {
      id: `r${Date.now()}`,
      author: "Eu",
      authorId: "local",
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    updateElement(elementId, {
      data: {
        ...commentData,
        replies: [...commentData.replies, reply],
      },
    });
    setReplyText("");
    setShowReply(false);
  }, [elementId, commentData, replyText, updateElement]);

  const borderColor = commentData.resolved ? "#34D399" : "#FBBF24";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: commentData.resolved
          ? "rgba(52,211,153,0.04)"
          : "rgba(251,191,36,0.04)",
        border: `1px solid ${commentData.resolved ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)"}`,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: borderColor }}
        />
        <span className="text-xs font-bold text-slate-200 flex-1 truncate">
          {commentData.author}
        </span>
        <span className="text-[10px] text-slate-600">
          {formatDate(commentData.createdAt)}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <p className="text-xs text-slate-300 leading-relaxed">
          {commentData.content}
        </p>
      </div>

      {/* Replies */}
      {commentData.replies.length > 0 && (
        <div className="px-3 pb-2 space-y-1.5">
          {commentData.replies.map((reply) => (
            <div key={reply.id} className="pl-2 border-l-2 border-white/[0.08]">
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

      {/* Actions */}
      <div className="px-3 py-1.5 flex gap-2 border-t border-white/[0.04]">
        <button
          onClick={toggleResolved}
          className="text-[10px] font-medium cursor-pointer transition-colors"
          style={{ color: commentData.resolved ? "#34D399" : "#FBBF24" }}
        >
          {commentData.resolved ? "\u2713 Resolvido" : "\u25CB Resolver"}
        </button>
        <button
          onClick={() => setShowReply(!showReply)}
          className="text-[10px] text-slate-600 hover:text-slate-400 cursor-pointer transition-colors"
        >
          Responder
        </button>
      </div>

      {/* Reply input */}
      {showReply && (
        <div className="px-3 pb-2 flex gap-1.5">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                addReply();
              }
            }}
            placeholder="Responder..."
            className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs outline-none placeholder:text-slate-700"
            autoFocus
          />
          <button
            onClick={addReply}
            className="px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors"
            style={{
              background: `${borderColor}1a`,
              border: `1px solid ${borderColor}44`,
              color: borderColor,
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export function CommentThread() {
  const elements = useCanvasStore((s) => s.elements);
  const comments = elements.filter((el) => el.type === "comment");

  const openCount = comments.filter(
    (c) => !(c.data as CommentData).resolved,
  ).length;
  const resolvedCount = comments.filter(
    (c) => (c.data as CommentData).resolved,
  ).length;

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <span className="text-3xl opacity-20">{"\u{1F4AC}"}</span>
        <p className="text-xs text-slate-700">
          Nenhum comentario ainda. Use a ferramenta Comentario na toolbar para
          adicionar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div className="flex gap-2">
        <div
          className="flex-1 p-2 text-center rounded-lg"
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.15)",
          }}
        >
          <div className="text-sm font-bold text-[#FBBF24]">{openCount}</div>
          <div className="text-[10px] text-slate-700">Abertos</div>
        </div>
        <div
          className="flex-1 p-2 text-center rounded-lg"
          style={{
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.15)",
          }}
        >
          <div className="text-sm font-bold text-[#34D399]">
            {resolvedCount}
          </div>
          <div className="text-[10px] text-slate-700">Resolvidos</div>
        </div>
      </div>

      {/* Open comments first */}
      {comments
        .sort((a, b) => {
          const aResolved = (a.data as CommentData).resolved;
          const bResolved = (b.data as CommentData).resolved;
          if (aResolved !== bResolved) return aResolved ? 1 : -1;
          return (
            new Date((b.data as CommentData).createdAt).getTime() -
            new Date((a.data as CommentData).createdAt).getTime()
          );
        })
        .map((el) => (
          <CommentItem
            key={el.id}
            elementId={el.id}
            commentData={el.data as CommentData}
          />
        ))}
    </div>
  );
}
