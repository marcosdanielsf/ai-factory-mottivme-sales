import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Eye,
  ThumbsUp,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Film,
  Layers,
} from 'lucide-react';
import {
  useContentIdeas,
  type ContentIdea,
  type IdeaPlatform,
  type IdeaSource,
} from '../../hooks/useContentIdeas';
import {
  useContentVideos,
  type ContentVideo,
  type VideoStatus,
} from '../../hooks/useContentVideos';

// ============================================
// TYPES
// ============================================

type ActiveTab = 'ideas' | 'videos';

// ============================================
// HELPERS
// ============================================

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// ============================================
// BADGE COMPONENTS
// ============================================

function PlatformBadge({ platform }: { platform: IdeaPlatform | undefined }) {
  if (!platform) return null;
  const map: Record<IdeaPlatform, { label: string; className: string }> = {
    youtube: { label: 'YouTube', className: 'bg-orange-500/20 text-orange-400' },
    instagram: { label: 'Instagram', className: 'bg-pink-500/20 text-pink-400' },
    tiktok: { label: 'TikTok', className: 'bg-zinc-500/20 text-zinc-300' },
  };
  const { label, className } = map[platform];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}

function SourceBadge({ source }: { source: IdeaSource | undefined }) {
  if (!source) return null;
  const map: Record<IdeaSource, { label: string; className: string }> = {
    channel_monitoring: { label: 'Channel Monitoring', className: 'bg-blue-500/20 text-blue-400' },
    trending_videos: { label: 'Trending', className: 'bg-cyan-500/20 text-cyan-400' },
    similar_video: { label: 'Similar', className: 'bg-teal-500/20 text-teal-400' },
  };
  const { label, className } = map[source];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}

const VIDEO_STATUS_CONFIG: Record<VideoStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-yellow-500/20 text-yellow-400' },
  generate: { label: 'Generate', className: 'bg-orange-500/20 text-orange-400' },
  in_progress: { label: 'In Progress', className: 'bg-pink-500/20 text-pink-400' },
  ready: { label: 'Ready', className: 'bg-green-500/20 text-green-400' },
  error: { label: 'Error', className: 'bg-red-500/20 text-red-400' },
  not_required: { label: 'N/A', className: 'bg-zinc-500/20 text-zinc-400' },
};

function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const { label, className } = VIDEO_STATUS_CONFIG[status] ?? VIDEO_STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
}

// ============================================
// SKELETONS
// ============================================

function IdeaRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default animate-pulse">
      <div className="w-5 h-5 rounded bg-bg-tertiary flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-56 bg-bg-tertiary rounded" />
        <div className="h-3 w-32 bg-bg-tertiary rounded" />
      </div>
      <div className="h-5 w-16 bg-bg-tertiary rounded-full" />
      <div className="h-5 w-20 bg-bg-tertiary rounded-full" />
      <div className="h-3 w-12 bg-bg-tertiary rounded" />
      <div className="h-3 w-12 bg-bg-tertiary rounded" />
      <div className="h-3 w-12 bg-bg-tertiary rounded" />
      <div className="h-3 w-20 bg-bg-tertiary rounded" />
    </div>
  );
}

function VideoCardSkeleton() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3 animate-pulse">
      <div className="h-4 w-24 bg-bg-tertiary rounded-full" />
      <div className="h-4 w-full bg-bg-tertiary rounded" />
      <div className="h-3 w-3/4 bg-bg-tertiary rounded" />
      <div className="h-3 w-1/2 bg-bg-tertiary rounded" />
    </div>
  );
}

// ============================================
// ERROR BANNER
// ============================================

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  );
}

// ============================================
// STATS CARDS
// ============================================

interface StatsCardsProps {
  totalIdeas: number;
  shortlisted: number;
  videosDraft: number;
  videosReady: number;
  loadingIdeas: boolean;
  loadingVideos: boolean;
}

