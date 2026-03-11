import React, { useState } from 'react';
import { X, Calendar, XCircle, UserX, UserCheck, Trophy } from 'lucide-react';
import { MeetingStatus, meetingStatusConfig } from '../../types/supervision';

interface MeetingStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: MeetingStatus, notes?: string) => void;
  executing?: boolean;
  isMobile?: boolean;
}

const statusIcons: Record<MeetingStatus, React.ReactNode> = {
  cancelado: <XCircle size={20} />,
  no_show: <UserX size={20} />,
  compareceu: <UserCheck size={20} />,
  fechado: <Trophy size={20} />,
};

export const MeetingStatusModal: React.FC<MeetingStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  executing,
  isMobile,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<MeetingStatus | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedStatus) return;
    onConfirm(selectedStatus, notes.trim() || undefined);
    setSelectedStatus(null);
    setNotes('');
  };

  const statuses = Object.entries(meetingStatusConfig) as [MeetingStatus, typeof meetingStatusConfig[MeetingStatus]][];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className={`bg-bg-secondary rounded-t-xl md:rounded-xl w-full ${isMobile ? 'max-h-[85vh]' : 'max-w-md mx-4'} overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-purple-400" />
            <h3 className="text-lg font-semibold text-text-primary">Status da Reuniao</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-text-muted mb-3">
            Atualize o status da reuniao agendada:
          </p>

          <div className="grid grid-cols-2 gap-3">
            {statuses.map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm transition-all ${
                  selectedStatus === key
                    ? `border-current ${config.bgColor} ${config.color}`
                    : 'border-border-default bg-bg-primary text-text-secondary hover:bg-bg-hover'
                }`}
              >
                <span className={selectedStatus === key ? config.color : 'text-text-muted'}>
                  {statusIcons[key]}
                </span>
                <span className="font-medium">{config.label}</span>
              </button>
            ))}
          </div>

          {/* Notes */}
          {selectedStatus && (
            <div className="mt-3">
              <label className="block text-sm text-text-muted mb-1">Observacoes (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicionar observacao..."
                className="w-full h-20 px-3 py-2 bg-bg-primary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-primary"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t border-border-default">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-bg-hover text-text-secondary rounded-lg text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus || executing}
            className="flex-1 px-4 py-2.5 bg-accent-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {executing ? 'Atualizando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
