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

        // Generate public URLs (bucket is public — no signed URLs needed)
        const assetsWithUrls: BrandAssetWithUrl[] = data.map((asset: BrandAsset) => {
          const { data: urlData } = supabase
            .storage
            .from('brandpacks')
            .getPublicUrl(asset.storage_path);

          return {
            ...asset,
            signedUrl: urlData?.publicUrl || '',
          };
        });

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
