import React, { useState, useEffect, useCallback } from 'react';
import { createSquadFromConfig } from '../data/squads';
import { Member, Squad } from '../types/rpg';
import { Client } from '../types';
import { Avatar } from '../components/RPG/Avatar';
import { SkillMenu } from '../components/RPG/SkillMenu';
import { ClientRanking } from '../components/RPG/ClientRanking';
import { Layers, Shield, Sword, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { ClientService, AgentService } from '../services/dataService';
import { useToast } from '../hooks/useToast';

export const TeamRPG = () => {
  const { showToast } = useToast();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) showToast('Atualizando Squads...', 'info');
    setIsLoading(true);
    try {
      const clientsData = await ClientService.getAll();
      setClients(clientsData);

      const loadedSquads = await Promise.all(
        clientsData.map(async (client) => {
          const config = await AgentService.getConfig(client.id);
          return createSquadFromConfig(
            client.id, 
            client.nome, 
            client.vertical, 
            client.empresa, 
            config
          );
        })
      );
      setSquads(loadedSquads);
      if (isRefresh) showToast('Squads atualizados com sucesso', 'success');
    } catch (error) {
      console.error('Failed to load squads:', error);
      showToast('Erro ao carregar squads', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMemberClick = (member: Member) => {
    setSelectedMember(selectedMember?.id === member.id ? null : member);
  };

  const handleUpdatePrompt = (memberId: string, skillId: string, newContent: string) => {
    setSquads(currentSquads => 
      currentSquads.map(squad => ({
        ...squad,
        members: squad.members.map(member => {
          if (member.id === memberId) {
            return {
              ...member,
              skills: member.skills.map(skill => 
                skill.id === skillId ? { ...skill, content: newContent } : skill
              )
            };
          }
          return member;
        })
      }))
    );
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedMember(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-accent-primary" size={48} />
          <p className="text-text-muted">Carregando Squads do Supabase...</p>
        </div>
      </div>
    );
  }

  // Se nenhum cliente selecionado, mostra o Ranking
  if (!selectedClient) {
    return (
      <div className="p-8 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-secondary via-bg-primary to-bg-primary">
         <div className="flex justify-end mb-4">
           <button 
             onClick={() => loadData(true)}
             disabled={isLoading}
             className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50"
             title="Atualizar ranking e squads"
           >
             <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
           </button>
         </div>
         <ClientRanking 
            clients={clients} 
            onSelectClient={setSelectedClient} 
         />
      </div>
    );
  }

  // View de Detalhes do Cliente (Squads)
  const clientSquads = squads.filter(s => s.clientId === selectedClient.id);

  return (
    <div 
      className="p-8 min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-bg-secondary via-bg-primary to-bg-primary"
      onClick={handleBackgroundClick}
    >
      {/* Header com botão de voltar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedClient(null)}
            className="p-2 hover:bg-bg-secondary rounded-full transition-colors border border-transparent hover:border-border-default text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Sword className="text-accent-primary" />
              Squads: {selectedClient.empresa}
            </h1>
            <p className="text-text-muted">Gerenciamento tático de agentes.</p>
          </div>
        </div>

        <button 
          onClick={() => loadData(true)}
          disabled={isLoading}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary border border-border-default rounded-lg transition-all active:scale-95 disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
          title="Atualizar squad"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
          {clientSquads.length > 0 ? (
            clientSquads.map((squad) => (
              <div key={squad.id} className="mt-6">
                 {/* Título do Squad */}
                <div className="flex items-center gap-3 mb-4 pl-2 border-l-2 border-accent-primary/50">
                  <Layers className="text-text-muted" size={16} />
                  <div>
                    <h4 className="text-md font-bold text-text-primary">{squad.name}</h4>
                    <p className="text-xs text-text-muted">{squad.description}</p>
                  </div>
                </div>

                {/* Área do Squad (Cenário) */}
                <div className="bg-bg-primary/50 border border-border-default rounded-xl p-8 relative overflow-visible min-h-[300px] flex items-end gap-12 overflow-x-auto pb-12 shadow-inner">
                  {/* Grid Background Effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  
                  {/* Floor Effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                  {squad.members.map((member) => (
                    <div key={member.id} className="relative flex-shrink-0 group/avatar-container z-10">
                      <Avatar 
                        member={member} 
                        onClick={(m) => {
                          // Stop propagation handled by logic
                          handleMemberClick(m);
                        }}
                        isSelected={selectedMember?.id === member.id}
                      />

                      {/* Conector Visual entre membros */}
                      <div className="hidden group-last/avatar-container:hidden absolute top-1/2 -right-6 w-6 h-0.5 bg-border-default/20" />

                      {/* Modal de Skills */}
                      {selectedMember?.id === member.id && (
                        <SkillMenu 
                          member={member} 
                          onClose={() => setSelectedMember(null)}
                          onUpdatePrompt={handleUpdatePrompt}
                        />
                      )}
                    </div>
                  ))}

                  {/* Área do Engenheiro/Gestor (Especial) */}
                  <div className="absolute top-4 right-4 flex gap-4">
                     <div className="flex items-center gap-2 text-[10px] text-text-muted bg-bg-primary/80 px-2 py-1 rounded border border-border-default backdrop-blur-sm">
                        <Shield size={12} className="text-accent-success" />
                        Monitoramento Ativo
                     </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-text-muted italic border border-dashed border-border-default rounded-xl">
              Nenhum squad designado para este responsável ainda.
            </div>
          )}
      </div>
    </div>
  );
};
