"use client";

import { useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  History,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HistoryItem {
  id: string;
  sql: string;
  executedAt: Date;
  success: boolean;
  executionTime?: number;
  rowCount?: number;
}

interface QueryHistoryProps {
  history: HistoryItem[];
  onSelect: (sql: string) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateSql(sql: string, maxLength: number = 100): string {
  const cleaned = sql.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + "...";
}

export function QueryHistory({
  history,
  onSelect,
  onClear,
  onDelete,
}: QueryHistoryProps) {
  const handleCopy = useCallback(async (sql: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(sql);
  }, []);

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(id);
    },
    [onDelete]
  );

  if (history.length === 0) {
    return (
      <div className="flex flex-col h-full border rounded-lg bg-background">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="text-sm font-medium">History</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <History className="h-8 w-8 opacity-50" />
            <p className="text-sm">No query history</p>
            <p className="text-xs">Executed queries will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="text-sm font-medium">History</span>
          <span className="text-xs text-muted-foreground">
            ({history.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
          title="Clear history"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.sql)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-colors",
                "hover:bg-accent hover:border-accent-foreground/20",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                item.success
                  ? "border-border"
                  : "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.success ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                    <code className="text-xs font-mono truncate text-foreground">
                      {truncateSql(item.sql, 50)}
                    </code>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(new Date(item.executedAt))}
                    </span>
                    {item.executionTime !== undefined && (
                      <span>{item.executionTime}ms</span>
                    )}
                    {item.rowCount !== undefined && (
                      <span>{item.rowCount} rows</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => handleCopy(item.sql, e)}
                    className="opacity-50 hover:opacity-100"
                    title="Copy query"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-50 hover:opacity-100 hover:text-destructive"
                    title="Delete from history"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
