import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Bot,
  Send,
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Zap,
  DollarSign,
  Phone,
  AlertTriangle,
  X,
  CheckCircle,
  Search,
  BarChart3,
  RefreshCw,
  Power,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useJarvis, JARVIS_QUICK_ACTIONS } from '../../components/Jarvis/JarvisContext';
import { useMegazordTTS } from '../../components/Jarvis/JarvisVoice';
import type { JarvisAlert, JarvisVoiceState } from '../../components/Jarvis/types';
import JarvisBootScreen from './JarvisBootScreen';
import JarvisParticles from './JarvisParticles';
import { JarvisWaveform } from './JarvisWaveform';
import JarvisTimeline from './JarvisTimeline';
import JarvisFunnel from './JarvisFunnel';
import JarvisCostBreakdown from './JarvisCostBreakdown';
import JarvisMegazordHead from './JarvisMegazordHead';

// ─── Speech Recognition Types ─────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

function hasSpeechRecognition(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Metrics {
  leadsHoje: number;
  hotLeads: number;
  custoHoje: number;
  coldCallsHoje: number;
}

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  is_active: boolean;
  total_cost?: number;
}

// ─── useCountUp Hook ──────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevTarget.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

// ─── HUD Corner Decoration ────────────────────────────────────────────────────

function HUDCorners({ className = '' }: { className?: string }) {
  const c = '#00d4ff';
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/* Top-left */}
      <polyline points="0,8 0,0 8,0" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" vectorEffect="non-scaling-stroke" />
      {/* Top-right */}
      <polyline points="92,0 100,0 100,8" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" vectorEffect="non-scaling-stroke" />
      {/* Bottom-left */}
      <polyline points="0,92 0,100 8,100" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" vectorEffect="non-scaling-stroke" />
      {/* Bottom-right */}
      <polyline points="92,100 100,100 100,92" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ─── HUD Card ─────────────────────────────────────────────────────────────────

