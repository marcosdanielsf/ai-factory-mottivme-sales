import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Phone,
  BarChart3,
  Clock,
  Target,
  Power,
  Pencil,
  Trash2,
  X,
  Save,
  Eye,
  Variable,
  Loader2,
  MessageSquareText,
  Zap,
  RefreshCcw,
  ChevronDown,
  Copy,
} from 'lucide-react';
import {
  useColdCallPrompts,
  ColdCallPrompt,
  ColdCallPromptInsert,
  ColdCallPromptUpdate,
  PromptCategory,
} from '../hooks/useColdCallPrompts';
import { useToast } from '../hooks/useToast';

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<PromptCategory, { label: string; emoji: string; color: string; bgColor: string }> = {
  prospeccao: {
    label: 'Prospecção',
    emoji: '🎯',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
  },
  followup: {
    label: 'Follow-up',
    emoji: '🔄',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
  qualificacao: {
    label: 'Qualificação',
    emoji: '⭐',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  reativacao: {
    label: 'Reativação',
    emoji: '♻️',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
  },
};

const TABS: { key: string; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'prospeccao', label: 'Prospecção' },
  { key: 'followup', label: 'Follow-up' },
  { key: 'qualificacao', label: 'Qualificação' },
  { key: 'reativacao', label: 'Reativação' },
];

const EMPTY_PROMPT: ColdCallPromptInsert = {
  name: '',
  description: '',
  category: 'prospeccao',
  system_prompt: '',
  variables: {},
  voice_config: { speed: 1.0, pitch: 1.0 },
  is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

function formatRate(rate: number | null): string {
  if (rate == null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

/** Extract {variable} tokens from a prompt string */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1, -1)))];
}

