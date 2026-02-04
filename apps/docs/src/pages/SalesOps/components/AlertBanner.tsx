import React, { useEffect, useState } from 'react';
import { Bell, ChevronRight, X } from 'lucide-react';
import { salesOpsDAO } from '../../../lib/supabase-sales-ops';

interface AlertBannerProps {
  locationId?: string | null;
  onViewClick: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ locationId, onViewClick }) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadCount();
  }, [locationId]);

  const loadCount = async () => {
    setLoading(true);
    try {
      const leadsEsfriando = await salesOpsDAO.getLeadsEsfriando(locationId ?? undefined);
      setCount(leadsEsfriando);
      // Se o usuário tinha dismissado mas agora tem mais leads, mostra de novo
      if (leadsEsfriando > 0 && dismissed) {
        setDismissed(false);
      }
    } catch (error) {
      console.error('Erro ao carregar leads esfriando:', error);
    } finally {
      setLoading(false);
    }
  };

  // Não mostra se não tem leads esfriando ou foi dismissed
  if (loading || count === 0 || dismissed) {
    return null;
  }

  return (
    <div className="mx-4 md:mx-6 mt-4 md:mt-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-xl p-3 md:p-4">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 animate-pulse" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Content */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center animate-bounce">
              <Bell className="text-amber-400" size={20} />
            </div>
            <div>
              <p className="text-sm md:text-base font-semibold text-amber-200">
                🔔 ALERTA: {count} {count === 1 ? 'lead' : 'leads'} sem contato há +48h
              </p>
              <p className="text-xs md:text-sm text-amber-300/70">
                Esses leads podem estar esfriando. Priorize o contato!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-13 md:ml-0">
            <button
              onClick={onViewClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25"
            >
              Ver Agora
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 rounded-lg hover:bg-amber-500/20 transition-colors"
              title="Dispensar alerta"
            >
              <X size={18} className="text-amber-400/70 hover:text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;
