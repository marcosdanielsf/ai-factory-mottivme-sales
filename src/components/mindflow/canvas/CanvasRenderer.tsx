import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Node,
  type Edge,
  type OnConnect,
  type NodeMouseHandler,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";

import { MindMapNode } from "./renderers/MindMapNode";
import { StickyNoteNode } from "./renderers/StickyNoteNode";
import { FreeTextNode } from "./renderers/FreeTextNode";
import { ShapeNode } from "./renderers/ShapeNode";
import { FrameNode } from "./renderers/FrameNode";
import { ImageNode } from "./renderers/ImageNode";
import { CommentNode } from "./renderers/CommentNode";
import { OrthoEdge } from "./renderers/OrthoEdge";
import { DrawingOverlay } from "./overlays/DrawingOverlay";
import { TopBar } from "../topbar/TopBar";
import { RightPanel } from "../panel/RightPanel";
import { Toolbar } from "../toolbar/Toolbar";
import { ExportPanel } from "../modals/ExportPanel";
import { TemplatesModal } from "../modals/TemplatesModal";
import { useCanvasStore } from "../store/canvasStore";
import { useSelectionStore } from "../store/selectionStore";
import { useUIStore } from "../store/uiStore";
import {
  applyLayout,
  getEdgeTypeForLayout,
  v4ToReactFlow,
} from "../engine/layoutEngine";
import { useKeyboard } from "../hooks/useKeyboard";
import { useAutoSave } from "../hooks/useAutoSave";
import type {
  NodeData,
  StickyData,
  TextData,
  ShapeData,
  FrameData,
  ImageData,
  CommentData,
} from "../types/elements";
import { NODE_COLORS } from "../types/canvas";
import type { ToolType } from "../types/canvas";

// ── IMPORTANTE: nodeTypes e edgeTypes FORA do componente — evita re-render ────
const nodeTypes = {
  mindMapNode: MindMapNode,
  sticky: StickyNoteNode,
  text: FreeTextNode,
  shape: ShapeNode,
  frame: FrameNode,
  image: ImageNode,
  comment: CommentNode,
};

const edgeTypes = {
  ortho: OrthoEdge,
};

// ── Dados iniciais (v4 compat) ─────────────────────────────────────────────────
const INITIAL_V4 = [
  {
    id: "root",
    label: "Meu Projeto",
    x: 560,
    y: 340,
    color: "#6EE7F7",
    parent: null,
    status: "doing",
    tasks: [],
  },
  {
    id: "n1",
    label: "Design",
    x: 300,
    y: 200,
    color: "#A78BFA",
    parent: "root",
    status: "doing",
    tasks: [
      {
        id: "t1",
        text: "Criar wireframes",
        done: true,
        priority: "high",
        due: "2025-06-10",
      },
      {
        id: "t2",
        text: "Definir paleta",
        done: false,
        priority: "medium",
        due: "2025-06-15",
      },
    ],
  },
  {
    id: "n2",
    label: "Dev",
    x: 820,
    y: 200,
    color: "#34D399",
    parent: "root",
    status: "todo",
    tasks: [
      {
        id: "t3",
        text: "Setup",
        done: true,
        priority: "urgent",
        due: "2025-06-01",
      },
      {
        id: "t4",
        text: "Componentes",
        done: false,
        priority: "high",
        due: "2025-06-20",
      },
    ],
  },
  {
    id: "n3",
    label: "Marketing",
    x: 300,
    y: 480,
    color: "#F472B6",
    parent: "root",
    status: "backlog",
    tasks: [
      {
        id: "t5",
        text: "Lançamento",
        done: false,
        priority: "medium",
        due: "2025-07-01",
      },
    ],
  },
  {
    id: "n4",
    label: "QA & Testes",
    x: 820,
    y: 480,
    color: "#FBBF24",
    parent: "root",
    status: "review",
    tasks: [
      {
        id: "t6",
        text: "Testes unitários",
        done: false,
        priority: "high",
        due: "2025-06-28",
      },
      {
        id: "t7",
        text: "QA final",
        done: false,
        priority: "urgent",
        due: "2025-06-30",
      },
    ],
  },
  {
    id: "n5",
    label: "UI Kit",
    x: 100,
    y: 130,
    color: "#60A5FA",
    parent: "n1",
    status: "doing",
    tasks: [],
  },
  {
    id: "n6",
    label: "Protótipo",
    x: 100,
    y: 260,
    color: "#FB923C",
    parent: "n1",
    status: "todo",
    tasks: [
      {
        id: "t8",
        text: "Figma interativo",
        done: false,
        priority: "medium",
        due: null,
      },
    ],
  },
  {
    id: "n7",
    label: "Frontend",
    x: 1040,
    y: 130,
    color: "#C084FC",
    parent: "n2",
    status: "doing",
    tasks: [],
  },
  {
    id: "n8",
    label: "Backend",
    x: 1040,
    y: 260,
    color: "#86EFAC",
    parent: "n2",
    status: "backlog",
    tasks: [],
  },
];

