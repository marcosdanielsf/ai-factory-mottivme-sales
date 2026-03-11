import React from 'react';
import { Mail, X, ChevronDown, Clock } from 'lucide-react';
import type { Location } from '../types';

interface CreateInviteModalProps {
  newInvite: { email: string; locationId: string; role: 'admin' | 'client' | 'viewer' };
  locations: Location[];
  onNewInviteChange: (invite: CreateInviteModalProps['newInvite']) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function CreateInviteModal({
  newInvite,
  locations,
  onNewInviteChange,
  onCreate,
  onClose,
}: CreateInviteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Criar Convite</h3>
              <p className="text-sm text-text-muted">Envie um link de convite por email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={newInvite.email}
              onChange={(e) => onNewInviteChange({ ...newInvite, email: e.target.value })}
              className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="usuario@exemplo.com"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
            <div className="relative">
              <select
                value={newInvite.locationId}
                onChange={(e) => onNewInviteChange({ ...newInvite, locationId: e.target.value })}
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
              >
                <option value="">Selecione uma location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Permissão</label>
            <div className="relative">
              <select
                value={newInvite.role}
                onChange={(e) =>
                  onNewInviteChange({ ...newInvite, role: e.target.value as 'admin' | 'client' | 'viewer' })
                }
                className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
              >
                <option value="admin">Admin (acesso total)</option>
                <option value="client">Cliente (acesso limitado)</option>
                <option value="viewer">Visualizador (somente leitura)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-xs text-blue-400 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>O convite expira em 7 dias. O usuário poderá criar sua própria senha ao aceitar o convite.</span>
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-border-default flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 hover:bg-bg-tertiary text-text-secondary rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={!newInvite.email || !newInvite.locationId}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/20"
          >
            Criar Convite
          </button>
        </div>
      </div>
    </div>
  );
}
