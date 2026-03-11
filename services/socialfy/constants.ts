import { Agent, Campaign, Lead, Metric, PipelineCard, Account } from './types';

export const METRICS: Metric[] = [
  { label: 'Total Leads', value: '1,247', change: '+12%', trend: 'up', description: 'Total prospects in database' },
  { label: 'Active Cadences', value: '156', change: '+5%', trend: 'up', description: 'Leads currently in sequence' },
  { label: 'Meetings', value: '12', change: '+23%', trend: 'up', description: 'Scheduled this week' },
  { label: 'Show-Rate', value: '78%', change: '+2%', trend: 'up', description: 'Target: 70% ✅' },
];

export const RECENT_CAMPAIGNS: Campaign[] = [
  { 
    id: '1', name: 'CEOs Tech SP', type: 'Multi-channel', status: 'Active', 
    channels: ['linkedin', 'whatsapp', 'email', 'phone'],
    leads: 150, responses: 63, conversionRate: 42, cadenceName: 'OUT-HT-14', owner: 'Rodrigo Santos'
  },
  { 
    id: '2', name: 'Instagram Fitness BR', type: 'Instagram DM', status: 'Active', 
    channels: ['instagram', 'whatsapp'],
    leads: 300, responses: 114, conversionRate: 38, cadenceName: 'IG-MT-7', owner: 'Ana Lima'
  },
  { 
    id: '3', name: 'Outbound Finance Q4', type: 'Connection', status: 'Completed', 
    channels: ['linkedin'],
    leads: 150, responses: 83, conversionRate: 55, cadenceName: 'CON-HT-14', owner: 'Pedro Costa'
  },
  { 
    id: '4', name: 'Warm-up Medicos', type: 'Warm-up', status: 'Active', 
    channels: ['linkedin'],
    leads: 200, responses: 12, conversionRate: 0, cadenceName: 'WU-LT-21', owner: 'Marcos Daniels'
  },
  {
    id: '5', name: 'Authority Tech Leaders', type: 'Authority', status: 'Active',
    channels: ['linkedin'],
    leads: 180, responses: 45, conversionRate: 25, cadenceName: 'AUT-MT-14', owner: 'Rodrigo Santos'
  },
  {
    id: '6', name: 'Instagram E-commerce', type: 'Instagram DM', status: 'Paused',
    channels: ['instagram', 'whatsapp'],
    leads: 250, responses: 78, conversionRate: 31, cadenceName: 'IG-HT-10', owner: 'Ana Lima'
  },
];

export const MOCK_LEADS: Lead[] = [
  { 
    id: '1', name: 'Joao Silva', title: 'CEO', company: 'TechCorp', avatar: 'https://picsum.photos/32/32?random=1', 
    status: 'In Cadence', channels: ['linkedin', 'whatsapp', 'email', 'phone'], icpScore: 95,
    cadenceStatus: { name: 'OUT-HT-14', step: 'Day 3/14', nextActivity: 'whatsapp' }
  },
  { 
    id: '2', name: 'Maria Santos', title: 'CMO', company: 'StartupXYZ', avatar: 'https://picsum.photos/32/32?random=2', 
    status: 'In Cadence', channels: ['instagram', 'whatsapp'], icpScore: 88,
    cadenceStatus: { name: 'IG-MT-7', step: 'Day 1/7', nextActivity: 'instagram' }
  },
  { 
    id: '3', name: 'Pedro Costa', title: 'CFO', company: 'FinCo', avatar: 'https://picsum.photos/32/32?random=3', 
    status: 'Available', channels: ['linkedin', 'email'], icpScore: 72
  },
  { 
    id: '4', name: 'Ana Lima', title: 'COO', company: 'HealthTech', avatar: 'https://picsum.photos/32/32?random=4', 
    status: 'Converted', channels: ['cnpj', 'linkedin', 'email', 'phone'], icpScore: 68
  },
  { 
    id: '5', name: 'Carlos Mendes', title: 'Founder', company: 'DevStudio', avatar: 'https://picsum.photos/32/32?random=5', 
    status: 'Available', channels: ['linkedin', 'instagram', 'email'], icpScore: 82
  },
];

export const MOCK_AGENTS: Agent[] = [
  { id: '1', name: 'Connection Agent V4', type: 'Connection', language: 'pt-BR', model: 'Claude Sonnet', isActive: true, description: 'Create personalized connection notes with icebreaker' },
  { id: '2', name: 'Inbox Responder V2', type: 'Inbox', language: 'pt-BR', model: 'Claude Sonnet', isActive: true, description: 'Respond to inbound messages maintaining context' },
  { id: '3', name: 'ICP Qualifier ⭐', type: 'Qualifier', language: 'pt-BR', model: 'Claude Sonnet', isActive: true, description: 'Analyze lead profile and calculate ICP score' },
  { id: '4', name: 'Voice AI Agent ⭐', type: 'Voice AI', language: 'pt-BR', model: 'Claude Opus', isActive: false, description: 'Cold call script with objection handling' },
];

export const PIPELINE_DATA: PipelineCard[] = [
  { 
    id: '1', leadName: 'Joao Silva', title: 'CEO', company: 'TechCorp', value: 15000, stage: 'New', 
    channels: ['linkedin', 'whatsapp', 'email'], cadenceStatus: 'Day 3/14', nextActivity: 'Follow-up'
  },
  { 
    id: '2', leadName: 'Maria Santos', title: 'CMO', company: 'StartupXYZ', value: 25000, stage: 'Relationship', 
    channels: ['instagram', 'whatsapp'], cadenceStatus: 'Day 5/7', nextActivity: 'Reply to DM'
  },
  { 
    id: '3', leadName: 'Pedro Costa', title: 'CFO', company: 'FinCo', value: 50000, stage: 'Scheduled', 
    channels: ['linkedin', 'email', 'phone'], cadenceStatus: 'Completed', nextActivity: 'Meeting Tomorrow',
    showRateGuard: { email: 'confirmed', whatsapp: 'confirmed', sms: 'pending' }
  },
  { 
    id: '4', leadName: 'Ana Lima', title: 'COO', company: 'HealthCo', value: 25000, stage: 'Won', 
    channels: ['linkedin', 'phone'], cadenceStatus: 'Completed', nextActivity: 'Onboarding'
  },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: '1', platform: 'linkedin', name: '@marcos.daniels', status: 'Connected', usage: 76, limit: 100 },
  { id: '2', platform: 'instagram', name: '@marcosdaniels', status: 'Connected', usage: 30, limit: 100 },
  { id: '3', platform: 'whatsapp', name: '+55 11 99999-9999', status: 'Connected', usage: 45, limit: 100 },
  { id: '4', platform: 'email', name: 'marcos@mottivme.com', status: 'Connected', usage: 44, limit: 100 },
  { id: '5', platform: 'phone', name: '+55 11 3333-3333', status: 'Connected', usage: 24, limit: 100 },
];
