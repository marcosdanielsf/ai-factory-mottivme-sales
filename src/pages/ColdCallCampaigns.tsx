import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Square,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Phone,
  Clock,
  Calendar,
  Upload,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import {
  useColdCallCampaigns,
  ColdCallCampaign,
  CampaignStatus,
  CreateCampaignInput,
  PhoneListItem,
} from '../hooks/useColdCallCampaigns';
import { useColdCallQueue, ColdCallQueueItem } from '../hooks/useColdCallQueue';

// ─── Constants ──────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os Status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Concluída' },
];

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-text-muted', bg: 'bg-bg-tertiary' },
  active: { label: 'Ativa', color: 'text-accent-success', bg: 'bg-accent-success/15' },
  paused: { label: 'Pausada', color: 'text-accent-warning', bg: 'bg-accent-warning/15' },
  completed: { label: 'Concluída', color: 'text-accent-primary', bg: 'bg-accent-primary/15' },
};

const DAY_LABELS: Record<string, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom',
};

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const QUEUE_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'Pendente', icon: '⏳', color: 'text-text-muted' },
  calling: { label: 'Ligando', icon: '📞', color: 'text-accent-primary' },
  completed: { label: 'Concluído', icon: '✅', color: 'text-accent-success' },
  failed: { label: 'Falha', icon: '❌', color: 'text-accent-error' },
  retry: { label: 'Retry', icon: '🔄', color: 'text-accent-warning' },
};

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatScheduleDays(days: string[]): string {
  if (!days?.length) return '—';
  return days.map((d) => DAY_LABELS[d] || d).join('-');
}

function getProgressColor(pct: number): string {
  if (pct >= 70) return 'bg-accent-success';
  if (pct >= 40) return 'bg-accent-warning';
  return 'bg-accent-error';
}

function parsePhoneList(text: string): PhoneListItem[] {
  const lines = text.split('\n').filter((l) => l.trim());
  const items: PhoneListItem[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim());
    if (parts[0]) {
      items.push({
        phone: parts[0],
        name: parts[1] || '',
        context: parts[2] || undefined,
      });
    }
  }

  return items;
}

function parseCSV(text: string): PhoneListItem[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return parsePhoneList(text);

  // Check if first line is header
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('phone') || header.includes('telefone') || header.includes('nome');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  return parsePhoneList(dataLines.join('\n'));
}

// ═══════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════════════════════

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">Progresso</span>
        <span className="text-text-primary font-medium">
          {completed}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════════════

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-accent-warning/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-accent-warning" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <p className="text-text-secondary text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              confirmColor ?? 'bg-accent-error hover:bg-accent-error/80'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// QUEUE EXPANDED VIEW
// ═══════════════════════════════════════════════════════════════════════

