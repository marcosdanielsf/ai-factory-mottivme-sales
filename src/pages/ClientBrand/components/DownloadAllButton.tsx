import React, { useState } from "react";
import { Download, Loader2, Package, CheckCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../hooks/useToast";
import type { BrandAsset, BrandConfig } from "../../../types/brand";

interface DownloadAllButtonProps {
  brand: BrandConfig;
}

type DownloadPhase = "idle" | "fetching" | "downloading" | "zipping" | "done";

const PHASE_LABEL: Record<DownloadPhase, string> = {
  idle: "Baixar Tudo (ZIP)",
  fetching: "Listando arquivos...",
  downloading: "Baixando assets...",
  zipping: "Gerando ZIP...",
  done: "Concluido!",
};

export const DownloadAllButton: React.FC<DownloadAllButtonProps> = ({
  brand,
}) => {
  const [phase, setPhase] = useState<DownloadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const { showToast } = useToast();

  const isActive = phase !== "idle" && phase !== "done";

  const handleDownload = async () => {
    if (isActive) return;

    setPhase("fetching");
    setProgress(0);

    try {
      // 1. Fetch all assets from DB
      const { data: assets, error } = await supabase
        .from("brand_assets")
        .select("*")
        .eq("brand_id", brand.id)
        .order("section")
        .order("sort_order");

      if (error || !assets || assets.length === 0) {
        showToast("Nenhum arquivo para download", "error");
        setPhase("idle");
        return;
      }

      // 2. Lazy import JSZip
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      setPhase("downloading");

      // 3. Download assets in batches of 8
      const BATCH_SIZE = 8;
      let processed = 0;

      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE);

        const downloads = batch.map(async (asset: BrandAsset) => {
          try {
            const { data: urlData } = supabase.storage
              .from("brandpacks")
              .getPublicUrl(asset.storage_path);

            if (!urlData?.publicUrl) return;

            const response = await fetch(urlData.publicUrl);
            if (!response.ok) return;

            const blob = await response.blob();
            const ext = asset.name.includes(".") ? "" : `.${asset.format}`;
            zip.file(`${asset.section}/${asset.name}${ext}`, blob);
          } catch {
            // Skip failed downloads silently
          }
        });

        await Promise.all(downloads);
        processed += batch.length;
        setProgress(Math.round((processed / assets.length) * 90)); // reserve last 10% for zip gen
      }

      // 4. Generate ZIP
      setPhase("zipping");
      setProgress(92);

      const blob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (meta) => {
          // zip generation progress: map 0-100 into 92-99
          setProgress(92 + Math.round(meta.percent * 0.07));
        },
      );

      setProgress(100);
      setPhase("done");

      // 5. Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brand.client_slug}-brandpack.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Download concluido!", "success");

      // Reset after 2s
      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 2000);
    } catch {
      showToast("Erro ao gerar ZIP", "error");
      setPhase("idle");
      setProgress(0);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-stretch">
      <button
        onClick={handleDownload}
        disabled={isActive}
        className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white overflow-hidden transition-all"
        style={{
          backgroundColor:
            phase === "done"
              ? "var(--color-accent-success, #16a34a)"
              : "var(--color-accent-primary)",
          opacity: isActive ? 0.85 : 1,
          cursor: isActive ? "not-allowed" : "pointer",
          minWidth: 160,
        }}
      >
        {/* Progress fill layer */}
        {isActive && (
          <div
            className="absolute inset-0 transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRight:
                progress < 100 ? "1px solid rgba(255,255,255,0.25)" : "none",
            }}
          />
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {phase === "idle" && <Download size={15} />}
          {(phase === "fetching" ||
            phase === "downloading" ||
            phase === "zipping") && (
            <Loader2 size={15} className="animate-spin" />
          )}
          {phase === "done" && <CheckCircle size={15} />}

          <span>
            {phase === "downloading"
              ? `${PHASE_LABEL[phase]} ${progress}%`
              : PHASE_LABEL[phase]}
          </span>

          {phase === "zipping" && <Package size={13} className="opacity-70" />}
        </span>
      </button>

      {/* Progress bar under button */}
      {isActive && (
        <div
          className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--color-border-default)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--color-accent-primary)",
            }}
          />
        </div>
      )}
    </div>
  );
};
