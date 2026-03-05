
import { useState, useCallback } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useSelectionStore } from "../store/selectionStore";
import { useAIStore } from "../store/aiStore";
import { useUIStore } from "../store/uiStore";
import { KANBAN, PRIORITY, NODE_COLORS } from "../types/canvas";
import type { NodeData, Task } from "../types/elements";
import type { AISuggestion } from "../types/ai";

type Tab = "tasks" | "ai" | "overview";

const TABS: { id: Tab; label: string }[] = [
  { id: "tasks", label: "⚡ Tarefas" },
  { id: "ai", label: "✦ IA" },
  { id: "overview", label: "📊 Visão" },
];

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5px] mb-1">
      {children}
    </p>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="text-3xl opacity-20">{icon}</span>
      <p className="text-xs text-slate-700">{text}</p>
    </div>
  );
}

// ── Tasks Tab ──────────────────────────────────────────────────────────────────
function TasksTab({ nodeId }: { nodeId: string }) {
  const [newTask, setNewTask] = useState("");
  const [newPrio, setNewPrio] = useState<Task["priority"]>("medium");
  const [newDue, setNewDue] = useState("");

  const el = useCanvasStore((s) => s.getElementById(nodeId));
  const updateElement = useCanvasStore((s) => s.updateElement);

  if (!el || el.type !== "node")
    return <Empty icon="🧠" text="Selecione um nó para gerenciar tarefas" />;
  const nodeData = el.data as NodeData;

  const pct = nodeData.tasks.length
    ? Math.round(
        (nodeData.tasks.filter((t) => t.done).length / nodeData.tasks.length) *
          100,
      )
    : null;

  const isLate = (due: string | null) => !!due && new Date(due) < new Date();
  const fmt = (due: string | null) =>
    due
      ? new Date(due).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        })
      : "";

  const patch = (updates: Partial<NodeData>) =>
    updateElement(nodeId, { data: { ...nodeData, ...updates } });

  const toggleTask = (taskId: string) =>
    patch({
      tasks: nodeData.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t,
      ),
    });

  const deleteTask = (taskId: string) =>
    patch({ tasks: nodeData.tasks.filter((t) => t.id !== taskId) });

  const setTaskPriority = (taskId: string, priority: Task["priority"]) =>
    patch({
      tasks: nodeData.tasks.map((t) =>
        t.id === taskId ? { ...t, priority } : t,
      ),
    });

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: `t${Date.now()}`,
      text: newTask.trim(),
      done: false,
      priority: newPrio,
      due: newDue || null,
    };
    patch({ tasks: [...nodeData.tasks, task] });
    setNewTask("");
    setNewDue("");
  }, [newTask, newPrio, newDue, nodeData.tasks]);

  return (
    <div className="flex flex-col gap-3">
      {/* Node header */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: nodeData.color,
            boxShadow: `0 0 7px ${nodeData.color}`,
          }}
        />
        <span className="font-bold text-sm text-slate-100 flex-1 truncate">
          {nodeData.label || "…"}
        </span>
      </div>

      {/* Status selector */}
      <div>
        <SLabel>Status</SLabel>
        <div className="flex gap-1 flex-wrap mt-1">
          {KANBAN.map((k) => (
            <button
              key={k.id}
              onClick={() => patch({ status: k.id as NodeData["status"] })}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
              style={{
                background:
                  nodeData.status === k.id
                    ? `${k.color}22`
                    : "rgba(255,255,255,0.02)",
                border: `1px solid ${nodeData.status === k.id ? k.color : "rgba(255,255,255,0.06)"}`,
                color: nodeData.status === k.id ? k.color : "#2a2a40",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color selector */}
      <div>
        <SLabel>Cor</SLabel>
        <div className="flex gap-1 flex-wrap mt-1">
          {NODE_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => patch({ color: c })}
              className="w-4 h-4 rounded-full cursor-pointer transition-all"
              style={{
                background: c,
                border:
                  nodeData.color === c
                    ? "2px solid #fff"
                    : "2px solid transparent",
                boxShadow: nodeData.color === c ? `0 0 7px ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress */}
      {pct !== null && (
        <div className="p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-[9px]">
          <div className="flex justify-between mb-1.5 text-[11px] text-slate-600">
            <span>Progresso</span>
            <span className="font-bold" style={{ color: nodeData.color }}>
              {pct}%
            </span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${pct}%`, background: nodeData.color }}
            />
          </div>
          <p className="text-[10px] text-slate-700 mt-1">
            {nodeData.tasks.filter((t) => t.done).length}/
            {nodeData.tasks.length} concluídas
          </p>
        </div>
      )}

      {/* Task list */}
      <div className="flex flex-col gap-1.5">
        {nodeData.tasks.map((task) => {
          const prio = PRIORITY.find((p) => p.id === task.priority);
          const late = !task.done && isLate(task.due);
          return (
            <div
              key={task.id}
              className="px-3 py-2 rounded-[9px] border"
              style={{
                background: task.done
                  ? "rgba(52,211,153,0.03)"
                  : "rgba(255,255,255,0.02)",
                borderColor: late
                  ? "rgba(248,113,113,0.22)"
                  : task.done
                    ? "rgba(52,211,153,0.12)"
                    : "rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-start gap-2">
                <div
                  onClick={() => toggleTask(task.id)}
                  className="w-4 h-4 rounded-[4px] shrink-0 mt-0.5 cursor-pointer border flex items-center justify-center transition-all"
                  style={{
                    borderColor: task.done ? "#34D399" : "#1e1e30",
                    background: task.done
                      ? "rgba(52,211,153,0.15)"
                      : "transparent",
                  }}
                >
                  {task.done && (
                    <span className="text-[8px] text-emerald-400">✓</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs leading-relaxed mb-1"
                    style={{
                      color: task.done ? "#2a2a40" : "#cbd5e1",
                      textDecoration: task.done ? "line-through" : "none",
                    }}
                  >
                    {task.text}
                  </p>
                  <div className="flex gap-1 flex-wrap items-center">
                    {PRIORITY.map((pr2) => (
                      <button
                        key={pr2.id}
                        onClick={() =>
                          setTaskPriority(task.id, pr2.id as Task["priority"])
                        }
                        title={pr2.label}
                        className="w-4 h-4 rounded-[3px] cursor-pointer text-[8px] flex items-center justify-center transition-all"
                        style={{
                          border: `1px solid ${task.priority === pr2.id ? pr2.color : "rgba(255,255,255,0.05)"}`,
                          background:
                            task.priority === pr2.id
                              ? `${pr2.color}22`
                              : "transparent",
                          color:
                            task.priority === pr2.id ? pr2.color : "#1e1e30",
                        }}
                      >
                        {pr2.icon}
                      </button>
                    ))}
                    {task.due && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-[5px] font-medium"
                        style={{
                          color: late ? "#F87171" : "#2a2a40",
                          background: late
                            ? "rgba(248,113,113,0.08)"
                            : "rgba(255,255,255,0.03)",
                        }}
                      >
                        {late ? "⚠ " : ""}
                        {fmt(task.due)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-800 hover:text-slate-500 cursor-pointer text-sm leading-none shrink-0 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add task */}
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5">
        <SLabel>Nova tarefa</SLabel>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              addTask();
            }
          }}
          placeholder="Descreva a tarefa..."
          className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs outline-none mt-1.5 mb-2 placeholder:text-slate-700"
        />
        <div className="flex gap-1.5">
          <select
            value={newPrio}
            onChange={(e) => setNewPrio(e.target.value as Task["priority"])}
            className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-1.5 text-slate-400 text-[11px] outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            {PRIORITY.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2 py-1.5 text-slate-400 text-[11px] outline-none"
            style={{ colorScheme: "dark" }}
          />
          <button
            onClick={addTask}
            className="px-3 py-1.5 rounded-lg text-sm font-bold cursor-pointer shrink-0 transition-colors"
            style={{
              background: `${nodeData.color}1a`,
              border: `1px solid ${nodeData.color}44`,
              color: nodeData.color,
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AI Tab ─────────────────────────────────────────────────────────────────────
function AITab({ nodeId }: { nodeId: string }) {
  const el = useCanvasStore((s) => s.getElementById(nodeId));
  const {
    loading,
    suggestions,
    explanation,
    suggestTasks,
    expandNode,
    explainNode,
    acceptSuggestion,
    clearSuggestions,
  } = useAIStore();

  if (!el || el.type !== "node")
    return <Empty icon="✦" text="Selecione um nó para usar a IA" />;
  const nodeData = el.data as NodeData;

  const actions = [
    {
      label: "✦ Sugerir tarefas",
      sub: "IA analisa o nó e sugere ações",
      color: "#6EE7F7",
      id: "suggest",
      fn: () => suggestTasks(nodeId),
    },
    {
      label: "⬡ Expandir nó",
      sub: "IA cria subtópicos automaticamente",
      color: "#A78BFA",
      id: "expand",
      fn: () => expandNode(nodeId),
    },
    {
      label: "💡 Explicar",
      sub: "IA explica o tópico em detalhes",
      color: "#FBBF24",
      id: "explain",
      fn: () => explainNode(nodeId),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: nodeData.color,
            boxShadow: `0 0 7px ${nodeData.color}`,
          }}
        />
        <span className="font-bold text-sm text-slate-100 flex-1 truncate">
          {nodeData.label}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {actions.map((b) => (
          <button
            key={b.id}
            onClick={b.fn}
            disabled={loading !== "idle"}
            className="w-full px-3 py-2.5 rounded-xl text-left flex flex-col gap-1 cursor-pointer disabled:cursor-wait transition-all hover:brightness-110"
            style={{
              background: `${b.color}0a`,
              border: `1px solid ${b.color}1e`,
            }}
          >
            <div className="flex items-center gap-2">
              {loading !== "idle" && (
                <span className="text-xs animate-spin">◌</span>
              )}
              <span className="font-bold text-xs" style={{ color: b.color }}>
                {b.label}
              </span>
            </div>
            <span className="text-[11px] text-slate-700">{b.sub}</span>
          </button>
        ))}
      </div>

      {explanation && (
        <div className="p-3 bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.18)] rounded-xl text-xs text-slate-300 leading-relaxed">
          <p className="text-[10px] text-[#FBBF24] font-bold uppercase tracking-[0.5px] mb-2">
            💡 Explicação
          </p>
          {explanation}
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SLabel>Clique para adicionar</SLabel>
            <button
              onClick={clearSuggestions}
              className="text-[10px] text-slate-700 hover:text-slate-500 cursor-pointer"
            >
              limpar
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {suggestions.map((s: AISuggestion) => {
              const prio =
                s.type === "task"
                  ? PRIORITY.find(
                      (p) =>
                        p.id === (s.payload as { priority: string }).priority,
                    )
                  : null;
              return (
                <div
                  key={s.id}
                  onClick={() => acceptSuggestion(s)}
                  className="px-3 py-2 bg-[rgba(110,231,247,0.04)] border border-[rgba(110,231,247,0.1)] rounded-[9px] cursor-pointer flex items-center gap-2 hover:bg-[rgba(110,231,247,0.08)] transition-colors"
                >
                  <span className="flex-1 text-xs text-slate-300 leading-relaxed">
                    {s.label}
                  </span>
                  {prio && (
                    <span
                      className="text-[9px] px-1 py-0.5 rounded-[5px] font-bold"
                      style={{
                        color: prio.color,
                        background: `${prio.color}18`,
                      }}
                    >
                      {prio.icon}
                    </span>
                  )}
                  <span className="text-sm text-[#6EE7F7] font-bold">+</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab() {
  const elements = useCanvasStore((s) => s.elements);
  const layout = useCanvasStore((s) => s.layout);
  const setLayout = useCanvasStore((s) => s.setLayout);

  const nodes = elements.filter((e) => e.type === "node");
  const allTasks = nodes.flatMap((n) => (n.data as NodeData).tasks ?? []);
  const doneTasks = allTasks.filter((t) => t.done).length;
  const lateTasks = allTasks.filter(
    (t) => !t.done && t.due && new Date(t.due) < new Date(),
  ).length;

  const curLayout = LAYOUTS.find((l) => l.id === layout);

  const stats = [
    { label: "Nós", value: nodes.length, color: "#6EE7F7" },
    { label: "Tarefas", value: allTasks.length, color: "#A78BFA" },
    { label: "Concluídas", value: doneTasks, color: "#34D399" },
    { label: "Atrasadas", value: lateTasks, color: "#F87171" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-3 text-center rounded-xl"
            style={{
              background: `${s.color}0a`,
              border: `1px solid ${s.color}1a`,
            }}
          >
            <div className="text-xl font-extrabold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[10px] text-slate-700 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {curLayout && (
        <div className="px-3 py-2.5 bg-[rgba(110,231,247,0.05)] border border-[rgba(110,231,247,0.15)] rounded-[9px] flex items-center gap-2">
          <span className="text-lg">{curLayout.icon}</span>
          <span className="font-bold text-[#6EE7F7] text-[13px]">
            {curLayout.label}
          </span>
        </div>
      )}

      {/* Kanban breakdown */}
      <div>
        <SLabel>Por status</SLabel>
        <div className="flex flex-col gap-1 mt-1">
          {KANBAN.map((k) => {
            const count = nodes.filter(
              (n) => (n.data as NodeData).status === k.id,
            ).length;
            return (
              <div key={k.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: k.color }}
                />
                <span className="text-slate-600 flex-1">{k.label}</span>
                <span className="font-bold" style={{ color: k.color }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Import para OverviewTab
import { LAYOUTS } from "../types/canvas";

// ── RightPanel ─────────────────────────────────────────────────────────────────
export function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const selectedIds = useSelectionStore((s) => s.selected);
  const nodeId = selectedIds[0] ?? null;

  return (
    <div className="w-80 bg-[rgba(9,9,19,0.99)] border-l border-white/[0.04] flex flex-col shrink-0">
      {/* Tab header */}
      <div className="flex border-b border-white/[0.04]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 bg-transparent border-none cursor-pointer text-[11px] font-bold uppercase tracking-[0.4px] transition-colors"
            style={{
              color: activeTab === tab.id ? "#6EE7F7" : "#2a2a40",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #6EE7F7"
                  : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {activeTab === "tasks" &&
          (nodeId ? (
            <TasksTab nodeId={nodeId} />
          ) : (
            <Empty icon="🧠" text="Selecione um nó para gerenciar tarefas" />
          ))}
        {activeTab === "ai" &&
          (nodeId ? (
            <AITab nodeId={nodeId} />
          ) : (
            <Empty icon="✦" text="Selecione um nó para usar a IA" />
          ))}
        {activeTab === "overview" && <OverviewTab />}
      </div>
    </div>
  );
}
