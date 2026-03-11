import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, MessageCircle, Pencil, ArrowLeft, Bot, UserCircle, Check, ChevronLeft, ChevronRight, User, Instagram, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getConversationMessages, type ConversationMessage } from '../lib/supabase-sales-ops';
import type { CategorizedLead, OrigemBucket, SSSubtype } from '../hooks/useSocialSellingFunnel';
import { getErrorMessage } from "../lib/getErrorMessage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leads: CategorizedLead[];
  onLeadUpdated?: () => void;
}

const PAGE_SIZE = 20;

const ORIGEM_OPTIONS: { value: string; label: string }[] = [
  { value: 'social_selling', label: 'Social Selling' },
  { value: 'ns', label: 'NS (Novo Seguidor)' },
  { value: 'vs', label: 'VS (Visita Sincera)' },
  { value: 'gs', label: 'GS (Gatilho Social)' },
  { value: 'trafego', label: 'Trafego Pago' },
  { value: 'whatsapp_direto', label: 'WhatsApp Direto' },
  { value: 'organico', label: 'Organico' },
];

const ETAPA_OPTIONS: { value: string; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em Contato' },
  { value: 'agendou', label: 'Agendou' },
  { value: 'no_show', label: 'No Show' },
  { value: 'fechou', label: 'Fechou' },
  { value: 'perdido', label: 'Perdido' },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMessageDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function OrigemBadge({ origem }: { origem: string | null }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    social_selling: { label: 'Social Selling', bg: 'bg-pink-500/20', text: 'text-pink-400' },
    ns: { label: 'NS', bg: 'bg-pink-500/20', text: 'text-pink-400' },
    vs: { label: 'VS', bg: 'bg-pink-500/20', text: 'text-pink-400' },
    gs: { label: 'GS', bg: 'bg-pink-500/20', text: 'text-pink-400' },
    trafego: { label: 'Trafego', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    whatsapp_direto: { label: 'WhatsApp', bg: 'bg-green-500/20', text: 'text-green-400' },
    organico: { label: 'Organico', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  };
  const key = origem || '';
  const c = config[key] || { label: origem || 'N/C', bg: 'bg-gray-500/20', text: 'text-gray-400' };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function EtapaBadge({ etapa }: { etapa: string | null }) {
  const val = (etapa || '').toLowerCase();
  let color = 'bg-gray-500/20 text-gray-400';
  if (val.includes('agend')) color = 'bg-blue-500/20 text-blue-400';
  else if (val.includes('fechou') || val.includes('won')) color = 'bg-green-500/20 text-green-400';
  else if (val.includes('no_show') || val.includes('no-show')) color = 'bg-red-500/20 text-red-400';
  else if (val.includes('contato') || val.includes('respond')) color = 'bg-yellow-500/20 text-yellow-400';
  else if (val === 'novo') color = 'bg-gray-500/20 text-gray-400';
  else if (val.includes('perdido')) color = 'bg-red-500/20 text-red-400';
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      {etapa || 'N/A'}
    </span>
  );
}

export function SocialSellingLeadsDrawer({ isOpen, onClose, title, leads, onLeadUpdated }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedLead, setSelectedLead] = useState<CategorizedLead | null>(null);
  const [editingLead, setEditingLead] = useState<CategorizedLead | null>(null);
  const [view, setView] = useState<'list' | 'conversation' | 'edit'>('list');

  // Conversation state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Edit state
  const [editForm, setEditForm] = useState({ origem_lead: '', etapa_funil: '', responded: false });
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setPage(0);
      setSelectedLead(null);
      setEditingLead(null);
      setView('list');
      setMessages([]);
      setSaveResult(null);
    }
  }, [isOpen]);

  // Filter + paginate
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      (l.first_name || '').toLowerCase().includes(q) ||
      (l.location_name || '').toLowerCase().includes(q) ||
      (l.unique_id || '').toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when leads change
  useEffect(() => {
    setPage(0);
  }, [leads]);

  // Load conversation
  const loadConversation = async (lead: CategorizedLead) => {
    setSelectedLead(lead);
    setView('conversation');
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = await getConversationMessages(lead.unique_id);
      setMessages(data);
    } catch (err: unknown) {
      console.error('Erro ao carregar mensagens:', err);
      setMessagesError(getErrorMessage(err) || 'Erro ao carregar mensagens');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Open edit
  const openEdit = (lead: CategorizedLead) => {
    setEditingLead(lead);
    setEditForm({
      origem_lead: lead.origem_lead || '',
      etapa_funil: lead.etapa_funil || '',
      responded: lead.responded,
    });
    setView('edit');
    setSaveResult(null);
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingLead) return;
    setSaving(true);
    setSaveResult(null);

    // Validar valores contra whitelist
    const validOrigens = ORIGEM_OPTIONS.map(o => o.value);
    const validEtapas = ETAPA_OPTIONS.map(o => o.value);
    const safeOrigem = validOrigens.includes(editForm.origem_lead) ? editForm.origem_lead : null;
    const safeEtapa = validEtapas.includes(editForm.etapa_funil) ? editForm.etapa_funil : null;

    try {
      const { error } = await supabase
        .from('n8n_schedule_tracking')
        .update({
          origem_lead: safeOrigem,
          etapa_funil: safeEtapa,
          responded: editForm.responded,
        })
        .eq('unique_id', editingLead.unique_id);

      if (error) throw error;
      setSaveResult({ type: 'success', msg: 'Salvo com sucesso!' });
      onLeadUpdated?.();
      setTimeout(() => {
        setView('list');
        setSaveResult(null);
      }, 1000);
    } catch (err: unknown) {
      setSaveResult({ type: 'error', msg: getErrorMessage(err) || 'Erro ao salvar' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:max-w-lg bg-bg-secondary border-l border-border-default z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border-default bg-bg-primary">
          {view !== 'list' && (
            <button
              onClick={() => setView('list')}
              className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
            >
              <ArrowLeft size={18} className="text-text-muted" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">
              {view === 'list' ? title : view === 'conversation' ? (selectedLead?.first_name || 'Conversa') : 'Editar Lead'}
            </h3>
            <p className="text-xs text-text-muted">
              {view === 'list' ? `${filtered.length} leads` : view === 'conversation' ? (selectedLead?.location_name || '') : (editingLead?.first_name || editingLead?.unique_id || '')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-hover transition-colors">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <>
            {/* Search */}
            <div className="px-4 py-3 border-b border-border-default">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  placeholder="Buscar por nome, cliente ou ID..."
                  className="w-full bg-bg-primary border border-border-default rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Leads list */}
            <div className="flex-1 overflow-y-auto">
              {paginated.length === 0 ? (
                <div className="text-center py-12">
                  <User size={40} className="mx-auto text-text-muted mb-3 opacity-50" />
                  <p className="text-text-muted text-sm">Nenhum lead encontrado</p>
                </div>
              ) : (
                paginated.map((lead) => (
                  <div
                    key={lead.unique_id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border-default hover:bg-bg-hover/50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer bg-pink-500/10"
                      onClick={() => loadConversation(lead)}
                    >
                      {lead.source === 'instagram' ? (
                        <Instagram size={16} className="text-pink-400" />
                      ) : lead.source === 'whatsapp' ? (
                        <MessageCircle size={16} className="text-green-400" />
                      ) : (
                        <User size={16} className="text-text-muted" />
                      )}
                    </div>

                    {/* Info — click abre conversa */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => loadConversation(lead)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {lead.first_name || 'Sem nome'}
                        </span>
                        <OrigemBadge origem={lead.origem_lead} />
                        <EtapaBadge etapa={lead.etapa_funil} />
                      </div>
                      <p className="text-[11px] text-text-muted truncate">
                        {lead.location_name || 'Sem cliente'} &middot; {formatDate(lead.created_at)}
                      </p>
                    </div>

                    {/* Status icons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {lead.didRespond && <span className="w-2 h-2 rounded-full bg-yellow-400" title="Respondeu" />}
                      {lead.didSchedule && <span className="w-2 h-2 rounded-full bg-blue-400" title="Agendou" />}
                      {lead.didAttend && <span className="w-2 h-2 rounded-full bg-green-400" title="Compareceu" />}
                      {lead.didClose && <span className="w-2 h-2 rounded-full bg-emerald-400" title="Fechou" />}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(lead); }}
                      className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors opacity-0 group-hover:opacity-100"
                      title="Editar lead"
                    >
                      <Pencil size={14} className="text-text-muted" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span className="text-xs text-text-muted">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
                >
                  Proximo <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}

        {/* CONVERSATION VIEW */}
        {view === 'conversation' && selectedLead && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              </div>
            ) : messagesError ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-red-400 mb-4 opacity-50" />
                <p className="text-red-400 text-sm">{messagesError}</p>
                <button
                  onClick={() => selectedLead && loadConversation(selectedLead)}
                  className="text-xs text-text-muted hover:text-text-primary mt-2 underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                <p className="text-text-muted">Nenhuma mensagem encontrada</p>
                <p className="text-text-muted text-xs mt-1">As mensagens aparecerao aqui quando houver historico</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isAI = msg.message?.type === 'ai';
                const content = msg.message?.content || '';
                return (
                  <div key={msg.id} className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
                    {isAI && (
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-pink-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${isAI ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isAI
                          ? 'bg-bg-primary border border-border-default text-text-primary'
                          : 'bg-green-600 text-white'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{content}</p>
                      </div>
                      <p className={`text-[10px] text-text-muted mt-1 ${isAI ? 'text-left' : 'text-right'}`}>
                        {formatMessageDate(msg.created_at)}
                      </p>
                    </div>
                    {!isAI && (
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <UserCircle size={16} className="text-green-400" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* EDIT VIEW */}
        {view === 'edit' && editingLead && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Lead info */}
            <div className="bg-bg-primary rounded-lg border border-border-default p-3">
              <p className="text-sm font-medium text-text-primary">{editingLead.first_name || 'Sem nome'}</p>
              <p className="text-xs text-text-muted">{editingLead.location_name || 'Sem cliente'} &middot; {editingLead.unique_id}</p>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Origem do Lead</label>
              <select
                value={editForm.origem_lead}
                onChange={(e) => setEditForm(f => ({ ...f, origem_lead: e.target.value }))}
                className="w-full bg-bg-primary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-pink-500"
              >
                <option value="">Nao classificado</option>
                {ORIGEM_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Etapa funil */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Etapa do Funil</label>
              <select
                value={editForm.etapa_funil}
                onChange={(e) => setEditForm(f => ({ ...f, etapa_funil: e.target.value }))}
                className="w-full bg-bg-primary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-pink-500"
              >
                <option value="">Sem etapa</option>
                {ETAPA_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Responded toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted">Respondeu?</label>
              <button
                onClick={() => setEditForm(f => ({ ...f, responded: !f.responded }))}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  editForm.responded ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  editForm.responded ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Save result */}
            {saveResult && (
              <div className={`text-xs px-3 py-2 rounded-lg ${
                saveResult.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {saveResult.msg}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={saveEdit}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default SocialSellingLeadsDrawer;
