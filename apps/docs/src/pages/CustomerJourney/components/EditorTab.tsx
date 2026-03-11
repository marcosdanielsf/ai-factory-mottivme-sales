import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CjmStageConfig } from "../../../types/cjm";

interface EditorTabProps {
  stageConfigs: CjmStageConfig[];
  onEdit: (stageId: string) => void;
}

const EditorTab = ({ stageConfigs, onEdit }: EditorTabProps) => {
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { pipeline_id: string; stages: CjmStageConfig[] }
    >();
    for (const cfg of stageConfigs) {
      if (!map.has(cfg.pipeline_name)) {
        map.set(cfg.pipeline_name, {
          pipeline_id: cfg.pipeline_id,
          stages: [],
        });
      }
      map.get(cfg.pipeline_name)!.stages.push(cfg);
    }
    // Sort stages within each pipeline
    for (const entry of map.values()) {
      entry.stages.sort((a, b) => a.stage_order - b.stage_order);
    }
    return map;
  }, [stageConfigs]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (stageConfigs.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p className="text-lg font-medium">
          Nenhuma configuração de etapa encontrada
        </p>
        <p className="text-sm mt-2">
          Configure as etapas nos pipelines para visualizá-las aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([pipelineName, { stages }]) => {
        const isCollapsed = collapsed.has(pipelineName);
        return (
          <div
            key={pipelineName}
            className="rounded-lg bg-bg-secondary overflow-hidden"
          >
            {/* Pipeline header */}
            <button
              onClick={() => toggleCollapse(pipelineName)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-tertiary transition-colors"
            >
              <span className="font-medium text-text-primary text-sm">
                {pipelineName}
              </span>
              <span className="flex items-center gap-2 text-text-muted">
                <span className="text-xs">{stages.length} etapas</span>
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>

            {/* Stage table */}
            {!isCollapsed && (
              <table className="w-full text-sm border-t border-border-default">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-4 py-2 text-left text-xs text-text-muted font-medium w-8" />
                    <th className="px-4 py-2 text-left text-xs text-text-muted font-medium">
                      Etapa
                    </th>
                    <th className="px-4 py-2 text-left text-xs text-text-muted font-medium">
                      Responsável
                    </th>
                    <th className="px-4 py-2 text-right text-xs text-text-muted font-medium">
                      SLA
                    </th>
                    <th className="px-4 py-2 text-left text-xs text-text-muted font-medium">
                      Ferramentas
                    </th>
                    <th className="px-4 py-2 text-center text-xs text-text-muted font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((cfg) => (
                    <tr
                      key={cfg.id}
                      onClick={() => onEdit(cfg.stage_id)}
                      className="border-b border-border-default last:border-0 hover:bg-bg-tertiary transition-colors cursor-pointer"
                    >
                      {/* Color dot */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ background: cfg.color ?? "#6366f1" }}
                        />
                      </td>
                      <td className="px-4 py-3 text-text-primary font-medium">
                        {cfg.stage_name}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {cfg.owner_name ?? (
                          <span className="text-text-muted italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">
                        {cfg.sla_hours != null ? `${cfg.sla_hours}h` : "-"}
                      </td>
                      <td className="px-4 py-3 text-text-muted text-xs max-w-[180px]">
                        <span className="block truncate">
                          {Array.isArray(cfg.tools) && cfg.tools.length > 0
                            ? cfg.tools.join(", ")
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            cfg.is_active
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {cfg.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EditorTab;
