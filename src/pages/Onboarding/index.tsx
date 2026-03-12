import { useState, useCallback } from "react";
import { Plus, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { useOnboardingTracker } from "../../hooks/useOnboardingTracker";
import { OnboardingKanban } from "./OnboardingKanban";
import { NewOnboardingModal } from "./NewOnboardingModal";
import { OnboardingDetailPanel } from "./OnboardingDetailPanel";
import type { ClientOnboarding } from "./types";

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl p-4 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-bg-hover rounded animate-pulse" />
          <div className="h-4 w-80 bg-bg-hover rounded animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-bg-hover rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-bg-hover rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-56 flex-shrink-0 h-[480px] bg-bg-hover rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OnboardingTracker() {
  const {
    onboardings,
    loading,
    error,
    createOnboarding,
    toggleChecklistItem,
    updateOnboarding,
    refetch,
  } = useOnboardingTracker();

  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedOnboarding: ClientOnboarding | undefined = onboardings.find(
    (o) => o.id === selectedId,
  );

  // ── metrics ────────────────────────────────────────────────────────────────

  const emAndamento = onboardings.filter(
    (o) => o.status === "em_andamento",
  ).length;
  const concluidos = onboardings.filter((o) => o.status === "concluido").length;
  const atrasados = onboardings.filter(
    (o) => o.status === "atrasado" || o.is_sla_breached,
  ).length;

  const completedWithTime = onboardings.filter(
    (o) => o.status === "concluido" && o.hours_elapsed != null,
  );
  const avgSla =
    completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce(
            (acc, o) => acc + (o.hours_elapsed ?? 0),
            0,
          ) / completedWithTime.length,
        )
      : null;

  // ── moveToStep ─────────────────────────────────────────────────────────────

  const handleMoveToStep = useCallback(
    async (id: string, targetStep: number) => {
      await updateOnboarding(id, { current_step: targetStep });
    },
    [updateOnboarding],
  );

  // ── cancel ─────────────────────────────────────────────────────────────────

  const handleCancel = useCallback(
    async (id: string) => {
      await updateOnboarding(id, { status: "cancelado" });
      setSelectedId(null);
    },
    [updateOnboarding],
  );

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 font-medium">
            Erro ao carregar onboardings
          </p>
          <p className="text-text-muted text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary hover:border-accent-primary/30 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Onboarding Tracker
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            Acompanhe o onboarding de clientes em tempo real
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Onboarding
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Em andamento"
          value={emAndamento}
          icon={Clock}
          color="#3B82F6"
        />
        <MetricCard
          label="Concluidos"
          value={concluidos}
          icon={CheckCircle2}
          color="#22C55E"
        />
        <MetricCard
          label="Atrasados / SLA risco"
          value={atrasados}
          icon={AlertTriangle}
          color="#EF4444"
        />
        <MetricCard
          label="SLA medio"
          value={avgSla !== null ? `${avgSla}h` : "—"}
          icon={Users}
          color="#8B5CF6"
          sub={avgSla !== null ? "dos concluidos" : "sem dados ainda"}
        />
      </div>

      {/* Empty state */}
      {onboardings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-bg-hover rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Nenhum onboarding ativo
          </h3>
          <p className="text-text-muted mb-6 max-w-md text-sm">
            Inicie o acompanhamento de um novo cliente clicando no botao abaixo
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Iniciar Primeiro Onboarding
          </button>
        </div>
      )}

      {/* Kanban */}
      {onboardings.length > 0 && (
        <OnboardingKanban
          onboardings={onboardings}
          onCardClick={(id) => setSelectedId(id)}
          onMoveToStep={handleMoveToStep}
        />
      )}

      {/* Detail Panel */}
      {selectedOnboarding && (
        <OnboardingDetailPanel
          onboarding={selectedOnboarding}
          onClose={() => setSelectedId(null)}
          onToggleChecklist={toggleChecklistItem}
          onCancel={handleCancel}
        />
      )}

      {/* New Onboarding Modal */}
      {showModal && (
        <NewOnboardingModal
          onClose={() => setShowModal(false)}
          onCreate={createOnboarding}
        />
      )}
    </div>
  );
}

export default OnboardingTracker;
