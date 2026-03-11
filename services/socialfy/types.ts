export type NavItem =
  | 'dashboard' | 'growth-dashboard'
  | 'leads' | 'linkedin-search' | 'instagram-search' | 'cnpj-search' | 'new-followers'
  | 'campaigns'
  | 'cadence-builder' | 'active-cadences' | 'show-rate'
  | 'pipeline' | 'inbox' | 'content'
  | 'agents' | 'icp' | 'analytics'
  | 'accounts' | 'integrations' | 'settings';

export type Channel = 'linkedin' | 'instagram' | 'whatsapp' | 'email' | 'phone' | 'cnpj';

export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  status: 'Available' | 'In Cadence' | 'Converted' | 'Responding' | 'Scheduled';
  channels: Channel[];
  icpScore: number;
  cadenceStatus?: {
    name: string;
    step: string; // e.g., "Day 3/14"
    nextActivity: Channel;
  };
}

export interface Campaign {
  id: string;
  name: string;
  type: 'Connection' | 'Warm-up' | 'Authority' | 'Instagram DM' | 'Multi-channel';
  status: 'Active' | 'Paused' | 'Completed' | 'Draft';
  channels: Channel[];
  leads: number;
  responses: number;
  conversionRate: number;
  cadenceName: string;
  owner: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'Connection' | 'Inbox' | 'Content' | 'Qualifier' | 'Voice AI';
  language: string;
  model: string;
  isActive: boolean;
  description: string;
}

export interface PipelineCard {
  id: string;
  leadName: string;
  title: string;
  company: string;
  value: number;
  stage: 'New' | 'Relationship' | 'Scheduled' | 'Won';
  channels: Channel[];
  cadenceStatus: string;
  nextActivity: string;
  showRateGuard?: {
    email: 'sent' | 'pending' | 'confirmed';
    whatsapp: 'sent' | 'pending' | 'confirmed';
    sms: 'sent' | 'pending' | 'confirmed';
  };
}

export interface Account {
  id: string;
  platform: Channel;
  name: string; // Handle or Phone number
  status: 'Connected' | 'Disconnected' | 'Error';
  usage: number; // percentage
  limit: number;
}