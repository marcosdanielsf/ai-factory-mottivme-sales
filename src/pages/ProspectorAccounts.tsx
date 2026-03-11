/**
 * ProspectorAccounts.tsx
 * Gestão de contas LinkedIn conectadas ao sistema de automação
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Linkedin,
  Plus,
  Trash2,
  Pause,
  Play,
  ShieldCheck,
  X,
  Loader2,
  Info,
  Clock,
  Send,
  UserPlus,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { prospectorApi } from '../lib/prospector-api';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type AccountStatus = 'ativa' | 'expirada' | 'pausada';

// Map DB status (english) to frontend status (portuguese)
const mapDbStatus = (dbStatus: string): AccountStatus => {
  const map: Record<string, AccountStatus> = {
    active: 'ativa',
    paused: 'pausada',
    invalid: 'expirada',
    banned: 'expirada',
    // Already in PT (from frontend writes)
    ativa: 'ativa',
    pausada: 'pausada',
    expirada: 'expirada',
  };
  return map[dbStatus] || 'expirada';
};

interface LPAccount {
  id: string;
  name: string;
  email?: string;
  status: AccountStatus;
  last_used_at?: string;
  invites_today: number;
  messages_today: number;
  daily_invite_limit: number;
  daily_message_limit: number;
  automation_start_hour: number;
  automation_end_hour: number;
  pause_weekends: boolean;
  li_at?: string;
  jsessionid?: string;
  created_at: string;
  updated_at: string;
}

interface AutomationConfig {
  start_hour: number;
  end_hour: number;
  daily_invite_limit: number;
  daily_message_limit: number;
  pause_weekends: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const statusConfig = {
  ativa:    { label: '🟢 Ativa',    color: 'text-[#3fb950]', bg: 'bg-[#3fb950]/10 border-[#3fb950]/30' },
  expirada: { label: '🔴 Expirada', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/30' },
  pausada:  { label: '🟡 Pausada',  color: 'text-[#f97316]', bg: 'bg-[#f97316]/10 border-[#f97316]/30' },
};

const formatUsageBar = (used: number, limit: number) => {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct >= 90 ? 'bg-[#ef4444]' : pct >= 70 ? 'bg-[#f97316]' : 'bg-[#3fb950]';
  return { pct, color };
};

// ═══════════════════════════════════════════════════════════════════════
// USAGE BAR
// ═══════════════════════════════════════════════════════════════════════

interface UsageBarProps {
  used: number;
  limit: number;
  label: string;
  icon: React.ReactNode;
}

const UsageBar = ({ used, limit, label, icon }: UsageBarProps) => {
  const { pct, color } = formatUsageBar(used, limit);
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-[#8b949e] mb-1">
        <span className="flex items-center gap-1">{icon}{label}</span>
        <span>{used} / {limit}</span>
      </div>
      <div className="w-full h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ACCOUNT CARD
// ═══════════════════════════════════════════════════════════════════════

interface AccountCardProps {
  account: LPAccount;
  onValidate: (id: string) => Promise<void>;
  onTogglePause: (id: string, current: AccountStatus) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  loading: string | null;
}

const AccountCard = ({ account, onValidate, onTogglePause, onRemove, loading }: AccountCardProps) => {
  const s = statusConfig[account.status] || statusConfig.expirada;
  const isLoading = loading === account.id;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff]/20 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0a66c2]/20 border border-[#0a66c2]/30 flex items-center justify-center flex-shrink-0">
            <Linkedin size={18} className="text-[#0a66c2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{account.name}</h3>
            {account.email && (
              <p className="text-xs text-[#8b949e]">{account.email}</p>
            )}
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
          {s.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2 mb-3">
        <UsageBar
          used={account.invites_today}
          limit={account.daily_invite_limit}
          label="Convites hoje"
          icon={<UserPlus size={10} />}
        />
        <UsageBar
          used={account.messages_today}
          limit={account.daily_message_limit}
          label="Msgs hoje"
          icon={<Send size={10} />}
        />
      </div>

      {/* Last used */}
      {account.last_used_at && (
        <p className="text-[10px] text-[#8b949e] flex items-center gap-1 mb-3">
          <Clock size={10} />
          Último uso: {formatDistanceToNow(new Date(account.last_used_at), { locale: ptBR, addSuffix: true })}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#21262d]">
        <button
          onClick={() => onValidate(account.id)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1117] hover:bg-[#58a6ff]/10 border border-[#30363d] hover:border-[#58a6ff]/40 text-[#8b949e] hover:text-[#58a6ff] rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
          Validar
        </button>

        {account.status !== 'expirada' && (
          <button
            onClick={() => onTogglePause(account.id, account.status)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-colors disabled:opacity-50 ${
              account.status === 'pausada'
                ? 'bg-[#3fb950]/10 hover:bg-[#3fb950]/20 border-[#3fb950]/30 text-[#3fb950]'
                : 'bg-[#f97316]/10 hover:bg-[#f97316]/20 border-[#f97316]/30 text-[#f97316]'
            }`}
          >
            {account.status === 'pausada' ? (
              <><Play size={12} /> Retomar</>
            ) : (
              <><Pause size={12} /> Pausar</>
            )}
          </button>
        )}

        <button
          onClick={() => onRemove(account.id)}
          disabled={isLoading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ef4444] rounded text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Trash2 size={12} /> Remover
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// CONNECT MODAL
// ═══════════════════════════════════════════════════════════════════════

interface ConnectModalProps {
  onClose: () => void;
  onConnect: (data: { li_at: string; jsessionid: string; name: string }) => Promise<void>;
  connecting: boolean;
}

const ConnectModal = ({ onClose, onConnect, connecting }: ConnectModalProps) => {
  const [form, setForm] = useState({ li_at: '', jsessionid: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.li_at.trim() || !form.name.trim()) return;
    await onConnect(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <Linkedin size={18} className="text-[#0a66c2]" />
            <h3 className="text-base font-semibold text-white">Conectar Conta LinkedIn</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#0d1117] rounded text-[#8b949e] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Instructions */}
          <div className="bg-[#0d1117] border border-[#58a6ff]/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-[#58a6ff]" />
              <span className="text-xs font-semibold text-[#58a6ff]">Como obter os cookies do LinkedIn</span>
            </div>
            <ol className="space-y-2 text-xs text-[#8b949e]">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">1</span>
                <span>Abra <strong className="text-white">linkedin.com</strong> e faça login na conta desejada</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">2</span>
                <span>Pressione <kbd className="bg-[#21262d] text-white px-1 rounded text-[10px]">F12</kbd> para abrir o DevTools</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">3</span>
                <span>Acesse a aba <strong className="text-white">Application</strong> → <strong className="text-white">Cookies</strong> → <code className="text-[#58a6ff]">linkedin.com</code></span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-[#58a6ff]/20 text-[#58a6ff] flex items-center justify-center flex-shrink-0 font-bold text-[10px]">4</span>
                <span>Copie os valores de <code className="text-[#a371f7]">li_at</code> e <code className="text-[#a371f7]">JSESSIONID</code> e cole abaixo</span>
              </li>
            </ol>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                Nome da conta *
              </label>
              <input
                type="text"
                placeholder="Ex: Marcos - Conta Principal"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                Cookie <code className="text-[#a371f7]">li_at</code> *
              </label>
              <input
                type="text"
                placeholder="AQEDATxxxx..."
                value={form.li_at}
                onChange={e => setForm(f => ({ ...f, li_at: e.target.value }))}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-1">
                Cookie <code className="text-[#a371f7]">JSESSIONID</code>
              </label>
              <input
                type="text"
                placeholder="ajax:xxxx..."
                value={form.jsessionid}
                onChange={e => setForm(f => ({ ...f, jsessionid: e.target.value }))}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none font-mono"
              />
            </div>

            {/* Warning */}
            <div className="bg-[#f97316]/10 border border-[#f97316]/20 rounded-lg p-3 flex items-start gap-2">
              <Info size={13} className="text-[#f97316] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#f97316]">
                Os cookies expiram periodicamente. Nunca compartilhe esses valores com terceiros.
                A conta será validada automaticamente após a conexão.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#30363d]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-[#8b949e] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={connecting || !form.li_at.trim() || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {connecting
                  ? <><Loader2 size={16} className="animate-spin" /> Conectando…</>
                  : <><ShieldCheck size={16} /> Conectar & Validar</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// AUTOMATION CONFIG PANEL
// ═══════════════════════════════════════════════════════════════════════

interface AutomationPanelProps {
  config: AutomationConfig;
  onChange: (config: AutomationConfig) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  saved: boolean;
}

const AutomationPanel = ({ config, onChange, onSave, saving, saved }: AutomationPanelProps) => (
  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 space-y-5">

    {/* Time window */}
    <div>
      <label className="block text-xs font-bold text-[#8b949e] uppercase tracking-wider mb-2">
        Janela de automação
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-[10px] text-[#8b949e] mb-1">Início</label>
          <select
            value={config.start_hour}
            onChange={e => onChange({ ...config, start_hour: Number(e.target.value) })}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
        <span className="text-[#8b949e] text-sm mt-5">→</span>
        <div className="flex-1">
          <label className="block text-[10px] text-[#8b949e] mb-1">Fim</label>
          <select
            value={config.end_hour}
            onChange={e => onChange({ ...config, end_hour: Number(e.target.value) })}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white focus:border-[#58a6ff] focus:outline-none"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
        </div>
      </div>
    </div>

    {/* Daily invite limit */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus size={11} />Limite diário de convites
        </label>
        <span className="text-sm font-semibold text-[#58a6ff]">{config.daily_invite_limit}</span>
      </div>
      <input
        type="range"
        min={20}
        max={100}
        step={5}
        value={config.daily_invite_limit}
        onChange={e => onChange({ ...config, daily_invite_limit: Number(e.target.value) })}
        className="w-full accent-[#58a6ff]"
      />
      <div className="flex justify-between text-[10px] text-[#8b949e] mt-0.5">
        <span>20 (conservador)</span>
        <span>100 (máximo)</span>
      </div>
    </div>

    {/* Daily message limit */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
          <Send size={11} />Limite diário de mensagens
        </label>
        <span className="text-sm font-semibold text-[#58a6ff]">{config.daily_message_limit}</span>
      </div>
      <input
        type="range"
        min={50}
        max={200}
        step={10}
        value={config.daily_message_limit}
        onChange={e => onChange({ ...config, daily_message_limit: Number(e.target.value) })}
        className="w-full accent-[#58a6ff]"
      />
      <div className="flex justify-between text-[10px] text-[#8b949e] mt-0.5">
        <span>50 (conservador)</span>
        <span>200 (máximo)</span>
      </div>
    </div>

    {/* Pause weekends */}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">Pausar fins de semana</p>
        <p className="text-xs text-[#8b949e] mt-0.5">A automação não roda sábado e domingo</p>
      </div>
      <button
        onClick={() => onChange({ ...config, pause_weekends: !config.pause_weekends })}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          config.pause_weekends ? 'bg-[#3fb950]' : 'bg-[#30363d]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
            config.pause_weekends ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>

    {/* Save */}
    <div className="flex justify-end pt-2 border-t border-[#30363d]">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
        {saved ? '✅ Salvo!' : 'Salvar configuração'}
      </button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ProspectorAccounts = () => {
  const [accounts, setAccounts] = useState<LPAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [savedAutomation, setSavedAutomation] = useState(false);

  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>({
    start_hour: 8,
    end_hour: 18,
    daily_invite_limit: 40,
    daily_message_limit: 100,
    pause_weekends: true,
  });

  // ── Fetch accounts ────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lp_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB fields to frontend interface
      const mapped: LPAccount[] = (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        name: (row.name as string) || (row.linkedin_email as string) || 'Conta LinkedIn',
        email: row.linkedin_email as string | undefined,
        status: mapDbStatus((row.status as string) || 'active'),
        last_used_at: (row.last_validated_at as string) || undefined,
        invites_today: (row.daily_invites_sent as number) || 0,
        messages_today: (row.daily_messages_sent as number) || 0,
        daily_invite_limit: 60,
        daily_message_limit: 100,
        automation_start_hour: 8,
        automation_end_hour: 18,
        pause_weekends: true,
        li_at: row.li_at as string | undefined,
        jsessionid: row.jsessionid as string | undefined,
        created_at: row.created_at as string,
        updated_at: (row.created_at as string) || new Date().toISOString(),
      }));

      setAccounts(mapped);

      // Load automation config from first account (global config)
      if (mapped.length > 0) {
        setAutomationConfig({
          start_hour:           mapped[0].automation_start_hour ?? 8,
          end_hour:             mapped[0].automation_end_hour ?? 18,
          daily_invite_limit:   mapped[0].daily_invite_limit ?? 40,
          daily_message_limit:  mapped[0].daily_message_limit ?? 100,
          pause_weekends:       mapped[0].pause_weekends ?? true,
        });
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Actions ──────────────────────────────────────────────────────

  const handleValidate = useCallback(async (id: string) => {
    try {
      setActionLoading(id);
      await prospectorApi.validateAccount(id);
      await supabase
        .from('lp_accounts')
        .update({ status: 'ativa', updated_at: new Date().toISOString() })
        .eq('id', id);
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'ativa' } : a));
    } catch (err) {
      console.error('Error validating account:', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleTogglePause = useCallback(async (id: string, current: AccountStatus) => {
    const newStatus: AccountStatus = current === 'pausada' ? 'ativa' : 'pausada';
    try {
      setActionLoading(id);
      await supabase
        .from('lp_accounts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Error toggling pause:', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta conta? Esta ação não pode ser desfeita.')) return;
    try {
      setActionLoading(id);
      await prospectorApi.deleteAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error removing account:', err);
    } finally {
      setActionLoading(null);
    }
  }, []);

  const handleConnect = useCallback(async (data: { li_at: string; jsessionid: string; name: string }) => {
    try {
      setConnecting(true);

      // Create account via API
      const inserted = await prospectorApi.createAccount({
        name: data.name,
        li_at: data.li_at,
        jsessionid: data.jsessionid,
      }) as { id?: string } | null;

      // Try to validate immediately
      if (inserted?.id) {
        await prospectorApi.validateAccount(inserted.id).catch(() => {});
      }

      setShowConnect(false);
      await fetchAccounts();
    } catch (err) {
      console.error('Error connecting account:', err);
    } finally {
      setConnecting(false);
    }
  }, [fetchAccounts]);

  const handleSaveAutomation = useCallback(async () => {
    try {
      setSavingAutomation(true);
      // Apply to all accounts
      if (accounts.length > 0) {
        await supabase
          .from('lp_accounts')
          .update({
            automation_start_hour:  automationConfig.start_hour,
            automation_end_hour:    automationConfig.end_hour,
            daily_invite_limit:     automationConfig.daily_invite_limit,
            daily_message_limit:    automationConfig.daily_message_limit,
            pause_weekends:         automationConfig.pause_weekends,
            updated_at: new Date().toISOString(),
          });
      }
      setSavedAutomation(true);
      setTimeout(() => setSavedAutomation(false), 2000);
    } catch (err) {
      console.error('Error saving automation config:', err);
    } finally {
      setSavingAutomation(false);
    }
  }, [automationConfig, accounts]);

  // ── Summary stats ────────────────────────────────────────────────

  const totalActive    = accounts.filter(a => a.status === 'ativa').length;
  const totalExpired   = accounts.filter(a => a.status === 'expirada').length;
  const totalInvites   = accounts.reduce((s, a) => s + a.invites_today, 0);
  const totalMessages  = accounts.reduce((s, a) => s + a.messages_today, 0);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Linkedin size={26} className="text-[#0a66c2]" />
            <div>
              <h1 className="text-2xl font-semibold text-white">Contas LinkedIn</h1>
              <p className="text-sm text-[#8b949e] mt-0.5">Gerencie as contas conectadas à automação</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAccounts}
              className="p-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-[#8b949e] hover:text-white transition-colors"
              title="Recarregar"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Conectar Conta
            </button>
          </div>
        </div>

        {/* ── SUMMARY STATS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Contas ativas',    value: totalActive,   color: 'text-[#3fb950]' },
            { label: 'Contas expiradas', value: totalExpired,  color: 'text-[#ef4444]' },
            { label: 'Convites hoje',    value: totalInvites,  color: 'text-[#58a6ff]' },
            { label: 'Msgs hoje',        value: totalMessages, color: 'text-[#a371f7]' },
          ].map(s => (
            <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#8b949e] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── ACCOUNTS LIST ───────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4">
            Contas conectadas ({accounts.length})
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#21262d]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-[#21262d] rounded w-3/4" />
                      <div className="h-2 bg-[#21262d] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-2 bg-[#21262d] rounded" />
                    <div className="h-2 bg-[#21262d] rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-[#21262d] rounded" />
                    <div className="h-8 w-20 bg-[#21262d] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-[#0a66c2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Linkedin size={32} className="text-[#0a66c2]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Nenhuma conta conectada</h3>
              <p className="text-sm text-[#8b949e] mb-4">
                Conecte uma conta LinkedIn para começar a automação
              </p>
              <button
                onClick={() => setShowConnect(true)}
                className="px-6 py-2 bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Conectar Primeira Conta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onValidate={handleValidate}
                  onTogglePause={handleTogglePause}
                  onRemove={handleRemove}
                  loading={actionLoading}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── AUTOMATION CONFIG ────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings size={14} />
            Configuração de Automação
            <span className="text-[10px] font-normal text-[#8b949e] normal-case tracking-normal">
              (aplicado a todas as contas)
            </span>
          </h2>

          <AutomationPanel
            config={automationConfig}
            onChange={setAutomationConfig}
            onSave={handleSaveAutomation}
            saving={savingAutomation}
            saved={savedAutomation}
          />
        </section>

      </div>

      {/* ── CONNECT MODAL ──────────────────────────────────────────── */}
      {showConnect && (
        <ConnectModal
          onClose={() => setShowConnect(false)}
          onConnect={handleConnect}
          connecting={connecting}
        />
      )}
    </div>
  );
};

export default ProspectorAccounts;
