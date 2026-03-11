import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, CheckCircle, XCircle, Loader2, Mail, Lock, User } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from "../lib/getErrorMessage";

interface InviteData {
  id: string;
  location_id: string;
  email: string;
  role: string;
  expires_at: string;
  used_at: string | null;
  location_name?: string;
}

type InviteStatus = 'loading' | 'valid' | 'expired' | 'used' | 'not_found' | 'error';

export const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for signup/login
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch invite data
  useEffect(() => {
    async function fetchInvite() {
      if (!token || !isSupabaseConfigured()) {
        setStatus('error');
        setError('Configuracao invalida');
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('location_invites')
          .select(`
            *,
            ghl_locations:location_id (name)
          `)
          .eq('token', token)
          .single();

        if (queryError || !data) {
          setStatus('not_found');
          return;
        }

        // Check if already used
        if (data.used_at) {
          setStatus('used');
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setStatus('expired');
          return;
        }

        setInvite({
          ...data,
          location_name: data.ghl_locations?.name || 'Subconta',
        });
        setEmail(data.email);
        setStatus('valid');
      } catch (err) {
        console.error('Error fetching invite:', err);
        setStatus('error');
        setError('Erro ao verificar convite');
      }
    }

    fetchInvite();
  }, [token]);

  // Auto-accept if user is already logged in
  useEffect(() => {
    async function autoAccept() {
      if (user && status === 'valid' && invite) {
        await acceptInvite();
      }
    }
    autoAccept();
  }, [user, status, invite]);

  // Accept invite function
  const acceptInvite = async () => {
    if (!token) return;

    try {
      setFormLoading(true);
      const { data, error: rpcError } = await supabase.rpc('accept_invite', {
        invite_token: token,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (data?.success) {
        // Redirect to the client area
        navigate('/sales-ops');
      } else {
        setFormError(data?.error || 'Erro ao aceitar convite');
      }
    } catch (err: unknown) {
      console.error('Error accepting invite:', err);
      setFormError(getErrorMessage(err) || 'Erro ao aceitar convite');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // User created, accept invite will be triggered by useEffect
      }
    } catch (err: unknown) {
      console.error('Signup error:', err);
      setFormError(getErrorMessage(err) || 'Erro ao criar conta');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // User logged in, accept invite will be triggered by useEffect
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setFormError(getErrorMessage(err) || 'Erro ao fazer login');
    } finally {
      setFormLoading(false);
    }
  };

  // Loading state
  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent-primary mx-auto mb-4" />
          <p className="text-text-muted">Verificando convite...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (status === 'not_found' || status === 'expired' || status === 'used' || status === 'error') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-accent-error mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">
            {status === 'not_found' && 'Convite nao encontrado'}
            {status === 'expired' && 'Convite expirado'}
            {status === 'used' && 'Convite ja utilizado'}
            {status === 'error' && 'Erro ao processar convite'}
          </h1>
          <p className="text-text-muted mb-6">
            {status === 'not_found' && 'Este link de convite nao existe ou foi removido.'}
            {status === 'expired' && 'Este convite expirou. Solicite um novo convite ao administrador.'}
            {status === 'used' && 'Este convite ja foi utilizado. Faca login para acessar sua conta.'}
            {status === 'error' && error}
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  // Valid invite - show signup/login form
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-bg-tertiary border-b border-border-default p-6 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-1">
            Voce foi convidado!
          </h1>
          <p className="text-text-muted text-sm">
            Acesse a subconta <span className="text-text-primary font-medium">{invite?.location_name}</span>
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                mode === 'signup'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              Criar Conta
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                mode === 'login'
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-hover text-text-muted hover:text-text-primary'
              }`}
            >
              Ja tenho conta
            </button>
          </div>

          <form onSubmit={mode === 'signup' ? handleSignup : handleLogin}>
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-sm text-text-muted mb-1.5">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-text-muted mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-text-muted mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  placeholder="Minimo 6 caracteres"
                />
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg text-accent-error text-sm">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 bg-accent-primary text-white rounded-lg font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {mode === 'signup' ? 'Criar conta e acessar' : 'Entrar e acessar'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Invite;
