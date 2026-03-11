"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Link2,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  FileJson,
  AlertCircle,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TableDetails, ColumnInfo } from "@/types/schema";

interface ColumnViewerProps {
  tableName: string;
}

const typeIcons: Record<string, React.ElementType> = {
  integer: Hash,
  bigint: Hash,
  smallint: Hash,
  numeric: Hash,
  real: Hash,
  "double precision": Hash,
  text: Type,
  "character varying": Type,
  varchar: Type,
  char: Type,
  boolean: ToggleLeft,
  timestamp: Calendar,
  "timestamp with time zone": Calendar,
  "timestamp without time zone": Calendar,
  date: Calendar,
  time: Calendar,
  json: FileJson,
  jsonb: FileJson,
  uuid: Key,
};

function getTypeIcon(dataType: string): React.ElementType {
  return typeIcons[dataType.toLowerCase()] || Type;
}

function formatDataType(col: ColumnInfo): string {
  let type = col.data_type;

  if (col.character_maximum_length) {
    type += `(${col.character_maximum_length})`;
  } else if (col.numeric_precision) {
    type += `(${col.numeric_precision})`;
  }

  return type;
}

export function ColumnViewer({ tableName }: ColumnViewerProps) {
  const [details, setDetails] = useState<TableDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schema/${encodeURIComponent(tableName)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch table details");
      }

      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      fetchDetails();
    }
  }, [tableName]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button variant="outline" onClick={fetchDetails}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{details.table_name}</h2>
          <p className="text-sm text-muted-foreground">
            {details.row_count.toLocaleString()} rows ·{" "}
            {details.columns.length} columns
          </p>
        </div>
        <div className="flex items-center gap-2">
          {details.rls_enabled && (
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              RLS
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchDetails}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Columns Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Column</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Nullable</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Default</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {details.columns.map((col) => {
              const TypeIcon = getTypeIcon(col.data_type);
              return (
                <tr
                  key={col.column_name}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {col.is_primary_key && (
                        <Key className="h-4 w-4 text-amber-500" />
                      )}
                      {col.is_foreign_key && (
                        <Link2 className="h-4 w-4 text-blue-500" />
                      )}
                      <span
                        className={cn(
                          "font-mono text-sm",
                          col.is_primary_key && "font-semibold"
                        )}
                      >
                        {col.column_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {formatDataType(col)}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={col.is_nullable === "YES" ? "outline" : "secondary"}
                      className="text-xs"
                    >
                      {col.is_nullable === "YES" ? "NULL" : "NOT NULL"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {col.column_default ? (
                      <code className="text-xs text-muted-foreground truncate max-w-[200px] block">
                        {col.column_default}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {col.is_foreign_key && col.foreign_table_name ? (
                      <code className="text-xs text-blue-600">
                        {col.foreign_table_name}.{col.foreign_column_name}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* RLS Policies */}
      {details.policies.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            RLS Policies ({details.policies.length})
          </h3>
          <div className="space-y-2">
            {details.policies.map((policy) => (
              <div
                key={policy.policy_name}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{policy.command}</Badge>
                  <span className="font-mono text-sm">{policy.policy_name}</span>
                  {!policy.is_permissive && (
                    <Badge variant="destructive" className="text-xs">
                      RESTRICTIVE
                    </Badge>
                  )}
                </div>
                {policy.using_expression && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">USING: </span>
                    <code className="bg-muted px-1.5 py-0.5 rounded">
                      {policy.using_expression}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foreign Keys */}
      {details.foreign_keys.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Foreign Keys ({details.foreign_keys.length})
          </h3>
          <div className="border rounded-lg divide-y">
            {details.foreign_keys.map((fk) => (
              <div
                key={fk.constraint_name}
                className="px-4 py-2 flex items-center gap-2 text-sm"
              >
                <code className="font-mono">{fk.column_name}</code>
                <span className="text-muted-foreground">→</span>
                <code className="font-mono text-blue-600">
                  {fk.foreign_table_name}.{fk.foreign_column_name}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
