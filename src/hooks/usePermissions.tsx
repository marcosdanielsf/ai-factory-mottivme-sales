import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Tipos de usuário
export type UserRole = 'admin' | 'manager' | 'client' | 'recruiter' | 'employee';

// Definição de permissões por feature
export interface Permissions {
  // Páginas
  canAccessDashboard: boolean;
  canAccessSupervision: boolean;
  canAccessPromptEditor: boolean;
  canAccessAgendamentos: boolean;
  canAccessFunilLeads: boolean;
  canAccessFollowUps: boolean;
  canAccessStatusCenter: boolean;
  canAccessLogs: boolean;
  canAccessConfiguracoes: boolean;
  canAccessValidation: boolean;
  canAccessKnowledgeBase: boolean;
  canAccessNotifications: boolean;
  canAccessLeads: boolean;
  canAccessCalls: boolean;
  canAccessAios: boolean;
  canAccessBrand: boolean;
  canAccessSocialSelling: boolean;
  canAccessPlanejamento: boolean;

  // Ações
  canWriteMessages: boolean;
  canEditPrompts: boolean;
  canManageAgents: boolean;
  canViewAllClients: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
}

// Permissões por role (exportado para uso no PermissionsEditorDrawer)
export const rolePermissions: Record<UserRole, Permissions> = {
  admin: {
    // Páginas - Admin vê TUDO
    canAccessDashboard: true,
    canAccessSupervision: true,
    canAccessPromptEditor: true,
    canAccessAgendamentos: true,
    canAccessFunilLeads: true,
    canAccessFollowUps: true,
    canAccessStatusCenter: true,
    canAccessLogs: true,
    canAccessConfiguracoes: true,
    canAccessValidation: true,
    canAccessKnowledgeBase: true,
    canAccessNotifications: true,
    canAccessLeads: true,
    canAccessCalls: true,
    canAccessAios: true,
    canAccessBrand: true,
    canAccessSocialSelling: true,
    canAccessPlanejamento: true,
    // Ações
    canWriteMessages: true,
    canEditPrompts: true,
    canManageAgents: true,
    canViewAllClients: true,
    canExportData: true,
    canManageUsers: true,
  },

  manager: {
    // Páginas - Manager vê quase tudo, menos config avançada
    canAccessDashboard: true,
    canAccessSupervision: true,
    canAccessPromptEditor: false,
    canAccessAgendamentos: true,
    canAccessFunilLeads: true,
    canAccessFollowUps: true,
    canAccessStatusCenter: true,
    canAccessLogs: true,
    canAccessConfiguracoes: false,
    canAccessValidation: true,
    canAccessKnowledgeBase: true,
    canAccessNotifications: true,
    canAccessLeads: true,
    canAccessCalls: true,
    canAccessAios: true,
    canAccessBrand: true,
    canAccessSocialSelling: true,
    canAccessPlanejamento: true,
    // Ações
    canWriteMessages: true,
    canEditPrompts: false,
    canManageAgents: false,
    canViewAllClients: true,
    canExportData: true,
    canManageUsers: false,
  },

  client: {
    // Páginas - Cliente vê métricas e status
    canAccessDashboard: true,
    canAccessSupervision: false,
    canAccessPromptEditor: false,
    canAccessAgendamentos: true,
    canAccessFunilLeads: true,
    canAccessFollowUps: false,
    canAccessStatusCenter: true,
    canAccessLogs: false,
    canAccessConfiguracoes: false,
    canAccessValidation: false,
    canAccessKnowledgeBase: false,
    canAccessNotifications: true,
    canAccessLeads: true,
    canAccessCalls: false,
    canAccessAios: false,
    canAccessBrand: false,
    canAccessSocialSelling: true,
    canAccessPlanejamento: true,
    // Ações
    canWriteMessages: false,
    canEditPrompts: false,
    canManageAgents: false,
    canViewAllClients: false,
    canExportData: false,
    canManageUsers: false,
  },

  recruiter: {
    // Páginas - Recrutador vê só o essencial
    canAccessDashboard: true,
    canAccessSupervision: false,
    canAccessPromptEditor: false,
    canAccessAgendamentos: true,
    canAccessFunilLeads: false,
    canAccessFollowUps: false,
    canAccessStatusCenter: true,
    canAccessLogs: false,
    canAccessConfiguracoes: false,
    canAccessValidation: false,
    canAccessKnowledgeBase: false,
    canAccessNotifications: true,
    canAccessLeads: true,
    canAccessCalls: false,
    canAccessAios: false,
    canAccessBrand: false,
    canAccessSocialSelling: false,
    canAccessPlanejamento: false,
    // Ações
    canWriteMessages: false,
    canEditPrompts: false,
    canManageAgents: false,
    canViewAllClients: false,
    canExportData: false,
    canManageUsers: false,
  },

  employee: {
    // Páginas - Funcionário vê Supervisão IA + Agendamentos + Central de Status
    canAccessDashboard: false,
    canAccessSupervision: true,
    canAccessPromptEditor: false,
    canAccessAgendamentos: true,
    canAccessFunilLeads: false,
    canAccessFollowUps: false,
    canAccessStatusCenter: true,
    canAccessLogs: false,
    canAccessConfiguracoes: false,
    canAccessValidation: false,
    canAccessKnowledgeBase: false,
    canAccessNotifications: true,
    canAccessLeads: false,
    canAccessCalls: false,
    canAccessAios: false,
    canAccessBrand: false,
    canAccessSocialSelling: true,
    canAccessPlanejamento: true,
    // Ações
    canWriteMessages: false,
    canEditPrompts: false,
    canManageAgents: false,
    canViewAllClients: false,
    canExportData: true,
    canManageUsers: false,
  },
};

