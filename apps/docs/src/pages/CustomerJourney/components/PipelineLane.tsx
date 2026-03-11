import { ChevronRight } from "lucide-react";
import type { PipelineMapData, CjmPipelineFlowRow } from "../../../types/cjm";
import StageColumn from "./StageColumn";

interface PipelineLaneProps {
  pipeline: PipelineMapData;
  onConfigClick: (stageKey: string) => void;
  onMetricsHover: (stage: CjmPipelineFlowRow, rect: DOMRect) => void;
  onMetricsLeave: () => void;
}

const PipelineLane = ({
  pipeline,
  onConfigClick,
  onMetricsHover,
  onMetricsLeave,
}: PipelineLaneProps) => {
  const sortedStages = [...pipeline.stages].sort(
    (a, b) => a.stage_order - b.stage_order,
  );

  return (
    <div className="flex gap-1 overflow-x-auto pb-4 items-start">
      {sortedStages.map((stage, index) => (
        <div key={stage.current_stage} className="flex items-start">
          <StageColumn
            stage={stage}
            onConfigClick={onConfigClick}
            onMetricsHover={onMetricsHover}
            onMetricsLeave={onMetricsLeave}
          />
          {index < sortedStages.length - 1 && (
            <div className="flex items-center self-center px-1 text-text-muted">
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PipelineLane;
