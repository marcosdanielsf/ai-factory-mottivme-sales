import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { useProjectTasks, useTaskMutations } from "./hooks";
import { KanbanBoard } from "./KanbanBoard";
import { ProjectsView } from "./ProjectsView";
import { createMindFlowFromProjetos } from "@/lib/projetosMindflowBridge";

type Tab = "kanban" | "projetos";

export function Projetos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("kanban");
  const [convertingToMindFlow, setConvertingToMindFlow] = useState(false);
  const { tasks, setTasks, loading, error } = useProjectTasks();
  const { updateStatus } = useTaskMutations(setTasks);

  const handleProjectClick = (projectKey: string) => {
    // Switch to kanban filtered by this project
    setActiveTab("kanban");
  };

  const handleConvertToMindFlow = async () => {
    if (convertingToMindFlow || tasks.length === 0) return;
    setConvertingToMindFlow(true);
    try {
      const mapId = await createMindFlowFromProjetos(tasks);
      navigate(`/mindflow/${mapId}`);
    } catch (e) {
      console.error("[Projetos] Erro ao converter para MindFlow:", e);
      alert("Erro ao converter para Mapa Mental. Tente novamente.");
    } finally {
      setConvertingToMindFlow(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-bg-hover rounded animate-pulse" />
            <div className="h-4 w-80 bg-bg-hover rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-[500px] bg-bg-hover rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-accent-error/10 border border-accent-error/20 rounded-xl p-6 text-center">
          <p className="text-accent-error font-medium">
            Erro ao carregar tarefas
          </p>
          <p className="text-text-muted text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projetos</h1>
          <p className="text-text-muted mt-1">
            {tasks.filter((t) => t.status !== "done").length} tarefas abertas em{" "}
            {new Set(tasks.map((t) => t.project_key)).size} projetos
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* MindFlow button */}
          <button
            onClick={handleConvertToMindFlow}
            disabled={convertingToMindFlow || tasks.length === 0}
            title="Abrir como Mapa Mental"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-[rgba(110,231,247,0.1)] to-[rgba(167,139,250,0.1)] border border-[rgba(110,231,247,0.2)] text-[#6EE7F7] hover:from-[rgba(110,231,247,0.15)] hover:to-[rgba(167,139,250,0.15)] transition-all disabled:opacity-40"
          >
            {convertingToMindFlow ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <BrainCircuit size={14} />
            )}
            Mapa Mental
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center bg-bg-secondary border border-border-default rounded-lg p-1">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "kanban"
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setActiveTab("projetos")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "projetos"
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Projetos
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "kanban" ? (
        <KanbanBoard
          tasks={tasks}
          setTasks={setTasks}
          updateStatus={updateStatus}
        />
      ) : (
        <ProjectsView tasks={tasks} onProjectClick={handleProjectClick} />
      )}
    </div>
  );
}

export default Projetos;
