import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
  FileText,
  Shield,
  Sparkles,
  Code,
  Target,
  Briefcase,
  GitBranch,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { sanitizeMarkdown } from "../lib/sanitizeMarkdown";
import { getErrorMessage } from "../lib/getErrorMessage";
import { supabase } from "../lib/supabase";

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  changeProposal?: ChangeProposal;
  status?: "pending" | "approved" | "rejected";
}

interface ChangeProposal {
  field: string;
  operation: "update" | "add" | "remove";
  value: unknown;
  diff_summary: string;
  analysis: string;
  warnings?: string[];
  suggested_version?: string;
}

interface ClaudeResponse {
  analysis: string;
  changes?: {
    field: string;
    operation: "update" | "add" | "remove";
    value: unknown;
    diff_summary: string;
  };
  warnings?: string[];
  suggested_version?: string;
  needs_clarification?: boolean;
  questions?: string[];
  is_info_only?: boolean;
  error?: string;
}

type EditableZone =
  | "system_prompt"
  | "compliance_rules"
  | "personality_config"
  | "business_config"
  | "tools_config"
  | "hyperpersonalization"
  | "prompts_by_mode"
  | "qualification_config";

// =============================================================================
// ZONE DEFINITIONS
// =============================================================================

const ZONES: Record<
  EditableZone,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  system_prompt: {
    label: "System Prompt",
    icon: FileText,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  compliance_rules: {
    label: "Compliance",
    icon: Shield,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  personality_config: {
    label: "Personalidade",
    icon: Sparkles,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  business_config: {
    label: "Negocio",
    icon: Briefcase,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  tools_config: {
    label: "Ferramentas",
    icon: Code,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  hyperpersonalization: {
    label: "Contexto",
    icon: Target,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  prompts_by_mode: {
    label: "Modos",
    icon: GitBranch,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
  qualification_config: {
    label: "Qualificacao",
    icon: Wrench,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
};

// Quick action templates for CS
const QUICK_ACTIONS = [
  {
    label: "Corrigir SDR flat",
    prompt: "Converta o sdr_inbound de string flat para objeto 7-fases",
  },
  {
    label: "Corrigir camelCase",
    prompt: "Corrija as keys do prompts_by_mode de camelCase para snake_case",
  },
  {
    label: "Anti Multi-Q",
    prompt:
      "Adicione regra #1 no system_prompt: NUNCA faca mais de 1 pergunta por mensagem",
  },
  {
    label: "Diagnosticar",
    prompt: "Analise este agente e liste todos os problemas encontrados",
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

interface PromptEngineerChatProps {
  agentId: string;
  agentName: string;
  currentPrompt: string;
  currentConfigs: {
    hyperpersonalization?: Record<string, unknown>;
    compliance_rules?: Record<string, unknown>;
    personality_config?: Record<string, unknown>;
    business_config?: Record<string, unknown>;
    tools_config?: Record<string, unknown>;
    prompts_by_mode?: Record<string, unknown>;
    qualification_config?: Record<string, unknown>;
  };
  onApplyChanges: (
    zone: string,
    newContent: string | Record<string, unknown>,
    fieldPath?: string,
  ) => Promise<void>;
  onClose?: () => void;
}

export const PromptEngineerChat: React.FC<PromptEngineerChatProps> = ({
  agentId,
  agentName,
  currentPrompt,
  currentConfigs,
  onApplyChanges,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content: `**Engenheiro de Prompts v2** ativo para **${agentName}**

Powered by Claude. Descreva o que quer alterar em linguagem natural.

**Acoes rapidas** disponiveis abaixo, ou digite sua instrucao.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<Message | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── API Call ──────────────────────────────────────────────────────────────

  const callPromptEngineer = useCallback(
    async (instruction: string): Promise<ClaudeResponse> => {
      const apiUrl =
        import.meta.env.VITE_PROMPT_ENGINEER_URL || "/api/prompt-engineer";

      // Get current session token for auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("Sessao expirada. Faca login novamente.");
      }

      // Cap history to 8 pairs (16 messages) to prevent token explosion
      const trimmedHistory = conversationHistory.slice(-16);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instruction,
          agentName,
          agentId,
          currentVersion: {
            system_prompt: currentPrompt,
            prompts_by_mode: currentConfigs.prompts_by_mode || {},
            tools_config: currentConfigs.tools_config || {},
            compliance_rules: currentConfigs.compliance_rules || {},
            personality_config: currentConfigs.personality_config || {},
            business_config: currentConfigs.business_config || {},
            hyperpersonalization: currentConfigs.hyperpersonalization || {},
            qualification_config: currentConfigs.qualification_config || {},
          },
          conversationHistory: trimmedHistory,
        }),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || `API error ${response.status}`);
      }

      return response.json();
    },
    [agentId, agentName, currentPrompt, currentConfigs, conversationHistory],
  );

  // ── Send Message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (overrideInput?: string) => {
      const text = overrideInput || input.trim();
      if (!text || isProcessing) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      if (!overrideInput) setInput("");
      setIsProcessing(true);
      setShowQuickActions(false);

      try {
        const result = await callPromptEngineer(text);

        // Update conversation history for multi-turn
        setConversationHistory((prev) => [
          ...prev,
          { role: "user" as const, content: text },
          { role: "assistant" as const, content: JSON.stringify(result) },
        ]);

        if (result.error) {
          addAssistantMessage(`**Erro:** ${result.error}`);
          return;
        }

        // Case 1: Needs clarification
        if (result.needs_clarification) {
          const questions =
            result.questions?.map((q, i) => `${i + 1}. ${q}`).join("\n") || "";
          addAssistantMessage(
            `${result.analysis}\n\n**Preciso de mais informacao:**\n${questions}`,
          );
          return;
        }

        // Case 2: Info only (question about the agent)
        if (result.is_info_only) {
          addAssistantMessage(result.analysis);
          return;
        }

        // Case 3: Change proposal
        if (result.changes) {
          const zone = result.changes.field as EditableZone;
          if (!(zone in ZONES)) {
            addAssistantMessage(
              `**Erro:** Campo "${result.changes.field}" nao e um campo editavel valido. Campos aceitos: ${Object.keys(ZONES).join(", ")}`,
            );
            return;
          }
          const zoneInfo = ZONES[zone];
          const warnings = result.warnings?.length
            ? `\n\n**Alertas:**\n${result.warnings.map((w) => `- ${w}`).join("\n")}`
            : "";

          const proposal: ChangeProposal = {
            field: result.changes.field,
            operation: result.changes.operation,
            value: result.changes.value,
            diff_summary: result.changes.diff_summary,
            analysis: result.analysis,
            warnings: result.warnings,
            suggested_version: result.suggested_version,
          };

          const proposalMessage: Message = {
            id: `proposal-${Date.now()}`,
            role: "assistant",
            content: `${result.analysis}\n\n**Campo:** \`${result.changes.field}\`\n**Operacao:** ${formatOperation(result.changes.operation)}\n**Resumo:** ${result.changes.diff_summary}${warnings}\n${result.suggested_version ? `**Versao sugerida:** ${result.suggested_version}` : ""}\n\nClique **Aprovar** para aplicar ou **Rejeitar** para cancelar.`,
            timestamp: new Date(),
            changeProposal: proposal,
            status: "pending",
          };

          setMessages((prev) => [...prev, proposalMessage]);
          setPendingProposal(proposalMessage);
          return;
        }

        // Fallback: just show analysis
        addAssistantMessage(result.analysis);
      } catch (err) {
        addAssistantMessage(
          `**Erro na API:** ${getErrorMessage(err)}\n\nTente novamente.`,
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [input, isProcessing, callPromptEngineer],
  );

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // ── Approve / Reject ──────────────────────────────────────────────────────

  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!pendingProposal?.changeProposal || isApproving) return;

    setIsApproving(true);
    setIsProcessing(true);
    try {
      const { field, value } = pendingProposal.changeProposal;

      // Type guard: value must be string or plain object (not array/null)
      const isValidValue =
        typeof value === "string" ||
        (typeof value === "object" && value !== null && !Array.isArray(value));
      if (!isValidValue) {
        addSystemMessage(
          `Erro: valor retornado pelo Claude tem tipo invalido (${typeof value}). Rejeite e tente novamente.`,
        );
        return;
      }

      await onApplyChanges(
        field,
        value as string | Record<string, unknown>,
        field,
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingProposal.id
            ? { ...m, status: "approved" as const }
            : m,
        ),
      );

      addSystemMessage(
        `Alteracao aplicada em **${ZONES[field as EditableZone]?.label || field}**. Nova versao criada.`,
      );
      setPendingProposal(null);
    } catch (err) {
      addSystemMessage(`Erro ao aplicar: ${getErrorMessage(err)}`);
    } finally {
      setIsProcessing(false);
      setIsApproving(false);
    }
  };

  const handleReject = () => {
    if (!pendingProposal) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === pendingProposal.id ? { ...m, status: "rejected" as const } : m,
      ),
    );
    addSystemMessage("Alteracao cancelada. Descreva o que quer modificar.");
    setPendingProposal(null);
  };

  const addSystemMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        role: "system",
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary relative z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-lg">
            <Zap className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              Engenheiro de Prompts
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                <Brain size={10} />
                Claude
              </span>
            </h3>
            <p className="text-xs text-text-muted">{agentName}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-tertiary rounded transition-colors text-text-muted hover:text-text-primary"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isProcessing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <Loader2 size={16} className="text-cyan-400 animate-spin" />
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-lg px-4 py-2">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                Claude analisando agente...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && !pendingProposal && (
        <div className="px-4 py-2 border-t border-border-default bg-bg-secondary/50">
          <p className="text-[10px] text-text-muted uppercase mb-2">
            Acoes rapidas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSend(action.prompt)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs bg-bg-tertiary border border-border-default rounded-lg text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Approval Actions */}
      {pendingProposal && (
        <div className="px-4 py-3 bg-bg-secondary border-t border-border-default flex items-center justify-center gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            <XCircle size={16} />
            Rejeitar
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Aprovar e Aplicar
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border-default bg-bg-secondary pb-6">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva a alteracao... (ex: 'corrigir SDR flat', 'adicionar regra anti multi-pergunta')"
            disabled={isProcessing || !!pendingProposal}
            className="flex-1 bg-bg-tertiary border border-border-default rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none disabled:opacity-50"
            rows={2}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing || !!pendingProposal}
            className="px-4 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-2 text-center opacity-70">
          Claude Sonnet 4 &bull; Mudancas precisam de aprovacao &bull; Versao
          criada automaticamente
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const [showDiff, setShowDiff] = useState(false);

  const avatarClass =
    message.role === "user"
      ? "bg-accent-primary"
      : message.role === "system"
        ? "bg-green-500/20"
        : "bg-gradient-to-br from-cyan-500/30 to-purple-500/30";

  const avatarIcon =
    message.role === "user" ? (
      <User size={16} className="text-white" />
    ) : message.role === "system" ? (
      <CheckCircle2 size={16} className="text-green-400" />
    ) : (
      <Zap size={16} className="text-cyan-400" />
    );

  const bubbleClass =
    message.role === "user"
      ? "bg-accent-primary text-white"
      : message.role === "system"
        ? "bg-green-500/10 border border-green-500/30 text-text-secondary"
        : "bg-bg-secondary border border-border-default text-text-secondary";

  return (
    <div
      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarClass}`}
      >
        {avatarIcon}
      </div>

      <div
        className={`max-w-[85%] ${message.role === "user" ? "text-right" : ""}`}
      >
        <div className={`inline-block px-4 py-2 rounded-lg ${bubbleClass}`}>
          <div
            className="text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: sanitizeMarkdown(message.content),
            }}
          />

          {/* Diff viewer for change proposals */}
          {message.changeProposal && message.status === "pending" && (
            <div className="mt-3">
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                {showDiff ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
                Ver alteracao proposta
              </button>
              {showDiff && (
                <DiffViewer
                  field={message.changeProposal.field}
                  value={message.changeProposal.value}
                />
              )}
            </div>
          )}

          {/* Warnings */}
          {message.changeProposal?.warnings?.length ? (
            <div className="mt-2 flex items-start gap-1.5">
              <AlertTriangle
                size={12}
                className="text-amber-400 mt-0.5 shrink-0"
              />
              <div className="text-xs text-amber-300">
                {message.changeProposal.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            </div>
          ) : null}

          {/* Status Badge */}
          {message.status && message.status !== "pending" && (
            <div
              className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                message.status === "approved"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {message.status === "approved" ? (
                <>
                  <CheckCircle2 size={12} /> Aplicado
                </>
              ) : (
                <>
                  <XCircle size={12} /> Cancelado
                </>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-text-muted mt-1">
          {message.timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// DIFF VIEWER
// =============================================================================

const DiffViewer: React.FC<{ field: string; value: unknown }> = ({
  field,
  value,
}) => {
  const zone = ZONES[field as EditableZone];
  const displayValue =
    typeof value === "string"
      ? value.substring(0, 2000) +
        (value.length > 2000 ? "\n...[truncado]" : "")
      : JSON.stringify(value, null, 2).substring(0, 3000);

  return (
    <div className="mt-2 p-3 bg-bg-tertiary rounded-lg border border-border-default">
      <div className="flex items-center gap-2 mb-2">
        {zone && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${zone.bgColor} ${zone.color}`}
          >
            {zone.label}
          </span>
        )}
        <span className="text-[10px] text-text-muted font-mono">{field}</span>
      </div>
      <pre className="text-xs text-text-secondary font-mono bg-bg-primary p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
        {displayValue}
      </pre>
    </div>
  );
};

// =============================================================================
// HELPERS
// =============================================================================

function formatOperation(op: string): string {
  switch (op) {
    case "add":
      return "Adicionar";
    case "remove":
      return "Remover";
    case "update":
      return "Atualizar";
    default:
      return op;
  }
}

export default PromptEngineerChat;
