import { Member, Trainer } from '../types/rpg';

export const superAgent: Member = {
  id: 'super-goku-1',
  name: 'Sales Goku',
  role: 'Super Agent',
  type: 'super_agent',
  level: 1,
  xp: 0,
  skills: [],
  avatarStyle: {
    color: '#f97316', // Orange like Goku's Gi
    accessory: 'none',
    aura: 'none'
  }
};

export const trainers: Trainer[] = [
  {
    id: 'trainer-lawyer',
    name: 'Dr. Lex',
    role: 'Trainer',
    type: 'trainer',
    specialization: 'Law',
    buffDescription: 'Conhecimento Jurídico & Contratos',
    level: 50,
    xp: 9999,
    skills: [],
    avatarStyle: { color: '#475569', accessory: 'glasses' }
  },
  {
    id: 'trainer-coach',
    name: 'Master Sales',
    role: 'Trainer',
    type: 'trainer',
    specialization: 'Coaching',
    buffDescription: 'Técnicas de Vendas & Objeções',
    level: 50,
    xp: 9999,
    skills: [],
    avatarStyle: { color: '#eab308', accessory: 'headband' }
  },
  {
    id: 'trainer-pt',
    name: 'Coach Fit',
    role: 'Trainer',
    type: 'trainer',
    specialization: 'Fitness',
    buffDescription: 'Resistência em Follow-ups',
    level: 50,
    xp: 9999,
    skills: [],
    avatarStyle: { color: '#ef4444', accessory: 'none' }
  }
];
