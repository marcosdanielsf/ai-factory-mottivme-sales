import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { CreateCampaignInput } from '../../../hooks/useContentCampaigns';

interface CampaignFormProps {
  onSubmit: (input: CreateCampaignInput) => Promise<void>;
  submitting: boolean;
}

const TOM_OPTIONS = ['profissional', 'casual', 'inspiracional', 'educativo', 'provocativo', 'humoristico'];
const FUNIL_OPTIONS = ['vsl', 'webinar', 'email', 'lancamento', 'perpetuo', 'high-ticket'];

export function CampaignForm({ onSubmit, submitting }: CampaignFormProps) {
  const [name, setName] = useState('');
  const [produto, setProduto] = useState('');
  const [nicho, setNicho] = useState('');
  const [avatar, setAvatar] = useState('');
  const [diferencial, setDiferencial] = useState('');
  const [tom, setTom] = useState('profissional');
  const [objetivo, setObjetivo] = useState('');
  const [ticketMedio, setTicketMedio] = useState('');
  const [tipoFunil, setTipoFunil] = useState('vsl');

  const canSubmit = name.trim() && produto.trim() && nicho.trim() && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit({
      name: name.trim(),
      briefing: {
        produto: produto.trim(),
        nicho: nicho.trim(),
        avatar_descricao: avatar.trim() || undefined,
        diferencial: diferencial.trim() || undefined,
        tom_comunicacao: tom,
        objetivo: objetivo.trim() || undefined,
        ticket_medio: ticketMedio ? Number(ticketMedio) : undefined,
        tipo_funil: tipoFunil,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome da campanha */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Nome da Campanha *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Lancamento Black Friday 2026"
          className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
        />
      </div>

      {/* Produto + Nicho (2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Produto/Servico *
          </label>
          <input
            type="text"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            placeholder="Ex: Mentoria de Reposicao Hormonal"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Nicho *
          </label>
          <input
            type="text"
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
            placeholder="Ex: Medicos de reposicao hormonal"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Descricao do Avatar/Publico-Alvo
        </label>
        <textarea
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="Ex: Medico 35-55 anos, trabalha com reposicao hormonal, quer escalar consultas..."
          rows={3}
          className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary resize-none"
        />
      </div>

      {/* Diferencial + Objetivo (2 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Diferencial
          </label>
          <input
            type="text"
            value={diferencial}
            onChange={(e) => setDiferencial(e.target.value)}
            placeholder="Ex: Unico metodo com acompanhamento por IA"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Objetivo
          </label>
          <input
            type="text"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Ex: Gerar 50 leads qualificados por semana"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* Tom + Ticket + Funil (3 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Tom de Comunicacao
          </label>
          <select
            value={tom}
            onChange={(e) => setTom(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {TOM_OPTIONS.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Ticket Medio (R$)
          </label>
          <input
            type="number"
            value={ticketMedio}
            onChange={(e) => setTicketMedio(e.target.value)}
            placeholder="Ex: 2500"
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Tipo de Funil
          </label>
          <select
            value={tipoFunil}
            onChange={(e) => setTipoFunil(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {FUNIL_OPTIONS.map((f) => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {submitting ? 'Gerando conteudo...' : 'Gerar Conteudo com IA'}
      </button>
    </form>
  );
}
