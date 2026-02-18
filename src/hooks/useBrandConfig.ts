import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { BrandConfig } from '../types/brand';

interface UseBrandConfigResult {
  brandConfig: BrandConfig | null;
  loading: boolean;
  error: string | null;
}

const STALE_MS = 5 * 60 * 1000; // 5 min cache

interface CacheEntry {
  data: BrandConfig | null;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

export function useBrandConfig(locationId: string | null | undefined): UseBrandConfigResult {
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!locationId) {
      setBrandConfig(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(locationId);
    if (cached && Date.now() - cached.fetchedAt < STALE_MS) {
      setBrandConfig(cached.data);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    supabase
      .from('brand_configs')
      .select('*')
      .eq('location_id', locationId)
      .limit(1)
      .single()
      .then(({ data, error: err }) => {
        if (controller.signal.aborted) return;

        if (err && err.code !== 'PGRST116') {
          setError(err.message);
          setBrandConfig(null);
        } else {
          const config = data as BrandConfig | null;
          setBrandConfig(config);
          cache.set(locationId, { data: config, fetchedAt: Date.now() });
        }
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [locationId]);

  return { brandConfig, loading, error };
}
