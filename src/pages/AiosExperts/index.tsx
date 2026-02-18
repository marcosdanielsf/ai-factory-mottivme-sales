import { useState, useMemo } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { useAiosExperts } from '../../hooks/aios/useAiosExperts';
import { ExpertCard } from './components/ExpertCard';

function ExpertCardSkeleton() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-bg-tertiary flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-32 bg-bg-tertiary rounded" />
          <div className="h-3 w-24 bg-bg-tertiary rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-bg-tertiary rounded" />
      <div className="h-3 w-3/4 bg-bg-tertiary rounded" />
      <div className="border-t border-border-default pt-3 grid grid-cols-3 gap-2">
        <div className="h-8 bg-bg-tertiary rounded" />
        <div className="h-8 bg-bg-tertiary rounded" />
        <div className="h-8 bg-bg-tertiary rounded" />
      </div>
    </div>
  );
}

export function AiosExperts() {
  const [search, setSearch] = useState('');
  const { data: experts, loading, error } = useAiosExperts();

  const filtered = useMemo(() => {
    if (!search.trim()) return experts;
    const q = search.toLowerCase();
    return experts.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.expertise.toLowerCase().includes(q) ||
        (e.bio ?? '').toLowerCase().includes(q)
    );
  }, [experts, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Expert Knowledge System</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading ? '...' : `${experts.length} expert${experts.length !== 1 ? 's' : ''} disponível${experts.length !== 1 ? 'is' : ''}`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar expert..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
          <p className="text-sm text-yellow-400">Usando dados de demonstração — tabela não encontrada no banco.</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <ExpertCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">
            {search ? 'Nenhum expert encontrado com esse filtro' : 'Nenhum expert cadastrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      )}
    </div>
  );
}
