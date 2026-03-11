import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  Edit3,
  Clock,
  Bot,
  Save,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================
// TIPOS
// ============================================

interface AutoAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  system_prompt: string;
  is_active: boolean;
  approved_by: string | null;
  approved_at: string | null;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
  version?: string;
  status?: "pending" | "approved" | "rejected";
}

type SkillStatus = "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  SkillStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pendente",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: Clock,
  },
  approved: {
    label: "Aprovado",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejeitado",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
    icon: XCircle,
  },
};

function resolveStatus(agent: AutoAgent): SkillStatus {
  if (agent.approved_at) return "approved";
  if (agent.status) return agent.status;
  return agent.is_active ? "approved" : "pending";
}

// ============================================
// COMPONENTES
// ============================================

function StatusBadge({ status }: { status: SkillStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
    >
      <Icon size={11} />
      {config.label}
    </span>
  );
}

function SkillCard({
  agent,
  onApprove,
  onReject,
  onSave,
}: {
  agent: AutoAgent;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onSave: (id: string, prompt: string, name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(agent.system_prompt);
  const [editedName, setEditedName] = useState(agent.agent_name);
  const [loading, setLoading] = useState<"approve" | "reject" | "save" | null>(
    null,
  );

  const status = resolveStatus(agent);

  const handleApprove = async () => {
    setLoading("approve");
    await onApprove(agent.id);
    setLoading(null);
  };

  const handleReject = async () => {
    setLoading("reject");
    await onReject(agent.id);
    setLoading(null);
  };

  const handleSave = async () => {
    setLoading("save");
    await onSave(agent.id, editedPrompt, editedName);
    setLoading(null);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedPrompt(agent.system_prompt);
    setEditedName(agent.agent_name);
    setEditing(false);
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-border-default">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-pink-500/10 rounded-lg flex-shrink-0">
            <Bot size={16} className="text-pink-400" />
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-2 py-1 bg-bg-tertiary border border-accent-primary/40 rounded text-sm font-medium text-text-primary focus:outline-none"
              />
            ) : (
              <p className="font-medium text-text-primary truncate">
                {agent.agent_name}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={status} />
              <span className="text-xs text-text-muted">
                {agent.agent_type}
              </span>
              {agent.version && (
                <span className="text-xs text-text-muted">
                  v{agent.version}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading === "save"}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-accent-primary hover:bg-accent-primary/90 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading === "save" ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Save size={11} />
                )}
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
              title="Editar"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* System Prompt Preview */}
      <div className="p-4">
        {editing ? (
          <textarea
            rows={8}
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-xs font-mono text-text-secondary focus:outline-none focus:border-accent-primary transition-colors resize-none"
          />
        ) : (
          <pre className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap line-clamp-6 font-mono">
            {agent.system_prompt || "Sem system prompt definido."}
          </pre>
        )}
      </div>

      {/* Ações */}
      {!editing && status === "pending" && (
        <div className="flex items-center gap-2 px-4 pb-4">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "approve" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCircle size={12} />
            )}
            Aprovar
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === "reject" ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <XCircle size={12} />
            )}
            Rejeitar
          </button>
        </div>
      )}

      {/* Meta */}
      <div className="px-4 pb-3 text-xs text-text-muted">
        Criado {new Date(agent.created_at).toLocaleDateString("pt-BR")}
        {agent.approved_by && ` · Aprovado por ${agent.approved_by}`}
      </div>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export function BrainSkills() {
  const [agents, setAgents] = useState<AutoAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | SkillStatus>("all");

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("auto_agents")
      .select("*")
      .order("created_at", { ascending: false });
    setAgents((data as AutoAgent[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("auto_agents")
      .update({
        is_active: true,
        approved_by: "factory-admin",
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                is_active: true,
                approved_by: "factory-admin",
                approved_at: new Date().toISOString(),
              }
            : a,
        ),
      );
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("auto_agents")
      .update({ is_active: false, status: "rejected" })
      .eq("id", id);
    if (!error) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, is_active: false, status: "rejected" } : a,
        ),
      );
    }
  };

  const handleSave = async (id: string, prompt: string, name: string) => {
    const { error } = await supabase
      .from("auto_agents")
      .update({
        system_prompt: prompt,
        agent_name: name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error) {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, system_prompt: prompt, agent_name: name } : a,
        ),
      );
    }
  };

  const filtered = agents.filter((a) => {
    if (filter === "all") return true;
    return resolveStatus(a) === filter;
  });

  const counts = {
    all: agents.length,
    pending: agents.filter((a) => resolveStatus(a) === "pending").length,
    approved: agents.filter((a) => resolveStatus(a) === "approved").length,
    rejected: agents.filter((a) => resolveStatus(a) === "rejected").length,
  };

  const FILTER_TABS: { value: "all" | SkillStatus; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "pending", label: "Pendentes" },
    { value: "approved", label: "Aprovadas" },
    { value: "rejected", label: "Rejeitadas" },
  ];

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-500/10 rounded-lg">
          <Zap size={24} className="text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Mega Brain — Skills
          </h1>
          <p className="text-sm text-text-muted">
            Agentes e skills gerados automaticamente pelo sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary border border-border-default text-text-secondary hover:bg-bg-hover"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 text-xs ${filter === tab.value ? "opacity-70" : "text-text-muted"}`}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={24} className="animate-spin mr-3" />
          Carregando skills...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Zap size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Nenhuma skill encontrada</p>
          <p className="text-xs mt-1 opacity-60">
            {filter !== "all"
              ? "Tente outro filtro"
              : "Skills são geradas automaticamente a partir do DNA dos experts"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((agent) => (
            <SkillCard
              key={agent.id}
              agent={agent}
              onApprove={handleApprove}
              onReject={handleReject}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
