import { useState, useCallback, useMemo } from "react";
import { useCjmPipelineMap } from "../../hooks/useCjmPipelineMap";
import { useCjmClientPositions } from "../../hooks/useCjmClientPositions";
import { useCjmStageConfig } from "../../hooks/useCjmStageConfig";
import { useCjmRealtime } from "../../hooks/useCjmRealtime";
import type {
  CjmTab,
  CjmBroadcastPayload,
  PipelineMapData,
} from "../../types/cjm";
import JourneyCanvas from "./components/JourneyCanvas";
import StageConfigPanel from "./components/StageConfigPanel";
import AnalyticsTab from "./components/AnalyticsTab";
import SlaTab from "./components/SlaTab";
import EditorTab from "./components/EditorTab";

const TABS: { key: CjmTab; label: string }[] = [
  { key: "map", label: "Mapa" },
  { key: "analytics", label: "Analytics" },
  { key: "sla", label: "SLA" },
  { key: "editor", label: "Editor" },
];

const CustomerJourney = () => {
  const [activeTab, setActiveTab] = useState<CjmTab>("map");
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null);

  // Data hooks — locationId null = all locations
  const {
    pipelines,
    loading: pipelinesLoading,
    error: pipelinesError,
    refetch: refetchPipelines,
  } = useCjmPipelineMap(null);

  const {
    positions,
    loading: positionsLoading,
    refetch: refetchPositions,
  } = useCjmClientPositions(null);

  const { stageConfigs, updateStageConfig } = useCjmStageConfig(null);

  // Combined refetch for realtime
  const refetchAll = useCallback(() => {
    refetchPipelines();
    refetchPositions();
  }, [refetchPipelines, refetchPositions]);

  // Realtime subscription
  const handleStageChange = useCallback(
    (_payload: CjmBroadcastPayload) => {
      refetchAll();
    },
    [refetchAll],
  );

  const { isSubscribed } = useCjmRealtime(handleStageChange, refetchAll);

  // Merge client positions into pipeline stages
  const pipelinesWithClients: PipelineMapData[] = useMemo(() => {
    return pipelines.map((pipeline) => ({
      ...pipeline,
      stages: pipeline.stages.map((stage) => ({
        ...stage,
        clients: positions.filter(
          (p) =>
            p.pipeline_id === pipeline.pipeline_id &&
            p.current_stage === stage.current_stage,
        ),
      })),
    }));
  }, [pipelines, positions]);

  // Summary stats
  const totalClients = useMemo(() => positions.length, [positions]);
  const totalPipelines = pipelines.length;

  const loading = pipelinesLoading || positionsLoading;

  // Stage config panel
  const selectedConfig = useMemo(() => {
    if (!selectedStageKey) return null;
    return stageConfigs.find((c) => c.stage_id === selectedStageKey) || null;
  }, [selectedStageKey, stageConfigs]);

  const handleConfigSave = useCallback(
    async (id: string, changes: Record<string, unknown>) => {
      await updateStageConfig(id, changes);
      setSelectedStageKey(null);
    },
    [updateStageConfig],
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Jornada do Cliente
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Visualize o progresso dos clientes em cada etapa do pipeline
          </p>
        </div>
        {isSubscribed && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ao vivo
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent-primary text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {pipelinesError && (
        <div className="p-4 rounded-lg bg-red-500/10 text-red-400 text-sm">
          Erro ao carregar dados: {pipelinesError}
        </div>
      )}

      {activeTab === "map" && (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-bg-secondary animate-pulse"
                />
              ))}
              <p className="text-sm text-text-muted">Carregando jornada...</p>
            </div>
          ) : totalPipelines === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="text-lg font-medium">
                Nenhum dado de pipeline encontrado
              </p>
              <p className="text-sm mt-2">
                Verifique se existem dados de pipeline para a localizacao
                selecionada.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="p-4 rounded-lg bg-bg-secondary">
                  <p className="text-xs text-text-muted">Pipelines</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {totalPipelines}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary">
                  <p className="text-xs text-text-muted">Clientes ativos</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {totalClients}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary">
                  <p className="text-xs text-text-muted">Total etapas</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {pipelines.reduce((sum, p) => sum + p.stages.length, 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-bg-secondary">
                  <p className="text-xs text-text-muted">Realtime</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {isSubscribed ? "ON" : "OFF"}
                  </p>
                </div>
              </div>

              {/* Journey Map Canvas */}
              <JourneyCanvas
                pipelines={pipelinesWithClients}
                onConfigClick={setSelectedStageKey}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab pipelines={pipelinesWithClients} />
      )}
      {activeTab === "sla" && <SlaTab />}
      {activeTab === "editor" && (
        <EditorTab stageConfigs={stageConfigs} onEdit={setSelectedStageKey} />
      )}

      {/* Stage Config Panel */}
      <StageConfigPanel
        stageConfig={selectedConfig}
        onClose={() => setSelectedStageKey(null)}
        onSave={handleConfigSave}
      />
    </div>
  );
};

export default CustomerJourney;
