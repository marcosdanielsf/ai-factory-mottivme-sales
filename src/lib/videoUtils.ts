import type { VideoStatus, VideoFormat, TACOTrack } from '../hooks/useVideoProducer';

// ═══════════════════════════════════════════════════════════════════════
// STATUS UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function getStatusColor(status: VideoStatus): string {
  const colors: Record<VideoStatus, string> = {
    draft: 'text-gray-400',
    audio_generating: 'text-blue-400',
    audio_ready: 'text-emerald-400',
    video_generating: 'text-blue-400',
    video_ready: 'text-emerald-400',
    publishing: 'text-purple-400',
    published: 'text-green-400',
    failed: 'text-red-400',
  };

  return colors[status] || 'text-gray-400';
}

export function getStatusLabel(status: VideoStatus): string {
  const labels: Record<VideoStatus, string> = {
    draft: 'Rascunho',
    audio_generating: 'Gerando Áudio',
    audio_ready: 'Áudio Pronto',
    video_generating: 'Gerando Vídeo',
    video_ready: 'Vídeo Pronto',
    publishing: 'Publicando',
    published: 'Publicado',
    failed: 'Falhou',
  };

  return labels[status] || 'Desconhecido';
}

export function getStatusIcon(status: VideoStatus): string {
  const icons: Record<VideoStatus, string> = {
    draft: 'FileText',
    audio_generating: 'Loader2',
    audio_ready: 'CheckCircle',
    video_generating: 'Loader2',
    video_ready: 'CheckCircle',
    publishing: 'Upload',
    published: 'CheckCircle2',
    failed: 'XCircle',
  };

  return icons[status] || 'Circle';
}

// ═══════════════════════════════════════════════════════════════════════
// FORMAT UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function getFormatLabel(format: VideoFormat): string {
  const labels: Record<VideoFormat, string> = {
    reel: 'Reel (9:16)',
    short: 'Short (9:16)',
    long: 'Vídeo Longo (16:9)',
    carrossel: 'Carrossel (1:1)',
  };

  return labels[format] || format;
}

export function getFormatDimensions(format: VideoFormat): { width: number; height: number } {
  const dimensions: Record<VideoFormat, { width: number; height: number }> = {
    reel: { width: 1080, height: 1920 },
    short: { width: 1080, height: 1920 },
    long: { width: 1920, height: 1080 },
    carrossel: { width: 1080, height: 1080 },
  };

  return dimensions[format] || { width: 1920, height: 1080 };
}

// ═══════════════════════════════════════════════════════════════════════
// DURATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}min`;
  }

  return `${minutes}min ${remainingSeconds}s`;
}

// ═══════════════════════════════════════════════════════════════════════
// TACO UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function getTACOColor(track: TACOTrack | null): string {
  if (!track) return 'text-gray-400';

  const colors: Record<TACOTrack, string> = {
    T: 'text-blue-400',
    A: 'text-amber-400',
    C: 'text-green-400',
    O: 'text-red-400',
    H: 'text-purple-400',
  };

  return colors[track] || 'text-gray-400';
}

export function getTACOLabel(track: TACOTrack | null): string {
  if (!track) return 'Nenhum';

  const labels: Record<TACOTrack, string> = {
    T: 'Técnico',
    A: 'Autoridade',
    C: 'Conexão',
    O: 'Objeção',
    H: 'Hype',
  };

  return labels[track] || 'Desconhecido';
}

export function getTACODescription(track: TACOTrack | null): string {
  if (!track) return 'Conteúdo sem categorização TACO';

  const descriptions: Record<TACOTrack, string> = {
    T: 'Conteúdo técnico, educacional, que demonstra expertise',
    A: 'Conteúdo que estabelece autoridade e credibilidade',
    C: 'Conteúdo que cria conexão emocional com a audiência',
    O: 'Conteúdo que endereça objeções e dúvidas comuns',
    H: 'Conteúdo que gera entusiasmo e urgência',
  };

  return descriptions[track] || '';
}

// ═══════════════════════════════════════════════════════════════════════
// CHANNEL UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function getChannelIcon(channel: string): string {
  const icons: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'Youtube',
    tiktok: 'Video',
    linkedin: 'Linkedin',
    facebook: 'Facebook',
    twitter: 'Twitter',
  };

  return icons[channel.toLowerCase()] || 'Share2';
}

export function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
  };

  return labels[channel.toLowerCase()] || channel;
}

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function validateScript(script: string, format: VideoFormat): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!script || script.trim().length === 0) {
    errors.push('Script não pode estar vazio');
  }

  const wordCount = script.trim().split(/\s+/).length;

  // Estimate duration: ~150 words per minute
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);

  const maxDurations: Record<VideoFormat, number> = {
    reel: 90,
    short: 60,
    long: 600,
    carrossel: 30,
  };

  const maxDuration = maxDurations[format];

  if (estimatedDuration > maxDuration) {
    warnings.push(
      `Script pode ser muito longo (~${estimatedDuration}s). Máximo recomendado: ${maxDuration}s para ${format}`
    );
  }

  if (wordCount < 10) {
    warnings.push('Script parece muito curto');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function estimateScriptDuration(script: string): number {
  const wordCount = script.trim().split(/\s+/).length;
  // Average speaking rate: 150 words per minute
  return Math.ceil((wordCount / 150) * 60);
}

// ═══════════════════════════════════════════════════════════════════════
// PROGRESS UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export function getProgressPercentage(status: VideoStatus): number {
  const progress: Record<VideoStatus, number> = {
    draft: 0,
    audio_generating: 25,
    audio_ready: 40,
    video_generating: 60,
    video_ready: 80,
    publishing: 90,
    published: 100,
    failed: 0,
  };

  return progress[status] || 0;
}

export function getProgressLabel(status: VideoStatus): string {
  const labels: Record<VideoStatus, string> = {
    draft: 'Aguardando início',
    audio_generating: 'Gerando áudio com ElevenLabs...',
    audio_ready: 'Áudio pronto, preparando vídeo...',
    video_generating: 'Gerando vídeo com HeyGen...',
    video_ready: 'Vídeo pronto para publicação',
    publishing: 'Publicando nos canais...',
    published: 'Publicado com sucesso',
    failed: 'Erro na produção',
  };

  return labels[status] || 'Processando...';
}
