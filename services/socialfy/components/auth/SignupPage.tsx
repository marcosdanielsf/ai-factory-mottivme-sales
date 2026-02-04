import React, { useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Input, Card } from '../UI';

interface SignupPageProps {
  onNavigateToLogin?: () => void;
}

export function SignupPage({ onNavigateToLogin }: SignupPageProps) {
  const { signUp, loading, error, clearError } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);

  const validateForm = (): boolean => {
    const errors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      errors.fullName = t('auth.required_field');
    }

    if (!email) {
      errors.email = t('auth.required_field');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('auth.invalid_email');
    }

    if (!password) {
      errors.password = t('auth.required_field');
    } else if (password.length < 6) {
      errors.password = t('auth.password_min_length');
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('auth.required_field');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('auth.passwords_not_match');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationErrors({});
    setSignupSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(email, password, fullName);
      setSignupSuccess(true);
      // Clear form
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Error is already set in AuthContext
      console.error('Signup error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t('auth.create_account')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('auth.welcome')}
          </p>
        </div>

        {signupSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                Account created successfully!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                Please check your email to verify your account.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.full_name')}
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setValidationErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="João Silva"
              disabled={loading}
              autoComplete="name"
            />
            {validationErrors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.email')}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.password')}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.confirm_password')}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? t('auth.signing_up') : t('auth.sign_up')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('auth.have_account')}{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              disabled={loading}
            >
              {t('auth.sign_in_link')}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
