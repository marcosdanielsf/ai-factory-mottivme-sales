import React, { useState, useMemo } from 'react';
import { X, Shield, RotateCcw, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { rolePermissions, type Permissions, type UserRole } from '../../../hooks/usePermissions';

interface PermissionsEditorDrawerProps {
  userId: string;
  email: string;
  locationId: string;
  locationName: string;
  role: string;
  currentCustomPermissions: Record<string, boolean> | null;
  onClose: () => void;
  onSaved: () => void;
  onError?: (message: string) => void;
}

const PAGE_PERMISSIONS: Array<{ key: keyof Permissions; label: string }> = [
  { key: 'canAccessDashboard', label: 'Dashboard' },
  { key: 'canAccessSupervision', label: 'Supervisao IA' },
  { key: 'canAccessPromptEditor', label: 'Prompt Studio' },
  { key: 'canAccessAgendamentos', label: 'Agendamentos' },
  { key: 'canAccessFunilLeads', label: 'Funil de Leads' },
  { key: 'canAccessFollowUps', label: 'Follow-ups' },
  { key: 'canAccessStatusCenter', label: 'Central de Status' },
  { key: 'canAccessLogs', label: 'Logs de Conversa' },
  { key: 'canAccessConfiguracoes', label: 'Configuracoes' },
  { key: 'canAccessValidation', label: 'Testes & Qualidade' },
  { key: 'canAccessKnowledgeBase', label: 'Base de Conhecimento' },
  { key: 'canAccessNotifications', label: 'Alertas' },
  { key: 'canAccessLeads', label: 'Leads' },
  { key: 'canAccessCalls', label: 'Calls Realizadas' },
  { key: 'canAccessAios', label: 'AIOS' },
  { key: 'canAccessBrand', label: 'Brand' },
  { key: 'canAccessSocialSelling', label: 'Social Selling' },
  { key: 'canAccessPlanejamento', label: 'Planejamento' },
];

const ACTION_PERMISSIONS: Array<{ key: keyof Permissions; label: string }> = [
  { key: 'canWriteMessages', label: 'Enviar Mensagens' },
  { key: 'canEditPrompts', label: 'Editar Prompts' },
  { key: 'canManageAgents', label: 'Gerenciar Agentes' },
  { key: 'canViewAllClients', label: 'Ver Todos os Clientes' },
  { key: 'canExportData', label: 'Exportar Dados' },
  { key: 'canManageUsers', label: 'Gerenciar Usuarios' },
];

export const PermissionsEditorDrawer: React.FC<PermissionsEditorDrawerProps> = ({
  userId,
  email,
  locationId,
  locationName,
  role,
  currentCustomPermissions,
  onClose,
  onSaved,
  onError,
}) => {
  const safeRole = (role in rolePermissions) ? role as UserRole : 'client';
  const defaults = rolePermissions[safeRole];

  // Initialize local state: merge defaults + current overrides
  const [localPerms, setLocalPerms] = useState<Record<keyof Permissions, boolean>>(() => {
    return { ...defaults, ...(currentCustomPermissions ?? {}) } as Record<keyof Permissions, boolean>;
  });
  const [saving, setSaving] = useState(false);

  const hasOverride = useMemo(() => {
    return Object.keys(defaults).some(
      (k) => localPerms[k as keyof Permissions] !== defaults[k as keyof Permissions]
    );
  }, [localPerms, defaults]);

  const isCustom = (key: keyof Permissions) => localPerms[key] !== defaults[key];

  const togglePerm = (key: keyof Permissions) => {
    setLocalPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setLocalPerms({ ...defaults });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calculate delta: only keys that differ from defaults
      const delta: Record<string, boolean> = {};
      for (const k of Object.keys(defaults) as Array<keyof Permissions>) {
        if (localPerms[k] !== defaults[k]) {
          delta[k] = localPerms[k];
        }
      }

      const value = Object.keys(delta).length > 0 ? delta : null;

      const { error } = await supabase
        .from('user_locations')
        .update({ custom_permissions: value })
        .eq('user_id', userId)
        .eq('location_id', locationId);

      if (error) throw error;

      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar permissoes';
      console.error('Error saving permissions:', err);
      onError?.(message);
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (key: keyof Permissions, label: string) => {
    const active = localPerms[key];
    const custom = isCustom(key);

    return (
      <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary">{label}</span>
          {custom && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
              custom
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => togglePerm(key)}
          className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
            active ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200 ${
              active ? 'translate-x-[18px]' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-bg-secondary border-l border-border-default shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border-default p-5 z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-text-primary">Permissoes</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
          <p className="text-xs text-text-muted truncate">{email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-text-muted">{locationName}</span>
            {hasOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                Override ativo
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Pages */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Paginas ({PAGE_PERMISSIONS.length})
            </h4>
            <div className="bg-bg-tertiary/30 border border-border-default rounded-xl divide-y divide-border-default/50 px-1">
              {PAGE_PERMISSIONS.map((p) => renderToggle(p.key, p.label))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Acoes ({ACTION_PERMISSIONS.length})
            </h4>
            <div className="bg-bg-tertiary/30 border border-border-default rounded-xl divide-y divide-border-default/50 px-1">
              {ACTION_PERMISSIONS.map((p) => renderToggle(p.key, p.label))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-bg-secondary border-t border-border-default p-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 px-4 py-2.5 bg-bg-tertiary border border-border-default rounded-xl text-sm text-text-primary hover:bg-bg-primary flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
