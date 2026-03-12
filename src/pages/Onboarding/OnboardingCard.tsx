import { useDraggable } from "@dnd-kit/core";
import { GripVertical, User } from "lucide-react";
import type { ClientOnboarding } from "./types";
import { VERTICAL_CONFIG, ONBOARDING_STEPS } from "./types";
import { SLATimer } from "./SLATimer";

interface OnboardingCardProps {
  onboarding: ClientOnboarding;
  onClick: (id: string) => void;
  isDragging?: boolean;
}

export function DraggableOnboardingCard({
  onboarding,
  onClick,
}: {
  onboarding: ClientOnboarding;
  onClick: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: onboarding.id });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <OnboardingCard
        onboarding={onboarding}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
}

export function OnboardingCard({
  onboarding,
  onClick,
  isDragging = false,
}: OnboardingCardProps) {
  const vertical = VERTICAL_CONFIG[onboarding.vertical];
  const totalSteps = ONBOARDING_STEPS.length;
  const completedSteps = onboarding.steps_completed ?? 0;

  return (
    <div
      onClick={() => !isDragging && onClick(onboarding.id)}
      className={`bg-bg-tertiary border border-border-default rounded-lg p-3 hover:border-accent-primary/30 transition-colors cursor-grab active:cursor-grabbing space-y-2.5 ${
        isDragging ? "shadow-2xl ring-2 ring-accent-primary/50" : ""
      }`}
      style={{ touchAction: "none" }}
    >
      {/* Row 1: grip + name */}
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight truncate">
            {onboarding.client_name}
          </p>
        </div>
      </div>

      {/* Row 2: vertical badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: `${vertical.color}20`,
            color: vertical.color,
          }}
        >
          {vertical.emoji} {vertical.label}
        </span>
      </div>

      {/* Row 3: SLA Timer */}
      <div>
        <SLATimer
          sla_deadline={onboarding.sla_deadline}
          status={onboarding.status}
          size="sm"
        />
      </div>

      {/* Row 4: progress dots */}
      <div className="flex items-center gap-1">
        {ONBOARDING_STEPS.map((step) => {
          const done = step.number <= completedSteps;
          const current = step.number === onboarding.current_step && !done;
          return (
            <div
              key={step.number}
              title={step.label}
              className={`rounded-full transition-all ${
                done
                  ? "w-3 h-3 bg-green-500"
                  : current
                    ? "w-3 h-3 bg-accent-primary animate-pulse"
                    : "w-2.5 h-2.5 bg-bg-hover border border-border-default"
              }`}
            />
          );
        })}
        <span className="ml-auto text-xs text-text-muted">
          {completedSteps}/{totalSteps}
        </span>
      </div>

      {/* Row 5: assigned to */}
      {onboarding.assigned_to && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{onboarding.assigned_to}</span>
        </div>
      )}
    </div>
  );
}
