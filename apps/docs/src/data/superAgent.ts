import { Member, Trainer } from "../types/rpg";

export const superAgent: Member = {
  id: "super-agent-001",
  name: "Super Agent V4",
  role: "Super Agent",
  type: "super_agent",
  level: 1,
  xp: 0,
  skills: [
    {
      id: "sk-followup",
      name: "Follow Up Inteligente",
      description: "Envia follow-ups contextuais baseados no historico do lead",
      type: "action",
    },
    {
      id: "sk-scheduling",
      name: "Agendamento Automatico",
      description: "Agenda reunioes com base na disponibilidade do calendario",
      type: "action",
    },
    {
      id: "sk-objection",
      name: "Tratamento de Objecoes",
      description: "Responde objecoes com framework A.R.O",
      type: "prompt",
    },
  ],
  avatarStyle: {
    color: "#f97316",
    accessory: "crown",
    aura: "none",
  },
};

export const trainers: Trainer[] = [
  {
    id: "trainer-law",
    name: "Dr. Lex",
    role: "Trainer",
    type: "trainer",
    level: 10,
    xp: 5000,
    specialization: "Law",
    buffDescription:
      "Adiciona compliance juridica aos contratos e comunicacoes",
    skills: [
      {
        id: "sk-compliance",
        name: "Compliance Check",
        description: "Valida clausulas e termos legais",
        type: "passive",
      },
    ],
    avatarStyle: {
      color: "#3b82f6",
      accessory: "glasses",
    },
  },
  {
    id: "trainer-fitness",
    name: "Coach Titan",
    role: "Trainer",
    type: "trainer",
    level: 10,
    xp: 5000,
    specialization: "Fitness",
    buffDescription: "Aumenta energia e persistencia nas interacoes",
    skills: [
      {
        id: "sk-persistence",
        name: "Persistencia",
        description: "Nunca desiste de um lead",
        type: "passive",
      },
    ],
    avatarStyle: {
      color: "#ef4444",
      accessory: "headband",
    },
  },
  {
    id: "trainer-coaching",
    name: "Mestre Kai",
    role: "Trainer",
    type: "trainer",
    level: 10,
    xp: 5000,
    specialization: "Coaching",
    buffDescription: "Melhora empatia e rapport com leads",
    skills: [
      {
        id: "sk-rapport",
        name: "Rapport Builder",
        description: "Cria conexao emocional com o lead",
        type: "passive",
      },
    ],
    avatarStyle: {
      color: "#eab308",
      accessory: "helmet",
    },
  },
];
