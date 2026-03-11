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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Columns3,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

interface DuplicateColumn {
  column_name: string;
  data_type: string;
  tables: string[];
  occurrence_count: number;
}

interface DuplicateColumnsProps {
  duplicateColumns: DuplicateColumn[];
  isLoading: boolean;
}

const IGNORED_COLUMNS_KEY = "health-ignored-duplicate-columns";

export function DuplicateColumns({
  duplicateColumns,
  isLoading,
}: DuplicateColumnsProps) {
  const [ignoredColumns, setIgnoredColumns] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  // Load ignored columns from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(IGNORED_COLUMNS_KEY);
    if (stored) {
      try {
        setIgnoredColumns(new Set(JSON.parse(stored)));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const toggleIgnore = (columnName: string) => {
    const newIgnored = new Set(ignoredColumns);

    if (newIgnored.has(columnName)) {
      newIgnored.delete(columnName);
    } else {
      newIgnored.add(columnName);
    }

    setIgnoredColumns(newIgnored);
    localStorage.setItem(IGNORED_COLUMNS_KEY, JSON.stringify([...newIgnored]));
  };

  const isIgnored = (columnName: string) => {
    return ignoredColumns.has(columnName);
  };

  const getOccurrenceColor = (count: number) => {
    if (count >= 5) return "bg-red-500 hover:bg-red-600";
    if (count >= 3) return "bg-amber-500 hover:bg-amber-600 text-white";
    return "bg-slate-500 hover:bg-slate-600";
  };

  const visibleColumns = showIgnored
    ? duplicateColumns
    : duplicateColumns.filter((c) => !isIgnored(c.column_name));

  const ignoredCount = duplicateColumns.filter((c) =>
    isIgnored(c.column_name)
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5" />
            Colunas Duplicadas
          </CardTitle>
          <CardDescription>Analisando colunas repetidas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (duplicateColumns.length === 0) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            Colunas Duplicadas
          </CardTitle>
          <CardDescription>
            Nenhuma coluna duplicada significativa encontrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Colunas comuns como id, created_at e updated_at sao ignoradas na
            analise.
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
              Colunas Duplicadas
              <Badge variant="secondary" className="ml-2">
                {visibleColumns.length} colunas
              </Badge>
            </CardTitle>
            <CardDescription>
              Colunas que aparecem em multiplas tabelas. Pode indicar necessidade
              de normalizacao.
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
                  Ocultar ignoradas
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Mostrar ignoradas ({ignoredCount})
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
                <TableHead>Coluna</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Ocorrencias</TableHead>
                <TableHead>Tabelas</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleColumns.map((col) => {
                const ignored = isIgnored(col.column_name);
                const isExpanded = expandedColumn === col.column_name;

                return (
                  <TableRow
                    key={col.column_name}
                    className={ignored ? "opacity-50 bg-muted/30" : ""}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {col.column_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {col.data_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getOccurrenceColor(col.occurrence_count)}>
                        {col.occurrence_count}x
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {col.tables
                          .slice(0, isExpanded ? undefined : 3)
                          .map((table) => (
                            <Badge
                              key={table}
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {table}
                            </Badge>
                          ))}
                        {col.tables.length > 3 && !isExpanded && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-2 text-xs"
                                  onClick={() =>
                                    setExpandedColumn(col.column_name)
                                  }
                                >
                                  +{col.tables.length - 3} mais
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para expandir</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {isExpanded && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 text-xs"
                            onClick={() => setExpandedColumn(null)}
                          >
                            Recolher
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleIgnore(col.column_name)}
                        title={ignored ? "Restaurar alerta" : "Ignorar alerta"}
                      >
                        {ignored ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {visibleColumns.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sobre Colunas Duplicadas
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                - Colunas com o mesmo nome e tipo em multiplas tabelas podem
                indicar dados desnormalizados
              </li>
              <li>
                - Considere criar tabelas de lookup/referencia para dados
                repetidos
              </li>
              <li>
                - Colunas como user_id, tenant_id e status sao comuns e podem ser
                intencionais
              </li>
              <li>
                - Use o botao X para ignorar alertas que voce ja revisou e
                considera corretos
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
