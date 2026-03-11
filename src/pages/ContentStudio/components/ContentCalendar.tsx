import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram, Linkedin, Facebook, Mail } from 'lucide-react';
import type { ContentPiece } from '../../../hooks/useContentPieces';

interface ContentCalendarProps {
  pieces: ContentPiece[];
  loading: boolean;
}

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  email: Mail,
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ContentCalendar({ pieces, loading }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const scheduledPieces = useMemo(() => {
    return pieces.filter(p => p.scheduled_at || p.published_at);
  }, [pieces]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: number; pieces: ContentPiece[] }[] = [];

    // Empty slots for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: 0, pieces: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayPieces = scheduledPieces.filter(p => {
        const pDate = new Date(p.scheduled_at || p.published_at || '');
        return pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() === d;
      });
      days.push({ date: d, pieces: dayPieces });
    }

    return days;
  }, [year, month, scheduledPieces]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-bg-tertiary rounded" />
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-tertiary rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-bg-hover text-text-muted"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map(day => (
          <div key={day} className="text-xs text-text-muted text-center py-2 font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isToday = day.date > 0 &&
            new Date().getFullYear() === year &&
            new Date().getMonth() === month &&
            new Date().getDate() === day.date;

          return (
            <div
              key={i}
              className={`min-h-[5rem] p-1.5 rounded-md border ${
                day.date === 0
                  ? 'border-transparent'
                  : isToday
                    ? 'border-accent-primary/50 bg-accent-primary/5'
                    : 'border-border-default bg-bg-secondary'
              }`}
            >
              {day.date > 0 && (
                <>
                  <span className={`text-xs font-medium ${isToday ? 'text-accent-primary' : 'text-text-muted'}`}>
                    {day.date}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {day.pieces.slice(0, 3).map(piece => {
                      const Icon = piece.platform ? PLATFORM_ICONS[piece.platform] : null;
                      return (
                        <div
                          key={piece.id}
                          className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate ${
                            piece.approval_status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {Icon && <Icon className="w-2.5 h-2.5 flex-shrink-0" />}
                          <span className="truncate">{piece.type}</span>
                        </div>
                      );
                    })}
                    {day.pieces.length > 3 && (
                      <span className="text-[10px] text-text-muted px-1">+{day.pieces.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-blue-500/40" />
          <span>Agendado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500/40" />
          <span>Publicado</span>
        </div>
        <span className="ml-auto">{scheduledPieces.length} itens no calendario</span>
      </div>
    </div>
  );
}
