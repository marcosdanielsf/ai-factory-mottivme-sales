"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Rows3, Columns3, AlertCircle, CheckCircle2 } from "lucide-react";
import type { QueryResult } from "@/app/api/query/route";

interface ResultGridProps {
  result: QueryResult | null;
  isLoading: boolean;
}

function sanitizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatValue(value: unknown): string {
  if (value === null) return "NULL";
  if (value === undefined) return "";
  if (typeof value === "object") {
    return sanitizeValue(JSON.stringify(value));
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return sanitizeValue(value);
}

function getValueClassName(value: unknown): string {
  if (value === null) return "text-muted-foreground italic";
  if (typeof value === "number") return "text-blue-500 font-mono";
  if (typeof value === "boolean") return "text-purple-500";
  if (typeof value === "object") return "text-orange-500 font-mono text-xs";
  return "";
}

export function ResultGrid({ result, isLoading }: ResultGridProps) {
  const hasError = result?.error;
  const hasData = result?.data && result.data.length > 0;
  const isEmpty = result && !hasError && result.data?.length === 0;

  const stats = useMemo(() => {
    if (!result) return null;
    return {
      rows: result.rowCount,
      columns: result.columns.length,
      time: result.executionTime,
    };
  }, [result]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full border rounded-lg bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Executing query...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col h-full border rounded-lg bg-background">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Rows3 className="h-12 w-12 opacity-50" />
            <p className="text-sm">Run a query to see results</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-4">
          {hasError ? (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Error
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Success
            </Badge>
          )}
          {result.warning && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {result.warning}
            </Badge>
          )}
        </div>
        {stats && !hasError && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Rows3 className="h-3 w-3" />
              {stats.rows} rows
            </span>
            <span className="flex items-center gap-1">
              <Columns3 className="h-3 w-3" />
              {stats.columns} columns
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {stats.time}ms
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {hasError && (
          <div className="p-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-mono">{result.error}</p>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Rows3 className="h-8 w-8 opacity-50" />
              <p className="text-sm">Query returned no results</p>
            </div>
          </div>
        )}

        {hasData && (
          <ScrollArea className="h-full">
            <div className="min-w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 text-center font-mono text-xs text-muted-foreground">
                      #
                    </TableHead>
                    {result.columns.map((column, colIndex) => (
                      <TableHead
                        key={`${column}-${colIndex}`}
                        className="font-medium whitespace-nowrap"
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data!.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {rowIndex + 1}
                      </TableCell>
                      {result.columns.map((column, colIndex) => (
                        <TableCell
                          key={`${column}-${colIndex}`}
                          className={`max-w-[300px] truncate ${getValueClassName(
                            row[column]
                          )}`}
                          title={formatValue(row[column])}
                        >
                          {formatValue(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
