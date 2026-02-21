// ============================================
// CATALOGO DE SKILLS CLAUDE CODE — MOTTIVME
// Categorizado por setor/subsetor
// ============================================

export interface SkillItem {
  slug: string;
  nome: string;
  descricao: string;
  keywords: string[];
}

export interface SkillSector {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  skills: SkillItem[];
}

export const skillSectors: SkillSector[] = [
  {
    id: 'vendas',
    nome: 'Vendas',
    icone: 'Target',
    cor: '#ef4444',
    skills: [
      { slug: 'pre-vendas-qualificacao-bant', nome: 'Pre-Vendas BANT', descricao: 'Qualificacao de leads usando framework BANT para vendas high-ticket', keywords: ['BANT', 'qualificacao', 'SDR', 'pre-vendas'] },
      { slug: 'tratamento-objecoes-vendas', nome: 'Tratamento de Objecoes', descricao: 'Tecnicas para contornar objecoes em vendas high-ticket', keywords: ['objecoes', 'vendas', 'contorno'] },
      { slug: 'copywriting-sexy-canvas', nome: 'Copywriting Sexy Canvas', descricao: 'Framework de vendas high-ticket para copy persuasivo e de conversao', keywords: ['copywriting', 'canvas', 'persuasao'] },
      { slug: 'sales-skills-package', nome: 'Sales Skills Package', descricao: 'Conjunto completo de 4 skills de vendas consultivas (BANT, SPIN, Sexy Canvas, Charlie Morgan)', keywords: ['vendas', 'BANT', 'SPIN', 'B2B'] },
      { slug: 'operacao-sdr-high-performance', nome: 'Operacao SDR High Performance', descricao: 'Sistema de operacao SDR/BDR com automacao n8n, protocolos de concierge e recovery de no-shows', keywords: ['SDR', 'BDR', 'concierge', 'no-show'] },
      { slug: 'sdr-bot-optimizer', nome: 'SDR Bot Optimizer', descricao: 'Otimizacao de bots SDR: testes A/B, scripts persuasivos e sequencias de follow-up', keywords: ['SDR', 'bot', 'A/B', 'follow-up'] },
      { slug: 'conversational-influence', nome: 'Conversational Influence', descricao: 'Influencia conversacional combinando Carnegie, NEPQ, AIDA, PAS e BANT', keywords: ['influencia', 'Carnegie', 'NEPQ', 'BANT'] },
      { slug: 'idea-validator', nome: 'Idea Validator', descricao: 'Avaliacao brutal e honesta de ideias de produto/app antes de construir', keywords: ['validacao', 'ideia', 'produto', 'MVP'] },
      { slug: 'launch-planner', nome: 'Launch Planner', descricao: 'Transforma ideias de app em MVPs shipaveis usando abordagem lean', keywords: ['launch', 'MVP', 'lancamento', 'lean'] },
      { slug: 'roadmap-builder', nome: 'Roadmap Builder', descricao: 'Framework de priorizacao focado no usuario para decidir o que construir a seguir', keywords: ['roadmap', 'priorizacao', 'backlog'] },
    ],
  },
  {
    id: 'marketing',
    nome: 'Marketing',
    icone: 'Megaphone',
    cor: '#f59e0b',
    skills: [
      { slug: 'mkt-copywriting', nome: 'MKT Copywriting', descricao: 'Copy de conversao para paginas de marketing: homepage, landing, pricing, features', keywords: ['copy', 'landing page', 'headline', 'CTA'] },
      { slug: 'mkt-page-cro', nome: 'MKT Page CRO', descricao: 'Analise e otimizacao de paginas em 7 dimensoes de CRO com hipoteses A/B', keywords: ['CRO', 'conversao', 'A/B', 'otimizacao'] },
      { slug: 'mkt-social-content', nome: 'MKT Social Content', descricao: 'Conteudo para Instagram e LinkedIn: posts, Reels, carrosseis, Stories e calendario editorial', keywords: ['social media', 'Instagram', 'LinkedIn', 'carrossel'] },
      { slug: 'mkt-email-sequence', nome: 'MKT Email Sequence', descricao: 'Sequencias de email automatizadas (welcome, trial, nurturing, reengajamento)', keywords: ['email', 'sequencia', 'nurturing', 'drip'] },
      { slug: 'mkt-marketing-ideas', nome: 'MKT Marketing Ideas', descricao: 'Biblioteca de 139+ ideias de marketing por categoria, orcamento e timeline', keywords: ['ideias', 'marketing', 'campanha', 'brainstorm'] },
      { slug: 'marketing-writer', nome: 'Marketing Writer', descricao: 'Escrita de conteudo de marketing casual, direto e focado em beneficios', keywords: ['marketing', 'escrita', 'conteudo', 'copy'] },
      { slug: 'product-marketing-context', nome: 'Product Marketing Context', descricao: 'Arquivo de contexto de produto com posicionamento, mensagens, ICP e proposta de valor', keywords: ['posicionamento', 'ICP', 'proposta de valor'] },
      { slug: 'email-composer', nome: 'Email Composer', descricao: 'Redacao de emails profissionais para negocios, tecnico e atendimento', keywords: ['email', 'profissional', 'comunicacao'] },
      { slug: 'helper-agents-vsl-video', nome: 'Helper Agents VSL & Video', descricao: 'Scripts de video, VSL, Loom e instrucoes de gravacao baseados em Charlie Morgan', keywords: ['VSL', 'video', 'script', 'Loom'] },
      { slug: 'internal-comms', nome: 'Internal Comms', descricao: 'Comunicacoes internas: status reports, updates de lideranca, newsletters', keywords: ['comunicacao interna', 'status report', 'newsletter'] },
    ],
  },
  {
    id: 'agentes-ia',
    nome: 'Agentes IA',
    icone: 'Bot',
    cor: '#ec4899',
    skills: [
      { slug: 'agent-factory-unified', nome: 'Agent Factory Unified', descricao: 'Skill unificada v2.0 para criar agentes SDR completos com JSONB', keywords: ['agente', 'SDR', 'factory', 'CRITICS'] },
      { slug: 'agent-factory-v2', nome: 'Agent Factory v2', descricao: 'Sistema de criacao de agentes SDR com Neurovendas, Carnegie, SPIN e Social Selling', keywords: ['agente', 'SDR', 'neurovendas', 'SPIN'] },
      { slug: 'agent-factory-complete', nome: 'Agent Factory Complete', descricao: 'Criacao de agentes SDR completos com todos os campos JSONB e scripts Python', keywords: ['agente', 'SDR', 'JSONB', 'Python'] },
      { slug: 'agent-creator-sdr', nome: 'Agent Creator SDR', descricao: 'Criacao de agentes SDR multi-modo com 9 modos PBM', keywords: ['agente', 'SDR', 'multi-modo', 'PBM'] },
      { slug: 'agent-creator-medico', nome: 'Agent Creator Medico', descricao: 'Criacao de agentes para clinicas e consultorios medicos', keywords: ['agente', 'medico', 'clinica', 'saude'] },
      { slug: 'agent-mode-manager', nome: 'Agent Mode Manager', descricao: 'Gerenciamento de modos de agentes SDR: criacao, edicao e transicao', keywords: ['agente', 'modo', 'PBM', 'transicao'] },
      { slug: 'agent-auto-improver', nome: 'Agent Auto Improver', descricao: 'Sistema de auto-melhoria de agentes SDR com ciclo de analise e otimizacao', keywords: ['agente', 'auto-melhoria', 'otimizacao'] },
      { slug: 'n8n-prompt-engineer', nome: 'N8N Prompt Engineer', descricao: 'Engenharia de prompts para agentes n8n usando framework CRITICS', keywords: ['prompt', 'CRITICS', 'n8n', 'engenharia'] },
      { slug: 'conversational-bot-prompt-engineer', nome: 'Conversational Bot Prompt', descricao: 'Prompts para bots conversacionais usando Protocolo do Prompt Foda com GHL e n8n', keywords: ['prompt', 'bot', 'GHL', 'n8n'] },
      { slug: 'claude-skills-completo', nome: 'Claude Skills Completo', descricao: 'Templates de prompts prontos por industria usando o Protocolo do Prompt Foda', keywords: ['prompt', 'template', 'industria'] },
      { slug: 'mcp-builder', nome: 'MCP Builder', descricao: 'Guia para criar servidores MCP em Python (FastMCP) ou TypeScript', keywords: ['MCP', 'servidor', 'API', 'FastMCP'] },
      { slug: 'skill-creator', nome: 'Skill Creator', descricao: 'Guia para criar e atualizar skills que estendem capacidades do Claude', keywords: ['skill', 'criar', 'extensao'] },
    ],
  },
  {
    id: 'automacao',
    nome: 'Automacao',
    icone: 'Zap',
    cor: '#8b5cf6',
    skills: [
      { slug: 'n8n-workflow-expert', nome: 'N8N Workflow Expert', descricao: 'Construcao de workflows n8n production-ready com agentes de IA e LangChain', keywords: ['n8n', 'workflow', 'automacao', 'LangChain'] },
      { slug: 'n8n-cost-tracking', nome: 'N8N Cost Tracking', descricao: 'Tracking de custo de LLM a workflows n8n via API, integrado com Supabase', keywords: ['n8n', 'custo', 'LLM', 'tracking'] },
      { slug: 'n8n-name-normalization', nome: 'N8N Name Normalization', descricao: 'Normalizacao de nomes: ALL CAPS, Title Case, nomes invalidos e queries SQL', keywords: ['n8n', 'nome', 'normalizacao', 'SQL'] },
      { slug: 'gohighlevel-automation-expert', nome: 'GoHighLevel Automation', descricao: 'Automacoes GHL: workflows, funis, campanhas multi-canal e conversao', keywords: ['GHL', 'GoHighLevel', 'automacao', 'funil'] },
      { slug: 'gohighlevel-mcp', nome: 'GoHighLevel MCP', descricao: 'Integracao completa com GoHighLevel usando servidor MCP oficial', keywords: ['GHL', 'MCP', 'integracao'] },
      { slug: 'ghl-api-live-sync', nome: 'GHL API Live Sync', descricao: 'Sincronizacao e acesso a documentacao da API do GoHighLevel em tempo real', keywords: ['GHL', 'API', 'sync', 'documentacao'] },
      { slug: 'api-integration-specialist', nome: 'API Integration Specialist', descricao: 'Integracoes enterprise-grade: rate limiting, retry, OAuth/JWT, webhooks', keywords: ['API', 'webhook', 'OAuth', 'JWT', 'enterprise'] },
      { slug: 'agent-browser', nome: 'Agent Browser', descricao: 'Automacao de browser: navegar, preencher formularios, capturar screenshots', keywords: ['browser', 'automacao', 'Playwright', 'scraping'] },
    ],
  },
  {
    id: 'desenvolvimento',
    nome: 'Desenvolvimento',
    icone: 'Code',
    cor: '#3b82f6',
    skills: [
      { slug: 'supabase-postgres-expert', nome: 'Supabase Postgres Expert', descricao: 'Design de banco Supabase/PostgreSQL: RLS, performance, schemas e seguranca', keywords: ['Supabase', 'PostgreSQL', 'RLS', 'schema'] },
      { slug: 'database-performance-tuner', nome: 'Database Performance Tuner', descricao: 'Otimizacao de performance: queries lentas, indexacao e bottlenecks', keywords: ['banco', 'performance', 'query', 'indexacao'] },
      { slug: 'frontend-design', nome: 'Frontend Design', descricao: 'Interfaces production-grade com React, Tailwind, dashboards e landing pages', keywords: ['frontend', 'React', 'Tailwind', 'UI'] },
      { slug: 'artifacts-builder', nome: 'Artifacts Builder', descricao: 'Artefatos HTML multi-componente com React, Tailwind CSS e shadcn/ui', keywords: ['artefato', 'React', 'Tailwind', 'shadcn'] },
      { slug: 'webapp-testing', nome: 'Webapp Testing', descricao: 'Teste de apps web com Playwright: verificacao de UI, debug e screenshots', keywords: ['teste', 'Playwright', 'webapp', 'debug'] },
      { slug: 'web-design-guidelines', nome: 'Web Design Guidelines', descricao: 'Revisao de UI para conformidade com guidelines de interface e acessibilidade', keywords: ['UI', 'guidelines', 'acessibilidade', 'UX'] },
      { slug: 'design-guide', nome: 'Design Guide', descricao: 'Guia para construir UIs modernas e profissionais com principios de design limpo', keywords: ['design', 'UI', 'moderno', 'principios'] },
      { slug: 'git-commit-helper', nome: 'Git Commit Helper', descricao: 'Gera mensagens de commit descritivas analisando git diffs', keywords: ['git', 'commit', 'mensagem', 'diff'] },
      { slug: 'remotion-best-practices', nome: 'Remotion Best Practices', descricao: 'Melhores praticas para criacao de videos em React usando Remotion', keywords: ['Remotion', 'video', 'React', 'animacao'] },
    ],
  },
  {
    id: 'design-brand',
    nome: 'Design & Brand',
    icone: 'Palette',
    cor: '#14b8a6',
    skills: [
      { slug: 'brandpack-generator', nome: 'Brandpack Generator', descricao: 'Gera brandpack completo (156+ arquivos) para novos clientes', keywords: ['brand', 'brandpack', 'identidade visual'] },
      { slug: 'brand-guidelines', nome: 'Brand Guidelines', descricao: 'Aplica cores e tipografia oficiais da marca a artefatos visuais', keywords: ['brand', 'cores', 'tipografia', 'identidade'] },
      { slug: 'theme-factory', nome: 'Theme Factory', descricao: '10 temas pre-definidos para estilizar slides, docs e landing pages', keywords: ['tema', 'cores', 'fontes', 'estilo'] },
      { slug: 'canvas-design', nome: 'Canvas Design', descricao: 'Arte visual original em .png e .pdf: posters, designs e pecas estaticas', keywords: ['design', 'poster', 'arte', 'visual'] },
      { slug: 'algorithmic-art', nome: 'Algorithmic Art', descricao: 'Arte algoritmica com p5.js: randomicidade, campos de fluxo e particulas', keywords: ['arte', 'algoritmo', 'p5.js', 'generativo'] },
      { slug: 'slack-gif-creator', nome: 'Slack GIF Creator', descricao: 'GIFs animados otimizados para Slack com validadores de tamanho', keywords: ['GIF', 'Slack', 'animacao', 'emoji'] },
    ],
  },
  {
    id: 'documentos',
    nome: 'Documentos',
    icone: 'FileText',
    cor: '#6366f1',
    skills: [
      { slug: 'pdf-anthropic', nome: 'PDF Toolkit', descricao: 'Manipulacao de PDFs: extracao de texto, criacao, merge/split e formularios', keywords: ['PDF', 'extracao', 'merge', 'formulario'] },
      { slug: 'pdf-processing-pro', nome: 'PDF Processing Pro', descricao: 'Processamento PDF production-ready com OCR, tabelas e operacoes em lote', keywords: ['PDF', 'OCR', 'tabela', 'batch'] },
      { slug: 'docx', nome: 'DOCX Editor', descricao: 'Criacao e edicao de documentos .docx com tracked changes e formatacao', keywords: ['docx', 'Word', 'documento', 'formatacao'] },
      { slug: 'pptx', nome: 'PPTX Editor', descricao: 'Criacao e edicao de apresentacoes .pptx com layouts e speaker notes', keywords: ['pptx', 'PowerPoint', 'apresentacao', 'slide'] },
      { slug: 'xlsx', nome: 'XLSX Editor', descricao: 'Planilhas .xlsx/.csv: formulas, formatacao, analise de dados e graficos', keywords: ['xlsx', 'Excel', 'planilha', 'formula'] },
      { slug: 'doc-coauthoring', nome: 'Doc Coauthoring', descricao: 'Co-autoria de documentacao, propostas, specs tecnicas e decision docs', keywords: ['documentacao', 'proposta', 'spec', 'co-autoria'] },
    ],
  },
  {
    id: 'sistema',
    nome: 'Sistema',
    icone: 'Settings',
    cor: '#71717a',
    skills: [
      { slug: 'my-context', nome: 'My Context', descricao: 'Garante que Claude consulte o arquivo de contexto pessoal', keywords: ['contexto', 'pessoal', 'perfil'] },
      { slug: 'find-skills', nome: 'Find Skills', descricao: 'Descobre e instala skills de agentes para questoes especificas', keywords: ['skills', 'descobrir', 'instalar', 'busca'] },
    ],
  },
];

export const getTotalSkills = (): number =>
  skillSectors.reduce((acc, s) => acc + s.skills.length, 0);

export const getSkillsBySector = (sectorId: string): SkillItem[] =>
  skillSectors.find((s) => s.id === sectorId)?.skills || [];
