import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Loader2,
  Database,
  Layers,
  Users,
  Bot,
  MessageSquare,
  FileText,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { supabase } from "../../lib/supabase";

// ============================================
// TIPOS
// ============================================

interface HealthMetrics {
  totalSources: number;
  totalChunks: number;
  totalEntities: number;
  totalDNAProfiles: number;
  activeAgents: number;
  conclaveSessions: number;
}

interface SourceTypeBreakdown {
  name: string;
  value: number;
  [key: string]: unknown;
}

interface TopEntity {
  canonical_name: string;
  mention_count: number;
  entity_type: string;
}

// ============================================
// CONSTANTES
// ============================================

const PIE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#f97316",
  "#64748b",
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  pdf: "PDF",
  audio: "Áudio",
  webpage: "Página Web",
  transcript: "Transcrição",
  note: "Nota",
  spreadsheet: "Planilha",
  other: "Outro",
};

// ============================================
// COMPONENTES
// ============================================

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="p-5 bg-bg-secondary border border-border-default rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-text-muted">{label}</p>
        <Icon size={18} className={color} />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-bg-tertiary rounded animate-pulse" />
      ) : (
        <p className={`text-3xl font-bold ${color}`}>
          {value.toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-xs shadow-lg">
      <p className="font-medium text-text-primary">{payload[0]?.name}</p>
      <p className="text-accent-primary">{payload[0]?.value} fontes</p>
    </div>
  );
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-xs shadow-lg">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="text-accent-primary">{payload[0]?.value} menções</p>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export function BrainHealth() {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    totalSources: 0,
    totalChunks: 0,
    totalEntities: 0,
    totalDNAProfiles: 0,
    activeAgents: 0,
    conclaveSessions: 0,
  });
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceTypeBreakdown[]>(
    [],
  );
  const [topEntities, setTopEntities] = useState<TopEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [
      sourcesRes,
      chunksRes,
      entitiesRes,
      dnaRes,
      agentsRes,
      conclaveRes,
      sourceTypesRes,
      topEntitiesRes,
    ] = await Promise.allSettled([
      supabase
        .from("knowledge_sources")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("knowledge_chunks")
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
      supabase.from("knowledge_sources").select("source_type"),
      supabase
        .from("knowledge_entities")
        .select("canonical_name, mention_count, entity_type")
        .order("mention_count", { ascending: false })
        .limit(10),
    ]);

    setMetrics({
      totalSources:
        sourcesRes.status === "fulfilled" ? (sourcesRes.value.count ?? 0) : 0,
      totalChunks:
        chunksRes.status === "fulfilled" ? (chunksRes.value.count ?? 0) : 0,
      totalEntities:
        entitiesRes.status === "fulfilled" ? (entitiesRes.value.count ?? 0) : 0,
      totalDNAProfiles:
        dnaRes.status === "fulfilled" ? (dnaRes.value.count ?? 0) : 0,
      activeAgents:
        agentsRes.status === "fulfilled" ? (agentsRes.value.count ?? 0) : 0,
      conclaveSessions:
        conclaveRes.status === "fulfilled" ? (conclaveRes.value.count ?? 0) : 0,
    });

    // Breakdown por tipo de fonte
    if (sourceTypesRes.status === "fulfilled" && sourceTypesRes.value.data) {
      const counts: Record<string, number> = {};
      for (const row of sourceTypesRes.value.data as Array<{
        source_type: string;
      }>) {
        counts[row.source_type] = (counts[row.source_type] ?? 0) + 1;
      }
      const breakdown = Object.entries(counts)
        .map(([key, value]) => ({
          name: SOURCE_TYPE_LABELS[key] ?? key,
          value,
        }))
        .sort((a, b) => b.value - a.value);
      setSourceBreakdown(breakdown);
    }

    // Top entidades
    if (topEntitiesRes.status === "fulfilled" && topEntitiesRes.value.data) {
      setTopEntities(topEntitiesRes.value.data as TopEntity[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const KPI_CARDS = [
    {
      label: "Total de Fontes",
      value: metrics.totalSources,
      icon: Database,
      color: "text-blue-400",
    },
    {
      label: "Total de Chunks",
      value: metrics.totalChunks,
      icon: Layers,
      color: "text-purple-400",
    },
    {
      label: "Entidades",
      value: metrics.totalEntities,
      icon: Users,
      color: "text-green-400",
    },
    {
      label: "Perfis DNA",
      value: metrics.totalDNAProfiles,
      icon: FileText,
      color: "text-amber-400",
    },
    {
      label: "Agentes Ativos",
      value: metrics.activeAgents,
      icon: Bot,
      color: "text-pink-400",
    },
    {
      label: "Sessões Conclave",
      value: metrics.conclaveSessions,
      icon: MessageSquare,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 rounded-lg">
          <Activity size={24} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Mega Brain — Health
          </h1>
          <p className="text-sm text-text-muted">
            Métricas de saúde e performance do sistema de conhecimento
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPI_CARDS.map((card) => (
          <KPICard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut: source type distribution */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4 text-sm">
            Distribuição por Tipo de Fonte
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-text-muted">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : sourceBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted">
              <Database size={32} className="mb-2 opacity-20" />
              <p className="text-xs">Nenhuma fonte ainda</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie
                    data={sourceBreakdown as Record<string, unknown>[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourceBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sourceBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-text-secondary truncate flex-1">
                      {item.name}
                    </span>
                    <span className="text-xs font-medium text-text-primary">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar: top entities by mention_count */}
        <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
          <h2 className="font-semibold text-text-primary mb-4 text-sm">
            Top 10 Entidades por Menções
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-48 text-text-muted">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : topEntities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-text-muted">
              <Users size={32} className="mb-2 opacity-20" />
              <p className="text-xs">Nenhuma entidade ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topEntities}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="canonical_name"
                  width={100}
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) =>
                    v.length > 14 ? v.slice(0, 14) + "…" : v
                  }
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar
                  dataKey="mention_count"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
