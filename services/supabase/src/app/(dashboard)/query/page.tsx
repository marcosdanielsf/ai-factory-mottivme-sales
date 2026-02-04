"use client";

import { useState, useCallback, useEffect } from "react";
import { QueryEditor, ResultGrid, QueryHistory, HistoryItem } from "@/components/query";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { QueryResult } from "@/app/api/query/route";

const HISTORY_STORAGE_KEY = "query-editor-history";
const MAX_HISTORY_ITEMS = 50;

interface ConfirmationState {
  open: boolean;
  warning: string;
  detectedKeywords: string[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function QueryPage() {
  const [sql, setSql] = useState<string>("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    open: false,
    warning: "",
    detectedKeywords: [],
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(
          parsed.map((item: HistoryItem) => ({
            ...item,
            executedAt: new Date(item.executedAt),
          }))
        );
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  const addToHistory = useCallback(
    (querySql: string, success: boolean, executionTime?: number, rowCount?: number) => {
      const newItem: HistoryItem = {
        id: generateId(),
        sql: querySql,
        executedAt: new Date(),
        success,
        executionTime,
        rowCount,
      };

      setHistory((prev) => {
        // Remove duplicates (same SQL)
        const filtered = prev.filter(
          (item) => item.sql.trim() !== querySql.trim()
        );
        // Add new item at the beginning and limit total items
        return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      });
    },
    []
  );

  const executeQuery = useCallback(
    async (confirmed: boolean = false) => {
      const trimmedSql = sql.trim();
      if (!trimmedSql) return;

      setIsLoading(true);
      setResult(null);

      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sql: trimmedSql, confirmed }),
        });

        const data = await response.json();

        // Check if confirmation is required
        if (data.requiresConfirmation) {
          setConfirmation({
            open: true,
            warning: data.warning,
            detectedKeywords: data.detectedKeywords || [],
          });
          setIsLoading(false);
          return;
        }

        // Set result
        setResult(data);

        // Add to history
        addToHistory(
          trimmedSql,
          !data.error,
          data.executionTime,
          data.rowCount
        );
      } catch (error) {
        setResult({
          data: null,
          columns: [],
          rowCount: 0,
          executionTime: 0,
          error: error instanceof Error ? error.message : "Request failed",
        });
        addToHistory(trimmedSql, false);
      } finally {
        setIsLoading(false);
      }
    },
    [sql, addToHistory]
  );

  const handleExecute = useCallback(() => {
    executeQuery(false);
  }, [executeQuery]);

  const handleConfirm = useCallback(() => {
    setConfirmation({ open: false, warning: "", detectedKeywords: [] });
    executeQuery(true);
  }, [executeQuery]);

  const handleCancel = useCallback(() => {
    setConfirmation({ open: false, warning: "", detectedKeywords: [] });
    setIsLoading(false);
  }, []);

  const handleHistorySelect = useCallback((selectedSql: string) => {
    setSql(selectedSql);
  }, []);

  const handleHistoryClear = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  const handleHistoryDelete = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="h-[calc(100vh-3.5rem-3rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Query Editor</h1>
        <p className="text-sm text-muted-foreground">
          Execute SQL queries directly on your database
        </p>
      </div>

      <ResizablePanelGroup orientation="horizontal" className="flex-1 rounded-lg border">
        {/* Main content: Editor + Results */}
        <ResizablePanel defaultSize={75} minSize={50}>
          <ResizablePanelGroup orientation="vertical">
            {/* Editor */}
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full p-2">
                <QueryEditor
                  value={sql}
                  onChange={setSql}
                  onExecute={handleExecute}
                  isLoading={isLoading}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Results */}
            <ResizablePanel defaultSize={60} minSize={20}>
              <div className="h-full p-2">
                <ResultGrid result={result} isLoading={isLoading} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* History sidebar */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full p-2">
            <QueryHistory
              history={history}
              onSelect={handleHistorySelect}
              onClear={handleHistoryClear}
              onDelete={handleHistoryDelete}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmation.open} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Dangerous Query</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{confirmation.warning}</p>
              {confirmation.detectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm">Detected operations:</span>
                  {confirmation.detectedKeywords.map((kw) => (
                    <code
                      key={kw}
                      className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-mono"
                    >
                      {kw}
                    </code>
                  ))}
                </div>
              )}
              <p className="text-sm font-medium text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Execute Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
