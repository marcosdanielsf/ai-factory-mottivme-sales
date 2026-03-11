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

export interface JarvisAttachment {
  name: string;
  type: 'text' | 'image';
  /** For text: file content. For image: base64 data (no prefix). */
  data: string;
  /** MIME type for images (image/png, image/jpeg, etc.) */
  mediaType?: string;
}

export interface JarvisMessage {
  id: string;
  role: JarvisMessageRole;
  content: string;
  timestamp: string;
  loading?: boolean;
  attachments?: JarvisAttachment[];
}

export type JarvisVoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
