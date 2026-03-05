import React from "react";
import { registerColumnType } from "../column-registry";
import type {
  MindflowColumn,
  ColumnValue,
  NumberColumnSettings,
} from "@/types/mindflow";

function formatNumber(value: number, column: MindflowColumn): string {
  if (value === null || value === undefined || isNaN(value)) return "";

  const settings = column.settings as NumberColumnSettings;
  const decimals = settings?.decimals ?? 0;
  const prefix = settings?.prefix ?? "";
  const suffix = settings?.suffix ?? "";

  let formatted: string;
  switch (settings?.format) {
    case "currency":
      formatted = value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      break;
    case "percent":
      formatted = `${(value * 100).toFixed(decimals)}%`;
      break;
    default:
      formatted = value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
  }

  return `${prefix}${formatted}${suffix}`;
}

registerColumnType<number>({
  type: "number",
  label: "Number",
  icon: "Hash",
  defaultValue: 0,

  renderCell: (value: number, column: MindflowColumn) => {
    return <span className="tabular-nums">{formatNumber(value, column)}</span>;
  },

  renderEditor: (
    value: number,
    _column: MindflowColumn,
    onChange: (v: number) => void,
  ) => {
    return (
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent outline-none text-sm tabular-nums"
        autoFocus
      />
    );
  },

  validate: (value: unknown) => {
    if (value === null || value === undefined || value === "") return true;
    return !isNaN(Number(value));
  },

  serialize: (value: number): ColumnValue => ({
    value: Number(value) || 0,
  }),

  deserialize: (raw: ColumnValue): number => {
    return Number(raw?.value) || 0;
  },

  sortComparator: (a: number, b: number) => {
    return (a || 0) - (b || 0);
  },

  filterOperators: [
    {
      id: "equals",
      label: "Equals",
      apply: (cellValue: unknown, filterValue: unknown) =>
        Number(cellValue) === Number(filterValue),
    },
    {
      id: "greater_than",
      label: "Greater than",
      apply: (cellValue: unknown, filterValue: unknown) =>
        Number(cellValue) > Number(filterValue),
    },
    {
      id: "less_than",
      label: "Less than",
      apply: (cellValue: unknown, filterValue: unknown) =>
        Number(cellValue) < Number(filterValue),
    },
    {
      id: "is_empty",
      label: "Is empty",
      apply: (cellValue: unknown) =>
        cellValue === null || cellValue === undefined || cellValue === "",
    },
  ],
});
