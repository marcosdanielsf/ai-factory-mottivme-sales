import React from 'react';
import { Member } from '../../types/rpg';
import { Crown, HardHat, User, Zap } from 'lucide-react';

interface AvatarProps {
  member: Member;
  onClick: (member: Member) => void;
  isSelected?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ member, onClick, isSelected }) => {
  // Animação baseada no ID para desincronizar os movimentos
  const delay = parseInt(member.id.split('-')[1] || '0') * 0.5;
  
  const getAccessory = () => {
    switch (member.avatarStyle.accessory) {
      case 'helmet':
        return <HardHat size={20} className="text-white absolute -top-3 left-1/2 -translate-x-1/2 drop-shadow-lg" />;
      case 'crown':
        return <Crown size={20} className="text-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-lg fill-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative group cursor-pointer flex flex-col items-center gap-2 transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
      onClick={() => onClick(member)}
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Balão de Status/Nível */}
      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-tertiary px-2 py-1 rounded text-[10px] border border-border-default whitespace-nowrap z-20">
        Lvl {member.level} • {member.role}
      </div>

      {/* Avatar Container com Animação Idle */}
      <div className="relative animate-[bounce_3s_infinite]">
        {/* Corpo do Avatar */}
        <div 
          className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${isSelected ? 'ring-2 ring-white shadow-[0_0_20px_currentColor]' : ''}`}
          style={{ 
            backgroundColor: member.avatarStyle.color,
            color: member.avatarStyle.color 
          }}
        >
          <User className="text-white w-8 h-8" />
          
          {/* Acessório */}
          {getAccessory()}

          {/* Efeito de Brilho Interno */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent rounded-lg" />
        </div>

        {/* Sombra no chão */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-black/40 rounded-full blur-[2px] animate-[pulse_3s_infinite]" />
      </div>

      {/* Nome e Role */}
      <div className="text-center">
        <div className="text-xs font-bold text-text-primary">{member.name}</div>
        <div className="text-[10px] text-text-muted">{member.role}</div>
      </div>
      
      {/* Indicador de Seleção */}
      {isSelected && (
        <div className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
      )}
    </div>
  );
};
