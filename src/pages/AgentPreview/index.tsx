import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Eye,
  Bot,
  Wrench,
  Shield,
  Brain,
  MessageSquare,
  Zap,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Copy,
  Check,
  Hash,
  Layers,
} from "lucide-react";
import { useAgentPreview, type AgentSkill } from "../../hooks/useAgentPreview";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  tool: { label: "Ferramentas", icon: Wrench, color: "#3b82f6" },
  mode: { label: "Modos", icon: MessageSquare, color: "#8b5cf6" },
  compliance: { label: "Compliance", icon: Shield, color: "#ef4444" },
  qualification: { label: "Qualificacao", icon: Zap, color: "#f59e0b" },
  personality: { label: "Personalidade", icon: Brain, color: "#22c55e" },
  business: { label: "Negocio", icon: Layers, color: "#06b6d4" },
};

const MODE_LABELS: Record<string, string> = {
  sdr_inbound: "SDR Inbound",
  social_seller_instagram: "Social Seller IG",
  social_seller_networking: "Social Seller Net",
  social_seller_guerrilha: "Social Seller Guerrilha",
  followuper: "Follow-up",
  concierge: "Concierge",
  scheduler: "Agendamento",
  rescheduler: "Reagendamento",
  objection_handler: "Objecoes",
  reativador_base: "Reativacao",
  customersuccess: "CS",
  closer: "Closer",
  networking_followup: "Networking FUP",
  hotseat_mns: "Hotseat MNS",
  discovery: "Discovery",
  acolhimento: "Acolhimento",
  pitch: "Pitch",
  confirmacao: "Confirmacao",
  fast_track: "Fast Track",
};

