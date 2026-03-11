import { useState, useCallback, useMemo } from "react";
import { useCjmPipelineMap } from "../../hooks/useCjmPipelineMap";
import { useCjmClientPositions } from "../../hooks/useCjmClientPositions";
import { useCjmRealtime } from "../../hooks/useCjmRealtime";
import type { CjmTab, CjmBroadcastPayload } from "../../types/cjm";

const TABS: { key: CjmTab; label: string }[] = [
  { key: "map", label: "Mapa" },
  { key: "analytics", label: "Analytics" },
  { key: "sla", label: "SLA" },
  { key: "editor", label: "Editor" },
];

const CustomerJourney = () => {
  const [activeTab, setActiveTab] = useState<CjmTab>("map");

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

  // Summary stats
  const totalClients = useMemo(() => positions.length, [positions]);
  const totalPipelines = pipelines.length;

  const loading = pipelinesLoading || positionsLoading;

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

              {/* Pipeline list placeholder — visual components in Plan 10-02 */}
              {pipelines.map((pipeline) => (
                <div
                  key={pipeline.pipeline_id}
                  className="p-4 rounded-lg bg-bg-secondary border border-border-default"
                >
                  <h3 className="font-medium text-text-primary">
                    {pipeline.pipeline_name}
                  </h3>
                  <p className="text-sm text-text-muted mt-1">
                    {pipeline.stages.length} etapas |{" "}
                    {pipeline.stages.reduce(
                      (sum, s) => sum + s.contact_count,
                      0,
                    )}{" "}
                    contatos
                  </p>
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {pipeline.stages.map((stage) => (
                      <div
                        key={stage.current_stage}
                        className="flex-shrink-0 px-3 py-2 rounded bg-bg-tertiary text-xs"
                      >
                        <span className="text-text-primary">
                          {stage.stage_name}
                        </span>
                        <span className="text-text-muted ml-2">
                          ({stage.contact_count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab !== "map" && (
        <div className="p-8 text-text-muted">Em breve</div>
      )}
    </div>
  );
};

export default CustomerJourney;
