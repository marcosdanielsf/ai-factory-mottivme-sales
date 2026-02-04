"use client";

import { useState } from "react";
import { Filter, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ColumnInfo } from "@/types/schema";

export interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface FiltersProps {
  columns: ColumnInfo[];
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
}

const OPERATORS = [
  { value: "eq", label: "equals", symbol: "=" },
  { value: "neq", label: "not equals", symbol: "!=" },
  { value: "gt", label: "greater than", symbol: ">" },
  { value: "gte", label: "greater or equal", symbol: ">=" },
  { value: "lt", label: "less than", symbol: "<" },
  { value: "lte", label: "less or equal", symbol: "<=" },
  { value: "like", label: "contains", symbol: "~" },
  { value: "is", label: "is", symbol: "IS" },
];

export function Filters({ columns, filters, onFiltersChange }: FiltersProps) {
  const [open, setOpen] = useState(false);

  const addFilter = () => {
    const firstColumn = columns[0]?.column_name || "";
    onFiltersChange([
      ...filters,
      {
        id: crypto.randomUUID(),
        column: firstColumn,
        operator: "eq",
        value: "",
      },
    ]);
  };

  const updateFilter = (
    id: string,
    field: keyof FilterCondition,
    value: string
  ) => {
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
    setOpen(false);
  };

  const activeFiltersCount = filters.filter((f) => f.value !== "").length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 px-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[480px] p-0 bg-zinc-900 border-zinc-700"
        align="start"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h4 className="font-medium text-sm">Filter Data</h4>
          {filters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
          {filters.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-sm">
              No filters applied. Add a filter to narrow down results.
            </div>
          ) : (
            filters.map((filter, index) => (
              <div key={filter.id} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-xs text-zinc-500 w-8">AND</span>
                )}
                {index === 0 && <span className="w-8" />}

                <Select
                  value={filter.column}
                  onValueChange={(v) => updateFilter(filter.id, "column", v)}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {columns.map((col) => (
                      <SelectItem
                        key={col.column_name}
                        value={col.column_name}
                        className="text-xs"
                      >
                        {col.column_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={(v) => updateFilter(filter.id, "operator", v)}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {OPERATORS.map((op) => (
                      <SelectItem
                        key={op.value}
                        value={op.value}
                        className="text-xs"
                      >
                        <span className="font-mono mr-2">{op.symbol}</span>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {filter.operator === "is" ? (
                  <Select
                    value={filter.value}
                    onValueChange={(v) => updateFilter(filter.id, "value", v)}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="null" className="text-xs">
                        NULL
                      </SelectItem>
                      <SelectItem value="true" className="text-xs">
                        TRUE
                      </SelectItem>
                      <SelectItem value="false" className="text-xs">
                        FALSE
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={filter.value}
                    onChange={(e) =>
                      updateFilter(filter.id, "value", e.target.value)
                    }
                    placeholder="Value..."
                    className="flex-1 h-8 text-xs bg-zinc-800 border-zinc-700"
                  />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(filter.id)}
                  className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={addFilter}
            className="w-full h-8 text-xs border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50"
          >
            <Plus className="h-3 w-3 mr-2" />
            Add filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
