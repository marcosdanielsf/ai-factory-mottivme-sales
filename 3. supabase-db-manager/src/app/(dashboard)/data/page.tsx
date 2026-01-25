"use client";

import { useState } from "react";
import { Table2, Database, Sparkles } from "lucide-react";
import { Toaster } from "sonner";
import { TableSelector } from "@/components/data/table-selector";
import { DataGrid } from "@/components/data/data-grid";

export default function DataEditorPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#fafafa",
          },
        }}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
                <Table2 className="h-5 w-5 text-emerald-500" />
              </div>
              Data Editor
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              View, edit, and manage your database records with an Airtable-like
              experience
            </p>
          </div>
        </div>

        {/* Table Selector */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50">
          <TableSelector
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
          />

          {selectedTable && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Double-click cells to edit</span>
            </div>
          )}
        </div>

        {/* Data Grid or Empty State */}
        {selectedTable ? (
          <DataGrid tableName={selectedTable} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl" />
              <div className="relative p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <Database className="h-12 w-12 text-emerald-500/70" />
              </div>
            </div>
            <h2 className="text-xl font-medium mb-2">No Table Selected</h2>
            <p className="text-zinc-500 max-w-md">
              Select a table from the dropdown above to view and edit its data.
              You can filter, sort, add, update, and delete records.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-6 max-w-2xl">
              <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 text-left">
                <div className="text-emerald-500 font-medium mb-1">
                  Inline Editing
                </div>
                <p className="text-xs text-zinc-500">
                  Double-click any cell to edit values directly
                </p>
              </div>
              <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 text-left">
                <div className="text-emerald-500 font-medium mb-1">
                  Advanced Filters
                </div>
                <p className="text-xs text-zinc-500">
                  Filter data with multiple conditions
                </p>
              </div>
              <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 text-left">
                <div className="text-emerald-500 font-medium mb-1">
                  Export Data
                </div>
                <p className="text-xs text-zinc-500">
                  Export your data as CSV or JSON
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
