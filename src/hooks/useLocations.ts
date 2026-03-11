import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Location {
  location_id: string;
  location_name: string;
}

// Module-level cache — uma única query serve todos os componentes
let cachedLocations: Location[] | null = null;
let fetchPromise: Promise<Location[]> | null = null;

function fetchLocationsOnce(): Promise<Location[]> {
  if (cachedLocations) return Promise.resolve(cachedLocations);
  if (fetchPromise) return fetchPromise;

  fetchPromise = Promise.resolve(
    supabase
      .from("ghl_locations")
      .select("location_id, location_name")
      .order("location_name"),
  )
    .then(({ data, error }) => {
      if (error) throw error;
      cachedLocations = data || [];
      return cachedLocations;
    })
    .then(
      (result) => result,
      (err) => {
        fetchPromise = null; // allow retry on error
        throw err;
      },
    );

  return fetchPromise;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>(cachedLocations || []);
  const [loading, setLoading] = useState(!cachedLocations);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedLocations) {
      setLocations(cachedLocations);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchLocationsOnce()
      .then((data) => {
        if (mounted) {
          setLocations(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { locations, loading, error };
};

export default useLocations;
