import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Upload,
  Users,
  Dna,
  MessageSquare,
  Zap,
  Activity,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface BrainStats {
  sources: number;
  entities: number;
  dnaProfiles: number;
  activeAgents: number;
  conclaveSessions: number;
  totalChunks: number;
}

const NAV_CARDS = [
  {
    path: "/brain/ingest",
    icon: Upload,
    label: "Ingestão",
    description: "Adicione fontes de conhecimento: YouTube, PDFs, páginas web",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    statKey: "sources" as keyof BrainStats,
    statLabel: "fontes",
  },
  {
    path: "/brain/entities",
    icon: Users,
    label: "Entidades",
    description: "Explore pessoas, empresas, frameworks e tópicos extraídos",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    statKey: "entities" as keyof BrainStats,
    statLabel: "entidades",
  },
  {
    path: "/brain/dna",
    icon: Dna,
    label: "DNA dos Experts",
    description: "Perfis de mentalidade, frameworks e padrões de pensamento",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    statKey: "dnaProfiles" as keyof BrainStats,
    statLabel: "perfis",
  },
  {
    path: "/brain/conclave",
    icon: MessageSquare,
    label: "Conclave",
    description: "Deliberações multi-agente para decisões estratégicas",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    statKey: "conclaveSessions" as keyof BrainStats,
    statLabel: "sessões",
  },
  {
    path: "/brain/skills",
    icon: Zap,
    label: "Skills",
    description: "Habilidades e frameworks gerados automaticamente pelo Brain",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    statKey: "activeAgents" as keyof BrainStats,
    statLabel: "agentes ativos",
  },
  {
    path: "/brain/health",
    icon: Activity,
    label: "Health",
    description: "Métricas de saúde e performance do sistema de conhecimento",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    statKey: "totalChunks" as keyof BrainStats,
    statLabel: "chunks",
  },
];

export function BrainHub() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BrainStats>({
    sources: 0,
    entities: 0,
    dnaProfiles: 0,
    activeAgents: 0,
    conclaveSessions: 0,
    totalChunks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          sourcesRes,
          entitiesRes,
          dnaRes,
          agentsRes,
          conclaveRes,
          chunksRes,
        ] = await Promise.allSettled([
          supabase
            .from("knowledge_sources")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("knowledge_entities")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("expert_dna")
            .select("entity_id", { count: "exact", head: true }),
          supabase
            .from("auto_agents")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("conclave_sessions")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("knowledge_chunks")
            .select("id", { count: "exact", head: true }),
        ]);

        setStats({
          sources:
            sourcesRes.status === "fulfilled"
              ? (sourcesRes.value.count ?? 0)
              : 0,
          entities:
            entitiesRes.status === "fulfilled"
              ? (entitiesRes.value.count ?? 0)
              : 0,
          dnaProfiles:
            dnaRes.status === "fulfilled" ? (dnaRes.value.count ?? 0) : 0,
          activeAgents:
            agentsRes.status === "fulfilled" ? (agentsRes.value.count ?? 0) : 0,
          conclaveSessions:
            conclaveRes.status === "fulfilled"
              ? (conclaveRes.value.count ?? 0)
              : 0,
          totalChunks:
            chunksRes.status === "fulfilled" ? (chunksRes.value.count ?? 0) : 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-accent-primary/10 rounded-xl">
          <Brain size={32} className="text-accent-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Mega Brain</h1>
          <p className="text-text-muted">
            Sistema de conhecimento inteligente — ingestão, extração e síntese
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-3 bg-bg-secondary border border-border-default rounded-lg animate-pulse"
              >
                <div className="h-3 bg-bg-tertiary rounded mb-2" />
                <div className="h-6 bg-bg-tertiary rounded" />
              </div>
            ))
          : NAV_CARDS.map((card) => (
              <div
                key={card.path}
                className="p-3 bg-bg-secondary border border-border-default rounded-lg text-center"
              >
                <p className="text-xs text-text-muted mb-1">{card.label}</p>
                <p className={`text-xl font-bold ${card.color}`}>
                  {loading ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    stats[card.statKey]
                  )}
                </p>
              </div>
            ))}
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={`group text-left p-5 bg-bg-secondary border ${card.border} rounded-xl hover:border-opacity-60 hover:bg-bg-tertiary/50 transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 ${card.bg} rounded-lg`}>
                  <Icon size={22} className={card.color} />
                </div>
                <ChevronRight
                  size={16}
                  className="text-text-muted group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">
                {card.label}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {card.description}
              </p>
              {!loading && (
                <p className={`text-xs mt-3 font-medium ${card.color}`}>
                  {stats[card.statKey]} {card.statLabel}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
