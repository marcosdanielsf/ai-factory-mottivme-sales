// MindFlow Type Definitions
// Mirrors database schema from Plan 01-01

// Column system
export type MindflowColumnType = "text" | "number" | "status" | "date";
// Phase 3 additions: | 'person' | 'dropdown' | 'checkbox'

export interface MindflowColumn {
  id: string; // e.g., "col_abc123"
  type: MindflowColumnType;
  title: string;
  settings: Record<string, unknown>;
  width: number; // pixels
  position: string; // fractional index
}

export interface StatusOption {
  id: string;
  label: string;
  color: string;
}

export interface StatusColumnSettings {
  labels: StatusOption[];
  default_index?: number;
}

export interface NumberColumnSettings {
  format?: "number" | "currency" | "percent";
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export interface DateColumnSettings {
  date_format?: string;
  include_time?: boolean;
}

export interface ColumnValue {
  value: unknown;
  label?: string;
}

export interface MindflowBoard {
  id: string;
  name: string;
  description: string | null;
  columns: MindflowColumn[];
  column_order: string[];
  icon: string;
  color: string;
  created_by: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MindflowGroup {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: string;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MindflowItem {
  id: string;
  board_id: string;
  group_id: string;
  parent_id: string | null;
  name: string;
  column_values: Record<string, ColumnValue>;
  position: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MindflowView {
  id: string;
  board_id: string;
  name: string;
  type: "table" | "kanban" | "calendar";
  position: number;
  filters: unknown[];
  sort_config: unknown[];
  group_by: string | null;
  hidden_columns: string[];
  column_widths: Record<string, number>;
  kanban_config: unknown | null;
  calendar_config: unknown | null;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
