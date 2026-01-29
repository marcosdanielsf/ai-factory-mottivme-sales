import React from 'react';

interface PeriodFilterProps {
  selected: number; // dias
  onChange: (days: number) => void;
}

const periods = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
];

export const PeriodFilter: React.FC<PeriodFilterProps> = ({ selected, onChange }) => {
  return (
    <div className="flex items-center gap-1 bg-bg-hover border border-border-default rounded-lg p-0.5">
      {periods.map(({ days, label }) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-2.5 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors ${
            selected === days
              ? 'bg-blue-500 text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default PeriodFilter;
