import { useState, useCallback, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { useHistoryStore } from "../store/historyStore";
import { applyLayout } from "../engine/layoutEngine";
import { useUIStore } from "../store/uiStore";
import { LAYOUTS } from "../types/canvas";

function Btn({
  onClick,
  title,
  children,
  className = "",
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center h-7 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors text-xs font-semibold cursor-pointer border border-transparent hover:border-white/5 ${className}`}
    >
      {children}
    </button>
  );
}

export function TopBar() {
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const layout = useCanvasStore((s) => s.layout);
  const setLayout = useCanvasStore((s) => s.setLayout);
  const elements = useCanvasStore((s) => s.elements);
  const replaceAll = useCanvasStore((s) => s.replaceAll);

  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const openCopilot = useUIStore((s) => s.openCopilot);
  const enterPresentation = useUIStore((s) => s.enterPresentation);
  const openExport = useUIStore((s) => s.openExport);
  const openTemplates = useUIStore((s) => s.openTemplates);
  const saveStatus = useUIStore((s) => s.saveStatus);

  const reactFlowInstance = useReactFlow();
  const { zoomIn, zoomOut, zoomTo, getZoom } = reactFlowInstance;

  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) replaceAll(prev);
  }, [undo, replaceAll]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) replaceAll(next);
  }, [redo, replaceAll]);

  // Compute global progress from elements (memoized to avoid re-calc on every render)
  const { allTasks, doneTasks, totalPct, lateTasks } = useMemo(() => {
    const allTasks = elements.flatMap((el) =>
      el.type === "node" && "tasks" in el.data
        ? (el.data as { tasks: { done: boolean; due: string | null }[] }).tasks
        : [],
    );
    const doneTasks = allTasks.filter((t) => t.done).length;
    const totalPct = allTasks.length
      ? Math.round((doneTasks / allTasks.length) * 100)
      : 0;
    const lateTasks = allTasks.filter(
      (t) => !t.done && t.due && new Date(t.due) < new Date(),
    ).length;
    return { allTasks, doneTasks, totalPct, lateTasks };
  }, [elements]);

  const curLayout = LAYOUTS.find((l) => l.id === layout) ?? LAYOUTS[0];

  const saveLabel =
    saveStatus === "saving"
      ? "Salvando..."
      : saveStatus === "saved"
        ? "Salvo"
        : saveStatus === "error"
          ? "Erro"
          : "";

  return (
    <div className="h-[52px] bg-[rgba(10,10,20,0.98)] border-b border-white/5 flex items-center px-3.5 gap-2.5 shrink-0 z-50">
      {/* Back button */}
      <button
        onClick={() => (window.location.hash = "#/mindflow")}
        title="Voltar"
        className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 2L4 7l5 5" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-[#6EE7F7] to-[#A78BFA] flex items-center justify-center font-black text-sm text-[#07070f]">
          M
        </div>
        <span
          className="font-extrabold text-[15px] tracking-tight"
          style={{
            background: "linear-gradient(90deg,#6EE7F7,#A78BFA)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MindFlow
        </span>
      </div>

      <div className="w-px h-5 bg-white/[0.07]" />

      {/* Layout picker */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowLayoutPicker((v) => !v)}
          className="flex items-center gap-1.5 bg-white/5 border border-white/[0.09] rounded-[9px] px-3 py-1.5 cursor-pointer text-slate-400 text-xs font-semibold hover:text-slate-200 transition-colors"
        >
          <span className="text-[15px]">{curLayout.icon}</span>
          <span>{curLayout.label}</span>
          <span className="opacity-40 ml-0.5">▾</span>
        </button>

        {showLayoutPicker && (
          <div className="absolute top-[calc(100%+6px)] left-0 bg-[#0d0d1c] border border-white/[0.08] rounded-xl p-1.5 min-w-[200px] z-[300] shadow-[0_16px_48px_rgba(0,0,0,0.7)]">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLayout(l.id);
                  setShowLayoutPicker(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg cursor-pointer text-[13px] text-left transition-colors ${
                  layout === l.id
                    ? "bg-[rgba(110,231,247,0.08)] text-[#6EE7F7] font-bold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 font-normal"
                }`}
              >
                <span className="text-[15px] min-w-[20px]">{l.icon}</span>
                <span className="flex-1">{l.label}</span>
                {layout === l.id && <span className="text-[11px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-white/[0.07]" />

      {/* Copilot button */}
      <button
        onClick={openCopilot}
        className="flex items-center gap-1.5 bg-gradient-to-r from-[rgba(110,231,247,0.1)] to-[rgba(167,139,250,0.1)] border border-[rgba(110,231,247,0.2)] rounded-[9px] px-3 py-1.5 cursor-pointer text-[#6EE7F7] text-xs font-bold hover:from-[rgba(110,231,247,0.15)] hover:to-[rgba(167,139,250,0.15)] transition-all"
      >
        ✦ Copiloto IA
      </button>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2 mx-2">
        <div className="w-32 h-1 bg-white/[0.07] rounded-full">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${totalPct}%`,
              background: "linear-gradient(90deg,#6EE7F7,#A78BFA)",
            }}
          />
        </div>
        <span className="text-[11px] text-[#6EE7F7] font-bold">
          {totalPct}%
        </span>
        <span className="text-[11px] text-slate-600">
          {doneTasks}/{allTasks.length}
        </span>
        {lateTasks > 0 && (
          <span className="text-[10px] text-[#F87171] bg-[rgba(248,113,113,0.1)] px-1.5 py-0.5 rounded-full font-semibold">
            ⚠ {lateTasks}
          </span>
        )}
        {saveLabel && (
          <span
            className={`text-[11px] ${saveStatus === "error" ? "text-red-400" : "text-emerald-400"}`}
          >
            {saveLabel}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Btn
          onClick={handleUndo}
          title="Desfazer (Ctrl+Z)"
          className={!canUndo ? "opacity-30" : ""}
        >
          ↩
        </Btn>
        <Btn
          onClick={handleRedo}
          title="Refazer (Ctrl+Y)"
          className={!canRedo ? "opacity-30" : ""}
        >
          ↪
        </Btn>

        <div className="w-px h-5 bg-white/[0.07] mx-0.5" />

        <Btn onClick={() => zoomOut()} title="Zoom out">
          −
        </Btn>
        <Btn
          onClick={() => zoomTo(1)}
          title="Reset zoom"
          className="min-w-[46px] text-[11px]"
        >
          {Math.round((getZoom?.() ?? 1) * 100)}%
        </Btn>
        <Btn onClick={() => zoomIn()} title="Zoom in">
          +
        </Btn>

        <div className="w-px h-5 bg-white/[0.07] mx-0.5" />

        <Btn
          onClick={async () => {
            const rf = reactFlowInstance;
            if (!rf) return;
            const nodes = rf.getNodes();
            const edges = rf.getEdges();
            const result = await applyLayout(nodes, edges, layout);
            rf.setNodes(result.nodes);
            rf.setEdges(result.edges);
            setTimeout(() => rf.fitView({ padding: 0.2, duration: 800 }), 50);
          }}
          title="Organizar mapa (re-layout)"
          className="text-[#A78BFA]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mr-1"
          >
            <path d="M1.5 3.5h11M3.5 7h7M5.5 10.5h3" strokeLinecap="round" />
          </svg>
          Organizar
        </Btn>

        <div className="w-px h-5 bg-white/[0.07] mx-0.5" />

        <Btn onClick={openTemplates} title="Templates">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mr-1"
          >
            <rect x="1" y="1" width="5" height="5" rx="1" />
            <rect x="8" y="1" width="5" height="5" rx="1" />
            <rect x="1" y="8" width="5" height="5" rx="1" />
            <rect x="8" y="8" width="5" height="5" rx="1" />
          </svg>
          Templates
        </Btn>

        <Btn onClick={openExport} title="Exportar (PNG, PDF, JSON)">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mr-1"
          >
            <path
              d="M7 2v7m0 0L4.5 6.5M7 9l2.5-2.5M2 11.5h10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export
        </Btn>

        <Btn
          onClick={() => enterPresentation()}
          title="Modo Apresentacao"
          className="text-[#6EE7F7]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            className="mr-1"
          >
            <path d="M3 1.5v11l9-5.5z" />
          </svg>
          Apresentar
        </Btn>
      </div>
    </div>
  );
}
