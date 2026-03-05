import React from "react";
import { registerColumnType } from "../column-registry";
import type {
  MindflowColumn,
  ColumnValue,
  DateColumnSettings,
} from "@/types/mindflow";

function formatDate(value: string, column: MindflowColumn): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const settings = column.settings as DateColumnSettings;
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    if (settings?.include_time) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("pt-BR", options);
  } catch {
    return value;
  }
}

registerColumnType<string>({
  type: "date",
  label: "Date",
  icon: "Calendar",
  defaultValue: "",

  renderCell: (value: string, column: MindflowColumn) => {
    return <span>{formatDate(value, column)}</span>;
  },

  renderEditor: (
    value: string,
    _column: MindflowColumn,
    onChange: (v: string) => void,
  ) => {
    // Convert ISO string to YYYY-MM-DD for the date input
    const inputValue = value ? value.substring(0, 10) : "";

    return (
      <input
        type="date"
        value={inputValue}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value).toISOString() : "")
        }
        className="w-full bg-transparent outline-none text-sm"
        autoFocus
      />
    );
  },

  validate: (value: unknown) => {
    if (!value || value === "") return true;
    const date = new Date(String(value));
    return !isNaN(date.getTime());
  },

  serialize: (value: string): ColumnValue => ({
    value: value ?? "",
  }),

  deserialize: (raw: ColumnValue): string => {
    return String(raw?.value ?? "");
  },

  sortComparator: (a: string, b: string) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  },

  filterOperators: [
    {
      id: "equals",
      label: "Equals",
      apply: (cellValue: unknown, filterValue: unknown) => {
        if (!cellValue || !filterValue) return false;
        return (
          String(cellValue).substring(0, 10) ===
          String(filterValue).substring(0, 10)
        );
      },
    },
    {
      id: "before",
      label: "Before",
      apply: (cellValue: unknown, filterValue: unknown) => {
        if (!cellValue || !filterValue) return false;
        return new Date(String(cellValue)) < new Date(String(filterValue));
      },
    },
    {
      id: "after",
      label: "After",
      apply: (cellValue: unknown, filterValue: unknown) => {
        if (!cellValue || !filterValue) return false;
        return new Date(String(cellValue)) > new Date(String(filterValue));
      },
    },
    {
      id: "is_empty",
      label: "Is empty",
      apply: (cellValue: unknown) => !cellValue || String(cellValue) === "",
    },
  ],
});
