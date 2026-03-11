"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Database,
  Lightbulb,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TableSizes } from "./table-sizes";
import { SlowQueries, SlowQueriesSkeleton } from "./slow-queries";
import type { PerformanceMetrics, IndexSuggestion } from "@/types/schema";

function IndexSuggestions({ suggestions }: { suggestions: IndexSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Index Suggestions
          </CardTitle>
          <CardDescription>
            Recommendations for missing indexes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mb-4 opacity-50 text-green-500" />
            <p className="text-lg font-medium">No missing indexes detected</p>
            <p className="text-sm mt-1">
              Your database indexes look good!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Index Suggestions
          <Badge variant="destructive" className="ml-2">
            {suggestions.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Recommended indexes based on foreign keys and query patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {suggestion.table_name}.{suggestion.column_name}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.reason}
                    </p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                      {suggestion.suggestion}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function PerfDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/performance");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch metrics");
      }

      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Metrics skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <SlowQueriesSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold">Failed to load metrics</h3>
            <p className="text-muted-foreground mt-1">{error}</p>
            <Button onClick={fetchMetrics} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div></div>
        <Button variant="outline" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Database Size"
          value={metrics.databaseSize}
          description="Total storage used"
          icon={Database}
        />
        <MetricCard
          title="Total Tables"
          value={metrics.tableSizes.length}
          description="Public schema tables"
          icon={Activity}
        />
        <MetricCard
          title="Active Connections"
          value={metrics.activeConnections}
          description="Current database connections"
          icon={Users}
        />
        <MetricCard
          title="Index Issues"
          value={metrics.indexSuggestions.length}
          description="Missing indexes detected"
          icon={AlertTriangle}
        />
      </div>

      {/* Table Sizes & Slow Queries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TableSizes
          tableSizes={metrics.tableSizes}
          databaseSize={metrics.databaseSize}
        />
        <SlowQueries slowQueries={metrics.slowQueries} />
      </div>

      {/* Index Suggestions */}
      <IndexSuggestions suggestions={metrics.indexSuggestions} />
    </div>
  );
}
