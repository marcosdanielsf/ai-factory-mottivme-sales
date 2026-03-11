import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, auth } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'owner' | 'admin' | 'member';
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  tenant: Tenant | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, companyName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// HELPER: Generate slug from name
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH USER PROFILE AND TENANT
  // ============================================

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch tenant directly - it's created automatically by trigger on signup
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (tenantError) {
        console.warn('Tenant not found:', tenantError.message);
        // Tenant might not exist yet (first login after signup)
        // The trigger should create it, but there might be a delay
        return;
      }

      if (tenantData) {
        // Map tenant data to our Tenant interface
        // Note: tabela usa 'name' e 'plan_tier' ao invés de 'company_name' e 'plan'
        setTenant({
          id: tenantData.id,
          name: tenantData.name || tenantData.company_name || 'Minha Empresa',
          slug: tenantData.slug || '',
          plan: (tenantData.plan_tier || tenantData.plan || 'free') as 'free' | 'starter' | 'pro' | 'enterprise',
          settings: tenantData.settings || {},
          created_at: tenantData.created_at,
          updated_at: tenantData.updated_at,
        } as Tenant);

        // Create a virtual profile from tenant + auth user
        setProfile({
          id: userId,
          tenant_id: tenantData.id,
          email: '', // Will be filled from user object
          full_name: tenantData.name || tenantData.company_name || '',
          role: 'owner',
          settings: {},
          created_at: tenantData.created_at,
          updated_at: tenantData.updated_at,
        } as UserProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  // ============================================
  // INITIALIZE AUTH
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing...');
        
        // Get session with timeout fallback (não bloqueia se demorar)
        let currentSession = null;
        try {
          const { session } = await Promise.race([
            auth.getSession(),
            new Promise<{ session: null }>((resolve) => 
              setTimeout(() => resolve({ session: null }), 3000)
            )
          ]);
          currentSession = session;
        } catch (sessionErr) {
          console.warn('[Auth] Session fetch failed:', sessionErr);
        }
        
        if (!isMounted) return;
        
        console.log('[Auth] Session:', currentSession ? 'found' : 'none');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          try {
            await fetchUserProfile(currentSession.user.id);
          } catch (profileErr) {
            console.warn('[Auth] Profile fetch failed:', profileErr);
            // Continue even if profile fails
          }
        }
      } catch (err) {
        console.error('[Auth] Error initializing:', err);
        // Set user to null on error so the app shows login
        if (isMounted) {
          setUser(null);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          console.log('[Auth] Loading complete');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      
      console.log('[Auth] State changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await fetchUserProfile(session.user.id);
        } catch (err) {
          console.warn('[Auth] Profile fetch failed on state change:', err);
        }
      } else {
        setProfile(null);
        setTenant(null);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ============================================
  // SIGN IN
  // ============================================

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: signInError } = await auth.signIn(email, password);
      if (signInError) throw signInError;
    } catch (err: any) {
      const message = translateAuthError(err.message);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SIGN UP (with tenant creation)
  // ============================================

  const signUp = async (email: string, password: string, fullName: string, companyName?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create user in Supabase Auth
      // The trigger 'handle_new_user' will automatically create the tenant
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName || `${fullName}'s Workspace`,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Falha ao criar usuário');

      // Note: Tenant is created automatically by the database trigger
      // We just need to wait for the auth state change to fetch it

    } catch (err: any) {
      const message = translateAuthError(err.message);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SIGN OUT
  // ============================================

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: signOutError } = await auth.signOut();
      if (signOutError) throw signOutError;
      
      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setTenant(null);
    } catch (err: any) {
      setError(err.message || 'Falha ao sair');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RESET PASSWORD
  // ============================================

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: resetError } = await auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
    } catch (err: any) {
      const message = translateAuthError(err.message);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CLEAR ERROR
  // ============================================

  const clearError = () => {
    setError(null);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tenant,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// HELPERS
// ============================================

function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este email já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
    'Invalid email or password': 'Email ou senha inválidos',
  };

  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return message;
}

export default AuthContext;
