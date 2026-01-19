export type SkillType = 'prompt' | 'action' | 'passive';

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  content?: string; // Para prompts editáveis
  icon?: string;
}

export type MemberRole = 
  | 'SDR' 
  | 'Social Seller' 
  | 'Rescheduler' 
  | 'Engagement Keeper' 
  | 'Customer Success' 
  | 'Follow Uper'
  | 'Engenheiro'
  | 'Gestor'
  | 'Super Agent'   // New Role
  | 'Trainer';      // New Role

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  type: 'operative' | 'engineer' | 'manager' | 'super_agent' | 'trainer';
  level: number;
  xp: number;
  skills: Skill[];
  avatarStyle: {
    color: string;
    accessory?: 'helmet' | 'crown' | 'glasses' | 'headband' | 'none';
    aura?: 'blue' | 'yellow' | 'red' | 'none'; // For Super Agent Evolution
  };
}

export interface Squad {
  id: string;
  name: string;
  description: string;
  members: Member[];
}

export interface Trainer extends Member {
  specialization: 'Law' | 'Fitness' | 'Coaching';
  buffDescription: string;
}
