"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Database, Loader2, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { TableInfo } from "@/types/schema";

interface TableSelectorProps {
  selectedTable: string | null;
  onSelectTable: (table: string) => void;
}

export function TableSelector({ selectedTable, onSelectTable }: TableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTables() {
      try {
        const res = await fetch("/api/schema");
        const data = await res.json();
        setTables(data.tables || []);
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, []);

  const filteredTables = tables.filter((table) =>
    table.table_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTableInfo = tables.find((t) => t.table_name === selectedTable);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[320px] justify-between h-11 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80 text-left font-normal"
        >
          {loading ? (
            <span className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tables...
            </span>
          ) : selectedTable ? (
            <span className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-emerald-500" />
              <span className="font-medium">{selectedTable}</span>
              {selectedTableInfo && (
                <span className="text-xs text-zinc-500 ml-1">
                  ({selectedTableInfo.row_count.toLocaleString()} rows)
                </span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-zinc-400">
              <Database className="h-4 w-4" />
              Select a table...
            </span>
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0 bg-zinc-900 border-zinc-700" align="start">
        <div className="p-2 border-b border-zinc-800">
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-zinc-800/50 border-zinc-700 focus-visible:ring-emerald-500/30"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              No tables found
            </div>
          ) : (
            <div className="p-1">
              {filteredTables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => {
                    onSelectTable(table.table_name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    "hover:bg-zinc-800",
                    selectedTable === table.table_name && "bg-zinc-800"
                  )}
                >
                  <Table2
                    className={cn(
                      "h-4 w-4",
                      selectedTable === table.table_name
                        ? "text-emerald-500"
                        : "text-zinc-500"
                    )}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{table.table_name}</div>
                    <div className="text-xs text-zinc-500">
                      {table.row_count.toLocaleString()} rows
                    </div>
                  </div>
                  {selectedTable === table.table_name && (
                    <Check className="h-4 w-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
