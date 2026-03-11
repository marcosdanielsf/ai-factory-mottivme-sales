import React from 'react';
import { X, Eye, EyeOff, Shuffle, ChevronDown, AlertCircle, Check } from 'lucide-react';
import type { Location } from '../types';
import {
  generateRandomPassword,
  getAvatarColor,
  getInitials,
  getRoleBadgeClass,
  getRoleLabel,
} from '../helpers';

interface CreateUserModalProps {
  newUser: { email: string; password: string; locationId: string; role: 'admin' | 'client' | 'viewer' };
  locations: Location[];
  showPassword: boolean;
  onNewUserChange: (user: CreateUserModalProps['newUser']) => void;
  onShowPasswordToggle: () => void;
  onCreate: () => void;
  onClose: () => void;
}

export function CreateUserModal({
  newUser,
  locations,
  showPassword,
  onNewUserChange,
  onShowPasswordToggle,
  onCreate,
  onClose,
}: CreateUserModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95">
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-text-primary">Criar Novo Usuário</h3>
            <p className="text-sm text-text-muted mt-0.5">Preencha os dados para criar uma nova conta</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">
                Credenciais
              </h4>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => onNewUserChange({ ...newUser, email: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Senha</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) => onNewUserChange({ ...newUser, password: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 transition-all"
                      placeholder="Digite a senha"
                    />
                    <button
                      type="button"
                      onClick={onShowPasswordToggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-primary rounded transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-text-muted" />
                      ) : (
                        <Eye className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      onNewUserChange({ ...newUser, password: generateRandomPassword() });
                      if (!showPassword) onShowPasswordToggle();
                    }}
                    className="px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-sm transition-colors whitespace-nowrap flex items-center gap-2"
                    title="Gerar senha aleatória"
                  >
                    <Shuffle className="w-4 h-4" />
                    Gerar
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-default">
              <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">
                Acesso
              </h4>

              {/* Location */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
                <div className="relative">
                  <select
                    value={newUser.locationId}
                    onChange={(e) => onNewUserChange({ ...newUser, locationId: e.target.value })}
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
                <div className="space-y-2">
                  {[
                    { value: 'admin', label: 'Admin', desc: 'Acesso total ao sistema' },
                    { value: 'client', label: 'Cliente', desc: 'Acesso limitado aos dados' },
                    { value: 'viewer', label: 'Visualizador', desc: 'Somente leitura' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        newUser.role === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-border-default hover:bg-bg-tertiary'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={newUser.role === option.value}
                        onChange={(e) =>
                          onNewUserChange({
                            ...newUser,
                            role: e.target.value as 'admin' | 'client' | 'viewer',
                          })
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{option.label}</p>
                        <p className="text-xs text-text-muted">{option.desc}</p>
                      </div>
                      {newUser.role === option.value && (
                        <Check className="w-4 h-4 text-blue-400 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="bg-bg-tertiary border border-border-default rounded-xl p-6">
            <h4 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wide">
              Preview
            </h4>
            <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full ${
                    newUser.email ? getAvatarColor(newUser.email) : 'bg-gray-500'
                  } flex items-center justify-center text-white font-semibold shadow-lg`}
                >
                  {newUser.email ? getInitials(newUser.email) : '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {newUser.email || 'usuario@exemplo.com'}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(
                      newUser.role
                    )}`}
                  >
                    {getRoleLabel(newUser.role)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-t border-border-default">
                  <span className="text-text-muted">Location:</span>
                  <span className="text-text-primary font-medium">
                    {newUser.locationId
                      ? locations.find((l) => l.id === newUser.locationId)?.name
                      : 'Nenhuma'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-border-default">
                  <span className="text-text-muted">Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-gray-500/10 text-gray-400 border-gray-500/20">
                    ⚪ Nunca logou
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                As credenciais serão mostradas apenas uma vez após a criação
              </p>
            </div>
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
            disabled={!newUser.email || !newUser.password || !newUser.locationId}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/20"
          >
            Criar Usuário
          </button>
        </div>
      </div>
    </div>
  );
}
