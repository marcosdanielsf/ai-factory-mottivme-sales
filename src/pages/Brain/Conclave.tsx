import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  Bot,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================
// TIPOS
// ============================================

interface AutoAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  is_active: boolean;
}

interface ConclaveSession {
  id: string;
  question: string;
  synthesis: string | null;
  individual_responses: Record<string, string> | null;
  status: "deliberating" | "synthesizing" | "completed" | "failed";
  total_cost: number | null;
  created_at: string;
}

type CouncilPreset = "c-level" | "sales" | "custom";

const PRESET_LABELS: Record<CouncilPreset, string> = {
  "c-level": "C-Level Council",
  sales: "Sales Council",
  custom: "Custom",
};

const STATUS_CONFIG: Record<
  ConclaveSession["status"],
  { label: string; color: string; icon: React.ElementType }
> = {
  deliberating: {
    label: "Deliberando",
    color: "text-blue-400",
    icon: Loader2,
  },
  synthesizing: {
    label: "Sintetizando",
    color: "text-amber-400",
    icon: Sparkles,
  },
  completed: { label: "Concluído", color: "text-green-400", icon: CheckCircle },
  failed: { label: "Falhou", color: "text-red-400", icon: XCircle },
};

// ============================================
// COMPONENTES
// ============================================

function StatusBadge({ status }: { status: ConclaveSession["status"] }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isSpinning = status === "deliberating" || status === "synthesizing";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}
    >
      <Icon size={12} className={isSpinning ? "animate-spin" : ""} />
      {config.label}
    </span>
  );
}

