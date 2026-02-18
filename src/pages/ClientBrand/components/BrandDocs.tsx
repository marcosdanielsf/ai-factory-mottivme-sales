import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { useBrandAssets, type BrandAssetWithUrl } from '../../../hooks/useBrandAssets';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface BrandDocsProps {
  brandId: string;
}

export const BrandDocs: React.FC<BrandDocsProps> = ({ brandId }) => {
  const { assets, loading } = useBrandAssets(brandId, 'docs');
  const [selectedDoc, setSelectedDoc] = useState<BrandAssetWithUrl | null>(null);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    if (!selectedDoc?.signedUrl) return;

    setLoadingContent(true);
    setDocContent(null);

    fetch(selectedDoc.signedUrl)
      .then((res) => res.text())
      .then((text) => {
        setDocContent(text);
        setLoadingContent(false);
      })
      .catch(() => {
        setDocContent(null);
        setLoadingContent(false);
      });
  }, [selectedDoc]);

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
        <p className="text-sm">Nenhum documento disponivel.</p>
      </div>
    );
  }

  // Document viewer
  if (selectedDoc) {
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
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {selectedDoc.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}
          </h2>

          {loadingContent && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-text-muted" size={24} />
            </div>
          )}

          {docContent && (
            <Suspense fallback={<div className="text-text-muted text-sm">Carregando renderizador...</div>}>
              <div className="prose prose-invert max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-accent-primary">
                <ReactMarkdown>{docContent}</ReactMarkdown>
              </div>
            </Suspense>
          )}

          {!loadingContent && !docContent && (
            <p className="text-text-muted text-sm">Nao foi possivel carregar o documento.</p>
          )}
        </div>
      </div>
    );
  }

  // Document list
  return (
    <div className="space-y-2">
      {assets.map((doc) => (
        <button
          key={doc.id}
          onClick={() => setSelectedDoc(doc)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border-default bg-bg-secondary hover:border-accent-primary/30 transition-all text-left group"
        >
          <div className="p-2.5 rounded-lg bg-bg-tertiary group-hover:bg-accent-primary/10 transition-colors">
            <FileText size={20} className="text-text-muted group-hover:text-accent-primary transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {doc.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {doc.format.toUpperCase()}
              {doc.size_bytes ? ` · ${(doc.size_bytes / 1024).toFixed(0)} KB` : ''}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};
