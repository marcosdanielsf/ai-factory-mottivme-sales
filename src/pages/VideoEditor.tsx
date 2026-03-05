import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useVideoItem } from "../hooks/useVideoProducer";

const HYPEREDIT_URL =
  import.meta.env.VITE_HYPEREDIT_URL || "http://localhost:5180";

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const VideoEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { item: video } = useVideoItem(id || "");

  const videoUrl = searchParams.get("videoUrl") || video?.video_url || "";

  const iframeSrc = useMemo(() => {
    if (!videoUrl || !isValidUrl(videoUrl)) return HYPEREDIT_URL;
    return `${HYPEREDIT_URL}?videoUrl=${encodeURIComponent(videoUrl)}`;
  }, [videoUrl]);

  const safeVideoLabel = useMemo(() => {
    if (!videoUrl) return "";
    return videoUrl.split("/").pop()?.split("?")[0] || videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fullscreen]);

  const iframeSandbox =
    "allow-same-origin allow-scripts allow-forms allow-popups allow-modals";

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0d1117]">
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-3 right-3 z-50 p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-[#8b949e] hover:text-white hover:border-[#58a6ff]/50 transition-colors"
          title="Sair do fullscreen (Esc)"
          aria-label="Sair do modo fullscreen"
        >
          <Minimize2 size={16} />
        </button>
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          sandbox={iframeSandbox}
          allow="microphone; camera; clipboard-write"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              id
                ? navigate(`/video-producer/${id}`)
                : navigate("/video-producer")
            }
            className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <div className="w-px h-5 bg-[#30363d]" />
          <h1 className="text-sm font-semibold text-white">
            Video Editor
            {video && (
              <span className="text-[#8b949e] font-normal ml-2">
                — {video.title}
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {safeVideoLabel && (
            <span className="text-[10px] text-[#8b949e] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d] max-w-[300px] truncate">
              {safeVideoLabel}
            </span>
          )}
          <button
            onClick={() => setFullscreen(true)}
            className="p-2 text-[#8b949e] hover:text-white hover:bg-[#0d1117] rounded-lg transition-colors"
            title="Fullscreen"
            aria-label="Entrar em tela cheia"
          >
            <Maximize2 size={16} />
          </button>
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#8b949e] hover:text-white hover:bg-[#0d1117] rounded-lg transition-colors"
            title="Abrir em nova aba"
            aria-label="Abrir editor em nova aba"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Editor iframe */}
      <div className="flex-1 min-h-0 relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#8b949e]">Carregando editor...</p>
            </div>
          </div>
        )}
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 57px)" }}
          sandbox={iframeSandbox}
          allow="microphone; camera; clipboard-write"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
};

export default VideoEditor;