function HUDCard({
  children,
  className = '',
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  // Detect if caller wants flex layout (for scrollable children)
  const isFlex = className.includes('flex');
  return (
    <div
      className={`relative border border-[rgba(59,130,246,0.2)] rounded-lg bg-bg-secondary ${glow ? 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''} ${className}`}
    >
      <HUDCorners />
      <div className={`relative z-10 ${isFlex ? 'flex flex-col min-h-0 h-full overflow-hidden' : ''}`}>{children}</div>
    </div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <HUDCard
      className={`p-3 ${highlight ? 'border-accent-warning/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : ''}`}
      glow
    >
      {/* Scan line animation */}
      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={color} />
        <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </HUDCard>
  );
}

// ─── Scanline Loading ─────────────────────────────────────────────────────────

function ScanlineLoading() {
  return (
    <div className="flex flex-col gap-1 px-3 py-3">
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          className="h-1 rounded-full bg-[#00d4ff]/30 animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Agent['status'] }) {
  const config: Record<Agent['status'], { label: string; color: string; dot: string }> = {
    active:  { label: 'ATIVO',    color: 'text-accent-success', dot: 'bg-accent-success' },
    idle:    { label: 'IDLE',     color: 'text-accent-warning', dot: 'bg-accent-warning' },
    error:   { label: 'ERRO',     color: 'text-accent-error',   dot: 'bg-accent-error' },
    offline: { label: 'OFFLINE',  color: 'text-text-muted',     dot: 'bg-text-muted' },
  };
  const { label, color, dot } = config[status] ?? config.offline;
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Left Column ──────────────────────────────────────────────────────────────

function LeftColumn({
  metrics,
  agents,
  loadingMetrics,
  onToggleAgent,
  lastSync,
}: {
  metrics: Metrics;
  agents: Agent[];
  loadingMetrics: boolean;
  onToggleAgent: (agent: Agent) => void;
  lastSync: Date | null;
}) {
  const animatedLeads = useCountUp(metrics.leadsHoje);
  const animatedHot = useCountUp(metrics.hotLeads);
  const animatedColdCalls = useCountUp(metrics.coldCallsHoje);

  return (
    <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto p-3 hidden lg:flex">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon={Users}
          label="Leads Hoje"
          value={loadingMetrics ? '—' : animatedLeads}
          color="text-accent-success"
        />
        <MetricCard
          icon={Zap}
          label="Hot Leads"
          value={loadingMetrics ? '—' : animatedHot}
          color={metrics.hotLeads > 0 ? 'text-accent-warning' : 'text-text-muted'}
          highlight={metrics.hotLeads > 0}
        />
        <MetricCard
          icon={DollarSign}
          label="Custo IA"
          value={loadingMetrics ? '—' : `$${metrics.custoHoje.toFixed(2)}`}
          color="text-[#00d4ff]"
        />
        <MetricCard
          icon={Phone}
          label="Cold Calls"
          value={loadingMetrics ? '—' : animatedColdCalls}
          color="text-[#00d4ff]"
        />
      </div>
      <p className="text-[10px] text-text-muted text-center">
        Última sync: {lastSync ? lastSync.toLocaleTimeString('pt-BR') : '—'}
      </p>

      {/* Agents List */}
      <HUDCard className="flex flex-col min-h-0 max-h-[300px]" glow>
        <div className="px-3 pt-3 pb-2 border-b border-[rgba(59,130,246,0.15)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={14} style={{ color: '#00d4ff' }} />
            <span className="text-xs font-semibold tracking-widest text-text-secondary uppercase">Agentes</span>
          </div>
          {agents.length > 0 && (
            <span className="text-[10px] text-text-muted">{agents.filter(a => a.is_active).length}/{agents.length} ativos</span>
          )}
        </div>
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 overflow-y-auto divide-y divide-[rgba(59,130,246,0.08)] scrollbar-thin">
            {agents.length === 0 ? (
              <p className="text-xs text-text-muted p-3 text-center">Carregando agentes...</p>
            ) : (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate font-medium">{agent.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={agent.status} />
                      {agent.total_cost !== undefined && (
                        <span className="text-[10px] text-text-muted">${agent.total_cost.toFixed(3)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleAgent(agent)}
                    title={agent.is_active ? 'Desativar' : 'Ativar'}
                    className={`p-1.5 rounded-md transition-colors ${
                      agent.is_active
                        ? 'text-accent-success hover:bg-accent-error/10 hover:text-accent-error'
                        : 'text-text-muted hover:bg-accent-success/10 hover:text-accent-success'
                    }`}
                  >
                    <Power size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          {/* Scroll fade indicator */}
          {agents.length > 5 && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-bg-secondary to-transparent pointer-events-none z-10" />
          )}
        </div>
      </HUDCard>

      {/* Funil de Vendas */}
      <HUDCard className="p-3" glow>
        <JarvisFunnel />
      </HUDCard>

      {/* Custos por Agente */}
      <HUDCard className="p-3" glow>
        <JarvisCostBreakdown />
      </HUDCard>
    </div>
  );
}

// ─── Chat Column ──────────────────────────────────────────────────────────────

function ChatColumn({
  voiceState,
  speechSupported,
  onToggleVoice,
  ttsEnabled,
  isSpeaking,
  onToggleTts,
  onStopSpeaking,
}: {
  voiceState: JarvisVoiceState;
  speechSupported: boolean;
  onToggleVoice: () => void;
  ttsEnabled: boolean;
  isSpeaking: boolean;
  onToggleTts: () => void;
  onStopSpeaking: () => void;
}) {
  const { messages, sendToJarvis, cancelProcessing, isProcessing } = useJarvis();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText('');
    await sendToJarvis(text);
  }, [inputText, isProcessing, sendToJarvis]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 p-3">
      <HUDCard className="flex-1 flex flex-col min-h-0" glow>
        {/* Chat header */}
        <div className="px-4 py-2.5 border-b border-[rgba(59,130,246,0.15)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span style={{ color: '#00d4ff' }} className="font-bold text-sm tracking-wider">⬡ JARVIS</span>
            <span className="text-xs text-text-muted">Interface Neural</span>
          </div>
          <div className="flex items-center gap-1">
            {/* TTS Toggle */}
            <button
              onClick={isSpeaking ? onStopSpeaking : onToggleTts}
              className={`p-1.5 rounded-md transition-colors ${
                isSpeaking
                  ? 'text-[#00d4ff] animate-pulse hover:bg-bg-hover'
                  : ttsEnabled
                  ? 'text-[#00d4ff] hover:bg-bg-hover'
                  : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
              }`}
              title={isSpeaking ? 'Parar voz' : ttsEnabled ? 'Voz ativa' : 'Ativar voz'}
            >
              {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div style={{ color: '#00d4ff' }} className="text-4xl">⬡</div>
              <p className="text-sm text-text-muted">
                Sistemas online. Aguardando comandos.
              </p>
              <p className="text-xs text-text-muted opacity-60">
                Use os atalhos rápidos ou escreva sua solicitação.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'jarvis' && (
                  <span className="mr-2 mt-1 shrink-0 text-sm" style={{ color: '#00d4ff' }}>⬡</span>
                )}
                <div
                  className={`max-w-[80%] rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'ml-8 bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.25)] text-text-primary px-4 py-2'
                      : 'mr-8 bg-bg-tertiary border border-[rgba(59,130,246,0.1)] text-text-primary px-4 py-2'
                  }`}
                >
                  {msg.role === 'jarvis' && (
                    <span className="text-[10px] font-bold tracking-widest block mb-1" style={{ color: '#00d4ff' }}>
                      JARVIS:
                    </span>
                  )}
                  {msg.loading ? <ScanlineLoading /> : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="border-t border-[rgba(59,130,246,0.1)] px-4 py-2 shrink-0">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {JARVIS_QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => !isProcessing && sendToJarvis(action)}
                disabled={isProcessing}
                className="shrink-0 rounded-full bg-bg-tertiary border border-[rgba(59,130,246,0.2)] px-3 py-1 text-xs text-text-muted hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.4)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div
          className={`flex items-center gap-2 px-4 py-3 border-t shrink-0 transition-colors ${
            voiceState === 'listening'
              ? 'border-accent-success/50 bg-accent-success/5'
              : 'border-[rgba(59,130,246,0.15)]'
          }`}
        >
          {speechSupported && (
            <button
              onClick={onToggleVoice}
              className={`shrink-0 p-2 rounded-lg transition-colors ${
                voiceState === 'listening'
                  ? 'bg-accent-success/20 text-accent-success animate-pulse'
                  : 'bg-bg-tertiary text-text-muted hover:bg-bg-hover hover:text-text-primary'
              }`}
              title={voiceState === 'listening' ? 'Parar' : 'Voz'}
            >
              {voiceState === 'listening' ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceState === 'listening' ? 'Ouvindo...' : isProcessing ? 'Processando... clique ■ para parar' : 'Envie um comando ao JARVIS...'}
            className={`flex-1 rounded-lg border bg-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors disabled:opacity-50 ${
              voiceState === 'listening'
                ? 'border-accent-success/40 focus:ring-1 focus:ring-accent-success/30'
                : 'border-border-default focus:ring-1 focus:ring-[rgba(0,212,255,0.3)]'
            }`}
          />
          {isProcessing ? (
            <button
              onClick={cancelProcessing}
              className="shrink-0 p-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
              title="Parar"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="shrink-0 p-2 rounded-lg text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #00d4ff)' }}
              title="Enviar"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </HUDCard>
    </div>
  );
}

// ─── Right Column ─────────────────────────────────────────────────────────────

function RightColumn({
  voiceState,
  isSpeaking,
  onQuickAction,
  analyser,
}: {
  voiceState: JarvisVoiceState;
  isSpeaking: boolean;
  onQuickAction: (action: string) => void;
  analyser: AnalyserNode | null;
}) {
  const { alerts, dismissAlert, isProcessing } = useJarvis();
  const activeAlerts = alerts.filter((a) => !a.dismissed);

  const severityColor: Record<JarvisAlert['severity'], string> = {
    critical: 'border-accent-error/40 bg-accent-error/5 text-accent-error',
    high:     'border-accent-warning/40 bg-accent-warning/5 text-accent-warning',
    medium:   'border-accent-warning/20 bg-accent-warning/5 text-accent-warning',
    low:      'border-border-default bg-bg-tertiary text-text-muted',
  };

  const quickActions = [
    { icon: Search,   label: 'Status Geral',   action: 'Status geral' },
    { icon: Zap,      label: 'Hot Leads',       action: 'Hot leads' },
    { icon: Bot,      label: 'Agentes Erro',    action: 'Agentes com erro' },
    { icon: DollarSign, label: 'Custo Hoje',    action: 'Custo hoje' },
    { icon: Phone,    label: 'Cold Calls',      action: 'Resumo cold calls de hoje' },
    { icon: BarChart3, label: 'Métricas',       action: 'Métricas gerais do sistema' },
  ];

  return (
    <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto p-3 hidden lg:flex">
      {/* Alerts */}
      <HUDCard className="flex flex-col min-h-0 max-h-48" glow>
        <div className="px-3 pt-3 pb-2 border-b border-[rgba(59,130,246,0.15)] flex items-center gap-2 shrink-0">
          <AlertTriangle size={14} style={{ color: '#00d4ff' }} />
          <span className="text-xs font-semibold tracking-widest text-text-secondary uppercase">Alertas</span>
          {activeAlerts.length > 0 && (
            <span className="ml-auto bg-accent-error text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[rgba(59,130,246,0.08)]">
          {activeAlerts.length === 0 ? (
            <div className="flex items-center gap-2 p-3 text-xs text-accent-success">
              <CheckCircle size={14} />
              <span>Todos sistemas operacionais</span>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div key={alert.id} className={`px-3 py-2 flex items-start gap-2 border-l-2 ${severityColor[alert.severity]}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate">{alert.title}</p>
                  <p className="text-[10px] text-text-muted truncate">{alert.message}</p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </HUDCard>

      {/* Quick Actions */}
      <HUDCard className="p-3" glow>
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw size={12} style={{ color: '#00d4ff' }} />
          <span className="text-xs font-semibold tracking-widest text-text-secondary uppercase">Ações Rápidas</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(({ icon: Icon, label, action }) => (
            <button
              key={action}
              onClick={() => onQuickAction(action)}
              disabled={isProcessing}
              className="bg-bg-tertiary hover:bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] hover:border-[rgba(0,212,255,0.3)] rounded-lg p-2.5 text-xs text-text-primary flex flex-col items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon size={15} style={{ color: '#00d4ff' }} />
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </HUDCard>

      {/* Voice Panel + Megazord */}
      <HUDCard className="p-4 flex flex-col items-center gap-2" glow>
        <span className="text-xs font-semibold tracking-widest text-text-secondary uppercase">Interface de Voz</span>
        {/* Megazord Head — always visible, glows when speaking */}
        <div className="relative">
          <JarvisMegazordHead active={isSpeaking} size={180} idle analyser={analyser} />
        </div>
        {/* Waveform below head */}
        <div className="h-10 flex items-center justify-center">
          <JarvisWaveform
            active={voiceState === 'listening'}
            speaking={isSpeaking}
            bars={16}
          />
        </div>
        <span
          className={`text-xs font-bold tracking-widest ${
            voiceState === 'listening'
              ? 'text-accent-success'
              : isSpeaking
              ? 'text-[#00d4ff]'
              : 'text-text-muted'
          }`}
        >
          {voiceState === 'listening'
            ? 'OUVINDO...'
            : isSpeaking
            ? 'FALANDO...'
            : 'STANDBY'}
        </span>
      </HUDCard>

      {/* Timeline ao vivo */}
      <HUDCard className="p-3 flex-1 min-h-0 overflow-hidden" glow>
        <JarvisTimeline />
      </HUDCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JarvisCommand() {
  const navigate = useNavigate();
  const { alerts, activeAlertCount, sendToJarvis, messages } = useJarvis();
  const { speak, stopSpeaking, isSpeaking, ttsEnabled, toggleTts, analyser } = useMegazordTTS();

  // Boot sequence
  const [booted, setBooted] = useState(false);

  // Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Metrics
  const [metrics, setMetrics] = useState<Metrics>({
    leadsHoje: 0,
    hotLeads: 0,
    custoHoje: 0,
    coldCallsHoje: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Agents
  const [agents, setAgents] = useState<Agent[]>([]);

  // Sync state
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Voice
  const [voiceState, setVoiceState] = useState<JarvisVoiceState>('idle');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSupported = hasSpeechRecognition();

  // Auto-speak JARVIS responses
  const lastSpokenMsgId = useRef<string | null>(null);
  useEffect(() => {
    const lastJarvis = [...messages].reverse().find((m) => m.role === 'jarvis' && !m.loading);
    if (lastJarvis && lastJarvis.id !== lastSpokenMsgId.current && lastJarvis.content) {
      lastSpokenMsgId.current = lastJarvis.id;
      speak(lastJarvis.content);
    }
  }, [messages, speak]);

  // ── Fetch metrics ──────────────────────────────────────────────────────────
  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    let leadsHoje = 0;
    let hotLeads = 0;
    let custoHoje = 0;
    let coldCallsHoje = 0;

    // Leads Hoje — n8n_schedule_tracking
    try {
      const { count } = await supabase
        .from('n8n_schedule_tracking')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      leadsHoje = count ?? 0;
    } catch { /* silent */ }

    // Hot Leads — sem resposta > 1h
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('n8n_schedule_tracking')
        .select('id', { count: 'exact', head: true })
        .lte('updated_at', oneHourAgo)
        .eq('etapa_funil', 'Leads Novos');
      hotLeads = count ?? 0;
    } catch { /* silent */ }

    // Custo IA — aios_cost_events com fallback
    try {
      const { data: costs } = await supabase
        .from('aios_cost_events')
        .select('cost')
        .gte('created_at', todayISO);
      custoHoje = costs?.reduce((acc, row) => acc + (row.cost ?? 0), 0) ?? 0;
    } catch {
      custoHoje = 0;
    }

    // Cold Calls — cold_call_logs com fallback para cold_call_metrics
    try {
      const { count, error } = await supabase
        .from('cold_call_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      if (error || (count ?? 0) === 0) {
        // fallback: cold_call_metrics
        try {
          const { count: count2 } = await supabase
            .from('cold_call_metrics')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', todayISO);
          coldCallsHoje = count2 ?? 0;
        } catch { /* silent */ }
      } else {
        coldCallsHoje = count ?? 0;
      }
    } catch { /* silent */ }

    setMetrics({ leadsHoje, hotLeads, custoHoje, coldCallsHoje });
    setLoadingMetrics(false);
    setLastSync(new Date());
  }, []);

  // ── Fetch agents ───────────────────────────────────────────────────────────
  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('aios_agents')
        .select('id, name, status, is_active, total_cost')
        .order('name');
      if (data && data.length > 0) {
        setAgents(data as Agent[]);
      } else {
        // Fallback: agent_versions where is_active = true
        try {
          const { data: versions } = await supabase
            .from('agent_versions')
            .select('id, agent_name, is_active')
            .eq('is_active', true)
            .order('agent_name');
          if (versions && versions.length > 0) {
            setAgents(
              versions.map((v) => ({
                id: v.id,
                name: v.agent_name ?? 'Agente',
                status: 'active' as const,
                is_active: true,
              }))
            );
          }
        } catch { /* silent */ }
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchMetrics(), fetchAgents()]);
      setIsFirstLoad(false);
    };
    init();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchAgents();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchAgents]);

  // Supabase Realtime — re-fetch agents on changes
  useEffect(() => {
    const channel = supabase
      .channel('jarvis-agents-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'aios_agents',
      }, () => {
        fetchAgents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAgents]);

  // ── Toggle agent ───────────────────────────────────────────────────────────
  const handleToggleAgent = useCallback(async (agent: Agent) => {
    const newActive = !agent.is_active;
    const newStatus: Agent['status'] = newActive ? 'active' : 'offline';
    try {
      await supabase
        .from('aios_agents')
        .update({ is_active: newActive, status: newStatus })
        .eq('id', agent.id);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id ? { ...a, is_active: newActive, status: newStatus } : a
        )
      );
    } catch { /* silent */ }
  }, []);

  // ── Voice toggle ───────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (!speechSupported) return;
    if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      setVoiceState('idle');
      return;
    }
    const recognition = createSpeechRecognition();
    if (!recognition) return;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'pt-BR';
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setVoiceState('idle');
      if (transcript.trim()) sendToJarvis(transcript.trim());
    };
    recognition.onerror = () => setVoiceState('idle');
    recognition.onend = () => setVoiceState('idle');
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState('listening');
  }, [voiceState, speechSupported, sendToJarvis]);

  const handleQuickAction = useCallback(
    (action: string) => sendToJarvis(action),
    [sendToJarvis]
  );

  const hasAlerts = activeAlertCount > 0;

  // Format clock
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' });

  // Boot screen overlay
  if (!booted) {
    return <JarvisBootScreen onComplete={() => setBooted(true)} />;
  }

  return (
    <div
      className="h-screen flex flex-col bg-bg-primary overflow-hidden relative"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Background particles */}
      <JarvisParticles count={25} />

      {/* Megazord head lives in the Voice Panel (RightColumn) only */}
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[rgba(59,130,246,0.2)]"
        style={{
          background: 'linear-gradient(180deg, rgba(17,19,24,0.98) 0%, rgba(26,29,36,0.95) 100%)',
          boxShadow: '0 1px 20px rgba(0,212,255,0.08)',
        }}
      >
        {/* Left: back + logo + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg text-text-muted hover:text-[#00d4ff] hover:bg-[rgba(0,212,255,0.08)] transition-all border border-transparent hover:border-[rgba(0,212,255,0.2)]"
            title="Voltar ao Control Tower"
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isSpeaking ? 'animate-pulse' : ''
            }`}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #00d4ff)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
          >
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1
              className="text-sm font-bold tracking-widest text-text-primary uppercase"
              style={{ letterSpacing: '0.2em' }}
            >
              JARVIS Command Center
            </h1>
            <p className="text-[10px] text-text-muted tracking-wider">AI Operations Hub — MOTTIV.ME</p>
          </div>
        </div>

        {/* Right: status + clock + TTS */}
        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              {hasAlerts ? (
                <span className="w-2 h-2 rounded-full bg-accent-error" />
              ) : (
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-success opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-accent-success" />
                </span>
              )}
              <span className={`text-xs font-bold tracking-wider ${hasAlerts ? 'text-accent-error' : 'text-accent-success'}`}>
                {hasAlerts ? `${activeAlertCount} ALERTA${activeAlertCount > 1 ? 'S' : ''}` : 'ONLINE'}
              </span>
            </div>
            {!isFirstLoad && loadingMetrics ? (
              <span className="text-[10px] text-[#00d4ff] tracking-wider animate-pulse">● sincronizando...</span>
            ) : (
              <span className="text-[10px] text-text-muted tracking-wider">Uptime: —</span>
            )}
          </div>

          {/* Clock */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-mono text-text-primary tracking-wider">{timeStr}</span>
            <span className="text-[10px] text-text-muted capitalize">{dateStr}</span>
          </div>

          {/* TTS button */}
          <button
            onClick={isSpeaking ? stopSpeaking : toggleTts}
            className={`p-2 rounded-lg transition-all border ${
              isSpeaking
                ? 'border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.1)] text-[#00d4ff] animate-pulse'
                : ttsEnabled
                ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.05)] text-[#00d4ff]'
                : 'border-border-default bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
            title={isSpeaking ? 'Parar voz' : ttsEnabled ? 'TTS ativo' : 'Ativar TTS'}
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Mic button (mobile-only quick access) */}
          {speechSupported && (
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg transition-all border lg:hidden ${
                voiceState === 'listening'
                  ? 'border-accent-success/50 bg-accent-success/10 text-accent-success animate-pulse'
                  : 'border-border-default bg-bg-tertiary text-text-muted hover:text-text-primary'
              }`}
              title={voiceState === 'listening' ? 'Parar' : 'Ativar voz'}
            >
              {voiceState === 'listening' ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        <LeftColumn
          metrics={metrics}
          agents={agents}
          loadingMetrics={loadingMetrics}
          onToggleAgent={handleToggleAgent}
          lastSync={lastSync}
        />
        <ChatColumn
          voiceState={voiceState}
          speechSupported={speechSupported}
          onToggleVoice={toggleVoice}
          ttsEnabled={ttsEnabled}
          isSpeaking={isSpeaking}
          onToggleTts={toggleTts}
          onStopSpeaking={stopSpeaking}
        />
        <RightColumn
          voiceState={voiceState}
          isSpeaking={isSpeaking}
          onQuickAction={handleQuickAction}
          analyser={analyser}
        />
      </div>
    </div>
  );
}
