import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DaySchedule {
  start: string;
  end: string;
  active: boolean;
}

export interface Attendant {
  id: string;
  location_id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  role: string;
  schedule: Record<string, DaySchedule>;
  is_active: boolean;
  ghl_user_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

type CreateAttendantInput = Pick<Attendant, 'location_id' | 'name'> &
  Partial<Pick<Attendant, 'whatsapp' | 'email' | 'role' | 'schedule' | 'ghl_user_id' | 'avatar_url'>>;

type UpdateAttendantInput = Partial<
  Pick<Attendant, 'name' | 'whatsapp' | 'email' | 'role' | 'schedule' | 'is_active' | 'ghl_user_id' | 'avatar_url'>
>;

const DAYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export const DEFAULT_SCHEDULE: Record<string, DaySchedule> = DAYS.reduce(
  (acc, day) => ({
    ...acc,
    [day]: { start: '08:00', end: '18:00', active: !['domingo', 'sabado'].includes(day) },
  }),
  {}
);

export const isAvailableNow = (attendant: Attendant): boolean => {
  const now = new Date();
  const dayIndex = now.getDay();
  const dayKey = DAYS[dayIndex];
  const daySchedule = attendant.schedule?.[dayKey];

  if (!daySchedule?.active) return false;

  const [startH, startM] = daySchedule.start.split(':').map(Number);
  const [endH, endM] = daySchedule.end.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

export const useAttendants = (locationId?: string | null) => {
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendants = useCallback(async () => {
    if (!isSupabaseConfigured() || !locationId) {
      setAttendants([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('attendants')
        .select('*')
        .eq('location_id', locationId)
        .order('name', { ascending: true });

      if (err) throw new Error(err.message);
      setAttendants((data || []) as Attendant[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar atendentes';
      setError(message);
      console.error('[useAttendants Error]', err);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    fetchAttendants();
  }, [fetchAttendants]);

  const createAttendant = useCallback(
    async (input: CreateAttendantInput) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

      const payload = {
        ...input,
        schedule: input.schedule ?? DEFAULT_SCHEDULE,
        role: input.role ?? 'atendente',
      };

      const { data, error: err } = await supabase
        .from('attendants')
        .insert(payload)
        .select()
        .single();

      if (err) throw new Error(err.message);
      await fetchAttendants();
      return data as Attendant;
    },
    [fetchAttendants]
  );

  const updateAttendant = useCallback(
    async (id: string, updates: UpdateAttendantInput) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase nao configurado');

      const { error: err } = await supabase
        .from('attendants')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (err) throw new Error(err.message);
      await fetchAttendants();
    },
    [fetchAttendants]
  );

  const toggleActive = useCallback(
    async (id: string, currentValue: boolean) => {
      await updateAttendant(id, { is_active: !currentValue });
    },
    [updateAttendant]
  );

  return {
    attendants,
    loading,
    error,
    createAttendant,
    updateAttendant,
    toggleActive,
    refetch: fetchAttendants,
  };
};

export default useAttendants;
