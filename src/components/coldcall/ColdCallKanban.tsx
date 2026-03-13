import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { CallStatusBadge } from "./CallStatusBadge";
import type {
  PipelineCard,
  PipelineColumn,
  PipelineStage,
} from "../../hooks/useColdCallPipeline";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ColdCallKanbanProps {
  columns: PipelineColumn[];
  loading: boolean;
  onMoveCard: (cardId: string, newStage: PipelineStage) => Promise<void>;
  onCardClick: (card: PipelineCard) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  if (phone.length >= 4) return `****-${phone.slice(-4)}`;
  return phone;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return "—";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function qaScoreColor(score: number): string {
  if (score >= 7) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (score >= 4)
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

// ─── KanbanCardDisplay (pure visual, no DnD hooks) ──────────────────────────

interface KanbanCardDisplayProps {
  card: PipelineCard;
  onClick: (card: PipelineCard) => void;
  isDragOverlay?: boolean;
  dragHandleProps?: {
    listeners: Record<string, unknown>;
    attributes: Record<string, unknown>;
  };
}

function KanbanCardDisplay({
  card,
  onClick,
  isDragOverlay = false,
  dragHandleProps,
}: KanbanCardDisplayProps) {
  return (
    <div
      onClick={() => onClick(card)}
      className={`
        bg-bg-primary border border-border-default rounded-md p-3
        cursor-pointer hover:border-accent-primary/40 hover:bg-white/[0.03]
        transition-colors duration-100 select-none
        ${isDragOverlay ? "shadow-2xl ring-1 ring-accent-primary/30 rotate-1 scale-105" : ""}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...(dragHandleProps?.listeners ?? {})}
          {...(dragHandleProps?.attributes ?? {})}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex-shrink-0 text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing transition-colors"
          aria-label="Arrastar card"
        >
          <GripVertical size={14} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Lead name */}
          <p className="text-sm font-semibold text-text-primary truncate leading-tight mb-1">
            {card.lead_name ?? "Lead sem nome"}
          </p>

          {/* Phone */}
          <p className="text-xs text-text-muted font-mono mb-2">
            {maskPhone(card.phone)}
          </p>

          {/* Outcome + QA score */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {card.outcome && (
              <CallStatusBadge outcome={card.outcome} size="sm" />
            )}
            {card.qa_score !== null && card.qa_score !== undefined && (
              <span
                className={`
                  inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5
                  rounded-full border
                  ${qaScoreColor(card.qa_score)}
                `}
              >
                QA {card.qa_score}
              </span>
            )}
          </div>

          {/* Time ago */}
          <p className="text-[10px] text-text-muted mt-1.5">
            {timeAgo(card.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanCard (draggable wrapper) ──────────────────────────────────────────

interface KanbanCardProps {
  card: PipelineCard;
  onClick: (card: PipelineCard) => void;
}

function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCardDisplay
        card={card}
        onClick={onClick}
        dragHandleProps={{
          listeners: listeners as Record<string, unknown>,
          attributes: attributes as Record<string, unknown>,
        }}
      />
    </div>
  );
}

// ─── KanbanColumn (droppable) ─────────────────────────────────────────────────

interface KanbanColumnProps {
  column: PipelineColumn;
  onCardClick: (card: PipelineCard) => void;
}

function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: column.color }}
        />
        <span className="text-sm font-semibold text-text-primary">
          {column.label}
        </span>
        <span className="ml-auto text-xs font-medium text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full border border-border-default">
          {column.cards.length}
        </span>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 bg-bg-secondary border rounded-lg p-2 space-y-2
          min-h-[120px] transition-all duration-150
          ${
            isOver
              ? "border-accent-primary/50 ring-2 ring-accent-primary/30 bg-accent-primary/5"
              : "border-border-default"
          }
        `}
      >
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-xs text-text-muted">
              Nenhum lead
            </div>
          ) : (
            column.cards.map((card) => (
              <KanbanCard key={card.id} card={card} onClick={onCardClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="min-w-[280px]">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10 animate-pulse" />
            <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
            <div className="ml-auto h-5 w-6 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="bg-bg-secondary border border-border-default rounded-lg p-2 space-y-2 min-h-[200px]">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="bg-bg-primary border border-border-default rounded-md p-3 animate-pulse"
              >
                <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
                <div className="h-3 w-1/2 bg-white/10 rounded mb-2" />
                <div className="h-5 w-16 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ColdCallKanban({
  columns,
  loading,
  onMoveCard,
  onCardClick,
}: ColdCallKanbanProps) {
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // Memoized lookups to avoid O(n) per render
  const cardStageMap = useMemo(() => {
    const map = new Map<string, PipelineStage>();
    for (const col of columns) {
      for (const card of col.cards) {
        map.set(card.id, col.stage);
      }
    }
    return map;
  }, [columns]);

  const cardMap = useMemo(() => {
    const map = new Map<string, PipelineCard>();
    for (const col of columns) {
      for (const card of col.cards) {
        map.set(card.id, card);
      }
    }
    return map;
  }, [columns]);

  function handleDragStart(event: DragStartEvent) {
    const card = cardMap.get(String(event.active.id));
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const fromStage = cardStageMap.get(cardId);

    // over.id can be a column stage OR another card id
    let toStage: PipelineStage | undefined;
    if (cardStageMap.has(String(over.id))) {
      // Dropped on a card — use that card's stage
      toStage = cardStageMap.get(String(over.id));
    } else {
      // Dropped on a column droppable — over.id is the stage string
      toStage = over.id as PipelineStage;
    }

    if (!toStage || toStage === fromStage) return;

    onMoveCard(cardId, toStage);
  }

  if (loading) return <KanbanSkeleton />;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.stage}
            column={column}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      {/* Ghost card shown while dragging (pure display, no DnD hooks) */}
      <DragOverlay>
        {activeCard ? (
          <KanbanCardDisplay
            card={activeCard}
            onClick={() => undefined}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
