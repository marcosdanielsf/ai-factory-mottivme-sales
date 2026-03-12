import React from "react";
import {
  DollarSign,
  Eye,
  MousePointerClick,
  MessageSquare,
  MessageCircle,
  Calendar,
  UserCheck,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "../helpers";

interface FunnelTotals {
  gasto: number;
  impressoes: number;
  cliques: number;
  mensagens: number;
  responderam: number;
  agendaram: number;
  compareceram: number;
  fecharam: number;
}

interface ClientFunnelProps {
  totals: FunnelTotals;
  loading: boolean;
}

const stages = [
  {
    key: "gasto" as const,
    label: "Investido",
    format: formatCurrency,
    icon: DollarSign,
  },
  {
    key: "impressoes" as const,
    label: "Impressoes",
    format: formatNumber,
    icon: Eye,
  },
  {
    key: "cliques" as const,
    label: "Cliques",
    format: formatNumber,
    icon: MousePointerClick,
  },
  {
    key: "mensagens" as const,
    label: "Mensagens",
    format: formatNumber,
    icon: MessageSquare,
  },
  {
    key: "responderam" as const,
    label: "Respondeu",
    format: formatNumber,
    icon: MessageCircle,
  },
  {
    key: "agendaram" as const,
    label: "Agendou",
    format: formatNumber,
    icon: Calendar,
  },
  {
    key: "compareceram" as const,
    label: "Compareceu",
    format: formatNumber,
    icon: UserCheck,
  },
  {
    key: "fecharam" as const,
    label: "Fechou",
    format: formatNumber,
    icon: CheckCircle,
  },
];

const SkeletonFunnel = () => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
    <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse mb-6" />
    <div className="flex flex-wrap gap-2">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-20 w-24 bg-zinc-800 rounded-lg animate-pulse" />
          {i < 7 && (
            <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
          )}
        </div>
      ))}
    </div>
  </div>
);

export const ClientFunnel: React.FC<ClientFunnelProps> = ({
  totals,
  loading,
}) => {
  if (loading) return <SkeletonFunnel />;

  const getConversionRate = (
    current: number,
    previous: number,
  ): string | null => {
    if (previous <= 0) return null;
    return formatPercent((current / previous) * 100);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-base font-semibold text-white mb-6">
        Funil de Conversao
      </h2>
      <div className="flex flex-wrap items-center gap-1">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const value = totals[stage.key];
          const prevValue = idx > 0 ? totals[stages[idx - 1].key] : null;
          const convRate =
            prevValue !== null ? getConversionRate(value, prevValue) : null;

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                {convRate && (
                  <span className="text-xs text-zinc-500 h-4">{convRate}</span>
                )}
                {!convRate && <div className="h-4" />}
                <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 flex flex-col items-center gap-1.5 w-full">
                  <Icon size={16} className="text-blue-400" />
                  <span className="text-xs text-zinc-400 text-center leading-tight">
                    {stage.label}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {stage.format(value)}
                  </span>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <ChevronRight
                  size={14}
                  className="text-zinc-600 flex-shrink-0 mt-4"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
