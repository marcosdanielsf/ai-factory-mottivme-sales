import { useState, useEffect, useCallback } from "react";
import {
  Dna,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Bot,
  Layers,
  AlertCircle,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { supabase } from "../../lib/supabase";

// ============================================
// TIPOS
// ============================================

interface ExpertDNARow {
  id: string;
  entity_id: string;
  layer: string;
  content: Record<string, unknown>;
  confidence: number;
}

interface AutoAgent {
  id: string;
  agent_name: string;
  agent_type: string;
  entity_id: string | null;
  system_prompt: string;
  is_active: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

interface ExpertEntity {
  id: string;
  canonical_name: string;
  entity_type: string;
  mention_count: number;
}

interface ExpertProfile {
  entity: ExpertEntity;
  dnaLayers: ExpertDNARow[];
}

// ============================================
// CONSTANTES
// ============================================

const DNA_LAYERS = [
  "philosophy",
  "mental_models",
  "heuristics",
  "frameworks",
  "methodologies",
  "dilemmas",
];

const LAYER_LABELS: Record<string, string> = {
  philosophy: "Filosofia",
  mental_models: "Modelos Mentais",
  heuristics: "Heurísticas",
  frameworks: "Frameworks",
  methodologies: "Metodologias",
  dilemmas: "Dilemas",
};

const AGENT_TYPE_COLORS: Record<string, string> = {
  advisor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  analyst: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  coach: "bg-green-500/15 text-green-400 border-green-500/30",
  expert: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  mentor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};

function agentTypeBadgeClass(type: string) {
  return (
    AGENT_TYPE_COLORS[type] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30"
  );
}

// ============================================
// COMPONENTES
// ============================================

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-xs text-text-primary shadow-lg">
      <p className="font-medium">{payload[0]?.name}</p>
      <p className="text-accent-primary">
        {Math.round((payload[0]?.value ?? 0) * 100)}%
      </p>
    </div>
  );
}

