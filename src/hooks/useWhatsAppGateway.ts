import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export interface WhatsAppInstance {
  instanceId: string;
  status: ConnectionStatus | string;
  phone: string | null;
  phoneAlias?: string;
  hasQR?: boolean;
  lastConnectedAt?: string | null;
}

interface GatewayConfig {
  url: string;
  apiKey: string;
}

const STORAGE_KEY = 'mottivme_wa_gateway';

function getConfig(): GatewayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { url: '', apiKey: '' };
}

function saveConfig(config: GatewayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

async function gw(path: string, config: GatewayConfig, options?: RequestInit) {
  const res = await fetch(`${config.url}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-jarvis-key': config.apiKey,
      ...(options?.headers || {}),
    },
  });
  return res.json();
}

export const useWhatsAppGateway = () => {
  const [config, setConfigState] = useState<GatewayConfig>(getConfig);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [qrData, setQrData] = useState<{ instanceId: string; qr: string } | null>(null);
  const [scanningInstance, setScanningInstance] = useState<string | null>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateConfig = useCallback((newConfig: GatewayConfig) => {
    setConfigState(newConfig);
    saveConfig(newConfig);
    setConnected(false);
    setInstances([]);
  }, []);

  const isConfigured = config.url.length > 0 && config.apiKey.length > 0;

  const fetchInstances = useCallback(async () => {
    if (!isConfigured) return;
    try {
      setLoading(true);
      setError(null);
      const data = await gw('/api/wa/instances', config);
      if (data.success) {
        setInstances(data.instances || []);
        setConnected(true);
      } else {
        setError(data.error || 'Falha ao conectar');
        setConnected(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro de conexao';
      setError(msg);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [config, isConfigured]);

  const createInstance = useCallback(async (instanceId: string, phoneAlias?: string) => {
    const data = await gw('/api/wa/instances', config, {
      method: 'POST',
      body: JSON.stringify({ instanceId, phoneAlias }),
    });
    if (data.success) await fetchInstances();
    return data;
  }, [config, fetchInstances]);

  const stopPolling = useCallback(() => {
    if (qrPollRef.current) { clearInterval(qrPollRef.current); qrPollRef.current = null; }
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null; }
    setScanningInstance(null);
    setQrData(null);
  }, []);

  const requestQR = useCallback(async (instanceId: string) => {
    stopPolling();
    setScanningInstance(instanceId);
    setQrData(null);

    // Initial QR request (waits up to 15s server-side)
    const data = await gw(`/api/wa/qr/${instanceId}`, config);
    if (data.qr) {
      setQrData({ instanceId, qr: data.qr });
    }

    // Poll for QR updates every 2s
    qrPollRef.current = setInterval(async () => {
      try {
        const check = await gw(`/api/wa/qr-check/${instanceId}`, config);
        if (check.qr) setQrData({ instanceId, qr: check.qr });
        if (check.status === 'ONLINE') {
          stopPolling();
          await fetchInstances();
        }
      } catch {}
    }, 2000);

    // Poll status every 5s
    statusPollRef.current = setInterval(async () => {
      try {
        const status = await gw(`/api/wa/status/${instanceId}`, config);
        if (status.status === 'ONLINE') {
          stopPolling();
          await fetchInstances();
        }
      } catch {}
    }, 5000);
  }, [config, fetchInstances, stopPolling]);

  const reconnectInstance = useCallback(async (instanceId: string) => {
    return gw(`/api/wa/reconnect/${instanceId}`, config, { method: 'POST' });
  }, [config]);

  const logoutInstance = useCallback(async (instanceId: string) => {
    const data = await gw(`/api/wa/logout/${instanceId}`, config, { method: 'POST' });
    if (data.success) await fetchInstances();
    return data;
  }, [config, fetchInstances]);

  const deleteInstance = useCallback(async (instanceId: string) => {
    const data = await gw(`/api/wa/delete/${instanceId}`, config, { method: 'DELETE' });
    if (data.success) await fetchInstances();
    return data;
  }, [config, fetchInstances]);

  // Auto-fetch on config change
  useEffect(() => {
    if (isConfigured) fetchInstances();
  }, [isConfigured, fetchInstances]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    config,
    updateConfig,
    isConfigured,
    connected,
    instances,
    loading,
    error,
    qrData,
    scanningInstance,
    fetchInstances,
    createInstance,
    requestQR,
    stopPolling,
    reconnectInstance,
    logoutInstance,
    deleteInstance,
  };
};
