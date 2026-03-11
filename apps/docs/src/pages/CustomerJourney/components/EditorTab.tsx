import type { CjmStageConfig } from "../../../types/cjm";
import StageEditorDnD from "./StageEditorDnD";

interface EditorTabProps {
  stageConfigs: CjmStageConfig[];
  onEdit: (stageId: string) => void;
  onUpdate: (id: string, changes: Record<string, unknown>) => Promise<void>;
}

const EditorTab = ({ stageConfigs, onEdit, onUpdate }: EditorTabProps) => {
  return (
    <StageEditorDnD
      stageConfigs={stageConfigs}
      onUpdate={onUpdate}
      onEdit={onEdit}
    />
  );
};

export default EditorTab;
