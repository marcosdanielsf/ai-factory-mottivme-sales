import { useEffect, useRef, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { useCanvasStore } from "../store/canvasStore";
import { useSelectionStore } from "../store/selectionStore";
import { useHistoryStore } from "../store/historyStore";
import { NODE_COLORS } from "../types/canvas";
import { getEdgeTypeForLayout, applyLayout } from "../engine/layoutEngine";
import type { LayoutType } from "../types/canvas";
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

  const selected = useSelectionStore((s) => s.selected);
  const selectOne = useSelectionStore((s) => s.selectOne);
  const selectMany = useSelectionStore((s) => s.selectMany);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const editingId = useSelectionStore((s) => s.editingId);

  const saveSnapshot = useHistoryStore((s) => s.saveSnapshot);
  const undoHistory = useHistoryStore((s) => s.undo);
  const redoHistory = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);

  const { fitView } = useReactFlow();

  const selectedId = selected[0] ?? null;

  // Refs to avoid stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const save = useCallback(() => {
    saveSnapshot(nodesRef.current, edgesRef.current);
  }, [saveSnapshot]);

  // Re-apply layout after mutation (add/delete) and fitView
  const reLayout = useCallback(
    (newNodes: Node[], newEdges: Edge[], selectId?: string) => {
      applyLayout(newNodes, newEdges, layout as LayoutType)
        .then(({ nodes: ln, edges: le }) => {
          setNodes(ln);
          setEdges(le);
          if (selectId) {
            selectOne(selectId);
            setTimeout(() => onStartEdit(selectId), 80);
          }
          setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
        })
        .catch(() => {
          // Fallback: just set without layout
          setNodes(newNodes);
          setEdges(newEdges);
        });
    },
    [layout, setNodes, setEdges, selectOne, onStartEdit, fitView],
  );

  useEffect(() => {
    const edgeType = getEdgeTypeForLayout(
      layout as Parameters<typeof getEdgeTypeForLayout>[0],
    );

    const addChild = (parentId: string) => {
      const parentNode = nodes.find((n) => n.id === parentId);
      if (!parentNode) return;

      save();

      const color = NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];

      const newId = addElement({
        type: "node",
        x: 0,
        y: 0,
        width: 164,
        height: 64,
        parentId,
        data: { label: "", color, status: "backlog", tasks: [] } as NodeData,
      });

      const newNode: Node = {
        id: newId,
        type: "mindMapNode",
        position: { x: 0, y: 0 },
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

      const nextNodes = [...nodes, newNode];
      const nextEdges = [...edges, newEdge];
      reLayout(nextNodes, nextEdges, newId);
    };

    const addSibling = (nodeId: string) => {
      if (nodeId === "root") return;
      const parentEdge = edges.find((e) => e.target === nodeId);
      if (!parentEdge) return;
      addChild(parentEdge.source);
    };

    const deleteNode = (nodeId: string) => {
      if (nodeId === "root") return;

      save();

      const toDelete = new Set<string>();
      const collect = (id: string) => {
        toDelete.add(id);
        edges.filter((e) => e.source === id).forEach((e) => collect(e.target));
      };
      collect(nodeId);

      const parentEdge = edges.find((e) => e.target === nodeId);
      const selectAfter = parentEdge?.source ?? null;

      const nextNodes = nodes.filter((n) => !toDelete.has(n.id));
      const nextEdges = edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target),
      );

      toDelete.forEach((id) => deleteElement(id));

      if (selectAfter) selectOne(selectAfter);
      else clearSelection();

      reLayout(nextNodes, nextEdges);
    };

    const handleUndo = () => {
      const snapshot = undoHistory(nodesRef.current, edgesRef.current);
      if (snapshot) {
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
      }
    };

    const handleRedo = () => {
      const snapshot = redoHistory(nodesRef.current, edgesRef.current);
      if (snapshot) {
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
      }
    };

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const ce = (e.target as HTMLElement).getAttribute("contenteditable");

      // Ignore when typing in inputs/textareas/contenteditable
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (ce === "true") return;
      // Don't intercept when a node is in inline edit mode
      if (editingId) return;

      // Ctrl/Cmd+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
        return;
      }

      // Ctrl/Cmd+Y or Ctrl+Shift+Z — redo
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleRedo();
        return;
      }

      // Ctrl/Cmd+A — select all nodes
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        e.stopPropagation();
        const allIds = nodes.map((n) => n.id);
        if (allIds.length > 0) {
          selectMany(allIds);
          // Also mark nodes as selected in React Flow
          setNodes((ns) => ns.map((n) => ({ ...n, selected: true })));
        }
        return;
      }

      // Ctrl/Cmd+Shift+F — fit view
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        e.stopPropagation();
        fitView({ padding: 0.15, duration: 400 });
        return;
      }

      // Always prevent Tab/Enter from navigating away from the canvas
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
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
        e.stopPropagation();
        onStartEdit(selectedId);
        return;
      }

      // Delete/Backspace — delete node (not root)
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        deleteNode(selectedId);
        return;
      }

      // Escape — deselect
      if (e.key === "Escape") {
        e.stopPropagation();
        clearSelection();
        return;
      }

      // Any printable char — start editing
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onStartEdit(selectedId);
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
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
    selectOne,
    selectMany,
    clearSelection,
    undoHistory,
    redoHistory,
    fitView,
    setNodes,
    setEdges,
    onStartEdit,
    save,
    reLayout,
  ]);
}
