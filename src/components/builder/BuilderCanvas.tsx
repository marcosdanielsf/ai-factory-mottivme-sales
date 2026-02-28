import React, { useState, useCallback } from 'react';
import { Plus, Save, Undo2, Download, Upload } from 'lucide-react';
import { FlowStep, type FlowStepData } from './FlowStep';

export interface AgentFlow {
  steps: FlowStepData[];
}

interface BuilderCanvasProps {
  initialFlow: AgentFlow | null;
  onSave: (flow: AgentFlow) => Promise<void>;
  agentName?: string;
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({ initialFlow, onSave, agentName }) => {
  const [steps, setSteps] = useState<FlowStepData[]>(initialFlow?.steps || []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const addStep = useCallback(() => {
    const newStep: FlowStepData = {
      id: crypto.randomUUID(),
      name: `Step ${steps.length + 1}`,
      mode: 'sdr_inbound',
      prompt_override: '',
      conditions: [],
    };
    setSteps(prev => [...prev, newStep]);
    setExpandedId(newStep.id);
    setIsDirty(true);
  }, [steps.length]);

  const updateStep = useCallback((id: string, updated: FlowStepData) => {
    setSteps(prev => prev.map(s => s.id === id ? updated : s));
    setIsDirty(true);
  }, []);

  const deleteStep = useCallback((id: string) => {
    setSteps(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map(s => ({
        ...s,
        conditions: s.conditions.map(c =>
          c.next_step_id === id ? { ...c, next_step_id: null } : c
        ),
      }));
    });
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({ steps });
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  }, [steps, onSave]);

  const handleReset = useCallback(() => {
    setSteps(initialFlow?.steps || []);
    setIsDirty(false);
  }, [initialFlow]);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify({ steps }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-flow-${agentName || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [steps, agentName]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          setSteps(parsed.steps);
          setIsDirty(true);
        }
      } catch {
        alert('Arquivo JSON invalido');
      }
    };
    input.click();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">
            Flow Builder {agentName && <span className="text-zinc-500 font-normal">— {agentName}</span>}
          </h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
            {steps.length} steps
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleImport}
            className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
            title="Importar JSON"
          >
            <Upload size={14} />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
            title="Exportar JSON"
          >
            <Download size={14} />
          </button>
          <button
            onClick={handleReset}
            disabled={!isDirty}
            className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Desfazer alteracoes"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
              isDirty ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Save size={12} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Salvando...' : 'Salvar Flow'}
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
              <Plus size={24} className="text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 mb-1">Nenhum step configurado</p>
            <p className="text-xs text-zinc-600 mb-4">Adicione steps para definir o fluxo do agente</p>
            <button
              onClick={addStep}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
            >
              Adicionar primeiro step
            </button>
          </div>
        ) : (
          <>
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <FlowStep
                  step={step}
                  index={i}
                  allSteps={steps}
                  isExpanded={expandedId === step.id}
                  onToggleExpand={() => setExpandedId(prev => prev === step.id ? null : step.id)}
                  onChange={updated => updateStep(step.id, updated)}
                  onDelete={() => deleteStep(step.id)}
                />
                {i < steps.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-px h-4 bg-zinc-700" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {/* Add Step Button (sticky bottom) */}
      {steps.length > 0 && (
        <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-900 shrink-0">
          <button
            onClick={addStep}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-zinc-600 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            <Plus size={14} /> Adicionar step
          </button>
        </div>
      )}
    </div>
  );
};
