import React from 'react';
import { DollarSign, Calculator, Phone, AlertTriangle } from 'lucide-react';
import { StatCard } from '../ui/StatCard';

interface CostOverviewCardsProps {
  totalCost: number;
  avgCostPerCall: number;
  totalCalls: number;
  breakdown: { stt: number; llm: number; tts: number; telephony: number };
  className?: string;
}

export function CostOverviewCards({
  totalCost,
  avgCostPerCall,
  totalCalls,
  breakdown,
  className = ''
}: CostOverviewCardsProps) {
  // Determinar componente mais caro
  const costComponents = [
    { name: 'STT', value: breakdown.stt },
    { name: 'LLM', value: breakdown.llm },
    { name: 'TTS', value: breakdown.tts },
    { name: 'Telephony', value: breakdown.telephony }
  ];
  
  const mostExpensive = costComponents.reduce((max, component) => 
    component.value > max.value ? component : max
  );

  // Formatar valores em USD
  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <StatCard
        value={formatCurrency(totalCost)}
        label="Custo Total"
        icon={DollarSign}
      />
      
      <StatCard
        value={formatCurrency(avgCostPerCall)}
        label="Custo Médio/Chamada"
        icon={Calculator}
      />
      
      <StatCard
        value={totalCalls}
        label="Total Chamadas"
        icon={Phone}
      />
      
      <StatCard
        value={mostExpensive.name}
        label="Componente Mais Caro"
        icon={AlertTriangle}
      />
    </div>
  );
}
