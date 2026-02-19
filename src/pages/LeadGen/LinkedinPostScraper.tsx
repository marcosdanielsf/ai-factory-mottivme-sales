import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw, Play, Linkedin, AlertCircle, FileText, Plus } from 'lucide-react';
import { useLinkedinLeads } from '../../hooks/leadgen/useLinkedinLeads';
import { useLeadGenWebhook } from '../../hooks/leadgen/useLeadGenWebhook';
import JobCard from './components/JobCard';
import StatusBadge from './components/StatusBadge';
import ActionButton from './components/ActionButton';

export default function LinkedinPostScraper() {
  const { leads: data, loading, error, refetch: refresh, createJob } = useLinkedinLeads();
  const { triggerWebhook, loading: webhookLoading } = useLeadGenWebhook();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    post_url: '', user_name: '', notes: '',
    get_reactions: true, get_comments: true, limit_results: '',
  });

  useEffect(() => { refresh(); }, []);

  const selected = data?.find(d => d.id === selectedId);

  const filtered = data?.filter(d =>
    !searchQuery ||
    d.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.user_name || 'Sem usuario';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleCreate = async () => {
    if (!form.post_url.trim()) return;
    try {
      setCreating(true);
      const job = await createJob({
        post_url: form.post_url.trim(),
        user_name: form.user_name.trim() || undefined,
        notes: form.notes.trim() || undefined,
        get_reactions: form.get_reactions,
        get_comments: form.get_comments,
        limit_results: form.limit_results ? parseInt(form.limit_results) : undefined,
      });
      setForm({ post_url: '', user_name: '', notes: '', get_reactions: true, get_comments: true, limit_results: '' });
      setShowCreate(false);
      if (job?.id) setSelectedId(job.id);
    } catch (err) {
      console.error('Error creating job:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default gap-3">
        <div className="flex items-center gap-2">
          <Linkedin size={20} className="text-accent-primary" />
          <h1 className="text-xl font-semibold text-text-primary">LinkedIn Post Scraper</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por usuario ou notas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none w-64"
            />
          </div>
          <button
            onClick={() => { setShowCreate(true); setSelectedId(null); }}
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
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
              <div key={i} className="h-20 bg-bg-secondary rounded-lg animate-pulse" />
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
            Object.entries(grouped).map(([userName, items]) => (
              <div key={userName}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1 mb-1">
                  {userName}
                </p>
                <div className="space-y-2">
                  {items.map(item => (
                    <JobCard
                      key={item.id}
                      title={item.post_url || 'Post sem URL'}
                      subtitle={item.notes || ''}
                      status={item.status}
                      isSelected={selectedId === item.id}
                      onClick={() => { setSelectedId(item.id); setShowCreate(false); }}
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
              <h2 className="text-lg font-semibold text-text-primary">Novo Job — LinkedIn Post</h2>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Post URL *</label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                  value={form.post_url}
                  onChange={e => setForm(f => ({ ...f, post_url: e.target.value }))}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">User Name</label>
                <input
                  type="text"
                  placeholder="Nome do autor do post"
                  value={form.user_name}
                  onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.get_reactions}
                    onChange={e => setForm(f => ({ ...f, get_reactions: e.target.checked }))}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  <span className="text-sm text-text-primary">Get Reactions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.get_comments}
                    onChange={e => setForm(f => ({ ...f, get_comments: e.target.checked }))}
                    className="w-4 h-4 accent-accent-primary"
                  />
                  <span className="text-sm text-text-primary">Get Comments</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Limit Results</label>
                <input
                  type="number"
                  placeholder="100"
                  value={form.limit_results}
                  onChange={e => setForm(f => ({ ...f, limit_results: e.target.value }))}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  placeholder="Descricao do scrape..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted resize-none focus:border-accent-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={!form.post_url.trim() || creating}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {creating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
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
                <h2 className="text-lg font-semibold text-text-primary mb-1">Detalhes do Job</h2>
                <p className="text-xs text-text-muted">ID: {selected.id}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Post URL</label>
                {selected.post_url ? (
                  <a
                    href={selected.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent-primary hover:underline break-all"
                  >
                    {selected.post_url}
                    <ExternalLink size={14} className="flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-sm text-text-muted italic">Sem URL</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  readOnly
                  value={selected.notes || ''}
                  rows={4}
                  className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-default">
                  <input type="checkbox" readOnly checked={selected.get_reactions ?? false} className="w-4 h-4 accent-accent-primary" />
                  <span className="text-sm text-text-primary">Get Reactions</span>
                </label>
                <label className="flex items-center gap-2 cursor-default">
                  <input type="checkbox" readOnly checked={selected.get_comments ?? false} className="w-4 h-4 accent-accent-primary" />
                  <span className="text-sm text-text-primary">Get Comments</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Status</label>
                  <StatusBadge status={selected.status} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Limit</label>
                  <span className="text-sm text-text-primary">{selected.limit_results ?? '-'}</span>
                </div>
              </div>

              {selected.error_status && (
                <div className="p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg">
                  <p className="text-xs font-bold text-accent-error uppercase mb-1">Error Status</p>
                  <p className="text-sm text-accent-error">{selected.error_status}</p>
                </div>
              )}

              <ActionButton
                label="Get Leads"
                icon={<Play size={16} />}
                loading={webhookLoading}
                onClick={() => triggerWebhook('linkedin_leads', selected.id)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Linkedin size={48} className="text-text-muted opacity-20 mb-4" />
              <p className="text-text-muted text-sm">Selecione um job ou crie um novo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
