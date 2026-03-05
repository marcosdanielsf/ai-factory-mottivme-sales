"use client";

import { useCallback, useState } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { applyLayout } from "../engine/layoutEngine";
import type { CanvasElement } from "../types/elements";
import type { LayoutType } from "../types/canvas";

// ── Template definitions ──────────────────────────────────────────────────────

interface MindFlowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  layout: LayoutType;
  elements: Omit<CanvasElement, "id">[];
}

const TEMPLATES: MindFlowTemplate[] = [
  {
    id: "brainstorm",
    name: "Brainstorm",
    description: "1 ideia central + 5 ramos criativos",
    icon: "\u{1F4A1}",
    layout: "radial",
    elements: [
      {
        type: "node",
        x: 500,
        y: 350,
        width: 180,
        height: 64,
        data: {
          label: "Ideia Central",
          color: "#6EE7F7",
          status: "doing",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 250,
        y: 150,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Conceito A",
          color: "#A78BFA",
          status: "backlog",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 750,
        y: 150,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Conceito B",
          color: "#F472B6",
          status: "backlog",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 150,
        y: 400,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Conceito C",
          color: "#34D399",
          status: "backlog",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 850,
        y: 400,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Conceito D",
          color: "#FBBF24",
          status: "backlog",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 500,
        y: 580,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Conceito E",
          color: "#FB923C",
          status: "backlog",
          tasks: [],
        },
      },
    ],
  },
  {
    id: "projeto",
    name: "Projeto",
    description: "Estrutura de projeto com fases e tarefas",
    icon: "\u{1F4CB}",
    layout: "topdown",
    elements: [
      {
        type: "node",
        x: 500,
        y: 50,
        width: 180,
        height: 64,
        data: {
          label: "Meu Projeto",
          color: "#6EE7F7",
          status: "doing",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 200,
        y: 200,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Planejamento",
          color: "#A78BFA",
          status: "doing",
          tasks: [
            {
              id: "t1",
              text: "Definir escopo",
              done: true,
              priority: "high",
              due: null,
            },
            {
              id: "t2",
              text: "Cronograma",
              done: false,
              priority: "medium",
              due: null,
            },
          ],
        },
      },
      {
        type: "node",
        x: 500,
        y: 200,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Execucao",
          color: "#34D399",
          status: "todo",
          tasks: [
            {
              id: "t3",
              text: "Desenvolver MVP",
              done: false,
              priority: "high",
              due: null,
            },
            {
              id: "t4",
              text: "Testes",
              done: false,
              priority: "medium",
              due: null,
            },
          ],
        },
      },
      {
        type: "node",
        x: 800,
        y: 200,
        width: 164,
        height: 64,
        parentId: "__root__",
        data: {
          label: "Entrega",
          color: "#FBBF24",
          status: "backlog",
          tasks: [
            {
              id: "t5",
              text: "Deploy",
              done: false,
              priority: "urgent",
              due: null,
            },
            {
              id: "t6",
              text: "Feedback",
              done: false,
              priority: "medium",
              due: null,
            },
          ],
        },
      },
    ],
  },
  {
    id: "swot",
    name: "SWOT",
    description: "4 quadrantes: Forcas, Fraquezas, Oportunidades, Ameacas",
    icon: "\u{1F3AF}",
    layout: "radial",
    elements: [
      {
        type: "frame",
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        data: {
          title: "Forcas (S)",
          background: "rgba(52,211,153,0.06)",
          borderColor: "rgba(52,211,153,0.3)",
        },
      },
      {
        type: "sticky",
        x: 80,
        y: 100,
        width: 160,
        height: 120,
        data: { content: "Equipe qualificada", color: "green", fontSize: 13 },
      },
      {
        type: "frame",
        x: 500,
        y: 50,
        width: 400,
        height: 300,
        data: {
          title: "Fraquezas (W)",
          background: "rgba(248,113,113,0.06)",
          borderColor: "rgba(248,113,113,0.3)",
        },
      },
      {
        type: "sticky",
        x: 530,
        y: 100,
        width: 160,
        height: 120,
        data: { content: "Recursos limitados", color: "pink", fontSize: 13 },
      },
      {
        type: "frame",
        x: 50,
        y: 400,
        width: 400,
        height: 300,
        data: {
          title: "Oportunidades (O)",
          background: "rgba(96,165,250,0.06)",
          borderColor: "rgba(96,165,250,0.3)",
        },
      },
      {
        type: "sticky",
        x: 80,
        y: 450,
        width: 160,
        height: 120,
        data: {
          content: "Mercado em crescimento",
          color: "blue",
          fontSize: 13,
        },
      },
      {
        type: "frame",
        x: 500,
        y: 400,
        width: 400,
        height: 300,
        data: {
          title: "Ameacas (T)",
          background: "rgba(251,191,36,0.06)",
          borderColor: "rgba(251,191,36,0.3)",
        },
      },
      {
        type: "sticky",
        x: 530,
        y: 450,
        width: 160,
        height: 120,
        data: { content: "Concorrencia forte", color: "yellow", fontSize: 13 },
      },
    ],
  },
  {
    id: "sprint",
    name: "Sprint Planning",
    description: "5 colunas kanban: Backlog, To Do, Doing, Review, Done",
    icon: "\u{1F3C3}",
    layout: "radial",
    elements: [
      {
        type: "frame",
        x: 0,
        y: 0,
        width: 200,
        height: 500,
        data: {
          title: "Backlog",
          background: "rgba(71,85,105,0.06)",
          borderColor: "rgba(71,85,105,0.3)",
        },
      },
      {
        type: "frame",
        x: 230,
        y: 0,
        width: 200,
        height: 500,
        data: {
          title: "A Fazer",
          background: "rgba(96,165,250,0.06)",
          borderColor: "rgba(96,165,250,0.3)",
        },
      },
      {
        type: "frame",
        x: 460,
        y: 0,
        width: 200,
        height: 500,
        data: {
          title: "Em Andamento",
          background: "rgba(251,191,36,0.06)",
          borderColor: "rgba(251,191,36,0.3)",
        },
      },
      {
        type: "frame",
        x: 690,
        y: 0,
        width: 200,
        height: 500,
        data: {
          title: "Revisao",
          background: "rgba(192,132,252,0.06)",
          borderColor: "rgba(192,132,252,0.3)",
        },
      },
      {
        type: "frame",
        x: 920,
        y: 0,
        width: 200,
        height: 500,
        data: {
          title: "Concluido",
          background: "rgba(52,211,153,0.06)",
          borderColor: "rgba(52,211,153,0.3)",
        },
      },
      {
        type: "sticky",
        x: 20,
        y: 50,
        width: 160,
        height: 100,
        data: { content: "Tarefa exemplo", color: "yellow", fontSize: 12 },
      },
    ],
  },
  {
    id: "okr",
    name: "OKR",
    description: "Objetivo > Key Results > Acoes",
    icon: "\u{1F3C6}",
    layout: "topdown",
    elements: [
      {
        type: "node",
        x: 450,
        y: 30,
        width: 200,
        height: 64,
        data: {
          label: "Objetivo Principal",
          color: "#6EE7F7",
          status: "doing",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 150,
        y: 180,
        width: 180,
        height: 64,
        parentId: "__root__",
        data: {
          label: "KR 1: Metricas",
          color: "#A78BFA",
          status: "todo",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 450,
        y: 180,
        width: 180,
        height: 64,
        parentId: "__root__",
        data: {
          label: "KR 2: Crescimento",
          color: "#34D399",
          status: "todo",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 750,
        y: 180,
        width: 180,
        height: 64,
        parentId: "__root__",
        data: {
          label: "KR 3: Qualidade",
          color: "#FBBF24",
          status: "todo",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 80,
        y: 330,
        width: 150,
        height: 56,
        parentId: "__kr1__",
        data: {
          label: "Acao 1.1",
          color: "#C084FC",
          status: "backlog",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 260,
        y: 330,
        width: 150,
        height: 56,
        parentId: "__kr1__",
        data: {
          label: "Acao 1.2",
          color: "#C084FC",
          status: "backlog",
          tasks: [],
        },
      },
    ],
  },
  {
    id: "stakeholders",
    name: "Mapa de Stakeholders",
    description: "Centro + 3 niveis de influencia",
    icon: "\u{1F465}",
    layout: "radial",
    elements: [
      {
        type: "node",
        x: 450,
        y: 350,
        width: 180,
        height: 64,
        data: {
          label: "Projeto",
          color: "#6EE7F7",
          status: "doing",
          tasks: [],
        },
      },
      // Inner ring — high influence
      {
        type: "node",
        x: 300,
        y: 200,
        width: 150,
        height: 56,
        parentId: "__root__",
        data: {
          label: "Sponsor",
          color: "#F472B6",
          status: "doing",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 600,
        y: 200,
        width: 150,
        height: 56,
        parentId: "__root__",
        data: {
          label: "Product Owner",
          color: "#F472B6",
          status: "doing",
          tasks: [],
        },
      },
      // Middle ring
      {
        type: "node",
        x: 150,
        y: 350,
        width: 150,
        height: 56,
        parentId: "__root__",
        data: {
          label: "Dev Team",
          color: "#A78BFA",
          status: "todo",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 750,
        y: 350,
        width: 150,
        height: 56,
        parentId: "__root__",
        data: {
          label: "Design Team",
          color: "#A78BFA",
          status: "todo",
          tasks: [],
        },
      },
      // Outer ring
      {
        type: "node",
        x: 250,
        y: 530,
        width: 150,
        height: 56,
        parentId: "__root__",
        data: {
          label: "Usuarios",
          color: "#34D399",
          status: "backlog",
          tasks: [],
        },
      },
      {
        type: "node",
        x: 650,
        y: 530,
        width: 150,
        height: 56,
        parentId: "__root__",
        data: {
          label: "Parceiros",
          color: "#34D399",
          status: "backlog",
          tasks: [],
        },
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
}

export function TemplatesModal({ open, onClose }: TemplatesModalProps) {
  const replaceAll = useCanvasStore((s) => s.replaceAll);
  const setLayout = useCanvasStore((s) => s.setLayout);
  const elements = useCanvasStore((s) => s.elements);
  const { setNodes, setEdges, fitView } = useReactFlow();
  const [confirmTemplate, setConfirmTemplate] =
    useState<MindFlowTemplate | null>(null);

  const applyTemplate = useCallback(
    (template: MindFlowTemplate) => {
      // Resolve parent references: __root__ → first element id, __kr1__ → second, etc.
      let idCounter = 5000;
      const idMap = new Map<number, string>();
      const newElements: CanvasElement[] = [];

      // First pass: assign IDs
      template.elements.forEach((el, idx) => {
        const id = `tpl_${idCounter++}`;
        idMap.set(idx, id);
      });

      // Second pass: resolve parents and build elements
      template.elements.forEach((el, idx) => {
        const id = idMap.get(idx)!;
        let parentId = el.parentId;

        if (parentId === "__root__") {
          parentId = idMap.get(0) ?? undefined;
        } else if (parentId === "__kr1__") {
          parentId = idMap.get(1) ?? undefined;
        } else if (parentId === "__kr2__") {
          parentId = idMap.get(2) ?? undefined;
        } else if (parentId === "__kr3__") {
          parentId = idMap.get(3) ?? undefined;
        }

        newElements.push({
          ...el,
          id,
          parentId: parentId ?? undefined,
        } as CanvasElement);
      });

      replaceAll(newElements);
      setLayout(template.layout);

      // Map CanvasElement type → ReactFlow node type
      const typeMap: Record<string, string> = {
        node: "mindMapNode",
        sticky: "sticky",
        text: "text",
        shape: "shape",
        frame: "frame",
        image: "image",
        comment: "comment",
      };

      // Sync ReactFlow: convert CanvasElements → RF nodes/edges
      const rfNodes: Node[] = newElements.map((el) => ({
        id: el.id,
        type: typeMap[el.type] ?? "mindMapNode",
        position: { x: el.x, y: el.y },
        data: { ...el.data, parentId: el.parentId } as Record<string, unknown>,
        ...(el.width ? { style: { width: el.width, height: el.height } } : {}),
      }));

      // Only node-type elements with parentId get edges
      const nodeElements = newElements.filter(
        (el) => el.type === "node" && el.parentId,
      );
      const rfEdges: Edge[] = nodeElements.map((el) => ({
        id: `${el.parentId}-${el.id}`,
        source: el.parentId!,
        target: el.id,
        type: "ortho",
      }));

      // Only apply layout to tree nodes; keep frames/stickies at original position
      const treeNodes = rfNodes.filter((n) => n.type === "mindMapNode");
      const otherNodes = rfNodes.filter((n) => n.type !== "mindMapNode");

      if (treeNodes.length > 0 && rfEdges.length > 0) {
        applyLayout(treeNodes, rfEdges, template.layout)
          .then(({ nodes: ln, edges: le }) => {
            setNodes([...ln, ...otherNodes]);
            setEdges(le);
            setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 80);
          })
          .catch(() => {
            setNodes(rfNodes);
            setEdges(rfEdges);
          });
      } else {
        // No tree structure (e.g. Sprint Planning = only frames/stickies)
        setNodes(rfNodes);
        setEdges(rfEdges);
        setTimeout(() => fitView({ padding: 0.2, duration: 600 }), 80);
      }

      onClose();
      setConfirmTemplate(null);
    },
    [replaceAll, setLayout, onClose, setNodes, setEdges, fitView],
  );

  const handleSelect = useCallback(
    (template: MindFlowTemplate) => {
      if (elements.length > 0) {
        setConfirmTemplate(template);
      } else {
        applyTemplate(template);
      }
    },
    [elements.length, applyTemplate],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500]"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d1c] border border-white/[0.08] rounded-2xl p-6 w-[620px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h2
            className="text-lg font-extrabold"
            style={{
              background: "linear-gradient(90deg,#6EE7F7,#A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Templates
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1L11 11M1 11L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4 shrink-0">
          Escolha um template para comecar rapidamente. O mapa atual sera
          substituido.
        </p>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelect(tpl)}
              className="flex flex-col items-start p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[rgba(110,231,247,0.15)] transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <span className="text-2xl">{tpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-300 group-hover:text-slate-100 transition-colors">
                    {tpl.name}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {tpl.description}
                  </div>
                </div>
              </div>
              {/* Mini preview: colored dots representing nodes */}
              <div className="flex items-center gap-1 mt-1">
                {tpl.elements.slice(0, 6).map((el, i) => {
                  const color =
                    el.type === "node" && "color" in el.data
                      ? (el.data as { color: string }).color
                      : el.type === "frame"
                        ? "rgba(110,231,247,0.4)"
                        : "#facc15";
                  return (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: color }}
                    />
                  );
                })}
                {tpl.elements.length > 6 && (
                  <span className="text-[9px] text-slate-600 ml-1">
                    +{tpl.elements.length - 6}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Confirmation dialog */}
        {confirmTemplate && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-[#0d0d1c] border border-white/[0.08] rounded-xl p-5 w-[320px] shadow-[0_16px_48px_rgba(0,0,0,0.7)]">
              <p className="text-sm text-slate-300 mb-4">
                O mapa atual tem{" "}
                <span className="text-[#6EE7F7] font-bold">
                  {elements.length} elementos
                </span>
                . Deseja substituir pelo template{" "}
                <span className="text-[#A78BFA] font-bold">
                  {confirmTemplate.name}
                </span>
                ?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmTemplate(null)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => applyTemplate(confirmTemplate)}
                  className="px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all"
                  style={{
                    background:
                      "linear-gradient(135deg,rgba(110,231,247,0.15),rgba(167,139,250,0.15))",
                    border: "1px solid rgba(110,231,247,0.25)",
                    color: "#6EE7F7",
                  }}
                >
                  Substituir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