function ExpertCard({ profile }: { profile: ExpertProfile }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const radarData = DNA_LAYERS.map((layer) => {
    const row = profile.dnaLayers.find((d) => d.layer === layer);
    return {
      layer: LAYER_LABELS[layer] ?? layer,
      confidence: row?.confidence ?? 0,
    };
  });

  const hasAnyDNA = profile.dnaLayers.length > 0;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
      {/* Header do expert */}
      <div className="p-5 border-b border-border-default">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <Users size={18} className="text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              {profile.entity.canonical_name}
            </h3>
            <p className="text-xs text-text-muted">
              {profile.entity.mention_count} menções ·{" "}
              {profile.dnaLayers.length} camadas DNA
            </p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      {hasAnyDNA ? (
        <div className="px-4 pt-4">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart
              data={radarData}
              margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
            >
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="layer"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              />
              <Radar
                name="Confiança"
                dataKey="confidence"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <Dna size={32} className="mb-2 opacity-20" />
          <p className="text-xs">DNA ainda não extraído</p>
        </div>
      )}

      {/* Layers accordion */}
      {hasAnyDNA && (
        <div className="p-4 space-y-2">
          {profile.dnaLayers.map((layer) => {
            const isOpen = expanded === layer.id;
            const items = Array.isArray(layer.content)
              ? layer.content
              : Object.values(layer.content);

            return (
              <div
                key={layer.id}
                className="border border-border-default rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : layer.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Layers size={13} className="text-accent-primary" />
                    <span className="text-sm font-medium text-text-primary">
                      {LAYER_LABELS[layer.layer] ?? layer.layer}
                    </span>
                    <span className="text-xs text-text-muted">
                      {Math.round(layer.confidence * 100)}%
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={14} className="text-text-muted" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-1.5 border-t border-border-default pt-3">
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-text-secondary bg-bg-tertiary rounded-md px-2.5 py-2 leading-relaxed"
                        >
                          {typeof item === "string"
                            ? item
                            : JSON.stringify(item, null, 2)}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-muted">Sem itens</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PendingAgentsSection({
  agents,
  onApprove,
}: {
  agents: AutoAgent[];
  onApprove: (id: string) => void;
}) {
  const [approving, setApproving] = useState<string | null>(null);

  const handleApprove = async (agent: AutoAgent) => {
    setApproving(agent.id);
    await onApprove(agent.id);
    setApproving(null);
  };

  if (agents.length === 0) return null;

  return (
    <div className="bg-bg-secondary border border-amber-500/20 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-border-default">
        <AlertCircle size={18} className="text-amber-400" />
        <h2 className="font-semibold text-text-primary">
          Auto-Agentes Pendentes
        </h2>
        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded-full text-xs font-medium">
          {agents.length}
        </span>
      </div>
      <div className="divide-y divide-border-default">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-4 hover:bg-bg-tertiary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bg-tertiary rounded-lg">
                <Bot size={16} className="text-text-muted" />
              </div>
              <div>
                <p className="font-medium text-text-primary text-sm">
                  {agent.agent_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${agentTypeBadgeClass(agent.agent_type)}`}
                  >
                    {agent.agent_type}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(agent.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleApprove(agent)}
              disabled={approving === agent.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approving === agent.id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle size={12} />
              )}
              Aprovar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export function BrainDNA() {
  const [profiles, setProfiles] = useState<ExpertProfile[]>([]);
  const [pendingAgents, setPendingAgents] = useState<AutoAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [entitiesRes, dnaRes, agentsRes] = await Promise.allSettled([
      supabase
        .from("knowledge_entities")
        .select("id, canonical_name, entity_type, mention_count")
        .eq("entity_type", "person")
        .order("mention_count", { ascending: false }),
      supabase
        .from("expert_dna")
        .select("id, entity_id, layer, content, confidence"),
      supabase
        .from("auto_agents")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false }),
    ]);

    const entities =
      entitiesRes.status === "fulfilled"
        ? ((entitiesRes.value.data as ExpertEntity[]) ?? [])
        : [];
    const dnaRows =
      dnaRes.status === "fulfilled"
        ? ((dnaRes.value.data as ExpertDNARow[]) ?? [])
        : [];
    const agents =
      agentsRes.status === "fulfilled"
        ? ((agentsRes.value.data as AutoAgent[]) ?? [])
        : [];

    // Montar perfis: apenas experts que têm DNA OU todos os persons
    const expertProfiles: ExpertProfile[] = entities.map((entity) => ({
      entity,
      dnaLayers: dnaRows.filter((d) => d.entity_id === entity.id),
    }));

    setProfiles(expertProfiles);
    setPendingAgents(agents);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApproveAgent = async (agentId: string) => {
    const { error } = await supabase
      .from("auto_agents")
      .update({
        is_active: true,
        approved_by: "factory-admin",
        approved_at: new Date().toISOString(),
      })
      .eq("id", agentId);

    if (!error) {
      setPendingAgents((prev) => prev.filter((a) => a.id !== agentId));
    }
  };

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <Dna size={24} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Mega Brain — DNA dos Experts
          </h1>
          <p className="text-sm text-text-muted">
            Perfis de mentalidade, frameworks e padrões de pensamento extraídos
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={24} className="animate-spin mr-3" />
          Carregando perfis DNA...
        </div>
      ) : (
        <>
          {/* Pendentes */}
          <PendingAgentsSection
            agents={pendingAgents}
            onApprove={handleApproveAgent}
          />

          {/* Expert profiles grid */}
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <Dna size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Nenhum expert encontrado</p>
              <p className="text-xs mt-1 opacity-60">
                Ingira conteúdo de pessoas para extrair o DNA automaticamente
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {profiles.map((profile) => (
                <ExpertCard key={profile.entity.id} profile={profile} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
