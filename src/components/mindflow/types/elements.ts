// ── Element Types ──────────────────────────────────────────────────────────────

export type ElementType =
  | "node"
  | "sticky"
  | "text"
  | "shape"
  | "frame"
  | "image"
  | "drawing"
  | "comment";

export type StatusType = "backlog" | "todo" | "doing" | "review" | "done";
export type PriorityType = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: PriorityType;
  due: string | null;
}

// ── Element Data payloads (by type) ───────────────────────────────────────────

export interface NodeData {
  [key: string]: unknown;
  label: string;
  color: string;
  status: StatusType;
  tasks: Task[];
  emoji?: string;
}

export interface StickyData {
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple";
  fontSize: number;
}

export interface TextData {
  content: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  align: "left" | "center" | "right";
}

export interface ShapeData {
  variant: "rectangle" | "circle" | "diamond" | "arrow" | "line";
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  points?: { x: number; y: number }[];
}

export interface FrameData {
  title: string;
  background: string;
  borderColor: string;
}

export interface ImageData {
  storageKey: string;
  url: string;
  alt?: string;
  objectFit: "contain" | "cover";
}

export interface DrawingData {
  paths: string[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface CommentReply {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface CommentData {
  author: string;
  authorId: string;
  content: string;
  resolved: boolean;
  replies: CommentReply[];
  createdAt: string;
}

export type ElementData =
  | NodeData
  | StickyData
  | TextData
  | ShapeData
  | FrameData
  | ImageData
  | DrawingData
  | CommentData;

// ── Canvas Element (universal) ─────────────────────────────────────────────────

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  zIndex?: number;
  parentId?: string | null;
  data: ElementData;
}

// ── Canvas Operations (for batch updates / AI) ─────────────────────────────────

export type CanvasOperationType = "add" | "update" | "delete" | "move";

export interface CanvasOperation {
  op: CanvasOperationType;
  element?: CanvasElement;
  id?: string;
  patch?: Partial<CanvasElement>;
}
