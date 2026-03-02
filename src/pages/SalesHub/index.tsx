import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Calculator,
  Megaphone,
  FlaskConical,
  CalendarCheck,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Flame,
  Globe,
  BarChart3,
  Inbox,
  Bot,
  Layers,
  Zap,
  CheckCircle,
  Clock,
  Search,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAccount } from "../../contexts/AccountContext";
import { useAuth } from "../../contexts/AuthContext";

// ============================================================
// TIPOS
// ============================================================

interface ModuleMetric {
  label: string;
  value: string | number;
  delta?: number | null; // percentual vs período anterior
  unit?: string;
}

interface HubMetrics {
  kanbanCount: number;
  kanbanLastType: string | null;
  okrCount: number;
  okrProgress: number | null; // 0-100
  adsSpend: number;
  adsLeads: number;
  socialLeads: number;
  socialAgendamentos: number;
  agendamentosTotal: number;
  agendamentosHoje: number;
  growthLeadsTotal: number;
  crmHotLeads: number;
  prospectorActive: number;
}

const EMPTY_METRICS: HubMetrics = {
  kanbanCount: 0,
  kanbanLastType: null,
  okrCount: 0,
  okrProgress: null,
  adsSpend: 0,
  adsLeads: 0,
  socialLeads: 0,
  socialAgendamentos: 0,
  agendamentosTotal: 0,
  agendamentosHoje: 0,
  growthLeadsTotal: 0,
  crmHotLeads: 0,
  prospectorActive: 0,
};

// ============================================================
// HELPERS
// ============================================================

