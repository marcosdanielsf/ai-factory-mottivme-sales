import React from "react";
import { registerColumnType } from "../column-registry";
import type {
  MindflowColumn,
  ColumnValue,
  StatusColumnSettings,
  StatusOption,
} from "@/types/mindflow";

function getStatusOption(
  value: string,
  column: MindflowColumn,
): StatusOption | undefined {
  const settings = column.settings as unknown as StatusColumnSettings;
  return settings?.labels?.find((opt) => opt.id === value);
}

registerColumnType<string>({
  type: "status",
  label: "Status",
  icon: "CircleDot",
  defaultValue: "",

  renderCell: (value: string, column: MindflowColumn) => {
    if (!value) return <span />;
    const option = getStatusOption(value, column);
    if (!option) return <span className="text-text-muted">{value}</span>;

    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        style={{ backgroundColor: `${option.color}20`, color: option.color }}
      >
        {option.label}
      </span>
    );
  },

  renderEditor: (
    value: string,
    column: MindflowColumn,
    onChange: (v: string) => void,
  ) => {
    const settings = column.settings as unknown as StatusColumnSettings;
    const options = settings?.labels || [];

    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none text-sm"
        autoFocus
      >
        <option value="">--</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },

  validate: (value: unknown, column: MindflowColumn) => {
    if (!value || value === "") return true;
    const settings = column.settings as unknown as StatusColumnSettings;
    return settings?.labels?.some((opt) => opt.id === value) ?? false;
  },

  serialize: (value: string): ColumnValue => {
    return { value: value ?? "" };
  },

  deserialize: (raw: ColumnValue): string => {
    return String(raw?.value ?? "");
  },

  sortComparator: (a: string, b: string) => {
    return (a || "").localeCompare(b || "");
  },

  filterOperators: [
    {
      id: "equals",
      label: "Equals",
      apply: (cellValue: unknown, filterValue: unknown) =>
        String(cellValue || "") === String(filterValue || ""),
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
