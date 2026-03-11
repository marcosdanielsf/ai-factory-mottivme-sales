import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface TimelineItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  etapa_funil: string;
  location_id: string;
  created_at: string;
  updated_at: string;
}

const ETAPA_COLORS: Record<string, string> = {
  novo: '#3b82f6',
  new: '#3b82f6',
  lead: '#3b82f6',
  respondeu: '#eab308',
  replied: '#eab308',
  agendou: '#22c55e',
  scheduled: '#22c55e',
  booked: '#22c55e',
  fechou: '#a855f7',
  closed: '#a855f7',
  won: '#a855f7',
  sold: '#a855f7',
};

function getDotColor(etapa: string): string {
  const normalized = etapa.toLowerCase().trim();
  for (const [key, color] of Object.entries(ETAPA_COLORS)) {
    if (normalized.includes(key)) return color;
  }
  return '#3b82f6';
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  if (diffHr < 24) return `há ${diffHr}h`;
  return `há ${Math.floor(diffHr / 24)}d`;
}

function JarvisTimeline() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('n8n_schedule_tracking')
        .select('id, first_name, last_name, etapa_funil, location_id, created_at, updated_at')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(15);

      if (data) {
        setItems(data as TimelineItem[]);
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <>
      <style>{`
        @keyframes jarvisSlideIn {
          0% { opacity: 0; transform: translateY(-12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex flex-col h-full">
        <h3
          className="text-xs font-mono tracking-widest mb-4 font-semibold"
          style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}
        >
          ⬡ TIMELINE
        </h3>

        {loading && (
          <div className="text-text-muted text-xs font-mono">Carregando...</div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-text-muted text-xs font-mono">
            Nenhuma interação nas últimas 24h
          </div>
        )}

        <div className="flex-1 overflow-y-auto max-h-[400px] pr-1" style={{ scrollbarWidth: 'thin' }}>
          <div className="relative pl-6">
            {/* Timeline line */}
            {items.length > 0 && (
              <div
                className="absolute left-[7px] top-1 bottom-1 w-[2px] rounded-full"
                style={{ backgroundColor: 'rgba(0,212,255,0.15)' }}
              />
            )}

            {items.map((item, idx) => {
              const dotColor = getDotColor(item.etapa_funil);
              return (
                <div
                  key={item.id}
                  className="relative pb-4 last:pb-0"
                  style={{
                    animation: `jarvisSlideIn 0.3s ease-out ${idx * 0.05}s both`,
                  }}
                >
                  {/* Dot */}
                  <div
                    className="absolute left-[-18px] top-[3px] w-[10px] h-[10px] rounded-full border-2"
                    style={{
                      backgroundColor: dotColor,
                      borderColor: dotColor,
                      boxShadow: `0 0 6px ${dotColor}`,
                    }}
                  />

                  {/* Content */}
                  <div className="flex flex-col gap-0.5">
                    <div className="text-text-primary text-sm font-medium truncate max-w-[200px]">
                      {[item.first_name, item.last_name].filter(Boolean).join(' ') || 'Sem nome'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${dotColor}15`,
                          color: dotColor,
                        }}
                      >
                        {item.etapa_funil}
                      </span>
                      <span className="text-text-muted text-xs">
                        {getRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default JarvisTimeline;
export { JarvisTimeline };
