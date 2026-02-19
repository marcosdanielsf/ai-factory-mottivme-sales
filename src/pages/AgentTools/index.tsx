import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Wrench,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  Save,
  Trash2,
  ChevronDown,
  Package,
  User,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useAgentTools, type AgentTool, type ToolStatus } from '../../hooks/useAgentTools';

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function tryFormatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function isValidJson(str: string): boolean {
  if (!str.trim()) return true;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// STATUS BADGE
// ============================================

const STATUS_CONFIG: Record<ToolStatus, { label: string; icon: React.ElementType; classes: string }> = {
  active: {
    label: 'Active',
    icon: CheckCircle2,
    classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  inactive: {
    label: 'Inactive',
    icon: Circle,
    classes: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  },
  deprecated: {
    label: 'Deprecated',
    icon: AlertTriangle,
    classes: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
};

function StatusBadge({ status }: { status: ToolStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// ============================================
// STAT CARDS
// ============================================

function StatCards({ tools }: { tools: AgentTool[] }) {
  const total = tools.length;
  const active = tools.filter((t) => t.status === 'active').length;
  const inactive = tools.filter((t) => t.status === 'inactive').length;
  const deprecated = tools.filter((t) => t.status === 'deprecated').length;

  const stats = [
    { label: 'Total', value: total, color: 'text-text-primary', bg: 'bg-bg-tertiary' },
    { label: 'Active', value: active, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
    { label: 'Inactive', value: inactive, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
    { label: 'Deprecated', value: deprecated, color: 'text-red-400', bg: 'bg-red-500/5' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bg} border border-border-default rounded-lg p-4`}
        >
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// SKELETON LOADING
// ============================================

function SkeletonCard() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-bg-tertiary rounded w-2/3" />
          <div className="h-3 bg-bg-tertiary rounded w-1/3" />
        </div>
        <div className="h-5 bg-bg-tertiary rounded-full w-16" />
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-border-default">
        <div className="h-3 bg-bg-tertiary rounded w-1/4" />
        <div className="h-3 bg-bg-tertiary rounded w-1/4" />
      </div>
    </div>
  );
}

// ============================================
// TOOL CARD
// ============================================

function ToolCard({
  tool,
  onClick,
}: {
  tool: AgentTool;
  onClick: (tool: AgentTool) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(tool)}
      className="w-full text-left bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-accent-primary/50 hover:bg-bg-tertiary transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <Wrench size={14} className="text-accent-primary flex-shrink-0" />
            <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-primary transition-colors">
              {tool.tool_name}
            </h3>
          </div>
          {tool.resource && (
            <p className="text-xs text-text-muted truncate pl-5">{tool.resource}</p>
          )}
        </div>
        <StatusBadge status={tool.status} />
      </div>

      <div className="flex items-center gap-3 pt-2.5 border-t border-border-default">
        {tool.submitted_by && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <User size={11} />
            {tool.submitted_by}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-text-muted ml-auto">
          <Clock size={11} />
          {timeAgo(tool.created_at)}
        </span>
      </div>
    </button>
  );
}

// ============================================
// DRAWER (detail panel)
// ============================================

interface DrawerProps {
  tool: AgentTool | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Pick<AgentTool, 'json_config' | 'status'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ToolDrawer({ tool, onClose, onSave, onDelete }: DrawerProps) {
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [status, setStatus] = useState<ToolStatus>('active');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (tool) {
      setJsonText(tryFormatJson(tool.json_config));
      setStatus(tool.status);
      setJsonError(null);
      setConfirmDelete(false);
    }
  }, [tool]);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    if (!isValidJson(val)) {
      setJsonError('JSON invalido');
    } else {
      setJsonError(null);
    }
  };

  const handleSave = async () => {
    if (jsonError || !tool) return;
    setSaving(true);
    try {
      const parsedConfig = jsonText.trim() ? JSON.parse(jsonText) : {};
      await onSave(tool.id, { json_config: parsedConfig, status });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tool) return;
    setDeleting(true);
    try {
      await onDelete(tool.id);
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!tool) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-bg-secondary border-l border-border-default z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-default">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Wrench size={16} className="text-accent-primary flex-shrink-0" />
              <h2 className="text-base font-semibold text-text-primary truncate">{tool.tool_name}</h2>
            </div>
            {tool.resource && (
              <p className="text-xs text-text-muted pl-6">{tool.resource}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors ml-3 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {tool.submitted_by && (
              <div className="bg-bg-tertiary rounded-lg p-3">
                <p className="text-xs text-text-muted mb-1">Submitted by</p>
                <p className="text-sm text-text-primary font-medium">{tool.submitted_by}</p>
              </div>
            )}
            <div className="bg-bg-tertiary rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Criado em</p>
              <p className="text-sm text-text-primary font-medium">{formatDate(tool.created_at)}</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3">
              <p className="text-xs text-text-muted mb-1">Atualizado</p>
              <p className="text-sm text-text-primary font-medium">{formatDate(tool.updated_at)}</p>
            </div>
          </div>

          {/* Status select */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Status</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary hover:border-accent-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                </div>
                <ChevronDown size={14} className={`text-text-muted transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-10 overflow-hidden">
                  {(['active', 'inactive', 'deprecated'] as ToolStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setStatus(s); setStatusOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-bg-tertiary transition-colors ${s === status ? 'bg-bg-tertiary' : ''}`}
                    >
                      <StatusBadge status={s} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* JSON Config */}
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
              JSON Config
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={14}
              spellCheck={false}
              className={`w-full font-mono text-sm bg-bg-tertiary border rounded-lg p-3 text-text-primary resize-none outline-none transition-colors leading-relaxed ${
                jsonError
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-border-default focus:border-accent-primary'
              }`}
              placeholder='{"key": "value"}'
            />
            {jsonError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={11} />
                {jsonError}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-default space-y-3">
          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!!jsonError || saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? 'Salvando...' : 'Salvar alteracoes'}
          </button>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={14} />
              Deletar tool
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400 mb-3 text-center">Tem certeza?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-default hover:border-text-muted text-text-secondary rounded-lg text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {deleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {deleting ? 'Deletando...' : 'Deletar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ============================================
// NEW TOOL MODAL
// ============================================

interface NewToolModalProps {
  onClose: () => void;
  onCreate: (input: {
    tool_name: string;
    resource?: string;
    json_config?: Record<string, unknown>;
    submitted_by?: string;
  }) => Promise<void>;
}

const JSON_PLACEHOLDER = `{
  "description": "Tool description",
  "params": {}
}`;

function NewToolModal({ onClose, onCreate }: NewToolModalProps) {
  const [toolName, setToolName] = useState('');
  const [resource, setResource] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    if (val.trim() && !isValidJson(val)) {
      setJsonError('JSON invalido');
    } else {
      setJsonError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!toolName.trim()) {
      setFormError('O nome da tool e obrigatorio');
      return;
    }
    if (jsonError) return;

    setSaving(true);
    try {
      const parsedConfig = jsonText.trim() ? JSON.parse(jsonText) : {};
      await onCreate({
        tool_name: toolName.trim(),
        resource: resource.trim() || undefined,
        json_config: parsedConfig,
        submitted_by: submittedBy.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar tool';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-bg-secondary border border-border-default rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border-default">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-accent-primary" />
              <h2 className="text-base font-semibold text-text-primary">Nova Tool</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Tool Name */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                  Nome da Tool <span className="text-red-400">*</span>
                </label>
                <input
                  ref={firstRef}
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="ex: send_whatsapp_message"
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none transition-colors"
                />
              </div>

              {/* Resource */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                  Resource
                </label>
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  placeholder="ex: whatsapp, ghl, supabase"
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none transition-colors"
                />
              </div>

              {/* Submitted By */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                  Submitted by
                </label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  placeholder="ex: marcos"
                  className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none transition-colors"
                />
              </div>

              {/* JSON Config */}
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">
                  JSON Config
                </label>
                <textarea
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={8}
                  spellCheck={false}
                  placeholder={JSON_PLACEHOLDER}
                  className={`w-full font-mono text-sm bg-bg-tertiary border rounded-lg p-3 text-text-primary placeholder:text-text-muted resize-none outline-none transition-colors leading-relaxed ${
                    jsonError
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-border-default focus:border-accent-primary'
                  }`}
                />
                {jsonError && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {jsonError}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-border-default">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-bg-tertiary border border-border-default hover:border-text-muted text-text-secondary rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !!jsonError || !toolName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {saving ? 'Criando...' : 'Criar Tool'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ============================================
// FILTER SELECT
// ============================================

type FilterStatus = 'all' | ToolStatus;

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deprecated', label: 'Deprecated' },
];

// ============================================
// MAIN PAGE
// ============================================

export function AgentTools() {
  const { tools, loading, error, refetch, createTool, updateTool, deleteTool } = useAgentTools();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTool, setSelectedTool] = useState<AgentTool | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawer/modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showNewModal) { setShowNewModal(false); return; }
      if (selectedTool) { setSelectedTool(null); return; }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNewModal, selectedTool]);

  // Sync selected tool when tools update (uses id only to avoid loop)
  const selectedToolId = selectedTool?.id;
  useEffect(() => {
    if (!selectedToolId) return;
    const updated = tools.find((t) => t.id === selectedToolId);
    if (updated) setSelectedTool(updated);
  }, [tools, selectedToolId]);

  const filteredTools = useMemo(() => {
    let result = tools;
    if (filterStatus !== 'all') {
      result = result.filter((t) => t.status === filterStatus);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.tool_name.toLowerCase().includes(term) ||
          (t.resource || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [tools, filterStatus, search]);

  const handleSave = useCallback(
    async (id: string, updates: Partial<Pick<AgentTool, 'json_config' | 'status'>>) => {
      await updateTool(id, updates);
    },
    [updateTool]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTool(id);
    },
    [deleteTool]
  );

  const handleCreate = useCallback(
    async (input: {
      tool_name: string;
      resource?: string;
      json_config?: Record<string, unknown>;
      submitted_by?: string;
    }) => {
      await createTool(input);
    },
    [createTool]
  );

  // ---- Error state ----
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar tools</h2>
        <p className="text-text-muted max-w-md mb-6">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default hover:border-accent-primary rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-text-primary">
            <Wrench className="text-accent-primary" size={22} />
            Agent Tools
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Catalogo de ferramentas dos agentes com configuracao JSON editavel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 text-text-muted hover:text-accent-primary transition-colors bg-bg-secondary border border-border-default rounded-lg"
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nova Tool
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && <StatCards tools={tools} />}

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou resource..."
            className="w-full bg-bg-secondary border border-border-default rounded-lg px-3 pl-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none transition-colors"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-3 py-2 bg-bg-secondary border rounded-lg text-sm transition-colors ${
              filterStatus !== 'all'
                ? 'border-accent-primary text-accent-primary'
                : 'border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">
              {filterStatus === 'all'
                ? 'Status'
                : FILTER_OPTIONS.find((o) => o.value === filterStatus)?.label}
            </span>
            <ChevronDown size={12} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full mt-1 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-10 min-w-[130px] overflow-hidden">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setFilterStatus(opt.value); setFilterOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                    filterStatus === opt.value
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  {opt.value !== 'all' && <StatusBadge status={opt.value as ToolStatus} />}
                  {opt.value === 'all' && <span>{opt.label}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-bg-secondary border border-border-default rounded-full flex items-center justify-center text-text-muted mb-4">
            <Package size={28} />
          </div>
          <p className="text-text-secondary font-medium mb-1">
            {search || filterStatus !== 'all' ? 'Nenhuma tool encontrada' : 'Nenhuma tool cadastrada'}
          </p>
          <p className="text-text-muted text-sm">
            {search || filterStatus !== 'all'
              ? 'Tente ajustar a busca ou o filtro.'
              : 'Crie sua primeira tool clicando em "Nova Tool".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onClick={setSelectedTool}
            />
          ))}
        </div>
      )}

      {/* Result count */}
      {!loading && filteredTools.length > 0 && (
        <p className="text-xs text-text-muted text-center pb-2">
          {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} exibida{filteredTools.length !== 1 ? 's' : ''}
          {tools.length !== filteredTools.length && ` de ${tools.length} total`}
        </p>
      )}

      {/* Drawer */}
      {selectedTool && (
        <ToolDrawer
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* New Tool Modal */}
      {showNewModal && (
        <NewToolModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

export default AgentTools;
