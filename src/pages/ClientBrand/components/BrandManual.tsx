import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { useBrandAssets } from '../../../hooks/useBrandAssets';

interface BrandManualProps {
  brandId: string;
}

export const BrandManual: React.FC<BrandManualProps> = ({ brandId }) => {
  const { assets, loading } = useBrandAssets(brandId, 'manual');
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const manualAsset = assets[0]; // Expect single manual file

  useEffect(() => {
    if (!manualAsset?.signedUrl) return;

    const isHtml = manualAsset.format === 'html';
    if (!isHtml) return;

    const controller = new AbortController();
    setLoadingContent(true);

    fetch(manualAsset.signedUrl, { signal: controller.signal })
      .then((res) => res.text())
      .then((text) => {
        setHtmlContent(text);
        setLoadingContent(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setHtmlContent(null);
          setLoadingContent(false);
        }
      });

    return () => controller.abort();
  }, [manualAsset?.signedUrl]);

  if (loading || loadingContent) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  if (!manualAsset) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <BookOpen size={40} className="mb-3 opacity-50" />
        <p className="text-sm">Manual de marca nao disponivel.</p>
      </div>
    );
  }

  // PDF
  if (manualAsset.format === 'pdf') {
    return (
      <div className="rounded-xl border border-border-default overflow-hidden bg-bg-secondary">
        <iframe
          src={manualAsset.signedUrl}
          className="w-full h-[80vh]"
          title="Manual de Marca"
        />
      </div>
    );
  }

  // HTML
  if (htmlContent) {
    return (
      <div className="rounded-xl border border-border-default overflow-hidden bg-white">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-[80vh]"
          title="Manual de Marca"
          sandbox="allow-popups"
        />
      </div>
    );
  }

  // Fallback: download link
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <BookOpen size={40} className="mb-3 opacity-50" />
      <p className="text-sm mb-3">Formato nao suportado para visualizacao.</p>
      <a
        href={manualAsset.signedUrl}
        download={manualAsset.name}
        className="px-4 py-2 rounded-lg bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
      >
        Baixar Manual
      </a>
    </div>
  );
};
