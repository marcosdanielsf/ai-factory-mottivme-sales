import { useState } from 'react';

interface PhaseSegment {
  id: string;
  name: string;
  status: string;
}

const PHASE_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-600',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

interface StoryPhaseProgressProps {
  phases: PhaseSegment[];
  completedPhases: number;
  totalPhases: number;
}

export function StoryPhaseProgress({ phases, completedPhases, totalPhases }: StoryPhaseProgressProps) {
  const [tooltip, setTooltip] = useState<{ id: string; name: string } | null>(null);

  if (phases.length === 0) {
    return (
      <div className="text-text-muted text-xs">Sem fases definidas</div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5 relative">
        {phases.map((phase) => {
          const color = PHASE_STATUS_COLOR[phase.status] ?? 'bg-gray-600';
          return (
            <div
              key={phase.id}
              className="relative flex-1"
              onMouseEnter={() => setTooltip({ id: phase.id, name: phase.name })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className={`h-2 rounded-sm ${color} cursor-default`} />
              {tooltip?.id === phase.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 whitespace-nowrap">
                  <div className="bg-gray-900 border border-border-default text-text-primary text-xs px-2 py-1 rounded shadow-lg">
                    {phase.name}
                    <span
                      className={`ml-1.5 ${
                        phase.status === 'completed'
                          ? 'text-green-400'
                          : phase.status === 'in_progress'
                          ? 'text-blue-400'
                          : phase.status === 'failed'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      ({phase.status})
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-text-muted text-xs">
        {completedPhases} de {totalPhases} fases completas
      </p>
    </div>
  );
}
