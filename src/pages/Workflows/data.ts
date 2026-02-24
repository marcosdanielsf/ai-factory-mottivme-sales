// ============================================
// DADOS DOS WORKFLOWS ORGANIZADOS POR SETOR
// ============================================

export type WorkflowStatus = 'on' | 'off';
export type ResourceType = 'workflow' | 'link' | 'file' | 'api_key';

export interface WorkflowItem {
  id: string;
  name: string;
  status: WorkflowStatus;
  type: ResourceType;
  url?: string;
  description?: string;
  tags?: string[];
}

export interface ResourceLink {
  label: string;
  url: string;
  type: 'doc' | 'dashboard' | 'api' | 'tool' | 'repo';
}

export interface SubSector {
  id: string;
  name: string;
  description: string;
  items: WorkflowItem[];
  resources?: ResourceLink[];
}

export interface Sector {
  id: string;
  name: string;
  icon: string;
  color: string;
  subSectors: SubSector[];
}

const N8N_BASE = 'https://cliente-a1.mentorfy.io/workflow';

export const sectors: Sector[] = [
  // =============================================
  // 1. MARKETING
  // =============================================
  {
    id: 'marketing',
    name: 'Marketing',
    icon: 'Megaphone',
    color: '#f59e0b',
    subSectors: [
      {
        id: 'mkt-conteudo',
        name: 'Conteudo',
        description: 'Blog, social media, videos',
        items: [
          { id: '0eq7VTwySd9qqbZj', name: 'IA Marketing', status: 'on', type: 'workflow', url: `${N8N_BASE}/0eq7VTwySd9qqbZj`, tags: ['AgenteSocialMedia', 'LuanCarvalho'] },
          { id: 'I5RRn5xq2hrGSByt', name: 'Blog Auto Generator - Saude', status: 'on', type: 'workflow', url: `${N8N_BASE}/I5RRn5xq2hrGSByt` },
          { id: 'BRDVWE7np4p5ZJqe', name: 'Video Production Pipeline', status: 'on', type: 'workflow', url: `${N8N_BASE}/BRDVWE7np4p5ZJqe` },
          { id: 'Q34tfBT2l1vFlmNc', name: 'VSL', status: 'on', type: 'workflow', url: `${N8N_BASE}/Q34tfBT2l1vFlmNc` },
        ],
      },
      {
        id: 'mkt-performance',
        name: 'Performance',
        description: 'Ads, metricas, UTM',
        resources: [
          { label: 'Facebook Ads Manager', url: 'https://business.facebook.com/adsmanager', type: 'dashboard' },
        ],
        items: [
          { id: 'LnASPbaM5ptlLiBH', name: 'Facebook Ads Daily Report', status: 'on', type: 'workflow', url: `${N8N_BASE}/LnASPbaM5ptlLiBH` },
          { id: 'Ews8xhc5An6oEp1V', name: 'IA Gestor de Trafego - Analise Semanal FB Ads → ClickUp', status: 'off', type: 'workflow', url: `${N8N_BASE}/Ews8xhc5An6oEp1V`, description: 'Template @illumi.ia: 25 nodes, Code LLM Chain + 8 Edit Fields diamante. Analisa campanhas FB Ads por conta → relatorio ClickUp com ROAS/CPC/CTR + insights', tags: ['template', 'illumi-ia', 'langchain'] },
          { id: 'TDc8zbwdxkeu3sta', name: 'UTM Enrichment from GHL API (4h)', status: 'on', type: 'workflow', url: `${N8N_BASE}/TDc8zbwdxkeu3sta` },
        ],
      },
      {
        id: 'mkt-producao',
        name: 'Producao',
        description: 'Assembly line, media tools',
        items: [
          { id: '3rLcjPNxGf5yZsKW', name: 'Assembly Line - Trigger', status: 'on', type: 'workflow', url: `${N8N_BASE}/3rLcjPNxGf5yZsKW` },
          { id: 'FhwLxjkefgY0LoXp', name: 'Assembly Line - Parte 3', status: 'on', type: 'workflow', url: `${N8N_BASE}/FhwLxjkefgY0LoXp` },
          { id: 'PtLnvQe9wqszUZV2', name: 'Assembly Line - Parte 6', status: 'on', type: 'workflow', url: `${N8N_BASE}/PtLnvQe9wqszUZV2` },
          { id: 'J4p75K4RCuwIMBoy', name: 'Edit Image Tool', status: 'on', type: 'workflow', url: `${N8N_BASE}/J4p75K4RCuwIMBoy` },
          { id: 'ADPjJla7AGiNljUH', name: 'Image to Video Tool', status: 'on', type: 'workflow', url: `${N8N_BASE}/ADPjJla7AGiNljUH` },
          { id: 'RxINXeUs8j0o7qX0', name: 'TikTok Post Tool', status: 'on', type: 'workflow', url: `${N8N_BASE}/RxINXeUs8j0o7qX0` },
          { id: 'IBTSCQo4JUjZa7g0', name: 'X Post Tool', status: 'on', type: 'workflow', url: `${N8N_BASE}/IBTSCQo4JUjZa7g0` },
        ],
      },
    ],
  },

  // =============================================
  // 2. COMERCIAL
  // =============================================
  {
    id: 'comercial',
    name: 'Comercial',
    icon: 'TrendingUp',
    color: '#3b82f6',
    subSectors: [
      {
        id: 'com-inteligencia',
        name: 'Inteligencia Comercial',
        description: 'Geracao e tratamento de listas de leads',
        items: [
          { id: 'PmTlhzFp0jAjX7IO', name: 'Prospector', status: 'on', type: 'workflow', url: `${N8N_BASE}/PmTlhzFp0jAjX7IO` },
          { id: 'Qz74TLYJ83qJu5y1', name: 'Instagram Scraping', status: 'on', type: 'workflow', url: `${N8N_BASE}/Qz74TLYJ83qJu5y1` },
          { id: 'M4ecqAzZWl57vgpi', name: 'Monitor Sessao Instagram', status: 'on', type: 'workflow', url: `${N8N_BASE}/M4ecqAzZWl57vgpi` },
          { id: 'Oa8LHJbghhq1bdwl', name: 'Apify Scrape Instagram Reels', status: 'on', type: 'workflow', url: `${N8N_BASE}/Oa8LHJbghhq1bdwl` },
          { id: '5N8FB0gBMJwHyMcy', name: 'Inserir Lead Insights V2', status: 'on', type: 'workflow', url: `${N8N_BASE}/5N8FB0gBMJwHyMcy` },
          { id: 'AHkzZxs6dcpLKvRZ', name: 'Detector Origem IA (NS/VS/GS)', status: 'on', type: 'workflow', url: `${N8N_BASE}/AHkzZxs6dcpLKvRZ` },
        ],
      },
      {
        id: 'com-pre-vendas',
        name: 'Pre-Vendas',
        description: 'SDR, qualificacao, cold call, abordagem',
        items: [
          { id: 'CkGUMUs8jAQOhPH6', name: 'SDR - Karollayne Paiva', status: 'on', type: 'workflow', url: `${N8N_BASE}/CkGUMUs8jAQOhPH6` },
          { id: 'L6XpZ8LakLIx6BT4', name: 'SDR - Orthodontic', status: 'on', type: 'workflow', url: `${N8N_BASE}/L6XpZ8LakLIx6BT4` },
          { id: '46oXeptAC56D5Hm1', name: 'Multi-Tenant Inbox Classifier', status: 'on', type: 'workflow', url: `${N8N_BASE}/46oXeptAC56D5Hm1`, tags: ['14'] },
          { id: 'BHOpaa1OFvpBe46n', name: 'VAPI Call Webhook', status: 'on', type: 'workflow', url: `${N8N_BASE}/BHOpaa1OFvpBe46n`, tags: ['cold call'] },
          { id: 'LhfsFjDvfOto22Rt', name: 'VAPI → GHL Agendamento', status: 'on', type: 'workflow', url: `${N8N_BASE}/LhfsFjDvfOto22Rt` },
          { id: 'LUDLncD12Y2oMkAb', name: 'GHL Innovat Phone Calls (INBOUND + OUTBOUND)', status: 'on', type: 'workflow', url: `${N8N_BASE}/LUDLncD12Y2oMkAb` },
          { id: 'PSfM4j8fmuGtU9GE', name: 'Gestao de Ligacoes', status: 'on', type: 'workflow', url: `${N8N_BASE}/PSfM4j8fmuGtU9GE` },
        ],
      },
      {
        id: 'com-vendas',
        name: 'Vendas',
        description: 'Fluxo principal, follow-up, fechamento',
        resources: [
          { label: 'GHL - Socialfy', url: 'https://app.socialfy.me', type: 'dashboard' },
          { label: 'Propostal', url: 'https://propostal.vercel.app', type: 'tool' },
        ],
        items: [
          { id: 'IawOpB56MTFoEP3M', name: 'Mensagem Recebida (Fluxo Principal)', status: 'on', type: 'workflow', url: `${N8N_BASE}/IawOpB56MTFoEP3M`, tags: ['core'] },
          { id: 'PNU745c6bXwEPpoD', name: 'GHL - Mottivme - EUA', status: 'on', type: 'workflow', url: `${N8N_BASE}/PNU745c6bXwEPpoD` },
          { id: 'HaKICQ2aNNbWZBgB', name: 'GHL - COM REAGENDAMENTO + TRACKING', status: 'on', type: 'workflow', url: `${N8N_BASE}/HaKICQ2aNNbWZBgB` },
          { id: '3Yx6JniDrQw4KBCi', name: 'Follow Up Eterno V8', status: 'on', type: 'workflow', url: `${N8N_BASE}/3Yx6JniDrQw4KBCi`, tags: ['follow up'] },
          { id: 'RWqKKfYDlESR7XQo', name: 'Fluxo de Follow UP 1', status: 'on', type: 'workflow', url: `${N8N_BASE}/RWqKKfYDlESR7XQo` },
          { id: 'FqRbC9XUFknCfwyY', name: 'Milton', status: 'on', type: 'workflow', url: `${N8N_BASE}/FqRbC9XUFknCfwyY` },
          { id: 'CCKudyBwT2EiUBK8', name: 'Marina Couto 2', status: 'on', type: 'workflow', url: `${N8N_BASE}/CCKudyBwT2EiUBK8` },
          { id: 'GZB8zLq9RWHXVi3j', name: 'Dra Gabi', status: 'on', type: 'workflow', url: `${N8N_BASE}/GZB8zLq9RWHXVi3j` },
          { id: 'JwXxbG3tw2bT7ERl', name: 'PROPOSTAL - Chat Escalation Alert', status: 'on', type: 'workflow', url: `${N8N_BASE}/JwXxbG3tw2bT7ERl` },
          { id: 'SImxQrdZjlm6fcPk', name: 'PROPOSTAL - Lead Quente Alert', status: 'on', type: 'workflow', url: `${N8N_BASE}/SImxQrdZjlm6fcPk` },
        ],
      },
      {
        id: 'com-pos-vendas',
        name: 'Pos-Vendas',
        description: 'Customer success, onboarding, retencao',
        items: [
          { id: 'GEcf6Ke7NJwY9vYl', name: 'Call Analyzer Onboarding', status: 'on', type: 'workflow', url: `${N8N_BASE}/GEcf6Ke7NJwY9vYl`, tags: ['ai factory - vertical'] },
          { id: 'FdrglHVITLLedhBl', name: 'Feedback Loop Oportunidade', status: 'on', type: 'workflow', url: `${N8N_BASE}/FdrglHVITLLedhBl` },
          { id: '5Nn3F2cN4gyGij9V', name: 'Tag Converteu - GHL (via Dashboard)', status: 'on', type: 'workflow', url: `${N8N_BASE}/5Nn3F2cN4gyGij9V` },
          { id: '0r0V3ija6EM88T6E', name: 'Escalar Humano MULTI-TENANT', status: 'on', type: 'workflow', url: `${N8N_BASE}/0r0V3ija6EM88T6E` },
          { id: 'DctYIhYHlpbTPXzD', name: 'GHL Payment to Onboarding', status: 'on', type: 'workflow', url: `${N8N_BASE}/DctYIhYHlpbTPXzD` },
        ],
      },
    ],
  },

  // =============================================
  // 3. ADMINISTRATIVO
  // =============================================
  {
    id: 'administrativo',
    name: 'Administrativo',
    icon: 'Wallet',
    color: '#10b981',
    subSectors: [
      {
        id: 'adm-financeiro',
        name: 'Financeiro',
        description: 'Cobranca, pagamentos, fluxo de caixa',
        resources: [
          { label: 'BPO Financeiro Dashboard', url: 'https://bpofinanceiro.mottivme.com.br', type: 'dashboard' },
          { label: 'Asaas', url: 'https://www.asaas.com/dashboard', type: 'tool' },
        ],
        items: [
          { id: '9Y1yFmUJGVszyUSy', name: 'Sofia - Assistente Completo', status: 'on', type: 'workflow', url: `${N8N_BASE}/9Y1yFmUJGVszyUSy`, tags: ['adm'] },
          { id: 'AvczBOL2wMLBuRR7', name: 'Invoice Extractor', status: 'on', type: 'workflow', url: `${N8N_BASE}/AvczBOL2wMLBuRR7`, tags: ['adm'] },
          { id: '7yKPigE1xOXcdQSY', name: 'Email Parser - PDF to Movimentacoes', status: 'on', type: 'workflow', url: `${N8N_BASE}/7yKPigE1xOXcdQSY` },
          { id: 'TA42IuiFiPHQrYuF', name: 'BPO Financeiro - WhatsApp Approval', status: 'on', type: 'workflow', url: `${N8N_BASE}/TA42IuiFiPHQrYuF` },
          { id: 'LJ6h1jNhTFQx66ne', name: 'Chat Dashboard Financeiro v2', status: 'on', type: 'workflow', url: `${N8N_BASE}/LJ6h1jNhTFQx66ne` },
          { id: '45POrWnyU2UR7HjQ', name: 'Integracao Asaas', status: 'on', type: 'workflow', url: `${N8N_BASE}/45POrWnyU2UR7HjQ` },
          { id: 'AK8gVhwmpdU9Z1Tr', name: 'Sistema de Cobranca Automatica', status: 'on', type: 'workflow', url: `${N8N_BASE}/AK8gVhwmpdU9Z1Tr` },
          { id: '9IH4sqzQ3uOM65yf', name: 'Gerar Recorrencias Mensais', status: 'on', type: 'workflow', url: `${N8N_BASE}/9IH4sqzQ3uOM65yf` },
          { id: '2b7qY6FV4SksBgXV', name: 'TOOL fin_movimentacoes', status: 'on', type: 'workflow', url: `${N8N_BASE}/2b7qY6FV4SksBgXV` },
          { id: '9N4DwvjLk6WsJm64', name: 'TOOL DRE Simplificado', status: 'on', type: 'workflow', url: `${N8N_BASE}/9N4DwvjLk6WsJm64` },
          { id: 'Acllbvk5jMEMDzd7', name: 'TOOL Listar Categorias', status: 'on', type: 'workflow', url: `${N8N_BASE}/Acllbvk5jMEMDzd7` },
        ],
      },
      {
        id: 'adm-contratos',
        name: 'Contratos',
        description: 'Assinaturas, termos, notificacoes',
        items: [
          { id: 'MbrVQwBB0xGhvTNn', name: 'Webhook Notif Assinatura Autentique', status: 'on', type: 'workflow', url: `${N8N_BASE}/MbrVQwBB0xGhvTNn` },
          { id: 'SmoFdsRzMUcWUkGf', name: 'Webhook Follow-up Contrato Visualizado', status: 'on', type: 'workflow', url: `${N8N_BASE}/SmoFdsRzMUcWUkGf` },
          { id: '1AyAvl2oQEa1v2mW', name: 'TOOL Atualizar Termos Contrato', status: 'on', type: 'workflow', url: `${N8N_BASE}/1AyAvl2oQEa1v2mW` },
          { id: 'GAmDsrgHzVowt0nk', name: 'TOOL Buscar Contrato Pendente', status: 'on', type: 'workflow', url: `${N8N_BASE}/GAmDsrgHzVowt0nk` },
        ],
      },
      {
        id: 'adm-relatorios',
        name: 'Relatorios',
        description: 'Dashboards, reports automaticos',
        items: [
          { id: 'Klsr9cIB9rAOp9na', name: 'Relatorio Diario com IA', status: 'on', type: 'workflow', url: `${N8N_BASE}/Klsr9cIB9rAOp9na` },
          { id: 'FeQO7Sq5aYiTGs3k', name: 'Relatorio Semanal Automatico', status: 'on', type: 'workflow', url: `${N8N_BASE}/FeQO7Sq5aYiTGs3k` },
        ],
      },
    ],
  },

  // =============================================
  // 4. OPERACOES
  // =============================================
  {
    id: 'operacoes',
    name: 'Operacoes',
    icon: 'Settings',
    color: '#8b5cf6',
    subSectors: [
      {
        id: 'ops-infra',
        name: 'Infraestrutura',
        description: 'Webhooks, API keys, monitoramento',
        resources: [
          { label: 'n8n Dashboard', url: 'https://cliente-a1.mentorfy.io', type: 'dashboard' },
          { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard/project/bfumywvwubvernvhjehk', type: 'dashboard' },
          { label: 'Vercel Dashboard', url: 'https://vercel.com/marcosdanielsfs-projects', type: 'dashboard' },
        ],
        items: [
          { id: '8qpJIw2XLPgUIXXV', name: 'Webhook Receber API Key GHL v2', status: 'on', type: 'workflow', url: `${N8N_BASE}/8qpJIw2XLPgUIXXV` },
          { id: 'PGUacHDx4ZQ9IdUi', name: 'Webhook Receber API Key Sub-conta', status: 'on', type: 'workflow', url: `${N8N_BASE}/PGUacHDx4ZQ9IdUi` },
          { id: '8LOqlwmi1ZMnt3ge', name: 'Error Analyzer Daily', status: 'on', type: 'workflow', url: `${N8N_BASE}/8LOqlwmi1ZMnt3ge` },
          { id: 'ApYGjZg8sQ5rp8Fg', name: 'MIS - Workflow Unificado', status: 'on', type: 'workflow', url: `${N8N_BASE}/ApYGjZg8sQ5rp8Fg` },
          { id: 'GWKl5KuXAdeu4BLr', name: 'TOOL Registrar Custo IA', status: 'on', type: 'workflow', url: `${N8N_BASE}/GWKl5KuXAdeu4BLr` },
        ],
      },
      {
        id: 'ops-integracoes',
        name: 'Integracoes',
        description: 'Sync GHL, Kommo, calendarios',
        items: [
          { id: 'GASiiAHeSwjLu5Hr', name: 'Sync GHL Calendar + Funil (4h)', status: 'on', type: 'workflow', url: `${N8N_BASE}/GASiiAHeSwjLu5Hr` },
          { id: 'FfyhRU0ELkdne2kQ', name: 'Atualizar Nome GHL', status: 'on', type: 'workflow', url: `${N8N_BASE}/FfyhRU0ELkdne2kQ` },
          { id: '3Dd8d5AnpD4iLPwG', name: 'Atualizar Work Permit GHL', status: 'on', type: 'workflow', url: `${N8N_BASE}/3Dd8d5AnpD4iLPwG` },
          { id: '2DSxgXqcSLJdUVAJ', name: 'Ativar/Desativar IA', status: 'on', type: 'workflow', url: `${N8N_BASE}/2DSxgXqcSLJdUVAJ` },
          { id: 'Kq3b79P6v4rTsiaH', name: 'Atualizar Campo Profissao GHL', status: 'on', type: 'workflow', url: `${N8N_BASE}/Kq3b79P6v4rTsiaH` },
          { id: 'E5IoqSiDWQehy0mN', name: 'GHL Agent AI - Browser Automation', status: 'on', type: 'workflow', url: `${N8N_BASE}/E5IoqSiDWQehy0mN` },
          { id: 'BObn39eEN9pt4GyU', name: 'KOMMO Atualizar Lead BRL', status: 'on', type: 'workflow', url: `${N8N_BASE}/BObn39eEN9pt4GyU` },
        ],
      },
      {
        id: 'ops-core',
        name: 'Core Platform',
        description: 'Multi-tenant, bases, templates',
        items: [
          { id: 'BtHmCsdr4fNaqnyR', name: 'Core IA Vertical', status: 'on', type: 'workflow', url: `${N8N_BASE}/BtHmCsdr4fNaqnyR`, tags: ['ai-vertical'] },
          { id: 'AfVNiiQWzrNl5lV0', name: 'FLUXO BASE PARA DUPLICAR', status: 'on', type: 'workflow', url: `${N8N_BASE}/AfVNiiQWzrNl5lV0` },
          { id: 'APp0EGpUKYMM8l3R', name: 'Templates Secretaria', status: 'on', type: 'workflow', url: `${N8N_BASE}/APp0EGpUKYMM8l3R` },
          { id: '26CfRoE4UWP0iro5', name: 'Templates Secretaria BASE', status: 'on', type: 'workflow', url: `${N8N_BASE}/26CfRoE4UWP0iro5` },
          { id: 'MbnnPwrQTXyfjral', name: 'GHL MCP Compartilhado', status: 'on', type: 'workflow', url: `${N8N_BASE}/MbnnPwrQTXyfjral` },
          { id: 'OHWo0XHrM4UsGY2D', name: 'Memory - Save Message', status: 'on', type: 'workflow', url: `${N8N_BASE}/OHWo0XHrM4UsGY2D` },
          { id: 'NgTu1UJSXg2ec1P7', name: 'Memory - Get Context', status: 'on', type: 'workflow', url: `${N8N_BASE}/NgTu1UJSXg2ec1P7` },
          { id: '8yJHn2tVA40IzIf2', name: 'Memory - Recent Messages', status: 'on', type: 'workflow', url: `${N8N_BASE}/8yJHn2tVA40IzIf2` },
          { id: '5yeeIUJ579RjHgPb', name: 'Segundo Cerebro RAG', status: 'on', type: 'workflow', url: `${N8N_BASE}/5yeeIUJ579RjHgPb` },
        ],
      },
    ],
  },

  // =============================================
  // 5. AI FACTORY
  // =============================================
  {
    id: 'ai-factory',
    name: 'AI Factory',
    icon: 'Bot',
    color: '#ec4899',
    subSectors: [
      {
        id: 'aif-agentes',
        name: 'Agentes',
        description: 'Criacao, deploy, prompt engineering',
        resources: [
          { label: 'AI Factory Dashboard', url: 'https://factorai.mottivme.com.br', type: 'dashboard' },
          { label: 'Prompts (GitHub)', url: 'https://github.com/marcosdanielsf', type: 'repo' },
        ],
        items: [
          { id: 'EZpjk44KyqUl4Hr3', name: 'Agent Factory', status: 'on', type: 'workflow', url: `${N8N_BASE}/EZpjk44KyqUl4Hr3` },
          { id: '6bxWFVjazfMTHftU', name: 'Agent Creator', status: 'on', type: 'workflow', url: `${N8N_BASE}/6bxWFVjazfMTHftU` },
          { id: '4EN4UGoPgJB69ec6', name: 'Engenheiro de Prompt', status: 'on', type: 'workflow', url: `${N8N_BASE}/4EN4UGoPgJB69ec6` },
          { id: 'Km0WkzCE4JsZe5tD', name: 'Engenheiro de Prompt v2', status: 'on', type: 'workflow', url: `${N8N_BASE}/Km0WkzCE4JsZe5tD` },
          { id: '72FSNqvPRh6H4ftw', name: 'Tool Call - Anthropic Prompt Engineer', status: 'on', type: 'workflow', url: `${N8N_BASE}/72FSNqvPRh6H4ftw` },
          { id: 'SOpdKx80r2LEoozR', name: 'Tool Call - OpenAI Prompt Engineer', status: 'on', type: 'workflow', url: `${N8N_BASE}/SOpdKx80r2LEoozR` },
          { id: '6JeEKeVISMwQDYfS', name: 'Tool Call - Other Models', status: 'on', type: 'workflow', url: `${N8N_BASE}/6JeEKeVISMwQDYfS` },
        ],
      },
      {
        id: 'aif-qualidade',
        name: 'Qualidade',
        description: 'Avaliacao, reflection, improver',
        items: [
          { id: 'PPCUBxwmb83neDet', name: 'Reflection Loop', status: 'on', type: 'workflow', url: `${N8N_BASE}/PPCUBxwmb83neDet` },
          { id: 'O9NpJ33LSL08zUdn', name: 'Improver Semanal', status: 'on', type: 'workflow', url: `${N8N_BASE}/O9NpJ33LSL08zUdn` },
          { id: 'OZUPCf0nolzpgSp2', name: 'Detectar No-Shows (Attendance Tracker)', status: 'on', type: 'workflow', url: `${N8N_BASE}/OZUPCf0nolzpgSp2` },
        ],
      },
      {
        id: 'aif-donna-wendy',
        name: 'Donna Wendy (Life OS)',
        description: 'Gestao de vida, briefing, check-in, lembretes, behavior tracking',
        resources: [
          { label: 'Donna Wendy App', url: 'https://donna-wendy.vercel.app', type: 'dashboard' },
          { label: 'GitHub Repo', url: 'https://github.com/marcosdanielsf/donna-wendy', type: 'repo' },
        ],
        items: [
          { id: 'ObseW87cNpRDdAFv', name: 'Morning Briefing (7h)', status: 'off', type: 'workflow', url: `${N8N_BASE}/ObseW87cNpRDdAFv`, tags: ['Donna Wendy'], description: 'Puxa tasks P0/P1, habitos, calendario e gera briefing matinal' },
          { id: 'BvOqK49zqODHXVog', name: 'Check-in Analyzer (10h/14h/16h)', status: 'off', type: 'workflow', url: `${N8N_BASE}/BvOqK49zqODHXVog`, tags: ['Donna Wendy'], description: 'Analisa tasks atrasadas e em progresso, gera alertas' },
          { id: 'y2N3k53Vtv5WjdPP', name: 'Agents Monitor (15min)', status: 'off', type: 'workflow', url: `${N8N_BASE}/y2N3k53Vtv5WjdPP`, tags: ['Donna Wendy'], description: 'Monitora status dos agentes SDR/bots a cada 15min' },
          { id: 'U7z13GXHwThUHDQA', name: 'Evening Report (20h)', status: 'off', type: 'workflow', url: `${N8N_BASE}/U7z13GXHwThUHDQA`, tags: ['Donna Wendy'], description: 'Relatorio do dia: tasks concluidas, score, sugestoes' },
          { id: 'ahWhFNhi9408xlH8', name: 'Behavior Tracker (Webhook)', status: 'off', type: 'workflow', url: `${N8N_BASE}/ahWhFNhi9408xlH8`, tags: ['Donna Wendy'], description: 'Webhook para logar atividades (deep_work, meeting, social_media, etc)' },
          { id: '7fTSlNsdwbR8PbQF', name: 'Briefing Matinal (API)', status: 'off', type: 'workflow', url: `${N8N_BASE}/7fTSlNsdwbR8PbQF`, tags: ['Donna Wendy'], description: 'Gera briefing via DONNA API endpoint' },
          { id: 'W8BwYWTGrVAQINFk', name: 'Google Calendar Sync (15min)', status: 'off', type: 'workflow', url: `${N8N_BASE}/W8BwYWTGrVAQINFk`, tags: ['Donna Wendy'], description: 'Sincroniza eventos do Google Calendar com Supabase' },
          { id: 'BeYOP0TxK97Bdleb', name: 'Enviar Lembretes (1min)', status: 'off', type: 'workflow', url: `${N8N_BASE}/BeYOP0TxK97Bdleb`, tags: ['Donna Wendy'], description: 'Verifica lembretes pendentes e envia notificacoes' },
        ],
      },
    ],
  },

  // =============================================
  // 6. CLIENTES
  // =============================================
  {
    id: 'clientes',
    name: 'Clientes',
    icon: 'Users',
    color: '#06b6d4',
    subSectors: [
      {
        id: 'cli-otica',
        name: 'Otica Lumar',
        description: 'Crons automaticos',
        items: [
          { id: '1ulgREwSb4SeFOAA', name: 'Cron Garantia Vencendo v1', status: 'on', type: 'workflow', url: `${N8N_BASE}/1ulgREwSb4SeFOAA` },
          { id: 'KIWNriKpzAGWdYBr', name: 'Cron Lembrete Troca de Grau v1', status: 'on', type: 'workflow', url: `${N8N_BASE}/KIWNriKpzAGWdYBr` },
          { id: '3ZPKKzrMThKifrni', name: 'Cron Recompra Lente de Contato v1', status: 'on', type: 'workflow', url: `${N8N_BASE}/3ZPKKzrMThKifrni` },
        ],
      },
      {
        id: 'cli-fernanda',
        name: 'Fernanda Leal',
        description: 'Guru + WhatsApp',
        items: [
          { id: 'NOw7NAbmgfRt7xe2', name: 'Guru → WhatsApp Acesso Curso', status: 'on', type: 'workflow', url: `${N8N_BASE}/NOw7NAbmgfRt7xe2` },
        ],
      },
      {
        id: 'cli-geral',
        name: 'Multi-Cliente',
        description: 'Agendamentos, secretaria, scheduler',
        items: [
          { id: 'Pe2qCr7YxWxZHtnt', name: 'Agentes IA Scheduler', status: 'on', type: 'workflow', url: `${N8N_BASE}/Pe2qCr7YxWxZHtnt` },
          { id: 'F2hV1OM411vlI9vI', name: 'Secretaria v3', status: 'on', type: 'workflow', url: `${N8N_BASE}/F2hV1OM411vlI9vI` },
          { id: 'K2T5oJMpZs4emU2s', name: 'Socialfy Busca Disponibilidade v3', status: 'on', type: 'workflow', url: `${N8N_BASE}/K2T5oJMpZs4emU2s` },
          { id: 'SroUvO1R00hTuwrQ', name: 'Atualizar Agendamento', status: 'on', type: 'workflow', url: `${N8N_BASE}/SroUvO1R00hTuwrQ` },
          { id: 'C4xd2H1a19LXv5PW', name: 'Desmarcar e Enviar Alerta', status: 'on', type: 'workflow', url: `${N8N_BASE}/C4xd2H1a19LXv5PW` },
          { id: 'FFoIuOSCIaccWTse', name: 'TOOL Agendar Follow-up Futuro', status: 'on', type: 'workflow', url: `${N8N_BASE}/FFoIuOSCIaccWTse` },
          { id: 'RtgpAYdMwT8GCnBr', name: 'Escalar Humano (FazerAI)', status: 'on', type: 'workflow', url: `${N8N_BASE}/RtgpAYdMwT8GCnBr` },
        ],
      },
    ],
  },
];

// Helpers
export const getTotalWorkflows = (sector: Sector): number =>
  sector.subSectors.reduce((acc, sub) => acc + sub.items.length, 0);

export const getActiveWorkflows = (sector: Sector): number =>
  sector.subSectors.reduce(
    (acc, sub) => acc + sub.items.filter((i) => i.status === 'on').length,
    0
  );

export const getAllItems = (): WorkflowItem[] =>
  sectors.flatMap((s) => s.subSectors.flatMap((sub) => sub.items));
