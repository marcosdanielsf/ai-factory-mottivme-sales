import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AI Factory V3',
  description: 'Documentacao do Sistema de Agentes IA - Mottivme Sales',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Arquitetura', link: '/arquitetura/' },
      { text: 'Workflows', link: '/workflows/' },
      { text: 'Guias', link: '/guias/' },
      { text: 'Processos', link: '/processos/' },
      { text: 'Integracoes', link: '/integracoes/asaas-n8n' },
      { text: 'Planos', link: '/planos/' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Introducao',
          items: [
            { text: 'Visao Geral', link: '/' },
            { text: 'Arquitetura', link: '/arquitetura/' },
            { text: 'Diagrama de Fluxos', link: '/arquitetura/diagrama' },
            { 
              text: 'Cold Call Bot', 
              collapsed: true,
              items: [
                { text: 'Visão Geral', link: '/arquitetura/cold-call-bot/' },
                { text: 'Pipeline de Voz', link: '/arquitetura/cold-call-bot/pipeline' },
                { text: 'Processo de Construção', link: '/arquitetura/cold-call-bot/processo' },
                { text: 'Metodologia', link: '/arquitetura/cold-call-bot/metodologia' },
                { text: 'Reengenharia Reversa', link: '/arquitetura/cold-call-bot/reengenharia-reversa' },
                { text: 'Troubleshooting', link: '/arquitetura/cold-call-bot/troubleshooting' }
              ]
            }
          ]
        },
        {
          text: 'Workflows n8n',
          collapsed: false,
          items: [
            { text: 'Resumo', link: '/workflows/' },
            { text: '01 - Organizador Calls', link: '/workflows/01-organizador-calls' },
            { text: '02 - Head de Vendas', link: '/workflows/02-head-vendas' },
            { text: '03 - Call Analyzer', link: '/workflows/03-call-analyzer' },
            { text: '04 - Agent Factory', link: '/workflows/04-agent-factory' },
            { text: '05 - Execution Modular', link: '/workflows/05-execution' },
            { text: '06 - Call Analyzer Revisao', link: '/workflows/06-call-revisao' },
            { text: '07 - Engenheiro Prompt', link: '/workflows/07-engenheiro' },
            { text: '08 - QA Analyst', link: '/workflows/08-qa-analyst' },
            { text: '09 - Reflection Loop', link: '/workflows/09-reflection' },
            { text: '10 - AI as Judge', link: '/workflows/10-judge' },
            { text: '11 - Prompt Updater', link: '/workflows/11-updater' },
            { text: '12 - Multi-Tenant Classifier', link: '/workflows/12-classifier' },
            { text: '13 - Feedback Loop', link: '/workflows/13-feedback' }
          ]
        },
        {
          text: 'Guias',
          collapsed: false,
          items: [
            { text: 'Engenharia de Prompts Modulares', link: '/guias/engenharia-prompts-modulares' },
            { text: 'Self-Improving', link: '/guias/self-improving' },
            { text: 'Teste E2E', link: '/guias/teste-e2e' },
            { text: 'Roadmap Features', link: '/planos/roadmap' }
          ]
        },
        {
          text: 'Analises',
          collapsed: true,
          items: [
            { text: 'Head de Vendas V2', link: '/analises/head-vendas' },
            { text: 'Comparacao Agentios', link: '/analises/comparacao' },
            { text: 'Dissecacao Fluxo GHL', link: '/analises/dissecacao-ghl' }
          ]
        },
        {
          text: 'Relatorios',
          collapsed: true,
          items: [
            { text: 'Resumo Executivo', link: '/relatorios/resumo' },
            { text: 'Status Agentes', link: '/relatorios/status' }
          ]
        },
        {
          text: 'Processos',
          collapsed: false,
          items: [
            { text: 'Backup Supabase Automatico', link: '/processos/backup-supabase-automatico' },
            { text: 'Catalogo', link: '/processos/' }
          ]
        },
        {
          text: 'Integracoes',
          collapsed: false,
          items: [
            { text: 'Asaas + n8n', link: '/integracoes/asaas-n8n' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/marcosdanielsf/ai-factory-mottivme-sales' }
    ],

    footer: {
      message: 'AI Factory V3 - Mottivme Sales',
      copyright: 'Copyright 2025 Marcos Daniels'
    },

    search: {
      provider: 'local'
    }
  }
})