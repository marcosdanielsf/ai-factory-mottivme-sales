import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  FileCheck,
  ClipboardList,
  MapPin,
  Bot,
  Workflow,
  UserPlus,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import type { ClientOnboarding } from "./types";
import { ONBOARDING_STEPS } from "./types";
import { DraggableOnboardingCard, OnboardingCard } from "./OnboardingCard";

const STEP_ICONS: Record<string, LucideIcon> = {
  contrato_assinado: FileCheck,
  dados_coletados: ClipboardList,
  location_ghl: MapPin,
  agent_version_criado: Bot,
  workflow_n8n_ativo: Workflow,
  primeiro_lead: UserPlus,
  review_48h: CheckCircle,
};

const STEP_COLORS: Record<number, string> = {
  1: "#6B7280",
  2: "#3B82F6",
  3: "#8B5CF6",
  4: "#F59E0B",
  5: "#EC4899",
  6: "#22C55E",
  7: "#06B6D4",
};

interface OnboardingKanbanProps {
  onboardings: ClientOnboarding[];
  onCardClick: (id: string) => void;
  onMoveToStep: (id: string, targetStep: number) => Promise<void>;
}

export function OnboardingKanban({
  onboardings,
  onCardClick,
  onMoveToStep,
}: OnboardingKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const dragged = onboardings.find((o) => o.id === active.id);
    if (!dragged) return;

    // over.id is a step number (column droppable id)
    const targetStep = Number(over.id);
    if (isNaN(targetStep)) return;
    if (dragged.current_step === targetStep) return;

    await onMoveToStep(dragged.id, targetStep);
  };

  const activeOnboarding = activeId
    ? onboardings.find((o) => o.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {ONBOARDING_STEPS.map((step) => {
            const cards = onboardings.filter(
              (o) => o.current_step === step.number && o.status !== "cancelado",
            );
            return (
              <KanbanColumn
                key={step.number}
                stepNumber={step.number}
                stepKey={step.key}
                label={step.label}
                color={STEP_COLORS[step.number]}
                cards={cards}
                onCardClick={onCardClick}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeOnboarding ? (
          <OnboardingCard
            onboarding={activeOnboarding}
            onClick={() => {}}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  stepNumber,
  stepKey,
  label,
  color,
  cards,
  onCardClick,
}: {
  stepNumber: number;
  stepKey: string;
  label: string;
  color: string;
  cards: ClientOnboarding[];
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stepNumber });
  const Icon = STEP_ICONS[stepKey] ?? CheckCircle;

  return (
    <div
      ref={setNodeRef}
      className={`w-56 flex-shrink-0 bg-bg-secondary border rounded-xl p-3 min-h-[480px] flex flex-col transition-colors ${
        isOver
          ? "border-accent-primary bg-accent-primary/5"
          : "border-border-default"
      }`}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between mb-3 pb-2 border-b"
        style={{ borderColor: color }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
          <h3 className="text-xs font-semibold text-text-primary leading-tight">
            {label}
          </h3>
        </div>
        <span
          className="px-1.5 py-0.5 text-xs font-medium rounded"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2 flex-1">
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border-default">
            <p className="text-xs text-text-muted">Vazio</p>
          </div>
        )}
        {cards.map((onboarding) => (
          <DraggableOnboardingCard
            key={onboarding.id}
            onboarding={onboarding}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
