"use client";

import { useState } from "react";
import { Clock, Copy, Check, AlertTriangle, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { SlowQuery, ExplainResult } from "@/types/schema";

interface SlowQueriesProps {
  slowQueries: SlowQuery[];
}

// Format milliseconds to readable string
function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} us`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// Truncate query for display
function truncateQuery(query: string, maxLength = 80): string {
  const cleaned = query.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + "...";
}

function QueryExplainDialog({ query }: { query: string }) {
  const [explaining, setExplaining] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runExplain = async () => {
    setExplaining(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to run EXPLAIN");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setExplaining(false);
    }
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Query Analysis</DialogTitle>
        <DialogDescription>
          Run EXPLAIN ANALYZE to understand query performance
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Query</label>
          <ScrollArea className="h-[100px] mt-2 rounded-md border bg-muted/50">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
              {query}
            </pre>
          </ScrollArea>
        </div>

        <Button onClick={runExplain} disabled={explaining}>
          {explaining ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run EXPLAIN ANALYZE
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {result && (
          <div>
            <label className="text-sm font-medium">Execution Plan</label>
            <ScrollArea className="h-[200px] mt-2 rounded-md border bg-muted/50">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                {typeof result.plan === "string" ? result.plan : JSON.stringify(result.plan, null, 2)}
              </pre>
            </ScrollArea>
            {result.execution_time && (
              <div className="mt-2 text-sm text-muted-foreground">
                Execution time: {formatTime(result.execution_time)}
                {result.planning_time && ` (Planning: ${formatTime(result.planning_time)})`}
              </div>
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

function QueryRow({ query: q }: { query: SlowQuery }) {
  const [copied, setCopied] = useState(false);

  const copyQuery = () => {
    navigator.clipboard.writeText(q.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine severity based on mean time
  const getSeverity = (meanTime: number) => {
    if (meanTime > 1000) return "destructive";
    if (meanTime > 100) return "warning";
    return "secondary";
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={getSeverity(q.mean_time) as "destructive" | "secondary" | "default"}>
            {formatTime(q.mean_time)} avg
          </Badge>
          <Badge variant="outline">{q.calls} calls</Badge>
          <Badge variant="outline">{q.rows.toLocaleString()} rows</Badge>
        </div>
        <code className="text-sm text-muted-foreground block truncate">
          {truncateQuery(q.query)}
        </code>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={copyQuery}>
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Explain
            </Button>
          </DialogTrigger>
          <QueryExplainDialog query={q.query} />
        </Dialog>
      </div>
    </div>
  );
}

export function SlowQueries({ slowQueries }: SlowQueriesProps) {
  if (slowQueries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Slow Queries
          </CardTitle>
          <CardDescription>
            Queries with longest execution times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No slow queries data</p>
            <p className="text-sm mt-1">
              pg_stat_statements extension may not be enabled
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by mean time (slowest first)
  const sortedQueries = [...slowQueries].sort((a, b) => b.mean_time - a.mean_time);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Slow Queries
        </CardTitle>
        <CardDescription>
          Top {sortedQueries.length} queries by average execution time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {sortedQueries.map((query, index) => (
              <QueryRow key={query.query_id || index} query={query} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function SlowQueriesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
