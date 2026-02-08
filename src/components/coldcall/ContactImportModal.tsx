import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Loader2,
  AlertTriangle,
  CheckSquare,
  Square,
  Database,
} from 'lucide-react';
import { useAvailableContacts, Contact, ContactFilters } from '../../hooks/useAvailableContacts';
import { useImportContacts } from '../../hooks/useImportContacts';

// ─── Types ──────────────────────────────────────────────────────────

interface ContactImportModalProps {
  open: boolean;
  campaignId?: string; // If provided, import to this campaign
  onClose: () => void;
  onSuccess?: (contacts: Contact[]) => void; // For new campaign creation
  onImported?: () => void; // For existing campaign (refresh)
}

// ─── Constants ──────────────────────────────────────────────────────

const SOURCE_OPTIONS = [
  { value: 'growth_leads', label: 'Growth Leads' },
  { value: 'ghl_tracking', label: 'GHL Tracking' },
];

const SEGMENTO_OPTIONS = [
  'dermatologia',
  'odontologia',
  'estética',
  'fisioterapia',
  'nutrição',
  'psicologia',
];

const ESTADO_OPTIONS = [
  'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF',
  'GO', 'ES', 'PA', 'AM', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI',
  'MT', 'MS', 'RO', 'AC', 'AP', 'RR', 'TO',
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'novo', label: 'Novo' },
  { value: 'sem_resposta', label: 'Sem resposta' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'nao_interessado', label: 'Não interessado' },
];

// ─── Component ──────────────────────────────────────────────────────

export function ContactImportModal({
  open,
  campaignId,
  onClose,
  onSuccess,
  onImported,
}: ContactImportModalProps) {
  // State
  const [source, setSource] = useState<'growth_leads' | 'ghl_tracking'>('growth_leads');
  const [segmento, setSegmento] = useState('');
  const [estado, setEstado] = useState('');
  const [icpScoreMin, setIcpScoreMin] = useState(70);
  const [status, setStatus] = useState('');
  const [maxContacts, setMaxContacts] = useState(50);

  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Hooks
  const { contacts, total, loading, error, fetchContacts } = useAvailableContacts();
  const { importing, result: importResult, error: importError, importContacts } = useImportContacts();

  // Debounced search
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, segmento, estado, icpScoreMin, status, open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedPhones(new Set());
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    const filters: ContactFilters = {
      source,
      limit: 100,
    };
    if (segmento) filters.segmento = segmento;
    if (estado) filters.estado = estado;
    if (icpScoreMin > 0) filters.icp_score_min = icpScoreMin;
    if (status) filters.status = status;

    fetchContacts(filters);
  }, [source, segmento, estado, icpScoreMin, status, fetchContacts]);

  const toggleSelectAll = () => {
    if (selectedPhones.size === filteredContacts.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(filteredContacts.map((c) => c.phone)));
    }
  };

  const toggleContact = (phone: string) => {
    const newSet = new Set(selectedPhones);
    if (newSet.has(phone)) {
      newSet.delete(phone);
    } else {
      newSet.add(phone);
    }
    setSelectedPhones(newSet);
  };

  const handleImport = async () => {
    const phonesToImport = Array.from(selectedPhones);
    if (phonesToImport.length === 0) return;

    if (campaignId) {
      // Import to existing campaign
      const result = await importContacts(campaignId, {
        source,
        filters: {
          segmento: segmento || undefined,
          estado: estado || undefined,
          icp_score_min: icpScoreMin > 0 ? icpScoreMin : undefined,
          status: status || undefined,
        },
        max_contacts: maxContacts,
        selected_phones: phonesToImport,
      });

      if (result) {
        onImported?.();
        onClose();
      }
    } else {
      // Return contacts for new campaign
      const selected = contacts.filter((c) => selectedPhones.has(c.phone));
      onSuccess?.(selected);
      onClose();
    }
  };

  // Filter contacts by search query (local)
  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.segmento?.toLowerCase().includes(q)
    );
  });

  // ─── Render ─────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white/5 border border-white/10 rounded-xl w-full max-w-4xl mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Importar Contatos do Banco</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">
              Fonte de dados
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as 'growth_leads' | 'ghl_tracking')}
              className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/30 transition-colors text-sm"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-medium text-white/60 mb-3">Filtros</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Segmento */}
              <div>
                <label className="block text-xs text-white/40 mb-1">Segmento</label>
                <select
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/30"
                >
                  <option value="" className="bg-gray-900">Todos</option>
                  {SEGMENTO_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs text-white/40 mb-1">Estado</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/30"
                >
                  <option value="" className="bg-gray-900">Todos</option>
                  {ESTADO_OPTIONS.map((e) => (
                    <option key={e} value={e} className="bg-gray-900">
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              {/* ICP Score */}
              <div>
                <label className="block text-xs text-white/40 mb-1">ICP Score mín.</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={icpScoreMin}
                  onChange={(e) => setIcpScoreMin(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/30"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs text-white/40 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/30"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max contacts */}
            <div className="mt-3">
              <label className="block text-xs text-white/40 mb-1">
                Máximo de contatos: {maxContacts}
              </label>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={maxContacts}
                onChange={(e) => setMaxContacts(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, telefone ou segmento..."
                className="w-full pl-10 pr-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/30 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Import Error */}
          {importError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {importError}
            </div>
          )}

          {/* Results */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="ml-2 text-sm text-white/60">Buscando contatos...</span>
            </div>
          )}

          {!loading && contacts.length === 0 && !error && (
            <div className="text-center py-6 text-white/60 text-sm">
              Nenhum contato encontrado com os filtros selecionados.
            </div>
          )}

          {!loading && filteredContacts.length > 0 && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {selectedPhones.size === filteredContacts.length ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <span className="text-sm text-white/60">
                    Resultado: {total} contato{total !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-sm text-purple-400 font-medium">
                  {selectedPhones.size} selecionado{selectedPhones.size !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div className="max-h-96 overflow-y-auto space-y-1">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedPhones.has(contact.phone);
                  return (
                    <div
                      key={contact.phone}
                      onClick={() => toggleContact(contact.phone)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-white/[0.03] border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Square className="w-5 h-5 text-white/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="truncate">
                          <span className="text-white font-medium text-sm">{contact.name}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-white/60 text-xs">{contact.phone}</span>
                        </div>
                        <div className="truncate">
                          <span className="text-white/60 text-xs">{contact.segmento || '—'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-purple-400 text-xs font-medium">
                            {contact.icp_score !== undefined ? `ICP: ${contact.icp_score}` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <div className="text-sm text-white/60">
            {selectedPhones.size > 0 ? (
              <span>
                {selectedPhones.size} de {filteredContacts.length} selecionado{selectedPhones.size !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>Nenhum contato selecionado</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2 text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedPhones.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {importing && <Loader2 className="w-4 h-4 animate-spin" />}
              Importar {selectedPhones.size > 0 ? selectedPhones.size : ''} contato
              {selectedPhones.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
