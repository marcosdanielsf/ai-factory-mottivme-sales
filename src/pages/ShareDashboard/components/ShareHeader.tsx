import React from "react";
import { DateRangePicker } from "../../../components/DateRangePicker";
import type { DateRange } from "../../../components/DateRangePicker";

interface ShareHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const ShareHeader: React.FC<ShareHeaderProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MOTTIVME
          </span>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dashboard de Performance
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
    </header>
  );
};
