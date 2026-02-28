import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Calendar, Gift, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useImobImoveis } from '../../hooks/imob/useImobImoveis';
import { useImobLeads } from '../../hooks/imob/useImobLeads';
import { useImobVisitas } from '../../hooks/imob/useImobVisitas';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const Imobiliaria: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAccount } = useAccount();
  const locationId = selectedAccount?.location_id;

  const { stats: imoveisStats } = useImobImoveis(locationId);
  const { leads } = useImobLeads(locationId);
  const { stats: visitasStats } = useImobVisitas(locationId);

  const taxaConversao = imoveisStats.total > 0
    ? Math.round((imoveisStats.vendidos / imoveisStats.total) * 100)
    : 0;

  const quickAccess = [
    {
      icon: Building2,
      label: 'Catálogo de Imóveis',
      description: `${imoveisStats.total} imóveis cadastrados`,
      sub: `${imoveisStats.disponiveis} disponíveis`,
      to: '/imobiliaria/catalogo',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      icon: Users,
      label: 'Leads Qualificados',
      description: `${leads.length} leads com perfil`,
      sub: 'Match automático com imóveis',
      to: '/imobiliaria/leads',
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      icon: Calendar,
      label: 'Visitas',
      description: `${visitasStats.agendadas} visitas agendadas`,
      sub: `${visitasStats.taxa_comparecimento}% de comparecimento`,
      to: '/imobiliaria/visitas',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      icon: Gift,
      label: 'Indicações',
      description: 'Programa de indicações',
      sub: 'Controle comissões',
      to: '/imobiliaria/indicacoes',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  const kpis = [
    {
      icon: DollarSign,
      label: 'Ticket Médio',
      value: formatCurrency(imoveisStats.valor_medio),
      color: 'text-green-400',
    },
    {
      icon: TrendingUp,
      label: 'Taxa de Conversão',
      value: `${taxaConversao}%`,
      color: 'text-blue-400',
    },
    {
      icon: Clock,
      label: 'Visitas Realizadas',
      value: String(visitasStats.realizadas),
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Imobiliária</h1>
        <p className="text-sm text-zinc-400 mt-1">Painel central do módulo imobiliário</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-zinc-700 rounded-lg">
                <Icon size={18} className={kpi.color} />
              </div>
              <div>
                <p className="text-xs text-zinc-400">{kpi.label}</p>
                <p className="text-lg font-bold text-zinc-100">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-2 gap-4">
        {quickAccess.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={`flex items-start gap-4 p-5 bg-zinc-800 border rounded-xl text-left hover:opacity-90 transition-opacity ${card.bg}`}
            >
              <div className="p-3 bg-zinc-700/50 rounded-xl">
                <Icon size={22} className={card.color} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-100">{card.label}</h3>
                <p className="text-sm text-zinc-300 mt-0.5">{card.description}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Imobiliaria;
