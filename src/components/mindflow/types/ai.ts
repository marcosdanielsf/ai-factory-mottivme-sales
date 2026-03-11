// ── AI Types ───────────────────────────────────────────────────────────────────

import type { CanvasElement } from "./elements";

export type AILoadingState =
  | "idle"
  | "suggest"
  | "expand"
  | "explain"
  | "copilot";

export interface AISuggestion {
  id: string;
  type: "task" | "node" | "connection";
  label: string;
  description?: string;
  payload: Record<string, unknown>;
}

// ── API Route contracts ────────────────────────────────────────────────────────

export interface ExpandNodeRequest {
  mapId: string;
  nodeId: string;
  nodeLabel: string;
  existingChildren: string[];
}

export interface ExpandNodeResponse {
  children: { label: string; color: string }[];
}

export interface SuggestTasksRequest {
  mapId: string;
  nodeId: string;
  nodeLabel: string;
  existingTasks: string[];
}

export interface SuggestTasksResponse {
  tasks: { text: string; priority: "low" | "medium" | "high" | "urgent" }[];
}

export interface ExplainNodeRequest {
  mapId: string;
  nodeId: string;
  nodeLabel: string;
  nodeContext: string;
}

export interface ExplainNodeResponse {
  explanation: string;
}

export interface CopilotRequest {
  mapId: string;
  text: string;
  layout: string;
}

export interface CopilotResponse {
  elements: CanvasElement[];
}
