import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

// Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Provider Component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error.message);
        }

        if (mounted) {
          setState({
            user: session?.user ?? null,
            session: session,
            loading: false,
            initialized: true,
          });
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);

        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session: session,
          loading: false,
        }));

        // Handle specific events
        if (event === 'SIGNED_OUT') {
          // Clear any cached data if needed
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token was refreshed automatically
        }

        if (event === 'USER_UPDATED') {
          // User data was updated
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { error };
      }

      setState(prev => ({
        ...prev,
        user: data.user,
        session: data.session,
        loading: false,
      }));

      return { error: null };
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        error: {
          message: 'Erro inesperado ao fazer login',
          status: 500,
        } as AuthError,
      };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      setState(prev => ({ ...prev, loading: false }));

      if (error) {
        return { error };
      }

      // Note: User might need email confirmation depending on Supabase settings
      if (data.user && !data.session) {
        // Email confirmation required
        return { error: null };
      }

      return { error: null };
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }));
      return {
        error: {
          message: 'Erro inesperado ao criar conta',
          status: 500,
        } as AuthError,
      };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error.message);
      }

      setState({
        user: null,
        session: null,
        loading: false,
        initialized: true,
      });
    } catch (err) {
      console.error('Error signing out:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      return { error };
    } catch (err) {
      return {
        error: {
          message: 'Erro ao enviar email de recuperacao',
          status: 500,
        } as AuthError,
      };
    }
  }, []);

  // Memoize context value
  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [state, signIn, signUp, signOut, resetPassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Export types
export type { AuthState, AuthContextValue };
