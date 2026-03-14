import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  BarChart2,
  Table2,
  Layers,
  Eye,
  CheckCircle,
  PlayCircle,
  Clock,
  Users,
} from "lucide-react";
import { useFormFlowAnalytics } from "../../hooks/useFormFlowAnalytics";
import { ResponseTable } from "../../components/formflow/dashboard/ResponseTable";
import { FunnelChart } from "../../components/formflow/dashboard/FunnelChart";
import { FieldStats } from "../../components/formflow/dashboard/FieldStats";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number | undefined | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}

function KpiCard({ label, value, icon, accent }: KpiCardProps) {
  return (
    <div className="bg-surface-primary border border-border-primary rounded-xl px-4 py-3 flex items-center gap-3 min-w-0">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent ? `${accent}20` : undefined }}
      >
        <span style={{ color: accent ?? "inherit" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-text-primary leading-tight truncate">
          {value}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading
// ---------------------------------------------------------------------------

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-surface-secondary rounded-lg" />
        <div className="h-6 bg-surface-secondary rounded w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-surface-primary border border-border-primary rounded-xl px-4 py-3 h-16"
          />
        ))}
      </div>
      <div className="bg-surface-primary border border-border-primary rounded-xl p-6 h-64" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type TabId = "responses" | "funnel" | "fields";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "responses", label: "Respostas", icon: <Table2 size={15} /> },
  { id: "funnel", label: "Funil", icon: <Layers size={15} /> },
  { id: "fields", label: "Por Campo", icon: <BarChart2 size={15} /> },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function FormFlowAnalytics() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("responses");

  const {
    form,
    fields,
    submissions,
    stats,
    funnelData,
    loading,
    error,
    refresh,
  } = useFormFlowAnalytics(formId ?? "");

  // Loading state
  if (loading) return <AnalyticsSkeleton />;

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/formflow")}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar para FormFlow
        </button>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          Erro ao carregar analytics: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/formflow")}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-1"
          >
            <ArrowLeft size={14} />
            Voltar para FormFlow
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {form?.title ?? "Analytics"}
          </h1>
          <p className="text-sm text-text-muted">
            Analytics e respostas do formulário
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text-muted border border-border-primary hover:text-text-primary hover:bg-surface-secondary transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Respostas"
          value={formatNumber(stats?.total_submissions ?? 0)}
          icon={<Users size={18} />}
          accent="#6366f1"
        />
        <KpiCard
          label="Taxa de conclusão"
          value={`${Math.round(stats?.completion_rate ?? 0)}%`}
          icon={<CheckCircle size={18} />}
          accent="#22c55e"
        />
        <KpiCard
          label="Visualizações"
          value={formatNumber(stats?.total_views ?? 0)}
          icon={<Eye size={18} />}
          accent="#06b6d4"
        />
        <KpiCard
          label="Iniciaram"
          value={formatNumber(stats?.total_starts ?? 0)}
          icon={<PlayCircle size={18} />}
          accent="#f59e0b"
        />
        <KpiCard
          label="Duração média"
          value={formatDuration(stats?.avg_duration_seconds)}
          icon={<Clock size={18} />}
          accent="#a78bfa"
        />
      </div>

      {/* Tabs */}
      <div className="bg-surface-primary border border-border-primary rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border-primary">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "text-text-primary border-brand-primary"
                  : "text-text-muted border-transparent hover:text-text-primary hover:border-border-primary"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "responses" && submissions.length > 0 && (
                <span className="ml-1 text-[10px] font-semibold bg-brand-primary/20 text-brand-primary rounded-full px-1.5 py-0.5">
                  {submissions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === "responses" && (
            <ResponseTable fields={fields} submissions={submissions} />
          )}
          {activeTab === "funnel" && <FunnelChart funnelData={funnelData} />}
          {activeTab === "fields" && (
            <FieldStats fields={fields} submissions={submissions} />
          )}
        </div>
      </div>
    </div>
  );
}
