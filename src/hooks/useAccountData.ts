import { useMemo } from 'react';
import { useAccount } from '../contexts/AccountContext';
import { useIsAdmin } from './useIsAdmin';

/**
 * Hook que encapsula a lógica de filtro de dados por subconta.
 *
 * - Se admin está vendo subconta (isViewingSubconta=true): filtra por selectedAccount.location_id
 * - Se admin está em modo admin (isViewingSubconta=false): não filtra (null = todos)
 * - Se cliente (não admin): filtra pela location do cliente
 *
 * @returns {Object}
 *   - activeLocationId: string | null - location_id para filtrar queries (null = todos)
 *   - isAdmin: boolean - se usuário é admin
 *   - isViewingSubconta: boolean - se está visualizando uma subconta específica
 *   - selectedAccount: Location | null - conta selecionada atualmente
 */
export function useAccountData() {
  const { selectedAccount, isViewingSubconta } = useAccount();
  const isAdmin = useIsAdmin();

  const activeLocationId = useMemo(() => {
    // Se está vendo uma subconta específica, retorna o location_id dela
    if (isViewingSubconta && selectedAccount) {
      return selectedAccount.location_id;
    }

    // Se é admin e não está vendo subconta, retorna null (todos os dados)
    if (isAdmin && !isViewingSubconta) {
      return null;
    }

    // Cliente sempre filtra pela sua própria location
    // (essa lógica será expandida quando tivermos user_locations)
    if (selectedAccount) {
      return selectedAccount.location_id;
    }

    return null;
  }, [isViewingSubconta, selectedAccount, isAdmin]);

  return {
    activeLocationId,
    isAdmin,
    isViewingSubconta,
    selectedAccount,
  };
}

export default useAccountData;
