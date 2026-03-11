import type { CjmPipelineFlowRow } from "../../../types/cjm";

interface StageMetricsPopoverProps {
  stage: CjmPipelineFlowRow;
  position: { top: number; left: number };
}

const StageMetricsPopover = ({ stage, position }: StageMetricsPopoverProps) => {
  const slaCompliance =
    stage.contact_count > 0
      ? (
          ((stage.contact_count - stage.sla_breach_count) /
            stage.contact_count) *
          100
        ).toFixed(0)
      : "100";

  return (
    <div
      className="fixed z-30 bg-bg-primary border border-border-default rounded-lg shadow-lg p-4 w-56"
      style={{ top: position.top, left: position.left }}
    >
      <h4 className="font-medium text-sm text-text-primary mb-3">
        {stage.stage_name}
      </h4>
      <div className="space-y-2">
        <div>
          <span className="text-xs text-text-muted">Volume atual</span>
          <p className="text-sm font-medium text-text-primary">
            {stage.contact_count}
          </p>
        </div>
        <div>
          <span className="text-xs text-text-muted">Tempo medio</span>
          <p className="text-sm font-medium text-text-primary">
            {stage.avg_hours_in_stage.toFixed(1)}h
          </p>
        </div>
        <div>
          <span className="text-xs text-text-muted">SLA compliance</span>
          <p className="text-sm font-medium text-text-primary">
            {slaCompliance}%
          </p>
        </div>
        <div>
          <span className="text-xs text-text-muted">Taxa conversao</span>
          <p
            className="text-sm font-medium text-text-muted"
            title="Disponivel na aba Analytics"
          >
            &mdash;
          </p>
        </div>
      </div>
    </div>
  );
};

export default StageMetricsPopover;
