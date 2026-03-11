import React, { useState } from 'react';
import { Member, Skill } from '../../types/rpg';
import { X, Edit3, Calendar, Target, Activity, MessageSquare, Terminal, Save, Zap } from 'lucide-react';

interface SkillMenuProps {
  member: Member;
  onClose: () => void;
  onUpdatePrompt: (memberId: string, skillId: string, newContent: string) => void;
}

export const SkillMenu: React.FC<SkillMenuProps> = ({ member, onClose, onUpdatePrompt }) => {
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [promptText, setPromptText] = useState('');

  const getIcon = (type: string) => {
    switch (type) {
      case 'prompt': return <Terminal className="text-accent-primary" />;
      case 'action': return <Zap className="text-accent-warning" />;
      case 'passive': return <Activity className="text-accent-success" />;
      default: return <Target />;
    }
  };

  const handleSkillClick = (skill: Skill) => {
    if (skill.type === 'prompt') {
      setEditingSkill(skill);
      setPromptText(skill.content || '');
    }
  };

  const handleSavePrompt = () => {
    if (editingSkill) {
      onUpdatePrompt(member.id, editingSkill.id, promptText);
      setEditingSkill(null);
    }
  };

  if (editingSkill) {
    return (
      <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-96 bg-bg-secondary border border-border-default rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-accent-primary" />
            <h3 className="font-medium text-text-primary">Editor de Prompt</h3>
          </div>
          <button onClick={() => setEditingSkill(null)} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className="w-full h-48 bg-bg-primary border border-border-default rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-accent-primary font-mono resize-none mb-4"
          placeholder="Digite o prompt do agente..."
        />

        <div className="flex justify-end gap-2">
          <button 
            onClick={() => setEditingSkill(null)}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSavePrompt}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            <Save size={12} />
            Salvar Prompt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-64 bg-bg-secondary border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="p-3 border-b border-border-default bg-bg-tertiary flex items-center justify-between">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Skills de {member.name}</span>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X size={14} />
        </button>
      </div>
      
      <div className="p-2 space-y-1">
        {member.skills.map((skill) => (
          <button
            key={skill.id}
            onClick={() => handleSkillClick(skill)}
            className={`w-full text-left p-2 rounded-lg flex items-start gap-3 transition-colors ${
              skill.type === 'prompt' 
                ? 'bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/20' 
                : 'hover:bg-bg-tertiary'
            }`}
          >
            <div className="mt-0.5">
              {getIcon(skill.type)}
            </div>
            <div>
              <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                {skill.name}
                {skill.type === 'prompt' && <Edit3 size={10} className="text-text-muted" />}
              </div>
              <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                {skill.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};


