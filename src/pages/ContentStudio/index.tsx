import { useState, useMemo, useCallback } from 'react';
import {
  Palette, Plus, Search, Filter, ArrowLeft,
  FileText, Video, Mail, Megaphone, LayoutGrid, Calendar as CalendarIcon, List
} from 'lucide-react';
import { useContentCampaigns, type CreateCampaignInput } from '../../hooks/useContentCampaigns';
import { useContentPieces } from '../../hooks/useContentPieces';
import { CampaignForm } from './components/CampaignForm';
import { CampaignCard } from './components/CampaignCard';
import { ContentReviewCard } from './components/ContentReviewCard';
import { ContentCalendar } from './components/ContentCalendar';

type Tab = 'campaigns' | 'create' | 'review' | 'calendar';
type ContentFilter = 'all' | 'post' | 'reel' | 'email' | 'ad' | 'story' | 'carousel';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published';

function CampaignSkeleton() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-4 w-20 bg-bg-tertiary rounded" />
      <div className="h-4 w-40 bg-bg-tertiary rounded" />
      <div className="h-3 w-32 bg-bg-tertiary rounded" />
      <div className="h-1.5 bg-bg-tertiary rounded-full" />
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-border-default flex gap-2">
        <div className="h-5 w-12 bg-bg-tertiary rounded-full" />
        <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
      </div>
      <div className="p-4 space-y-2">
        <div className="h-4 w-full bg-bg-tertiary rounded" />
        <div className="h-4 w-3/4 bg-bg-tertiary rounded" />
        <div className="h-4 w-1/2 bg-bg-tertiary rounded" />
      </div>
    </div>
  );
}

const TYPE_FILTERS: { value: ContentFilter; label: string; icon: typeof FileText }[] = [
  { value: 'all', label: 'Todos', icon: LayoutGrid },
  { value: 'post', label: 'Posts', icon: FileText },
  { value: 'reel', label: 'Reels', icon: Video },
  { value: 'email', label: 'Emails', icon: Mail },
  { value: 'ad', label: 'Ads', icon: Megaphone },
];

export function ContentStudio() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ContentFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { campaigns, loading: campaignsLoading, createCampaign } = useContentCampaigns();

  const { pieces, loading: piecesLoading, approvePiece, rejectPiece, schedulePiece, updatePiece } = useContentPieces({
    campaign_id: selectedCampaignId || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    approval_status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const filteredPieces = useMemo(() => {
    if (!search.trim()) return pieces;
    const q = search.toLowerCase();
    return pieces.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      (p.hook || '').toLowerCase().includes(q)
    );
  }, [pieces, search]);

  const stats = useMemo(() => ({
    total: pieces.length,
    pending: pieces.filter(p => p.approval_status === 'pending').length,
    approved: pieces.filter(p => p.approval_status === 'approved').length,
    published: pieces.filter(p => p.approval_status === 'published').length,
  }), [pieces]);

  const handleCreateCampaign = useCallback(async (input: CreateCampaignInput) => {
    setSubmitting(true);
    const campaign = await createCampaign(input);
    setSubmitting(false);
    if (campaign) {
      setSelectedCampaignId(campaign.id);
      setTab('review');
    }
  }, [createCampaign]);

  const handleCampaignClick = useCallback((id: string) => {
    setSelectedCampaignId(id);
    setTab('review');
  }, []);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            {(tab === 'review' || tab === 'calendar') && selectedCampaignId && (
              <button
                onClick={() => { setSelectedCampaignId(null); setTab('campaigns'); }}
                className="p-1 rounded-md hover:bg-bg-hover text-text-muted"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Palette className="w-6 h-6 text-accent-primary" />
            <h1 className="text-xl font-semibold text-text-primary">Content Studio</h1>
          </div>
          <p className="text-sm text-text-muted mt-0.5">
            {tab === 'campaigns' && `${campaigns.length} campanha${campaigns.length !== 1 ? 's' : ''}`}
            {tab === 'create' && 'Nova campanha de conteudo'}
            {tab === 'review' && selectedCampaign && `${selectedCampaign.name} — ${stats.total} pecas`}
            {tab === 'calendar' && 'Calendario de publicacoes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'campaigns' && (
            <button
              onClick={() => setTab('create')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" /> Nova Campanha
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border-default">
        <button
          onClick={() => { setTab('campaigns'); setSelectedCampaignId(null); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'campaigns'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Campanhas
          </span>
        </button>
        <button
          onClick={() => setTab('create')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'create'
              ? 'border-accent-primary text-accent-primary'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Criar
          </span>
        </button>
        {selectedCampaignId && (
          <>
            <button
              onClick={() => setTab('review')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'review'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="flex items-center gap-2">
                <List className="w-4 h-4" /> Revisar
                {stats.pending > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded-full">
                    {stats.pending}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setTab('calendar')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'calendar'
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" /> Calendario
              </span>
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      {tab === 'campaigns' && (
        <div>
          {campaignsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <CampaignSkeleton key={i} />)}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <Palette className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">Nenhuma campanha ainda</p>
              <button
                onClick={() => setTab('create')}
                className="mt-3 text-sm text-accent-primary hover:underline"
              >
                Criar primeira campanha
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {campaigns.map(c => (
                <CampaignCard key={c.id} campaign={c} onClick={handleCampaignClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="max-w-2xl">
          <CampaignForm onSubmit={handleCreateCampaign} submitting={submitting} />
        </div>
      )}

      {tab === 'review' && selectedCampaignId && (
        <div className="space-y-4">
          {/* Filters bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conteudo..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1">
              {TYPE_FILTERS.map(f => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    onClick={() => setTypeFilter(f.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
                      typeFilter === f.value
                        ? 'bg-accent-primary/20 text-accent-primary'
                        : 'bg-bg-secondary text-text-muted hover:bg-bg-hover'
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {f.label}
                  </button>
                );
              })}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 ml-auto">
              <Filter className="w-3.5 h-3.5 text-text-muted" />
              {(['all', 'pending', 'approved', 'scheduled', 'published'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    statusFilter === s
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'bg-bg-secondary text-text-muted hover:bg-bg-hover'
                  }`}
                >
                  {s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === 'pending' && stats.pending > 0 && ` (${stats.pending})`}
                </button>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <span>{stats.total} total</span>
            <span className="text-yellow-400">{stats.pending} pendentes</span>
            <span className="text-green-400">{stats.approved} aprovados</span>
            <span className="text-emerald-400">{stats.published} publicados</span>
          </div>

          {/* Content grid */}
          {piecesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <ContentSkeleton key={i} />)}
            </div>
          ) : filteredPieces.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted text-sm">
                {pieces.length === 0
                  ? 'Nenhum conteudo gerado ainda para esta campanha'
                  : 'Nenhum resultado para os filtros selecionados'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPieces.map(piece => (
                <ContentReviewCard
                  key={piece.id}
                  piece={piece}
                  onApprove={approvePiece}
                  onReject={rejectPiece}
                  onSchedule={schedulePiece}
                  onEdit={updatePiece}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'calendar' && (
        <ContentCalendar pieces={pieces} loading={piecesLoading} />
      )}
    </div>
  );
}
