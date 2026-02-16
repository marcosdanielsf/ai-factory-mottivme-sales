import React, { useState, useEffect, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import type { User, Location, PendingInvite, GroupedUser } from './types';
import { generateRandomPassword, getInviteLink } from './helpers';

// Sub-components
import {
  UsersTable,
  PendingInvites,
  CreateUserModal,
  ChangePasswordModal,
  CreateInviteModal,
  SuccessCard,
  UserDetailDrawer,
} from './components';

// Icons (only those used in header/filters/toast)
import { UsersRound, Plus, Search, ChevronDown, Filter, RefreshCw, Check, AlertCircle } from 'lucide-react';

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
  const [drawerUser, setDrawerUser] = useState<GroupedUser | null>(null);

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

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
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
    const groups: Record<string, GroupedUser> = {};
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
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <UsersRound className="w-7 h-7 text-blue-400" />
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20"
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
              className="w-full bg-bg-secondary border border-border-default rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Location Filter */}
          <div className="relative min-w-[180px]">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full bg-bg-secondary border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all"
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
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-text-muted hover:bg-bg-tertiary'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterRole === 'admin'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
      <UsersTable
        groupedUsers={groupedUsers}
        usersCount={users.length}
        loading={loading}
        expandedUsers={expandedUsers}
        openDropdown={openDropdown}
        onToggleExpand={toggleUserExpand}
        onSetOpenDropdown={setOpenDropdown}
        onOpenDrawer={setDrawerUser}
        onSelectUserForPassword={(user) => { setSelectedUser(user); setShowPasswordModal(true); }}
        onResetPassword={handleResetPassword}
        onRemoveAccess={handleRemoveAccess}
        onShowCreateModal={() => setShowCreateModal(true)}
      />

      {/* Pending Invites */}
      <PendingInvites
        pendingInvites={pendingInvites}
        invitesExpanded={invitesExpanded}
        copiedItem={copiedItem}
        onToggleExpanded={() => setInvitesExpanded(!invitesExpanded)}
        onShowInviteModal={() => setShowInviteModal(true)}
        onCopyToClipboard={handleCopyToClipboard}
      />

      {/* Modals and Drawer */}
      {showCreateModal && (
        <CreateUserModal
          newUser={newUser}
          locations={locations}
          showPassword={showPassword}
          onNewUserChange={setNewUser}
          onShowPasswordToggle={() => setShowPassword(!showPassword)}
          onCreate={handleCreateUser}
          onClose={() => { setShowCreateModal(false); setNewUser({ email: '', password: '', locationId: '', role: 'client' }); }}
        />
      )}

      {showPasswordModal && selectedUser && (
        <ChangePasswordModal
          selectedUser={selectedUser}
          newPassword={newPassword}
          showNewPassword={showNewPassword}
          copiedItem={copiedItem}
          onNewPasswordChange={setNewPassword}
          onShowNewPasswordToggle={() => setShowNewPassword(!showNewPassword)}
          onChangePassword={handleChangePassword}
          onClose={() => { setShowPasswordModal(false); setNewPassword(''); setSelectedUser(null); setShowNewPassword(false); }}
          onCopyToClipboard={handleCopyToClipboard}
        />
      )}

      {showInviteModal && (
        <CreateInviteModal
          newInvite={newInvite}
          locations={locations}
          onNewInviteChange={setNewInvite}
          onCreate={handleCreateInvite}
          onClose={() => { setShowInviteModal(false); setNewInvite({ email: '', locationId: '', role: 'client' }); }}
        />
      )}

      {showSuccessCard && createdCredentials && (
        <SuccessCard
          createdCredentials={createdCredentials}
          copiedItem={copiedItem}
          onCopyToClipboard={handleCopyToClipboard}
          onClose={() => { setShowSuccessCard(false); setCreatedCredentials(null); }}
        />
      )}

      {drawerUser && (
        <UserDetailDrawer
          drawerUser={drawerUser}
          copiedItem={copiedItem}
          onClose={() => setDrawerUser(null)}
          onCopyToClipboard={handleCopyToClipboard}
          onSelectUserForPassword={(user) => { setSelectedUser(user); setShowPasswordModal(true); setDrawerUser(null); }}
          onResetPassword={handleResetPassword}
          onRemoveAccess={(userId, locationId, email) => { handleRemoveAccess(userId, locationId, email); }}
          onRemoveAllAccess={() => {
            if (confirm(`Remover TODO o acesso de ${drawerUser.user.email}?`)) {
              Promise.all(
                drawerUser.locations.map((loc) =>
                  supabase.from('user_locations').delete().eq('user_id', drawerUser.user.user_id).eq('location_id', loc.location_id)
                )
              ).then(() => { showToast('Acesso removido completamente', 'success'); loadUsers(); setDrawerUser(null); });
            }
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
