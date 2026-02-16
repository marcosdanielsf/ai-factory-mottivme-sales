import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Search, Filter, ChevronDown, Loader2, AlertTriangle, Megaphone } from 'lucide-react';
import {
  useColdCallCampaigns,
  CreateCampaignInput,
} from '../../hooks/useColdCallCampaigns';
import { ContactImportModal } from '../../components/coldcall/ContactImportModal';
import { STATUS_OPTIONS } from './constants';
import { CampaignCard } from './components/CampaignCard';
import { CreateCampaignModal } from './components/CreateCampaignModal';
import { ConfirmModal } from './components/ConfirmModal';

export const ColdCallCampaigns: React.FC = () => {
  const { campaigns, loading, error, refetch, createCampaign, updateCampaign, deleteCampaign } =
    useColdCallCampaigns();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Import modal for existing campaigns
  const [importCampaignId, setImportCampaignId] = useState<string | null>(null);

  // Confirm modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'stop' | 'delete';
    campaignId: string;
    campaignName: string;
  } | null>(null);

  // Filtered campaigns
  const filtered = useMemo(() => {
    let list = campaigns;

    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [campaigns, statusFilter, searchTerm]);

  // Actions
  const handleCreate = useCallback(
    async (input: CreateCampaignInput) => {
      await createCampaign(input);
      await refetch();
    },
    [createCampaign, refetch]
  );

  const handleStart = useCallback(
    async (id: string) => {
      await updateCampaign(id, { status: 'active' });
      await refetch();
    },
    [updateCampaign, refetch]
  );

  const handlePause = useCallback(
    async (id: string) => {
      await updateCampaign(id, { status: 'paused' });
      await refetch();
    },
    [updateCampaign, refetch]
  );

  const handleStop = useCallback(
    (id: string) => {
      const c = campaigns.find((c) => c.id === id);
      setConfirmAction({ type: 'stop', campaignId: id, campaignName: c?.name || '' });
    },
    [campaigns]
  );

  const handleImportMore = useCallback(
    (id: string) => {
      setImportCampaignId(id);
    },
    []
  );

  const handleDelete = useCallback(
    (id: string) => {
      const c = campaigns.find((c) => c.id === id);
      setConfirmAction({ type: 'delete', campaignId: id, campaignName: c?.name || '' });
    },
    [campaigns]
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'stop') {
      await updateCampaign(confirmAction.campaignId, { status: 'completed' });
    } else {
      await deleteCampaign(confirmAction.campaignId);
    }
    setConfirmAction(null);
    await refetch();
  }, [confirmAction, updateCampaign, deleteCampaign, refetch]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/15 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Campanhas</h1>
            <p className="text-sm text-text-muted">
              Gerencie suas campanhas de cold call
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar campanhas..."
            className="w-full pl-9 pr-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-6 bg-accent-error/10 border border-accent-error/30 rounded-lg text-accent-error text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary mb-3" />
          <span className="text-sm">Carregando campanhas...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-default flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {searchTerm || statusFilter ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha ainda'}
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm">
            {searchTerm || statusFilter
              ? 'Tente ajustar os filtros de busca.'
              : 'Crie sua primeira campanha de cold call para começar a prospectar.'}
          </p>
          {!searchTerm && !statusFilter && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar primeira campanha
            </button>
          )}
        </div>
      )}

      {/* Campaign list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onStart={handleStart}
              onPause={handlePause}
              onStop={handleStop}
              onDelete={handleDelete}
              onImportMore={handleImportMore}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />

      {/* Import modal for existing campaigns */}
      <ContactImportModal
        open={!!importCampaignId}
        campaignId={importCampaignId || undefined}
        onClose={() => setImportCampaignId(null)}
        onImported={refetch}
      />

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'stop' ? 'Parar campanha?' : 'Deletar campanha?'}
        message={
          confirmAction?.type === 'stop'
            ? `A campanha "${confirmAction.campaignName}" será marcada como concluída. Ligações em andamento serão finalizadas.`
            : `A campanha "${confirmAction?.campaignName}" e todos os itens da fila serão removidos permanentemente.`
        }
        confirmLabel={confirmAction?.type === 'stop' ? 'Parar' : 'Deletar'}
        confirmColor={
          confirmAction?.type === 'stop'
            ? 'bg-accent-warning hover:bg-accent-warning/80'
            : undefined
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default ColdCallCampaigns;
