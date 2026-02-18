import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../hooks/useToast';
import type { BrandAsset, BrandConfig } from '../../../types/brand';

interface DownloadAllButtonProps {
  brand: BrandConfig;
}

export const DownloadAllButton: React.FC<DownloadAllButtonProps> = ({ brand }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    setProgress(0);

    try {
      // Fetch all assets
      const { data: assets, error } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('brand_id', brand.id)
        .order('section')
        .order('sort_order');

      if (error || !assets || assets.length === 0) {
        showToast('Nenhum arquivo para download', 'error');
        setDownloading(false);
        return;
      }

      // Lazy import JSZip
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      const BATCH_SIZE = 10;
      let processed = 0;

      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE);

        const downloads = batch.map(async (asset: BrandAsset) => {
          try {
            const { data: urlData } = supabase
              .storage
              .from('brandpacks')
              .getPublicUrl(asset.storage_path);

            if (!urlData?.publicUrl) return;

            const response = await fetch(urlData.publicUrl);
            if (!response.ok) return;

            const blob = await response.blob();
            const folder = asset.section;
            const ext = asset.name.includes('.') ? '' : `.${asset.format}`;
            zip.file(`${folder}/${asset.name}${ext}`, blob);
          } catch {
            // Skip failed downloads
          }
        });

        await Promise.all(downloads);
        processed += batch.length;
        setProgress(Math.round((processed / assets.length) * 100));
      }

      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand.client_slug}-brand-pack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Download concluido!', 'success');
    } catch {
      showToast('Erro ao gerar ZIP', 'error');
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {downloading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>{progress}%</span>
        </>
      ) : (
        <>
          <Download size={16} />
          <span>Baixar Tudo (ZIP)</span>
        </>
      )}
    </button>
  );
};
