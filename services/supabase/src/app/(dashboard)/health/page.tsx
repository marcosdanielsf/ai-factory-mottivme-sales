"use client";

import { useState, useEffect, useCallback } from "react";
import { HealthDashboard } from "@/components/health/health-dashboard";
import { SimilarTables } from "@/components/health/similar-tables";
import { TableComparison } from "@/components/health/table-comparison";
import { DuplicateColumns } from "@/components/health/duplicate-columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Layers, Columns3 } from "lucide-react";

interface HealthMetrics {
  total_tables: number;
  tables_without_pk: number;
  tables_without_rls: number;
  tables_without_indexes: number;
  total_columns: number;
  total_rows: number;
}

interface SimilarityResult {
  table1: string;
  table2: string;
  similarity_percent: number;
  shared_columns: string[];
  table1_only: string[];
  table2_only: string[];
  table1_columns: string[];
  table2_columns: string[];
}

interface DuplicateColumn {
  column_name: string;
  data_type: string;
  tables: string[];
  occurrence_count: number;
}

interface SimilarityStats {
  tables_with_similarity: number;
  columns_duplicated: number;
}

export default function HealthPage() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [similarTables, setSimilarTables] = useState<SimilarityResult[]>([]);
  const [duplicateColumns, setDuplicateColumns] = useState<DuplicateColumn[]>(
    []
  );
  const [similarityStats, setSimilarityStats] =
    useState<SimilarityStats | null>(null);

  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(true);

  const [selectedPair, setSelectedPair] = useState<SimilarityResult | null>(
    null
  );
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthData = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Failed to fetch health data");
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error("Error fetching health data:", error);
      setMetrics(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  const fetchSimilarData = useCallback(async () => {
    setIsLoadingSimilar(true);
    try {
      const res = await fetch("/api/health/similar");
      if (!res.ok) throw new Error("Failed to fetch similarity data");
      const data = await res.json();
      setSimilarTables(data.similar_tables || []);
      setDuplicateColumns(data.duplicate_columns || []);
      setSimilarityStats({
        tables_with_similarity: data.tables_with_similarity || 0,
        columns_duplicated: data.columns_duplicated || 0,
      });
    } catch (error) {
      console.error("Error fetching similarity data:", error);
      setSimilarTables([]);
      setDuplicateColumns([]);
      setSimilarityStats(null);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchHealthData(), fetchSimilarData()]);
    setLastUpdated(new Date());
  }, [fetchHealthData, fetchSimilarData]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleCompare = (pair: SimilarityResult) => {
    setSelectedPair(pair);
    setComparisonOpen(true);
  };

  const isLoading = isLoadingHealth || isLoadingSimilar;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Check</h1>
          <p className="text-muted-foreground mt-1">
            Analise de saude e integridade do banco de dados
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Atualizado:{" "}
              {lastUpdated.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            onClick={refreshAll}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <HealthDashboard
        metrics={metrics}
        similarityStats={similarityStats}
        isLoading={isLoadingHealth}
      />

      {/* Tabs for detailed views */}
      <Tabs defaultValue="similar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="similar" className="gap-2">
            <Layers className="h-4 w-4" />
            Tabelas Similares
            {similarTables.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full">
                {similarTables.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="gap-2">
            <Columns3 className="h-4 w-4" />
            Colunas Duplicadas
            {duplicateColumns.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-600 rounded-full">
                {duplicateColumns.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Visao Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="similar">
          <SimilarTables
            similarTables={similarTables}
            isLoading={isLoadingSimilar}
            onCompare={handleCompare}
          />
        </TabsContent>

        <TabsContent value="duplicates">
          <DuplicateColumns
            duplicateColumns={duplicateColumns}
            isLoading={isLoadingSimilar}
          />
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <SimilarTables
              similarTables={similarTables.slice(0, 5)}
              isLoading={isLoadingSimilar}
              onCompare={handleCompare}
            />
            <DuplicateColumns
              duplicateColumns={duplicateColumns.slice(0, 5)}
              isLoading={isLoadingSimilar}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Table Comparison Dialog */}
      <TableComparison
        pair={selectedPair}
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
      />
    </div>
  );
}
