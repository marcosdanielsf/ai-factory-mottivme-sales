import { useState, useCallback } from "react";
import { Download, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type {
  Field,
  Submission,
  FieldValue,
} from "../../../lib/formflow/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatValue(value: FieldValue): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join(", ") || "—";
  return String(value) || "—";
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function exportCsv(fields: Field[], submissions: Submission[]): void {
  const headers = [
    ...fields.map((f) => `"${f.title.replace(/"/g, '""')}"`),
    '"Data"',
    '"Duração"',
  ];

  const rows = submissions.map((sub) => {
    const cells = fields.map((f) => {
      const val = formatValue(sub.answers[f.id]);
      return `"${val.replace(/"/g, '""')}"`;
    });
    cells.push(`"${formatDate(sub.completed_at)}"`);
    cells.push(`"${formatDuration(sub.metadata?.duration_seconds)}"`);
    return cells.join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `respostas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResponseTableProps {
  fields: Field[];
  submissions: Submission[];
}

const PAGE_SIZE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResponseTable({ fields, submissions }: ResponseTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(submissions.length / PAGE_SIZE);
  const pageSubmissions = submissions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const handleExport = useCallback(() => {
    exportCsv(fields, submissions);
  }, [fields, submissions]);

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center mb-4">
          <Inbox size={24} className="text-text-muted" />
        </div>
        <p className="text-base font-medium text-text-primary mb-1">
          Nenhuma resposta ainda
        </p>
        <p className="text-sm text-text-muted">
          As respostas aparecerão aqui assim que alguém preencher o formulário.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {submissions.length} resposta{submissions.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted border border-border-primary hover:text-text-primary hover:border-border-primary/80 hover:bg-surface-secondary transition-colors"
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border-primary">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-primary bg-surface-secondary">
              {fields.map((f) => (
                <th
                  key={f.id}
                  className="px-3 py-2.5 text-left text-xs font-medium text-text-muted whitespace-nowrap max-w-[180px] truncate"
                  title={f.title}
                >
                  {f.title}
                </th>
              ))}
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted whitespace-nowrap">
                Data
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-text-muted whitespace-nowrap">
                Duração
              </th>
            </tr>
          </thead>
          <tbody>
            {pageSubmissions.map((sub, idx) => (
              <tr
                key={sub.id}
                className={`border-b border-border-primary last:border-0 ${
                  idx % 2 === 0
                    ? "bg-surface-primary"
                    : "bg-surface-secondary/40"
                }`}
              >
                {fields.map((f) => (
                  <td
                    key={f.id}
                    className="px-3 py-2.5 text-text-primary max-w-[200px] truncate"
                    title={formatValue(sub.answers[f.id])}
                  >
                    {formatValue(sub.answers[f.id])}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-text-muted whitespace-nowrap">
                  {formatDate(sub.completed_at)}
                </td>
                <td className="px-3 py-2.5 text-text-muted whitespace-nowrap">
                  {formatDuration(sub.metadata?.duration_seconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-text-muted">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                totalPages <= 5
                  ? i
                  : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    pageNum === page
                      ? "bg-brand-primary text-white"
                      : "text-text-muted hover:text-text-primary hover:bg-surface-secondary"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
