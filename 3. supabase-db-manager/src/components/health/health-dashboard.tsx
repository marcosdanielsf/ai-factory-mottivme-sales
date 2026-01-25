"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Columns3,
  Rows3,
  ShieldAlert,
  KeyRound,
  Search,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface HealthMetrics {
  total_tables: number;
  tables_without_pk: number;
  tables_without_rls: number;
  tables_without_indexes: number;
  total_columns: number;
  total_rows: number;
}

interface SimilarityStats {
  tables_with_similarity: number;
  columns_duplicated: number;
}

interface HealthDashboardProps {
  metrics: HealthMetrics | null;
  similarityStats: SimilarityStats | null;
  isLoading: boolean;
}

export function HealthDashboard({
  metrics,
  similarityStats,
  isLoading,
}: HealthDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Erro ao carregar metricas
          </CardTitle>
          <CardDescription>
            Nao foi possivel obter os dados de saude do banco.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const healthScore = calculateHealthScore(metrics, similarityStats);

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <Card
        className={`border-2 ${
          healthScore >= 80
            ? "border-emerald-500/50 bg-emerald-500/5"
            : healthScore >= 60
            ? "border-amber-500/50 bg-amber-500/5"
            : "border-red-500/50 bg-red-500/5"
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Score de Saude do Banco
            </CardTitle>
            <Badge
              variant={
                healthScore >= 80
                  ? "default"
                  : healthScore >= 60
                  ? "secondary"
                  : "destructive"
              }
              className={`text-lg px-4 py-1 ${
                healthScore >= 80
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : healthScore >= 60
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : ""
              }`}
            >
              {healthScore}%
            </Badge>
          </div>
          <CardDescription>
            Baseado em boas praticas de modelagem e seguranca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {healthScore >= 80 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span>Banco em bom estado. Continue monitorando.</span>
              </>
            ) : healthScore >= 60 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>
                  Alguns pontos de atencao identificados. Revise as metricas
                  abaixo.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>
                  Problemas criticos detectados. Acao imediata recomendada.
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Tabelas"
          value={metrics.total_tables}
          icon={<Database className="h-5 w-5" />}
          description="Tabelas no schema public"
          status="neutral"
        />

        <MetricCard
          title="Total de Colunas"
          value={metrics.total_columns}
          icon={<Columns3 className="h-5 w-5" />}
          description="Colunas em todas as tabelas"
          status="neutral"
        />

        <MetricCard
          title="Total de Registros"
          value={formatNumber(metrics.total_rows)}
          icon={<Rows3 className="h-5 w-5" />}
          description="Registros no banco"
          status="neutral"
        />

        <MetricCard
          title="Sem Primary Key"
          value={metrics.tables_without_pk}
          icon={<KeyRound className="h-5 w-5" />}
          description={
            metrics.tables_without_pk > 0
              ? "Tabelas precisam de PK"
              : "Todas tabelas com PK"
          }
          status={metrics.tables_without_pk > 0 ? "warning" : "success"}
        />

        <MetricCard
          title="Sem RLS"
          value={metrics.tables_without_rls}
          icon={<ShieldAlert className="h-5 w-5" />}
          description={
            metrics.tables_without_rls > 0
              ? "Tabelas expostas"
              : "RLS em todas tabelas"
          }
          status={
            metrics.tables_without_rls > 0
              ? metrics.tables_without_rls > 5
                ? "danger"
                : "warning"
              : "success"
          }
        />

        <MetricCard
          title="Sem Indexes"
          value={metrics.tables_without_indexes}
          icon={<Search className="h-5 w-5" />}
          description={
            metrics.tables_without_indexes > 0
              ? "Performance comprometida"
              : "Indexes configurados"
          }
          status={metrics.tables_without_indexes > 0 ? "warning" : "success"}
        />

        {similarityStats && (
          <>
            <MetricCard
              title="Tabelas Similares"
              value={similarityStats.tables_with_similarity}
              icon={<AlertTriangle className="h-5 w-5" />}
              description={
                similarityStats.tables_with_similarity > 0
                  ? "Pares com >50% similaridade"
                  : "Nenhuma duplicata detectada"
              }
              status={
                similarityStats.tables_with_similarity > 0
                  ? "warning"
                  : "success"
              }
            />

            <MetricCard
              title="Colunas Duplicadas"
              value={similarityStats.columns_duplicated}
              icon={<Columns3 className="h-5 w-5" />}
              description={
                similarityStats.columns_duplicated > 0
                  ? "Colunas repetidas entre tabelas"
                  : "Schema normalizado"
              }
              status={
                similarityStats.columns_duplicated > 5
                  ? "warning"
                  : similarityStats.columns_duplicated > 0
                  ? "neutral"
                  : "success"
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
  status: "success" | "warning" | "danger" | "neutral";
}

function MetricCard({
  title,
  value,
  icon,
  description,
  status,
}: MetricCardProps) {
  const statusStyles = {
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    danger: "border-red-500/30 bg-red-500/5",
    neutral: "",
  };

  const iconStyles = {
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={statusStyles[status]}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={iconStyles[status]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function calculateHealthScore(
  metrics: HealthMetrics,
  similarityStats: SimilarityStats | null
): number {
  let score = 100;

  // Penalize for missing primary keys (10 points each, max 30)
  score -= Math.min(metrics.tables_without_pk * 10, 30);

  // Penalize for missing RLS (5 points each, max 25)
  score -= Math.min(metrics.tables_without_rls * 5, 25);

  // Penalize for missing indexes (3 points each, max 15)
  score -= Math.min(metrics.tables_without_indexes * 3, 15);

  if (similarityStats) {
    // Penalize for similar tables (5 points each, max 15)
    score -= Math.min(similarityStats.tables_with_similarity * 5, 15);

    // Penalize for duplicate columns (1 point each, max 15)
    score -= Math.min(similarityStats.columns_duplicated * 1, 15);
  }

  return Math.max(0, Math.round(score));
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
