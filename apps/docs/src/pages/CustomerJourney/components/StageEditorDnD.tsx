import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import type { CjmStageConfig } from "../../../types/cjm";

interface StageEditorDnDProps {
  stageConfigs: CjmStageConfig[];
  onUpdate: (id: string, changes: Record<string, unknown>) => Promise<void>;
  onEdit: (stageId: string) => void;
}

interface StageCardProps {
  stage: CjmStageConfig;
  onEdit: (stageId: string) => void;
  isDragOverlay?: boolean;
}

const StageCard = ({
  stage,
  onEdit,
  isDragOverlay = false,
}: StageCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cardContent = (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors ${
        isDragOverlay ? "rounded-md shadow-lg bg-bg-tertiary" : ""
      } ${isDragging ? "" : "cursor-pointer"}`}
      onClick={isDragOverlay ? undefined : () => onEdit(stage.stage_id)}
    >
      {/* Grip handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Arrastar etapa"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Color dot */}
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: stage.color ?? "#6366f1" }}
      />

      {/* Stage name */}
      <span className="flex-1 text-sm font-medium text-text-primary truncate">
        {stage.stage_name}
      </span>

      {/* Owner */}
      {stage.owner_name ? (
        <span className="text-xs text-text-muted hidden sm:block flex-shrink-0">
          {stage.owner_name}
        </span>
      ) : null}

      {/* SLA badge */}
      {stage.sla_hours != null ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-bg-primary text-text-muted border border-border-default flex-shrink-0">
          {stage.sla_hours}h SLA
        </span>
      ) : null}

      {/* Status badge */}
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
          stage.is_active
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400"
        }`}
      >
        {stage.is_active ? "Ativo" : "Inativo"}
      </span>
    </div>
  );

  if (isDragOverlay) return cardContent;

  return (
    <div ref={setNodeRef} style={style}>
      {cardContent}
    </div>
  );
};

const StageEditorDnD = ({
  stageConfigs,
  onUpdate,
  onEdit,
}: StageEditorDnDProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Group and sort stages by pipeline
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { pipeline_id: string; stages: CjmStageConfig[] }
    >();
    for (const cfg of stageConfigs) {
      if (!map.has(cfg.pipeline_name)) {
        map.set(cfg.pipeline_name, {
          pipeline_id: cfg.pipeline_id,
          stages: [],
        });
      }
      map.get(cfg.pipeline_name)!.stages.push(cfg);
    }
    for (const entry of map.values()) {
      entry.stages.sort((a, b) => a.stage_order - b.stage_order);
    }
    return map;
  }, [stageConfigs]);

  const toggleCollapse = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const activeStage = useMemo(
    () => stageConfigs.find((s) => s.id === activeId) ?? null,
    [activeId, stageConfigs],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which pipeline group this drag happened in
    for (const [, { stages }] of grouped.entries()) {
      const ids = stages.map((s) => s.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) continue;

      const reordered = arrayMove(stages, oldIndex, newIndex);

      // Compute new stage_order values using fractional indexing (midpoint)
      const updates: Array<{ id: string; stage_order: number }> = [];
      reordered.forEach((stage, idx) => {
        const prevOrder = idx > 0 ? reordered[idx - 1].stage_order : 0;
        const nextOrder =
          idx < reordered.length - 1
            ? reordered[idx + 1].stage_order
            : stage.stage_order + 2;
        const newOrder =
          stage.id === String(active.id)
            ? (prevOrder + nextOrder) / 2
            : stage.stage_order;
        if (newOrder !== stage.stage_order) {
          updates.push({ id: stage.id, stage_order: newOrder });
        }
      });

      await Promise.all(
        updates.map(({ id, stage_order }) => onUpdate(id, { stage_order })),
      );
      break;
    }
  };

  if (stageConfigs.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p className="text-lg font-medium">
          Nenhuma configuração de etapa encontrada
        </p>
        <p className="text-sm mt-2">
          Configure as etapas nos pipelines para visualizá-las aqui.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([pipelineName, { stages }]) => {
          const isCollapsed = collapsed.has(pipelineName);
          return (
            <div
              key={pipelineName}
              className="rounded-lg bg-bg-secondary overflow-hidden"
            >
              {/* Pipeline header */}
              <button
                onClick={() => toggleCollapse(pipelineName)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-tertiary transition-colors"
              >
                <span className="font-medium text-text-primary text-sm">
                  {pipelineName}
                </span>
                <span className="flex items-center gap-2 text-text-muted">
                  <span className="text-xs">{stages.length} etapas</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {/* Sortable stage list */}
              {!isCollapsed && (
                <div className="border-t border-border-default">
                  <SortableContext
                    items={stages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stages.map((stage) => (
                      <StageCard key={stage.id} stage={stage} onEdit={onEdit} />
                    ))}
                  </SortableContext>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeStage ? (
          <StageCard stage={activeStage} onEdit={onEdit} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default StageEditorDnD;
