import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  User,
  FileText,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Clock,
  RotateCcw,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTriggerCall, CallStatus, CallStatusValue } from '../hooks/useTriggerCall';

// ─── Types ────────────────────────────────────────────────────────────

interface ColdCallPrompt {
  id: string;
  name: string;
  system_prompt: string;
  is_active: boolean;
}

// ─── Phone helpers ────────────────────────────────────────────────────

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '+';

  // BR formatting
  if (digits.startsWith('55')) {
    const d = digits.slice(2);
    if (d.length === 0) return '+55 ';
    if (d.length <= 2) return `+55 (${d}`;
    if (d.length <= 6) return `+55 (${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  // US formatting
  if (digits.startsWith('1') && digits.length > 1) {
    const d = digits.slice(1);
    if (d.length <= 3) return `+1 (${d}`;
    if (d.length <= 6) return `+1 (${d.slice(0, 3)}) ${d.slice(3)}`;
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }

  // Generic international
  return `+${digits}`;
}

function extractDigits(masked: string): string {
  return masked.replace(/\D/g, '');
}

function isValidPhone(masked: string): boolean {
  const digits = extractDigits(masked);
  // BR: 55 + 2 DDD + 8-9 number = 12-13
  if (digits.startsWith('55')) return digits.length === 12 || digits.length === 13;
  // US/CA: 1 + 10 = 11
  if (digits.startsWith('1')) return digits.length === 11;
  // Other: at least 8 digits with country code
  return digits.length >= 8 && digits.length <= 15;
}

// ─── Status config ────────────────────────────────────────────────────

interface StatusStep {
  key: CallStatusValue;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const STATUS_STEPS: StatusStep[] = [
  {
    key: 'initiating',
    label: 'Iniciando...',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-accent-primary',
  },
  {
    key: 'ringing',
    label: 'Chamando...',
    icon: <PhoneCall className="w-4 h-4 animate-pulse" />,
    color: 'text-accent-primary',
  },
  {
    key: 'connected',
    label: 'Conectado',
    icon: <Phone className="w-4 h-4" />,
    color: 'text-accent-success',
  },
  {
    key: 'in_progress',
    label: 'Em conversa',
    icon: <PhoneCall className="w-4 h-4" />,
    color: 'text-accent-success',
  },
  {
    key: 'completed',
    label: 'Encerrada',
    icon: <Check className="w-4 h-4" />,
    color: 'text-accent-success',
  },
  {
    key: 'failed',
    label: 'Falhou',
    icon: <PhoneOff className="w-4 h-4" />,
    color: 'text-accent-error',
  },
];

function getStepIndex(status: CallStatusValue): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

// ─── Outcome badge ────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<string, string> = {
  agendou: 'bg-accent-success/15 text-accent-success border-accent-success/30',
  interessado: 'bg-accent-primary/15 text-accent-primary border-accent-primary/30',
  nao_atendeu: 'bg-accent-warning/15 text-accent-warning border-accent-warning/30',
  recusou: 'bg-accent-error/15 text-accent-error border-accent-error/30',
  caixa_postal: 'bg-text-muted/15 text-text-muted border-text-muted/30',
  erro: 'bg-accent-error/15 text-accent-error border-accent-error/30',
};

const OUTCOME_LABELS: Record<string, string> = {
  agendou: '📅 Agendou',
  interessado: '🤔 Interessado',
  nao_atendeu: '📵 Não Atendeu',
  recusou: '❌ Recusou',
  caixa_postal: '📬 Caixa Postal',
  erro: '⚠️ Erro',
};

// ─── Duration formatter ───────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Live timer hook ──────────────────────────────────────────────────

function useLiveTimer(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      startRef.current = null;
      return;
    }

    startRef.current = Date.now();
    setElapsed(0);

    const interval = setInterval(() => {
      if (startRef.current) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [active]);

  return elapsed;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const ColdCallNewCall: React.FC = () => {
  const navigate = useNavigate();
  const { triggerCall, hangup, callStatus, loading, hangingUp, error, reset } = useTriggerCall();

  // ─── Form state ────────────────────────────────────────────────────
  const [phone, setPhone] = useState('+');
  const [leadName, setLeadName] = useState('');
  const [leadContext, setLeadContext] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState('');

  // ─── Prompts from Supabase ─────────────────────────────────────────
  const [prompts, setPrompts] = useState<ColdCallPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);

  // ─── UI state ──────────────────────────────────────────────────────
  const [showTranscript, setShowTranscript] = useState(false);

  // Timer runs while call is active
  const isCallActive =
    callStatus?.status === 'connected' || callStatus?.status === 'in_progress';
  const liveElapsed = useLiveTimer(isCallActive);

  const isCallDone =
    callStatus?.status === 'completed' || callStatus?.status === 'failed';

  const formDisabled = loading || (!!callStatus && !isCallDone);

  // ─── Load prompts ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPromptsLoading(true);
      const { data, error: dbErr } = await supabase
        .from('cold_call_prompts')
        .select('id, name, system_prompt, is_active')
        .eq('is_active', true)
        .order('name');

      if (!cancelled) {
        if (data) setPrompts(data as ColdCallPrompt[]);
        if (dbErr) console.error('Error loading prompts:', dbErr.message);
        setPromptsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Selected prompt object ────────────────────────────────────────

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  // ─── Preview: replace variables in prompt ──────────────────────────

  const promptPreview = useMemo(() => {
    if (!selectedPrompt) return null;

    let text = selectedPrompt.system_prompt;
    text = text.replace(/\{nome_lead\}/gi, leadName || '{nome_lead}');
    text = text.replace(/\{nome\}/gi, leadName || '{nome}');
    text = text.replace(/\{empresa\}/gi, leadContext || '{empresa}');
    text = text.replace(/\{contexto\}/gi, leadContext || '{contexto}');
    return text;
  }, [selectedPrompt, leadName, leadContext]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidPhone(phone)) return;

      await triggerCall({
        phoneNumber: `+${extractDigits(phone)}`,
        leadName: leadName || undefined,
        leadContext: leadContext || undefined,
        promptId: selectedPromptId || undefined,
      });
    },
    [phone, leadName, leadContext, selectedPromptId, triggerCall],
  );

  const handleReset = useCallback(() => {
    reset();
    setPhone('+');
    setLeadName('');
    setLeadContext('');
    setSelectedPromptId('');
    setShowTranscript(false);
  }, [reset]);

  // ─── Duration display ──────────────────────────────────────────────

  const displayDuration = isCallDone
    ? callStatus?.duration ?? 0
    : liveElapsed;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <button
            onClick={() => navigate('/cold-calls')}
            className="hover:text-text-secondary transition-colors"
          >
            Cold Calls
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-text-secondary">Nova Ligação</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-primary/10">
            <PhoneCall className="w-6 h-6 text-accent-primary" />
          </div>
          Nova Ligação
        </h1>
      </div>

      {/* ─── Main grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══ LEFT: Form ═══ */}
        <div className="bg-bg-secondary rounded-xl border border-border-default p-6 space-y-5">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-text-muted" />
            Dados da Ligação
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-text-secondary"
              >
                Telefone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={formDisabled}
                  placeholder="+55 (11) 99999-9999 ou +1 (555) 123-4567"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg
                    bg-bg-tertiary border text-text-primary
                    placeholder:text-text-muted text-sm
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      phone.length > 5 && !isValidPhone(phone)
                        ? 'border-accent-error'
                        : 'border-border-default'
                    }
                  `}
                />
              </div>
              {phone.length > 5 && !isValidPhone(phone) && (
                <p className="text-xs text-accent-error flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Número inválido. Use: +55 (XX) XXXXX-XXXX ou +1 (XXX) XXX-XXXX
                </p>
              )}
            </div>

            {/* Lead Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="leadName"
                className="block text-sm font-medium text-text-secondary"
              >
                Nome do Lead
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  id="leadName"
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  disabled={formDisabled}
                  placeholder="Ex: João Silva"
                  className="
                    w-full pl-10 pr-4 py-2.5 rounded-lg
                    bg-bg-tertiary border border-border-default text-text-primary
                    placeholder:text-text-muted text-sm
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                />
              </div>
            </div>

            {/* Lead Context */}
            <div className="space-y-1.5">
              <label
                htmlFor="leadContext"
                className="block text-sm font-medium text-text-secondary"
              >
                Contexto / Empresa
                <span className="ml-1 text-text-muted font-normal">(opcional)</span>
              </label>
              <textarea
                id="leadContext"
                value={leadContext}
                onChange={(e) => setLeadContext(e.target.value)}
                disabled={formDisabled}
                placeholder="Ex: CEO da TechCorp, interessado em automação..."
                rows={3}
                className="
                  w-full px-4 py-2.5 rounded-lg
                  bg-bg-tertiary border border-border-default text-text-primary
                  placeholder:text-text-muted text-sm
                  transition-all duration-200 resize-none
                  focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />
            </div>

            {/* Prompt dropdown */}
            <div className="space-y-1.5">
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-text-secondary"
              >
                Prompt de Ligação
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <select
                  id="prompt"
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                  disabled={formDisabled || promptsLoading}
                  className="
                    w-full pl-10 pr-10 py-2.5 rounded-lg appearance-none
                    bg-bg-tertiary border border-border-default text-text-primary
                    text-sm transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/40 focus:border-accent-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <option value="">
                    {promptsLoading ? 'Carregando prompts...' : 'Selecionar prompt'}
                  </option>
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>

            {/* Submit / Hangup / Reset */}
            {isCallDone ? (
              <button
                type="button"
                onClick={handleReset}
                className="
                  w-full flex items-center justify-center gap-2
                  px-6 py-3.5 rounded-lg font-semibold text-base
                  bg-bg-tertiary border border-border-default text-text-primary
                  hover:bg-bg-hover hover:border-border-hover
                  active:scale-[0.98]
                  transition-all duration-200
                "
              >
                <RotateCcw className="w-5 h-5" />
                Nova Ligação
              </button>
            ) : callStatus && !isCallDone ? (
              <button
                type="button"
                onClick={hangup}
                disabled={hangingUp}
                className="
                  w-full flex items-center justify-center gap-2
                  px-6 py-3.5 rounded-lg font-semibold text-base
                  bg-red-600 text-white
                  hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]
                  active:scale-[0.98]
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {hangingUp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Desligando...
                  </>
                ) : (
                  <>
                    <PhoneOff className="w-5 h-5" />
                    Desligar
                  </>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isValidPhone(phone) || loading}
                className="
                  w-full flex items-center justify-center gap-2
                  px-6 py-3.5 rounded-lg font-semibold text-base
                  bg-accent-primary text-white
                  hover:bg-[#79c0ff] hover:shadow-[0_0_20px_rgba(88,166,255,0.3)]
                  active:scale-[0.98]
                  transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ligando...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-5 h-5" />
                    📞 Ligar Agora
                  </>
                )}
              </button>
            )}

            {/* Error display */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-error/10 border border-accent-error/20">
                <AlertCircle className="w-4 h-4 text-accent-error mt-0.5 shrink-0" />
                <p className="text-sm text-accent-error">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* ═══ RIGHT: Preview / Status ═══ */}
        <div className="bg-bg-secondary rounded-xl border border-border-default p-6 space-y-5">
          {!callStatus ? (
            /* ─── Pre-call: Prompt Preview ────────────────────────── */
            <PromptPreviewPanel preview={promptPreview} promptName={selectedPrompt?.name ?? null} />
          ) : (
            /* ─── During/After call: Status Panel ─────────────────── */
            <CallStatusPanel
              callStatus={callStatus}
              displayDuration={displayDuration}
              showTranscript={showTranscript}
              onToggleTranscript={() => setShowTranscript((v) => !v)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

interface PromptPreviewPanelProps {
  preview: string | null;
  promptName: string | null;
}

const PromptPreviewPanel: React.FC<PromptPreviewPanelProps> = ({ preview, promptName }) => (
  <>
    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
      <Eye className="w-5 h-5 text-text-muted" />
      Preview do Prompt
    </h2>

    {preview ? (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[rgba(163,113,247,0.15)] text-[#a371f7]">
            {promptName}
          </span>
        </div>
        <div className="bg-bg-tertiary rounded-lg border border-border-default p-4 max-h-[400px] overflow-y-auto">
          <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
            {preview}
          </pre>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-12 h-12 text-border-default mb-4" />
        <p className="text-text-muted text-sm">
          Selecione um prompt para ver o preview
        </p>
        <p className="text-text-muted text-xs mt-1">
          As variáveis serão substituídas pelos dados do lead
        </p>
      </div>
    )}
  </>
);

// ─── Call Status Panel ───────────────────────────────────────────────

interface CallStatusPanelProps {
  callStatus: CallStatus;
  displayDuration: number;
  showTranscript: boolean;
  onToggleTranscript: () => void;
}

const CallStatusPanel: React.FC<CallStatusPanelProps> = ({
  callStatus,
  displayDuration,
  showTranscript,
  onToggleTranscript,
}) => {
  const currentIdx = getStepIndex(callStatus.status);
  const isTerminal = callStatus.status === 'completed' || callStatus.status === 'failed';
  const isActive =
    callStatus.status === 'connected' || callStatus.status === 'in_progress';

  return (
    <>
      <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
        <PhoneCall className="w-5 h-5 text-text-muted" />
        Status da Ligação
      </h2>

      {/* Status steps */}
      <div className="space-y-3">
        {STATUS_STEPS.filter(
          (s) =>
            s.key !== 'failed' || callStatus.status === 'failed',
        )
          .filter(
            (s) =>
              s.key !== 'completed' || callStatus.status !== 'failed',
          )
          .map((step, i) => {
            const stepIdx = getStepIndex(step.key);
            const isPast = stepIdx < currentIdx;
            const isCurrent = step.key === callStatus.status;
            const isFuture = stepIdx > currentIdx;

            return (
              <div
                key={step.key}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-300
                  ${isCurrent ? 'bg-bg-tertiary border border-border-hover' : ''}
                  ${isPast ? 'opacity-60' : ''}
                  ${isFuture ? 'opacity-30' : ''}
                `}
              >
                {/* Step indicator */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    transition-all duration-300
                    ${isPast ? 'bg-accent-success/20 text-accent-success' : ''}
                    ${isCurrent ? `bg-bg-hover ${step.color}` : ''}
                    ${isFuture ? 'bg-bg-hover text-text-muted' : ''}
                  `}
                >
                  {isPast ? <Check className="w-4 h-4" /> : step.icon}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-sm font-medium
                    ${isPast ? 'text-text-muted' : ''}
                    ${isCurrent ? 'text-text-primary' : ''}
                    ${isFuture ? 'text-text-muted' : ''}
                  `}
                >
                  {step.label}
                </span>

                {/* Duration during active call */}
                {isCurrent && isActive && (
                  <span className="ml-auto text-sm font-mono text-accent-success flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(displayDuration)}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {/* Terminal state details */}
      {isTerminal && (
        <div className="space-y-4 pt-2">
          {/* Outcome badge + duration */}
          <div className="flex items-center gap-3 flex-wrap">
            {callStatus.outcome && (
              <span
                className={`
                  inline-flex items-center gap-1 px-3 py-1 rounded-full
                  text-sm font-medium border
                  ${OUTCOME_COLORS[callStatus.outcome] ?? 'bg-bg-tertiary text-text-secondary border-border-default'}
                `}
              >
                {OUTCOME_LABELS[callStatus.outcome] ?? callStatus.outcome}
              </span>
            )}
            {(callStatus.duration ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(callStatus.duration ?? 0)}
              </span>
            )}
          </div>

          {/* Transcript */}
          {callStatus.transcript && (
            <div className="space-y-2">
              <button
                onClick={onToggleTranscript}
                className="flex items-center gap-2 text-sm text-accent-primary hover:text-[#79c0ff] transition-colors"
              >
                {showTranscript ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição completa'}
              </button>

              {showTranscript && (
                <div className="bg-bg-tertiary rounded-lg border border-border-default p-4 max-h-[300px] overflow-y-auto animate-[fadeIn_200ms_ease]">
                  <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                    {callStatus.transcript}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════

export default ColdCallNewCall;
