import { useState } from "react";
import {
  X,
  CheckSquare,
  Square,
  Clock,
  User,
  FileText,
  Trash2,
  ChevronRight,
} from "lucide-react";
import type { ClientOnboarding, OnboardingChecklistItem } from "./types";
import { VERTICAL_CONFIG, STATUS_CONFIG, ONBOARDING_STEPS } from "./types";
import { SLATimer } from "./SLATimer";

interface OnboardingDetailPanelProps {
  onboarding: ClientOnboarding;
  onClose: () => void;
  onToggleChecklist: (itemId: string, completed: boolean) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}

export function OnboardingDetailPanel({
  onboarding,
  onClose,
  onToggleChecklist,
  onCancel,
}: OnboardingDetailPanelProps) {
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const vertical = VERTICAL_CONFIG[onboarding.vertical];
  const statusCfg = STATUS_CONFIG[onboarding.status];

  const handleToggle = async (item: OnboardingChecklistItem) => {
    if (loadingItemId) return;
    setLoadingItemId(item.id);
    try {
      await onToggleChecklist(item.id, !item.is_completed);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }
    setCancelling(true);
    try {
      await onCancel(onboarding.id);
      onClose();
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  // Build checklist from onboarding.checklist or synthesize from steps
  const checklistItems: OnboardingChecklistItem[] =
    onboarding.checklist && onboarding.checklist.length > 0
      ? onboarding.checklist
      : ONBOARDING_STEPS.map((step) => ({
          id: `synthetic-${step.number}`,
          onboarding_id: onboarding.id,
          step_number: step.number,
          step_key: step.key,
          step_label: step.label,
          is_completed: step.number < onboarding.current_step,
          completed_at: null,
          completed_by: null,
          notes: null,
        }));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-96 bg-bg-primary border-l border-border-default z-50 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-default flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-lg font-bold text-text-primary truncate">
              {onboarding.client_name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${vertical.color}20`,
                  color: vertical.color,
                }}
              >
                {vertical.emoji} {vertical.label}
              </span>
              <span
                className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium border"
                style={{
                  backgroundColor: `${statusCfg.color}15`,
                  color: statusCfg.color,
                  borderColor: `${statusCfg.color}30`,
                }}
              >
                {statusCfg.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SLA section */}
        <div className="px-5 py-4 border-b border-border-default flex-shrink-0 bg-bg-secondary">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
              SLA
            </span>
            <SLATimer
              sla_deadline={onboarding.sla_deadline}
              status={onboarding.status}
              size="lg"
            />
          </div>
          {onboarding.sla_deadline && (
            <p className="text-xs text-text-muted mt-1.5">
              Prazo:{" "}
              {new Date(onboarding.sla_deadline).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="px-5 py-3 border-b border-border-default flex-shrink-0 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Iniciado em{" "}
              {new Date(onboarding.started_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
          {onboarding.assigned_to && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <User className="w-3.5 h-3.5" />
              <span>{onboarding.assigned_to}</span>
            </div>
          )}
          {onboarding.notes && (
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{onboarding.notes}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 border-b border-border-default flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">Progresso</span>
            <span className="text-xs font-semibold text-text-primary">
              {onboarding.steps_completed}/{onboarding.total_steps} steps
            </span>
          </div>
          <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all duration-500"
              style={{ width: `${onboarding.progress_pct ?? 0}%` }}
            />
          </div>
        </div>

        {/* Checklist — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
            Checklist
          </h3>
          <div className="space-y-2">
            {checklistItems.map((item) => {
              const isLoading = loadingItemId === item.id;
              const isSynthetic = item.id.startsWith("synthetic-");
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    item.is_completed
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-border-default bg-bg-secondary hover:border-accent-primary/30"
                  }`}
                >
                  <button
                    onClick={() => !isSynthetic && handleToggle(item)}
                    disabled={isLoading || isSynthetic}
                    className="mt-0.5 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    ) : item.is_completed ? (
                      <CheckSquare className="w-4 h-4 text-green-500" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-muted">
                        {item.step_number}.
                      </span>
                      <p
                        className={`text-sm font-medium ${
                          item.is_completed
                            ? "text-text-muted line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {item.step_label}
                      </p>
                    </div>
                    {item.completed_at && (
                      <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        {new Date(item.completed_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {item.completed_by && ` — ${item.completed_by}`}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-text-muted mt-1 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        {onboarding.status !== "cancelado" &&
          onboarding.status !== "concluido" && (
            <div className="px-5 py-4 border-t border-border-default flex-shrink-0">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  cancelConfirm
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-bg-secondary border border-border-default text-text-muted hover:text-red-400 hover:border-red-500/30"
                }`}
              >
                {cancelling ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {cancelConfirm
                  ? "Confirmar cancelamento"
                  : "Cancelar onboarding"}
              </button>
              {cancelConfirm && (
                <button
                  onClick={() => setCancelConfirm(false)}
                  className="w-full mt-2 text-xs text-text-muted hover:text-text-primary text-center transition-colors"
                >
                  Voltar
                </button>
              )}
            </div>
          )}
      </div>
    </>
  );
}