function StatsCards({
  totalIdeas,
  shortlisted,
  videosDraft,
  videosReady,
  loadingIdeas,
  loadingVideos,
}: StatsCardsProps) {
  const cards = [
    { label: 'Total Ideas', value: totalIdeas, loading: loadingIdeas, color: 'text-accent-primary' },
    { label: 'Shortlisted', value: shortlisted, loading: loadingIdeas, color: 'text-yellow-400' },
    { label: 'Videos Draft', value: videosDraft, loading: loadingVideos, color: 'text-orange-400' },
    { label: 'Videos Ready', value: videosReady, loading: loadingVideos, color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-bg-secondary border border-border-default rounded-lg p-3"
        >
          <p className="text-xs text-text-muted mb-1">{card.label}</p>
          {card.loading ? (
            <div className="h-6 w-10 bg-bg-tertiary rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// IDEA MODAL
// ============================================

interface IdeaModalProps {
  onClose: () => void;
  onSubmit: (data: {
    video_title: string;
    channel_name?: string;
    platform?: IdeaPlatform;
    source?: IdeaSource;
    video_url?: string;
    views?: number;
    likes?: number;
    comments?: number;
  }) => Promise<void>;
}

function IdeaModal({ onClose, onSubmit }: IdeaModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    video_title: '',
    channel_name: '',
    platform: '' as IdeaPlatform | '',
    source: '' as IdeaSource | '',
    video_url: '',
    views: '',
    likes: '',
    comments: '',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.video_title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        video_title: form.video_title.trim(),
        channel_name: form.channel_name || undefined,
        platform: (form.platform as IdeaPlatform) || undefined,
        source: (form.source as IdeaSource) || undefined,
        video_url: form.video_url || undefined,
        views: form.views ? Number(form.views) : undefined,
        likes: form.likes ? Number(form.likes) : undefined,
        comments: form.comments ? Number(form.comments) : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar idea');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="text-sm font-semibold text-text-primary">Nova Idea</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <ErrorBanner message={error} />}

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Titulo do Video *</label>
            <input
              type="text"
              required
              value={form.video_title}
              onChange={(e) => set('video_title', e.target.value)}
              placeholder="Ex: Como escalar vendas com IA em 2025"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Canal</label>
            <input
              type="text"
              value={form.channel_name}
              onChange={(e) => set('channel_name', e.target.value)}
              placeholder="Ex: MrBeast"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Plataforma</label>
              <select
                value={form.platform}
                onChange={(e) => set('platform', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="">Selecionar...</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Fonte</label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="">Selecionar...</option>
                <option value="channel_monitoring">Channel Monitoring</option>
                <option value="trending_videos">Trending</option>
                <option value="similar_video">Similar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">URL do Video</label>
            <input
              type="url"
              value={form.video_url}
              onChange={(e) => set('video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['views', 'likes', 'comments'] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs text-text-muted mb-1.5 capitalize">{field}</label>
                <input
                  type="number"
                  min="0"
                  value={form[field]}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.video_title.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Criar Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// VIDEO MODAL
// ============================================

interface VideoModalProps {
  onClose: () => void;
  onSubmit: (data: {
    idea?: string;
    title_chosen?: string;
    search_term?: string;
  }) => Promise<void>;
}

function VideoModal({ onClose, onSubmit }: VideoModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ idea: '', title_chosen: '', search_term: '' });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        idea: form.idea || undefined,
        title_chosen: form.title_chosen || undefined,
        search_term: form.search_term || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar video');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="text-sm font-semibold text-text-primary">Novo Video</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <ErrorBanner message={error} />}

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Idea / Conceito</label>
            <textarea
              value={form.idea}
              onChange={(e) => set('idea', e.target.value)}
              rows={3}
              placeholder="Descreva a ideia base para o video..."
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Titulo Escolhido</label>
            <input
              type="text"
              value={form.title_chosen}
              onChange={(e) => set('title_chosen', e.target.value)}
              placeholder="Titulo final do video"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Termo de Busca</label>
            <input
              type="text"
              value={form.search_term}
              onChange={(e) => set('search_term', e.target.value)}
              placeholder="Palavra-chave para pesquisa de referencias"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Criar Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// IDEA ROW
// ============================================

interface IdeaRowProps {
  idea: ContentIdea;
  onToggleShortlist: (id: string, current: boolean) => void;
}

function IdeaRow({ idea, onToggleShortlist }: IdeaRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = !!(idea.transcript || idea.script_summary || idea.video_description);

  return (
    <>
      <tr
        className={`border-b border-border-default hover:bg-bg-hover/50 transition-colors ${
          expanded ? 'bg-bg-hover/30' : ''
        }`}
      >
        {/* Shortlist toggle */}
        <td className="px-4 py-3 w-10">
          <button
            onClick={() => onToggleShortlist(idea.id, idea.shortlist)}
            className={`transition-colors ${idea.shortlist ? 'text-yellow-400' : 'text-text-muted hover:text-yellow-400'}`}
            title={idea.shortlist ? 'Remover do shortlist' : 'Adicionar ao shortlist'}
          >
            <Star
              className="w-4 h-4"
              fill={idea.shortlist ? 'currentColor' : 'none'}
            />
          </button>
        </td>

        {/* Title + channel */}
        <td className="px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-text-primary font-medium line-clamp-1">
              {idea.video_title}
            </span>
            {idea.channel_name && (
              <span className="text-xs text-text-muted">{idea.channel_name}</span>
            )}
          </div>
        </td>

        {/* Platform */}
        <td className="px-4 py-3 whitespace-nowrap">
          <PlatformBadge platform={idea.platform} />
        </td>

        {/* Source */}
        <td className="px-4 py-3 whitespace-nowrap">
          <SourceBadge source={idea.source} />
        </td>

        {/* Metrics */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(idea.views ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {formatNumber(idea.likes ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {formatNumber(idea.comments ?? 0)}
            </span>
          </div>
        </td>

        {/* Date */}
        <td className="px-4 py-3 whitespace-nowrap text-xs text-text-muted">
          {formatDate(idea.created_at)}
        </td>

        {/* Expand */}
        <td className="px-4 py-3 w-10">
          {hasExpandable && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </td>
      </tr>

      {/* Expanded row */}
      {expanded && hasExpandable && (
        <tr className="border-b border-border-default bg-bg-primary/50">
          <td colSpan={7} className="px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {idea.transcript && (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Transcript
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-6">
                    {idea.transcript}
                  </p>
                </div>
              )}
              {idea.script_summary && (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Script Summary
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-6">
                    {idea.script_summary}
                  </p>
                </div>
              )}
              {idea.video_description && (
                <div>
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Descricao
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-6">
                    {idea.video_description}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================
// IDEAS TAB
// ============================================

interface IdeasTabProps {
  onNewIdea: () => void;
}

function IdeasTab({ onNewIdea }: IdeasTabProps) {
  const [platform, setPlatform] = useState<IdeaPlatform | undefined>(undefined);
  const [source, setSource] = useState<IdeaSource | undefined>(undefined);
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { ideas, loading, error, toggleShortlist } = useContentIdeas({
    platform,
    source,
    shortlistOnly,
    search: debouncedSearch,
  });

  const PLATFORMS: { value: IdeaPlatform | undefined; label: string }[] = [
    { value: undefined, label: 'Todos' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
  ];

  const SOURCES: { value: IdeaSource | undefined; label: string }[] = [
    { value: undefined, label: 'Todas' },
    { value: 'channel_monitoring', label: 'Channel Monitoring' },
    { value: 'trending_videos', label: 'Trending' },
    { value: 'similar_video', label: 'Similar' },
  ];

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por titulo, canal ou tags..."
            className="pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary w-64"
          />
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={String(p.value)}
              onClick={() => setPlatform(p.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                platform === p.value
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex items-center gap-1">
          {SOURCES.map((s) => (
            <button
              key={String(s.value)}
              onClick={() => setSource(s.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                source === s.value
                  ? 'bg-accent-primary/20 text-accent-primary'
                  : 'bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Shortlist toggle */}
        <button
          onClick={() => setShortlistOnly(!shortlistOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
            shortlistOnly
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary'
          }`}
        >
          <Star className="w-3.5 h-3.5" fill={shortlistOnly ? 'currentColor' : 'none'} />
          Shortlist
        </button>

        <div className="ml-auto">
          <button
            onClick={onNewIdea}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nova Idea
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-default bg-bg-primary/50">
              <th className="px-4 py-3 w-10" />
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                Titulo / Canal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                Plataforma
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                Fonte
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                Metricas
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">
                Data
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="p-0">
                    <IdeaRowSkeleton />
                  </td>
                </tr>
              ))
            ) : ideas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Lightbulb className="w-10 h-10 text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Nenhuma idea encontrada</p>
                  <button
                    onClick={onNewIdea}
                    className="mt-3 text-sm text-accent-primary hover:underline"
                  >
                    Adicionar primeira idea
                  </button>
                </td>
              </tr>
            ) : (
              ideas.map((idea) => (
                <IdeaRow
                  key={idea.id}
                  idea={idea}
                  onToggleShortlist={toggleShortlist}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && ideas.length > 0 && (
        <p className="text-xs text-text-muted">
          {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
          {shortlistOnly ? ' no shortlist' : ''}
        </p>
      )}
    </div>
  );
}

// ============================================
// VIDEO KANBAN CARD
// ============================================

const STATUS_ORDER: VideoStatus[] = ['draft', 'generate', 'in_progress', 'ready', 'error'];

interface VideoCardProps {
  video: ContentVideo;
  onUpdateStatus: (id: string, status: VideoStatus) => void;
}

function VideoCard({ video, onUpdateStatus }: VideoCardProps) {
  const currentIndex = STATUS_ORDER.indexOf(video.status);
  const canAdvance = currentIndex < STATUS_ORDER.length - 2; // exclude 'error'
  const canRevert = currentIndex > 0 && video.status !== 'error';
  const nextStatus = STATUS_ORDER[currentIndex + 1];
  const prevStatus = STATUS_ORDER[currentIndex - 1];

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-3 space-y-2 group">
      <div className="flex items-center justify-between">
        <VideoStatusBadge status={video.status} />
        <span className="text-[10px] text-text-muted">{formatDate(video.created_at)}</span>
      </div>

      {video.idea && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{video.idea}</p>
      )}

      {video.title_chosen && (
        <p className="text-sm text-text-primary font-medium line-clamp-2 leading-snug">
          {video.title_chosen}
        </p>
      )}

      {video.search_term && (
        <div className="inline-flex items-center px-2 py-0.5 rounded bg-bg-tertiary">
          <span className="text-[10px] text-text-muted">{video.search_term}</span>
        </div>
      )}

      {/* Status change buttons */}
      {(canRevert || canAdvance) && (
        <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canRevert && (
            <button
              onClick={() => onUpdateStatus(video.id, prevStatus)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted bg-bg-tertiary hover:bg-bg-hover rounded transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              {VIDEO_STATUS_CONFIG[prevStatus]?.label}
            </button>
          )}
          {canAdvance && (
            <button
              onClick={() => onUpdateStatus(video.id, nextStatus)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-white bg-accent-primary/80 hover:bg-accent-primary rounded transition-colors ml-auto"
            >
              {VIDEO_STATUS_CONFIG[nextStatus]?.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// VIDEOS TAB (Kanban)
// ============================================

interface VideosTabProps {
  onNewVideo: () => void;
}

function VideosTab({ onNewVideo }: VideosTabProps) {
  const { videos, loading, error, updateStatus } = useContentVideos();

  const columns: { status: VideoStatus; label: string }[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'generate', label: 'Generate' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'ready', label: 'Ready' },
    { status: 'error', label: 'Error' },
  ];

  const byStatus = useMemo(() => {
    const map: Record<VideoStatus, ContentVideo[]> = {
      draft: [],
      generate: [],
      in_progress: [],
      ready: [],
      error: [],
      not_required: [],
    };
    videos.forEach((v) => {
      const key = v.status in map ? v.status : 'draft';
      map[key].push(v);
    });
    return map;
  }, [videos]);

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <div className="flex items-center justify-end">
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo Video
        </button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        {columns.map((col) => {
          const colVideos = byStatus[col.status];
          const config = VIDEO_STATUS_CONFIG[col.status];

          return (
            <div key={col.status} className="space-y-2">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${config.className.replace('text-', 'bg-').split(' ')[0]}`} />
                  <span className="text-xs font-medium text-text-secondary">{col.label}</span>
                </div>
                <span className="text-xs text-text-muted">{colVideos.length}</span>
              </div>

              {/* Column body */}
              <div className="bg-bg-primary/50 border border-border-default rounded-lg p-2 min-h-32 space-y-2">
                {loading ? (
                  [...Array(2)].map((_, i) => <VideoCardSkeleton key={i} />)
                ) : colVideos.length === 0 ? (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-[11px] text-text-muted">Nenhum video</p>
                  </div>
                ) : (
                  colVideos.map((v) => (
                    <VideoCard key={v.id} video={v} onUpdateStatus={updateStatus} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && (
        <p className="text-xs text-text-muted">
          {videos.length} video{videos.length !== 1 ? 's' : ''} no pipeline
        </p>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export function ContentPipeline() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ideas');
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Stats hooks (separate instances for header stats)
  const { ideas, loading: loadingIdeas, error: ideasError, createIdea } = useContentIdeas();
  const { videos, loading: loadingVideos, error: videosError, createVideo } = useContentVideos();

  const totalIdeas = ideas.length;
  const shortlisted = useMemo(() => ideas.filter((i) => i.shortlist).length, [ideas]);
  const videosDraft = useMemo(() => videos.filter((v) => v.status === 'draft').length, [videos]);
  const videosReady = useMemo(() => videos.filter((v) => v.status === 'ready').length, [videos]);

  const tabs: { id: ActiveTab; label: string; icon: typeof Lightbulb }[] = [
    { id: 'ideas', label: 'Ideas', icon: Lightbulb },
    { id: 'videos', label: 'Videos', icon: Film },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-accent-primary" />
            <h1 className="text-xl font-semibold text-text-primary">Content Pipeline</h1>
          </div>
          <p className="text-sm text-text-muted mt-0.5">
            Research de ideas e pipeline de producao de videos
          </p>
        </div>
      </div>

      {/* Global error banners */}
      {ideasError && activeTab === 'ideas' && <ErrorBanner message={ideasError} />}
      {videosError && activeTab === 'videos' && <ErrorBanner message={videosError} />}

      {/* Stats */}
      <StatsCards
        totalIdeas={totalIdeas}
        shortlisted={shortlisted}
        videosDraft={videosDraft}
        videosReady={videosReady}
        loadingIdeas={loadingIdeas}
        loadingVideos={loadingVideos}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border-default">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'ideas' && !loadingIdeas && totalIdeas > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === 'ideas'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-bg-tertiary text-text-muted'
                }`}>
                  {totalIdeas}
                </span>
              )}
              {tab.id === 'videos' && !loadingVideos && videos.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === 'videos'
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-bg-tertiary text-text-muted'
                }`}>
                  {videos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'ideas' && (
        <IdeasTab onNewIdea={() => setShowIdeaModal(true)} />
      )}
      {activeTab === 'videos' && (
        <VideosTab onNewVideo={() => setShowVideoModal(true)} />
      )}

      {/* Modals */}
      {showIdeaModal && (
        <IdeaModal
          onClose={() => setShowIdeaModal(false)}
          onSubmit={createIdea}
        />
      )}
      {showVideoModal && (
        <VideoModal
          onClose={() => setShowVideoModal(false)}
          onSubmit={createVideo}
        />
      )}
    </div>
  );
}

export default ContentPipeline;
