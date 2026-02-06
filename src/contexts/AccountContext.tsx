import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Location, useLocations } from '../hooks/useLocations';

// Types
interface AccountState {
  selectedAccount: Location | null;
  isViewingSubconta: boolean; // true = viewing a client subconta (show 3 pages)
  loading: boolean;
  initialized: boolean;
}

interface AccountContextValue extends AccountState {
  selectSubconta: (location: Location) => void;
  backToAdmin: () => void;
  // Legacy aliases for backward compatibility
  selectAccount: (location: Location) => void;
  clearAccount: () => void;
}

// Constants
const STORAGE_KEY = 'selected-account';

// Context
const AccountContext = createContext<AccountContextValue | undefined>(undefined);

// Provider Component
interface AccountProviderProps {
  children: React.ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const { locations, loading: locationsLoading } = useLocations();
  const [state, setState] = useState<AccountState>({
    selectedAccount: null,
    isViewingSubconta: false,
    loading: true,
    initialized: false,
  });

  // Initialize account state from localStorage
  useEffect(() => {
    let mounted = true;

    function initializeAccount() {
      try {
        // Get stored location ID from localStorage
        const storedAccountId = localStorage.getItem(STORAGE_KEY);

        if (storedAccountId && locations.length > 0) {
          // Find the location that matches the stored ID
          const foundLocation = locations.find(
            loc => loc.location_id === storedAccountId
          );

          if (mounted) {
            if (foundLocation) {
              setState({
                selectedAccount: foundLocation,
                isViewingSubconta: true,
                loading: false,
                initialized: true,
              });
            } else {
              // Stored location no longer exists, clear it
              localStorage.removeItem(STORAGE_KEY);
              setState({
                selectedAccount: null,
                isViewingSubconta: false,
                loading: false,
                initialized: true,
              });
            }
          }
        } else if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      } catch (err) {
        console.error('Error initializing account:', err);
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      }
    }

    // Only initialize when locations are loaded
    if (!locationsLoading) {
      initializeAccount();
    }

    return () => {
      mounted = false;
    };
  }, [locations, locationsLoading]);

  // Select a subconta to view (switches to client view with 3 pages)
  const selectSubconta = useCallback((location: Location) => {
    try {
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, location.location_id);

      setState(prev => ({
        ...prev,
        selectedAccount: location,
        isViewingSubconta: true,
      }));
    } catch (err) {
      console.error('Error selecting subconta:', err);
    }
  }, []);

  // Back to admin view (shows all 24+ pages)
  const backToAdmin = useCallback(() => {
    try {
      // Remove from localStorage
      localStorage.removeItem(STORAGE_KEY);

      setState(prev => ({
        ...prev,
        selectedAccount: null,
        isViewingSubconta: false,
      }));
    } catch (err) {
      console.error('Error returning to admin:', err);
    }
  }, []);

  // Legacy aliases for backward compatibility
  const selectAccount = selectSubconta;
  const clearAccount = backToAdmin;

  // Memoize context value
  const value = useMemo<AccountContextValue>(
    () => ({
      ...state,
      selectSubconta,
      backToAdmin,
      // Legacy aliases
      selectAccount,
      clearAccount,
    }),
    [state, selectSubconta, backToAdmin, selectAccount, clearAccount]
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

// Hook to use account context
export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);

  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }

  return context;
}

// Export types
export type { AccountState, AccountContextValue };
