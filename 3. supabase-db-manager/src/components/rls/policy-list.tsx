"use client";

import { useState, useEffect } from "react";
import {
  Table2,
  Search,
  RefreshCw,
  AlertCircle,
  Shield,
  ShieldOff,
  ChevronRight,
  Lock,
  Unlock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TableWithRLS } from "@/types/rls";

interface PolicyListProps {
  onSelectTable: (table: TableWithRLS) => void;
  selectedTable?: string | null;
}

export function PolicyList({ onSelectTable, selectedTable }: PolicyListProps) {
  const [tables, setTables] = useState<TableWithRLS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rls");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch RLS data");
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

  // Group tables by RLS status
  const tablesWithRLS = filteredTables.filter((t) => t.rls_enabled);
  const tablesWithoutRLS = filteredTables.filter((t) => !t.rls_enabled);

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
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Tables</span>
          </div>
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

        {/* Summary badges */}
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="text-xs border-emerald-500/30 text-emerald-600"
          >
            <Lock className="h-3 w-3 mr-1" />
            {tablesWithRLS.length} protected
          </Badge>
          <Badge
            variant="outline"
            className="text-xs border-amber-500/30 text-amber-600"
          >
            <Unlock className="h-3 w-3 mr-1" />
            {tablesWithoutRLS.length} unprotected
          </Badge>
        </div>
      </div>

      {/* Table list */}
      <div className="flex-1 overflow-auto">
        {filteredTables.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No tables found
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {/* Tables with RLS enabled */}
            {tablesWithRLS.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  RLS Enabled
                </div>
                <div className="space-y-1">
                  {tablesWithRLS.map((table) => (
                    <TableButton
                      key={table.table_name}
                      table={table}
                      isSelected={selectedTable === table.table_name}
                      onClick={() => onSelectTable(table)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tables without RLS */}
            {tablesWithoutRLS.length > 0 && (
              <div>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <ShieldOff className="h-3 w-3" />
                  RLS Disabled
                </div>
                <div className="space-y-1">
                  {tablesWithoutRLS.map((table) => (
                    <TableButton
                      key={table.table_name}
                      table={table}
                      isSelected={selectedTable === table.table_name}
                      onClick={() => onSelectTable(table)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TableButton({
  table,
  isSelected,
  onClick,
}: {
  table: TableWithRLS;
  isSelected: boolean;
  onClick: () => void;
}) {
  const policyCount = table.policies?.length || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-left transition-all duration-150",
        "hover:bg-accent group",
        isSelected && "bg-accent ring-1 ring-primary/20"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
          table.rls_enabled
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-muted border-muted-foreground/10"
        )}
      >
        <Table2
          className={cn(
            "h-4 w-4",
            table.rls_enabled ? "text-emerald-600" : "text-muted-foreground"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="truncate block font-medium">{table.table_name}</span>
        <span className="text-xs text-muted-foreground">
          {policyCount === 0
            ? "No policies"
            : `${policyCount} ${policyCount === 1 ? "policy" : "policies"}`}
        </span>
      </div>

      <ChevronRight
        className={cn(
          "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
          "group-hover:translate-x-0.5",
          isSelected && "text-primary"
        )}
      />
    </button>
  );
}
