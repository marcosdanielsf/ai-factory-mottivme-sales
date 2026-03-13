import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  X,
  Copy,
  Check,
  Phone,
  Clock,
  Calendar,
  User,
  Star,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { CallStatusBadge } from "./CallStatusBadge";
import type { ColdCallLog as HookColdCallLog } from "../../hooks/useColdCalls";

// ─── Types ───────────────────────────────────────────────

interface TranscriptTurn {
  role: "agent" | "lead" | "system";
  text: string;
  timestamp?: string;
}

interface QAAnalysis {
  score: number;
  resumo: string;
  pontos_fortes: string[];
  pontos_fracos: string[];
  sugestoes: string[];
  converteu: boolean;
  sentiment_lead: string;
  objecoes_detectadas?: string[];
  proxima_acao?: string;
}

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: (HookColdCallLog & Record<string, any>) | null;
}

// ─── Helpers ─────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseTranscript(
  raw?: string | TranscriptTurn[],
): TranscriptTurn[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;

  // Try JSON parse first
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Not JSON — treat as plain string
  }

  // Try line-by-line "Role: text" format
  const lines = raw.split("\n").filter((l) => l.trim());
  const turns: TranscriptTurn[] = [];

  for (const line of lines) {
    const match = line.match(
      /^(agente?|lead|sistema?|agent|customer|user|bot|ai)\s*:\s*(.+)/i,
    );
    if (match) {
      const roleLower = match[1].toLowerCase();
      const role: TranscriptTurn["role"] = [
        "lead",
        "customer",
        "user",
      ].includes(roleLower)
        ? "lead"
        : ["system", "sistema"].includes(roleLower)
          ? "system"
          : "agent";
      turns.push({ role, text: match[2].trim() });
    } else if (turns.length > 0) {
      // Continuation of previous turn
      turns[turns.length - 1].text += "\n" + line.trim();
    } else {
      turns.push({ role: "agent", text: line.trim() });
    }
  }

  return turns.length > 0 ? turns : null;
}

function parseQA(raw?: string | QAAnalysis | null): QAAnalysis | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as QAAnalysis;
  try {
    return JSON.parse(raw) as QAAnalysis;
  } catch {
    return null;
  }
}

function scoreColor(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 5) return "text-yellow-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 8) return "bg-green-500/10 border-green-500/30";
  if (score >= 5) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function sentimentLabel(s: string): string {
  const map: Record<string, string> = {
    positivo: "Positivo",
    negativo: "Negativo",
    neutro: "Neutro",
    hesitante: "Hesitante",
  };
  return map[s] || s;
}

function getPlainTranscript(raw?: string | TranscriptTurn[]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw
    .map(
      (t) =>
        `${t.role === "agent" ? "Agente" : t.role === "lead" ? "Lead" : "Sistema"}: ${t.text}`,
    )
    .join("\n");
}

// ─── Component ───────────────────────────────────────────

