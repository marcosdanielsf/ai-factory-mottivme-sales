import React, { useState } from 'react';
import {
  Smartphone,
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  Plus,
  LogOut,
  Trash2,
  Settings,
  Check,
  Loader2,
  Phone,
} from 'lucide-react';
import { useWhatsAppGateway, WhatsAppInstance } from '../../hooks/useWhatsAppGateway';

// ============= CONFIG PANEL =============
function ConfigPanel({ config, onSave }: {
  config: { url: string; apiKey: string };
  onSave: (config: { url: string; apiKey: string }) => void;
}) {
  const [url, setUrl] = useState(config.url);
  const [apiKey, setApiKey] = useState(config.apiKey);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={18} className="text-accent-primary" />
        <h3 className="text-text-primary font-semibold">Configurar Gateway</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-text-muted text-xs mb-1 block">URL do Gateway</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://seu-gateway.up.railway.app"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none"
          />
        </div>
        <div>
          <label className="text-text-muted text-xs mb-1 block">JARVIS API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="x-jarvis-key"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none"
          />
        </div>
        <button
          onClick={() => onSave({ url: url.replace(/\/$/, ''), apiKey })}
          disabled={!url || !apiKey}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90 transition-colors"
        >
          <Check size={14} /> Conectar
        </button>
      </div>
    </div>
  );
}

// ============= STATUS BADGE =============
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ONLINE: 'bg-green-500/20 text-green-400',
    OFFLINE: 'bg-red-500/20 text-red-400',
    RECONNECTING: 'bg-yellow-500/20 text-yellow-400',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-bg-tertiary text-text-muted'}`}>
      {status}
    </span>
  );
}

// ============= INSTANCE CARD =============
function InstanceCard({ instance, onQR, onReconnect, onLogout, onDelete, isScanning }: {
  instance: WhatsAppInstance;
  onQR: () => void;
  onReconnect: () => void;
  onLogout: () => void;
  onDelete: () => void;
  isScanning: boolean;
}) {
  const isOnline = instance.status === 'ONLINE';
  return (
    <div className={`bg-bg-secondary border rounded-lg p-4 transition-colors ${
      isOnline ? 'border-green-500/30' : 'border-border-default'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-text-muted" />}
          <span className="text-text-primary font-medium text-sm">{instance.instanceId}</span>
          <StatusBadge status={instance.status as string} />
        </div>
      </div>

      {instance.phone && (
        <div className="flex items-center gap-1.5 mb-3 text-text-secondary text-xs">
          <Phone size={12} />
          <span>{instance.phone}</span>
        </div>
      )}
      {instance.phoneAlias && (
        <p className="text-text-muted text-xs mb-3">{instance.phoneAlias}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!isOnline && (
          <button
            onClick={onQR}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white rounded-md text-xs font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
          >
            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />}
            {isScanning ? 'Aguardando...' : 'Escanear QR'}
          </button>
        )}
        {!isOnline && (
          <button
            onClick={onReconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-xs text-text-secondary hover:border-accent-primary/50 transition-colors"
          >
            <RefreshCw size={12} /> Reconectar
          </button>
        )}
        {isOnline && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-xs text-text-secondary hover:border-red-500/50 transition-colors"
          >
            <LogOut size={12} /> Desconectar
          </button>
        )}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-md text-xs text-text-muted hover:border-red-500/50 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ============= QR DISPLAY =============
function QRDisplay({ qr, instanceId, onCancel }: {
  qr: string;
  instanceId: string;
  onCancel: () => void;
}) {
  // Render QR using Google Charts API (zero dependencies)
  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=280x280&chl=${encodeURIComponent(qr)}&choe=UTF-8`;

  return (
    <div className="bg-bg-secondary border border-accent-primary/30 rounded-lg p-6 text-center max-w-sm mx-auto">
      <h3 className="text-text-primary font-semibold text-sm mb-1">Escanear QR Code</h3>
      <p className="text-text-muted text-xs mb-4">Abra o WhatsApp &gt; Aparelhos conectados &gt; {instanceId}</p>
      <div className="bg-white rounded-lg p-3 inline-block mb-4">
        <img src={qrImageUrl} alt="QR Code" width={280} height={280} />
      </div>
      <div>
        <button
          onClick={onCancel}
          className="text-text-muted text-xs hover:text-text-primary transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ============= CREATE INSTANCE MODAL =============
function CreateInstanceForm({ onSubmit, onCancel }: {
  onSubmit: (id: string, alias?: string) => void;
  onCancel: () => void;
}) {
  const [instanceId, setInstanceId] = useState('wa-01');
  const [alias, setAlias] = useState('');

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-5 max-w-sm mx-auto">
      <h3 className="text-text-primary font-semibold text-sm mb-3">Nova Instancia</h3>
      <div className="space-y-3">
        <div>
          <label className="text-text-muted text-xs mb-1 block">ID da Instancia</label>
          <select
            value={instanceId}
            onChange={e => setInstanceId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary focus:border-accent-primary outline-none"
          >
            <option value="wa-01">wa-01</option>
            <option value="wa-02">wa-02</option>
            <option value="wa-03">wa-03</option>
          </select>
        </div>
        <div>
          <label className="text-text-muted text-xs mb-1 block">Apelido (opcional)</label>
          <input
            type="text"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="Ex: MOTTIVME Principal"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(instanceId, alias || undefined)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            <Plus size={14} /> Criar
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= MAIN PAGE =============
export function WhatsAppManager() {
  const {
    config, updateConfig, isConfigured, connected,
    instances, loading, error,
    qrData, scanningInstance,
    fetchInstances, createInstance, requestQR, stopPolling,
    reconnectInstance, logoutInstance, deleteInstance,
  } = useWhatsAppGateway();

  const [showConfig, setShowConfig] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const onlineCount = instances.filter(i => i.status === 'ONLINE').length;

  // Not configured yet
  if (!isConfigured || showConfig) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-5 md:space-y-6">
        <div className="border-b border-border-default pb-4 md:pb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-text-primary">
            <Smartphone className="text-accent-primary" size={22} />
            WhatsApp Manager
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Conecte o gateway para gerenciar instancias WhatsApp
          </p>
        </div>
        <ConfigPanel
          config={config}
          onSave={cfg => { updateConfig(cfg); setShowConfig(false); }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-text-primary">
            <Smartphone className="text-accent-primary" size={22} />
            WhatsApp Manager
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            {connected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Conectado — {onlineCount}/{instances.length} online
              </span>
            ) : (
              <span className="text-red-400">Desconectado</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            <Plus size={14} /> Nova Instancia
          </button>
          <button
            onClick={fetchInstances}
            className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary/50 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary/50 transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* QR Display */}
      {qrData && (
        <QRDisplay qr={qrData.qr} instanceId={qrData.instanceId} onCancel={stopPolling} />
      )}

      {/* Create form */}
      {showCreate && (
        <CreateInstanceForm
          onSubmit={async (id, alias) => {
            await createInstance(id, alias);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Instances grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Smartphone size={32} className="mx-auto mb-3 opacity-40" />
          <p>Nenhuma instancia encontrada.</p>
          <p className="text-xs mt-1">Crie uma nova instancia para comecar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map(inst => (
            <InstanceCard
              key={inst.instanceId}
              instance={inst}
              isScanning={scanningInstance === inst.instanceId}
              onQR={() => requestQR(inst.instanceId)}
              onReconnect={() => reconnectInstance(inst.instanceId)}
              onLogout={() => logoutInstance(inst.instanceId)}
              onDelete={() => deleteInstance(inst.instanceId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default WhatsAppManager;
