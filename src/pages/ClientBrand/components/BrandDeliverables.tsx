import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowLeft, FileText, Download, Loader2 } from 'lucide-react';
import { useBrandAssets, type BrandAssetWithUrl } from '../../../hooks/useBrandAssets';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface BrandDeliverablesProps {
  brandId: string;
  section: string;
  primaryColor: string;
}

const FORMAT_BADGES: Record<string, { label: string; color: string }> = {
  md: { label: 'MD', color: '#3B82F6' },
  html: { label: 'HTML', color: '#F59E0B' },
  pdf: { label: 'PDF', color: '#EF4444' },
  txt: { label: 'TXT', color: '#6B7280' },
  json: { label: 'JSON', color: '#10B981' },
};

export const BrandDeliverables: React.FC<BrandDeliverablesProps> = ({ brandId, section, primaryColor }) => {
  const { assets, loading } = useBrandAssets(brandId, section);
  const [selectedDoc, setSelectedDoc] = useState<BrandAssetWithUrl | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (!selectedDoc?.signedUrl) return;
    const controller = new AbortController();

    setLoadingContent(true);
    setDocContent(null);

    fetch(selectedDoc.signedUrl, { signal: controller.signal })
      .then((res) => res.text())
      .then((text) => {
        setDocContent(text);
        setLoadingContent(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setDocContent(null);
          setLoadingContent(false);
        }
      });

    return () => controller.abort();
  }, [selectedDoc?.signedUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <FileText size={40} className="mb-3 opacity-50" />
        <p className="text-sm">Nenhum entregavel nesta categoria.</p>
      </div>
    );
  }

  // Document viewer (markdown/html)
  if (selectedDoc) {
    const isHtml = selectedDoc.format === 'html';

    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedDoc(null); setDocContent(null); }}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para lista
        </button>

        <div className="rounded-xl border border-border-default bg-bg-secondary p-6 min-h-[60vh]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {selectedDoc.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}
            </h2>
            <a
              href={selectedDoc.signedUrl}
              download={selectedDoc.name}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            >
              <Download size={14} />
              Baixar
            </a>
          </div>

          {selectedDoc.description && (
            <p className="text-sm text-text-secondary mb-4 pb-4 border-b border-border-default">
              {selectedDoc.description}
            </p>
          )}

          {loadingContent && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-text-muted" size={24} />
            </div>
          )}

          {docContent && !isHtml && (
            <Suspense fallback={<div className="text-text-muted text-sm">Carregando renderizador...</div>}>
              <div className="prose prose-invert max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-accent-primary">
                <ReactMarkdown>{docContent}</ReactMarkdown>
              </div>
            </Suspense>
          )}

          {docContent && isHtml && (
            <iframe
              srcDoc={docContent}
              className="w-full min-h-[60vh] rounded-lg bg-white"
              sandbox="allow-popups"
              title={selectedDoc.name}
            />
          )}

          {!loadingContent && !docContent && (
            <p className="text-text-muted text-sm">Nao foi possivel carregar o documento.</p>
          )}
        </div>
      </div>
    );
  }

  // Card grid
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {assets.map((asset) => {
        const badge = FORMAT_BADGES[asset.format] || { label: asset.format.toUpperCase(), color: '#6B7280' };
        const displayName = asset.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        const canView = ['md', 'html', 'txt'].includes(asset.format);

        return (
          <button
            key={asset.id}
            onClick={() => canView ? setSelectedDoc(asset) : window.open(asset.signedUrl, '_blank')}
            className="group text-left p-4 rounded-xl border border-border-default bg-bg-secondary hover:border-accent-primary/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <FileText size={18} style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
                  {displayName}
                </p>
                {asset.description && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">
                    {asset.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                    style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                  {asset.size_bytes && (
                    <span className="text-[10px] text-text-muted">
                      {(asset.size_bytes / 1024).toFixed(0)} KB
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
