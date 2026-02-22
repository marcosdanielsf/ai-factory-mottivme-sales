import React, { useState } from 'react';
import { X, XCircle } from 'lucide-react';
import { LostReason, lostReasonConfig } from '../../types/supervision';

interface LostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: LostReason, notes?: string) => void;
  executing?: boolean;
  isMobile?: boolean;
}

export const LostReasonModal: React.FC<LostReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  executing,
  isMobile,
}) => {
  const [selectedReason, setSelectedReason] = useState<LostReason | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedReason) return;
    if (selectedReason === 'outros' && !notes.trim()) return;
    onConfirm(selectedReason, notes.trim() || undefined);
    setSelectedReason(null);
    setNotes('');
  };

  const reasons = Object.entries(lostReasonConfig) as [LostReason, { label: string }][];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className={`bg-bg-secondary rounded-t-xl md:rounded-xl w-full ${isMobile ? 'max-h-[85vh]' : 'max-w-md mx-4'} overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-400" />
            <h3 className="text-lg font-semibold text-text-primary">Motivo do Perdido</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-text-muted mb-3">
            Selecione o motivo pelo qual este lead foi perdido:
          </p>

          {reasons.map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setSelectedReason(key)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                selectedReason === key
                  ? 'border-red-400 bg-red-400/10 text-red-400'
                  : 'border-border-default bg-bg-primary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {label}
            </button>
          ))}

          {/* Notes field - required for "outros", optional for others */}
          {selectedReason && (
            <div className="mt-3">
              <label className="block text-sm text-text-muted mb-1">
                {selectedReason === 'outros' ? 'Descricao (obrigatorio)' : 'Observacoes (opcional)'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={selectedReason === 'outros' ? 'Descreva o motivo...' : 'Adicionar observacao...'}
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
            disabled={!selectedReason || (selectedReason === 'outros' && !notes.trim()) || executing}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {executing ? 'Salvando...' : 'Marcar como Perdido'}
          </button>
        </div>
      </div>
    </div>
  );
};
