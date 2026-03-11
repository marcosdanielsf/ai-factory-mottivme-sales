import { Squad, Member, Skill } from '../types/rpg';
import { AgentConfig } from '../services/dataService';

// --- Skill Definitions (Defaults) ---

const sdrSkills: Skill[] = [
  {
    id: 'skill-first-contact',
    name: 'Set - First Contact',
    description: 'Abordagem inicial e quebra de gelo.',
    type: 'prompt',
    content: `Você é o primeiro ponto de contato.
Objetivo: Identificar o decisor e despertar interesse inicial.
Tom: Profissional, breve e direto.
Gatilhos: Responder rapidamente a leads recebidos via inbound.`
  },
  {
    id: 'skill-objection',
    name: 'Set - Objection Handler',
    description: 'Matriz de tratamento de objeções comuns.',
    type: 'prompt',
    content: `Diretrizes para contornar "Não tenho tempo", "Muito caro", "Já tenho fornecedor".
Estratégia: Acknowledge, Validate, Reframe (AVR).
Nunca confronte, sempre eduque.`
  },
  {
    id: 'skill-followup',
    name: 'Set - Followuper',
    description: 'Cadência de persistência inteligente.',
    type: 'action',
    content: 'Fluxo automático: Dia 1 (Ligação), Dia 3 (Email), Dia 7 (WhatsApp). Parar se houver resposta.'
  }
];

const schedulerSkills: Skill[] = [
  {
    id: 'skill-scheduler',
    name: 'Set - Scheduler',
    description: 'Coordenação de agenda e qualificação de horários.',
    type: 'prompt',
    content: `Você é responsável por garantir o "Show-rate".
Sempre ofereça 2 opções de horário.
Confirme o fuso horário.
Envie invite imediatamente após confirmação.`
  },
  {
    id: 'skill-rescheduler',
    name: 'Set - Rescheduler',
    description: 'Recuperação de no-shows e reagendamentos.',
    type: 'action',
    content: 'Se o lead não aparecer em 5 min, enviar mensagem de "Tudo bem?". Tentar remarcar para as próximas 24h.'
  }
];

const csSkills: Skill[] = [
  {
    id: 'skill-concierge',
    name: 'Set - Concierge',
    description: 'Onboarding e boas-vindas ao novo cliente.',
    type: 'prompt',
    content: `Garanta que o cliente acesse a plataforma.
Envie materiais de apoio.
Agende a reunião de Kick-off.`
  },
  {
    id: 'skill-success',
    name: 'Set - Customer Success',
    description: 'Monitoramento de saúde e expansão (Upsell).',
    type: 'passive',
    content: 'Monitorar uso da ferramenta. Se uso < 50%, acionar alerta de risco de Churn.'
  }
];

const engineerSkills: Skill[] = [
  {
    id: 'skill-debug',
    name: 'Debug em Tempo Real',
    description: 'Identifica e corrige falhas no fluxo de conversas.',
    type: 'passive'
  },
  {
    id: 'skill-measure',
    name: 'Mensuração de KPIs',
    description: 'Analisa métricas de performance do squad.',
    type: 'passive'
  }
];

const managerSkills: Skill[] = [
  {
    id: 'skill-feedback',
    name: 'Feedback Loop',
    description: 'Avalia conversas e atualiza o banco de conhecimento.',
    type: 'action'
  },
  {
    id: 'skill-performance',
    name: 'Análise de Performance',
    description: 'Monitora o atingimento de metas do time.',
    type: 'passive'
  }
];

// --- Helper to Generate Squads ---

