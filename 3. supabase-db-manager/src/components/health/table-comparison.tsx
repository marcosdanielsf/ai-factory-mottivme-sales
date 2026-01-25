"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, ArrowLeftRight } from "lucide-react";

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

interface TableComparisonProps {
  pair: SimilarityResult | null;
  open: boolean;
  onClose: () => void;
}

export function TableComparison({ pair, open, onClose }: TableComparisonProps) {
  if (!pair) return null;

  const getSimilarityColor = (percent: number) => {
    if (percent >= 80) return "bg-red-500";
    if (percent >= 65) return "bg-amber-500";
    return "bg-slate-500";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{pair.table1}</span>
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <span className="font-mono">{pair.table2}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Comparacao lado a lado das estruturas das tabelas
            <Badge className={getSimilarityColor(pair.similarity_percent)}>
              {pair.similarity_percent}% similar
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Table 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg font-mono">{pair.table1}</h3>
              <Badge variant="outline">{pair.table1_columns.length} colunas</Badge>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border p-4">
              <div className="space-y-3">
                {/* Shared columns first */}
                {pair.shared_columns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Colunas em comum ({pair.shared_columns.length})
                    </h4>
                    <div className="space-y-1">
                      {pair.shared_columns.map((col) => (
                        <div
                          key={col}
                          className="px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 font-mono text-sm"
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pair.shared_columns.length > 0 && pair.table1_only.length > 0 && (
                  <Separator className="my-4" />
                )}

                {/* Unique columns */}
                {pair.table1_only.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Exclusivas de {pair.table1} ({pair.table1_only.length})
                    </h4>
                    <div className="space-y-1">
                      {pair.table1_only.map((col) => (
                        <div
                          key={col}
                          className="px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20 font-mono text-sm"
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Table 2 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg font-mono">{pair.table2}</h3>
              <Badge variant="outline">{pair.table2_columns.length} colunas</Badge>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border p-4">
              <div className="space-y-3">
                {/* Shared columns first */}
                {pair.shared_columns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Colunas em comum ({pair.shared_columns.length})
                    </h4>
                    <div className="space-y-1">
                      {pair.shared_columns.map((col) => (
                        <div
                          key={col}
                          className="px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 font-mono text-sm"
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pair.shared_columns.length > 0 && pair.table2_only.length > 0 && (
                  <Separator className="my-4" />
                )}

                {/* Unique columns */}
                {pair.table2_only.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Exclusivas de {pair.table2} ({pair.table2_only.length})
                    </h4>
                    <div className="space-y-1">
                      {pair.table2_only.map((col) => (
                        <div
                          key={col}
                          className="px-3 py-2 rounded-md bg-blue-500/10 border border-blue-500/20 font-mono text-sm"
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Consolidation Suggestion */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="font-medium mb-2">Analise de Consolidacao</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            {pair.similarity_percent >= 80 ? (
              <>
                <p className="text-red-600 font-medium">
                  Alta similaridade detectada ({pair.similarity_percent}%)
                </p>
                <p>
                  Estas tabelas compartilham{" "}
                  <strong>{pair.shared_columns.length}</strong> colunas. Considere
                  fortemente consolidar em uma unica tabela, usando uma coluna de
                  tipo (enum) para diferenciar os registros.
                </p>
              </>
            ) : pair.similarity_percent >= 65 ? (
              <>
                <p className="text-amber-600 font-medium">
                  Similaridade moderada ({pair.similarity_percent}%)
                </p>
                <p>
                  Avalie se estas tabelas representam entidades relacionadas. Uma
                  tabela base com heranca ou views especializadas pode ser mais
                  adequado.
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-600 font-medium">
                  Similaridade baixa ({pair.similarity_percent}%)
                </p>
                <p>
                  As tabelas compartilham algumas colunas comuns, mas parecem
                  representar entidades distintas. Verifique se as colunas
                  compartilhadas seguem o mesmo padrao de dados.
                </p>
              </>
            )}

            {pair.shared_columns.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="font-medium mb-1">Colunas candidatas para tabela base:</p>
                <div className="flex flex-wrap gap-1">
                  {pair.shared_columns.map((col) => (
                    <Badge key={col} variant="secondary" className="font-mono text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
