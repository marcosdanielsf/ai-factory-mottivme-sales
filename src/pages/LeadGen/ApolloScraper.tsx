import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, Play, Rocket, AlertCircle, FileText } from 'lucide-react';
import { useApolloLeads } from '../../hooks/leadgen/useApolloLeads';
import { useLeadGenWebhook } from '../../hooks/leadgen/useLeadGenWebhook';
import JobCard from './components/JobCard';
import StatusBadge from './components/StatusBadge';
import ActionButton from './components/ActionButton';

export default function ApolloScraper() {
  const { leads: data, loading, error, refetch: refresh } = useApolloLeads();
  const { triggerWebhook, loading: webhookLoading } = useLeadGenWebhook();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { refresh(); }, []);

  const selected = data?.find(d => d.id === selectedId);

  const filtered = data?.filter(d =>
    !searchQuery ||
    d.apollo_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.status?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  // Agrupar por status
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.status || 'sem_status';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const statusOrder = ['pending', 'running', 'completed', 'error', 'sem_status'];
  const sortedGroups = statusOrder
    .filter(s => grouped[s]?.length > 0)
    .concat(Object.keys(grouped).filter(s => !statusOrder.includes(s)));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default gap-3">
        <div className="flex items-center gap-2">
          <Rocket size={20} className="text-accent-primary" />
          <h1 className="text-xl font-semibold text-text-primary">Apollo Scraper</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por URL ou notas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none w-64"
            />
          </div>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="m-4 p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-accent-error" />
          <span className="text-sm text-accent-error">{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className="w-[350px] border-r border-border-default overflow-y-auto p-3 space-y-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-bg-secondary rounded-lg animate-pulse" />
            ))
          ) : sortedGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText size={32} className="text-text-muted opacity-30 mb-3" />
              <p className="text-sm text-text-muted">Nenhum job encontrado</p>
            </div>
          ) : (
            sortedGroups.map(status => (
              <div key={status}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 mb-1">
                  {status}
                </p>
                <div className="space-y-2">
                  {grouped[status].map(item => (
                    <JobCard
                      key={item.id}
                      title={item.apollo_url || 'Sem URL'}
                      subtitle={item.notes || ''}
                      status={item.status}
                      selected={selectedId === item.id}
                      onClick={() => setSelectedId(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalhe */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">Detalhes do Job</h2>
                <p className="text-xs text-text-muted">ID: {selected.id}</p>
              </div>

              {/* Apollo URL */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Apollo URL</label>
                {selected.apollo_url ? (
                  <a
                    href={selected.apollo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent-primary hover:underline break-all"
                  >
                    {selected.apollo_url}
                    <ExternalLink size={14} className="flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-sm text-text-muted italic">Sem URL</span>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  readOnly
                  value={selected.notes || ''}
                  rows={4}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none"
                />
              </div>

              {/* Number of Results */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Number of Results</label>
                <span className="text-sm text-text-primary">{selected.number_of_results ?? '-'}</span>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Status</label>
                <StatusBadge status={selected.status} />
              </div>

              {/* Error Status */}
              {selected.error_status && (
                <div className="p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg">
                  <p className="text-xs font-bold text-accent-error uppercase mb-1">Error Status</p>
                  <p className="text-sm text-accent-error">{selected.error_status}</p>
                </div>
              )}

              {/* Action */}
              <ActionButton
                label="Get Leads"
                icon={<Play size={16} />}
                loading={webhookLoading}
                onClick={() => triggerWebhook('apollo_leads', selected.id)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Rocket size={48} className="text-text-muted opacity-20 mb-4" />
              <p className="text-text-muted text-sm">Selecione um job para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
