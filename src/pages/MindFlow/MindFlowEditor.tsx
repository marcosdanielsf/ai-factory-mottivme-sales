import { useParams } from "react-router-dom";
import { MindFlowEditor as MindFlowCanvas } from "@/components/mindflow/canvas/CanvasRenderer";

export function MindFlowEditorPage() {
  const { id } = useParams<{ id: string }>();

  // id is available for future Supabase integration (load/save map by id)
  void id;

  return <MindFlowCanvas />;
}
