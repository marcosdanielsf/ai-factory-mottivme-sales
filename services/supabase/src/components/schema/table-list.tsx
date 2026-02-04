"use client";

import { useState, useEffect } from "react";
import { Table2, Search, RefreshCw, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TableInfo } from "@/types/schema";

interface TableListProps {
  onSelectTable: (table: TableInfo) => void;
  selectedTable?: string | null;
}

export function TableList({ onSelectTable, selectedTable }: TableListProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schema");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch tables");
      }

      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const filteredTables = tables.filter((t) =>
    t.table_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTables}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Tables ({tables.length})
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchTables}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredTables.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No tables found
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredTables.map((table) => (
              <button
                key={table.table_name}
                onClick={() => onSelectTable(table)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors",
                  "hover:bg-accent",
                  selectedTable === table.table_name && "bg-accent"
                )}
              >
                <Table2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{table.table_name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {table.row_count?.toLocaleString() || 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