// ── useAutoLayout — re-aplica layout quando nodes/layout mudam ────────────────
function useAutoLayout(
  nodes: Node[],
  edges: Edge[],
  layout: string,
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void,
) {
  const { fitView } = useReactFlow();
  const prevLayout = useRef(layout);
  const isFirstRun = useRef(true);

  useEffect(() => {
    const layoutChanged = prevLayout.current !== layout;
    if (!isFirstRun.current && !layoutChanged) return;

    prevLayout.current = layout;
    isFirstRun.current = false;

    if (!nodes.length) return;

    applyLayout(nodes, edges, layout as Parameters<typeof applyLayout>[2])
      .then(({ nodes: ln, edges: le }) => {
        setNodes(ln);
        setEdges(le);
        // Double fitView: immediate + delayed to ensure viewport adjusts
        setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50);
        setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 500);
      })
      .catch(console.error);
  }, [layout, nodes.length]);
}

// ── Inner editor (needs ReactFlowProvider) ────────────────────────────────────
function MindFlowInner() {
  const layout = useCanvasStore((s) => s.layout);
  const canvasElements = useCanvasStore((s) => s.elements);
  const addElement = useCanvasStore((s) => s.addElement);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const selectOne = useSelectionStore((s) => s.selectOne);
  const selectMany = useSelectionStore((s) => s.selectMany);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const selected = useSelectionStore((s) => s.selected);

  const copilotOpen = useUIStore((s) => s.copilotOpen);
  const closeCopilot = useUIStore((s) => s.closeCopilot);
  const exportOpen = useUIStore((s) => s.exportOpen);
  const closeExport = useUIStore((s) => s.closeExport);
  const templatesOpen = useUIStore((s) => s.templatesOpen);
  const closeTemplates = useUIStore((s) => s.closeTemplates);

  const [copilotText, setCopilotText] = useState("");

  // Initialize nodes/edges from v4 data on first mount
  const { nodes: initNodes, edges: initEdges } = v4ToReactFlow(
    INITIAL_V4 as Parameters<typeof v4ToReactFlow>[0],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  // Sync canvasStore on node changes (drag, resize)
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Sync position updates back to canvasStore
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          updateElement(change.id, {
            x: change.position.x,
            y: change.position.y,
          });
        }
      });
    },
    [onNodesChange, updateElement],
  );

  // Inline edit handler (usado pelo useKeyboard e double-click)
  const startEdit = useSelectionStore.getState().startEdit;
  const onStartEdit = useCallback(
    (nodeId: string) => {
      startEdit(nodeId);
    },
    [startEdit],
  );

  // Keyboard shortcuts
  useKeyboard({ setNodes, setEdges, nodes, edges, onStartEdit });

  // Auto-save com debounce (null = sem Supabase, só localStorage)
  useAutoSave(null);

  // Ctrl+V paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const newId = addElement({
              type: "image",
              x: 400 + Math.random() * 200,
              y: 200 + Math.random() * 200,
              width: 300,
              height: 200,
              data: {
                storageKey: "",
                url: dataUrl,
                alt: file.name,
                objectFit: "contain",
              },
            });
            const newNode = {
              id: newId,
              type: "image",
              position: {
                x: 400 + Math.random() * 200,
                y: 200 + Math.random() * 200,
              },
              data: {
                storageKey: "",
                url: dataUrl,
                alt: file.name,
                objectFit: "contain",
              },
              style: { width: 300, height: 200 },
            };
            setNodes((ns) => [...ns, newNode]);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [addElement, setNodes]);

  // Apply auto-layout when layout changes
  useAutoLayout(nodes, edges, layout, setNodes, setEdges);

  // ── Handle pane click: create element with active tool or clear selection ────
  const activeTool = useSelectionStore((s) => s.activeTool);
  const setTool = useSelectionStore((s) => s.setTool);
  const { screenToFlowPosition } = useReactFlow();

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (activeTool === "select" || activeTool === "pan") {
        clearSelection();
        return;
      }

      // Convert screen coords to flow coords
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let newNode: Node | null = null;

      // Map tool → node creation
      const toolToNode: Partial<
        Record<
          ToolType,
          () => {
            type: string;
            width: number;
            height: number;
            data: Record<string, unknown>;
          }
        >
      > = {
        node: () => ({
          type: "mindMapNode",
          width: 164,
          height: 64,
          data: {
            label: "",
            color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
            status: "backlog",
            tasks: [],
          } satisfies NodeData as unknown as Record<string, unknown>,
        }),
        sticky: () => ({
          type: "sticky",
          width: 200,
          height: 150,
          data: {
            content: "",
            color: "yellow",
            fontSize: 14,
          } satisfies StickyData as unknown as Record<string, unknown>,
        }),
        text: () => ({
          type: "text",
          width: 200,
          height: 32,
          data: {
            content: "",
            fontSize: 16,
            fontWeight: "normal",
            color: "#e2e8f0",
            align: "left",
          } satisfies TextData as unknown as Record<string, unknown>,
        }),
        rect: () => ({
          type: "shape",
          width: 120,
          height: 80,
          data: {
            variant: "rectangle",
            fill: "rgba(110,231,247,0.1)",
            stroke: "#6EE7F7",
            strokeWidth: 2,
            opacity: 1,
          } satisfies ShapeData as unknown as Record<string, unknown>,
        }),
        circle: () => ({
          type: "shape",
          width: 100,
          height: 100,
          data: {
            variant: "circle",
            fill: "rgba(167,139,250,0.1)",
            stroke: "#A78BFA",
            strokeWidth: 2,
            opacity: 1,
          } satisfies ShapeData as unknown as Record<string, unknown>,
        }),
        diamond: () => ({
          type: "shape",
          width: 100,
          height: 100,
          data: {
            variant: "diamond",
            fill: "rgba(244,114,182,0.1)",
            stroke: "#F472B6",
            strokeWidth: 2,
            opacity: 1,
          } satisfies ShapeData as unknown as Record<string, unknown>,
        }),
        frame: () => ({
          type: "frame",
          width: 400,
          height: 300,
          data: {
            title: "Frame",
            background: "rgba(110,231,247,0.04)",
            borderColor: "rgba(110,231,247,0.3)",
          } satisfies FrameData as unknown as Record<string, unknown>,
        }),
      };

      const factory = toolToNode[activeTool];
      if (!factory) {
        clearSelection();
        return;
      }

      const spec = factory();
      const newId = addElement({
        type:
          spec.type === "mindMapNode"
            ? "node"
            : (spec.type as "sticky" | "text" | "shape" | "frame"),
        x: position.x,
        y: position.y,
        width: spec.width,
        height: spec.height,
        data: spec.data as
          | NodeData
          | StickyData
          | TextData
          | ShapeData
          | FrameData,
      });

      newNode = {
        id: newId,
        type: spec.type,
        position,
        data: spec.data,
        ...(spec.width
          ? { style: { width: spec.width, height: spec.height } }
          : {}),
      };

      if (newNode) {
        setNodes((ns) => [...ns, newNode!]);
        selectOne(newId);
        // Reset to select tool after placing
        setTool("select");
      }
    },
    [
      activeTool,
      clearSelection,
      screenToFlowPosition,
      addElement,
      setNodes,
      selectOne,
      setTool,
    ],
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      selectOne(node.id);
    },
    [selectOne],
  );

  // Sync React Flow marquee selection → our selectionStore
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 1) {
        selectMany(selectedNodes.map((n) => n.id));
      }
    },
    [selectMany],
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      // Prevent self-loops
      if (params.source === params.target) return;

      // Prevent duplicate edges
      if (
        edges.some(
          (e) => e.source === params.source && e.target === params.target,
        )
      )
        return;

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: getEdgeTypeForLayout(
              layout as Parameters<typeof getEdgeTypeForLayout>[0],
            ),
          },
          eds,
        ),
      );
    },
    [setEdges, layout, edges],
  );

  // Add child node helper (used by keyboard shortcuts)
  const addChild = useCallback(
    (parentId: string) => {
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode) return;
      const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
      const newId = addElement({
        type: "node",
        x: parentNode.position.x + 200,
        y: parentNode.position.y + 80,
        width: 164,
        height: 64,
        parentId,
        data: { label: "", color, status: "backlog", tasks: [] } as NodeData,
      });

      const newNode: Node = {
        id: newId,
        type: "mindMapNode",
        position: {
          x: parentNode.position.x + 200,
          y: parentNode.position.y + 80,
        },
        data: {
          label: "",
          color,
          status: "backlog",
          tasks: [],
          parentId,
        } as NodeData,
      };
      const newEdge: Edge = {
        id: `${parentId}-${newId}`,
        source: parentId,
        target: newId,
        type: getEdgeTypeForLayout(
          layout as Parameters<typeof getEdgeTypeForLayout>[0],
        ),
      };
      setNodes((ns) => [...ns, newNode]);
      setEdges((es) => [...es, newEdge]);
      selectOne(newId);
    },
    [nodes, addElement, setNodes, setEdges, selectOne, layout],
  );

  return (
    <div className="w-full h-screen flex flex-col bg-[#07070f] font-['DM_Sans','Segoe_UI',sans-serif]">
      {/* TopBar needs ReactFlow context for zoom controls */}
      <TopBar />

      {/* Hint bar */}
      <div className="h-[22px] bg-[rgba(7,7,15,0.95)] border-b border-white/[0.03] flex items-center justify-center gap-3.5 shrink-0">
        {[
          ["Tab", "filho"],
          ["Enter", "irmão"],
          ["F2", "editar"],
          ["Del", "deletar"],
          ["Ctrl+Z", "desfazer"],
        ].map(([k, v]) => (
          <span key={k} className="text-[10px] text-[#1e1e2e]">
            <code className="text-[#334155] bg-white/[0.04] px-1 py-0.5 rounded-[3px] mr-1">
              {k}
            </code>
            {v}
          </span>
        ))}
        {layout !== "radial" && (
          <span className="text-[10px] text-[#6EE7F7] ml-1.5">
            📐 Layout automático
          </span>
        )}
      </div>

      {/* Canvas + RightPanel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode="dark"
            fitView
            minZoom={0.15}
            maxZoom={3}
            onlyRenderVisibleElements
            snapToGrid
            snapGrid={[8, 8]}
            deleteKeyCode={null}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
            disableKeyboardA11y
            defaultEdgeOptions={{
              type: getEdgeTypeForLayout(
                layout as Parameters<typeof getEdgeTypeForLayout>[0],
              ),
              style: {
                strokeWidth: 1.2,
                stroke: "#334155",
                strokeOpacity: 0.6,
              },
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#1a1a2e"
            />
            <MiniMap
              nodeColor={(n) => {
                const d = n.data as Record<string, unknown>;
                // Color by node type
                if (d.color) return d.color as string;
                if (d.variant === "circle") return "#A78BFA";
                if (d.variant === "diamond") return "#F472B6";
                if (d.variant === "rectangle") return "#6EE7F7";
                if (n.type === "sticky") return "#facc15";
                if (n.type === "text") return "#e2e8f0";
                if (n.type === "frame") return "rgba(110,231,247,0.3)";
                return "#6EE7F7";
              }}
              maskColor="rgba(0,0,0,0.75)"
              pannable
              zoomable
              style={{ background: "#07070f", border: "1px solid #1a1a2e" }}
            />
            <Controls
              style={{ background: "#0d0d1a", border: "1px solid #1a1a2e" }}
            />
          </ReactFlow>

          {/* Toolbar — left side */}
          <Toolbar />

          {/* Empty state hint */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none">
              <p className="text-[11px] text-[#1a1a2e]">
                Clique → seleciona · Duplo clique → edita · Tab = filho · Enter
                = irmão
              </p>
            </div>
          )}
        </div>

        <RightPanel />
      </div>

      {/* Export & Templates modals */}
      <ExportPanel open={exportOpen} onClose={closeExport} />
      <TemplatesModal open={templatesOpen} onClose={closeTemplates} />

      {/* Copilot modal */}
      {copilotOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500]"
          onClick={closeCopilot}
        >
          <div
            className="bg-[#0d0d1c] border border-white/[0.08] rounded-2xl p-6 w-[520px] max-w-[90vw] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xl font-black"
                style={{
                  background: "linear-gradient(90deg,#6EE7F7,#A78BFA)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ✦ Copiloto IA
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Descreva o mapa mental que você quer criar e a IA vai gerá-lo
              automaticamente.
            </p>
            <textarea
              value={copilotText}
              onChange={(e) => setCopilotText(e.target.value)}
              placeholder="Ex: Plano de lançamento de produto SaaS com fases de desenvolvimento, marketing e vendas..."
              rows={4}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-slate-200 text-sm outline-none resize-none placeholder:text-slate-700 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeCopilot}
                className="px-4 py-2 rounded-xl text-slate-500 text-sm hover:text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (copilotText.trim()) {
                    // aiStore.runCopilot chamado via Task #7
                    closeCopilot();
                    setCopilotText("");
                  }
                }}
                className="px-5 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(110,231,247,0.15),rgba(167,139,250,0.15))",
                  border: "1px solid rgba(110,231,247,0.25)",
                  color: "#6EE7F7",
                }}
              >
                ✦ Gerar mapa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Public export — envolve com ReactFlowProvider ─────────────────────────────
export function MindFlowEditor() {
  return (
    <ReactFlowProvider>
      <MindFlowInner />
    </ReactFlowProvider>
  );
}
