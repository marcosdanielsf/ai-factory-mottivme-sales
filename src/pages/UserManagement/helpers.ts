export const formatRelativeDate = (dateStr: string | null): string => {
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

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateRandomPassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};

export const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'client':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'viewer':
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
};

export const getRoleLabel = (role: string): string => {
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

export const getInitials = (email: string): string => {
  const parts = email.split('@')[0].split('.');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

export const getAvatarColor = (email: string): string => {
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'bg-blue-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-blue-500',
    'bg-indigo-500',
  ];
  return colors[hash % colors.length];
};

export const getUserStatus = (lastSignInAt: string | null): 'active' | 'inactive' | 'never' => {
  if (!lastSignInAt) return 'never';
  const daysSinceLogin = Math.floor((Date.now() - new Date(lastSignInAt).getTime()) / 86400000);
  if (daysSinceLogin <= 7) return 'active';
  return 'inactive';
};

export const getStatusBadge = (status: 'active' | 'inactive' | 'never') => {
  switch (status) {
    case 'active':
      return { icon: '🟢', label: 'Ativo', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'inactive':
      return { icon: '🟡', label: 'Inativo', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'never':
      return { icon: '⚪', label: 'Nunca logou', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  }
};

export const copyToClipboard = (text: string, setCopiedItem: (label: string | null) => void, label: string) => {
  navigator.clipboard.writeText(text);
  setCopiedItem(label);
  setTimeout(() => setCopiedItem(null), 2000);
};

export const getInviteLink = (token: string): string => {
  return `${window.location.origin}/#/invite/${token}`;
};
