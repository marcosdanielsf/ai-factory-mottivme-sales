import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface WorkPermitData {
  status: string;
  total: number;
  ativos: number;
}

interface StateData {
  state: string;
  total: number;
  ativos: number;
}

interface LeadDemographics {
  work_permit: WorkPermitData[];
  states: StateData[];
  updated_at: string;
}

interface UseLeadDemographicsReturn {
  demographics: LeadDemographics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeadDemographics(locationId?: string): UseLeadDemographicsReturn {
  const [demographics, setDemographics] = useState<LeadDemographics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemographics = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('get_lead_demographics', { p_location_id: locationId || null });

      if (rpcError) {
        // If function doesn't exist, fetch raw data
        if (rpcError.code === 'PGRST202') {
          const { data: rawData, error: rawError } = await supabase
            .from('n8n_schedule_tracking')
            .select('work_permit, state, ativo')
            .limit(1000);

          if (rawError) throw rawError;

          // Process raw data client-side
          const workPermitMap = new Map<string, { total: number; ativos: number }>();
          const stateMap = new Map<string, { total: number; ativos: number }>();

          (rawData || []).forEach((lead: { work_permit: string | null; state: string | null; ativo: boolean }) => {
            // Work permit processing - treat "NULL" string as not informed
            let wpStatus = 'Não informado';
            const wp = (lead.work_permit || '').trim();
            const wpLower = wp.toLowerCase();
            if (['sim', 'yes', 'true', '1'].includes(wpLower)) wpStatus = 'Sim';
            else if (['nao', 'não', 'no', 'false', '0'].includes(wpLower)) wpStatus = 'Não';
            else if (wp && wpLower !== 'null' && wp !== 'NULL') wpStatus = 'Outro';

            const wpCurrent = workPermitMap.get(wpStatus) || { total: 0, ativos: 0 };
            wpCurrent.total++;
            if (lead.ativo) wpCurrent.ativos++;
            workPermitMap.set(wpStatus, wpCurrent);

            // State processing - treat "NULL" string as not informed
            let stateName = 'Não informado';
            const st = (lead.state || '').trim();
            if (st && st.toLowerCase() !== 'null' && st !== 'NULL') {
              // Normalize state names (Florida, Flórida -> Florida)
              const normalized = st.charAt(0).toUpperCase() + st.slice(1).toLowerCase();
              stateName = normalized.replace('ó', 'o').replace('á', 'a'); // Normalize accents
            }

            const stCurrent = stateMap.get(stateName) || { total: 0, ativos: 0 };
            stCurrent.total++;
            if (lead.ativo) stCurrent.ativos++;
            stateMap.set(stateName, stCurrent);
          });

          const workPermitArr: WorkPermitData[] = Array.from(workPermitMap.entries())
            .map(([status, data]) => ({ status, ...data }))
            .sort((a, b) => b.total - a.total);

          const statesArr: StateData[] = Array.from(stateMap.entries())
            .map(([state, data]) => ({ state, ...data }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

          setDemographics({
            work_permit: workPermitArr,
            states: statesArr,
            updated_at: new Date().toISOString()
          });
          return;
        }
        throw rpcError;
      }

      setDemographics(data);
    } catch (err) {
      console.error('Error fetching demographics:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados demográficos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographics();
  }, [locationId]);

  return {
    demographics,
    loading,
    error,
    refetch: fetchDemographics
  };
}

export default useLeadDemographics;
