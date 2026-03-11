import React, { useState } from 'react';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus, Edit3 } from 'lucide-react';
import { ConditionRow } from './ConditionRow';

export interface FlowCondition {
  id: string;
  text: string;
  next_step_id: string | null;
}

export interface FlowStepData {
  id: string;
  name: string;
  mode: string;
  prompt_override: string;
  conditions: FlowCondition[];
}

interface FlowStepProps {
  step: FlowStepData;
  index: number;
  allSteps: FlowStepData[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (updated: FlowStepData) => void;
  onDelete: () => void;
  onDragStart?: () => void;
}

const MODES = [
  'sdr_inbound', 'social_seller_instagram', 'followuper', 'concierge',
  'scheduler', 'rescheduler', 'objection_handler', 'reativador_base', 'customersuccess'
];

export const FlowStep: React.FC<FlowStepProps> = ({
  step, index, allSteps, isExpanded, onToggleExpand, onChange, onDelete
}) => {
  const [editingName, setEditingName] = useState(false);

  const addCondition = () => {
    onChange({
      ...step,
      conditions: [...step.conditions, {
        id: crypto.randomUUID(),
        text: '',
        next_step_id: null,
      }],
    });
  };

  const updateCondition = (condId: string, updates: Partial<FlowCondition>) => {
    onChange({
      ...step,
      conditions: step.conditions.map(c => c.id === condId ? { ...c, ...updates } : c),
    });
  };

  const removeCondition = (condId: string) => {
    onChange({
      ...step,
      conditions: step.conditions.filter(c => c.id !== condId),
    });
  };

  return (
    <div className="border border-zinc-700 rounded-lg bg-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-zinc-700/30 transition-colors"
        onClick={onToggleExpand}
      >
        <GripVertical size={14} className="text-zinc-600 cursor-grab shrink-0" />

        <span className="text-xs font-mono text-zinc-500 w-6 shrink-0">#{index + 1}</span>

        {editingName ? (
          <input
            autoFocus
            value={step.name}
            onChange={e => onChange({ ...step, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        ) : (
          <span className="flex-1 text-sm text-white font-medium truncate">{step.name || 'Step sem nome'}</span>
        )}

        <button
          onClick={e => { e.stopPropagation(); setEditingName(true); }}
          className="p-1 text-zinc-500 hover:text-white rounded hover:bg-zinc-700 transition-colors"
        >
          <Edit3 size={12} />
        </button>

        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono shrink-0">
          {step.mode}
        </span>

        {step.conditions.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 shrink-0">
            {step.conditions.length} cond.
          </span>
        )}

        {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-700 px-4 py-3 space-y-3">
          {/* Mode */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Modo</label>
            <select
              value={step.mode}
              onChange={e => onChange({ ...step, mode: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Prompt Override */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Instrucao adicional (opcional)</label>
            <textarea
              value={step.prompt_override}
              onChange={e => onChange({ ...step, prompt_override: e.target.value })}
              placeholder="Instrucoes especificas para este step..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-500">Condicoes de transicao</label>
              <button
                onClick={addCondition}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>

            {step.conditions.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">Sem condicoes — avanca automaticamente para o proximo step</p>
            ) : (
              <div className="space-y-2">
                {step.conditions.map(cond => (
                  <ConditionRow
                    key={cond.id}
                    condition={cond}
                    allSteps={allSteps}
                    onChange={updates => updateCondition(cond.id, updates)}
                    onRemove={() => removeCondition(cond.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-zinc-700/50">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={12} /> Remover step
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
