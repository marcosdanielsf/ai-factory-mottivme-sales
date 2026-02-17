import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface AgentCost {
  name: string;
  total_cost: number;
}

function JarvisCostBreakdown() {
  const [agents, setAgents] = useState<AgentCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('aios_agents')
        .select('name, total_cost')
        .gt('total_cost', 0)
        .order('total_cost', { ascending: false })
        .limit(8);

      if (data) {
        setAgents(data as AgentCost[]);
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

  const maxCost = Math.max(...agents.map((a) => a.total_cost), 0.01);

  return (
    <div className="flex flex-col h-full">
      <h3
        className="text-xs font-mono tracking-widest mb-4 font-semibold"
        style={{ color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.3)' }}
      >
        ⬡ CUSTOS POR AGENTE
      </h3>

      {loading && (
        <div className="text-text-muted text-xs font-mono">Carregando...</div>
      )}

      {!loading && agents.length === 0 && (
        <div className="text-text-muted text-xs font-mono">
          Nenhum custo registrado
        </div>
      )}

      {!loading && agents.length > 0 && (
        <div className="flex flex-col gap-3">
          {agents.map((agent) => (
            <div key={agent.name} className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <span className="text-text-secondary text-xs font-mono truncate max-w-[160px]">
                  {agent.name}
                </span>
                <span
                  className="text-xs font-mono font-bold flex-shrink-0 ml-2"
                  style={{ color: '#00d4ff' }}
                >
                  ${agent.total_cost.toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: animated
                      ? `${Math.max((agent.total_cost / maxCost) * 100, 4)}%`
                      : '0%',
                    background: 'linear-gradient(90deg, #00d4ff, #0ea5e9)',
                    boxShadow: '0 0 8px rgba(0,212,255,0.3)',
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

export default JarvisCostBreakdown;
export { JarvisCostBreakdown };
