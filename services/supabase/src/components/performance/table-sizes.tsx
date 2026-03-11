"use client";

import { Database, HardDrive, List } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TableSize } from "@/types/schema";

interface TableSizesProps {
  tableSizes: TableSize[];
  databaseSize: string;
}

export function TableSizes({ tableSizes, databaseSize }: TableSizesProps) {
  // Calculate total rows
  const totalRows = tableSizes.reduce((sum, t) => sum + t.row_count, 0);

  // Sort by row count (largest first)
  const sortedTables = [...tableSizes].sort((a, b) => b.row_count - a.row_count);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Table Sizes
            </CardTitle>
            <CardDescription>
              Storage usage per table
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              Database: {databaseSize}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <List className="h-4 w-4" />
              {totalRows.toLocaleString()} total rows
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Data Size</TableHead>
                <TableHead className="text-right">Index Size</TableHead>
                <TableHead className="text-right">Total Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTables.map((table) => (
                <TableRow key={table.table_name}>
                  <TableCell className="font-medium">
                    {table.table_name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {table.row_count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {table.data_size}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {table.index_size}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {table.total_size}
                  </TableCell>
                </TableRow>
              ))}
              {sortedTables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No tables found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
