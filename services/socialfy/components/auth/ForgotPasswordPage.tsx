import React, { useState } from 'react';
import { KeyRound, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button, Input, Card } from '../UI';

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void;
}

export function ForgotPasswordPage({ onNavigateToLogin }: ForgotPasswordPageProps) {
  const { resetPassword, loading, error, clearError } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (!email) {
      setValidationError(t('auth.required_field'));
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError(t('auth.invalid_email'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    setResetSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(email);
      setResetSuccess(true);
      setEmail('');
    } catch (err) {
      // Error is already set in AuthContext
      console.error('Password reset error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t('auth.reset_password')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {t('auth.reset_instructions')}
          </p>
        </div>

        {resetSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {t('auth.reset_success')}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                If an account exists with this email, you will receive password reset instructions.
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
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('auth.email')}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError('');
              }}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="email"
            />
            {validationError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationError}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={loading}
          >
            {loading ? t('auth.sending') : t('auth.reset_password')}
          </Button>
        </form>

        <div className="mt-6">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mx-auto"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.back_to_login')}
          </button>
        </div>
      </Card>
    </div>
  );
}