/** Highlight {variables} in prompt text with accent color */
function highlightVariables(text: string): React.ReactNode[] {
  const parts = text.split(/(\{[^}]+\})/g);
  return parts.map((part, i) => {
    if (/^\{[^}]+\}$/.test(part)) {
      return (
        <span key={i} className="text-[#a371f7] font-semibold bg-purple-500/10 rounded px-0.5">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Replace {variables} in text with test values */
function replaceVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => vars[key] || match);
}

// ═══════════════════════════════════════════════════════════════════════
// SKELETON CARD
// ═══════════════════════════════════════════════════════════════════════

const SkeletonCard: React.FC = () => (
  <div className="bg-bg-secondary border border-border-default rounded-xl p-5 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-20 h-5 bg-bg-tertiary rounded-full" />
        <div className="w-40 h-5 bg-bg-tertiary rounded" />
      </div>
      <div className="flex gap-2">
        <div className="w-14 h-6 bg-bg-tertiary rounded-full" />
        <div className="w-8 h-8 bg-bg-tertiary rounded-lg" />
      </div>
    </div>
    <div className="w-64 h-4 bg-bg-tertiary rounded mb-4" />
    <div className="h-px bg-border-default mb-3" />
    <div className="flex gap-4">
      <div className="w-20 h-4 bg-bg-tertiary rounded" />
      <div className="w-24 h-4 bg-bg-tertiary rounded" />
      <div className="w-20 h-4 bg-bg-tertiary rounded" />
    </div>
    <div className="mt-3 flex gap-2">
      <div className="w-24 h-5 bg-bg-tertiary rounded" />
      <div className="w-20 h-5 bg-bg-tertiary rounded" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════

const EmptyState: React.FC<{ category: string; onNew: () => void }> = ({ category, onNew }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-20 h-20 rounded-2xl bg-bg-secondary border border-border-default flex items-center justify-center mb-6">
      <MessageSquareText size={32} className="text-text-muted" />
    </div>
    <h3 className="text-lg font-semibold text-text-primary mb-2">
      {category === 'todos' ? 'Nenhum prompt cadastrado' : `Nenhum prompt de ${TABS.find(t => t.key === category)?.label ?? category}`}
    </h3>
    <p className="text-text-muted text-sm mb-6 max-w-md">
      Crie prompts para suas ligações cold call. Defina variáveis dinâmicas, configure voz e acompanhe métricas de uso.
    </p>
    <button
      onClick={onNew}
      className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
    >
      <Plus size={18} />
      Criar primeiro prompt
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// PROMPT CARD
// ═══════════════════════════════════════════════════════════════════════

interface PromptCardProps {
  prompt: ColdCallPrompt;
  onEdit: (prompt: ColdCallPrompt) => void;
  onToggle: (id: string, active: boolean) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onEdit, onToggle }) => {
  const cat = CATEGORY_CONFIG[prompt.category];
  const vars = extractVariables(prompt.system_prompt);
  const conversionPct = prompt.conversion_rate != null ? prompt.conversion_rate * 100 : null;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-5 hover:border-border-hover transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cat.bgColor} ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
          <h3 className="text-text-primary font-semibold truncate">{prompt.name}</h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(prompt.id, !prompt.is_active)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              prompt.is_active
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-bg-tertiary border-border-default text-text-muted hover:bg-bg-hover'
            }`}
            title={prompt.is_active ? 'Desativar' : 'Ativar'}
          >
            <Power size={12} />
            {prompt.is_active ? 'Ativo' : 'Inativo'}
          </button>
          <button
            onClick={() => onEdit(prompt)}
            className="p-2 rounded-lg bg-bg-tertiary/50 hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Description */}
      {prompt.description && (
        <p className="text-text-secondary text-sm mb-3 line-clamp-2">{prompt.description}</p>
      )}

      {/* Divider */}
      <div className="h-px bg-border-default mb-3" />

      {/* Metrics */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted mb-3">
        <span className="flex items-center gap-1.5">
          <BarChart3 size={13} className="text-accent-primary" />
          Usado: <span className="text-text-secondary font-medium">{prompt.usage_count}x</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-accent-warning" />
          Duração: <span className="text-text-secondary font-medium">{formatDuration(prompt.avg_duration_seconds)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Target size={13} className="text-accent-success" />
          Conv: <span className="text-text-secondary font-medium">{formatRate(prompt.conversion_rate)}</span>
        </span>
      </div>

      {/* Conversion mini progress bar */}
      {conversionPct != null && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-success rounded-full transition-all"
              style={{ width: `${Math.min(conversionPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Variables */}
      {vars.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {vars.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-purple-500/10 text-[#a371f7] border border-purple-500/15">
              {`{${v}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// DELETE CONFIRMATION DIALOG
// ═══════════════════════════════════════════════════════════════════════

interface DeleteDialogProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ name, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
    <div
      className="bg-bg-secondary border border-border-default rounded-xl p-6 max-w-md w-full shadow-xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <Trash2 size={18} className="text-accent-error" />
        </div>
        <div>
          <h3 className="text-text-primary font-semibold">Deletar prompt</h3>
          <p className="text-text-muted text-sm">Esta ação não pode ser desfeita.</p>
        </div>
      </div>
      <p className="text-text-secondary text-sm mb-6">
        Tem certeza que deseja deletar <span className="font-semibold text-text-primary">"{name}"</span>?
        Todas as métricas associadas serão perdidas.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-accent-error hover:bg-red-600 rounded-lg transition-colors"
        >
          Deletar
        </button>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// PROMPT EDITOR MODAL
// ═══════════════════════════════════════════════════════════════════════

interface PromptEditorModalProps {
  prompt: ColdCallPrompt | null; // null = creating new
  onSave: (data: ColdCallPromptInsert | ColdCallPromptUpdate, id?: string) => Promise<void>;
  onDelete: (id: string) => void;
  onClose: () => void;
  saving: boolean;
}

const PromptEditorModal: React.FC<PromptEditorModalProps> = ({ prompt, onSave, onDelete, onClose, saving }) => {
  const [name, setName] = useState(prompt?.name ?? '');
  const [description, setDescription] = useState(prompt?.description ?? '');
  const [category, setCategory] = useState<PromptCategory>(prompt?.category ?? 'prospeccao');
  const [systemPrompt, setSystemPrompt] = useState(prompt?.system_prompt ?? '');
  const [variables, setVariables] = useState<Record<string, string>>(prompt?.variables ?? {});
  const [voiceSpeed, setVoiceSpeed] = useState(prompt?.voice_config?.speed ?? 1.0);
  const [voicePitch, setVoicePitch] = useState(prompt?.voice_config?.pitch ?? 1.0);
  const [isActive, setIsActive] = useState(prompt?.is_active ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');

  const isEditing = prompt != null;

  // Auto-sync extracted variables with the variables map
  const detectedVars = useMemo(() => extractVariables(systemPrompt), [systemPrompt]);

  // Merge detected vars into current variable map (keep existing test values)
  const mergedVariables = useMemo(() => {
    const merged: Record<string, string> = {};
    for (const v of detectedVars) {
      merged[v] = variables[v] ?? '';
    }
    // Also keep manually added vars that aren't in the prompt yet
    for (const [k, val] of Object.entries(variables) as [string, string][]) {
      if (!(k in merged)) merged[k] = val;
    }
    return merged;
  }, [detectedVars, variables]);

  const previewText = useMemo(() => replaceVariables(systemPrompt, mergedVariables), [systemPrompt, mergedVariables]);

  const handleSave = async () => {
    const data: ColdCallPromptInsert = {
      name: name.trim(),
      description: description.trim() || null,
      category,
      system_prompt: systemPrompt,
      variables: mergedVariables,
      voice_config: { speed: voiceSpeed, pitch: voicePitch },
      is_active: isActive,
    };
    await onSave(data, prompt?.id);
  };

  const addVariable = () => {
    const key = newVarKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!key || key in mergedVariables) return;
    setVariables(prev => ({ ...prev, [key]: '' }));
    setNewVarKey('');
  };

  const removeVariable = (key: string) => {
    setVariables(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateVariableValue = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const isValid = name.trim().length > 0 && systemPrompt.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 md:p-8" onClick={onClose}>
      <div
        className="bg-bg-secondary border border-border-default rounded-xl w-full max-w-4xl shadow-2xl my-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEditing ? 'Editar Prompt' : 'Novo Prompt'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-lg text-text-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Row: Name + Category + Active */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Nome do Prompt</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Prospecção Médicos"
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Categoria</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as PromptCategory)}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.emoji} {cfg.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-bg-tertiary border-border-default text-text-muted'
                }`}
              >
                <Power size={14} />
                {isActive ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrição do uso deste prompt..."
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors"
            />
          </div>

          {/* System Prompt Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-text-muted">System Prompt</label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  showPreview
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <Eye size={13} />
                Preview
              </button>
            </div>

            {!showPreview ? (
              <div className="relative">
                {/* Line numbers gutter */}
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-bg-tertiary/50 border-r border-border-default rounded-l-lg overflow-hidden pointer-events-none">
                  <div className="pt-3 px-1 text-right">
                    {(systemPrompt || '\n').split('\n').map((_, i) => (
                      <div key={i} className="text-[11px] leading-[1.625rem] text-text-muted/50 font-mono select-none">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="Você é um agente de vendas profissional da {empresa}. Seu objetivo é agendar uma reunião com {nome_lead}..."
                  rows={20}
                  className="w-full pl-12 pr-4 py-3 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted font-mono text-sm leading-relaxed focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 resize-y min-h-[400px] transition-colors"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                <pre className="font-mono text-sm leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
                  {previewText ? highlightVariables(previewText) : (
                    <span className="text-text-muted italic">Digite um prompt acima para ver a preview...</span>
                  )}
                </pre>
              </div>
            )}
          </div>

          {/* Variables Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Variable size={14} className="text-[#a371f7]" />
              <label className="text-xs font-medium text-text-muted">Variáveis Dinâmicas</label>
              <span className="text-xs text-text-muted/60">({Object.keys(mergedVariables).length})</span>
            </div>

            <div className="space-y-2">
              {Object.entries(mergedVariables).map(([key, val]) => {
                const isDetected = detectedVars.includes(key);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[140px] px-2.5 py-1.5 rounded font-mono text-xs bg-purple-500/10 text-[#a371f7] border border-purple-500/15">
                      {`{${key}}`}
                      {isDetected && <Zap size={10} className="ml-1 text-[#a371f7]/60" />}
                    </span>
                    <input
                      type="text"
                      value={val}
                      onChange={e => updateVariableValue(key, e.target.value)}
                      placeholder="Valor de teste..."
                      className="flex-1 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted text-xs focus:outline-none focus:border-accent-primary transition-colors"
                    />
                    {!isDetected && (
                      <button
                        onClick={() => removeVariable(key)}
                        className="p-1.5 hover:bg-bg-hover rounded text-text-muted hover:text-accent-error transition-colors"
                        title="Remover variável"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add variable */}
            <div className="flex items-center gap-2 mt-3">
              <input
                type="text"
                value={newVarKey}
                onChange={e => setNewVarKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addVariable()}
                placeholder="nome_variavel"
                className="w-40 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted font-mono text-xs focus:outline-none focus:border-accent-primary transition-colors"
              />
              <button
                onClick={addVariable}
                disabled={!newVarKey.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#a371f7] bg-purple-500/10 border border-purple-500/15 rounded-lg hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={13} />
                Adicionar
              </button>
            </div>
          </div>

          {/* Voice Config */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-3">Configuração de Voz</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Velocidade</span>
                  <span className="text-xs text-text-secondary font-mono">{voiceSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={voiceSpeed}
                  onChange={e => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-bg-tertiary rounded-full appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Tom</span>
                  <span className="text-xs text-text-secondary font-mono">{voicePitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={voicePitch}
                  onChange={e => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-bg-tertiary rounded-full appearance-none cursor-pointer accent-accent-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-default">
          <div>
            {isEditing && (
              <button
                onClick={() => onDelete(prompt!.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-accent-error hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Deletar
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-accent-primary hover:bg-blue-500 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export const ColdCallPrompts: React.FC = () => {
  const { prompts, loading, error, refetch, createPrompt, updatePrompt, deletePrompt, toggleActive } = useColdCallPrompts();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('todos');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<ColdCallPrompt | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Filtered prompts
  const filtered = useMemo(() => {
    let result = prompts;

    if (activeTab !== 'todos') {
      result = result.filter(p => p.category === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          p.system_prompt.toLowerCase().includes(q)
      );
    }

    return result;
  }, [prompts, activeTab, search]);

  // Counts per tab
  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: prompts.length };
    for (const p of prompts) {
      c[p.category] = (c[p.category] ?? 0) + 1;
    }
    return c;
  }, [prompts]);

  const openNew = useCallback(() => {
    setEditingPrompt(null);
    setEditorOpen(true);
  }, []);

  const openEdit = useCallback((p: ColdCallPrompt) => {
    setEditingPrompt(p);
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(async (data: ColdCallPromptInsert | ColdCallPromptUpdate, id?: string) => {
    setSaving(true);
    try {
      if (id) {
        const result = await updatePrompt(id, data);
        if (result) {
          showToast('Prompt atualizado com sucesso', 'success');
          setEditorOpen(false);
        } else {
          showToast('Erro ao atualizar prompt', 'error');
        }
      } else {
        const result = await createPrompt(data as ColdCallPromptInsert);
        if (result) {
          showToast('Prompt criado com sucesso', 'success');
          setEditorOpen(false);
        } else {
          showToast('Erro ao criar prompt', 'error');
        }
      }
    } finally {
      setSaving(false);
    }
  }, [createPrompt, updatePrompt, showToast]);

  const handleDeleteRequest = useCallback((id: string) => {
    const p = prompts.find(x => x.id === id);
    if (p) setDeleteTarget({ id: p.id, name: p.name });
  }, [prompts]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const ok = await deletePrompt(deleteTarget.id);
    if (ok) {
      showToast('Prompt deletado', 'success');
      setEditorOpen(false);
    } else {
      showToast('Erro ao deletar prompt', 'error');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deletePrompt, showToast]);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    const ok = await toggleActive(id, active);
    if (ok) {
      showToast(active ? 'Prompt ativado' : 'Prompt desativado', 'info');
    }
  }, [toggleActive, showToast]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Phone size={22} className="text-accent-primary" />
            Prompts Cold Call
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Gerencie os prompts usados nas ligações automatizadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            className="p-2.5 bg-bg-secondary border border-border-default rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Atualizar"
          >
            <RefreshCcw size={16} />
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-500/10"
          >
            <Plus size={16} />
            Novo Prompt
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar prompts por nome, descrição ou conteúdo..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover border border-transparent'
              }`}
            >
              {tab.label}
              <span className={`text-xs ${isActive ? 'text-accent-primary/70' : 'text-text-muted/50'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-accent-error text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState category={activeTab} onNew={openNew} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(p => (
            <PromptCard key={p.id} prompt={p} onEdit={openEdit} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <PromptEditorModal
          prompt={editingPrompt}
          onSave={handleSave}
          onDelete={handleDeleteRequest}
          onClose={() => setEditorOpen(false)}
          saving={saving}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ColdCallPrompts;
