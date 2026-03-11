import { useRef } from "react";
import { Settings } from "lucide-react";
import type { CjmPipelineFlowRow, CjmClientPosition } from "../../../types/cjm";
import ClientBadge from "./ClientBadge";

interface StageColumnProps {
  stage: CjmPipelineFlowRow & { clients: CjmClientPosition[] };
  onConfigClick: (stageKey: string) => void;
  onMetricsHover: (stage: CjmPipelineFlowRow, rect: DOMRect) => void;
  onMetricsLeave: () => void;
}

const StageColumn = ({
  stage,
  onConfigClick,
  onMetricsHover,
  onMetricsLeave,
}: StageColumnProps) => {
  const headerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (headerRef.current) {
      onMetricsHover(stage, headerRef.current.getBoundingClientRect());
    }
  };

  return (
    <div className="min-w-[200px] max-w-[260px] flex-shrink-0 bg-bg-primary border border-border-default rounded-lg flex flex-col">
      {/* Header */}
      <div
        ref={headerRef}
        className="p-3 border-b border-border-default cursor-pointer hover:bg-bg-hover rounded-t-lg"
        onClick={() => onConfigClick(stage.current_stage)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMetricsLeave}
      >
        <div className="flex items-center gap-2">
          {stage.color && (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
          )}
          <h4 className="text-sm font-medium text-text-primary truncate flex-1">
            {stage.stage_name}
          </h4>
          <span className="text-xs text-text-muted bg-bg-secondary rounded-full px-2 py-0.5 flex-shrink-0">
            {stage.clients.length}
          </span>
          <Settings className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
        </div>
      </div>

      {/* Client badges */}
      <div className="p-2 flex-1 space-y-1 overflow-y-auto max-h-[300px]">
        {stage.clients.length === 0 ? (
          <div className="py-6 text-center text-text-muted text-xs border border-dashed border-border-default rounded-md">
            Nenhum cliente
          </div>
        ) : (
          stage.clients.map((client) => (
            <ClientBadge
              key={client.contact_id}
              contactName={client.contact_name}
              hoursInStage={client.hours_in_stage}
              slaHours={stage.sla_hours}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border-default text-xs text-text-muted">
        {stage.owner_name && <span>{stage.owner_name}</span>}
        {stage.owner_name && stage.sla_hours && <span> | </span>}
        {stage.sla_hours && <span>SLA: {stage.sla_hours}h</span>}
        {!stage.owner_name && !stage.sla_hours && <span>Sem configuracao</span>}
      </div>
    </div>
  );
};

export default StageColumn;
