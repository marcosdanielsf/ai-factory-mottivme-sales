import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface FunnelStage {
  label: string;
  keys: string[];
  count: number;
  color: string;
  gradient: string;
}

const FUNNEL_STAGES: Omit<FunnelStage, 'count'>[] = [
  {
    label: 'Leads Novos',
    keys: ['novo', 'new', 'lead'],
    color: '#3b82f6',
    gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
  },
  {
    label: 'Responderam',
    keys: ['respondeu', 'replied', 'responded'],
    color: '#8b5cf6',
    gradient: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
  },
  {
    label: 'Agendaram',
    keys: ['agendou', 'scheduled', 'booked'],
    color: '#a855f7',
    gradient: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
  },
  {
    label: 'Compareceram',
    keys: ['compareceu', 'attended', 'showed'],
    color: '#22c55e',
    gradient: 'linear-gradient(90deg, #a855f7, #22c55e)',
  },
  {
    label: 'Fecharam',
    keys: ['fechou', 'closed', 'won', 'sold'],
    color: '#10b981',
    gradient: 'linear-gradient(90deg, #22c55e, #10b981)',
  },
];

function JarvisFunnel() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('n8n_schedule_tracking')
        .select('etapa_funil')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (data) {
        const counts = new Map<string, number>();
        for (const row of data) {
          const etapa = (row.etapa_funil ?? '').toLowerCase().trim();
          counts.set(etapa, (counts.get(etapa) ?? 0) + 1);
        }

        const result: FunnelStage[] = FUNNEL_STAGES.map((stage) => {
          let count = 0;
          for (const key of stage.keys) {
            for (const [etapa, n] of counts) {
              if (etapa.includes(key)) count += n;
            }
          }
          return { ...stage, count };
        });

        setStages(result);
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col h-full">
      <h3
        className="text-xs font-mono tracking-widest mb-4 font-semibold"
        style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}
      >
        ⬡ FUNIL
      </h3>

      {loading && (
        <div className="text-text-muted text-xs font-mono">Carregando...</div>
      )}

      {!loading && (
        <div className="flex flex-col gap-3">
          {stages.map((stage) => (
            <div key={stage.label} className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <span className="text-text-secondary text-xs font-mono">
                  {stage.label}
                </span>
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: stage.color }}
                >
                  {stage.count}
                </span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: animated
                      ? `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 4 : 0)}%`
                      : '0%',
                    background: stage.gradient,
                    boxShadow: `0 0 8px ${stage.color}40`,
                    transition: 'width 1s ease-out',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JarvisFunnel;
export { JarvisFunnel };