function fmtCurrency(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`;
  return `R$${value.toFixed(0)}`;
}

function fmtNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function getStart30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getTodayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ============================================================
// HOOK INTERNO — busca métricas leves para o hub
// ============================================================

function useHubMetrics(locationId: string | null) {
  const [metrics, setMetrics] = useState<HubMetrics>(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const start30 = getStart30Days();
      const todayStart = getTodayStart();

      const [
        kanbanRes,
        okrRes,
        adsRes,
        agendRes,
        agendHojeRes,
        socialRes,
        growthRes,
        crmRes,
        prospectorRes,
      ] = await Promise.allSettled([
        // Kanban Prospect: count + último seed (uma única query com count)
        supabase
          .from("prospect_kanbans")
          .select("ai_seed_input", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(1),

        // OKRs ativos
        supabase
          .from("business_okrs")
          .select("id", { count: "exact", head: true }),

        // Ads: soma de gasto últimos 30 dias
        supabase
          .from("fb_ad_daily_performance")
          .select("spend, leads")
          .gte("date", start30),

        // Agendamentos total últimos 30 dias
        supabase
          .from("n8n_schedule_tracking")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start30),

        // Agendamentos hoje
        supabase
          .from("n8n_schedule_tracking")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart),

        // Social Selling: leads respondidos/gerados últimos 30d
        supabase
          .from("n8n_schedule_tracking")
          .select("id", { count: "exact", head: true })
          .gte("created_at", start30)
          .in("etapa", ["lead", "respondeu"]),

        // Growth Leads: total
        supabase
          .from("growth_leads")
          .select("id", { count: "exact", head: true }),

        // CRM hot leads: decisao
        supabase
          .from("crm_leads_insights")
          .select("id", { count: "exact", head: true })
          .ilike("fase_jornada", "%decis%"),

        // Prospector: campanhas ativas
        supabase
          .from("prospector_campaigns")
          .select("id", { count: "exact", head: true })
          .eq("status", "ativa"),
      ]);

      const next: HubMetrics = { ...EMPTY_METRICS };

      // Kanban — count + seed do mais recente (query unificada)
      if (kanbanRes.status === "fulfilled" && !kanbanRes.value.error) {
        next.kanbanCount = kanbanRes.value.count ?? 0;
        const rows = kanbanRes.value.data ?? [];
        next.kanbanLastType = rows[0]?.ai_seed_input
          ? (rows[0].ai_seed_input as string).slice(0, 40)
          : null;
      }

      // OKRs
      if (okrRes.status === "fulfilled" && !okrRes.value.error) {
        next.okrCount = okrRes.value.count ?? 0;
      }

      // Ads
      if (adsRes.status === "fulfilled" && !adsRes.value.error) {
        const rows = adsRes.value.data ?? [];
        next.adsSpend = rows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
        next.adsLeads = rows.reduce((s, r) => s + (Number(r.leads) || 0), 0);
      }

      // Agendamentos (safe navigation — count pode ser null quando tabela vazia)
      if (agendRes.status === "fulfilled" && !agendRes.value.error) {
        next.agendamentosTotal = agendRes.value.count ?? 0;
      }
      if (agendHojeRes.status === "fulfilled" && !agendHojeRes.value.error) {
        next.agendamentosHoje = agendHojeRes.value.count ?? 0;
      }

      // Social
      if (socialRes.status === "fulfilled" && !socialRes.value.error) {
        next.socialLeads = socialRes.value.count ?? 0;
      }

      // Growth Leads
      if (growthRes.status === "fulfilled" && !growthRes.value.error) {
        next.growthLeadsTotal = growthRes.value.count ?? 0;
      }

      // CRM Hot
      if (crmRes.status === "fulfilled" && !crmRes.value.error) {
        next.crmHotLeads = crmRes.value.count ?? 0;
      }

      // Prospector
      if (prospectorRes.status === "fulfilled" && !prospectorRes.value.error) {
        next.prospectorActive = prospectorRes.value.count ?? 0;
      }

      setMetrics(next);
      setLastFetched(new Date());
    } catch (err) {
      console.error("[SalesHub] Erro ao carregar métricas:", err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, lastFetched, refetch: fetchMetrics };
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

const MetricChip = ({
  label,
  value,
  unit,
  delta,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number | null;
  accent?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-text-muted font-medium uppercase tracking-wide">
      {label}
    </span>
    <div className="flex items-baseline gap-1">
      <span
        className="text-2xl font-bold tabular-nums"
        style={{ color: accent ?? "var(--color-text-primary)" }}
      >
        {value}
      </span>
      {unit && (
        <span className="text-xs text-text-muted font-medium">{unit}</span>
      )}
    </div>
    {delta != null && (
      <div
        className={`flex items-center gap-0.5 text-xs font-medium ${
          delta > 0
            ? "text-green-400"
            : delta < 0
              ? "text-red-400"
              : "text-text-muted"
        }`}
      >
        {delta > 0 ? (
          <ArrowUpRight size={11} />
        ) : delta < 0 ? (
          <ArrowDownRight size={11} />
        ) : (
          <Minus size={11} />
        )}
        {Math.abs(delta)}% vs anterior
      </div>
    )}
  </div>
);

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  route: string;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
  metrics?: ModuleMetric[];
  tags?: string[];
  loading?: boolean;
  quickLinks?: { label: string; to: string; icon?: React.ReactNode }[];
}

const SKELETON_WIDTHS = ["100%", "75%", "50%", "33%"] as const;
type SkeletonWidth = (typeof SKELETON_WIDTHS)[number];

const SkeletonLine = ({ w = "100%" }: { w?: SkeletonWidth }) => (
  <div className="h-3 rounded bg-bg-hover animate-pulse" style={{ width: w }} />
);

const ModuleCard = ({
  icon,
  title,
  subtitle,
  route,
  accentColor,
  borderColor,
  bgGlow,
  metrics = [],
  tags = [],
  loading = false,
  quickLinks = [],
}: ModuleCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="relative rounded-xl border overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        borderColor,
        background: `linear-gradient(135deg, var(--color-bg-secondary) 0%, ${bgGlow}10 100%)`,
      }}
      onClick={() => navigate(route)}
    >
      {/* Barra de acento lateral */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{ background: accentColor }}
      />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${accentColor}18`, color: accentColor }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0 mt-1"
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: `${accentColor}15`,
                  color: accentColor,
                  border: `1px solid ${accentColor}30`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Métricas */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLine w="50%" />
            <SkeletonLine w="75%" />
            <SkeletonLine w="33%" />
          </div>
        ) : metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((m) => (
              <MetricChip
                key={m.label}
                label={m.label}
                value={m.value}
                unit={m.unit}
                delta={m.delta}
                accent={accentColor}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted italic">Nenhum dado ainda</p>
        )}

        {/* Quick Links */}
        {quickLinks.length > 0 && (
          <div
            className="mt-4 pt-4 border-t flex flex-wrap gap-2"
            style={{ borderColor: `${accentColor}20` }}
            onClick={(e) => e.stopPropagation()}
          >
            {quickLinks.map((ql) => (
              <button
                key={ql.to}
                onClick={() => navigate(ql.to)}
                className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: `${accentColor}12`,
                  color: accentColor,
                  border: `1px solid ${accentColor}25`,
                }}
              >
                {ql.icon}
                {ql.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// FAIXA DE STATUS SUPERIOR — alertas e status rápido
// ============================================================

const StatusBar = ({
  metrics,
  loading,
}: {
  metrics: HubMetrics;
  loading: boolean;
}) => {
  const items = [
    {
      icon: <Sparkles size={12} />,
      label: "Kanbans ativos",
      value: metrics.kanbanCount,
      color: "#a855f7",
    },
    {
      icon: <CalendarCheck size={12} />,
      label: "Agendamentos hoje",
      value: metrics.agendamentosHoje,
      color: "#22c55e",
    },
    {
      icon: <Flame size={12} />,
      label: "Leads quentes",
      value: metrics.crmHotLeads,
      color: "#f97316",
    },
    {
      icon: <Globe size={12} />,
      label: "Leads na fila",
      value: fmtNumber(metrics.growthLeadsTotal),
      color: "#06b6d4",
    },
    {
      icon: <Bot size={12} />,
      label: "Campanhas ativas",
      value: metrics.prospectorActive,
      color: "#3b82f6",
    },
  ];

  return (
    <div className="flex items-center gap-6 px-6 py-2.5 bg-bg-secondary/70 border-b border-border-default overflow-x-auto">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 flex-shrink-0">
          <span style={{ color: item.color }}>{item.icon}</span>
          <span className="text-xs text-text-muted">{item.label}:</span>
          {loading ? (
            <div className="h-2.5 w-6 rounded bg-bg-hover animate-pulse" />
          ) : (
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// SEÇÃO PROSPECTOR INTEGRATION
// ============================================================

const ProspectorSection = ({
  metrics,
  loading,
}: {
  metrics: HubMetrics;
  loading: boolean;
}) => {
  const navigate = useNavigate();

  const links = [
    {
      icon: <Target size={16} />,
      label: "Prospector Dashboard",
      desc: "Campanhas e analytics",
      to: "/prospector",
      color: "#3b82f6",
    },
    {
      icon: <Inbox size={16} />,
      label: "LinkedIn Inbox",
      desc: "Mensagens e leads",
      to: "/prospector/inbox",
      color: "#0ea5e9",
    },
    {
      icon: <Bot size={16} />,
      label: "AI SDR",
      desc: "Automação com IA",
      to: "/prospector/ai",
      color: "#8b5cf6",
    },
    {
      icon: <Globe size={16} />,
      label: "Fila de Leads",
      desc: `${fmtNumber(metrics.growthLeadsTotal)} leads`,
      to: "/prospector/queue",
      color: "#06b6d4",
    },
    {
      icon: <Search size={16} />,
      label: "LinkedIn Search",
      desc: "Buscar perfis",
      to: "/leadgen/linkedin-search",
      color: "#22c55e",
    },
    {
      icon: <BarChart3 size={16} />,
      label: "Analytics",
      desc: "Performance",
      to: "/prospector/analytics",
      color: "#f59e0b",
    },
  ];

  return (
    <div className="rounded-xl border border-blue-500/20 overflow-hidden">
      {/* Header da seção */}
      <div className="flex items-center justify-between px-6 py-4 bg-blue-500/5 border-b border-blue-500/15">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Target size={16} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Prospecção Outbound
            </h3>
            <p className="text-xs text-text-muted">
              Prospector integrado com Kanban Prospect AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {metrics.prospectorActive > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
              <CheckCircle size={10} />
              {metrics.prospectorActive} ativa
              {metrics.prospectorActive !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={() => navigate("/prospector")}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
          >
            Ver tudo
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Links grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-border-default/50">
        {links.map((link) => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className="flex flex-col items-start gap-1.5 p-4 hover:bg-bg-hover transition-colors text-left group"
          >
            <span
              style={{ color: link.color }}
              className="group-hover:scale-110 transition-transform"
            >
              {link.icon}
            </span>
            <span className="text-xs font-semibold text-text-primary leading-tight">
              {link.label}
            </span>
            <span className="text-[10px] text-text-muted">{link.desc}</span>
          </button>
        ))}
      </div>

      {/* Integration hint — Kanban → Prospector */}
      <div className="px-6 py-3 bg-purple-500/5 border-t border-purple-500/15 flex items-center gap-3">
        <Sparkles size={13} className="text-purple-400 flex-shrink-0" />
        <p className="text-xs text-text-muted">
          <span className="text-purple-400 font-medium">
            Kanban Prospect AI
          </span>{" "}
          → use os templates gerados como base para campanhas no Prospector
        </p>
        <button
          onClick={() => navigate("/kanban-prospect")}
          className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Criar Kanban
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export function SalesHub() {
  const { selectedAccount } = useAccount();
  const { user } = useAuth();
  const locationId = selectedAccount?.location_id ?? null;
  const { metrics, loading, lastFetched, refetch } = useHubMetrics(locationId);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const displayName = (() => {
    const full = user?.user_metadata?.full_name as string | undefined;
    if (full) return full.split(" ")[0];
    const email = user?.email ?? "";
    return email.split("@")[0] || "você";
  })();

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-widest">
                Live
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Sales Command Center — visão unificada de todas as operações
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastFetched && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock size={11} />
                {lastFetched.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover border border-border-default transition-all disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={refreshing || loading ? "animate-spin" : ""}
              />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Bar ─────────────────────────────────────────── */}
      <StatusBar metrics={metrics} loading={loading} />

      {/* ── Conteúdo principal ─────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 space-y-8">
        {/* Seção 1: Estratégia */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border-default/50" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">
              Planejamento Estratégico
            </span>
            <div className="h-px flex-1 bg-border-default/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Metas */}
            <ModuleCard
              icon={<Target size={18} />}
              title="Metas & OKRs"
              subtitle="Metas anuais e trimestrais"
              route="/metas"
              accentColor="#f97316"
              borderColor="rgba(249,115,22,0.2)"
              bgGlow="#f97316"
              loading={loading}
              metrics={
                metrics.okrCount > 0
                  ? [
                      {
                        label: "OKRs ativos",
                        value: metrics.okrCount,
                      },
                    ]
                  : []
              }
              tags={["OKR", "KR", "Anual"]}
              quickLinks={[
                {
                  label: "Ver OKRs",
                  to: "/metas",
                  icon: <Target size={10} />,
                },
              ]}
            />

            {/* Planejamento */}
            <ModuleCard
              icon={<Calculator size={18} />}
              title="Planejamento"
              subtitle="Projeções e cenários de venda"
              route="/planejamento"
              accentColor="#eab308"
              borderColor="rgba(234,179,8,0.2)"
              bgGlow="#eab308"
              loading={false}
              metrics={[
                {
                  label: "Cenários",
                  value: 3,
                },
                {
                  label: "Projeções",
                  value: "P/R/O",
                },
              ]}
              tags={["Pessimista", "Realista", "Otimista"]}
            />

            {/* Social Selling */}
            <ModuleCard
              icon={<TrendingUp size={18} />}
              title="Social Selling"
              subtitle="Funil por origem de lead"
              route="/social-selling"
              accentColor="#ec4899"
              borderColor="rgba(236,72,153,0.2)"
              bgGlow="#ec4899"
              loading={loading}
              metrics={
                metrics.socialLeads > 0
                  ? [
                      {
                        label: "Leads 30d",
                        value: fmtNumber(metrics.socialLeads),
                      },
                    ]
                  : []
              }
              tags={["SS", "Tráfego", "WhatsApp", "Orgânico"]}
            />
          </div>
        </section>

        {/* Seção 2: Geração de Demanda */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border-default/50" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">
              Geração de Demanda
            </span>
            <div className="h-px flex-1 bg-border-default/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ads Performance */}
            <ModuleCard
              icon={<Megaphone size={18} />}
              title="Ads Performance"
              subtitle="Facebook & Instagram Ads"
              route="/ads-performance"
              accentColor="#3b82f6"
              borderColor="rgba(59,130,246,0.2)"
              bgGlow="#3b82f6"
              loading={loading}
              metrics={
                metrics.adsSpend > 0
                  ? [
                      {
                        label: "Gasto 30d",
                        value: fmtCurrency(metrics.adsSpend),
                      },
                      {
                        label: "Leads gerados",
                        value: fmtNumber(metrics.adsLeads),
                      },
                    ]
                  : []
              }
              tags={["CPL", "CTR", "ROAS"]}
            />

            {/* Metrics Lab */}
            <ModuleCard
              icon={<FlaskConical size={18} />}
              title="Metrics Lab"
              subtitle="Lead scoring e análise avançada"
              route="/metrics-lab"
              accentColor="#8b5cf6"
              borderColor="rgba(139,92,246,0.2)"
              bgGlow="#8b5cf6"
              loading={false}
              metrics={[
                {
                  label: "Score range",
                  value: "0-100",
                },
                {
                  label: "Dimensões",
                  value: "ARC + CPL",
                },
              ]}
              tags={["Score", "ARC", "Anomalias"]}
            />

            {/* CRM Insights */}
            <ModuleCard
              icon={<Flame size={18} />}
              title="CRM Insights"
              subtitle="Leads quentes em decisão"
              route="/crm-insights"
              accentColor="#ef4444"
              borderColor="rgba(239,68,68,0.2)"
              bgGlow="#ef4444"
              loading={loading}
              metrics={
                metrics.crmHotLeads > 0
                  ? [
                      {
                        label: "Hot leads",
                        value: metrics.crmHotLeads,
                      },
                    ]
                  : []
              }
              tags={["Decisão", "Alto engajamento"]}
            />
          </div>
        </section>

        {/* Seção 3: Pipeline & Operações */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border-default/50" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">
              Pipeline & Operações
            </span>
            <div className="h-px flex-1 bg-border-default/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Agendamentos */}
            <ModuleCard
              icon={<CalendarCheck size={18} />}
              title="Agendamentos"
              subtitle="Reuniões e taxa de conversão"
              route="/agendamentos"
              accentColor="#22c55e"
              borderColor="rgba(34,197,94,0.2)"
              bgGlow="#22c55e"
              loading={loading}
              metrics={[
                {
                  label: "Hoje",
                  value: metrics.agendamentosHoje,
                },
                {
                  label: "Últimos 30d",
                  value: fmtNumber(metrics.agendamentosTotal),
                },
              ]}
              tags={["Taxa resposta", "Conversão"]}
            />

            {/* Kanban Prospect */}
            <ModuleCard
              icon={<Sparkles size={18} />}
              title="Kanban Prospect AI"
              subtitle="Canvas de prospecção gerado por IA"
              route="/kanban-prospect"
              accentColor="#a855f7"
              borderColor="rgba(168,85,247,0.2)"
              bgGlow="#a855f7"
              loading={loading}
              metrics={[
                {
                  label: "Kanbans criados",
                  value: metrics.kanbanCount,
                },
              ]}
              tags={["Cadência", "ICP", "Qualificação"]}
              quickLinks={[
                {
                  label: "Criar novo",
                  to: "/kanban-prospect",
                  icon: <Zap size={10} />,
                },
              ]}
            />

            {/* Growth Leads */}
            <ModuleCard
              icon={<Globe size={18} />}
              title="Fila de Leads"
              subtitle="Base prospectada multicanal"
              route="/prospector/queue"
              accentColor="#06b6d4"
              borderColor="rgba(6,182,212,0.2)"
              bgGlow="#06b6d4"
              loading={loading}
              metrics={
                metrics.growthLeadsTotal > 0
                  ? [
                      {
                        label: "Total na base",
                        value: fmtNumber(metrics.growthLeadsTotal),
                      },
                    ]
                  : []
              }
              tags={["Saúde", "LinkedIn", "Instagram"]}
            />
          </div>
        </section>

        {/* Seção 4: Prospector Integration */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border-default/50" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">
              Integração Prospector
            </span>
            <div className="h-px flex-1 bg-border-default/50" />
          </div>
          <ProspectorSection metrics={metrics} loading={loading} />
        </section>

        {/* Footer */}
        <div className="pb-4 text-center">
          <p className="text-[11px] text-text-muted">
            Sales Command Center — MOTTIVME AI Factory
          </p>
        </div>
      </div>
    </div>
  );
}

export default SalesHub;
