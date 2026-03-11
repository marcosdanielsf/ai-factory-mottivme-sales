import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { CjmStageConfig } from "../../../types/cjm";

interface StageConfigPanelProps {
  stageConfig: CjmStageConfig | null;
  onClose: () => void;
  onSave: (id: string, changes: Record<string, unknown>) => void;
}

const PRESET_COLORS = [
  { name: "emerald", value: "#10b981" },
  { name: "blue", value: "#3b82f6" },
  { name: "purple", value: "#8b5cf6" },
  { name: "amber", value: "#f59e0b" },
  { name: "red", value: "#ef4444" },
  { name: "pink", value: "#ec4899" },
  { name: "cyan", value: "#06b6d4" },
  { name: "gray", value: "#6b7280" },
];

const StageConfigPanel = ({
  stageConfig,
  onClose,
  onSave,
}: StageConfigPanelProps) => {
  const [ownerName, setOwnerName] = useState("");
  const [slaHours, setSlaHours] = useState<number | "">("");
  const [tools, setTools] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [icon, setIcon] = useState("");

  // Reset local state when stageConfig changes
  useEffect(() => {
    if (stageConfig) {
      setOwnerName(stageConfig.owner_name || "");
      setSlaHours(stageConfig.sla_hours ?? "");
      setTools(stageConfig.tools?.join(", ") || "");
      setDescription(stageConfig.description || "");
      setColor(stageConfig.color || null);
      setIcon(stageConfig.icon || "");
    }
  }, [stageConfig?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    if (!stageConfig) return;
    onSave(stageConfig.id, {
      owner_name: ownerName || null,
      sla_hours: slaHours === "" ? null : Number(slaHours),
      tools: tools
        ? tools
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : null,
      description: description || null,
      color: color || null,
      icon: icon || null,
    });
  };

  const isOpen = stageConfig !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[360px] bg-bg-primary border-l border-border-default shadow-xl z-40 transform transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {stageConfig && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
              <h3 className="text-lg font-semibold text-text-primary">
                {stageConfig.stage_name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-bg-hover text-text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Owner */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Responsavel
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Nome do responsavel"
                  className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              {/* SLA */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  SLA (horas)
                </label>
                <input
                  type="number"
                  value={slaHours}
                  onChange={(e) =>
                    setSlaHours(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  min={1}
                  placeholder="24"
                  className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              {/* Tools */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Ferramentas
                </label>
                <input
                  type="text"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                  placeholder="CRM, WhatsApp, Email"
                  className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
                <p className="text-xs text-text-muted mt-1">
                  Separadas por virgula
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Descricao
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descreva o objetivo desta etapa..."
                  className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Cor
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setColor(preset.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === preset.value
                          ? "border-text-primary scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Icone (lucide)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="phone, mail, calendar..."
                  className="w-full px-3 py-2 rounded-md border border-border-default bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-border-default flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-bg-secondary text-text-secondary hover:bg-bg-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-accent-primary text-white hover:opacity-90 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StageConfigPanel;
