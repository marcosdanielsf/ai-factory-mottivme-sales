import { Client, AgentVersion, CallRecording, PromptChangeRequest, Lead } from './types';
import { MessageSquare, CheckCircle2, AlertTriangle, Inbox, Send, Zap, Clock, Calendar } from 'lucide-react';

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    nome: 'Rafael Milagre',
    empresa: 'Viver de IA',
    email: 'rafael@viverdeia.com',
    telefone: '(31) 99999-9999',
    vertical: 'mentores',
    status: 'cliente',
    created_at: '2024-10-15T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael',
    revenue: 150000,
    score: 98
  },
  {
    id: '2',
    nome: 'Dr. Silva',
    empresa: 'Clínica Silva',
    email: 'silva@clinica.com',
    telefone: '(11) 99999-9999',
    vertical: 'medicos',
    status: 'cliente',
    created_at: '2024-11-01T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Silva',
    revenue: 85000,
    score: 85
  },
  {
    id: '3',
    nome: 'Dra. Ana',
    empresa: 'Estética Ana',
    email: 'ana@estetica.com',
    telefone: '(21) 99999-9999',
    vertical: 'odonto',
    status: 'cliente',
    created_at: '2024-11-10T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    revenue: 120000,
    score: 92
  },
  {
    id: '4',
    nome: 'Pedro Tech',
    empresa: 'Tech Solutions',
    email: 'pedro@tech.com',
    telefone: '(41) 99999-9999',
    vertical: 'servicos',
    status: 'cliente',
    created_at: '2024-11-15T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro',
    revenue: 65000,
    score: 80
  },
  {
    id: '5',
    nome: 'Maria Fin',
    empresa: 'Financeiro Plus',
    email: 'maria@fin.com',
    telefone: '(51) 99999-9999',
    vertical: 'financeiro',
    status: 'cliente',
    created_at: '2024-11-20T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    revenue: 55000,
    score: 75
  },
  {
    id: '6',
    nome: 'João Legal',
    empresa: 'Advocacia Legal',
    email: 'joao@adv.com',
    telefone: '(61) 99999-9999',
    vertical: 'servicos',
    status: 'cliente',
    created_at: '2024-11-25T10:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
    revenue: 45000,
    score: 70
  }
];

export const MOCK_AGENT_VERSION: AgentVersion = {
  id: 'v1',
  agent_id: '1',
  version_number: 'v2.1',
  status: 'production',
  created_at: '2024-12-18T10:00:00Z',
  deployed_at: '2024-12-18T10:30:00Z',
  system_prompt: `# IDENTIDADE CORE

Nome: Nina
Função: SDR (Sales Development Representative)
Empresa: Viver de IA
Criador: Rafael Milagre
Título oficial: Assistente de IA oficial do Viver de IA

**MISSÃO ÚNICA:** Agendar demonstrações com leads qualificados. Nada mais.

---

# PERSONALIDADE

- Especialista em IA que virou amiga - não robô corporativo
- Tom: Calorosa, descontraída, brasileira
- Confiante sem arrogância`
};

export const MOCK_AGENT_VERSIONS: AgentVersion[] = [
  MOCK_AGENT_VERSION,
  {
    ...MOCK_AGENT_VERSION,
    id: 'v2',
    version_number: 'v2.2-beta',
    status: 'sandbox',
    created_at: '2024-12-20T10:00:00Z',
    deployed_at: undefined
  }
];

export const MOCK_TEST_RUNS = [
  {
    id: 'run-1',
    version_id: 'v2.1',
    run_at: '2024-12-18T10:30:00Z',
    total_tests: 25,
    passed_tests: 25,
    failed_tests: 0,
    summary: 'All core scenarios passed'
  },
  {
    id: 'run-2',
    version_id: 'v2.2-beta',
    run_at: '2024-12-20T11:00:00Z',
    total_tests: 25,
    passed_tests: 16,
    failed_tests: 9,
    summary: 'Regression in objection handling'
  }
];

export const MOCK_CALLS: CallRecording[] = [];

export const MOCK_APPROVALS: PromptChangeRequest[] = [];

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Iago',
    email: 'iago.nextrep@gmail.com',
    phone: '5511989927482',
    scheduled_date: '19/12 às 20:00',
    status: 'scheduled',
    created_at: '2024-12-19T10:00:00Z',
    updated_at: '2024-12-19T10:00:00Z'
  },
  {
    id: '2',
    name: 'Roberto Reis',
    email: 'robertoluiz@gmail.com',
    phone: '5587999588586',
    scheduled_date: '19/12 às 19:00',
    status: 'scheduled',
    created_at: '2024-12-19T10:00:00Z',
    updated_at: '2024-12-19T10:00:00Z'
  },
  {
    id: '3',
    name: 'Ariete',
    email: 'ariete@lockdados.com.br',
    phone: '5565984288191',
    scheduled_date: '18/12 às 19:00',
    status: 'scheduled',
    created_at: '2024-12-18T10:00:00Z',
    updated_at: '2024-12-18T10:00:00Z'
  }
];

export const DASHBOARD_METRICS = [
  { title: 'Total de Conversas', value: '4.817', subtext: 'Todas as conversas criadas', icon: MessageSquare },
  { title: 'Conversas Reais', value: '3.320', subtext: 'Com pelo menos 1 msg do usuário', icon: CheckCircle2 },
  { title: 'Sem Engajamento', value: '2.703', subtext: '0-1 mensagens do usuário', icon: AlertTriangle },
  { title: 'Aguardando Resposta', value: '45', subtext: 'Mensagens não respondidas', icon: Inbox },
];

export const MOCK_ALERTS = [
  {
    id: '1',
    severity: 'critical',
    title: 'Queda na Taxa de Conversão',
    timestamp: 'Há 10 min',
    message: 'A taxa de conversão do Agente Nina (V2.1) caiu para 2% nas últimas 2 horas.',
    client_name: 'Viver de IA'
  },
  {
    id: '2',
    severity: 'high',
    title: 'Erro de Integração GHL',
    timestamp: 'Há 30 min',
    message: 'Falha ao sincronizar 5 novos leads. O token de API pode ter expirado.',
    client_name: 'Clínica Silva'
  },
  {
    id: '3',
    severity: 'medium',
    title: 'Limite de Tokens',
    timestamp: 'Há 2 horas',
    message: 'O uso de tokens atingiu 80% da cota mensal para este cliente.',
    client_name: 'Tech Solutions'
  }
];
