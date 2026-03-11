import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, signIn } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get return URL from query params
  const returnTo = searchParams.get('returnTo') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate(returnTo, { replace: true });
    }
  }, [user, authLoading, navigate, returnTo]);

  // Handle form submission
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      return;
    }

    if (!password) {
      setError('Por favor, insira sua senha');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email valido');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // Handle specific error messages
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login');
        } else if (signInError.message.includes('Too many requests')) {
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente');
        } else {
          setError(signInError.message || 'Erro ao fazer login');
        }
        setIsSubmitting(false);
        return;
      }

      // Success - navigation will happen via useEffect
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      setIsSubmitting(false);
    }
  }

  // Show loading if checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-primary to-accent-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-primary/20">
                <span className="text-white text-2xl font-bold">M</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-text-primary">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-text-secondary">
              Entre na sua conta para continuar
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-accent-error/10 border border-accent-error/20 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-accent-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-accent-error font-medium">
                  Erro ao fazer login
                </p>
                <p className="text-sm text-accent-error/80 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-3
                    bg-bg-secondary border rounded-lg
                    text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    ${error ? 'border-accent-error/50' : 'border-border-default hover:border-border-hover'}
                  `}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary"
                >
                  Senha
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={`
                    w-full pl-10 pr-12 py-3
                    bg-bg-secondary border rounded-lg
                    text-text-primary placeholder:text-text-muted
                    focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    ${error ? 'border-accent-error/50' : 'border-border-default hover:border-border-hover'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-3 px-4
                flex items-center justify-center gap-2
                bg-accent-primary hover:bg-accent-primary/90
                text-white font-medium rounded-lg
                focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-bg-primary
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-lg shadow-accent-primary/20 hover:shadow-xl hover:shadow-accent-primary/30
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-default"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bg-primary text-text-muted">
                ou
              </span>
            </div>
          </div>

          {/* Sign up link */}
          <p className="text-center text-text-secondary">
            Nao tem uma conta?{' '}
            <Link
              to="/signup"
              className="text-accent-primary hover:text-accent-primary/80 font-medium transition-colors"
            >
              Criar conta
            </Link>
          </p>

          {/* Back to home */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-bg-secondary via-bg-tertiary to-bg-secondary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-full">
              <div className="w-2 h-2 bg-accent-success rounded-full animate-pulse" />
              <span className="text-xs text-accent-primary font-medium">
                Sistema Online
              </span>
            </div>

            <h2 className="text-3xl font-bold text-text-primary leading-tight">
              AI Factory
              <span className="block text-accent-primary">Mottiv.me Sales</span>
            </h2>

            <p className="text-text-secondary leading-relaxed">
              Plataforma de gestao de agentes de IA para otimizacao de vendas.
              Gerencie prompts, monitore performance e impulsione seus resultados.
            </p>

            {/* Features list */}
            <ul className="space-y-3 pt-4">
              {[
                'Prompt Studio com versionamento',
                'Testes automatizados de qualidade',
                'Reflection Loop para melhoria continua',
                'Dashboard de metricas em tempo real',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-text-secondary">
                  <div className="w-5 h-5 rounded-full bg-accent-success/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-accent-success rounded-full" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
