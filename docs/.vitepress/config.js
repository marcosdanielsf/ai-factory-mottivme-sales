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
      { text: 'Arquitetura', link: '/arquitetura' },
      { text: 'Workflows', link: '/workflows/' },
      { text: 'Banco de Dados', link: '/banco-de-dados' },
      { text: 'Deploy', link: '/deploy' }
    ],

    sidebar: [
      {
        text: 'Introducao',
        items: [
          { text: 'Visao Geral', link: '/' },
          { text: 'Arquitetura', link: '/arquitetura' },
          { text: 'Diagrama de Fluxos', link: '/diagrama' }
        ]
      },
      {
        text: 'Workflows',
        items: [
          { text: 'Resumo', link: '/workflows/' },
          { text: '01 - Organizador Calls', link: '/workflows/01-organizador-calls' },
          { text: '02 - Head de Vendas', link: '/workflows/02-head-vendas' },
          { text: '03 - Call Analyzer Onboarding', link: '/workflows/03-call-analyzer' },
          { text: '05 - Execution Modular', link: '/workflows/05-execution' },
          { text: '07 - Engenheiro de Prompt', link: '/workflows/07-engenheiro' },
          { text: '08 - Boot Validator', link: '/workflows/08-validator' },
          { text: '09 - QA Analyst', link: '/workflows/09-qa-analyst' }
        ]
      },
      {
        text: 'Configuracao',
        items: [
          { text: 'Banco de Dados', link: '/banco-de-dados' },
          { text: 'Modos de Agente', link: '/modos' },
          { text: 'Hiperpersonalizacao', link: '/hiperpersonalizacao' },
          { text: 'Deploy', link: '/deploy' }
        ]
      }
    ],

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