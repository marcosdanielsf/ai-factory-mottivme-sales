import React from 'react';
import { Layout } from './Layout';
import { LayoutCliente } from './LayoutCliente';
import { useAccount } from '../contexts/AccountContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * ConditionalLayout - Escolhe automaticamente entre Layout e LayoutCliente
 *
 * Regras:
 * - Admin SEM subconta selecionada = Layout completo (24+ páginas)
 * - Admin COM subconta selecionada = LayoutCliente (3 páginas)
 * - Cliente = LayoutCliente (3 páginas)
 */
export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const isAdmin = useIsAdmin();
  const { isViewingSubconta } = useAccount();

  // Admin viewing subconta OR non-admin user = client layout
  if (isViewingSubconta || !isAdmin) {
    return <LayoutCliente>{children}</LayoutCliente>;
  }

  // Admin in admin mode = full layout
  return <Layout>{children}</Layout>;
};

export default ConditionalLayout;