function AgentCard({
  agent,
  selected,
  onToggle,
}: {
  agent: AutoAgent;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? "bg-accent-primary/10 border-accent-primary/40 text-text-primary"
          : "bg-bg-tertiary border-border-default text-text-secondary hover:bg-bg-hover"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
            selected
              ? "bg-accent-primary border-accent-primary"
              : "border-border-default"
          }`}
        >
          {selected && (
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              className="text-white"
            >
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <Bot
          size={14}
          className={selected ? "text-accent-primary" : "text-text-muted"}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.agent_name}</p>
          <p className="text-xs text-text-muted">{agent.agent_type}</p>
        </div>
      </div>
    </button>
  );
}

function SessionHistoryItem({ session }: { session: ConclaveSession }) {
  const [expanded, setExpanded] = useState(false);
  const agentKeys = session.individual_responses
    ? Object.keys(session.individual_responses)
    : [];

  return (
    <div className="border border-border-default rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between p-4 hover:bg-bg-hover transition-colors text-left"
      >
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-medium text-text-primary line-clamp-2">
            {session.question}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <StatusBadge status={session.status} />
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={10} />
              {new Date(session.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {agentKeys.length > 0 && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Users size={10} />
                {agentKeys.length} agentes
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp
            size={14}
            className="text-text-muted flex-shrink-0 mt-0.5"
          />
        ) : (
          <ChevronDown
            size={14}
            className="text-text-muted flex-shrink-0 mt-0.5"
          />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border-default p-4 space-y-4">
          {/* Síntese */}
          {session.synthesis && (
            <div className="p-4 bg-accent-primary/5 border border-accent-primary/20 rounded-lg">
              <p className="text-xs font-medium text-accent-primary mb-2 flex items-center gap-1.5">
                <Sparkles size={12} />
                Síntese Final
              </p>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {session.synthesis}
              </p>
            </div>
          )}

          {/* Respostas individuais */}
          {session.individual_responses && agentKeys.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted uppercase tracking-wide font-medium">
                Respostas individuais
              </p>
              {agentKeys.map((agentName) => (
                <div
                  key={agentName}
                  className="p-3 bg-bg-tertiary border border-border-default rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={13} className="text-accent-primary" />
                    <p className="text-xs font-medium text-text-primary">
                      {agentName}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {session.individual_responses![agentName]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export function BrainConclave() {
  const [agents, setAgents] = useState<AutoAgent[]>([]);
  const [sessions, setSessions] = useState<ConclaveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [preset, setPreset] = useState<CouncilPreset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [agentsRes, sessionsRes] = await Promise.allSettled([
      supabase
        .from("auto_agents")
        .select("id, agent_name, agent_type, is_active")
        .eq("is_active", true)
        .order("agent_name"),
      supabase
        .from("conclave_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (agentsRes.status === "fulfilled") {
      setAgents((agentsRes.value.data as AutoAgent[]) ?? []);
    }
    if (sessionsRes.status === "fulfilled") {
      setSessions((sessionsRes.value.data as ConclaveSession[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyPreset = (p: CouncilPreset) => {
    setPreset(p);
    if (p === "custom") {
      setSelectedAgents(new Set());
      return;
    }
    const keywords =
      p === "c-level"
        ? ["ceo", "cmo", "cfo", "coo", "advisor"]
        : ["sdr", "sales", "closer", "coach"];
    const matching = agents
      .filter((a) =>
        keywords.some(
          (k) =>
            a.agent_name.toLowerCase().includes(k) ||
            a.agent_type.toLowerCase().includes(k),
        ),
      )
      .map((a) => a.id);
    setSelectedAgents(
      new Set(matching.length > 0 ? matching : agents.map((a) => a.id)),
    );
  };

  const toggleAgent = (id: string) => {
    setPreset("custom");
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError("A pergunta é obrigatória.");
      return;
    }
    if (selectedAgents.size === 0) {
      setError("Selecione pelo menos um agente.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const { error: insertErr } = await supabase
      .from("conclave_sessions")
      .insert({
        question: question.trim(),
        context: context.trim() || null,
        agent_ids: Array.from(selectedAgents),
        status: "deliberating",
      });

    setSubmitting(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    setQuestion("");
    setContext("");
    setSelectedAgents(new Set());
    setPreset(null);
    fetchData();
  };

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <MessageSquare size={24} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Mega Brain — Conclave
          </h1>
          <p className="text-sm text-text-muted">
            Deliberações multi-agente para decisões estratégicas
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={24} className="animate-spin mr-3" />
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de nova deliberação */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-bg-secondary border border-border-default rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Play size={16} className="text-amber-400" />
                Nova Deliberação
              </h2>

              {/* Pergunta */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Pergunta <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: Qual é a melhor estratégia de precificação para um produto SaaS B2B no Brasil em 2026?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"
                />
              </div>

              {/* Contexto */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Contexto adicional (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais, restrições, dados relevantes..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <XCircle size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  submitting || !question.trim() || selectedAgents.size === 0
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Iniciando deliberação...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Iniciar Deliberação
                    {selectedAgents.size > 0 && (
                      <span className="opacity-70">
                        ({selectedAgents.size} agente
                        {selectedAgents.size !== 1 ? "s" : ""})
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Histórico */}
            <div className="space-y-3">
              <h2 className="font-semibold text-text-primary text-sm">
                Histórico de Sessões
                {sessions.length > 0 && (
                  <span className="ml-2 text-text-muted font-normal">
                    ({sessions.length})
                  </span>
                )}
              </h2>
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted bg-bg-secondary border border-border-default rounded-xl">
                  <MessageSquare size={32} className="mb-3 opacity-20" />
                  <p className="text-sm">Nenhuma sessão ainda</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <SessionHistoryItem key={session.id} session={session} />
                ))
              )}
            </div>
          </div>

          {/* Seleção de agentes */}
          <div className="space-y-4">
            <div className="bg-bg-secondary border border-border-default rounded-xl p-4 space-y-4">
              <h2 className="font-semibold text-text-primary text-sm">
                Selecionar Agentes
              </h2>

              {/* Presets */}
              <div className="space-y-1.5">
                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">
                  Presets
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {(["c-level", "sales", "custom"] as CouncilPreset[]).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => applyPreset(p)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                          preset === p
                            ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/30"
                            : "bg-bg-tertiary text-text-secondary border border-border-default hover:bg-bg-hover"
                        }`}
                      >
                        {PRESET_LABELS[p]}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Lista de agentes */}
              {agents.length === 0 ? (
                <div className="text-center py-6 text-text-muted">
                  <Bot size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs">
                    Nenhum agente ativo. Aprove agentes na aba DNA.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {agents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      selected={selectedAgents.has(agent.id)}
                      onToggle={() => toggleAgent(agent.id)}
                    />
                  ))}
                </div>
              )}

              {selectedAgents.size > 0 && (
                <p className="text-xs text-text-muted text-center">
                  {selectedAgents.size} de {agents.length} selecionado
                  {selectedAgents.size !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
