import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { BrandAsset } from '../types/brand';

export interface BrandAssetWithUrl extends BrandAsset {
  signedUrl: string;
}

interface UseBrandAssetsResult {
  assets: BrandAssetWithUrl[];
  loading: boolean;
  error: string | null;
}

export function useBrandAssets(
  brandId: string | null | undefined,
  section?: string
): UseBrandAssetsResult {
  const [assets, setAssets] = useState<BrandAssetWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!brandId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const fetchAssets = async () => {
      try {
        let query = supabase
          .from('brand_assets')
          .select('*')
          .eq('brand_id', brandId)
          .order('sort_order', { ascending: true });

        if (section) {
          query = query.eq('section', section);
        }

        const { data, error: fetchErr } = await query;
        if (controller.signal.aborted) return;

        if (fetchErr) {
          setError(fetchErr.message);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setAssets([]);
          setLoading(false);
          return;
        }

        // Generate signed URLs in batches of 10
        const BATCH_SIZE = 10;
        const assetsWithUrls: BrandAssetWithUrl[] = [];

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
          if (controller.signal.aborted) return;

          const batch = data.slice(i, i + BATCH_SIZE);
          const urlPromises = batch.map(async (asset: BrandAsset) => {
            const { data: urlData } = await supabase
              .storage
              .from('brand-assets')
              .createSignedUrl(asset.storage_path, 3600); // 1h expiry

            return {
              ...asset,
              signedUrl: urlData?.signedUrl || '',
            };
          });

          const results = await Promise.all(urlPromises);
          assetsWithUrls.push(...results);
        }

        if (!controller.signal.aborted) {
          setAssets(assetsWithUrls);
          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar assets');
          setLoading(false);
        }
      }
    };

    fetchAssets();

    return () => {
      controller.abort();
    };
  }, [brandId, section]);

  return { assets, loading, error };
}
