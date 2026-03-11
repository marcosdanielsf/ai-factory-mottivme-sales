import React from 'react';
import { Key, Eye, EyeOff, Shuffle, Copy, Check, AlertCircle } from 'lucide-react';
import type { User } from '../types';
import { generateRandomPassword } from '../helpers';

interface ChangePasswordModalProps {
  selectedUser: User;
  newPassword: string;
  showNewPassword: boolean;
  copiedItem: string | null;
  onNewPasswordChange: (pw: string) => void;
  onShowNewPasswordToggle: () => void;
  onChangePassword: () => void;
  onClose: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}

export function ChangePasswordModal({
  selectedUser,
  newPassword,
  showNewPassword,
  copiedItem,
  onNewPasswordChange,
  onShowNewPasswordToggle,
  onChangePassword,
  onClose,
  onCopyToClipboard,
}: ChangePasswordModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Key className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Alterar Senha</h3>
              <p className="text-sm text-text-muted">{selectedUser.email}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>A senha será alterada imediatamente e o usuário precisará usar a nova senha no próximo login.</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nova Senha</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => onNewPasswordChange(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 transition-all"
                  placeholder="Digite a nova senha"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={onShowNewPasswordToggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-primary rounded transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4 text-text-muted" />
                  ) : (
                    <Eye className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
              <button
                onClick={() => {
                  onNewPasswordChange(generateRandomPassword());
                  if (!showNewPassword) onShowNewPasswordToggle();
                }}
                className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-sm transition-colors whitespace-nowrap flex items-center gap-2"
                title="Gerar senha aleatória"
              >
                <Shuffle className="w-4 h-4" />
                Gerar
              </button>
            </div>

            {newPassword && (
              <button
                onClick={() => onCopyToClipboard(newPassword, 'new-password')}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border-default hover:bg-bg-primary rounded-lg text-sm text-text-secondary flex items-center justify-center gap-2 transition-colors"
              >
                {copiedItem === 'new-password' ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Senha
                  </>
                )}
              </button>
            )}
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
            onClick={onChangePassword}
            disabled={!newPassword}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/20"
          >
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
}
