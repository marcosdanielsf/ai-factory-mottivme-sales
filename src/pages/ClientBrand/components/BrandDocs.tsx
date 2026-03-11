import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ArrowLeft, FileText, Loader2, ExternalLink, Maximize2, Download, X } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

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
        <p className="text-sm">Nenhum documento disponivel.</p>
      </div>
    );
  }

  const handleOpenNewTab = () => {
    if (!docContent || !selectedDoc) return;
    const mimeType = selectedDoc.format === 'html' ? 'text/html' : 'text/markdown';
    const blob = new Blob([docContent], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  };

  const handleDownload = () => {
    if (!selectedDoc || !docContent) return;
    const blob = new Blob([docContent], { type: selectedDoc.format === 'html' ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedDoc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const docTitle = selectedDoc
    ? selectedDoc.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    : '';

  const renderDocContent = () => {
    if (loadingContent) {
      return (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-text-muted" size={24} />
        </div>
      );
    }
    if (docContent) {
      if (selectedDoc?.format === 'html') {
        return (
          <iframe
            srcDoc={docContent}
            className="w-full rounded-lg border-0"
            style={{ minHeight: isFullscreen ? 'calc(100vh - 80px)' : '70vh', height: isFullscreen ? 'calc(100vh - 80px)' : '80vh' }}
            sandbox="allow-popups"
            title={selectedDoc?.name}
          />
        );
      }
      return (
        <Suspense fallback={<div className="text-text-muted text-sm">Carregando renderizador...</div>}>
          <div className="prose prose-invert max-w-none text-text-primary prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-a:text-accent-primary">
            <ReactMarkdown>{docContent}</ReactMarkdown>
          </div>
        </Suspense>
      );
    }
    return <p className="text-text-muted text-sm">Nao foi possivel carregar o documento.</p>;
  };

  // Document viewer
  if (selectedDoc) {
    // Fullscreen overlay
    if (isFullscreen) {
      return (
        <div
          ref={fullscreenRef}
          className="fixed inset-0 z-50 flex flex-col bg-bg-primary"
        >
          {/* Fullscreen header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-secondary shrink-0">
            <h2 className="text-base font-semibold text-text-primary truncate max-w-[60%]">
              {docTitle}
            </h2>
            <div className="flex items-center gap-1">
              {selectedDoc.format === 'html' && (
                <button
                  onClick={handleOpenNewTab}
                  title="Abrir em nova aba"
                  className="p-2 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
                >
                  <ExternalLink size={16} />
                </button>
              )}
              <button
                onClick={handleDownload}
                disabled={!docContent}
                title="Download"
                className="p-2 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Download size={16} />
              </button>
              <button
                onClick={handleToggleFullscreen}
                title="Sair do fullscreen"
                className="p-2 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Fullscreen content */}
          <div className="flex-1 overflow-auto p-4">
            {renderDocContent()}
          </div>
        </div>
      );
    }

    // Normal viewer
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedDoc(null); setDocContent(null); setIsFullscreen(false); }}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para lista
        </button>

        <div className="rounded-xl border border-border-default bg-bg-secondary p-6 min-h-[60vh]">
          {/* Title bar with action buttons */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-semibold text-text-primary truncate">
              {docTitle}
            </h2>
            <div className="flex items-center gap-1 shrink-0">
              {selectedDoc.format === 'html' && (
                <button
                  onClick={handleOpenNewTab}
                  title="Abrir em nova aba"
                  className="p-2 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
                >
                  <ExternalLink size={16} />
                </button>
              )}
              <button
                onClick={handleToggleFullscreen}
                title="Tela cheia"
                className="p-2 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={handleDownload}
                disabled={!docContent}
                title="Download"
                className="p-2 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          {renderDocContent()}
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
