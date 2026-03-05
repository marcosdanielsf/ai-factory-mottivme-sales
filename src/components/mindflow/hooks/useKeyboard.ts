import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { useSelectionStore } from "../store/selectionStore";
import { useHistoryStore } from "../store/historyStore";
import { NODE_COLORS } from "../types/canvas";
import { getEdgeTypeForLayout } from "../engine/layoutEngine";
import type { NodeData } from "../types/elements";
import type { Node, Edge } from "@xyflow/react";

interface UseKeyboardOptions {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  nodes: Node[];
  edges: Edge[];
  onStartEdit: (nodeId: string) => void;
}

export function useKeyboard({
  setNodes,
  setEdges,
  nodes,
  edges,
  onStartEdit,
}: UseKeyboardOptions) {
  const layout = useCanvasStore((s) => s.layout);
  const addElement = useCanvasStore((s) => s.addElement);
  const deleteElement = useCanvasStore((s) => s.deleteElement);
  const replaceAll = useCanvasStore((s) => s.replaceAll);
  const elements = useCanvasStore((s) => s.elements);

  const selected = useSelectionStore((s) => s.selected);
  const selectOne = useSelectionStore((s) => s.selectOne);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const editingId = useSelectionStore((s) => s.editingId);

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  const { fitView } = useReactFlow();

  const selectedId = selected[0] ?? null;

  useEffect(() => {
    const edgeType = getEdgeTypeForLayout(
      layout as Parameters<typeof getEdgeTypeForLayout>[0],
    );

    const addChild = (parentId: string) => {
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
        } as unknown as Record<string, unknown>,
      };
      const newEdge: Edge = {
        id: `${parentId}-${newId}`,
        source: parentId,
        target: newId,
        type: edgeType,
      };

      setNodes((ns) => [...ns, newNode]);
      setEdges((es) => [...es, newEdge]);
      selectOne(newId);
      setTimeout(() => onStartEdit(newId), 50);
    };

    const addSibling = (nodeId: string) => {
      if (nodeId === "root") return;
      // Find parent edge
      const parentEdge = edges.find((e) => e.target === nodeId);
      if (!parentEdge) return;
      addChild(parentEdge.source);
    };

    const deleteNode = (nodeId: string) => {
      if (nodeId === "root") return;
      // Find all descendants
      const toDelete = new Set<string>();
      const collect = (id: string) => {
        toDelete.add(id);
        edges.filter((e) => e.source === id).forEach((e) => collect(e.target));
      };
      collect(nodeId);

      // Select parent before deleting
      const parentEdge = edges.find((e) => e.target === nodeId);
      if (parentEdge) selectOne(parentEdge.source);
      else clearSelection();

      // Remove from React Flow state
      setNodes((ns) => ns.filter((n) => !toDelete.has(n.id)));
      setEdges((es) =>
        es.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)),
      );

      // Remove from canvas store (cascade)
      toDelete.forEach((id) => deleteElement(id));
    };

    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas (except our special edit inputs)
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Don't intercept when a node is in inline edit mode
      if (editingId) return;

      // Ctrl/Cmd+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (!canUndo) return;
        const prev = undo();
        if (prev) replaceAll(prev);
        return;
      }

      // Ctrl/Cmd+Y or Ctrl+Shift+Z — redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        if (!canRedo) return;
        const next = redo();
        if (next) replaceAll(next);
        return;
      }

      // Ctrl/Cmd+Shift+F — fit view
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        fitView({ padding: 0.15, duration: 400 });
        return;
      }

      // Always prevent Tab/Enter from navigating away from the canvas
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (!selectedId) return;
        if (e.key === "Tab") {
          addChild(selectedId);
        } else {
          addSibling(selectedId);
        }
        return;
      }

      // Node-specific shortcuts (need selection)
      if (!selectedId) return;

      // F2 — start inline edit
      if (e.key === "F2") {
        e.preventDefault();
        onStartEdit(selectedId);
        return;
      }

      // Delete/Backspace — delete node (not root)
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteNode(selectedId);
        return;
      }

      // Escape — deselect
      if (e.key === "Escape") {
        clearSelection();
        return;
      }

      // Any printable char — start editing
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onStartEdit(selectedId);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    selectedId,
    editingId,
    nodes,
    edges,
    layout,
    canUndo,
    canRedo,
    addElement,
    deleteElement,
    replaceAll,
    selectOne,
    clearSelection,
    undo,
    redo,
    fitView,
    setNodes,
    setEdges,
    onStartEdit,
  ]);
}
