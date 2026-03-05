
import { memo, useCallback } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import type { NodeData, Task } from "../../types/elements";
import { KANBAN, PRIORITY } from "../../types/canvas";
import { useCanvasStore } from "../../store/canvasStore";
import { useSelectionStore } from "../../store/selectionStore";

// ── Helpers ────────────────────────────────────────────────────────────────────
const pct = (tasks: Task[]) =>
  tasks.length
    ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
    : null;

const isLate = (due: string | null) => !!due && new Date(due) < new Date();

const fmt = (due: string | null) =>
  due
    ? new Date(due).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "";

// ── Status badge colors (v4 palette) ──────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  backlog: "bg-slate-700 text-slate-300",
  todo: "bg-blue-900/60 text-blue-300",
  doing: "bg-yellow-900/60 text-yellow-300",
  review: "bg-purple-900/60 text-purple-300",
  done: "bg-emerald-900/60 text-emerald-300",
};

// ── MindMapNode component ──────────────────────────────────────────────────────
// memo() OBRIGATORIO para performance no React Flow
export const MindMapNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as NodeData;
  const { label, color, status, tasks, emoji } = nodeData;

  const updateElement = useCanvasStore((s) => s.updateElement);
  const startEdit = useSelectionStore((s) => s.startEdit);

  const progress = pct(tasks);
  const completedCount = tasks.filter((t) => t.done).length;
  const kanban = KANBAN.find((k) => k.id === status);

  const handleDoubleClick = useCallback(() => {
    startEdit(id);
  }, [id, startEdit]);

  const handleTaskToggle = useCallback(
    (taskId: string) => {
      const updatedTasks = tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t,
      );
      updateElement(id, { data: { ...nodeData, tasks: updatedTasks } });
    },
    [id, tasks, nodeData, updateElement],
  );

  const isRoot = !data.parentId;

  return (
    <>
      {/* Resize handle — shown when selected */}
      <NodeResizer
        color={color}
        isVisible={selected}
        minWidth={140}
        minHeight={56}
        lineStyle={{ borderColor: color }}
        handleStyle={{ borderColor: color, backgroundColor: "#07070f" }}
      />

      {/* Connection handles */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: color, border: "none", width: 6, height: 6 }}
        />
      )}

      {/* ── Node card ── */}
      <div
        className="rounded-xl overflow-hidden transition-all duration-150 cursor-pointer select-none"
        style={{
          minWidth: 140,
          minHeight: 56,
          border: `2px solid ${selected ? color : color + "80"}`,
          backgroundColor: color + "12",
          boxShadow: selected
            ? `0 0 0 2px ${color}40, 0 8px 32px ${color}20`
            : `0 2px 8px rgba(0,0,0,0.4)`,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center gap-2"
          style={{ backgroundColor: color + "20" }}
        >
          {emoji && <span className="text-base leading-none">{emoji}</span>}
          <span
            className="font-semibold text-sm leading-tight flex-1 truncate"
            style={{ color }}
          >
            {label || <span className="opacity-40 italic">Nova ideia</span>}
          </span>
          {/* Status badge */}
          {kanban && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[status]}`}
            >
              {kanban.label}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="h-[2px] bg-white/5">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        )}

        {/* Tasks preview (max 3) */}
        {tasks.length > 0 && (
          <div className="px-3 py-2 space-y-1">
            {tasks.slice(0, 3).map((task) => {
              const prio = PRIORITY.find((p) => p.id === task.priority);
              const late = !task.done && isLate(task.due);

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-1.5 text-xs"
                >
                  {/* nodrag class prevents drag on interactive elements */}
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleTaskToggle(task.id)}
                    className="nodrag shrink-0 accent-current cursor-pointer"
                    style={{ accentColor: color }}
                  />
                  <span
                    className={`flex-1 truncate ${task.done ? "line-through opacity-40" : "text-slate-200"}`}
                  >
                    {task.text}
                  </span>
                  {prio && (
                    <span title={prio.label} style={{ color: prio.color }}>
                      {prio.icon}
                    </span>
                  )}
                  {task.due && (
                    <span
                      className={`text-[10px] ${late ? "text-red-400" : "text-slate-500"}`}
                    >
                      {fmt(task.due)}
                    </span>
                  )}
                </div>
              );
            })}
            {tasks.length > 3 && (
              <p className="text-[10px] text-slate-500 pl-4">
                +{tasks.length - 3} mais
              </p>
            )}
          </div>
        )}

        {/* Footer: task count */}
        {tasks.length > 0 && (
          <div
            className="px-3 py-1 text-[10px] text-slate-500 border-t"
            style={{ borderColor: color + "20" }}
          >
            {completedCount}/{tasks.length} tarefas
            {progress !== null && (
              <span className="ml-1" style={{ color }}>
                {progress}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, border: "none", width: 6, height: 6 }}
      />
    </>
  );
});

MindMapNode.displayName = "MindMapNode";
