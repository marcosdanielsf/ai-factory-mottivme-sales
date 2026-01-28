import React, { useState, useEffect } from 'react';
import { superAgent as initialAgent, trainers } from '../data/superAgent';
import { Member, Trainer } from '../types/rpg';
import { User, Sparkles, Zap, ScrollText, Calendar, Dumbbell, Gavel, GraduationCap, ArrowRight } from 'lucide-react';

export const SuperAgentRPG = () => {
  const [agent, setAgent] = useState<Member>(initialAgent);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractData, setContractData] = useState({ clientName: '', value: '' });

  // Efeito de evolução quando um treinador é ativado
  useEffect(() => {
    if (activeTrainer) {
      let aura: 'blue' | 'yellow' | 'red' = 'blue';
      if (activeTrainer.specialization === 'Law') aura = 'blue';
      if (activeTrainer.specialization === 'Coaching') aura = 'yellow';
      if (activeTrainer.specialization === 'Fitness') aura = 'red';

      setAgent(prev => ({
        ...prev,
        level: prev.level + 1,
        avatarStyle: { ...prev.avatarStyle, aura }
      }));
    } else {
      setAgent(prev => ({
        ...prev,
        avatarStyle: { ...prev.avatarStyle, aura: 'none' }
      }));
    }
  }, [activeTrainer]);

  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
    if (action === 'contract') {
      setShowContractModal(true);
    }
  };

  const getAuraClass = (aura?: string) => {
    switch (aura) {
      case 'blue': return 'shadow-[0_0_50px_rgba(59,130,246,0.6)] ring-4 ring-blue-500 animate-pulse';
      case 'yellow': return 'shadow-[0_0_50px_rgba(234,179,8,0.6)] ring-4 ring-yellow-500 animate-pulse';
      case 'red': return 'shadow-[0_0_50px_rgba(239,68,68,0.6)] ring-4 ring-red-500 animate-pulse';
      default: return '';
    }
  };

  return (
    <div className="min-h-full bg-bg-primary text-text-primary p-8 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bg-secondary via-bg-primary to-bg-primary pointer-events-none" />

      <header className="relative z-10 mb-12 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600 mb-2">
          Super Agent V4.0
        </h1>
        <p className="text-text-muted">Sistema de Evolução Adaptativa</p>
      </header>

      <div className="relative z-10 h-[600px] flex items-center justify-center">
        
        {/* Orbital System */}
        <div className="relative w-[600px] h-[600px] flex items-center justify-center">
          
          {/* Orbit Rings */}
          <div className="absolute w-[500px] h-[500px] border border-dashed border-border-default rounded-full animate-[spin_60s_linear_infinite]" />
          
          {/* Central Super Agent */}
          <div className="relative z-20 flex flex-col items-center">
            <div 
              className={`w-32 h-32 rounded-full bg-orange-500 flex items-center justify-center transition-all duration-500 transform hover:scale-110 cursor-pointer ${getAuraClass(agent.avatarStyle.aura)}`}
            >
              <User size={64} className="text-white" />
              {agent.avatarStyle.aura !== 'none' && (
                <Sparkles className="absolute -top-4 -right-4 text-white animate-spin" size={32} />
              )}
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold">{agent.name}</h2>
              <div className="text-sm text-text-muted">Lvl {agent.level} • {activeTrainer ? activeTrainer.specialization + ' Mode' : 'Base Form'}</div>
            </div>
          </div>

          {/* Trainers (Orbiting) */}
          {trainers.map((trainer, index) => {
            const angle = (index * 360) / trainers.length;
            const radius = 250; // Distance from center
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            const isActive = activeTrainer?.id === trainer.id;

            return (
              <div 
                key={trainer.id}
                className={`absolute w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 border-2 ${isActive ? 'border-accent-primary scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-border-default bg-bg-secondary'}`}
                style={{ 
                  transform: `translate(${x}px, ${y}px)`,
                  backgroundColor: trainer.avatarStyle.color
                }}
                onClick={() => setActiveTrainer(isActive ? null : trainer)}
              >
                {trainer.specialization === 'Law' && <Gavel className="text-white" />}
                {trainer.specialization === 'Fitness' && <Dumbbell className="text-white" />}
                {trainer.specialization === 'Coaching' && <GraduationCap className="text-white" />}
                
                {/* Trainer Label */}
                <div className="absolute -bottom-8 whitespace-nowrap text-xs font-medium bg-bg-tertiary px-2 py-1 rounded border border-border-default">
                  {trainer.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Control Panel */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-bg-secondary/90 backdrop-blur border border-border-default rounded-2xl p-4 shadow-2xl flex items-center gap-4">
        <button 
          onClick={() => handleAction('followup')}
          className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-bg-tertiary transition-colors w-24"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Zap size={20} />
          </div>
          <span className="text-xs font-medium">Follow Up</span>
        </button>

        <button 
          onClick={() => handleAction('schedule')}
          className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-bg-tertiary transition-colors w-24"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <Calendar size={20} />
          </div>
          <span className="text-xs font-medium">Agendar</span>
        </button>

        <button 
          onClick={() => handleAction('contract')}
          className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-bg-tertiary transition-colors w-24"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
            <ScrollText size={20} />
          </div>
          <span className="text-xs font-medium">Contrato</span>
        </button>
      </div>

      {/* Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-secondary w-[500px] border border-border-default rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ScrollText className="text-purple-500" />
              Gerar Contrato Inteligente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Nome do Cliente</label>
                <input 
                  type="text" 
                  className="w-full bg-bg-primary border border-border-default rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  value={contractData.clientName}
                  onChange={e => setContractData({...contractData, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Valor do Contrato</label>
                <input 
                  type="text" 
                  className="w-full bg-bg-primary border border-border-default rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  value={contractData.value}
                  onChange={e => setContractData({...contractData, value: e.target.value})}
                />
              </div>
              
              <div className="bg-bg-tertiary p-3 rounded text-xs text-text-muted font-mono">
                {activeTrainer?.specialization === 'Law' 
                  ? '✓ Supervisão Jurídica Ativa (Dr. Lex): Cláusulas de compliance validadas.' 
                  : '⚠ Supervisão Jurídica Inativa. Recomenda-se ativar Dr. Lex.'}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-primary"
                >
                  Cancelar
                </button>
                <button 
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center gap-2"
                  onClick={() => {
                    alert('Contrato gerado e enviado para assinatura!');
                    setShowContractModal(false);
                  }}
                >
                  Gerar e Enviar <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
