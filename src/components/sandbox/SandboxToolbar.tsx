import { Save, Trash2, History, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AgentMode, AGENT_MODES, SandboxSession } from '../../hooks/useSandboxChat';

interface SandboxToolbarProps {
  currentMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  onSave: () => void;
  onClear: () => void;
  onLoadSession: (id: string) => void;
  sessions: SandboxSession[];
  tokenCount: number;
}

const MODE_LABELS: Record<AgentMode, string> = {
  sdr_inbound: 'SDR Inbound',
  social_seller_instagram: 'Social Seller IG',
  followuper: 'Follow Up',
  concierge: 'Concierge',
  scheduler: 'Agendador',
  rescheduler: 'Reagendador',
  objection_handler: 'Objeções',
  reativador_base: 'Reativação',
  customersuccess: 'Customer Success',
};

export function SandboxToolbar({
  currentMode,
  onModeChange,
  onSave,
  onClear,
  onLoadSession,
  sessions,
  tokenCount,
}: SandboxToolbarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    if (showHistory) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showHistory]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-900 shrink-0">
      {/* Mode selector */}
      <select
        value={currentMode}
        onChange={e => onModeChange(e.target.value as AgentMode)}
        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {AGENT_MODES.map(mode => (
          <option key={mode} value={mode}>
            {MODE_LABELS[mode]}
          </option>
        ))}
      </select>

      {/* Token badge */}
      <span className="text-[10px] text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded whitespace-nowrap">
        ~{tokenCount.toLocaleString()} tokens
      </span>

      {/* History */}
      <div className="relative" ref={historyRef}>
        <button
          onClick={() => setShowHistory(prev => !prev)}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          title="Sessões salvas"
        >
          <History size={14} />
        </button>
        {showHistory && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-700">
              Sessões salvas
            </div>
            <div className="max-h-48 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="px-3 py-4 text-xs text-zinc-500 text-center">Nenhuma sessão salva</p>
              ) : (
                sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onLoadSession(s.id); setShowHistory(false); }}
                    className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors"
                  >
                    <div className="text-xs text-zinc-200 truncate">{s.session_name}</div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                      <span>{MODE_LABELS[s.mode as AgentMode] || s.mode}</span>
                      <span>•</span>
                      <span>{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
        title="Salvar sessão"
      >
        <Save size={14} />
      </button>

      {/* Clear */}
      <button
        onClick={onClear}
        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
        title="Limpar conversa"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
