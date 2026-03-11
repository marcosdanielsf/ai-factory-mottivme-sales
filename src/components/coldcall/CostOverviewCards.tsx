import React from "react";
import {
  DollarSign,
  Calculator,
  Phone,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface CostOverviewCardsProps {
  totalCost: number;
  avgCostPerCall: number;
  totalCalls: number;
  breakdown: { stt: number; llm: number; tts: number; telephony: number };
  className?: string;
}

// Taxa de conversão USD → BRL (fixo)
const USD_TO_BRL = 5.5;

export function CostOverviewCards({
  totalCost,
  avgCostPerCall,
  totalCalls,
  breakdown,
  className = "",
}: CostOverviewCardsProps) {
  // Determinar componente mais caro
  const costComponents = [
    { name: "STT", value: breakdown.stt },
    { name: "LLM", value: breakdown.llm },
    { name: "TTS", value: breakdown.tts },
    { name: "Telephony", value: breakdown.telephony },
  ];

  const mostExpensive = costComponents.reduce((max, component) =>
    component.value > max.value ? component : max,
  );

  // Formatar valores em USD e BRL
  const formatUSD = (value: number) => `$${value.toFixed(2)}`;
  const formatBRL = (value: number) => `R$${(value * USD_TO_BRL).toFixed(2)}`;
  const formatUSDDetail = (value: number) => `$${value.toFixed(4)}`;

  // Calcular trend (mock - pode ser implementado com dados históricos futuros)
  const trend =
    totalCalls > 10 ? { direction: "down" as "up" | "down", value: 8.3 } : null;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 ${className}`}
    >
      {/* Custo Total - USD + BRL */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.07] hover:border-purple-400/30">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
            <DollarSign size={20} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                trend.direction === "up"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-400/10 text-red-400"
              }`}
            >
              {trend.direction === "up" ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatUSD(totalCost)}
          </p>
          <p className="text-sm text-gray-400">{formatBRL(totalCost)}</p>
          <p className="text-xs text-gray-400 mt-1">Custo Total</p>
        </div>
      </div>

      {/* Custo Médio/Chamada - USD + BRL */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.07] hover:border-purple-400/30">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
            <Calculator size={20} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatUSDDetail(avgCostPerCall)}
          </p>
          <p className="text-sm text-gray-400">
            R${(avgCostPerCall * USD_TO_BRL).toFixed(4)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Custo Médio/Chamada</p>
        </div>
      </div>

      {/* Total Chamadas */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.07] hover:border-purple-400/30">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
            <Phone size={20} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-white mb-1">{totalCalls}</p>
          <p className="text-xs text-gray-400 mt-1">Total Chamadas</p>
        </div>
      </div>

      {/* Componente Mais Caro - Nome + Valor */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-200 hover:bg-white/[0.07] hover:border-red-400/30">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-red-400/20 rounded-lg flex items-center justify-center text-red-400">
            <AlertTriangle size={20} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-white mb-1">
            {mostExpensive.name}
          </p>
          <p className="text-sm text-red-400 font-medium">
            {formatUSDDetail(mostExpensive.value)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Componente Mais Caro</p>
        </div>
      </div>
    </div>
  );
}
