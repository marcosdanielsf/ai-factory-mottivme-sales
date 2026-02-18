import React, { useState, useMemo } from 'react';
import { Download, Eye, X, Loader2 } from 'lucide-react';
import { useBrandAssets, type BrandAssetWithUrl } from '../../../hooks/useBrandAssets';

interface BrandGalleryProps {
  brandId: string;
  sections: string[];
  tabLabels: Record<string, string>;
  gridCols?: string;
  primaryColor: string;
}

export const BrandGallery: React.FC<BrandGalleryProps> = ({
  brandId,
  sections,
  tabLabels,
  gridCols = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  primaryColor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState(sections[0]);
  const [preview, setPreview] = useState<BrandAssetWithUrl | null>(null);
  const { assets, loading } = useBrandAssets(brandId, activeSubTab);

  const isImage = (format: string) => ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(format.toLowerCase());

  const grouped = useMemo(() => {
    const map: Record<string, BrandAssetWithUrl[]> = {};
    for (const a of assets) {
      const key = a.section;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [assets]);

  const currentAssets = grouped[activeSubTab] || assets;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      {sections.length > 1 && (
        <div className="flex gap-2 border-b border-border-default pb-2">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSubTab(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSubTab === sec
                  ? 'text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
              style={activeSubTab === sec ? { backgroundColor: primaryColor } : undefined}
            >
              {tabLabels[sec] || sec}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-text-muted" size={24} />
        </div>
      )}

      {/* Grid */}
      {!loading && currentAssets.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm">
          Nenhum arquivo nesta secao.
        </div>
      )}

      {!loading && currentAssets.length > 0 && (
        <div className={`grid ${gridCols} gap-4`}>
          {currentAssets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-xl border border-border-default bg-bg-secondary overflow-hidden hover:border-accent-primary/30 transition-all"
            >
              {/* Preview area */}
              <div className="aspect-square flex items-center justify-center p-4 bg-bg-tertiary/50">
                {isImage(asset.format) && asset.signedUrl ? (
                  <img
                    src={asset.signedUrl}
                    alt={asset.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-text-muted text-xs uppercase font-mono">
                    .{asset.format}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-medium text-text-primary truncate" title={asset.name}>
                  {asset.name}
                </p>
                {asset.size_bytes && (
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {(asset.size_bytes / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>

              {/* Hover Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImage(asset.format) && (
                  <button
                    onClick={() => setPreview(asset)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={14} />
                  </button>
                )}
                <a
                  href={asset.signedUrl}
                  download={asset.name}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-2 -right-2 p-2 rounded-full bg-bg-secondary border border-border-default text-text-primary hover:bg-bg-tertiary z-10"
            >
              <X size={16} />
            </button>
            <img
              src={preview.signedUrl}
              alt={preview.name}
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />
            <p className="text-center text-sm text-text-secondary mt-3">{preview.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};
