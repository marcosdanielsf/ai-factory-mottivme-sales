export type JarvisAlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface JarvisAlert {
  id: string;
  severity: JarvisAlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

export type JarvisMessageRole = 'user' | 'jarvis';

export interface JarvisMessage {
  id: string;
  role: JarvisMessageRole;
  content: string;
  timestamp: string;
  loading?: boolean;
}

export type JarvisVoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
