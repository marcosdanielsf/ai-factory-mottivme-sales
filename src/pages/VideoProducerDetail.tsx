import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Send,
  RotateCcw,
  Scissors,
  ChevronDown,
  ChevronUp,
  Film,
  Clock,
  Calendar,
} from "lucide-react";
import { VideoPlayer } from "../components/video/VideoPlayer";
import { VideoStatusTimeline } from "../components/video/VideoStatusTimeline";
import {
  useVideoItem,
  useVideoVoices,
  useVideoAvatars,
  triggerVideoProduction,
  updateVideoItem,
  type VideoStatus,
} from "../hooks/useVideoProducer";

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const VideoProducerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const { item: video, loading } = useVideoItem(id || "");
  const { voices } = useVideoVoices();
  const { avatars } = useVideoAvatars();

  if (!video && !loading) {
    return (
      <div className="bg-[#0d1117] min-h-full p-8">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-[#8b949e]">Vídeo não encontrado</p>
          <button
            onClick={() => navigate("/video-producer")}
            className="mt-4 text-[#58a6ff] hover:underline"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!video) {
    return null; // Loading state handled below
  }

  const metadata = [
    { label: "Formato", value: video.format.toUpperCase() },
    { label: "Duração", value: `${video.duration_target}s` },
    { label: "Trilha TACO", value: video.taco_track || "N/A" },
    {
      label: "Marca",
      value: video.brand.charAt(0).toUpperCase() + video.brand.slice(1),
    },
  ];

  const channels = video.publish_channels
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(", ");

  // Extract timestamps from metadata if available
  const timestamps =
    (video.metadata?.timestamps as Record<string, string>) || {};

  const matchedVoice = voices.find((v) => v.id === video.voice_id);
  const voiceInfo = {
    name: matchedVoice?.name || "Voz não encontrada",
    language: matchedVoice?.language || "-",
  };

  const matchedAvatar = avatars.find((a) => a.id === video.avatar_id);
  const avatarInfo = {
    name: matchedAvatar?.name || "Avatar não encontrado",
    style: matchedAvatar?.metadata?.style || matchedAvatar?.language || "-",
  };

  const getStatusColor = (status: VideoStatus) => {
    switch (status) {
      case "draft":
        return "text-[#8b949e] bg-[#8b949e]/10 border-[#8b949e]/20";
      case "video_ready":
        return "text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20";
      case "published":
        return "text-[#a371f7] bg-[#a371f7]/10 border-[#a371f7]/20";
      case "failed":
        return "text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20";
      default:
        return "text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20";
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

  const handleStartProduction = async () => {
    try {
      await triggerVideoProduction(video.id);
    } catch (error) {
      console.error("Error starting production:", error);
      alert("Erro ao iniciar produção");
    }
  };

  const handlePublish = async () => {
    try {
      await updateVideoItem(video.id, { status: "publishing" });
      // The backend webhook will handle actual publishing
    } catch (error) {
      console.error("Error publishing video:", error);
      alert("Erro ao publicar vídeo");
    }
  };

  const handleRetry = async () => {
    try {
      await updateVideoItem(video.id, { status: "draft", error_message: null });
      await triggerVideoProduction(video.id);
    } catch (error) {
      console.error("Error retrying production:", error);
      alert("Erro ao tentar novamente");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0d1117] min-h-full p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#161b22] rounded w-1/3" />
            <div className="h-96 bg-[#161b22] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1117] min-h-full">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/video-producer")}
            className="flex items-center gap-2 text-sm text-[#58a6ff] hover:underline mb-3"
          >
            <ArrowLeft size={16} />
            Voltar ao Dashboard
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-white mb-2">
                {video.title}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(video.status)}`}
                >
                  {getStatusLabel(video.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {video.status === "draft" && (
                <button
                  onClick={handleStartProduction}
                  className="flex items-center gap-2 px-4 py-2 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Play size={16} />
                  Iniciar Produção
                </button>
              )}
              {video.status === "video_ready" && (
                <>
                  <button
                    onClick={() => navigate(`/video-editor/${video.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#a371f7] hover:bg-[#a371f7]/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Scissors size={16} />
                    Editar no Studio
                  </button>
                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-2 px-4 py-2 bg-[#3fb950] hover:bg-[#3fb950]/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Send size={16} />
                    Publicar
                  </button>
                </>
              )}
              {video.status === "failed" && (
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-[#d29922] hover:bg-[#d29922]/90 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <RotateCcw size={16} />
                  Tentar Novamente
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN (60%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer
              videoUrl={video.video_url}
              audioUrl={video.audio_url}
              format={video.format}
              thumbnail={video.thumbnail_url}
            />

            {/* Script */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <button
                onClick={() => setScriptExpanded(!scriptExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#1c2128] transition-colors"
              >
                <h3 className="text-sm font-semibold text-white">Roteiro</h3>
                {scriptExpanded ? (
                  <ChevronUp size={16} className="text-[#8b949e]" />
                ) : (
                  <ChevronDown size={16} className="text-[#8b949e]" />
                )}
              </button>
              {scriptExpanded && (
                <div className="px-4 pb-4 border-t border-[#30363d]">
                  <p className="text-sm text-[#8b949e] mt-4 whitespace-pre-wrap">
                    {video.script}
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Informações
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metadata.map((item, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-[#8b949e] mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (40%) */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Progresso
              </h3>
              <VideoStatusTimeline
                status={video.status}
                timestamps={timestamps}
              />
            </div>

            {/* Voice & Avatar */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Voz & Avatar
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#8b949e] mb-1">Voz</p>
                  <p className="text-sm text-white">{voiceInfo.name}</p>
                  <p className="text-xs text-[#6e7681]">{voiceInfo.language}</p>
                </div>
                <div className="border-t border-[#30363d] pt-3">
                  <p className="text-xs text-[#8b949e] mb-1">Avatar</p>
                  <p className="text-sm text-white">{avatarInfo.name}</p>
                  <p className="text-xs text-[#6e7681]">{avatarInfo.style}</p>
                </div>
              </div>
            </div>

            {/* Publishing Info */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Publicação
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#8b949e] mb-1">Canais</p>
                  <p className="text-sm text-white">
                    {channels || "Nenhum canal selecionado"}
                  </p>
                </div>
                <div className="border-t border-[#30363d] pt-3 flex items-center gap-2 text-xs text-[#8b949e]">
                  <Calendar size={12} />
                  Criado em{" "}
                  {new Date(video.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>

            {/* Error Message (if failed) */}
            {video.status === "failed" && (
              <div className="bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#f85149] mb-2">
                  Erro na Produção
                </h3>
                <p className="text-xs text-[#f85149]/80">
                  Falha ao gerar o vídeo. Verifique o roteiro e tente novamente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProducerDetail;
