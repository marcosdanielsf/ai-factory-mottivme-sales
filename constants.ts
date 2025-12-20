import { Client, AgentVersion, CallRecording, PromptChangeRequest, Lead, Metric } from './types';
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
    created_at: '2024-10-15T10:00:00Z'
  }
];

export const MOCK_AGENT_VERSION: AgentVersion = {
  id: 'v1',
  client_id: '1',
  versao: 'v2.1',
  is_active: true,
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

export const MOCK_CALLS: CallRecording[] = [];

export const MOCK_APPROVALS: PromptChangeRequest[] = [];

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Iago',
    email: 'iago.nextrep@gmail.com',
    phone: '5511989927482',
    scheduled_date: '19/12 às 20:00',
    status: 'scheduled'
  },
  {
    id: '2',
    name: 'Roberto Reis',
    email: 'robertoluiz@gmail.com',
    phone: '5587999588586',
    scheduled_date: '19/12 às 19:00',
    status: 'scheduled'
  },
  {
    id: '3',
    name: 'Ariete',
    email: 'ariete@lockdados.com.br',
    phone: '5565984288191',
    scheduled_date: '18/12 às 19:00',
    status: 'scheduled'
  }
];

export const DASHBOARD_METRICS = [
  { title: 'Total de Conversas', value: '4.817', subtext: 'Todas as conversas criadas', icon: MessageSquare },
  { title: 'Conversas Reais', value: '3.320', subtext: 'Com pelo menos 1 msg do usuário', icon: CheckCircle2 },
  { title: 'Sem Engajamento', value: '2.703', subtext: '0-1 mensagens do usuário', icon: AlertTriangle },
  { title: 'Mensagens Recebidas', value: '15.512', subtext: 'Do usuário para Nina', icon: Inbox },
  { title: 'Mensagens Enviadas', value: '31.304', subtext: 'Nina respondeu', icon: Send },
  { title: 'Conversas Engajadas', value: '715', subtext: '+3 msgs do usuário', icon: Zap },
  { title: 'Média por Conversa', value: '9.7', subtext: 'Mensagens/conversa', icon: MessageSquare },
  { title: 'Total Agendamentos', value: '170', subtext: 'Call com humanos', icon: Calendar },
  { title: 'Taxa Conversão Real', value: '5.1%', subtext: 'Agendamentos / Conversas Reais', icon: Zap },
  { title: 'Performance', value: '4.4s', subtext: 'Tempo médio resposta Nina', icon: Clock },
];