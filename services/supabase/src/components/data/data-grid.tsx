"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  RowSelectionState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CellEditor } from "./cell-editor";
import { Filters, FilterCondition } from "./filters";
import { ColumnInfo } from "@/types/schema";

interface DataGridProps {
  tableName: string;
}

interface DataResponse {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Type for row data
type RowData = Record<string, unknown>;

export function DataGrid({ tableName }: DataGridProps) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const limit = 100;

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([]);

  // Selection
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filters
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add row dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  // Find primary key column
  const primaryKeyColumn = useMemo(() => {
    const pkCol = columns.find((c) => c.is_primary_key);
    return pkCol?.column_name || "id";
  }, [columns]);

  // Fetch columns info
  useEffect(() => {
    async function fetchColumns() {
      try {
        const res = await fetch(`/api/schema/${tableName}`);
        const result = await res.json();
        if (result.columns) {
          setColumns(result.columns);
        }
      } catch (err) {
        console.error("Failed to fetch columns:", err);
      }
    }
    if (tableName) {
      fetchColumns();
    }
  }, [tableName]);

  // Fetch data
  const fetchData = useCallback(
    async (showRefresh = false) => {
      if (!tableName) return;

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        // Add sorting
        if (sorting.length > 0) {
          params.set("sortColumn", sorting[0].id);
          params.set("sortDirection", sorting[0].desc ? "desc" : "asc");
        }

        // Add filters
        const activeFilters = filters.filter((f) => f.value !== "");
        if (activeFilters.length > 0) {
          params.set(
            "filters",
            JSON.stringify(
              activeFilters.map(({ column, operator, value }) => ({
                column,
                operator,
                value,
              }))
            )
          );
        }

        const res = await fetch(`/api/data/${tableName}?${params}`);
        const result: DataResponse = await res.json();

        if (result.data) {
          setData(result.data);
          setTotalPages(result.totalPages);
          setTotalRows(result.total);
        } else {
          throw new Error("Failed to fetch data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tableName, page, sorting, filters]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Handle cell update
  const handleCellUpdate = useCallback(
    async (rowId: unknown, columnId: string, newValue: unknown) => {
      try {
        const res = await fetch(`/api/data/${tableName}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: rowId,
            primaryKey: primaryKeyColumn,
            updates: { [columnId]: newValue },
          }),
        });

        const result = await res.json();
        if (result.success) {
          // Update local data
          setData((prev) =>
            prev.map((row) =>
              row[primaryKeyColumn] === rowId
                ? { ...row, [columnId]: newValue }
                : row
            )
          );
          toast.success("Cell updated");
        } else {
          throw new Error(result.error || "Update failed");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
        throw err;
      }
    },
    [tableName, primaryKeyColumn]
  );

  // Handle delete selected rows
  const handleDeleteSelected = useCallback(async () => {
    const selectedRows = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => data[parseInt(index)][primaryKeyColumn]);

    if (selectedRows.length === 0) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/data/${tableName}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedRows,
          primaryKey: primaryKeyColumn,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Deleted ${result.deletedCount} row(s)`);
        setRowSelection({});
        fetchData(true);
      } else {
        throw new Error(result.error || "Delete failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [tableName, rowSelection, data, primaryKeyColumn, fetchData]);

  // Handle add new row
  const handleAddRow = useCallback(async () => {
    setAdding(true);
    try {
      // Filter out empty values and primary key if auto-generated
      const filteredData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(newRowData)) {
        if (value !== "") {
          const col = columns.find((c) => c.column_name === key);
          // Skip primary key if it has a default (likely auto-generated)
          if (col?.is_primary_key && col.column_default) continue;
          filteredData[key] = value;
        }
      }

      const res = await fetch(`/api/data/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredData),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("Row added successfully");
        setAddDialogOpen(false);
        setNewRowData({});
        fetchData(true);
      } else {
        throw new Error(result.error || "Insert failed");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add row");
    } finally {
      setAdding(false);
    }
  }, [tableName, newRowData, columns, fetchData]);

  // Export functions
  const exportToJSON = useCallback(() => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to JSON");
  }, [data, tableName]);

  const sanitizeCSVValue = (value: string): string => {
    // Escape double quotes
    let sanitized = value.replace(/"/g, '""');

    // Prevent formula injection
    if (/^[=+\-@\t\r]/.test(sanitized)) {
      sanitized = "'" + sanitized;
    }

    return `"${sanitized}"`;
  };

  const exportToCSV = useCallback(() => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null) return "";
            if (typeof val === "string") {
              return sanitizeCSVValue(val);
            }
            return sanitizeCSVValue(String(val));
          })
          .join(",")
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  }, [data, tableName]);

  // Build table columns
  const tableColumns = useMemo((): ColumnDef<RowData>[] => {
    const cols: ColumnDef<RowData>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-zinc-600"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-zinc-600"
          />
        ),
        size: 40,
      },
    ];

    for (const col of columns) {
      const colDef: ColumnDef<RowData> = {
        id: col.column_name,
        accessorKey: col.column_name,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <button
              onClick={() => column.toggleSorting()}
              className="flex items-center gap-1 hover:text-zinc-200 transition-colors group"
            >
              <span className="truncate">{col.column_name}</span>
              {col.is_primary_key && (
                <span className="text-amber-500 text-xs">PK</span>
              )}
              {isSorted === "asc" ? (
                <ArrowUp className="h-3 w-3 text-emerald-500" />
              ) : isSorted === "desc" ? (
                <ArrowDown className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row, getValue }) => {
          const value = getValue();
          const rowId = row.original[primaryKeyColumn];
          return (
            <CellEditor
              value={value}
              columnType={col.udt_name}
              isEditable={true}
              isPrimaryKey={col.is_primary_key}
              onSave={async (newValue) => {
                await handleCellUpdate(rowId, col.column_name, newValue);
              }}
            />
          );
        },
        size: col.udt_name === "uuid" ? 280 : 150,
      };
      cols.push(colDef);
    }

    return cols;
  }, [columns, primaryKeyColumn, handleCellUpdate]);

  // Create table instance
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: totalPages,
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  // Loading skeleton
  if (loading && data.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-[200px] bg-zinc-800" />
          <Skeleton className="h-9 w-[100px] bg-zinc-800" />
        </div>
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <div className="bg-zinc-900/50 p-3">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-24 bg-zinc-800" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-zinc-800">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-3">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-24 bg-zinc-800/50" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-red-500/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">Failed to load data</h3>
        <p className="text-zinc-500 mb-4">{error}</p>
        <Button onClick={() => fetchData()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filters
            columns={columns}
            filters={filters}
            onFiltersChange={setFilters}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="h-9 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="h-9"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewRowData({});
              setAddDialogOpen(true);
            }}
            className="h-9 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-700"
            >
              <DropdownMenuItem
                onClick={exportToCSV}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToJSON}
                className="cursor-pointer"
              >
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <div>
          {totalRows.toLocaleString()} total rows
          {selectedCount > 0 && (
            <span className="ml-2">
              | {selectedCount} selected
            </span>
          )}
        </div>
        <div>
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-zinc-900/70 hover:bg-zinc-900/70 border-zinc-800"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="text-zinc-400 font-medium text-xs h-10"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="h-32 text-center text-zinc-500"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-zinc-800 hover:bg-zinc-800/30 data-[state=selected]:bg-emerald-500/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                        className="py-2 px-3 text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          Showing {(page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, totalRows)} of {totalRows.toLocaleString()}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="h-8 w-8 border-zinc-700 bg-zinc-900/50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 w-8 border-zinc-700 bg-zinc-900/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) {
                  setPage(val);
                }
              }}
              className="w-16 h-8 text-center text-sm bg-zinc-900 border-zinc-700"
            />
            <span className="text-sm text-zinc-500">/ {totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 w-8 border-zinc-700 bg-zinc-900/50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="h-8 w-8 border-zinc-700 bg-zinc-900/50"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} row(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected rows will be
              permanently deleted from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Row Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Row</DialogTitle>
            <DialogDescription>
              Enter values for the new row. Leave empty for NULL values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {columns.map((col) => (
              <div key={col.column_name} className="grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-medium flex items-center gap-2">
                  {col.column_name}
                  {col.is_primary_key && (
                    <span className="text-xs text-amber-500">PK</span>
                  )}
                  {col.is_nullable === "NO" && !col.column_default && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </label>
                <div className="col-span-2">
                  <Input
                    value={newRowData[col.column_name] || ""}
                    onChange={(e) =>
                      setNewRowData((prev) => ({
                        ...prev,
                        [col.column_name]: e.target.value,
                      }))
                    }
                    placeholder={
                      col.column_default
                        ? `Default: ${col.column_default}`
                        : col.is_nullable === "YES"
                        ? "NULL"
                        : "Required"
                    }
                    disabled={col.is_primary_key && !!col.column_default}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-xs text-zinc-500 mt-1">
                    {col.udt_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button onClick={handleAddRow} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
