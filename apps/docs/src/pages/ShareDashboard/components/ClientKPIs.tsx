import React from "react";
import { DollarSign, Target, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency } from "../helpers";

interface KPIs {
  investido: number;
  cpl: number | null;
  cpa: number | null;
  roas: number;
}

interface ClientKPIsProps {
  kpis: KPIs;
  loading: boolean;
}

const SkeletonCard = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-3">
    <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
    <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
    <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
  </div>
);

export const ClientKPIs: React.FC<ClientKPIsProps> = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Valor Investido",
      value: formatCurrency(kpis.investido),
      icon: DollarSign,
      accent: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "CPL",
      value: formatCurrency(kpis.cpl ?? 0),
      icon: Target,
      accent: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "CPA",
      value: formatCurrency(kpis.cpa ?? 0),
      icon: Calendar,
      accent: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "ROAS",
      value: `${kpis.roas.toFixed(1)}x`,
      icon: TrendingUp,
      accent: kpis.roas >= 1 ? "text-green-400" : "text-red-400",
      bg: kpis.roas >= 1 ? "bg-green-400/10" : "bg-red-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon size={16} className={card.accent} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${card.accent}`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