export const createSquadFromConfig = (
  clientId: string, 
  clientName: string, 
  vertical: string, 
  company: string,
  config?: AgentConfig | null
): Squad & { clientId: string } => {
  
  // Helper to get prompt content or default
  const getPrompt = (modeKey: string, defaultSkill: Skill): string => {
    if (config?.prompts_por_modo?.[modeKey]) {
      return config.prompts_por_modo[modeKey];
    }
    // Add context to default if no config
    return defaultSkill.content + (config ? '' : `\n\n[Contexto Específico]: Atuando para ${company} no setor de ${vertical}.`);
  };

  // Map SDR Skills
  const mappedSdrSkills = sdrSkills.map(s => {
    let newContent = s.content;
    if (s.id === 'skill-first-contact') newContent = getPrompt('first_contact', s);
    if (s.id === 'skill-objection') newContent = getPrompt('objection_handler', s);
    if (s.id === 'skill-followup') newContent = getPrompt('followuper', s);
    
    return { ...s, content: newContent };
  });

  // Map Scheduler Skills
  const mappedSchedulerSkills = schedulerSkills.map(s => {
    let newContent = s.content;
    if (s.id === 'skill-scheduler') newContent = getPrompt('scheduler', s);
    if (s.id === 'skill-rescheduler') newContent = getPrompt('rescheduler', s);
    
    return { ...s, content: newContent };
  });

  // Map CS Skills
  const mappedCsSkills = csSkills.map(s => {
    let newContent = s.content;
    if (s.id === 'skill-concierge') newContent = getPrompt('concierge', s);
    if (s.id === 'skill-success') newContent = getPrompt('customer_success', s);
    
    return { ...s, content: newContent };
  });

  return {
    id: `squad-${clientId}`,
    clientId,
    name: `Squad ${vertical.charAt(0).toUpperCase() + vertical.slice(1)} - ${company}`,
    description: `Time de alta performance focado em ${vertical}.`,
    members: [
      {
        id: `m-${clientId}-1`,
        name: `${clientName.split(' ')[0]} Hunter`,
        role: 'SDR',
        type: 'operative',
        level: Math.floor(Math.random() * 5) + 5,
        xp: Math.floor(Math.random() * 5000),
        skills: mappedSdrSkills,
        avatarStyle: { color: '#3b82f6', accessory: 'none' }
      },
      {
        id: `m-${clientId}-2`,
        name: 'Agenda Bot',
        role: 'Rescheduler',
        type: 'operative',
        level: Math.floor(Math.random() * 5) + 3,
        xp: Math.floor(Math.random() * 3000),
        skills: mappedSchedulerSkills,
        avatarStyle: { color: '#10b981', accessory: 'none' }
      },
      {
        id: `m-${clientId}-3`,
        name: 'Success Keeper',
        role: 'Customer Success',
        type: 'operative',
        level: Math.floor(Math.random() * 5) + 2,
        xp: Math.floor(Math.random() * 2000),
        skills: mappedCsSkills,
        avatarStyle: { color: '#8b5cf6', accessory: 'none' }
      },
      {
        id: `m-${clientId}-4`,
        name: 'Eng. de Fluxo',
        role: 'Engenheiro',
        type: 'engineer',
        level: 10,
        xp: 9999,
        skills: engineerSkills,
        avatarStyle: { color: '#ef4444', accessory: 'helmet' }
      },
      {
        id: `m-${clientId}-5`,
        name: 'Gestor Performance',
        role: 'Gestor',
        type: 'manager',
        level: 12,
        xp: 15000,
        skills: managerSkills,
        avatarStyle: { color: '#eab308', accessory: 'crown' }
      }
    ]
  };
};

// --- Generated Data (Static Fallback) ---

export const squadsData: (Squad & { clientId: string })[] = [
  createSquadFromConfig('1', 'Rafael Milagre', 'mentores', 'Viver de IA'),
  createSquadFromConfig('2', 'Dr. Silva', 'medicos', 'Clínica Silva'),
  createSquadFromConfig('3', 'Dra. Ana', 'odonto', 'Estética Ana'),
  createSquadFromConfig('4', 'Pedro Tech', 'servicos', 'Tech Solutions'),
  createSquadFromConfig('5', 'Maria Fin', 'financeiro', 'Financeiro Plus'),
  createSquadFromConfig('6', 'João Legal', 'juridico', 'Advocacia Legal')
];
