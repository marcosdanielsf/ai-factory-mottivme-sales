import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Film,
  Youtube,
  Instagram,
  Linkedin,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Scissors,
} from "lucide-react";

import type {
  VideoProductionItem,
  VideoFormat,
  VideoStatus,
  TACOTrack,
} from "../../hooks/useVideoProducer";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface VideoQueueCardProps {
  video: VideoProductionItem;
  onDelete?: (id: string) => void;
}

// ═══════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

const getFormatIcon = (format: VideoFormat) => {
  switch (format) {
    case "reel":
    case "short":
      return <Film size={16} />;
    case "long":
      return <Youtube size={16} />;
    case "carrossel":
      return <FileText size={16} />;
    default:
      return <Film size={16} />;
  }
};

const getFormatColor = (format: VideoFormat) => {
  switch (format) {
    case "reel":
      return "text-[#e1306c] bg-[#e1306c]/10 border-[#e1306c]/20";
    case "short":
      return "text-[#ff0000] bg-[#ff0000]/10 border-[#ff0000]/20";
    case "long":
      return "text-[#ff0000] bg-[#ff0000]/10 border-[#ff0000]/20";
    case "carrossel":
      return "text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20";
    default:
      return "text-text-muted bg-bg-hover border-border-default";
  }
};

const getStatusColor = (status: VideoStatus) => {
  switch (status) {
    case "draft":
      return "text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/20";
    case "audio_generating":
    case "video_generating":
    case "publishing":
      return "text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20";
    case "audio_ready":
      return "text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20";
    case "video_ready":
      return "text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20";
    case "published":
      return "text-[#a371f7] bg-[#a371f7]/10 border-[#a371f7]/20";
    case "failed":
      return "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20";
    default:
      return "text-text-muted bg-bg-hover border-border-default";
  }
};

const getStatusLabel = (status: VideoStatus) => {
  const labels: Record<VideoStatus, string> = {
    draft: "Rascunho",
    audio_generating: "Gerando Áudio",
    audio_ready: "Áudio Pronto",
    video_generating: "Gerando Vídeo",
    video_ready: "Vídeo Pronto",
    publishing: "Publicando",
    published: "Publicado",
    failed: "Erro",
  };
  return labels[status] || status;
};

const getTACOColor = (track: TACOTrack) => {
  switch (track) {
    case "T":
      return "#58a6ff"; // Blue
    case "A":
      return "#3fb950"; // Green
    case "C":
      return "#d29922"; // Orange
    case "O":
      return "#a371f7"; // Purple
    case "H":
      return "#f85149"; // Red
    default:
      return "#8b949e"; // Gray
  }
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
};

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const VideoQueueCard = ({ video, onDelete }: VideoQueueCardProps) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = React.useState(false);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  const handleCardClick = () => {
    navigate(`/video-producer/${video.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/video-producer/${video.id}?edit=true`);
    setShowActions(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Deletar "${video.title}"?`)) {
      onDelete(video.id);
    }
    setShowActions(false);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/video-producer/${video.id}`);
    setShowActions(false);
  };

  const showProgress =
    video.status === "audio_generating" ||
    video.status === "video_generating" ||
    video.status === "publishing";
  // Calculate progress from metadata if available
  const progress = (video.metadata?.progress_percent as number) || 0;

  return (
    <div
      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#58a6ff]/30 transition-all group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#1c2128] flex items-center justify-center">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center text-[#58a6ff]">
            {getFormatIcon(video.format)}
          </div>
        )}
        {/* TACO colored dot */}
        <div
          className="absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-[#161b22]"
          style={{ backgroundColor: getTACOColor(video.taco_track) }}
          title={`Track ${video.taco_track}`}
        />
        {/* Actions menu */}
        <div className="absolute top-2 right-2" ref={actionsRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 bg-[#0d1117]/80 hover:bg-[#0d1117] border border-[#30363d] rounded text-[#8b949e] hover:text-white transition-colors backdrop-blur-sm"
          >
            <MoreVertical size={14} />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-1 w-40 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-10">
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8b949e] hover:bg-[#0d1117] hover:text-white transition-colors text-left"
              >
                <Edit size={12} />
                Editar
              </button>
              <button
                onClick={handleViewDetails}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8b949e] hover:bg-[#0d1117] hover:text-white transition-colors text-left"
              >
                <Eye size={12} />
                Ver Detalhes
              </button>
              {(video.status === "video_ready" ||
                video.status === "published") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/video-editor/${video.id}`);
                    setShowActions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#a371f7] hover:bg-[#a371f7]/10 transition-colors text-left"
                >
                  <Scissors size={12} />
                  Editar no Studio
                </button>
              )}
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f85149] hover:bg-[#f85149]/10 transition-colors text-left"
              >
                <Trash2 size={12} />
                Deletar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 min-h-[40px]">
          {video.title}
        </h3>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(video.status)}`}
          >
            {getStatusLabel(video.status)}
          </span>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-3">
            <div className="w-full h-1.5 bg-[#0d1117] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#58a6ff] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-[#8b949e] mt-1">
              {progress}% completo
            </p>
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${getFormatColor(video.format)}`}
            >
              {getFormatIcon(video.format)}
              {video.format}
            </span>
            <span>{formatDuration(video.duration_target)}</span>
          </div>
          {video.publish_channels && video.publish_channels.length > 0 && (
            <div className="flex items-center gap-1">
              {video.publish_channels.includes("instagram") && (
                <Instagram size={10} className="text-[#e1306c]" />
              )}
              {video.publish_channels.includes("linkedin") && (
                <Linkedin size={10} className="text-[#0077b5]" />
              )}
              {video.publish_channels.includes("youtube") && (
                <Youtube size={10} className="text-[#ff0000]" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
