import React from 'react';
import {
  FileText,
  Volume2,
  CheckCircle,
  Video,
  Send,
  AlertCircle,
} from 'lucide-react';
import type { VideoStatus } from '../../hooks/useVideoProducer';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface VideoStatusTimelineProps {
  status: VideoStatus;
  timestamps?: Record<string, string>;
  errorMessage?: string;
}

interface TimelineStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'active' | 'pending' | 'error';
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStepStatus = (
  currentStatus: VideoStatus,
  stepId: string
): 'completed' | 'active' | 'pending' | 'error' => {
  if (currentStatus === 'failed') {
    // Determine which step failed based on status progression
    const statusOrder = ['draft', 'audio_generating', 'audio_ready', 'video_generating', 'video_ready', 'publishing', 'published'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepOrder = ['draft', 'audio_gen', 'audio_ready', 'video_gen', 'video_ready', 'published'];
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex <= currentIndex) return 'error';
    return 'pending';
  }

  const statusMap: Record<string, string[]> = {
    draft: ['draft'],
    audio_gen: ['audio_generating'],
    audio_ready: ['audio_ready', 'video_generating', 'video_ready', 'publishing', 'published'],
    video_gen: ['video_generating'],
    video_ready: ['video_ready', 'publishing', 'published'],
    published: ['published'],
  };

  const completedSteps = statusMap[stepId] || [];

  // Check if this step is completed
  if (
    (stepId === 'draft' && ['audio_generating', 'audio_ready', 'video_generating', 'video_ready', 'publishing', 'published'].includes(currentStatus)) ||
    (stepId === 'audio_gen' && ['audio_ready', 'video_generating', 'video_ready', 'publishing', 'published'].includes(currentStatus)) ||
    (stepId === 'audio_ready' && ['video_generating', 'video_ready', 'publishing', 'published'].includes(currentStatus)) ||
    (stepId === 'video_gen' && ['video_ready', 'publishing', 'published'].includes(currentStatus)) ||
    (stepId === 'video_ready' && ['publishing', 'published'].includes(currentStatus)) ||
    (stepId === 'published' && currentStatus === 'published')
  ) {
    return 'completed';
  }

  // Check if this step is active
  if (completedSteps.includes(currentStatus)) {
    return 'active';
  }

  return 'pending';
};

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export const VideoStatusTimeline = ({ status, timestamps = {}, errorMessage }: VideoStatusTimelineProps) => {
  const steps: TimelineStep[] = [
    {
      id: 'draft',
      label: 'Rascunho',
      icon: <FileText size={16} />,
      status: getStepStatus(status, 'draft'),
    },
    {
      id: 'audio_gen',
      label: 'Gerando Áudio',
      icon: <Volume2 size={16} />,
      status: getStepStatus(status, 'audio_gen'),
    },
    {
      id: 'audio_ready',
      label: 'Áudio Pronto',
      icon: <CheckCircle size={16} />,
      status: getStepStatus(status, 'audio_ready'),
    },
    {
      id: 'video_gen',
      label: 'Gerando Vídeo',
      icon: <Video size={16} />,
      status: getStepStatus(status, 'video_gen'),
    },
    {
      id: 'video_ready',
      label: 'Vídeo Pronto',
      icon: <CheckCircle size={16} />,
      status: getStepStatus(status, 'video_ready'),
    },
    {
      id: 'published',
      label: 'Publicado',
      icon: <Send size={16} />,
      status: getStepStatus(status, 'published'),
    },
  ];

  const getStepColor = (stepStatus: TimelineStep['status']) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-[#3fb950] bg-[#3fb950]/10 border-[#3fb950]/20';
      case 'active':
        return 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/20';
      case 'error':
        return 'text-[#f85149] bg-[#f85149]/10 border-[#f85149]/20';
      case 'pending':
      default:
        return 'text-[#8b949e] bg-[#0d1117] border-[#30363d]';
    }
  };

  const getLineColor = (stepStatus: TimelineStep['status']) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-[#3fb950]';
      case 'active':
        return 'bg-[#58a6ff]';
      case 'error':
        return 'bg-[#f85149]';
      case 'pending':
      default:
        return 'bg-[#30363d]';
    }
  };

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const timestamp = formatTimestamp(timestamps[step.id]);

        return (
          <div key={step.id} className="relative flex items-start gap-3">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 -mb-1" style={{ height: '100%' }}>
                <div className={`w-full h-full ${getLineColor(step.status === 'completed' ? 'completed' : 'pending')}`} />
              </div>
            )}

            {/* Icon circle */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${getStepColor(
                step.status
              )} ${step.status === 'active' ? 'animate-pulse' : ''}`}
            >
              {step.status === 'error' ? <AlertCircle size={16} /> : step.icon}
            </div>

            {/* Label and timestamp */}
            <div className="flex-1 pt-0.5">
              <p
                className={`text-sm font-medium ${
                  step.status === 'completed' || step.status === 'active'
                    ? 'text-white'
                    : step.status === 'error'
                    ? 'text-[#f85149]'
                    : 'text-[#8b949e]'
                }`}
              >
                {step.label}
              </p>
              {timestamp && <p className="text-xs text-[#8b949e] mt-0.5">{timestamp}</p>}
              {step.status === 'error' && errorMessage && step.id === 'video_gen' && (
                <p className="text-xs text-[#f85149] mt-1 bg-[#f85149]/10 border border-[#f85149]/20 rounded px-2 py-1">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
