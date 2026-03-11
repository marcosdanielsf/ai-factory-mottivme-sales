import { HelpCircle, Zap, Shield, TrendingUp } from 'lucide-react';

interface Persona {
  id: string;
  label: string;
  icon: React.ReactNode;
  message: string;
  color: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'curious',
    label: 'Curioso',
    icon: <HelpCircle size={14} />,
    message: 'Oi, vi algo sobre vocês nas redes sociais. Como funciona?',
    color: 'text-blue-400 hover:bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'urgent',
    label: 'Urgente',
    icon: <Zap size={14} />,
    message: 'Preciso resolver isso HOJE. Vocês conseguem me atender agora?',
    color: 'text-yellow-400 hover:bg-yellow-500/10 border-yellow-500/20',
  },
  {
    id: 'resistant',
    label: 'Resistente',
    icon: <Shield size={14} />,
    message: 'Não sei não... já tentei outras coisas antes e não funcionou.',
    color: 'text-red-400 hover:bg-red-500/10 border-red-500/20',
  },
  {
    id: 'investor',
    label: 'Investidor',
    icon: <TrendingUp size={14} />,
    message: 'Quanto de retorno posso esperar? Qual é o ROI médio de quem contrata?',
    color: 'text-green-400 hover:bg-green-500/10 border-green-500/20',
  },
];

interface SandboxPersonaSelectorProps {
  onSelect: (message: string) => void;
  selectedPersona: string | null;
}

export function SandboxPersonaSelector({ onSelect, selectedPersona }: SandboxPersonaSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-700 bg-zinc-900/50 overflow-x-auto shrink-0">
      <span className="text-[10px] text-zinc-500 whitespace-nowrap mr-1">Persona:</span>
      {PERSONAS.map(persona => (
        <button
          key={persona.id}
          onClick={() => onSelect(persona.message)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors whitespace-nowrap ${
            selectedPersona === persona.id
              ? persona.color + ' bg-opacity-20'
              : `${persona.color} border-zinc-700`
          }`}
          title={persona.message}
        >
          {persona.icon}
          {persona.label}
        </button>
      ))}
    </div>
  );
}
