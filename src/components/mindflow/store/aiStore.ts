import { create } from "zustand";
import type { AILoadingState, AISuggestion } from "../types/ai";
import { useCanvasStore } from "./canvasStore";
import type { NodeData } from "../types/elements";
import * as mindflowService from "@/services/mindflow/mindflowService";

interface AIStore {
  loading: AILoadingState;
  suggestions: AISuggestion[];
  explanation: string;
  error: string | null;

  suggestTasks: (nodeId: string) => Promise<void>;
  expandNode: (nodeId: string) => Promise<void>;
  explainNode: (nodeId: string) => Promise<void>;
  runCopilot: (text: string) => Promise<void>;
  acceptSuggestion: (s: AISuggestion) => void;
  clearSuggestions: () => void;
  clearError: () => void;
}

export const useAIStore = create<AIStore>()((set, get) => ({
  loading: "idle",
  suggestions: [],
  explanation: "",
  error: null,

  suggestTasks: async (nodeId) => {
    const canvas = useCanvasStore.getState();
    const el = canvas.getElementById(nodeId);
    if (!el) return;
    const nodeData = el.data as NodeData;

    set({ loading: "suggest", error: null });
    try {
      const data = await mindflowService.suggestTasks({
        nodeId,
        nodeLabel: nodeData.label,
        existingTasks: nodeData.tasks.map((t) => t.text),
      });
      const suggestions: AISuggestion[] = data.tasks.map(
        (t: { text: string; priority: string }, i: number) => ({
          id: `sug-${Date.now()}-${i}`,
          type: "task" as const,
          label: t.text,
          payload: { nodeId, priority: t.priority },
        }),
      );
      set({ suggestions, loading: "idle" });
    } catch (e) {
      set({ error: String(e), loading: "idle" });
    }
  },

  expandNode: async (nodeId) => {
    const canvas = useCanvasStore.getState();
    const el = canvas.getElementById(nodeId);
    if (!el) return;
    const nodeData = el.data as NodeData;
    const children = canvas.getChildren(nodeId);

    set({ loading: "expand", error: null });
    try {
      const data = await mindflowService.expandNode({
        nodeId,
        nodeLabel: nodeData.label,
        existingChildren: children.map((c) => (c.data as NodeData).label),
      });
      const suggestions: AISuggestion[] = data.children.map(
        (c: { label: string; color: string }, i: number) => ({
          id: `sug-${Date.now()}-${i}`,
          type: "node" as const,
          label: c.label,
          payload: { parentId: nodeId, color: c.color },
        }),
      );
      set({ suggestions, loading: "idle" });
    } catch (e) {
      set({ error: String(e), loading: "idle" });
    }
  },

  explainNode: async (nodeId) => {
    const canvas = useCanvasStore.getState();
    const el = canvas.getElementById(nodeId);
    if (!el) return;
    const nodeData = el.data as NodeData;
    const parent = el.parentId ? canvas.getElementById(el.parentId) : null;
    const context = parent ? (parent.data as NodeData).label : "raiz";

    set({ loading: "explain", error: null, explanation: "" });
    try {
      const data = await mindflowService.explainNode({
        nodeId,
        nodeLabel: nodeData.label,
        nodeContext: context,
      });
      set({ explanation: data.explanation, loading: "idle" });
    } catch (e) {
      set({ error: String(e), loading: "idle" });
    }
  },

  runCopilot: async (text) => {
    const canvas = useCanvasStore.getState();
    set({ loading: "copilot", error: null });
    try {
      const data = await mindflowService.runCopilot({
        text,
        layout: canvas.layout,
      });
      if (data.elements?.length) {
        canvas.replaceAll(data.elements);
      }
      set({ loading: "idle" });
    } catch (e) {
      set({ error: String(e), loading: "idle" });
    }
  },

  acceptSuggestion: (s) => {
    const canvas = useCanvasStore.getState();
    if (s.type === "node") {
      const payload = s.payload as { parentId: string; color: string };
      canvas.addElement({
        type: "node",
        x: 0,
        y: 0,
        width: 164,
        height: 64,
        parentId: payload.parentId,
        data: {
          label: s.label,
          color: payload.color,
          status: "todo",
          tasks: [],
        },
      });
    }
    set((state) => ({
      suggestions: state.suggestions.filter((sg) => sg.id !== s.id),
    }));
  },

  clearSuggestions: () => set({ suggestions: [] }),
  clearError: () => set({ error: null }),
}));
