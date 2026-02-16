import React from 'react';
import type { User, GroupedUser } from '../types';
import {
  getUserStatus,
  getStatusBadge,
  getAvatarColor,
  getInitials,
  getRoleBadgeClass,
  getRoleLabel,
  formatRelativeDate,
} from '../helpers';
import {
  UsersRound,
  Plus,
  Key,
  Trash2,
  Mail,
  RefreshCw,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';

interface UsersTableProps {
  groupedUsers: GroupedUser[];
  usersCount: number;
  loading: boolean;
  expandedUsers: Set<string>;
  openDropdown: string | null;
  onToggleExpand: (userId: string) => void;
  onSetOpenDropdown: (id: string | null) => void;
  onOpenDrawer: (group: GroupedUser) => void;
  onSelectUserForPassword: (user: User) => void;
  onResetPassword: (email: string) => void;
  onRemoveAccess: (userId: string, locationId: string, email: string) => void;
  onShowCreateModal: () => void;
}

export function UsersTable({
  groupedUsers,
  usersCount,
  loading,
  expandedUsers,
  openDropdown,
  onToggleExpand,
  onSetOpenDropdown,
  onOpenDrawer,
  onSelectUserForPassword,
  onResetPassword,
  onRemoveAccess,
  onShowCreateModal,
}: UsersTableProps) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden shadow-sm">
      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-8 h-8 text-text-muted mx-auto mb-3 animate-spin" />
          <p className="text-sm text-text-muted">Carregando usuários...</p>
        </div>
      ) : groupedUsers.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UsersRound className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {usersCount === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado'}
          </h3>
          <p className="text-sm text-text-muted mb-6">
            {usersCount === 0
              ? 'Crie o primeiro usuário para começar'
              : 'Tente ajustar os filtros de busca'}
          </p>
          {usersCount === 0 && (
            <button
              onClick={onShowCreateModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Usuário
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {groupedUsers.map(({ user, locations: userLocations }) => {
                const status = getUserStatus(user.last_sign_in_at);
                const statusInfo = getStatusBadge(status);
                const dropdownId = user.user_id;
                const isExpanded = expandedUsers.has(user.user_id);
                const hasMultipleLocations = userLocations.length > 1;

                return (
                  <React.Fragment key={user.user_id}>
                    <tr
                      onClick={() => onOpenDrawer({ user, locations: userLocations })}
                      className="hover:bg-bg-tertiary/30 transition-colors group cursor-pointer"
                    >
                      {/* Avatar + Email + Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${getAvatarColor(
                              user.email
                            )} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}
                          >
                            {getInitials(user.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{user.email}</p>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(
                                user.role
                              )}`}
                            >
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Locations */}
                      <td className="px-6 py-4">
                        {hasMultipleLocations ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(user.user_id);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary hover:bg-bg-primary border border-border-default rounded-lg text-sm transition-colors"
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-text-muted transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                            <span className="text-text-secondary font-medium">
                              {userLocations.length} locations
                            </span>
                          </button>
                        ) : (
                          <p className="text-sm text-text-secondary">{userLocations[0].location_name}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusInfo.class}`}
                        >
                          <span>{statusInfo.icon}</span>
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Last Sign In */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-text-muted">
                          {formatRelativeDate(user.last_sign_in_at)}
                        </p>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
                            }}
                            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4 text-text-muted" />
                          </button>

                          {openDropdown === dropdownId && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-bg-secondary border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden">
                              <button
                                onClick={() => {
                                  onSelectUserForPassword(user);
                                  onSetOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-bg-tertiary flex items-center gap-3 text-text-primary transition-colors"
                              >
                                <Key className="w-4 h-4 text-blue-400" />
                                Alterar Senha
                              </button>
                              <button
                                onClick={() => {
                                  onResetPassword(user.email);
                                  onSetOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-bg-tertiary flex items-center gap-3 text-text-primary transition-colors"
                              >
                                <Mail className="w-4 h-4 text-blue-400" />
                                Enviar Reset por Email
                              </button>

                              <div className="border-t border-border-default mt-1"></div>

                              <button
                                onClick={() => {
                                  onRemoveAccess(user.user_id, user.location_id, user.email);
                                  onSetOpenDropdown(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-red-500/10 flex items-center gap-3 text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remover Acesso
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded locations sub-rows */}
                    {isExpanded &&
                      hasMultipleLocations &&
                      userLocations.map((loc) => (
                        <tr key={`${user.user_id}-${loc.location_id}`} className="bg-bg-tertiary/20">
                          <td className="px-6 py-3">
                            <div className="pl-[52px]">
                              <span className="text-xs text-text-muted">└</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <p className="text-sm text-text-secondary">{loc.location_name}</p>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(
                                loc.role
                              )}`}
                            >
                              {getRoleLabel(loc.role)}
                            </span>
                          </td>
                          <td className="px-6 py-3"></td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => onRemoveAccess(user.user_id, loc.location_id, user.email)}
                              className="p-1.5 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 rounded transition-colors"
                              title="Remover desta location"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
