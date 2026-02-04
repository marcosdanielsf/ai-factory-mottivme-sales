"use client";

import { useState } from "react";
import { TableList } from "@/components/schema/table-list";
import { ColumnViewer } from "@/components/schema/column-viewer";
import { Database } from "lucide-react";
import type { TableInfo } from "@/types/schema";

export default function SchemaPage() {
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Tables Sidebar */}
      <div className="w-72 shrink-0 border rounded-lg overflow-hidden bg-card">
        <TableList
          onSelectTable={setSelectedTable}
          selectedTable={selectedTable?.table_name}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {selectedTable ? (
          <ColumnViewer tableName={selectedTable.table_name} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a table</p>
              <p className="text-sm mt-1">
                Choose a table from the sidebar to view its schema
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