// Itens de navegação por role
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  permission: keyof Permissions;
  badge?: string;
}

export const allNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard', permission: 'canAccessDashboard' },
  { path: '/supervision', label: 'Supervisão IA', icon: 'MessageSquare', permission: 'canAccessSupervision' },
  { path: '/agendamentos', label: 'Agendamentos', icon: 'Calendar', permission: 'canAccessAgendamentos' },
  { path: '/funil', label: 'Funil de Leads', icon: 'Filter', permission: 'canAccessFunilLeads' },
  { path: '/leads', label: 'Leads', icon: 'Users', permission: 'canAccessLeads' },
  { path: '/status', label: 'Central de Status', icon: 'CheckCircle', permission: 'canAccessStatusCenter' },
  { path: '/follow-ups', label: 'Follow-ups', icon: 'Clock', permission: 'canAccessFollowUps' },
  { path: '/calls', label: 'Calls Realizadas', icon: 'Phone', permission: 'canAccessCalls' },
  { path: '/prompt-editor', label: 'Prompt Studio', icon: 'Wand2', permission: 'canAccessPromptEditor' },
  { path: '/validation', label: 'Testes & Qualidade', icon: 'FlaskConical', permission: 'canAccessValidation' },
  { path: '/knowledge', label: 'Base de Conhecimento', icon: 'BookOpen', permission: 'canAccessKnowledgeBase' },
  { path: '/logs', label: 'Logs de Conversa', icon: 'FileText', permission: 'canAccessLogs' },
  { path: '/notifications', label: 'Alertas', icon: 'Bell', permission: 'canAccessNotifications' },
  { path: '/configuracoes', label: 'Configurações', icon: 'Settings', permission: 'canAccessConfiguracoes' },
];

// Hook principal
export const usePermissions = () => {
  const { user } = useAuth();

  // Pegar role do user_metadata (Supabase Auth) - SEM tabela extra!
  const role = useMemo((): UserRole => {
    if (!user) return 'client';

    // 1. Tentar pegar do user_metadata (definido na criação do usuário)
    const metadataRole = user.user_metadata?.role as UserRole | undefined;
    if (metadataRole && rolePermissions[metadataRole]) {
      return metadataRole;
    }

    // 2. Verificar se é admin pelo email (fallback - lista de admins conhecidos)
    const adminEmails = [
      'ceo@marcosdaniels.com',
      'marcos@mottiv.me',
      'marcosdanielsf@gmail.com',
      'marcos@mottivme.com',
      'marcos@socialfy.me',
      'admin@mottivme.com',
      'gustavo@mottivme.com'
    ];
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return 'admin';
    }

    // 3. Verificar domínio do email (opcional - todos @mottivme.com são managers)
    if (user.email?.endsWith('@mottivme.com')) {
      return 'manager';
    }

    // 4. Default: client
    return 'client';
  }, [user]);

  // Pegar location_id do metadata (para filtrar dados do cliente)
  const locationId = useMemo(() => {
    return user?.user_metadata?.location_id as string | undefined;
  }, [user]);

  // Buscar custom_permissions do Supabase (skip para admins)
  const [customOverride, setCustomOverride] = useState<Partial<Permissions> | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !locationId || role === 'admin') {
      setCustomOverride(null);
      return;
    }

    let cancelled = false;
    setOverrideLoading(true);

    supabase
      .from('user_locations')
      .select('custom_permissions')
      .eq('user_id', user.id)
      .eq('location_id', locationId)
      .single()
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) console.error('[usePermissions] custom_permissions fetch error:', error);
          setCustomOverride(data?.custom_permissions ?? null);
          setOverrideLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id, locationId, role]);

  // Permissoes: role defaults + custom override merge
  const permissions = useMemo(() => {
    const base = rolePermissions[role];
    if (!customOverride) return base;
    return { ...base, ...customOverride } as Permissions;
  }, [role, customOverride]);

  const hasCustomPermissions = customOverride !== null;

  // Itens de navegação filtrados
  const navItems = useMemo(() => {
    return allNavItems.filter(item => permissions[item.permission]);
  }, [permissions]);

  // Helper para verificar permissão específica
  const hasPermission = (permission: keyof Permissions): boolean => {
    return permissions[permission];
  };

  // Helper para verificar se pode acessar rota
  const canAccessRoute = (path: string): boolean => {
    const item = allNavItems.find(i => i.path === path);
    if (!item) return true; // Rotas não listadas são acessíveis
    return permissions[item.permission];
  };

  return {
    role,
    locationId,
    permissions,
    navItems,
    hasPermission,
    canAccessRoute,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isClient: role === 'client',
    isRecruiter: role === 'recruiter',
    isEmployee: role === 'employee',
    overrideLoading,
    hasCustomPermissions,
  };
};

// Componente para proteger rotas
export const RequirePermission: React.FC<{
  permission: keyof Permissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
