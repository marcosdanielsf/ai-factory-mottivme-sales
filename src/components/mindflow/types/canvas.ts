// ── Canvas & Layout Types ──────────────────────────────────────────────────────

export type LayoutType =
  | "radial"
  | "topdown"
  | "leftright"
  | "tree"
  | "fishbone"
  | "timeline";

export type ToolType =
  | "select"
  | "pan"
  | "node"
  | "sticky"
  | "text"
  | "rect"
  | "circle"
  | "diamond"
  | "arrow"
  | "line"
  | "frame"
  | "image"
  | "emoji"
  | "draw"
  | "pen"
  | "comment";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface LayoutConfig {
  id: LayoutType;
  label: string;
  icon: string;
}

export const LAYOUTS: LayoutConfig[] = [
  { id: "radial", label: "Mapa de Ideias", icon: "⬡" },
  { id: "topdown", label: "Organograma", icon: "⊞" },
  { id: "leftright", label: "Lógica (→)", icon: "⊣" },
  { id: "tree", label: "Árvore", icon: "⊢" },
  { id: "fishbone", label: "Espinha de Peixe", icon: "≋" },
  { id: "timeline", label: "Linha do Tempo", icon: "⊸" },
];

export interface KanbanStatus {
  id: string;
  label: string;
  color: string;
}

export const KANBAN: KanbanStatus[] = [
  { id: "backlog", label: "Backlog", color: "#475569" },
  { id: "todo", label: "A fazer", color: "#60A5FA" },
  { id: "doing", label: "Em andamento", color: "#FBBF24" },
  { id: "review", label: "Revisão", color: "#C084FC" },
  { id: "done", label: "Concluído", color: "#34D399" },
];

export interface PriorityConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export const PRIORITY: PriorityConfig[] = [
  { id: "low", label: "Baixa", color: "#475569", icon: "▽" },
  { id: "medium", label: "Média", color: "#60A5FA", icon: "◈" },
  { id: "high", label: "Alta", color: "#FBBF24", icon: "▲" },
  { id: "urgent", label: "Urgente", color: "#F87171", icon: "⚡" },
];

export const NODE_COLORS = [
  "#6EE7F7",
  "#A78BFA",
  "#F472B6",
  "#34D399",
  "#FBBF24",
  "#F87171",
  "#60A5FA",
  "#FB923C",
  "#C084FC",
  "#86EFAC",
];
