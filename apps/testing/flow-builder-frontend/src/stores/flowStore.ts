import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Flow, FlowNode, FlowEdge, Position } from '@/types/flow';

interface FlowState {
  // Data
  currentFlow: Flow | null;
  nodes: FlowNode[];
  edges: FlowEdge[];

  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // History (undo/redo)
  history: { nodes: FlowNode[]; edges: FlowEdge[] }[];
  historyIndex: number;

  // Loading
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setFlow: (flow: Flow) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;

  addNode: (node: FlowNode) => void;
  updateNode: (id: string, data: Partial<FlowNode>) => void;
  updateNodePosition: (id: string, position: Position) => void;
  deleteNode: (id: string) => void;

  addEdge: (edge: FlowEdge) => void;
  deleteEdge: (id: string) => void;

  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;

  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;

  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;

  reset: () => void;
}

const initialState = {
  currentFlow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  history: [],
  historyIndex: -1,
  isLoading: false,
  isSaving: false,
};

export const useFlowStore = create<FlowState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setFlow: (flow) => set({
        currentFlow: flow,
        nodes: flow.nodes,
        edges: flow.edges,
        history: [],
        historyIndex: -1,
      }),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      addNode: (node) => {
        const { nodes, saveToHistory } = get();
        saveToHistory();
        set({ nodes: [...nodes, node] });
      },

      updateNode: (id, data) => {
        const { nodes, saveToHistory } = get();
        saveToHistory();
        set({
          nodes: nodes.map((n) =>
            n.id === id ? { ...n, ...data } : n
          ),
        });
      },

      updateNodePosition: (id, position) => {
        const { nodes } = get();
        set({
          nodes: nodes.map((n) =>
            n.id === id ? { ...n, position } : n
          ),
        });
      },

      deleteNode: (id) => {
        const { nodes, edges, saveToHistory } = get();
        saveToHistory();
        set({
          nodes: nodes.filter((n) => n.id !== id),
          edges: edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: null,
        });
      },

      addEdge: (edge) => {
        const { edges, saveToHistory } = get();
        // Prevent duplicate edges
        const exists = edges.some(
          (e) => e.source === edge.source && e.target === edge.target
        );
        if (exists) return;

        saveToHistory();
        set({ edges: [...edges, edge] });
      },

      deleteEdge: (id) => {
        const { edges, saveToHistory } = get();
        saveToHistory();
        set({
          edges: edges.filter((e) => e.id !== id),
          selectedEdgeId: null,
        });
      },

      selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
      selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),

      saveToHistory: () => {
        const { nodes, edges, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: [...nodes], edges: [...edges] });
        // Keep max 50 history items
        if (newHistory.length > 50) newHistory.shift();
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;
        const prev = history[historyIndex - 1];
        set({
          nodes: prev.nodes,
          edges: prev.edges,
          historyIndex: historyIndex - 1,
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        const next = history[historyIndex + 1];
        set({
          nodes: next.nodes,
          edges: next.edges,
          historyIndex: historyIndex + 1,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setSaving: (isSaving) => set({ isSaving }),

      reset: () => set(initialState),
    }),
    { name: 'flow-store' }
  )
);
