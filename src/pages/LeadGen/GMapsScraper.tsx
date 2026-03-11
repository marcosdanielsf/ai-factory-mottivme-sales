import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Play,
  MapPin,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";
import { useGMapsLeads } from "../../hooks/leadgen/useGMapsLeads";
import { useLeadGenWebhook } from "../../hooks/leadgen/useLeadGenWebhook";
import JobCard from "./components/JobCard";
import StatusBadge from "./components/StatusBadge";
import ActionButton from "./components/ActionButton";

export default function GMapsScraper() {
  const {
    leads: data,
    loading,
    error,
    refetch: refresh,
    createJob,
  } = useGMapsLeads();
  const { triggerWebhook, loading: webhookLoading } = useLeadGenWebhook();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    gmaps_query: "",
    maximum_results: "",
    notes: "",
  });

  useEffect(() => {
    refresh();
  }, []);

  const selected = data?.find((d) => d.id === selectedId);

  const filtered =
    data?.filter(
      (d) =>
        !searchQuery ||
        d.gmaps_query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  const grouped = filtered.reduce<Record<string, typeof filtered>>(
    (acc, item) => {
      const key = item.gmaps_query || "Sem query";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  const handleCreate = async () => {
    if (!form.gmaps_query.trim()) return;
    try {
      setCreating(true);
      const job = await createJob({
        gmaps_query: form.gmaps_query.trim(),
        maximum_results: form.maximum_results
          ? parseInt(form.maximum_results)
          : undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm({ gmaps_query: "", maximum_results: "", notes: "" });
      setShowCreate(false);
      if (job?.id) setSelectedId(job.id);
    } catch (err) {
      console.error("Error creating job:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-accent-primary" />
          <h1 className="text-xl font-semibold text-text-primary">
            Google Maps Scraper
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por query ou notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none w-64"
            />
          </div>
          <button
            onClick={() => {
              setShowCreate(true);
              setSelectedId(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-all"
          >
            <Plus size={16} />
            Novo Job
          </button>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="m-4 p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-accent-error" />
          <span className="text-sm text-accent-error">{error}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className="w-[350px] border-r border-border-default overflow-y-auto p-3 space-y-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-bg-secondary rounded-lg animate-pulse"
              />
            ))
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={32} className="text-text-muted opacity-30 mb-3" />
              <p className="text-sm text-text-muted">Nenhum job encontrado</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-accent-primary hover:underline"
              >
                Criar primeiro job
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([query, items]) => (
              <div key={query}>
                <p
                  className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 mb-1 truncate"
                  title={query}
                >
                  {query}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <JobCard
                      key={item.id}
                      title={item.gmaps_query || "Sem query"}
                      subtitle={
                        item.notes ||
                        `Max: ${item.maximum_results ?? "-"} resultados`
                      }
                      status={item.status}
                      isSelected={selectedId === item.id}
                      onClick={() => {
                        setSelectedId(item.id);
                        setShowCreate(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalhe / Criar */}
        <div className="flex-1 overflow-y-auto p-6">
          {showCreate ? (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-lg font-semibold text-text-primary">
                Novo Job — Google Maps
              </h2>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  GMaps Query *
                </label>
                <input
                  type="text"
                  placeholder="dentista em Sao Paulo"
                  value={form.gmaps_query}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gmaps_query: e.target.value }))
                  }
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  Maximum Results
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.maximum_results}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maximum_results: e.target.value }))
                  }
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Descricao do scrape..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted resize-none focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={!form.gmaps_query.trim() || creating}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {creating ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Criar Job
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-muted hover:text-text-primary transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : selected ? (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Detalhes do Job
                </h2>
                <p className="text-xs text-text-muted">ID: {selected.id}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  GMaps Query
                </label>
                <p className="text-sm text-text-primary bg-bg-secondary border border-border-default rounded-lg px-3 py-2">
                  {selected.gmaps_query || "-"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  Maximum Results
                </label>
                <span className="text-sm text-text-primary">
                  {selected.maximum_results ?? "-"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  readOnly
                  value={selected.notes || ""}
                  rows={4}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                  Status
                </label>
                <StatusBadge status={selected.status} />
              </div>

              {selected.error_status && (
                <div className="p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg">
                  <p className="text-xs font-bold text-accent-error uppercase mb-1">
                    Error
                  </p>
                  <p className="text-sm text-accent-error">
                    {selected.error_status}
                  </p>
                </div>
              )}

              <ActionButton
                label="Get Leads"
                icon={<Play size={16} />}
                loading={webhookLoading}
                onClick={() =>
                  triggerWebhook("gmaps_leads", { recordId: selected.id })
                }
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MapPin size={48} className="text-text-muted opacity-20 mb-4" />
              <p className="text-text-muted text-sm">
                Selecione um job ou crie um novo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