function CampaignQueueView({ campaignId }: { campaignId: string }) {
  const { queue, loading, stats } = useColdCallQueue(campaignId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
        <span className="ml-2 text-sm text-text-muted">Carregando fila...</span>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-sm">
        Nenhum item na fila desta campanha.
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-border-default pt-4 space-y-3">
      {/* Stats row */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-text-muted">
          ⏳ {stats.pending} pendente{stats.pending !== 1 ? 's' : ''}
        </span>
        <span className="text-accent-primary">
          📞 {stats.calling} ligando
        </span>
        <span className="text-accent-success">
          ✅ {stats.completed} concluído{stats.completed !== 1 ? 's' : ''}
        </span>
        <span className="text-accent-error">
          ❌ {stats.failed} falha{stats.failed !== 1 ? 's' : ''}
        </span>
        {stats.retry > 0 && (
          <span className="text-accent-warning">
            🔄 {stats.retry} retry
          </span>
        )}
      </div>

      {/* Queue list */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {queue.map((item: ColdCallQueueItem) => {
          const cfg = QUEUE_STATUS_CONFIG[item.status] || QUEUE_STATUS_CONFIG.pending;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-2 bg-bg-primary/50 rounded-lg text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-base flex-shrink-0">{cfg.icon}</span>
                <div className="min-w-0">
                  <span className="text-text-primary font-medium truncate block">
                    {item.lead_name || item.phone_number}
                  </span>
                  {item.lead_name && (
                    <span className="text-text-muted text-xs">{item.phone_number}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                {item.attempt > 0 && (
                  <span className="text-xs text-text-muted">
                    #{item.attempt}/{item.max_attempts}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CAMPAIGN CARD
// ═══════════════════════════════════════════════════════════════════════

function CampaignCard({
  campaign,
  onStart,
  onPause,
  onStop,
  onDelete,
}: {
  campaign: ColdCallCampaign;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const totalProcessed = (campaign.total_completed || 0) + (campaign.total_failed || 0);
  const totalItems = campaign.total_queued || campaign.total_calls || 0;

  return (
    <div
      className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all duration-200 cursor-pointer"
      onClick={() => setExpanded((prev) => !prev)}
    >
      {/* Header: name + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-text-primary truncate">{campaign.name}</h3>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-text-muted text-sm mt-1 line-clamp-1">{campaign.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {(campaign.status === 'draft' || campaign.status === 'paused') && (
            <button
              onClick={() => onStart(campaign.id)}
              className="p-1.5 rounded-lg text-accent-success hover:bg-accent-success/15 transition-colors"
              title="Iniciar"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {campaign.status === 'active' && (
            <button
              onClick={() => onPause(campaign.id)}
              className="p-1.5 rounded-lg text-accent-warning hover:bg-accent-warning/15 transition-colors"
              title="Pausar"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {(campaign.status === 'active' || campaign.status === 'paused') && (
            <button
              onClick={() => onStop(campaign.id)}
              className="p-1.5 rounded-lg text-accent-error hover:bg-accent-error/15 transition-colors"
              title="Parar"
            >
              <Square className="w-4 h-4" />
            </button>
          )}
          {campaign.status === 'draft' && (
            <button
              onClick={() => onDelete(campaign.id)}
              className="p-1.5 rounded-lg text-accent-error hover:bg-accent-error/15 transition-colors"
              title="Deletar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button className="p-1.5 rounded-lg text-text-muted hover:bg-bg-hover transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <ProgressBar completed={totalProcessed} total={totalItems} />
      </div>

      {/* Metrics row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-accent-success">✅ {campaign.total_completed || 0} sucesso</span>
        <span className="text-accent-error">❌ {campaign.total_failed || 0} falha</span>
        <span className="text-text-muted">⏳ {campaign.total_pending || 0} pendente</span>
        {(campaign.total_in_progress || 0) > 0 && (
          <span className="text-accent-primary">📞 {campaign.total_in_progress} em progresso</span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" /> {campaign.rate_limit || 10}/h
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {campaign.schedule_start || '09:00'}-{campaign.schedule_end || '18:00'}{' '}
          {formatScheduleDays(campaign.schedule_days)}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {formatDate(campaign.created_at)}
        </span>
      </div>

      {/* Expanded: queue items */}
      {expanded && <CampaignQueueView campaignId={campaign.id} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CREATE CAMPAIGN MODAL
// ═══════════════════════════════════════════════════════════════════════

function CreateCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateCampaignInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneText, setPhoneText] = useState('');
  const [rateLimit, setRateLimit] = useState(10);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('18:00');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedItems = useMemo(() => parsePhoneList(phoneText), [phoneText]);

  const toggleDay = (day: string) => {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const items = parseCSV(text);
      const lines = items.map((i) => [i.phone, i.name, i.context].filter(Boolean).join(','));
      setPhoneText((prev) => (prev ? prev + '\n' : '') + lines.join('\n'));
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nome da campanha é obrigatório.');
      return;
    }
    if (parsedItems.length === 0) {
      setErrorMsg('Adicione pelo menos um contato.');
      return;
    }

    try {
      setSaving(true);
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        phone_list: parsedItems,
        rate_limit: rateLimit,
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd,
        schedule_days: scheduleDays,
      });
      // Reset
      setName('');
      setDescription('');
      setPhoneText('');
      setRateLimit(10);
      setScheduleStart('09:00');
      setScheduleEnd('18:00');
      setScheduleDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar campanha';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-2xl mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">Nova Campanha</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Nome da campanha <span className="text-accent-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prospecção Médicos SP"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Descrição <span className="text-text-muted">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a campanha..."
              rows={2}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm resize-none"
            />
          </div>

          {/* Phone list */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Lista de telefones <span className="text-accent-error">*</span>
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                className="hidden"
              />
            </div>
            <textarea
              value={phoneText}
              onChange={(e) => setPhoneText(e.target.value)}
              placeholder={"telefone,nome,contexto\n5511999990001,Dr. Silva,Clínica SP\n5511999990002,Dra. Santos,Hospital RJ"}
              rows={5}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm font-mono resize-none"
            />
            {parsedItems.length > 0 && (
              <p className="mt-1.5 text-xs text-accent-success font-medium">
                ✅ {parsedItems.length} contato{parsedItems.length !== 1 ? 's' : ''} detectado{parsedItems.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Rate limit */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Rate limit (ligações/hora)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={50}
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="flex-1 accent-accent-primary"
              />
              <span className="w-12 text-center text-sm font-medium text-text-primary bg-bg-tertiary border border-border-default rounded-lg px-2 py-1">
                {rateLimit}
              </span>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Horário início
              </label>
              <input
                type="time"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Horário fim
              </label>
              <input
                type="time"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Dias da semana
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const active = scheduleDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                      active
                        ? 'bg-accent-primary/15 border-accent-primary text-accent-primary'
                        : 'bg-bg-tertiary border-border-default text-text-muted hover:border-border-hover'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent-error/10 border border-accent-error/30 rounded-lg text-accent-error text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-default">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-primary hover:bg-accent-primary/80 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar campanha
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

const ColdCallCampaigns: React.FC = () => {
  const { campaigns, loading, error, refetch, createCampaign, updateCampaign, deleteCampaign } =
    useColdCallCampaigns();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Confirm modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'stop' | 'delete';
    campaignId: string;
    campaignName: string;
  } | null>(null);

  // ─── Filtered campaigns ─────────────────────────────────────────

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

  // ─── Actions ────────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────

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
