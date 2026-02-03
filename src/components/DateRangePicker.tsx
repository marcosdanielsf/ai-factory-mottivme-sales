import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: { label: string; days: number }[];
}

const defaultPresets = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
];

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string): Date | null => {
  if (!value) return null;
  const date = new Date(value + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
};

const getPresetRange = (days: number): DateRange => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  
  return { startDate: start, endDate: end };
};

const getActivePreset = (range: DateRange, presets: typeof defaultPresets): number | null => {
  if (!range.startDate || !range.endDate) return null;
  
  const now = new Date();
  const diffDays = Math.round((now.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Verificar se endDate é hoje
  const isEndToday = range.endDate.toDateString() === now.toDateString();
  if (!isEndToday) return null;
  
  for (const preset of presets) {
    if (diffDays === preset.days) return preset.days;
  }
  return null;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  presets = defaultPresets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const activePreset = getActivePreset(value, presets);

  // Sync temp values when opening
  useEffect(() => {
    if (isOpen) {
      setTempStart(formatDateForInput(value.startDate));
      setTempEnd(formatDateForInput(value.endDate));
    }
  }, [isOpen, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handlePresetClick = (days: number) => {
    const range = getPresetRange(days);
    onChange(range);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    const start = parseInputDate(tempStart);
    const end = parseInputDate(tempEnd);
    
    if (start && end) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      onChange({ startDate: start, endDate: end });
      setIsOpen(false);
    }
  };

  const getDisplayLabel = (): string => {
    if (activePreset !== null) {
      const preset = presets.find((p) => p.days === activePreset);
      return preset?.label || '';
    }
    if (value.startDate && value.endDate) {
      return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`;
    }
    return 'Selecionar período';
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-bg-hover border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors min-w-[180px] justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span className="truncate">{getDisplayLabel()}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Presets */}
          <div className="p-2 border-b border-border-default">
            <p className="text-xs text-text-muted mb-2 px-1">Atalhos</p>
            <div className="grid grid-cols-4 gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => handlePresetClick(preset.days)}
                  className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                    activePreset === preset.days
                      ? 'bg-blue-500 text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-3">
            <p className="text-xs text-text-muted mb-2">Período personalizado</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-text-muted block mb-1">Data inicial</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-default rounded text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted block mb-1">Data final</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-default rounded text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <button
                onClick={handleApplyCustom}
                disabled={!tempStart || !tempEnd}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-bg-tertiary disabled:text-text-muted text-white text-sm font-medium rounded transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
