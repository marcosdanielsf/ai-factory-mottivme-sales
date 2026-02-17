import { useState } from 'react';
import {
  Check, X, Calendar, Send, Edit3, Eye,
  Instagram, Linkedin, Facebook, Mail, Video, Image as ImageIcon,
  Hash, MessageSquare
} from 'lucide-react';
import type { ContentPiece } from '../../../hooks/useContentPieces';

interface ContentReviewCardProps {
  piece: ContentPiece;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  onSchedule: (id: string, date: string) => Promise<boolean>;
  onEdit: (id: string, updates: Partial<ContentPiece>) => Promise<ContentPiece | null>;
}

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  email: Mail,
};

const TYPE_COLORS: Record<string, string> = {
  post: 'bg-blue-500/20 text-blue-400',
  reel: 'bg-purple-500/20 text-purple-400',
  email: 'bg-green-500/20 text-green-400',
  ad: 'bg-orange-500/20 text-orange-400',
  story: 'bg-pink-500/20 text-pink-400',
  carousel: 'bg-cyan-500/20 text-cyan-400',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  scheduled: 'bg-blue-500/20 text-blue-400',
  published: 'bg-emerald-500/20 text-emerald-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  scheduled: 'Agendado',
  published: 'Publicado',
};

export function ContentReviewCard({ piece, onApprove, onReject, onSchedule, onEdit }: ContentReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(piece.body);
  const [expanded, setExpanded] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const PlatformIcon = piece.platform ? PLATFORM_ICONS[piece.platform] || MessageSquare : MessageSquare;
  const isPending = piece.approval_status === 'pending';

  const handleSaveEdit = async () => {
    if (editBody.trim() !== piece.body) {
      await onEdit(piece.id, { body: editBody.trim() });
    }
    setEditing(false);
  };

  const handleSchedule = async () => {
    if (scheduleDate) {
      await onSchedule(piece.id, scheduleDate);
      setShowSchedule(false);
    }
  };

  const truncatedBody = piece.body.length > 200 && !expanded
    ? piece.body.slice(0, 200) + '...'
    : piece.body;

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <PlatformIcon className="w-4 h-4 text-text-muted" />
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[piece.type] || ''}`}>
            {piece.type.toUpperCase()}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[piece.approval_status] || ''}`}>
            {STATUS_LABELS[piece.approval_status] || piece.approval_status}
          </span>
        </div>
        {piece.platform && (
          <span className="text-xs text-text-muted capitalize">{piece.platform}</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {piece.title && (
          <h3 className="text-sm font-medium text-text-primary">{piece.title}</h3>
        )}

        {piece.hook && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-text-muted uppercase tracking-wide mt-0.5">Hook:</span>
            <p className="text-sm text-accent-primary font-medium">{piece.hook}</p>
          </div>
        )}

        {editing ? (
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary resize-none"
          />
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {truncatedBody}
          </p>
        )}

        {piece.body.length > 200 && !editing && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-accent-primary hover:underline"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}

        {piece.cta && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-text-muted uppercase tracking-wide mt-0.5">CTA:</span>
            <p className="text-sm text-text-primary font-medium">{piece.cta}</p>
          </div>
        )}

        {piece.subject && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-text-muted uppercase tracking-wide mt-0.5">Subject:</span>
            <p className="text-sm text-text-primary">{piece.subject}</p>
          </div>
        )}

        {piece.hashtags && piece.hashtags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Hash className="w-3 h-3 text-text-muted" />
            {piece.hashtags.map((tag, i) => (
              <span key={i} className="text-xs text-accent-primary">#{tag}</span>
            ))}
          </div>
        )}

        {piece.media_url && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {piece.media_type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
            <span>Media anexada</span>
          </div>
        )}

        {/* Schedule picker */}
        {showSchedule && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
            />
            <button
              onClick={handleSchedule}
              disabled={!scheduleDate}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
            >
              Agendar
            </button>
            <button
              onClick={() => setShowSchedule(false)}
              className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-muted rounded-lg hover:bg-bg-hover"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-border-default bg-bg-primary/50">
        {editing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-500"
            >
              <Check className="w-3 h-3" /> Salvar
            </button>
            <button
              onClick={() => { setEditing(false); setEditBody(piece.body); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary text-text-muted rounded-md hover:bg-bg-hover"
            >
              <X className="w-3 h-3" /> Cancelar
            </button>
          </>
        ) : (
          <>
            {isPending && (
              <>
                <button
                  onClick={() => onApprove(piece.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-500"
                >
                  <Check className="w-3 h-3" /> Aprovar
                </button>
                <button
                  onClick={() => onReject(piece.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/80 text-white rounded-md hover:bg-red-500"
                >
                  <X className="w-3 h-3" /> Rejeitar
                </button>
              </>
            )}
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-md hover:bg-bg-hover"
            >
              <Edit3 className="w-3 h-3" /> Editar
            </button>
            {(isPending || piece.approval_status === 'approved') && (
              <button
                onClick={() => setShowSchedule(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-md hover:bg-bg-hover"
              >
                <Calendar className="w-3 h-3" /> Agendar
              </button>
            )}
            {piece.approval_status === 'approved' && (
              <button
                onClick={() => onEdit(piece.id, { approval_status: 'published', published_at: new Date().toISOString() })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-primary text-white rounded-md hover:opacity-90 ml-auto"
              >
                <Send className="w-3 h-3" /> Publicar
              </button>
            )}
            {!expanded && piece.body.length <= 200 && (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-tertiary text-text-muted rounded-md hover:bg-bg-hover ml-auto"
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
