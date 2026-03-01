import { useState, useCallback } from "react";
import {
  Brain,
  Upload,
  FileText,
  Youtube,
  Music,
  Globe,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Link,
  X,
} from "lucide-react";
import {
  useBrainSources,
  type KnowledgeSource,
  type SourceType,
  type ProcessingStatus,
} from "../../hooks/useBrainSources";

// ============================================
// TIPOS
// ============================================

interface IngestFormState {
  title: string;
  sourceType: SourceType;
  url: string;
  author: string;
}

// ============================================
// HELPERS
// ============================================

function detectTypeFromUrl(url: string): SourceType {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be"))
    return "youtube";
  if (lower.endsWith(".pdf")) return "pdf";
  if (
    lower.endsWith(".mp3") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".m4a")
  )
    return "audio";
  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".xls")
  )
    return "spreadsheet";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "transcript";
  if (url.startsWith("http")) return "webpage";
  return "other";
}

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "pdf", label: "PDF" },
  { value: "audio", label: "Áudio" },
  { value: "webpage", label: "Página Web" },
  { value: "transcript", label: "Transcrição" },
  { value: "note", label: "Nota" },
  { value: "spreadsheet", label: "Planilha" },
  { value: "other", label: "Outro" },
];

const TYPE_ICONS: Record<SourceType, React.ReactNode> = {
  youtube: <Youtube size={14} />,
  pdf: <FileText size={14} />,
  audio: <Music size={14} />,
  webpage: <Globe size={14} />,
  transcript: <FileText size={14} />,
  note: <FileText size={14} />,
  spreadsheet: <FileText size={14} />,
  other: <FileText size={14} />,
};

const TYPE_COLORS: Record<SourceType, string> = {
  youtube: "bg-red-500/15 text-red-400 border border-red-500/30",
  pdf: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
  audio: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  webpage: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  transcript: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
  note: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  spreadsheet: "bg-green-500/15 text-green-400 border border-green-500/30",
  other: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
};

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pendente",
    className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
    icon: <Clock size={12} />,
  },
  processing: {
    label: "Processando",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  completed: {
    label: "Concluído",
    className: "bg-green-500/15 text-green-400 border border-green-500/30",
    icon: <CheckCircle size={12} />,
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
    icon: <XCircle size={12} />,
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// SUB-COMPONENTES
// ============================================

function TypeBadge({ type }: { type: SourceType }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}
    >
      {TYPE_ICONS[type]}
      {SOURCE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type}
    </span>
  );
}

