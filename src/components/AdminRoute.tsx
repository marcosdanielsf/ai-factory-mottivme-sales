import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protege rotas administrativas
 * Só permite acesso para ceo@marcosdaniels.com
 * Outros usuários são redirecionados para a área cliente
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading, initialized } = useAuth();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  // Aguardar inicialização do auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não é admin, redireciona para área cliente
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
