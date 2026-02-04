import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Animated spinner */}
          <div className="relative">
            <div className="w-12 h-12 border-4 border-bg-tertiary rounded-full"></div>
            <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>

          {/* Loading text */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-text-primary text-sm font-medium">
              Verificando autenticacao...
            </span>
            <span className="text-text-muted text-xs">
              Aguarde um momento
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!user) {
    // Preserve the intended destination
    const returnUrl = location.pathname + location.search;
    const searchParams = new URLSearchParams();

    if (returnUrl && returnUrl !== '/') {
      searchParams.set('returnTo', returnUrl);
    }

    const redirectPath = searchParams.toString()
      ? `${redirectTo}?${searchParams.toString()}`
      : redirectTo;

    return <Navigate to={redirectPath} replace />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

// Higher-order component version for class components
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo: string = '/login'
) {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
