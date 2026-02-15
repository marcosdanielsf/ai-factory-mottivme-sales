import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { usePermissions } from '../hooks/usePermissions';
import {
  UsersRound,
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  Clock,
  Shield,
  AlertCircle,
  X,
  ChevronDown,
  Search,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Filter,
  Shuffle,
  ChevronRight,
} from 'lucide-react';

// ==========================================
// TYPES
// ==========================================

interface User {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  location_id: string;
  location_name: string;
  role: 'admin' | 'client' | 'viewer';
}

interface Location {
  id: string;
  name: string;
}

interface PendingInvite {
  id: string;
  email: string;
  location_id: string;
  location_name?: string;
  role: 'admin' | 'client' | 'viewer';
  expires_at: string;
  created_at: string;
  token: string;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const formatRelativeDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const generateRandomPassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'client':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'viewer':
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'client':
      return 'Cliente';
    case 'viewer':
      return 'Visualizador';
    default:
      return role;
  }
};

const getInitials = (email: string): string => {
  const parts = email.split('@')[0].split('.');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

const getAvatarColor = (email: string): string => {
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  return colors[hash % colors.length];
};

const getUserStatus = (lastSignInAt: string | null): 'active' | 'inactive' | 'never' => {
  if (!lastSignInAt) return 'never';
  const daysSinceLogin = Math.floor((Date.now() - new Date(lastSignInAt).getTime()) / 86400000);
  if (daysSinceLogin <= 7) return 'active';
  return 'inactive';
};

const getStatusBadge = (status: 'active' | 'inactive' | 'never') => {
  switch (status) {
    case 'active':
      return { icon: '🟢', label: 'Ativo', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'inactive':
      return { icon: '🟡', label: 'Inativo', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'never':
      return { icon: '⚪', label: 'Nunca logou', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const UserManagement: React.FC = () => {
  const { permissions } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'client' | 'viewer'>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [invitesExpanded, setInvitesExpanded] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [drawerUser, setDrawerUser] = useState<{ user: User; locations: Array<{ location_id: string; location_name: string; role: string }> } | null>(null);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    locationId: '',
    role: 'client' as 'admin' | 'client' | 'viewer',
  });

  const [newInvite, setNewInvite] = useState({
    email: '',
    locationId: '',
    role: 'client' as 'admin' | 'client' | 'viewer',
  });

  const [newPassword, setNewPassword] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Check permissions
  useEffect(() => {
    if (!permissions.canManageUsers) {
      window.location.hash = '/';
    }
  }, [permissions]);

  // Load data
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadLocations(),
        loadPendingInvites(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Try RPC first
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_list_users');

      if (!rpcError && rpcData) {
        setUsers(rpcData);
        return;
      }

      // Fallback: manual query
      const { data: userLocations, error: ulError } = await supabase
        .from('user_locations')
        .select(`
          user_id,
          location_id,
          role,
          created_at
        `);

      if (ulError) throw ulError;

      // Get user details from auth.users via REST API
      const userIds = [...new Set(userLocations?.map(ul => ul.user_id) || [])];
      const usersWithDetails: User[] = [];

      for (const ul of userLocations || []) {
        // Get location name
        const { data: location } = await supabase
          .from('ghl_locations')
          .select('location_name')
          .eq('id', ul.location_id)
          .single();

        usersWithDetails.push({
          user_id: ul.user_id,
          email: 'Usuário', // Placeholder - RPC function needed for email
          created_at: ul.created_at,
          last_sign_in_at: null,
          location_id: ul.location_id,
          location_name: location?.location_name || ul.location_id,
          role: ul.role,
        });
      }

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  const loadLocations = async () => {
    const { data, error } = await supabase
      .from('ghl_locations')
      .select('id, location_name')
      .order('location_name');

    if (error) throw error;
    setLocations((data || []).map(l => ({ id: String(l.id), name: l.location_name })));
  };

  const loadPendingInvites = async () => {
    const { data, error } = await supabase
      .from('location_invites')
      .select(`
        id,
        email,
        location_id,
        role,
        expires_at,
        created_at,
        token
      `)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add location names
    const invitesWithLocations = await Promise.all(
      (data || []).map(async (invite) => {
        const { data: location } = await supabase
          .from('ghl_locations')
          .select('location_name')
          .eq('id', invite.location_id)
          .single();

        return {
          ...invite,
          location_name: location?.location_name || invite.location_id,
        };
      })
    );

    setPendingInvites(invitesWithLocations);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.locationId) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    try {
      // 1. Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            role: newUser.role,
            location_id: newUser.locationId,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Insert into user_locations
      const { error: ulError } = await supabase
        .from('user_locations')
        .insert({
          user_id: authData.user.id,
          location_id: newUser.locationId,
          role: newUser.role,
        });

      if (ulError) throw ulError;

      // 3. Show success card with credentials
      setCreatedCredentials({
        email: newUser.email,
        password: newUser.password,
      });
      setShowCreateModal(false);
      setShowSuccessCard(true);

      // 4. Reload users
      await loadUsers();

      showToast('Usuário criado com sucesso', 'success');

      // Reset form
      setNewUser({
        email: '',
        password: '',
        locationId: '',
        role: 'client',
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      showToast(error.message || 'Erro ao criar usuário', 'error');
    }
  };

  const handleCreateInvite = async () => {
    if (!newInvite.email || !newInvite.locationId) {
      showToast('Preencha todos os campos', 'error');
      return;
    }

    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { data: currentUser } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('location_invites')
        .insert({
          email: newInvite.email,
          location_id: newInvite.locationId,
          role: newInvite.role,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: currentUser?.user?.id,
        });

      if (error) throw error;

      showToast('Convite criado com sucesso', 'success');
      setShowInviteModal(false);
      await loadPendingInvites();

      // Reset form
      setNewInvite({
        email: '',
        locationId: '',
        role: 'client',
      });
    } catch (error: any) {
      console.error('Error creating invite:', error);
      showToast(error.message || 'Erro ao criar convite', 'error');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      showToast('Email de reset enviado', 'success');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showToast(error.message || 'Erro ao enviar email', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      showToast('Preencha a senha', 'error');
      return;
    }

    try {
      // Call RPC to update password (requires SECURITY DEFINER function in Supabase)
      const { error } = await supabase.rpc('admin_update_password', {
        target_user_id: selectedUser.user_id,
        new_password: newPassword,
      });

      if (error) throw error;

      showToast('Senha alterada com sucesso', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Erro ao alterar senha. Verifique se a RPC admin_update_password existe.', 'error');
    }
  };

  const handleRemoveAccess = async (userId: string, locationId: string, email: string) => {
    if (!confirm(`Remover acesso de ${email}?`)) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .delete()
        .eq('user_id', userId)
        .eq('location_id', locationId);

      if (error) throw error;

      showToast('Acesso removido', 'success');
      await loadUsers();
    } catch (error: any) {
      console.error('Error removing access:', error);
      showToast(error.message || 'Erro ao remover acesso', 'error');
    }
  };

  const handleUpdateRole = async (userId: string, locationId: string, newRole: 'admin' | 'client' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('user_locations')
        .update({ role: newRole })
        .eq('user_id', userId)
        .eq('location_id', locationId);

      if (error) throw error;

      showToast('Permissão atualizada', 'success');
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      showToast(error.message || 'Erro ao atualizar permissão', 'error');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const getInviteLink = (token: string): string => {
    return `${window.location.origin}/#/invite/${token}`;
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = filterLocation === 'all' || user.location_id === filterLocation;
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesLocation && matchesRole;
    });
  }, [users, searchQuery, filterLocation, filterRole]);

  // Group users by user_id (one row per person, locations expandable)
  const groupedUsers = useMemo(() => {
    const groups: Record<string, { user: User; locations: Array<{ location_id: string; location_name: string; role: string }> }> = {};
    filteredUsers.forEach((u) => {
      if (!groups[u.user_id]) {
        groups[u.user_id] = { user: u, locations: [] };
      }
      groups[u.user_id].locations.push({
        location_id: u.location_id,
        location_name: u.location_name,
        role: u.role,
      });
    });
    return Object.values(groups);
  }, [filteredUsers]);

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!permissions.canManageUsers) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-500/10 rounded-xl">
              <UsersRound className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">Gestão de Usuários</h1>
              <p className="text-sm text-text-muted mt-0.5">
                {groupedUsers.length} {groupedUsers.length === 1 ? 'usuário' : 'usuários'}
                {searchQuery || filterLocation !== 'all' || filterRole !== 'all' ? ' (filtrado)' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Location Filter */}
          <div className="relative min-w-[180px]">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-bg-secondary border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer transition-all"
            >
              <option value="all">Todas as Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* Role Filter (Badges) */}
          <div className="flex items-center gap-2 px-3 py-1 bg-bg-secondary border border-border-default rounded-xl">
            <Filter className="w-4 h-4 text-text-muted" />
            <button
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterRole === 'all'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'text-text-muted hover:bg-bg-tertiary'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterRole === 'admin'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-text-muted hover:bg-bg-tertiary'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setFilterRole('client')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterRole === 'client'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-text-muted hover:bg-bg-tertiary'
              }`}
            >
              Cliente
            </button>
            <button
              onClick={() => setFilterRole('viewer')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterRole === 'viewer'
                  ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  : 'text-text-muted hover:bg-bg-tertiary'
              }`}
            >
              Viewer
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2.5 bg-bg-secondary border border-border-default rounded-xl hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 text-text-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl backdrop-blur-sm flex items-center gap-2 animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30 text-green-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Users Table */}
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
              {users.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado'}
            </h3>
            <p className="text-sm text-text-muted mb-6">
              {users.length === 0
                ? 'Crie o primeiro usuário para começar'
                : 'Tente ajustar os filtros de busca'}
            </p>
            {users.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl inline-flex items-center gap-2 transition-colors"
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
                        onClick={() => setDrawerUser({ user, locations: userLocations })}
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
                              onClick={(e) => { e.stopPropagation(); toggleUserExpand(user.user_id); }}
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
                                setOpenDropdown(openDropdown === dropdownId ? null : dropdownId);
                              }}
                              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="w-4 h-4 text-text-muted" />
                            </button>

                            {openDropdown === dropdownId && (
                              <div className="absolute right-0 top-full mt-1 w-56 bg-bg-secondary border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowPasswordModal(true);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-bg-tertiary flex items-center gap-3 text-text-primary transition-colors"
                                >
                                  <Key className="w-4 h-4 text-violet-400" />
                                  Alterar Senha
                                </button>
                                <button
                                  onClick={() => {
                                    handleResetPassword(user.email);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-bg-tertiary flex items-center gap-3 text-text-primary transition-colors"
                                >
                                  <Mail className="w-4 h-4 text-blue-400" />
                                  Enviar Reset por Email
                                </button>

                                <div className="border-t border-border-default mt-1"></div>

                                <button
                                  onClick={() => {
                                    handleRemoveAccess(user.user_id, user.location_id, user.email);
                                    setOpenDropdown(null);
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
                      {isExpanded && hasMultipleLocations && userLocations.map((loc) => (
                        <tr
                          key={`${user.user_id}-${loc.location_id}`}
                          className="bg-bg-tertiary/20"
                        >
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
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeClass(loc.role)}`}
                            >
                              {getRoleLabel(loc.role)}
                            </span>
                          </td>
                          <td className="px-6 py-3"></td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleRemoveAccess(user.user_id, loc.location_id, user.email)}
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

      {/* Pending Invites (Collapsible) */}
      <div className="bg-bg-secondary border border-border-default rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setInvitesExpanded(!invitesExpanded)}
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
                setShowInviteModal(true);
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
                      onClick={() => copyToClipboard(getInviteLink(invite.token), invite.id)}
                      className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 rounded-lg text-sm flex items-center gap-2 transition-colors"
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-border-default flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Criar Novo Usuário</h3>
                <p className="text-sm text-text-muted mt-0.5">Preencha os dados para criar uma nova conta</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({ email: '', password: '', locationId: '', role: 'client' });
                }}
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
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 transition-all"
                          placeholder="Digite a senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
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
                          setNewUser({ ...newUser, password: generateRandomPassword() });
                          setShowPassword(true);
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
                        onChange={(e) => setNewUser({ ...newUser, locationId: e.target.value })}
                        className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer transition-all"
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
                              ? 'border-violet-500 bg-violet-500/10'
                              : 'border-border-default hover:bg-bg-tertiary'
                          }`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            checked={newUser.role === option.value}
                            onChange={(e) =>
                              setNewUser({
                                ...newUser,
                                role: e.target.value as 'admin' | 'client' | 'viewer',
                              })
                            }
                            className="text-violet-600 focus:ring-violet-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-primary">{option.label}</p>
                            <p className="text-xs text-text-muted">{option.desc}</p>
                          </div>
                          {newUser.role === option.value && (
                            <Check className="w-4 h-4 text-violet-400 ml-auto" />
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
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({ email: '', password: '', locationId: '', role: 'client' });
                }}
                className="px-5 py-2.5 hover:bg-bg-tertiary text-text-secondary rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!newUser.email || !newUser.password || !newUser.locationId}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-violet-500/20"
              >
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-border-default">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Key className="w-5 h-5 text-violet-400" />
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
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 transition-all"
                      placeholder="Digite a nova senha"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                      setNewPassword(generateRandomPassword());
                      setShowNewPassword(true);
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
                    onClick={() => {
                      copyToClipboard(newPassword, 'new-password');
                    }}
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
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setSelectedUser(null);
                  setShowNewPassword(false);
                }}
                className="px-5 py-2.5 hover:bg-bg-tertiary text-text-secondary rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={!newPassword}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-violet-500/20"
              >
                Alterar Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invite Modal */}
      {showInviteModal && (
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
                onClick={() => {
                  setShowInviteModal(false);
                  setNewInvite({ email: '', locationId: '', role: 'client' });
                }}
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
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
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
                    onChange={(e) => setNewInvite({ ...newInvite, locationId: e.target.value })}
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
                      setNewInvite({ ...newInvite, role: e.target.value as 'admin' | 'client' | 'viewer' })
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
                onClick={() => {
                  setShowInviteModal(false);
                  setNewInvite({ email: '', locationId: '', role: 'client' });
                }}
                className="px-5 py-2.5 hover:bg-bg-tertiary text-text-secondary rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateInvite}
                disabled={!newInvite.email || !newInvite.locationId}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/20"
              >
                Criar Convite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Card */}
      {showSuccessCard && createdCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-border-default">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/20">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">Usuário Criado com Sucesso!</h3>
                  <p className="text-sm text-text-muted mt-0.5">Credenciais geradas</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">
                    Guarde estas credenciais em local seguro. Elas não serão mostradas novamente.
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-bg-tertiary border border-border-default rounded-xl p-4">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-sm text-text-primary font-mono bg-bg-secondary px-3 py-2 rounded-lg border border-border-default">
                      {createdCredentials.email}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                      className="p-2 hover:bg-bg-secondary rounded-lg transition-colors flex-shrink-0"
                      title="Copiar email"
                    >
                      {copiedItem === 'email' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-bg-tertiary border border-border-default rounded-xl p-4">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                    Senha
                  </label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-sm text-text-primary font-mono bg-bg-secondary px-3 py-2 rounded-lg border border-border-default">
                      {createdCredentials.password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.password, 'password')}
                      className="p-2 hover:bg-bg-secondary rounded-lg transition-colors flex-shrink-0"
                      title="Copiar senha"
                    >
                      {copiedItem === 'password' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const credentials = `Email: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`;
                  copyToClipboard(credentials, 'all');
                }}
                className="w-full px-4 py-3 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-violet-500/20"
              >
                {copiedItem === 'all' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Credenciais Copiadas!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Todas as Credenciais
                  </>
                )}
              </button>
            </div>

            <div className="p-6 border-t border-border-default">
              <button
                onClick={() => {
                  setShowSuccessCard(false);
                  setCreatedCredentials(null);
                }}
                className="w-full px-5 py-3 bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/20"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Detail Drawer */}
      {drawerUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerUser(null)}
          />
          <div className="relative w-full max-w-md bg-bg-secondary border-l border-border-default shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-bg-secondary border-b border-border-default p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">Detalhes do Usuário</h3>
                <button
                  onClick={() => setDrawerUser(null)}
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
                      onClick={() => copyToClipboard(drawerUser.user.user_id, 'uid')}
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
                          handleRemoveAccess(drawerUser.user.user_id, loc.location_id, drawerUser.user.email);
                          if (drawerUser.locations.length <= 1) setDrawerUser(null);
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
                    onClick={() => {
                      setSelectedUser(drawerUser.user);
                      setShowPasswordModal(true);
                      setDrawerUser(null);
                    }}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border-default rounded-xl text-sm text-text-primary hover:bg-bg-primary flex items-center gap-3 transition-colors"
                  >
                    <Key className="w-4 h-4 text-violet-400" />
                    Alterar Senha
                  </button>
                  <button
                    onClick={() => {
                      handleResetPassword(drawerUser.user.email);
                    }}
                    className="w-full px-4 py-3 bg-bg-tertiary border border-border-default rounded-xl text-sm text-text-primary hover:bg-bg-primary flex items-center gap-3 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-blue-400" />
                    Enviar Reset por Email
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover TODO o acesso de ${drawerUser.user.email}?`)) {
                        Promise.all(
                          drawerUser.locations.map((loc) =>
                            supabase
                              .from('user_locations')
                              .delete()
                              .eq('user_id', drawerUser.user.user_id)
                              .eq('location_id', loc.location_id)
                          )
                        ).then(() => {
                          showToast('Acesso removido completamente', 'success');
                          loadUsers();
                          setDrawerUser(null);
                        });
                      }
                    }}
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
      )}
    </div>
  );
};

export default UserManagement;
