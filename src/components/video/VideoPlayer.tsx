import React from 'react';
import { Play, Volume2 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface VideoPlayerProps {
  videoUrl?: string;
  audioUrl?: string;
  format?: 'reel' | 'short' | 'long' | 'carrossel';
  thumbnail?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const VideoPlayer = ({ videoUrl, audioUrl, format = 'reel', thumbnail }: VideoPlayerProps) => {
  const getAspectClass = () => {
    switch (format) {
      case 'reel':
      case 'short':
        return 'aspect-[9/16]'; // Vertical
      case 'long':
        return 'aspect-video'; // 16:9
      case 'carrossel':
        return 'aspect-square'; // 1:1
      default:
        return 'aspect-video';
    }
  };

  // Video available
  if (videoUrl) {
    return (
      <div className={`w-full ${getAspectClass()} bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]`}>
        <video
          src={videoUrl}
          controls
          poster={thumbnail}
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Seu navegador não suporta o elemento de vídeo.
        </video>
      </div>
    );
  }

  // Audio only
  if (audioUrl) {
    return (
      <div className={`w-full ${getAspectClass()} bg-[#0d1117] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-6`}>
        <div className="w-16 h-16 bg-[#58a6ff]/10 rounded-full flex items-center justify-center mb-4">
          <Volume2 size={32} className="text-[#58a6ff]" />
        </div>
        <p className="text-sm text-[#8b949e] mb-4 text-center">Áudio pronto. Vídeo em produção.</p>
        <audio
          src={audioUrl}
          controls
          className="w-full max-w-md"
          preload="metadata"
        >
          Seu navegador não suporta o elemento de áudio.
        </audio>
      </div>
    );
  }

  // Placeholder
  return (
    <div className={`w-full ${getAspectClass()} bg-gradient-to-br from-[#0d1117] via-[#161b22] to-[#1c2128] rounded-lg border border-[#30363d] flex flex-col items-center justify-center p-6`}>
      <div className="w-16 h-16 bg-[#30363d] rounded-full flex items-center justify-center mb-4">
        <Play size={32} className="text-[#8b949e]" />
      </div>
      <p className="text-sm text-[#8b949e] text-center">Nenhum arquivo disponível</p>
      <p className="text-xs text-[#6e7681] mt-1 text-center">O vídeo será gerado em breve</p>
    </div>
  );
};
