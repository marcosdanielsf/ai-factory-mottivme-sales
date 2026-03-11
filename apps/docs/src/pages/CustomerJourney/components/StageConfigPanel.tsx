import type { CjmStageConfig } from "../../../types/cjm";

interface StageConfigPanelProps {
  stageConfig: CjmStageConfig | null;
  onClose: () => void;
  onSave: (id: string, changes: Record<string, unknown>) => void;
}

/** Stub — full implementation in Task 2 */
const StageConfigPanel = ({
  stageConfig,
  onClose: _onClose,
  onSave: _onSave,
}: StageConfigPanelProps) => {
  if (!stageConfig) return null;
  return null;
};

export default StageConfigPanel;
