"use client";
import { useState, useMemo } from 'react';
import { BookOpen, Search, Plus, X, Loader2 } from 'lucide-react';
import { useAiosExperts } from '../../hooks/aios/useAiosExperts';
import { ExpertCard } from './components/ExpertCard';

// =====================================================
// Skeleton
// =====================================================

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

// =====================================================
// Modal Novo Expert
// =====================================================

interface NewExpertModalProps {
  onClose: () => void;
  onSave: (name: string, expertise: string, bio: string) => Promise<void>;
}

function NewExpertModal({ onClose, onSave }: NewExpertModalProps) {
  const [name, setName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFieldError('Nome obrigatório'); return; }
    if (!expertise.trim()) { setFieldError('Especialidade obrigatória'); return; }
    setFieldError('');
    setSaving(true);
    await onSave(name.trim(), expertise.trim(), bio.trim());
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-secondary border border-border-default rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-default">
          <h2 className="text-base font-semibold text-text-primary">Novo Expert</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Gary Halbert"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Especialidade <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="Ex: Direct Response Copywriting"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descrição do expert..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"
            />
          </div>

          {fieldError && (
            <p className="text-xs text-red-400">{fieldError}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-border-default rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Expert'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// Page
// =====================================================

export function AiosExperts() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { data: experts, loading, error, addExpert } = useAiosExperts();

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

  async function handleSaveExpert(name: string, expertise: string, bio: string) {
    await addExpert({ name, expertise, bio: bio || null });
    setShowModal(false);
  }

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

        <div className="flex items-center gap-3">
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

          {/* New Expert Button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Expert
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          <p className="text-sm text-red-400">
            Erro ao carregar experts: {error}. Verifique se a tabela <code className="font-mono text-xs">aios_expert_clones</code> existe no Supabase.
          </p>
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
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro expert
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewExpertModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveExpert}
        />
      )}
    </div>
  );
}