export function TranscriptModal({
  isOpen,
  onClose,
  call,
}: TranscriptModalProps) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopy = useCallback(async () => {
    if (!call) return;
    const text = getPlainTranscript(call.transcript);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [call]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!isOpen || !call) return null;

  const turns = parseTranscript(call.transcript);
  const plainText = typeof call.transcript === "string" && !turns;
  const qa = parseQA(call.qa_analysis);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6
        bg-black/60 backdrop-blur-sm
        transition-opacity duration-200
        ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      <div
        className={`
          w-full max-w-3xl max-h-[90vh] flex flex-col
          bg-bg-secondary border border-border-default rounded-xl
          shadow-2xl shadow-black/40
          transition-all duration-200
          ${visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
        `}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b border-border-default shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                {call.lead_name ?? "Ligação"}
              </h2>
              <CallStatusBadge status={call.status} outcome={call.outcome} />
              {qa && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${scoreBg(qa.score)} ${scoreColor(qa.score)}`}
                >
                  <Star className="w-3 h-3" />
                  {qa.score}/10
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
              {call.lead_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {call.lead_phone}
                </span>
              )}
              {call.duration_seconds != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(call.duration_seconds)}
                </span>
              )}
              {(call.created_at || call.started_at) && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(call.started_at ?? call.created_at)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
              title="Copiar transcrição"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Summary */}
          {call.summary && (
            <div className="p-3 rounded-lg bg-accent-primary/5 border border-accent-primary/20 text-sm text-text-secondary mb-4">
              <span className="font-medium text-accent-primary">Resumo: </span>
              {call.summary}
            </div>
          )}

          {/* QA Analysis */}
          {qa && (
            <div
              className={`rounded-lg border p-4 space-y-3 mb-2 ${scoreBg(qa.score)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${scoreColor(qa.score)}`} />
                  <span className="font-semibold text-text-primary text-sm">
                    Avaliacao do Gerente IA
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    Sentiment:{" "}
                    <span className="font-medium text-text-secondary">
                      {sentimentLabel(qa.sentiment_lead)}
                    </span>
                  </span>
                  {qa.converteu && (
                    <span className="text-green-400 font-semibold">
                      Converteu
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-text-secondary">{qa.resumo}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {qa.pontos_fortes.length > 0 && (
                  <div className="space-y-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
                      <TrendingUp className="w-3.5 h-3.5" /> Pontos Fortes
                    </span>
                    <ul className="space-y-0.5">
                      {qa.pontos_fortes.map((p, i) => (
                        <li
                          key={i}
                          className="text-xs text-text-secondary pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-green-500/50"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {qa.pontos_fracos.length > 0 && (
                  <div className="space-y-1">
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                      <TrendingDown className="w-3.5 h-3.5" /> Pontos Fracos
                    </span>
                    <ul className="space-y-0.5">
                      {qa.pontos_fracos.map((p, i) => (
                        <li
                          key={i}
                          className="text-xs text-text-secondary pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-red-500/50"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {qa.sugestoes.length > 0 && (
                <div className="space-y-1">
                  <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
                    <Lightbulb className="w-3.5 h-3.5" /> Sugestoes
                  </span>
                  <ul className="space-y-0.5">
                    {qa.sugestoes.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-text-secondary pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-yellow-500/50"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {qa.objecoes_detectadas && qa.objecoes_detectadas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5" />
                  {qa.objecoes_detectadas.map((o, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              )}

              {qa.proxima_acao && (
                <p className="text-xs text-text-muted pt-1 border-t border-white/5">
                  <span className="font-medium text-text-secondary">
                    Proxima acao:
                  </span>{" "}
                  {qa.proxima_acao}
                </p>
              )}
            </div>
          )}

          {/* Structured transcript turns */}
          {turns && turns.length > 0 ? (
            turns.map((turn, i) => (
              <div
                key={i}
                className={`flex ${turn.role === "lead" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed
                    ${
                      turn.role === "agent"
                        ? "bg-accent-primary/10 border border-accent-primary/20 text-text-secondary"
                        : turn.role === "lead"
                          ? "bg-purple-500/10 border border-purple-500/20 text-text-secondary"
                          : "bg-white/5 border border-border-default text-text-muted text-xs italic"
                    }
                  `}
                >
                  <span
                    className={`block text-xs font-semibold mb-1 ${
                      turn.role === "agent"
                        ? "text-accent-primary"
                        : turn.role === "lead"
                          ? "text-purple-400"
                          : "text-text-muted"
                    }`}
                  >
                    {turn.role === "agent"
                      ? "🤖 Agente"
                      : turn.role === "lead"
                        ? "👤 Lead"
                        : "⚙️ Sistema"}
                    {turn.timestamp && (
                      <span className="ml-2 font-normal text-text-muted">
                        {turn.timestamp}
                      </span>
                    )}
                  </span>
                  <span className="whitespace-pre-wrap">{turn.text}</span>
                </div>
              </div>
            ))
          ) : plainText ? (
            <div className="p-4 rounded-lg bg-white/5 border border-border-default text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
              {call.transcript as string}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <User className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Transcrição não disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
