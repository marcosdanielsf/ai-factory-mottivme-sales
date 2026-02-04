"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
  Layers,
  X,
} from "lucide-react";

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

interface SimilarTablesProps {
  similarTables: SimilarityResult[];
  isLoading: boolean;
  onCompare: (pair: SimilarityResult) => void;
}

const IGNORED_PAIRS_KEY = "health-ignored-similar-tables";

export function SimilarTables({
  similarTables,
  isLoading,
  onCompare,
}: SimilarTablesProps) {
  const [ignoredPairs, setIgnoredPairs] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);

  // Load ignored pairs from sessionStorage (safer than localStorage for session data)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(IGNORED_PAIRS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setIgnoredPairs(new Set(parsed));
        }
      }
    } catch (error) {
      console.error('Failed to load ignored pairs:', error);
      // Clear corrupted data
      sessionStorage.removeItem(IGNORED_PAIRS_KEY);
    }
  }, []);

  const getPairKey = (table1: string, table2: string) => {
    return [table1, table2].sort().join(":");
  };

  const toggleIgnore = (table1: string, table2: string) => {
    const key = getPairKey(table1, table2);
    const newIgnored = new Set(ignoredPairs);

    if (newIgnored.has(key)) {
      newIgnored.delete(key);
    } else {
      newIgnored.add(key);
    }

    setIgnoredPairs(newIgnored);
    try {
      sessionStorage.setItem(IGNORED_PAIRS_KEY, JSON.stringify([...newIgnored]));
    } catch (error) {
      console.error('Failed to save ignored pairs:', error);
    }
  };

  const isIgnored = (table1: string, table2: string) => {
    return ignoredPairs.has(getPairKey(table1, table2));
  };

  const getSimilarityColor = (percent: number) => {
    if (percent >= 80) return "bg-red-500 hover:bg-red-600";
    if (percent >= 65) return "bg-amber-500 hover:bg-amber-600 text-white";
    return "bg-slate-500 hover:bg-slate-600";
  };

  const visibleTables = showIgnored
    ? similarTables
    : similarTables.filter((t) => !isIgnored(t.table1, t.table2));

  const ignoredCount = similarTables.filter((t) =>
    isIgnored(t.table1, t.table2)
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Tabelas Similares
          </CardTitle>
          <CardDescription>Carregando analise de similaridade...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (similarTables.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <Layers className="h-5 w-5" />
            Tabelas Similares
          </CardTitle>
          <CardDescription>
            Nenhuma tabela com similaridade maior que 50% foi encontrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seu schema parece bem normalizado. Continue mantendo boas praticas de
            modelagem.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Tabelas Similares
              <Badge variant="secondary" className="ml-2">
                {visibleTables.length} pares
              </Badge>
            </CardTitle>
            <CardDescription>
              Tabelas com mais de 50% das colunas em comum. Considere consolidar.
            </CardDescription>
          </div>
          {ignoredCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIgnored(!showIgnored)}
              className="gap-2"
            >
              {showIgnored ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ocultar ignorados
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Mostrar ignorados ({ignoredCount})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela 1</TableHead>
                <TableHead className="text-center w-12"></TableHead>
                <TableHead>Tabela 2</TableHead>
                <TableHead className="text-center">Similaridade</TableHead>
                <TableHead className="text-center">Colunas Compartilhadas</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTables.map((pair, idx) => {
                const ignored = isIgnored(pair.table1, pair.table2);
                return (
                  <TableRow
                    key={idx}
                    className={ignored ? "opacity-50 bg-muted/30" : ""}
                  >
                    <TableCell className="font-mono text-sm">
                      {pair.table1}
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({pair.table1_columns.length} cols)
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {pair.table2}
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({pair.table2_columns.length} cols)
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getSimilarityColor(pair.similarity_percent)}>
                        {pair.similarity_percent}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm">
                        {pair.shared_columns.length} colunas
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCompare(pair)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Comparar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleIgnore(pair.table1, pair.table2)}
                          title={ignored ? "Restaurar alerta" : "Ignorar alerta"}
                        >
                          {ignored ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {visibleTables.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium text-sm mb-2">Sugestoes de Consolidacao</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                - Tabelas com similaridade maior que 80% sao fortes candidatas a
                merge
              </li>
              <li>
                - Considere usar heranca de tabelas ou views para casos de
                especializacao
              </li>
              <li>
                - Colunas duplicadas podem indicar necessidade de normalizacao
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
