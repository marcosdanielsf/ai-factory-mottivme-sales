"use client";

import { useState, useEffect } from "react";
import {
  Download,
  HardDrive,
  Loader2,
  RefreshCw,
  Table2,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BackupOptions } from "./backup-options";
import { cn } from "@/lib/utils";
import type { BackupType, BackupResult, TableInfo } from "@/types/schema";

export function BackupManager() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);

  // Backup options
  const [backupType, setBackupType] = useState<BackupType>("full");
  const [includeDropStatements, setIncludeDropStatements] = useState(false);
  const [includeConstraints, setIncludeConstraints] = useState(true);

  // Fetch tables
  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schema");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch tables");
      }

      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Toggle table selection
  const toggleTable = (tableName: string) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableName)) {
      newSelected.delete(tableName);
    } else {
      newSelected.add(tableName);
    }
    setSelectedTables(newSelected);
  };

  // Select all tables
  const selectAll = () => {
    setSelectedTables(new Set(tables.map((t) => t.table_name)));
  };

  // Deselect all tables
  const deselectAll = () => {
    setSelectedTables(new Set());
  };

  // Generate backup
  const generateBackup = async () => {
    if (selectedTables.size === 0) {
      setError("Please select at least one table");
      return;
    }

    setGenerating(true);
    setError(null);
    setBackupResult(null);

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: Array.from(selectedTables),
          backupType,
          includeDropStatements,
          includeConstraints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate backup");
      }

      setBackupResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  // Download backup as file
  const downloadBackup = () => {
    if (!backupResult) return;

    const blob = new Blob([backupResult.sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${backupResult.backupType}-${new Date().toISOString().split("T")[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Table Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5" />
                Select Tables
              </CardTitle>
              <CardDescription>
                Choose tables to include in the backup
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchTables}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              <Square className="h-4 w-4 mr-2" />
              Deselect All
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">
              {selectedTables.size} of {tables.length} selected
            </span>
          </div>

          <ScrollArea className="h-[400px] rounded-md border p-2">
            <div className="space-y-1">
              {tables.map((table) => (
                <label
                  key={table.table_name}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors",
                    "hover:bg-accent",
                    selectedTables.has(table.table_name) && "bg-accent"
                  )}
                >
                  <Checkbox
                    checked={selectedTables.has(table.table_name)}
                    onCheckedChange={() => toggleTable(table.table_name)}
                  />
                  <span className="flex-1 truncate">{table.table_name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {table.row_count?.toLocaleString() || 0} rows
                  </span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Backup Options */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Backup Options
            </CardTitle>
            <CardDescription>Configure your backup settings</CardDescription>
          </CardHeader>
          <CardContent>
            <BackupOptions
              backupType={backupType}
              onBackupTypeChange={setBackupType}
              includeDropStatements={includeDropStatements}
              onIncludeDropChange={setIncludeDropStatements}
              includeConstraints={includeConstraints}
              onIncludeConstraintsChange={setIncludeConstraints}
            />

            {error && (
              <div className="flex items-center gap-2 mt-4 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              className="w-full mt-6"
              onClick={generateBackup}
              disabled={generating || selectedTables.size === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Backup...
                </>
              ) : (
                <>
                  <HardDrive className="h-4 w-4 mr-2" />
                  Generate Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Backup Result */}
        {backupResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckSquare className="h-5 w-5" />
                Backup Generated
              </CardTitle>
              <CardDescription>
                {backupResult.tables.length} tables, {formatSize(backupResult.size)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{backupResult.backupType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tables:</span>
                    <span className="font-medium">{backupResult.tables.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{formatSize(backupResult.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Generated:</span>
                    <span className="font-medium">
                      {new Date(backupResult.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button className="w-full" onClick={downloadBackup}>
                  <Download className="h-4 w-4 mr-2" />
                  Download .sql File
                </Button>

                <ScrollArea className="h-[200px] rounded-md border bg-muted/50">
                  <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                    {backupResult.sql.substring(0, 2000)}
                    {backupResult.sql.length > 2000 && "\n\n... (truncated for preview)"}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
