import { useState, useRef, useCallback } from "react";
import type { PipelineMapData, CjmPipelineFlowRow } from "../../../types/cjm";
import PipelineLane from "./PipelineLane";
import StageMetricsPopover from "./StageMetricsPopover";

interface JourneyCanvasProps {
  pipelines: PipelineMapData[];
  onConfigClick: (stageKey: string) => void;
  onClientClick?: (contactId: string, contactName: string) => void;
}

const JourneyCanvas = ({
  pipelines,
  onConfigClick,
  onClientClick,
}: JourneyCanvasProps) => {
  const [selectedPipeline, setSelectedPipeline] = useState(0);
  const [metricsPopover, setMetricsPopover] = useState<{
    stage: CjmPipelineFlowRow;
    position: { top: number; left: number };
  } | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMetricsHover = useCallback(
    (stage: CjmPipelineFlowRow, rect: DOMRect) => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = null;
      }
      setMetricsPopover({
        stage,
        position: { top: rect.bottom + 8, left: rect.left },
      });
    },
    [],
  );

  const handleMetricsLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setMetricsPopover(null);
      leaveTimerRef.current = null;
    }, 200);
  }, []);

  const pipeline = pipelines[selectedPipeline];

  if (pipelines.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p className="text-lg font-medium">Nenhum pipeline encontrado</p>
        <p className="text-sm mt-2">
          Verifique se existem dados de pipeline para a localizacao selecionada.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Pipeline tab buttons */}
      <div className="flex gap-2 mb-4">
        {pipelines.map((p, i) => (
          <button
            key={p.pipeline_id}
            onClick={() => {
              setSelectedPipeline(i);
              setMetricsPopover(null);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i === selectedPipeline
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-hover"
            }`}
          >
            {p.pipeline_name}
          </button>
        ))}
      </div>

      {/* Swimlane */}
      {pipeline && (
        <PipelineLane
          pipeline={pipeline}
          onConfigClick={onConfigClick}
          onMetricsHover={handleMetricsHover}
          onMetricsLeave={handleMetricsLeave}
          onClientClick={onClientClick}
        />
      )}

      {/* Metrics popover */}
      {metricsPopover && (
        <StageMetricsPopover
          stage={metricsPopover.stage}
          position={metricsPopover.position}
        />
      )}
    </div>
  );
};

export default JourneyCanvas;
