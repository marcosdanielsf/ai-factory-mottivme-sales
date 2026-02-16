import React from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Key, Mail, Trash2, Copy, Check } from 'lucide-react';
import type { User, GroupedUser } from '../types';
import {
  getAvatarColor,
  getInitials,
  getUserStatus,
  getStatusBadge,
  getRoleBadgeClass,
  getRoleLabel,
  formatDate,
} from '../helpers';

interface UserDetailDrawerProps {
  drawerUser: GroupedUser;
  copiedItem: string | null;
  onClose: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
  onSelectUserForPassword: (user: User) => void;
  onResetPassword: (email: string) => void;
  onRemoveAccess: (userId: string, locationId: string, email: string) => void;
  onRemoveAllAccess: () => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  drawerUser,
  copiedItem,
  onClose,
  onCopyToClipboard,
  onSelectUserForPassword,
  onResetPassword,
  onRemoveAccess,
  onRemoveAllAccess,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-bg-secondary border-l border-border-default shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-default p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary">Detalhes do Usuário</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Avatar + Email */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full ${getAvatarColor(
                drawerUser.user.email
              )} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
            >
              {getInitials(drawerUser.user.email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-text-primary truncate">
                {drawerUser.user.email}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const s = getUserStatus(drawerUser.user.last_sign_in_at);
                  const si = getStatusBadge(s);
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${si.class}`}>
                      <span>{si.icon}</span> {si.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 space-y-6">
          {/* Details Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Informações</h4>
            <div className="bg-bg-tertiary border border-border-default rounded-xl divide-y divide-border-default">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-text-muted">Criado em</span>
                <span className="text-sm text-text-primary font-medium">
                  {formatDate(drawerUser.user.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-text-muted">Último acesso</span>
                <span className="text-sm text-text-primary font-medium">
                  {drawerUser.user.last_sign_in_at
                    ? formatDate(drawerUser.user.last_sign_in_at)
                    : 'Nunca'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-text-muted">User ID</span>
                <button
                  onClick={() => onCopyToClipboard(drawerUser.user.user_id, 'uid')}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary font-mono transition-colors"
                >
                  {drawerUser.user.user_id.substring(0, 8)}...
                  {copiedItem === 'uid' ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Locations ({drawerUser.locations.length})
            </h4>
            <div className="space-y-2">
              {drawerUser.locations.map((loc) => (
                <div
                  key={loc.location_id}
                  className="bg-bg-tertiary border border-border-default rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{loc.location_name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(loc.role)}`}>
                      {getRoleLabel(loc.role)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onRemoveAccess(drawerUser.user.user_id, loc.location_id, drawerUser.user.email);
                      if (drawerUser.locations.length <= 1) onClose();
                    }}
                    className="p-2 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 rounded-lg transition-colors"
                    title="Remover desta location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Ações Rápidas</h4>
            <div className="space-y-2">
              <button
                onClick={() => onSelectUserForPassword(drawerUser.user)}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-default rounded-xl text-sm text-text-primary hover:bg-bg-primary flex items-center gap-3 transition-colors"
              >
                <Key className="w-4 h-4 text-blue-400" />
                Alterar Senha
              </button>
              <button
                onClick={() => onResetPassword(drawerUser.user.email)}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-default rounded-xl text-sm text-text-primary hover:bg-bg-primary flex items-center gap-3 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                Enviar Reset por Email
              </button>
              <button
                onClick={onRemoveAllAccess}
                className="w-full px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remover Todo Acesso
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
