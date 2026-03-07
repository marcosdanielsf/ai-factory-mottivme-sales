import React, { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-text-muted mb-6 max-w-md">
            {this.state.error?.message ||
              "Ocorreu um erro inesperado. Tente recarregar a pagina."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} />
            Recarregar pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