function StatusBadge({ status }: { status: ProcessingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ============================================
// SEÇÃO: FORMULÁRIO DE INGESTÃO
// ============================================

interface IngestFormProps {
  onSuccess: () => void;
  createSource: ReturnType<typeof useBrainSources>["createSource"];
}

function IngestForm({ onSuccess, createSource }: IngestFormProps) {
  const [form, setForm] = useState<IngestFormState>({
    title: "",
    sourceType: "webpage",
    url: "",
    author: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleUrlChange = (url: string) => {
    const detected = detectTypeFromUrl(url);
    setForm((prev) => ({ ...prev, url, sourceType: detected }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("Título é obrigatório.");
      return;
    }
    if (!form.url.trim()) {
      setFormError("URL é obrigatória.");
      return;
    }

    setSubmitting(true);
    const { error } = await createSource({
      title: form.title.trim(),
      source_type: form.sourceType,
      source_url: form.url.trim(),
      author: form.author.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    setForm({ title: "", sourceType: "webpage", url: "", author: "" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          URL da Fonte
        </label>
        <div className="relative">
          <Link
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=... ou https://site.com/artigo"
            value={form.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
      </div>

      {/* Título + Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Título <span className="text-accent-error">*</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Aula sobre copywriting persuasivo"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            Tipo
          </label>
          <select
            value={form.sourceType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sourceType: e.target.value as SourceType,
              }))
            }
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
          >
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Autor */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          Autor (opcional)
        </label>
        <input
          type="text"
          placeholder="Ex: Alex Hormozi"
          value={form.author}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, author: e.target.value }))
          }
          className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
        />
      </div>

      {formError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <XCircle size={14} />
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Ingerindo...
          </>
        ) : (
          <>
            <Upload size={16} />
            Ingerir Fonte
          </>
        )}
      </button>
    </form>
  );
}

// ============================================
// SEÇÃO: BUSCA SEMÂNTICA
// ============================================

interface ChunkResult {
  id: string;
  content: string;
  source_title: string;
  similarity: number;
  chunk_index: number;
}

function SearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChunkResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const { supabase } = await import("../../lib/supabase");
      const { data, error } = await supabase.rpc("search_knowledge", {
        query_text: query.trim(),
        match_count: 10,
      });

      if (error) throw new Error(error.message);
      setResults((data as ChunkResult[]) || []);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Erro na busca");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  return (
    <div className="space-y-4">
      {/* Input de busca */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          placeholder="Busca semântica na base de conhecimento..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-20 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={12} />
            </button>
          )}
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-3 py-1 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
          >
            {searching ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Buscar"
            )}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {searchError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <XCircle size={14} />
          {searchError}
        </div>
      )}

      {hasSearched && !searching && !searchError && results.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          Nenhum resultado encontrado para "{query}"
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            {results.length} resultado{results.length !== 1 ? "s" : ""}{" "}
            encontrado
            {results.length !== 1 ? "s" : ""}
          </p>
          {results.map((chunk) => (
            <div
              key={chunk.id}
              className="p-4 bg-bg-tertiary border border-border-default rounded-lg space-y-2 hover:border-accent-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-accent-primary truncate">
                  {chunk.source_title}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-text-muted">
                    chunk #{chunk.chunk_index}
                  </span>
                  <span className="text-xs font-medium text-green-400">
                    {Math.round(chunk.similarity * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
                {chunk.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// SEÇÃO: TABELA DE FONTES
// ============================================

function SourcesTable({
  sources,
  loading,
  onRefresh,
}: {
  sources: KnowledgeSource[];
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted">
        <Loader2 size={24} className="animate-spin mr-3" />
        Carregando fontes...
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <Brain size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">Nenhuma fonte ingerida ainda.</p>
        <p className="text-xs mt-1 opacity-60">
          Use o formulário acima para adicionar conteúdo ao Mega Brain.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide">
              Título
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden md:table-cell">
              Tipo
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide">
              Status
            </th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden lg:table-cell">
              Autor
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden md:table-cell">
              Chunks
            </th>
            <th className="text-right py-2.5 px-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden lg:table-cell">
              Data
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {sources.map((source) => (
            <tr
              key={source.id}
              className="hover:bg-bg-tertiary/50 transition-colors"
            >
              <td className="py-3 px-3">
                <div className="space-y-0.5">
                  <p className="font-medium text-text-primary truncate max-w-[200px] md:max-w-[300px]">
                    {source.title}
                  </p>
                  {source.source_url && (
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-text-muted hover:text-accent-primary transition-colors truncate block max-w-[200px]"
                    >
                      {source.source_url}
                    </a>
                  )}
                  {source.error_message && (
                    <p className="text-xs text-red-400 truncate max-w-[200px]">
                      {source.error_message}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-3 px-3 hidden md:table-cell">
                <TypeBadge type={source.source_type} />
              </td>
              <td className="py-3 px-3">
                <StatusBadge status={source.processing_status} />
              </td>
              <td className="py-3 px-3 hidden lg:table-cell text-text-secondary text-xs">
                {source.author || "—"}
              </td>
              <td className="py-3 px-3 hidden md:table-cell text-right text-text-secondary text-xs">
                {source.total_chunks > 0 ? source.total_chunks : "—"}
              </td>
              <td className="py-3 px-3 hidden lg:table-cell text-right text-text-muted text-xs whitespace-nowrap">
                {formatDate(source.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export function BrainIngest() {
  const { sources, loading, error, fetchSources, createSource } =
    useBrainSources();

  const hasProcessing = sources.some(
    (s) =>
      s.processing_status === "processing" || s.processing_status === "pending",
  );

  const stats = {
    total: sources.length,
    completed: sources.filter((s) => s.processing_status === "completed")
      .length,
    processing: sources.filter(
      (s) =>
        s.processing_status === "processing" ||
        s.processing_status === "pending",
    ).length,
    totalChunks: sources.reduce((acc, s) => acc + (s.total_chunks || 0), 0),
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-primary/10 rounded-lg">
            <Brain size={24} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Mega Brain — Ingestão
            </h1>
            <p className="text-sm text-text-muted">
              Adicione fontes de conhecimento para o sistema de IA
            </p>
          </div>
        </div>

        {hasProcessing && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs">
            <Loader2 size={12} className="animate-spin" />
            Processando ({stats.processing} fonte
            {stats.processing !== 1 ? "s" : ""})
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total de Fontes",
            value: stats.total,
            color: "text-text-primary",
          },
          {
            label: "Concluídas",
            value: stats.completed,
            color: "text-green-400",
          },
          {
            label: "Em Fila",
            value: stats.processing,
            color: "text-blue-400",
          },
          {
            label: "Total de Chunks",
            value: stats.totalChunks,
            color: "text-accent-primary",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-bg-secondary border border-border-default rounded-lg"
          >
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de ingestão */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-accent-primary" />
            <h2 className="font-semibold text-text-primary">Nova Fonte</h2>
          </div>
          <IngestForm onSuccess={fetchSources} createSource={createSource} />
        </div>

        {/* Busca semântica */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-accent-primary" />
            <h2 className="font-semibold text-text-primary">Busca Semântica</h2>
          </div>
          <SearchSection />
        </div>
      </div>

      {/* Tabela de fontes */}
      <div className="bg-bg-secondary border border-border-default rounded-xl">
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-accent-primary" />
            <h2 className="font-semibold text-text-primary">
              Fontes Cadastradas
            </h2>
            {sources.length > 0 && (
              <span className="px-2 py-0.5 bg-bg-tertiary rounded-full text-xs text-text-muted">
                {sources.length}
              </span>
            )}
          </div>
          <button
            onClick={fetchSources}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="m-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <XCircle size={14} />
            {error}
          </div>
        )}

        <div className="p-2">
          <SourcesTable
            sources={sources}
            loading={loading}
            onRefresh={fetchSources}
          />
        </div>
      </div>
    </div>
  );
}
