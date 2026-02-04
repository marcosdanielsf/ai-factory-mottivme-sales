"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CellEditorProps {
  value: unknown;
  columnType: string;
  isEditable: boolean;
  isPrimaryKey: boolean;
  onSave: (newValue: unknown) => Promise<void>;
}

export function CellEditor({
  value,
  columnType,
  isEditable,
  isPrimaryKey,
  onSave,
}: CellEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format display value
  const displayValue = formatDisplayValue(value, columnType);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    if (!isEditable || isPrimaryKey) return;
    setEditValue(formatEditValue(value));
    setIsEditing(true);
  }, [isEditable, isPrimaryKey, value]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const parsedValue = parseValue(editValue, columnType);
      await onSave(parsedValue);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save";
      setError(errorMessage);
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  }, [editValue, columnType, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        cancelEditing();
      }
    },
    [handleSave, cancelEditing]
  );

  // Editing mode
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 -my-1 min-w-0">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className={cn(
              "h-7 text-xs bg-zinc-800 border-emerald-500/50 focus-visible:ring-emerald-500/30 min-w-[100px]",
              error && "border-red-500/50"
            )}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
            className="h-6 w-6 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={cancelEditing}
            disabled={saving}
            className="h-6 w-6 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </div>
    );
  }

  // Display mode
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 min-w-0",
        isEditable && !isPrimaryKey && "cursor-pointer"
      )}
      onDoubleClick={startEditing}
    >
      <span
        className={cn(
          "truncate text-sm",
          value === null && "text-zinc-500 italic",
          isPrimaryKey && "text-amber-400/80 font-mono text-xs"
        )}
        title={typeof value === "string" ? value : JSON.stringify(value)}
      >
        {displayValue}
      </span>
      {isEditable && !isPrimaryKey && (
        <Button
          size="icon"
          variant="ghost"
          onClick={startEditing}
          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 shrink-0"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// Utilities
function formatDisplayValue(value: unknown, columnType: string): string {
  if (value === null || value === undefined) return "NULL";
  if (value === "") return '""';

  // Boolean
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  // Date/timestamp
  if (columnType.includes("timestamp") || columnType.includes("date")) {
    try {
      const date = new Date(value as string);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    } catch {
      // fallback to raw value
    }
  }

  // JSON/JSONB
  if (columnType === "jsonb" || columnType === "json") {
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
  }

  // Array
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  // Object
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatEditValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function parseValue(stringValue: string, columnType: string): unknown {
  // Empty string handling
  if (stringValue === "" || stringValue.toLowerCase() === "null") {
    return null;
  }

  // Boolean
  if (columnType === "bool" || columnType === "boolean") {
    return stringValue.toLowerCase() === "true";
  }

  // Integer types
  if (
    columnType === "int2" ||
    columnType === "int4" ||
    columnType === "int8" ||
    columnType === "integer" ||
    columnType === "smallint" ||
    columnType === "bigint"
  ) {
    const num = parseInt(stringValue, 10);
    if (isNaN(num)) throw new Error("Invalid integer");
    return num;
  }

  // Float types
  if (
    columnType === "float4" ||
    columnType === "float8" ||
    columnType === "real" ||
    columnType === "double precision" ||
    columnType === "numeric" ||
    columnType === "decimal"
  ) {
    const num = parseFloat(stringValue);
    if (isNaN(num)) throw new Error("Invalid number");
    return num;
  }

  // JSON/JSONB
  if (columnType === "json" || columnType === "jsonb") {
    try {
      return JSON.parse(stringValue);
    } catch {
      throw new Error("Invalid JSON");
    }
  }

  // UUID - validate format
  if (columnType === "uuid") {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(stringValue)) {
      throw new Error("Invalid UUID format");
    }
    return stringValue;
  }

  // Default: return as string
  return stringValue;
}
