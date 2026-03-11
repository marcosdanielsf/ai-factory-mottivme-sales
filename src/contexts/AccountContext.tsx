import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Location, useLocations } from "../hooks/useLocations";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

// Types
interface AccountState {
  selectedAccount: Location | null;
  isViewingSubconta: boolean; // true = viewing a client subconta (show 3 pages)
  isClientUser: boolean; // true = user has role "client" in user_locations (locked to their location)
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
const STORAGE_KEY = "selected-account";

// Context
const AccountContext = createContext<AccountContextValue | undefined>(
  undefined,
);

// Provider Component
interface AccountProviderProps {
  children: React.ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const { locations, loading: locationsLoading } = useLocations();
  const { user } = useAuth();
  const [state, setState] = useState<AccountState>({
    selectedAccount: null,
    isViewingSubconta: false,
    isClientUser: false,
    loading: true,
    initialized: false,
  });

  // Initialize account state from localStorage + user_locations
  useEffect(() => {
    let mounted = true;

    async function initializeAccount() {
      // Step 1: Check if this user has a role in user_locations (client vs admin)
      let clientLocationId: string | null = null;
      if (user?.id) {
        try {
          const { data: userLoc } = await supabase
            .from("user_locations")
            .select("location_id, role")
            .eq("user_id", user.id)
            .in("role", ["client", "employee"])
            .limit(1)
            .maybeSingle();

          if (userLoc?.location_id) {
            clientLocationId = userLoc.location_id;
          }
        } catch (err) {
          // user_locations query failed — continue to localStorage fallback
          console.warn(
            "user_locations query failed, falling back to localStorage:",
            err,
          );
        }
      }

      // Step 2: If user is a client, force their location (ignore localStorage)
      if (clientLocationId && locations.length > 0) {
        const clientLocation = locations.find(
          (loc) => loc.location_id === clientLocationId,
        );
        if (mounted) {
          if (clientLocation) {
            localStorage.setItem(STORAGE_KEY, clientLocation.location_id);
            setState({
              selectedAccount: clientLocation,
              isViewingSubconta: true,
              isClientUser: true,
              loading: false,
              initialized: true,
            });
          } else {
            // Location exists in user_locations but not in ghl_locations — fallback
            setState({
              selectedAccount: null,
              isViewingSubconta: false,
              isClientUser: true,
              loading: false,
              initialized: true,
            });
          }
        }
        return;
      }

      // Step 3: Admin user — use localStorage as before
      const storedAccountId = localStorage.getItem(STORAGE_KEY);

      if (storedAccountId && locations.length > 0) {
        const foundLocation = locations.find(
          (loc) => loc.location_id === storedAccountId,
        );

        if (mounted) {
          if (foundLocation) {
            setState({
              selectedAccount: foundLocation,
              isViewingSubconta: true,
              isClientUser: false,
              loading: false,
              initialized: true,
            });
          } else {
            localStorage.removeItem(STORAGE_KEY);
            setState({
              selectedAccount: null,
              isViewingSubconta: false,
              isClientUser: false,
              loading: false,
              initialized: true,
            });
          }
        }
      } else if (mounted) {
        setState((prev) => ({
          ...prev,
          isClientUser: false,
          loading: false,
          initialized: true,
        }));
      }
    }

    // Only initialize when locations are loaded and user is available
    if (!locationsLoading) {
      initializeAccount();
    }

    return () => {
      mounted = false;
    };
  }, [locations, locationsLoading, user?.id]);

  // Select a subconta to view (switches to client view with 3 pages)
  const selectSubconta = useCallback((location: Location) => {
    try {
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, location.location_id);

      setState((prev) => ({
        ...prev,
        selectedAccount: location,
        isViewingSubconta: true,
      }));
    } catch (err) {
      console.error("Error selecting subconta:", err);
    }
  }, []);

  // GHL Nexus integration: allow external scripts to set location via postMessage
  useEffect(() => {
    const ALLOWED_ORIGINS = [
      "https://nexus.socialfy.me",
      "https://app.socialfy.me",
      "https://app.gohighlevel.com",
      "https://app.msgsndr.com",
    ];

    const handleMessage = (event: MessageEvent) => {
      const isAllowed = ALLOWED_ORIGINS.some((origin) =>
        event.origin.startsWith(origin),
      );
      if (!isAllowed) return;

      const { type, locationId } = event.data ?? {};
      if (type !== "nexus:setLocation" || typeof locationId !== "string")
        return;

      const matched = locations.find((loc) => loc.location_id === locationId);
      if (matched) {
        selectSubconta(matched);
      } else {
        console.warn(
          "[AccountContext] nexus:setLocation — location not found:",
          locationId,
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [locations, selectSubconta]);

  // Back to admin view (shows all 24+ pages) — blocked for client users
  const backToAdmin = useCallback(() => {
    if (state.isClientUser) {
      console.warn("Client users cannot switch to admin view");
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);

      setState((prev) => ({
        ...prev,
        selectedAccount: null,
        isViewingSubconta: false,
      }));
    } catch (err) {
      console.error("Error returning to admin:", err);
    }
  }, [state.isClientUser]);

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
    [state, selectSubconta, backToAdmin, selectAccount, clearAccount],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

// Hook to use account context
export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);

  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }

  return context;
}

// Export types
export type { AccountState, AccountContextValue };
