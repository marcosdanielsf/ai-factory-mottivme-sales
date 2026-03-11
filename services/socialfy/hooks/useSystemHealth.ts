/**
 * Hook para verificar saúde do sistema AgenticOS
 * Endpoint: GET /health
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_AGENTICOS_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

// ============================================
// TYPES
// ============================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface SystemHealth {
  status: HealthStatus;
  latency: number; // ms
  lastChecked: Date;
  details?: {
    database?: boolean;
    redis?: boolean;
    instagram?: boolean;
    queue?: boolean;
  };
  message?: string;
}

export interface UseSystemHealthReturn {
  health: SystemHealth;
  loading: boolean;
  error: string | null;
  checkHealth: () => Promise<void>;
}

// ============================================
// HOOK: useSystemHealth
// ============================================

export function useSystemHealth(
  pollInterval: number = 30000, // 30 seconds default
  autoStart: boolean = true
): UseSystemHealthReturn {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'unknown',
    latency: 0,
    lastChecked: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Verifica saúde do sistema
   */
  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);
      const now = new Date();

      if (!response.ok) {
        // API responded but with error status
        setHealth({
          status: 'degraded',
          latency,
          lastChecked: now,
          message: `API returned ${response.status}`,
        });
        return;
      }

      const data = await response.json();

      // Normalize health status
      let status: HealthStatus = 'healthy';

      if (data.status === 'unhealthy' || data.status === 'error') {
        status = 'unhealthy';
      } else if (data.status === 'degraded' || data.status === 'warning') {
        status = 'degraded';
      } else if (data.status === 'healthy' || data.status === 'ok' || data.status === 'running') {
        status = 'healthy';
      }

      // Parse details if available
      const details = data.details || data.services || undefined;

      setHealth({
        status,
        latency,
        lastChecked: now,
        details: details ? {
          database: details.database ?? details.db ?? true,
          redis: details.redis ?? details.cache ?? true,
          instagram: details.instagram ?? true,
          queue: details.queue ?? details.worker ?? true,
        } : undefined,
        message: data.message || undefined,
      });

    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      const now = new Date();

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Health check timeout');
          setHealth({
            status: 'unhealthy',
            latency,
            lastChecked: now,
            message: 'Connection timeout',
          });
        } else {
          setError(err.message);
          setHealth({
            status: 'unhealthy',
            latency,
            lastChecked: now,
            message: err.message,
          });
        }
      } else {
        setError('Unknown error');
        setHealth({
          status: 'unknown',
          latency,
          lastChecked: now,
        });
      }

      console.error('useSystemHealth error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-start polling
  useEffect(() => {
    if (autoStart) {
      // Initial check
      checkHealth();

      // Set up polling interval
      if (pollInterval > 0) {
        intervalRef.current = setInterval(checkHealth, pollInterval);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, pollInterval, checkHealth]);

  return {
    health,
    loading,
    error,
    checkHealth,
  };
}

// ============================================
// HELPERS
// ============================================

export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-amber-500';
    case 'unhealthy':
      return 'bg-red-500';
    default:
      return 'bg-slate-400';
  }
}

export function getHealthStatusText(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Sistema Operacional';
    case 'degraded':
      return 'Performance Reduzida';
    case 'unhealthy':
      return 'Sistema Indisponível';
    default:
      return 'Verificando...';
  }
}

export default useSystemHealth;
