// ============================================
// BOARD ENGINE — Types
// ============================================

export type ColumnType =
  | "text"
  | "number"
  | "status"
  | "date"
  | "person"
  | "dropdown"
  | "checkbox";

export type ViewType = "table" | "kanban" | "calendar";

// ── Board ──────────────────────────────────────

export interface Board {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  icon: string | null;
  color: string | null;
  settings: BoardSettings;
  created_at: string;
  updated_at: string;
  // computed — não vem do banco, calculado no hook
  item_count?: number;
}

export interface BoardSettings {
  [key: string]: unknown;
}

// ── Column ────────────────────────────────────

export interface StatusLabel {
  id: string;
  label: string;
  color: string;
}

export interface DropdownOption {
  id: string;
  label: string;
}

export interface BoardColumnSettings {
  labels?: StatusLabel[]; // para type=status
  options?: DropdownOption[]; // para type=dropdown
  [key: string]: unknown;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  column_type: ColumnType;
  settings: BoardColumnSettings;
  position: number;
  width: number | null;
  is_visible: boolean;
}

// ── Group ─────────────────────────────────────

export interface BoardGroup {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  collapsed: boolean;
}

// ── Item ──────────────────────────────────────

export interface BoardItem {
  id: string;
  board_id: string;
  group_id: string;
  name: string;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  values?: BoardItemValue[];
}

// ── Item Value ────────────────────────────────

export interface BoardItemValue {
  id: string;
  item_id: string;
  column_id: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_json: unknown | null;
}

// ── View ──────────────────────────────────────

export interface BoardViewConfig {
  [key: string]: unknown;
}

export interface BoardView {
  id: string;
  board_id: string;
  name: string;
  view_type: ViewType;
  config: BoardViewConfig;
  is_default: boolean;
  position: number;
}

// ── Subitem ───────────────────────────────────

export interface BoardSubitem {
  id: string;
  parent_item_id: string;
  name: string;
  position: number;
}

// ── Aggregated Board Data ─────────────────────

export interface BoardData {
  board: Board;
  columns: BoardColumn[];
  groups: BoardGroup[];
  items: BoardItem[];
  views: BoardView[];
  // items indexados por group_id para performance
  itemsByGroup: Record<string, BoardItem[]>;
}

// ── Helpers ───────────────────────────────────

/** Retorna o valor de uma celula como string bruta para exibicao */
export function getCellRawValue(
  item: BoardItem,
  columnId: string,
): string | number | boolean | null {
  const val = item.values?.find((v) => v.column_id === columnId);
  if (!val) return null;
  if (val.value_number !== null) return val.value_number;
  if (val.value_text !== null) return val.value_text;
  if (val.value_date !== null) return val.value_date;
  if (val.value_json !== null) {
    if (typeof val.value_json === "boolean") return val.value_json;
    return String(val.value_json);
  }
  return null;
}

/** Paleta de cores de status — Monday-style */
export const STATUS_COLORS = {
  green: "#00C875",
  yellow: "#FDAB3D",
  red: "#E2445C",
  blue: "#579BFC",
  purple: "#A25DDC",
  orange: "#FF7575",
  teal: "#037F4C",
  gray: "#C4C4C4",
} as const;

export type StatusColor = keyof typeof STATUS_COLORS;

/** Paleta de cores para boards */
export const BOARD_COLORS = [
  "#579BFC", // blue
  "#00C875", // green
  "#FDAB3D", // yellow
  "#E2445C", // red
  "#A25DDC", // purple
  "#037F4C", // teal
  "#FF7575", // orange
  "#C4C4C4", // gray
] as const;

/** Status labels padrão (quando nao configurados) */
export const DEFAULT_STATUS_LABELS: StatusLabel[] = [
  { id: "todo", label: "A fazer", color: "#C4C4C4" },
  { id: "inprogress", label: "Em andamento", color: "#579BFC" },
  { id: "done", label: "Concluido", color: "#00C875" },
  { id: "stuck", label: "Travado", color: "#E2445C" },
];
