import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { salesOpsDAO, type FuuQueueStats } from '../../../lib/supabase-sales-ops';

interface FuuQueueCardProps {
  locationId?: string | null;
  isLoading?: boolean;
  onClick?: () => void;
}

export const FuuQueueCard: React.FC<FuuQueueCardProps> = ({
  locationId,
  isLoading: externalLoading = false,
  onClick,
}) => {
  const [stats, setStats] = useState<FuuQueueStats>({ scheduled: 0, pending: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [locationId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await salesOpsDAO.getFuuQueueStats(locationId ?? undefined);
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar fuu_queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = externalLoading || loading;
  const total = stats.scheduled + stats.pending + stats.failed;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d1f2d] border border-[#333] rounded-lg p-3 md:p-4 animate-pulse">
        <div className="h-3 md:h-4 bg-[#333] rounded w-1/2 mb-2 md:mb-3" />
        <div className="h-6 md:h-8 bg-[#333] rounded w-2/3 mb-2" />
        <div className="h-3 bg-[#333] rounded w-full" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-gradient-to-br from-[#1a1a1a] to-[#0d1f2d] border border-[#2a4a6a] rounded-lg p-3 md:p-4 transition-all
        ${onClick 
          ? 'cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98]' 
          : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Calendar size={14} className="text-blue-400 md:w-4 md:h-4" />
          </div>
          <h3 className="text-xs md:text-sm text-gray-300 font-medium">📅 Follow-ups Agendados</h3>
        </div>
      </div>

      {/* Main Value - Total na fila (scheduled + pending) */}
      <div className="text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3">
        {(stats.scheduled + stats.pending).toLocaleString()}
        <span className="text-sm md:text-base font-normal text-gray-400 ml-2">na fila</span>
      </div>

      {/* Sub-badges */}
      <div className="flex flex-wrap gap-2">
        {stats.scheduled > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <Calendar size={12} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">
              📅 {stats.scheduled} agendados
            </span>
          </div>
        )}

        {stats.pending > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
            <Clock size={12} className="text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">
              🟡 {stats.pending} pendentes
            </span>
          </div>
        )}
        
        {stats.failed > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <AlertCircle size={12} className="text-red-400" />
            <span className="text-xs text-red-400 font-medium">
              🔴 {stats.failed} falharam
            </span>
          </div>
        )}

        {stats.pending === 0 && stats.scheduled === 0 && stats.failed === 0 && (
          <span className="text-xs text-gray-500">Nenhum follow-up na fila</span>
        )}
      </div>

      {/* Footer hint */}
      {onClick && total > 0 && (
        <p className="text-[10px] md:text-xs text-gray-500 mt-2 md:mt-3">
          Clique para ver detalhes →
        </p>
      )}
    </div>
  );
};

export default FuuQueueCard;
