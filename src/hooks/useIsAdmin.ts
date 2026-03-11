import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAILS = [
  'ceo@marcosdaniels.com',
  'marcos@mottiv.me',
  'marcosdanielsf@gmail.com'
];

/**
 * Hook para verificar se o usuário logado é administrador
 * Admin tem acesso à área administrativa completa (24 páginas)
 * Clientes veem apenas: Sales Ops, Agendamentos, Central de Status
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();

  if (!user?.email) {
    return false;
  }

  const userEmail = user.email.toLowerCase().trim();
  return ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
}

export default useIsAdmin;
