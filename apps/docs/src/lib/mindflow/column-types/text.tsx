import React from "react";
import { registerColumnType } from "../column-registry";
import type { MindflowColumn, ColumnValue } from "@/types/mindflow";

registerColumnType<string>({
  type: "text",
  label: "Text",
  icon: "Type",
  defaultValue: "",

  renderCell: (value: string) => {
    return <span className="truncate">{value || ""}</span>;
  },

  renderEditor: (
    value: string,
    _column: MindflowColumn,
    onChange: (v: string) => void,
  ) => {
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-sm"
        autoFocus
      />
    );
  },

  validate: (value: unknown) => {
    return typeof value === "string" || value === null || value === undefined;
  },

  serialize: (value: string): ColumnValue => ({
    value: value ?? "",
  }),

  deserialize: (raw: ColumnValue): string => {
    return String(raw?.value ?? "");
  },

  sortComparator: (a: string, b: string) => {
    return (a || "").localeCompare(b || "");
  },

  filterOperators: [
    {
      id: "contains",
      label: "Contains",
      apply: (cellValue: unknown, filterValue: unknown) =>
        String(cellValue || "")
          .toLowerCase()
          .includes(String(filterValue || "").toLowerCase()),
    },
    {
      id: "equals",
      label: "Equals",
      apply: (cellValue: unknown, filterValue: unknown) =>
        String(cellValue || "").toLowerCase() ===
        String(filterValue || "").toLowerCase(),
    },
    {
      id: "is_empty",
      label: "Is empty",
      apply: (cellValue: unknown) => !cellValue || String(cellValue) === "",
    },
    {
      id: "is_not_empty",
      label: "Is not empty",
      apply: (cellValue: unknown) => !!cellValue && String(cellValue) !== "",
    },
  ],
});
