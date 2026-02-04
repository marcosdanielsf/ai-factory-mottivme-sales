import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Location {
  location_id: string;
  location_name: string;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('ghl_locations')
          .select('location_id, location_name')
          .order('location_name');

        if (error) throw error;
        setLocations(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, loading, error };
};

export default useLocations;
