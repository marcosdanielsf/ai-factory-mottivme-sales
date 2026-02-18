import { ChevronLeft, ChevronRight } from 'lucide-react';

export function YearSelector({ year, onChange, savedYears }: {
  year: number;
  onChange: (y: number) => void;
  savedYears: number[];
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(year - 1)}
        className="p-1.5 hover:bg-bg-hover rounded-lg transition-colors border border-border-default"
      >
        <ChevronLeft size={16} className="text-text-muted" />
      </button>

      <div className="text-center">
        <div className="text-lg font-bold text-text-primary">{year}</div>
        <div className="text-[10px] text-text-muted">
          {savedYears.includes(year) ? 'Plano salvo' : 'Novo plano'}
        </div>
      </div>

      <button
        onClick={() => onChange(year + 1)}
        className="p-1.5 hover:bg-bg-hover rounded-lg transition-colors border border-border-default"
      >
        <ChevronRight size={16} className="text-text-muted" />
      </button>

      {savedYears.length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          {savedYears.map(y => (
            <button
              key={y}
              onClick={() => onChange(y)}
              className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                y === year
                  ? 'bg-blue-500 text-white'
                  : 'bg-bg-hover text-text-muted hover:text-text-primary border border-border-default'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
