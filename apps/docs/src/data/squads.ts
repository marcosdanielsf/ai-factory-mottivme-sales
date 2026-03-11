import { Squad, Member, MemberRole, Skill } from "../types/rpg";

interface AgentConfig {
  system_prompt?: string;
  prompts_por_modo?: Record<string, string>;
  tools_config?: Record<string, unknown>;
}

const ROLE_COLORS: Record<string, string> = {
  SDR: "#3b82f6",
  "Social Seller": "#8b5cf6",
  Rescheduler: "#eab308",
  "Engagement Keeper": "#f97316",
  "Customer Success": "#10b981",
  "Follow Uper": "#ef4444",
  Engenheiro: "#6366f1",
  Gestor: "#ec4899",
};

const DEFAULT_ROLES: MemberRole[] = [
  "SDR",
  "Social Seller",
  "Follow Uper",
  "Rescheduler",
  "Customer Success",
];

function generateSkillsForRole(role: MemberRole): Skill[] {
  const skills: Record<string, Skill[]> = {
    SDR: [
      {
        id: "sk-qualify",
        name: "Qualificacao BANT",
        description: "Qualifica leads com framework BANT",
        type: "prompt",
      },
      {
        id: "sk-pitch",
        name: "Pitch Inicial",
        description: "Apresenta servico ao lead",
        type: "prompt",
      },
    ],
    "Social Seller": [
      {
        id: "sk-social",
        name: "Engajamento Social",
        description: "Interage em posts e stories",
        type: "action",
      },
    ],
    "Follow Uper": [
      {
        id: "sk-followup",
        name: "Follow Up",
        description: "Reengaja leads inativos",
        type: "action",
      },
    ],
    Rescheduler: [
      {
        id: "sk-resched",
        name: "Reagendamento",
        description: "Remarca consultas canceladas",
        type: "action",
      },
    ],
    "Customer Success": [
      {
        id: "sk-nps",
        name: "NPS Check",
        description: "Coleta feedback do cliente",
        type: "action",
      },
    ],
  };
  return skills[role] || [];
}

export function createSquadFromConfig(
  clientId: string,
  clientName: string,
  vertical: string,
  empresa: string,
  config: AgentConfig | null,
): Squad {
  const members: Member[] = DEFAULT_ROLES.map((role, index) => ({
    id: `${clientId}-${role.toLowerCase().replace(/\s/g, "-")}`,
    name: `${role} - ${clientName}`,
    role,
    type: role === "Gestor" ? "manager" : ("operative" as Member["type"]),
    level: config
      ? Math.min(10, 3 + Object.keys(config.prompts_por_modo || {}).length)
      : 1,
    xp: config ? Object.keys(config.tools_config || {}).length * 100 : 0,
    skills: generateSkillsForRole(role),
    avatarStyle: {
      color: ROLE_COLORS[role] || "#6b7280",
      accessory: index === 0 ? ("helmet" as const) : ("none" as const),
    },
  }));

  return {
    id: `squad-${clientId}`,
    name: `Squad ${empresa || clientName}`,
    description: `${vertical || "Geral"} - ${members.length} agentes`,
    members,
  };
}