export const AgentPreview: React.FC = () => {
  const {
    agents,
    skills,
    junctions,
    resolved,
    selectedAgentId,
    selectedMode,
    availableModes,
    loading,
    resolving,
    error,
    selectAgent,
    selectMode,
    toggleSkill,
  } = useAgentPreview();

  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [togglingSkill, setTogglingSkill] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside to close dropdown
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  // Group skills by category
  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, AgentSkill[]> = {};
    for (const skill of skills) {
      const cat = skill.category || "business";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(skill);
    }
    return grouped;
  }, [skills]);

  // Build skill enabled map from junctions
  const skillEnabledMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const j of junctions) {
      map[j.skill_id] = j.is_enabled;
    }
    return map;
  }, [junctions]);

  // Build the preview prompt
  const previewPrompt = useMemo(() => {
    if (!resolved) return "";

    const parts: string[] = [];

    // System prompt
    if (resolved.system_prompt) {
      parts.push(resolved.system_prompt);
    }

    // Mode-specific prompt
    if (selectedMode && resolved.prompts_by_mode) {
      const pbm = resolved.prompts_by_mode as Record<string, unknown>;

      // _base always included
      if (pbm._base && typeof pbm._base === "string") {
        parts.push("\n\n--- MODO: _base ---\n" + pbm._base);
      }

      // Selected mode
      const modePrompt = pbm[selectedMode];
      if (modePrompt && typeof modePrompt === "string") {
        parts.push(`\n\n--- MODO: ${selectedMode} ---\n` + modePrompt);
      } else if (modePrompt && typeof modePrompt === "object") {
        parts.push(
          `\n\n--- MODO: ${selectedMode} ---\n` +
            JSON.stringify(modePrompt, null, 2),
        );
      }
    }

    // Tools config summary
    if (
      resolved.tools_config &&
      Object.keys(resolved.tools_config).length > 0
    ) {
      parts.push(
        "\n\n--- FERRAMENTAS ATIVAS ---\n" +
          JSON.stringify(resolved.tools_config, null, 2),
      );
    }

    return parts.join("\n");
  }, [resolved, selectedMode]);

  const promptStats = useMemo(() => {
    const chars = previewPrompt.length;
    const tokens = Math.round(chars / 3.4);
    const lines = previewPrompt.split("\n").length;
    return { chars, tokens, lines };
  }, [previewPrompt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API pode falhar se pagina nao esta em foco
    }
  };

  const handleToggleSkill = async (skillId: string, enabled: boolean) => {
    setTogglingSkill(skillId);
    await toggleSkill(skillId, enabled);
    setTogglingSkill(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="animate-spin text-text-muted" size={24} />
        <span className="ml-2 text-text-muted">Carregando agentes...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <Eye size={22} className="text-accent-primary" />
          <h1 className="text-lg font-semibold text-text-primary">
            Agent Preview
          </h1>
          {resolved && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary/20 text-accent-primary">
              {resolved.version}
            </span>
          )}
        </div>

        {/* Agent selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-default hover:border-border-hover transition-colors"
          >
            <Bot size={16} className="text-text-muted" />
            <span className="text-sm text-text-primary">
              {selectedAgentId
                ? agents.find((a) => a.id === selectedAgentId)?.agent_name ||
                  "Selecionar"
                : "Selecionar agente"}
            </span>
            <ChevronDown size={14} className="text-text-muted" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    selectAgent(agent.id);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-bg-hover transition-colors border-b border-border-default last:border-0 ${
                    agent.id === selectedAgentId ? "bg-bg-hover" : ""
                  }`}
                >
                  <div className="text-sm font-medium text-text-primary">
                    {agent.agent_name}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {agent.version} &middot; {agent.service_type} &middot;{" "}
                    {agent.location_id?.slice(0, 8)}...
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-accent-error/10 border border-accent-error/30 text-accent-error text-sm">
          {error}
        </div>
      )}

      {!selectedAgentId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bot
              size={48}
              className="mx-auto text-text-muted mb-4 opacity-30"
            />
            <p className="text-text-muted">
              Selecione um agente para visualizar o prompt
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Controls */}
          <div className="w-80 border-r border-border-default overflow-y-auto flex-shrink-0">
            {/* Mode selector */}
            <div className="p-4 border-b border-border-default">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Modo Ativo
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {availableModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => selectMode(mode)}
                    className={`px-2.5 py-1.5 text-xs rounded-md transition-all ${
                      selectedMode === mode
                        ? "bg-accent-primary text-white font-medium"
                        : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover"
                    }`}
                  >
                    {MODE_LABELS[mode] || mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills toggles by category */}
            {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
              const catSkills = skillsByCategory[cat];
              if (!catSkills || catSkills.length === 0) return null;
              const Icon = config.icon;

              return (
                <div key={cat} className="p-4 border-b border-border-default">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3">
                    <Icon size={14} style={{ color: config.color }} />
                    <span style={{ color: config.color }}>{config.label}</span>
                    <span className="text-text-muted font-normal">
                      ({catSkills.length})
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {catSkills.map((skill) => {
                      const isLinked = skill.id in skillEnabledMap;
                      const isEnabled = skillEnabledMap[skill.id] ?? false;
                      const isToggling = togglingSkill === skill.id;

                      return (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-bg-hover group"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <div className="text-sm text-text-primary truncate">
                              {skill.display_name}
                            </div>
                            <div className="text-[10px] text-text-muted truncate">
                              {skill.name}
                            </div>
                          </div>

                          {isLinked ? (
                            <button
                              onClick={() =>
                                handleToggleSkill(skill.id, !isEnabled)
                              }
                              disabled={isToggling}
                              className="flex-shrink-0"
                            >
                              {isToggling ? (
                                <Loader2
                                  size={20}
                                  className="animate-spin text-text-muted"
                                />
                              ) : isEnabled ? (
                                <ToggleRight
                                  size={24}
                                  className="text-accent-success"
                                />
                              ) : (
                                <ToggleLeft
                                  size={24}
                                  className="text-text-muted"
                                />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100">
                              n/a
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Resolved metadata */}
            {resolved?._resolved && (
              <div className="p-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Metadata
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Skills aplicadas</span>
                    <span className="text-text-primary font-mono">
                      {resolved._resolved.skills_applied?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Template pai</span>
                    <span className="text-text-primary font-mono">
                      {resolved._resolved.has_parent_template ? "sim" : "nao"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Prompt Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-default">
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Hash size={12} />
                  {promptStats.chars.toLocaleString()} chars
                </span>
                <span>~{promptStats.tokens.toLocaleString()} tokens</span>
                <span>{promptStats.lines} linhas</span>
                {resolving && (
                  <span className="flex items-center gap-1 text-accent-primary">
                    <Loader2 size={12} className="animate-spin" />
                    Resolvendo...
                  </span>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-bg-tertiary hover:bg-bg-hover text-text-secondary transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-accent-success" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copiar
                  </>
                )}
              </button>
            </div>

            {/* Prompt content */}
            <div className="flex-1 overflow-y-auto p-4">
              {resolving && !previewPrompt ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-text-muted" />
                </div>
              ) : previewPrompt ? (
                <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {previewPrompt}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted text-sm">
                  Selecione um modo para ver o prompt
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPreview;
