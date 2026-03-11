import { PartyPopper } from "lucide-react";
import { useCjmOnboarding } from "../../../hooks/useCjmOnboarding";

interface OnboardingChecklistProps {
  contactId: string;
  locationId?: string | null;
}

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const OnboardingChecklist = ({
  contactId,
  locationId,
}: OnboardingChecklistProps) => {
  const { steps, toggleStep, loading } = useCjmOnboarding(
    contactId,
    locationId,
  );

  const completed = steps.filter((s) => s.completed).length;
  const total = steps.length || 6;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && completed === total;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 rounded-full bg-bg-secondary animate-pulse" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-bg-secondary animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Onboarding - VTX Playbook
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-text-muted whitespace-nowrap">
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* All done message */}
      {allDone && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium">
          <PartyPopper className="w-4 h-4 flex-shrink-0" />
          Onboarding completo!
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
          >
            <button
              onClick={() => toggleStep(step.step_key, !step.completed)}
              className="flex-shrink-0 w-5 h-5 rounded border transition-colors flex items-center justify-center"
              style={{
                borderColor: step.completed
                  ? "rgb(52 211 153)"
                  : "var(--border-default, #333)",
                backgroundColor: step.completed
                  ? "rgb(52 211 153)"
                  : "transparent",
              }}
              aria-label={
                step.completed ? "Desmarcar etapa" : "Marcar como concluido"
              }
            >
              {step.completed && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-bg-tertiary flex items-center justify-center text-xs text-text-muted font-medium">
              {step.step_order}
            </span>

            <span
              className={`flex-1 text-sm ${step.completed ? "text-text-muted line-through" : "text-text-primary"}`}
            >
              {step.step_name}
            </span>

            {step.completed && step.completed_at ? (
              <span className="text-xs text-emerald-400 whitespace-nowrap">
                Concluido em {formatDate(step.completed_at)}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-bg-tertiary flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
