import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_CLIENTS, MOCK_AGENT_VERSION, MOCK_CALLS } from '../constants';
import { MoreHorizontal, Bot, Calendar, FileText, Video, RefreshCw } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { useToast } from '../hooks/useToast';

const PropertyRow = ({ label, value, isBadge = false }: any) => (
  <div className="flex items-start py-1.5 text-sm">
    <div className="w-32 text-text-muted shrink-0">{label}</div>
    <div className={`flex-1 ${isBadge ? '' : 'text-text-primary'}`}>
      {isBadge ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          value === 'cliente' ? 'bg-accent-success/10 text-accent-success' : 'bg-text-muted/20 text-text-muted'
        }`}>
          {value}
        </span>
      ) : value}
    </div>
  </div>
);

export const ClientDetail = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const client = MOCK_CLIENTS.find(c => c.id === id) || MOCK_CLIENTS[0]; // Fallback to first for mock

  const handleRefresh = () => {
    setRefreshing(true);
    showToast('Atualizando dados do cliente...', 'info');
    setTimeout(() => {
      setRefreshing(false);
      showToast('Dados do cliente atualizados', 'success');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-10">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <span className="text-2xl">🏥</span>
             <h1 className="text-3xl font-bold">{client.empresa}</h1>
          </div>
          <button className="p-2 hover:bg-bg-secondary rounded text-text-muted transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Properties (Notion Style) */}
        <div className="border-l-2 border-border-default pl-4 ml-1">
          <PropertyRow label="Vertical" value={client.vertical} />
          <PropertyRow label="Status" value={client.status} isBadge />
          <PropertyRow label="Contato" value={client.nome} />
          <PropertyRow label="Email" value={client.email} />
          <PropertyRow label="Telefone" value={client.telefone} />
        </div>
      </div>

      <hr className="border-border-default" />

      {/* Agent Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot size={20} className="text-text-muted" />
            Agente Ativo
          </h2>
          <div className="flex gap-2">
            <Link 
              to={`/clientes/${client.id}/agente`}
              className="px-3 py-1.5 text-sm bg-bg-secondary border border-border-default rounded hover:bg-bg-hover transition-colors"
            >
              Abrir Editor
            </Link>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-sm text-text-muted">
                <span className="text-text-primary font-medium">Versão {MOCK_AGENT_VERSION.version_number}</span>
                <span className="mx-2">•</span>
                Ativo desde {new Date(MOCK_AGENT_VERSION.deployed_at || '').toLocaleDateString()}
              </div>
              <span className="bg-accent-success/10 text-accent-success text-xs px-2 py-0.5 rounded">Ativo</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <MetricCard title="Conversas" value="156" />
               <MetricCard title="Resolvidas" value="142" />
               <MetricCard title="Satisfação" value="4.8" />
               <MetricCard title="Resp. Média" value="3.2s" />
            </div>
        </div>
      </section>

      {/* Calls Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video size={20} className="text-text-muted" />
          Calls Processadas
        </h2>
        <div className="border border-border-default rounded-lg overflow-hidden">
          {MOCK_CALLS.length > 0 ? MOCK_CALLS.map(call => (
            <div key={call.id} className="flex items-center gap-4 p-4 bg-bg-secondary border-b border-border-default last:border-0 hover:bg-bg-tertiary cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded bg-bg-tertiary flex items-center justify-center text-accent-primary">
                <Video size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{call.summary}</div>
                <div className="text-xs text-text-muted capitalize">{call.duration} • {call.date}</div>
              </div>
              <div className="px-2 py-1 rounded text-xs bg-accent-success/10 text-accent-success capitalize">
                {call.status}
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-text-muted italic bg-bg-secondary">
              Nenhuma call processada recentemente.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};