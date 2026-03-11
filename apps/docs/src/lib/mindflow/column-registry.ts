import type { ReactNode } from "react";
import type { MindflowColumn, ColumnValue } from "@/types/mindflow";

export interface FilterOperator {
  id: string;
  label: string;
  apply: (cellValue: unknown, filterValue: unknown) => boolean;
}

export interface ColumnType<T = unknown> {
  type: string;
  label: string;
  icon: string;
  defaultValue: T;
  renderCell: (value: T, column: MindflowColumn) => ReactNode;
  renderEditor: (
    value: T,
    column: MindflowColumn,
    onChange: (value: T) => void,
  ) => ReactNode;
  validate: (value: unknown, column: MindflowColumn) => boolean;
  serialize: (value: T) => ColumnValue;
  deserialize: (raw: ColumnValue) => T;
  sortComparator: (a: T, b: T) => number;
  filterOperators: FilterOperator[];
}

// Registry singleton
const registry = new Map<string, ColumnType<any>>();

export function registerColumnType<T>(columnType: ColumnType<T>): void {
  registry.set(columnType.type, columnType);
}

export function getColumnType(type: string): ColumnType<any> {
  return registry.get(type) || registry.get("text")!;
}

export function getAllColumnTypes(): ColumnType<any>[] {
  return Array.from(registry.values());
}
