import React from 'react';
import type { PendingInvite } from '../types';
import { getRoleBadgeClass, getRoleLabel, formatRelativeDate, getInviteLink } from '../helpers';
import { Mail, Plus, Clock, ChevronRight, Copy, Check } from 'lucide-react';

interface PendingInvitesProps {
  pendingInvites: PendingInvite[];
  invitesExpanded: boolean;
  copiedItem: string | null;
  onToggleExpanded: () => void;
  onShowInviteModal: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}

export function PendingInvites({
  pendingInvites,
  invitesExpanded,
  copiedItem,
  onToggleExpanded,
  onShowInviteModal,
  onCopyToClipboard,
}: PendingInvitesProps) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={onToggleExpanded}
        className="w-full p-4 flex items-center justify-between hover:bg-bg-tertiary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <h2 className="text-lg font-semibold text-text-primary">Convites Pendentes</h2>
            <p className="text-xs text-text-muted">
              {pendingInvites.length} {pendingInvites.length === 1 ? 'convite ativo' : 'convites ativos'}
            </p>
          </div>
          {pendingInvites.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
              {pendingInvites.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowInviteModal();
            }}
            className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
          <ChevronRight
            className={`w-5 h-5 text-text-muted transition-transform ${
              invitesExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>

      {invitesExpanded && (
        <div className="border-t border-border-default">
          {pendingInvites.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-bg-tertiary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">Nenhum convite pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-border-default">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 hover:bg-bg-tertiary/30 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">{invite.location_name}</span>
                        <span className="text-text-muted">•</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(
                            invite.role
                          )}`}
                        >
                          {getRoleLabel(invite.role)}
                        </span>
                        <span className="text-text-muted">•</span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expira {formatRelativeDate(invite.expires_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onCopyToClipboard(getInviteLink(invite.token), invite.id)}
                    className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    {copiedItem === invite.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
