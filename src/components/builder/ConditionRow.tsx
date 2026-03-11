import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { FlowCondition, FlowStepData } from './FlowStep';

interface ConditionRowProps {
  condition: FlowCondition;
  allSteps: FlowStepData[];
  onChange: (updates: Partial<FlowCondition>) => void;
  onRemove: () => void;
}

export const ConditionRow: React.FC<ConditionRowProps> = ({ condition, allSteps, onChange, onRemove }) => {
  return (
    <div className="flex items-center gap-2 bg-zinc-900/50 rounded p-2">
      <input
        value={condition.text}
        onChange={e => onChange({ text: e.target.value })}
        placeholder="Se o lead disser..."
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
      />

      <ArrowRight size={12} className="text-zinc-600 shrink-0" />

      <select
        value={condition.next_step_id || ''}
        onChange={e => onChange({ next_step_id: e.target.value || null })}
        className="w-36 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
      >
        <option value="">Proximo step</option>
        {allSteps.map(s => (
          <option key={s.id} value={s.id}>{s.name || `Step ${s.id.slice(0, 4)}`}</option>
        ))}
      </select>

      <button
        onClick={onRemove}
        className="p-1 text-zinc-600 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
};
