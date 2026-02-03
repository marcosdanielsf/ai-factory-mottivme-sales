import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { superAgent as initialAgent, trainers } from '../data/superAgent';
import { Member, Trainer } from '../types/rpg';
import { User, Sparkles, Zap, ScrollText, Calendar, Dumbbell, Gavel, GraduationCap, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/useToast';

// Hook para detectar breakpoints
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    setMatches(mediaQuery.matches);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Constante fora do componente - evita recriação a cada render
const AURA_CLASSES: Record<string, string> = {
  blue: 'shadow-[0_0_50px_rgba(59,130,246,0.6)] ring-4 ring-blue-500 animate-pulse',
  yellow: 'shadow-[0_0_50px_rgba(234,179,8,0.6)] ring-4 ring-yellow-500 animate-pulse',
  red: 'shadow-[0_0_50px_rgba(239,68,68,0.6)] ring-4 ring-red-500 animate-pulse',
};

// Aura classes menores para mobile
const AURA_CLASSES_MOBILE: Record<string, string> = {
  blue: 'shadow-[0_0_25px_rgba(59,130,246,0.5)] ring-2 ring-blue-500 animate-pulse',
  yellow: 'shadow-[0_0_25px_rgba(234,179,8,0.5)] ring-2 ring-yellow-500 animate-pulse',
  red: 'shadow-[0_0_25px_rgba(239,68,68,0.5)] ring-2 ring-red-500 animate-pulse',
};

const getAuraClass = (aura?: string, isMobile = false) => {
  const classes = isMobile ? AURA_CLASSES_MOBILE : AURA_CLASSES;
  return classes[aura ?? ''] ?? '';
};

export const SuperAgentRPG = () => {
  const [agent, setAgent] = useState<Member>(initialAgent);
  const [activeTrainer, setActiveTrainer] = useState<Trainer | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractData, setContractData] = useState({ clientName: '', value: '' });

  // Breakpoints responsivos
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const { showToast } = useToast();

  // Função para fechar modal e resetar dados
  const closeModal = useCallback(() => {
    setShowContractModal(false);
    setContractData({ clientName: '', value: '' });
  }, []);

  // ESC fecha o modal
  useEffect(() => {
    if (!showContractModal) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showContractModal, closeModal]);

  // Validação: campos preenchidos
  const isFormValid = contractData.clientName.trim() !== '' && contractData.value.trim() !== '';

  // Efeito de aura quando um treinador é ativado (FIX: removido incremento de level)
  useEffect(() => {
    if (activeTrainer) {
      const auraMap: Record<string, 'blue' | 'yellow' | 'red'> = {
        Law: 'blue',
        Coaching: 'yellow',
        Fitness: 'red'
      };
      const aura = auraMap[activeTrainer.specialization] || 'blue';

      setAgent(prev => ({
        ...prev,
        avatarStyle: { ...prev.avatarStyle, aura }
      }));
    } else {
      setAgent(prev => ({
        ...prev,
        avatarStyle: { ...prev.avatarStyle, aura: 'none' }
      }));
    }
  }, [activeTrainer]);

  const handleAction = useCallback((action: string) => {
    if (action === 'contract') {
      setShowContractModal(true);
    }
  }, []);

  // Memoizar posições dos trainers (cálculo trigonométrico)
  // Raio adaptativo: 250px desktop, 180px tablet
  const trainerPositions = useMemo(() => {
    const radius = isTablet ? 180 : 250;
    return trainers.map((trainer, index) => {
      const angle = (index * 360) / trainers.length;
      const radians = (angle * Math.PI) / 180;
      return {
        trainer,
        x: Math.cos(radians) * radius,
        y: Math.sin(radians) * radius,
      };
    });
  }, [isTablet]);

  return (
    <div className={`min-h-full bg-bg-primary text-text-primary relative overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bg-secondary via-bg-primary to-bg-primary pointer-events-none" />

      <header className={`relative z-10 text-center ${isMobile ? 'mb-6' : 'mb-12'}`}>
        <h1 className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600 mb-2 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
          Super Agent V4.0
        </h1>
        <p className={`text-text-muted ${isMobile ? 'text-sm' : ''}`}>Sistema de Evolução Adaptativa</p>
      </header>

      {/* ===== MOBILE VIEW (< 768px): Grid Layout ===== */}
      {isMobile && (
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 pb-32">
          {/* Central Super Agent - Mobile */}
          <div className="flex flex-col items-center">
            <div 
              className={`w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center transition-all duration-500 ${getAuraClass(agent.avatarStyle.aura, true)}`}
            >
              <User size={48} className="text-white" />
              {agent.avatarStyle.aura !== 'none' && (
                <Sparkles className="absolute -top-2 -right-2 text-white animate-spin" size={24} />
              )}
            </div>
            <div className="mt-3 text-center">
              <h2 className="text-lg font-bold">{agent.name}</h2>
              <div className="text-xs text-text-muted">
                Lvl {agent.level} • {activeTrainer ? activeTrainer.specialization + ' Mode' : 'Base Form'}
              </div>
            </div>
          </div>

          {/* Trainers Grid - Mobile */}
          <div className="w-full">
            <h3 className="text-sm font-semibold text-text-muted mb-3 text-center uppercase tracking-wider">
              ⚔️ Treinadores Disponíveis
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {trainers.map((trainer) => {
                const isActive = activeTrainer?.id === trainer.id;
                return (
                  <button
                    key={trainer.id}
                    aria-label={`Ativar ${trainer.name} - ${trainer.specialization}`}
                    aria-pressed={isActive}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 w-full text-left ${
                      isActive 
                        ? 'border-accent-primary bg-accent-primary/10 shadow-lg scale-[1.02]' 
                        : 'border-border-default bg-bg-secondary hover:bg-bg-tertiary hover:border-border-hover'
                    }`}
                    onClick={() => setActiveTrainer(isActive ? null : trainer)}
                  >
                    {/* Trainer Avatar */}
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isActive ? 'shadow-[0_0_15px_rgba(59,130,246,0.4)]' : ''
                      }`}
                      style={{ backgroundColor: trainer.avatarStyle.color }}
                    >
                      {trainer.specialization === 'Law' && <Gavel className="text-white" size={24} />}
                      {trainer.specialization === 'Fitness' && <Dumbbell className="text-white" size={24} />}
                      {trainer.specialization === 'Coaching' && <GraduationCap className="text-white" size={24} />}
                    </div>
                    
                    {/* Trainer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary">{trainer.name}</div>
                      <div className="text-xs text-text-muted">{trainer.specialization} Specialist</div>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="shrink-0">
                        <Sparkles className="text-accent-primary animate-pulse" size={20} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== DESKTOP/TABLET VIEW (>= 768px): Orbital System ===== */}
      {!isMobile && (
        <div className={`relative z-10 flex items-center justify-center ${isTablet ? 'h-[450px]' : 'h-[600px]'}`}>
          
          {/* Orbital System */}
          <div className={`relative flex items-center justify-center ${isTablet ? 'w-[450px] h-[450px]' : 'w-[600px] h-[600px]'}`}>
            
            {/* Orbit Rings */}
            <div className={`absolute border border-dashed border-border-default rounded-full animate-[spin_60s_linear_infinite] ${isTablet ? 'w-[360px] h-[360px]' : 'w-[500px] h-[500px]'}`} />
            
            {/* Central Super Agent */}
            <div className="relative z-20 flex flex-col items-center">
              <div 
                className={`rounded-full bg-orange-500 flex items-center justify-center transition-all duration-500 transform hover:scale-110 cursor-pointer ${isTablet ? 'w-24 h-24' : 'w-32 h-32'} ${getAuraClass(agent.avatarStyle.aura)}`}
              >
                <User size={isTablet ? 48 : 64} className="text-white" />
                {agent.avatarStyle.aura !== 'none' && (
                  <Sparkles className="absolute -top-4 -right-4 text-white animate-spin" size={isTablet ? 24 : 32} />
                )}
              </div>
              <div className="mt-4 text-center">
                <h2 className={`font-bold ${isTablet ? 'text-lg' : 'text-xl'}`}>{agent.name}</h2>
                <div className="text-sm text-text-muted">Lvl {agent.level} • {activeTrainer ? activeTrainer.specialization + ' Mode' : 'Base Form'}</div>
              </div>
            </div>

            {/* Trainers (Orbiting) - Posições memoizadas */}
            {trainerPositions.map(({ trainer, x, y }) => {
              const isActive = activeTrainer?.id === trainer.id;

              return (
                <div 
                  key={trainer.id}
                  role="button"
                  aria-label={`Ativar ${trainer.name} - ${trainer.specialization}`}
                  aria-pressed={isActive}
                  className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 border-2 focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 ${isTablet ? 'w-16 h-16' : 'w-20 h-20'} ${isActive ? 'border-accent-primary scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-border-default bg-bg-secondary'}`}
                  style={{ 
                    transform: `translate(${x}px, ${y}px)`,
                    backgroundColor: trainer.avatarStyle.color
                  }}
                  onClick={() => setActiveTrainer(isActive ? null : trainer)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveTrainer(isActive ? null : trainer)}
                >
                  {trainer.specialization === 'Law' && <Gavel className="text-white" size={isTablet ? 20 : 24} />}
                  {trainer.specialization === 'Fitness' && <Dumbbell className="text-white" size={isTablet ? 20 : 24} />}
                  {trainer.specialization === 'Coaching' && <GraduationCap className="text-white" size={isTablet ? 20 : 24} />}
                  
                  {/* Trainer Label */}
                  <div className={`absolute whitespace-nowrap font-medium bg-bg-tertiary px-2 py-1 rounded border border-border-default ${isTablet ? '-bottom-6 text-[10px]' : '-bottom-8 text-xs'}`}>
                    {trainer.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Control Panel - Responsivo */}
      <div className={`fixed z-30 bg-bg-secondary/95 backdrop-blur border border-border-default shadow-2xl flex items-center ${
        isMobile 
          ? 'bottom-0 left-0 right-0 rounded-t-2xl p-3 justify-around safe-area-inset-bottom' 
          : 'bottom-8 left-1/2 -translate-x-1/2 rounded-2xl p-4 gap-4'
      }`}>
        <button 
          onClick={() => handleAction('followup')}
          className={`flex flex-col items-center gap-1 rounded-lg hover:bg-bg-tertiary transition-colors ${isMobile ? 'p-2 flex-1' : 'p-3 w-24'}`}
        >
          <div className={`rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 ${isMobile ? 'w-10 h-10' : 'w-10 h-10'}`}>
            <Zap size={isMobile ? 18 : 20} />
          </div>
          <span className={`font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Follow Up</span>
        </button>

        <button 
          onClick={() => handleAction('schedule')}
          className={`flex flex-col items-center gap-1 rounded-lg hover:bg-bg-tertiary transition-colors ${isMobile ? 'p-2 flex-1' : 'p-3 w-24'}`}
        >
          <div className={`rounded-full bg-green-500/10 flex items-center justify-center text-green-500 ${isMobile ? 'w-10 h-10' : 'w-10 h-10'}`}>
            <Calendar size={isMobile ? 18 : 20} />
          </div>
          <span className={`font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Agendar</span>
        </button>

        <button 
          onClick={() => handleAction('contract')}
          className={`flex flex-col items-center gap-1 rounded-lg hover:bg-bg-tertiary transition-colors ${isMobile ? 'p-2 flex-1' : 'p-3 w-24'}`}
        >
          <div className={`rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 ${isMobile ? 'w-10 h-10' : 'w-10 h-10'}`}>
            <ScrollText size={isMobile ? 18 : 20} />
          </div>
          <span className={`font-medium ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Contrato</span>
        </button>
      </div>

      {/* Contract Modal - Responsivo */}
      {showContractModal && (
        <div 
          className={`fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm ${isMobile ? 'items-end' : 'items-center justify-center'}`}
          onClick={closeModal}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="contract-modal-title"
            className={`bg-bg-secondary border border-border-default shadow-2xl animate-in duration-200 ${
              isMobile 
                ? 'w-full rounded-t-2xl p-5 slide-in-from-bottom max-h-[85vh] overflow-y-auto' 
                : 'w-[500px] rounded-xl p-6 zoom-in-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="contract-modal-title" className={`font-bold mb-4 flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              <ScrollText className="text-purple-500" size={isMobile ? 20 : 24} />
              Gerar Contrato Inteligente
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="contract-client-name" className="block text-sm text-text-muted mb-1">Nome do Cliente</label>
                <input 
                  id="contract-client-name"
                  type="text" 
                  className={`w-full bg-bg-primary border border-border-default rounded px-3 text-sm focus:outline-none focus:border-purple-500 ${isMobile ? 'py-3' : 'py-2'}`}
                  value={contractData.clientName}
                  onChange={e => setContractData({...contractData, clientName: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="contract-value" className="block text-sm text-text-muted mb-1">Valor do Contrato</label>
                <input 
                  id="contract-value"
                  type="text" 
                  className={`w-full bg-bg-primary border border-border-default rounded px-3 text-sm focus:outline-none focus:border-purple-500 ${isMobile ? 'py-3' : 'py-2'}`}
                  value={contractData.value}
                  onChange={e => setContractData({...contractData, value: e.target.value})}
                />
              </div>
              
              <div className={`bg-bg-tertiary p-3 rounded text-text-muted font-mono ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
                {activeTrainer?.specialization === 'Law' 
                  ? '✓ Supervisão Jurídica Ativa (Dr. Lex): Cláusulas de compliance validadas.' 
                  : '⚠ Supervisão Jurídica Inativa. Recomenda-se ativar Dr. Lex.'}
              </div>

              <div className={`flex gap-2 mt-6 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
                <button 
                  onClick={closeModal}
                  className={`text-sm text-text-muted hover:text-text-primary ${isMobile ? 'py-3 w-full' : 'px-4 py-2'}`}
                >
                  Cancelar
                </button>
                <button 
                  disabled={!isFormValid}
                  className={`bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600 ${isMobile ? 'py-3 w-full' : 'px-4 py-2'}`}
                  onClick={() => {
                    showToast('Contrato gerado e enviado para assinatura!', 'success');
                    closeModal();
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
