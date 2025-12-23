import { Lead, AgentVersion, AgentTestRun, QaAnalysis, Metric, SystemAlert, Client, Call, ApprovalRequest } from './types';
import { MessageSquare, CheckCircle2, AlertTriangle, Inbox, Send, Zap, Clock, Calendar, GitBranch, Users, Video } from 'lucide-react';

// MOCK DATA - Simulating Supabase Response

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    created_at: '2024-12-19T10:00:00Z',
    name: 'Iago',
    company: 'NextRep',
    email: 'iago.nextrep@gmail.com',
    phone: '5511989927482',
    status: 'demo_booked',
    tags: ['hot', 'v3-target'],
    scheduled_date: 'Hoje, 14:00'
  },
  {
    id: 'l2',
    created_at: '2024-12-19T09:30:00Z',
    name: 'Roberto Reis',
    company: 'Consultoria Reis',
    email: 'robertoluiz@gmail.com',
    phone: '5587999588586',
    status: 'contacted',
    tags: ['warm'],
    scheduled_date: 'Amanhã, 10:00'
  }
];

export const MOCK_AGENT_VERSIONS: AgentVersion[] = [
  {
    id: 'v2.1',
    version_number: 'v2.1',
    system_prompt: 'Você é a Nina...',
    validation_status: 'active',
    validation_score: 98,
    created_at: '2024-12-18T10:00:00Z',
    is_active: true,
    hyperpersonalization_config: { tone: 'Friendly', forbidden_words: ['Desculpe'], knowledge_base_ids: [] }
  },
  {
    id: 'v2.2-beta',
    version_number: 'v2.2-beta',
    system_prompt: 'Você é a Nina (Melhorada)...',
    validation_status: 'failed',
    validation_score: 65,
    created_at: '2024-12-19T14:00:00Z',
    is_active: false,
    hyperpersonalization_config: { tone: 'Professional', forbidden_words: [], knowledge_base_ids: [] }
  }
];

export const MOCK_AGENT_VERSION = {
  versao: 'v2.1',
  deployed_at: '2024-12-18',
  system_prompt: 'Você é a Nina...',
  version_number: 'v2.1',
  validation_status: 'active',
  created_at: '2024-12-18T10:00:00Z',
  is_active: true
};

export const MOCK_TEST_RUNS: AgentTestRun[] = [
  {
    id: 'run-123',
    version_id: 'v2.2-beta',
    run_at: '2024-12-19T14:05:00Z',
    total_tests: 25,
    passed_tests: 18,
    failed_tests: 7,
    status: 'completed',
    summary: 'Falha crítica em detecção de objeção de preço.'
  },
  {
    id: 'run-122',
    version_id: 'v2.1',
    run_at: '2024-12-18T09:00:00Z',
    total_tests: 25,
    passed_tests: 25,
    failed_tests: 0,
    status: 'completed',
    summary: 'Todos os testes passaram.'
  }
];

export const MOCK_ALERTS: SystemAlert[] = [
  {
    id: '1',
    severity: 'critical',
    title: 'Falha de Validação V4',
    message: "A versão v2.2-beta falhou em 7 testes críticos do Python Framework.",
    source: 'python_validator',
    timestamp: 'Hoje às 14:05',
    status: 'new',
    client_name: 'NextRep'
  },
  {
    id: '2',
    severity: 'high',
    title: 'Loop Detectado (n8n)',
    message: 'Agente repetiu resposta 3x na conversa #9921',
    source: 'n8n_monitor',
    timestamp: 'Hoje às 12:30',
    status: 'new',
    client_name: 'Consultoria Reis'
  }
];

export const DASHBOARD_METRICS = [
  { title: 'Leads Ativos (Sales OS)', value: '87', subtext: 'Pipeline atual', icon: Users },
  { title: 'Versão Estável', value: 'v2.1', subtext: 'Score: 98/100', icon: GitBranch },
  { title: 'Testes Executados (V4)', value: '1.240', subtext: 'Últimas 24h', icon: CheckCircle2 },
  { title: 'Alertas Críticos', value: '1', subtext: 'Requer atenção imediata', icon: AlertTriangle },
];

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    empresa: 'NextRep',
    vertical: 'Vendas',
    status: 'cliente',
    nome: 'Marcos Silva',
    email: 'marcos@nextrep.com',
    telefone: '(11) 99999-9999'
  }
];

export const MOCK_CALLS: Call[] = [
  {
    id: '1',
    titulo: 'Demo Call - NextRep',
    tipo: 'video',
    date: '10 min atrás',
    status: 'analisada'
  }
];

export const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: '1',
    client_name: 'NextRep',
    version: 'v2.2',
    type: 'prompt',
    requested_at: '2024-12-19T10:00:00Z',
    changes_summary: 'Adjusted tone to be more persuasive.'
  }
];