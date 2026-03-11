import React, { useState, useMemo } from 'react';
import {
  Workflow,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
  Circle,
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================

const N8N_BASE_URL = 'https://cliente-a1.mentorfy.io/workflow';

// ============================================
// TYPES
// ============================================

type Score = 'OK' | 'ATENCAO' | 'CRITICO';
type Priority = 'P0' | 'P1';

interface CriticalWorkflow {
  name: string;
  id: string;
  errors: string;
  cause: string;
  priority: Priority;
}

interface WorkflowEntry {
  name: string;
  id: string;
  nodes: number;
  score: Score;
  problem: string;
}

interface GroupData {
  name: string;
  description: string;
  workflows: WorkflowEntry[];
}

interface PatternData {
  title: string;
  count: number;
  affected: string;
  fix: string;
}

interface DeactivationEntry {
  name: string;
  id: string;
  reason: string;
}

// ============================================
// STATIC DATA — REAIS (98 workflows)
// ============================================

const CRITICAL_WORKFLOWS: CriticalWorkflow[] = [
  { name: 'Inserir Lead Insights V2', id: '5N8FB0gBMJwHyMcy', errors: '5/5 erros', cause: 'UNIQUE VIOLATION — scheduler sem verificar duplicatas', priority: 'P0' },
  { name: '01-Organizador-Calls', id: 'Gzkzaav9Yyx8kmpU', errors: '5/5 erros', cause: '403 GHL — token multi-tenant', priority: 'P0' },
  { name: '02-AI-Agent-Head-Vendas-V2', id: 'JiTZQcq7Tt2c5Xol', errors: '5/5 erros', cause: 'Type mismatch IF string vs number', priority: 'P0' },
  { name: 'GHL - Innovat Phone Calls', id: 'LUDLncD12Y2oMkAb', errors: '5/5 erros', cause: 'Node falho nao identificado', priority: 'P0' },
  { name: 'MOTTIVME INTELLIGENCE SYSTEM', id: 'ApYGjZg8sQ5rp8Fg', errors: '5 erros', cause: 'Node sem saida, possivel falha Postgres', priority: 'P0' },
  { name: '05-Escalar para humano', id: '0r0V3ija6EM88T6E', errors: '3 erros', cause: '403 GHL multi-tenant', priority: 'P0' },
  { name: '04-Agent-Factory', id: 'EZpjk44KyqUl4Hr3', errors: '2 erros', cause: 'INSERT sem ON CONFLICT', priority: 'P1' },
  { name: '03-Call-Analyzer-Onboarding', id: 'GEcf6Ke7NJwY9vYl', errors: '2 erros', cause: 'Google Drive 502/503', priority: 'P1' },
  { name: 'VAPI Call Webhook', id: 'BHOpaa1OFvpBe46n', errors: '3 erros', cause: 'Token VAPI expirado', priority: 'P1' },
  { name: 'Atualizar Campo Profissao GHL', id: 'Kq3b79P6v4rTsiaH', errors: '3 erros', cause: 'Hardcode Work Permit', priority: 'P1' },
  { name: 'Atualizar Nome GHL', id: 'FfyhRU0ELkdne2kQ', errors: '5 erros', cause: 'contact_id=null (corrigido)', priority: 'P1' },
  { name: 'Sync GHL Opportunities', id: 'NxQAZPOaQyHUWCd9', errors: '5 erros', cause: 'JA RESOLVIDO — tags fix', priority: 'P1' },
];

const GROUPS: GroupData[] = [
  {
    name: 'Core / Vendas',
    description: 'Pipeline principal de conversacao e IA de vendas',
    workflows: [
      { name: 'Fluxo Principal Conversacao', id: 'HXWGWQFBY4KVfY64', nodes: 185, score: 'ATENCAO', problem: '22 dead ends, 1 desabilitado' },
      { name: 'Mensagem recebida (Classificador 3D)', id: 'IawOpB56MTFoEP3M', nodes: 52, score: 'OK', problem: '' },
      { name: '[ Core ] IA Vertical', id: 'BtHmCsdr4fNaqnyR', nodes: 342, score: 'ATENCAO', problem: '26 desabilitados, 22 dead ends' },
      { name: 'Follow Up Eterno V8', id: '3Yx6JniDrQw4KBCi', nodes: 77, score: 'ATENCAO', problem: '2 erros recentes' },
      { name: 'Multi-Tenant Inbox Classifier', id: '46oXeptAC56D5Hm1', nodes: 22, score: 'OK', problem: '' },
      { name: '05-Escalar para humano', id: '0r0V3ija6EM88T6E', nodes: 12, score: 'CRITICO', problem: '403 GHL multi-tenant' },
      { name: 'Inserir Lead Insights V2', id: '5N8FB0gBMJwHyMcy', nodes: 17, score: 'CRITICO', problem: 'UNIQUE VIOLATION' },
      { name: '01-Organizador-Calls', id: 'Gzkzaav9Yyx8kmpU', nodes: 23, score: 'CRITICO', problem: '403 GHL multi-tenant' },
      { name: '02-AI-Agent-Head-Vendas-V2', id: 'JiTZQcq7Tt2c5Xol', nodes: 31, score: 'CRITICO', problem: 'Type mismatch IF' },
      { name: '03-Call-Analyzer-Onboarding', id: 'GEcf6Ke7NJwY9vYl', nodes: 37, score: 'CRITICO', problem: 'Google Drive 502/503' },
      { name: '04-Agent-Factory', id: 'EZpjk44KyqUl4Hr3', nodes: 17, score: 'CRITICO', problem: 'INSERT sem ON CONFLICT' },
      { name: '07-Engenheiro-de-Prompt', id: 'Km0WkzCE4JsZe5tD', nodes: 24, score: 'OK', problem: '' },
      { name: '## 3. Outbound', id: 'J3KR2jkvspICLEUW', nodes: 50, score: 'ATENCAO', problem: '4 desabilitados, 8 dead ends' },
      { name: 'Feedback Loop Oportunidade', id: 'FdrglHVITLLedhBl', nodes: 15, score: 'OK', problem: '' },
      { name: '17-Agent-Creator', id: '6bxWFVjazfMTHftU', nodes: 20, score: 'OK', problem: '' },
    ],
  },
  {
    name: 'Sync / Data / Tools',
    description: 'Sincronizacao com GHL, ferramentas e sub-workflows',
    workflows: [
      { name: 'Sync GHL Calendar (4h)', id: 'GASiiAHeSwjLu5Hr', nodes: 15, score: 'OK', problem: '' },
      { name: 'Sync GHL Contacts (6h)', id: '1vusNbJNUyrW9o6H', nodes: 8, score: 'ATENCAO', problem: 'fetch() corrigido' },
      { name: 'Sync GHL Opportunities', id: 'NxQAZPOaQyHUWCd9', nodes: 8, score: 'CRITICO', problem: 'tags fix aplicado' },
      { name: '[TOOL] Registrar Custo IA', id: 'GWKl5KuXAdeu4BLr', nodes: 12, score: 'ATENCAO', problem: 'IF Date corrigido' },
      { name: '[TOOL] Agendar Follow-up', id: 'FFoIuOSCIaccWTse', nodes: 7, score: 'OK', problem: '' },
      { name: '[TOOL] Atualizar Termos', id: '1AyAvl2oQEa1v2mW', nodes: 3, score: 'OK', problem: '' },
      { name: '[TOOL] Buscar Contrato', id: 'GAmDsrgHzVowt0nk', nodes: 3, score: 'OK', problem: '' },
      { name: '[TOOL] DRE Simplificado', id: '9N4DwvjLk6WsJm64', nodes: 5, score: 'OK', problem: '' },
      { name: '[TOOL] Listar Categorias', id: 'Acllbvk5jMEMDzd7', nodes: 3, score: 'OK', problem: '' },
      { name: 'TOOL fin_movimentacoes', id: '2b7qY6FV4SksBgXV', nodes: 3, score: 'OK', problem: '' },
      { name: 'Memory - Get Context', id: 'NgTu1UJSXg2ec1P7', nodes: 3, score: 'OK', problem: '' },
      { name: 'Memory - Recent Messages', id: '8yJHn2tVA40IzIf2', nodes: 3, score: 'OK', problem: '' },
      { name: 'Claude Memory UNIFIED TASKS', id: '2CrxwLkhRnUZ3Vp1', nodes: 28, score: 'OK', problem: '' },
      { name: 'Segundo Cerebro RAG', id: '5yeeIUJ579RjHgPb', nodes: 11, score: 'OK', problem: '' },
      { name: 'Webhook Receber API Key GHL', id: '8qpJIw2XLPgUIXXV', nodes: 8, score: 'OK', problem: '' },
      { name: 'Tag Converteu GHL', id: '5Nn3F2cN4gyGij9V', nodes: 3, score: 'OK', problem: '' },
      { name: 'Ativar_desativar_ia', id: '2DSxgXqcSLJdUVAJ', nodes: 7, score: 'OK', problem: '' },
      { name: 'Atualizar Campo Profissao', id: 'Kq3b79P6v4rTsiaH', nodes: 10, score: 'CRITICO', problem: 'hardcode Work Permit' },
      { name: 'Atualizar Nome GHL', id: 'FfyhRU0ELkdne2kQ', nodes: 4, score: 'CRITICO', problem: 'contact_id=null (corrigido)' },
      { name: 'Atualizar Work Permit', id: '3Dd8d5AnpD4iLPwG', nodes: 7, score: 'OK', problem: '' },
    ],
  },
  {
    name: 'Clientes',
    description: 'Agentes e automacoes por cliente',
    workflows: [
      { name: 'Secretaria v3', id: 'F2hV1OM411vlI9vI', nodes: 186, score: 'ATENCAO', problem: '58 desabilitados' },
      { name: 'Agente Administrativo', id: 'KxkNf9CY3wePquie', nodes: 146, score: 'ATENCAO', problem: '1 desabilitado, 0 execucoes' },
      { name: '[ GHL ] Assistencia', id: 'C7ebxqPhve1BX814', nodes: 114, score: 'ATENCAO', problem: '4 desabilitados' },
      { name: 'SDR - Karollayne Paiva', id: 'CkGUMUs8jAQOhPH6', nodes: 96, score: 'ATENCAO', problem: '1 desabilitado' },
      { name: 'SDR - Orthodontic', id: 'L6XpZ8LakLIx6BT4', nodes: 96, score: 'ATENCAO', problem: '1 desabilitado' },
      { name: 'GHL - Innovat Phone Calls', id: 'LUDLncD12Y2oMkAb', nodes: 45, score: 'CRITICO', problem: '5 erros, 0 sucesso' },
      { name: 'GHL Mottivme EUA Teste', id: '1RhjmakM41URsN1K', nodes: 89, score: 'ATENCAO', problem: '6 desabilitados' },
      { name: 'GHL EUA COM REAGENDAMENTO', id: 'HaKICQ2aNNbWZBgB', nodes: 31, score: 'OK', problem: '' },
      { name: 'GHL Agent AI Browser', id: 'E5IoqSiDWQehy0mN', nodes: 16, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'GHL Agent AI Payment', id: 'DctYIhYHlpbTPXzD', nodes: 20, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'Marina Couto 2', id: 'CCKudyBwT2EiUBK8', nodes: 21, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'Milton', id: 'FqRbC9XUFknCfwyY', nodes: 23, score: 'ATENCAO', problem: '1 desabilitado' },
      { name: 'dra gabi', id: 'GZB8zLq9RWHXVi3j', nodes: 15, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'Sofia Financeiro+Contratos', id: '9Y1yFmUJGVszyUSy', nodes: 110, score: 'ATENCAO', problem: '3 triggers desabilitados' },
      { name: 'FLUXO BASE DUPLICAR', id: 'AfVNiiQWzrNl5lV0', nodes: 16, score: 'OK', problem: '' },
      { name: 'TEMPLATES SECRETARIA', id: 'APp0EGpUKYMM8l3R', nodes: 58, score: 'OK', problem: '' },
      { name: 'TEMPLATES SECRETARIA BASE', id: '26CfRoE4UWP0iro5', nodes: 43, score: 'OK', problem: '' },
      { name: '[OTICA] Garantia Vencendo', id: '1ulgREwSb4SeFOAA', nodes: 8, score: 'OK', problem: '' },
      { name: '[OTICA] Troca de Grau', id: 'KIWNriKpzAGWdYBr', nodes: 7, score: 'OK', problem: '' },
      { name: '[OTICA] Recompra Lente', id: '3ZPKKzrMThKifrni', nodes: 7, score: 'ATENCAO', problem: '1 erro 19/02' },
      { name: 'Socialfy Disponibilidade', id: 'K2T5oJMpZs4emU2s', nodes: 7, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'Guru WhatsApp Curso', id: 'NOw7NAbmgfRt7xe2', nodes: 4, score: 'OK', problem: '' },
      { name: 'KOMMO Atualizar Lead', id: 'BObn39eEN9pt4GyU', nodes: 10, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'GHL MCP Compartilhado', id: 'MbnnPwrQTXyfjral', nodes: 3, score: 'ATENCAO', problem: '0 execucoes' },
      { name: 'Psychologist AI v3.3', id: '0BMpGZ1zoJdezZti', nodes: 19, score: 'OK', problem: '' },
    ],
  },
  {
    name: 'Operacional / Financeiro',
    description: 'Financeiro, producao de conteudo e infra',
    workflows: [
      { name: 'Integracao Asaas', id: '45POrWnyU2UR7HjQ', nodes: 59, score: 'OK', problem: '' },
      { name: 'Sistema Cobranca Auto', id: 'AK8gVhwmpdU9Z1Tr', nodes: 16, score: 'OK', problem: '' },
      { name: 'Chat Dashboard Financeiro', id: 'LJ6h1jNhTFQx66ne', nodes: 29, score: 'OK', problem: '' },
      { name: 'Email Parser PDF', id: '7yKPigE1xOXcdQSY', nodes: 44, score: 'ATENCAO', problem: '2 erros, 2 desabilitados' },
      { name: 'Invoice Extractor', id: 'AvczBOL2wMLBuRR7', nodes: 57, score: 'OK', problem: '' },
      { name: 'Invoice Extractor copy', id: '6ICzyTrrI5J9PJQD', nodes: 18, score: 'OK', problem: 'possivel duplicata' },
      { name: 'Webhook Autentique', id: 'MbrVQwBB0xGhvTNn', nodes: 9, score: 'OK', problem: '' },
      { name: 'Gerar Recorrencias Mensais', id: '9IH4sqzQ3uOM65yf', nodes: 9, score: 'OK', problem: '' },
      { name: 'Relatorio Semanal Auto', id: 'FeQO7Sq5aYiTGs3k', nodes: 8, score: 'OK', problem: '' },
      { name: 'Relatorio Diario IA', id: 'Klsr9cIB9rAOp9na', nodes: 12, score: 'OK', problem: '' },
      { name: 'Facebook Ads Daily Report', id: 'LnASPbaM5ptlLiBH', nodes: 126, score: 'ATENCAO', problem: '0 sucessos, token Meta' },
      { name: 'Video Production Pipeline', id: 'BRDVWE7np4p5ZJqe', nodes: 21, score: 'OK', problem: '' },
      { name: 'error-analyzer-daily', id: '8LOqlwmi1ZMnt3ge', nodes: 8, score: 'OK', problem: '' },
      { name: 'MOTTIVME INTELLIGENCE SYSTEM', id: 'ApYGjZg8sQ5rp8Fg', nodes: 19, score: 'CRITICO', problem: '5 erros, node sem saida' },
      { name: 'Monitor Instagram', id: 'M4ecqAzZWl57vgpi', nodes: 6, score: 'OK', problem: '' },
      { name: 'Blog Auto Generator', id: 'I5RRn5xq2hrGSByt', nodes: 8, score: 'OK', problem: '' },
      { name: 'IA MARKEGTING', id: '0eq7VTwySd9qqbZj', nodes: 37, score: 'OK', problem: 'typo, 0 execucoes' },
      { name: 'VAPI Call Webhook', id: 'BHOpaa1OFvpBe46n', nodes: 4, score: 'CRITICO', problem: 'token expirado' },
      { name: 'VAPI GoHighLevel Agendamento', id: 'LhfsFjDvfOto22Rt', nodes: 15, score: 'OK', problem: '' },
      { name: 'Assembly Line Trigger', id: '3rLcjPNxGf5yZsKW', nodes: 3, score: 'OK', problem: '' },
      { name: 'Parte 3 Assembly Line', id: 'FhwLxjkefgY0LoXp', nodes: 8, score: 'OK', problem: '' },
      { name: 'PROPOSTAL Chat Escalation', id: 'JwXxbG3tw2bT7ERl', nodes: 9, score: 'OK', problem: '' },
      { name: 'Busca Historias Contextuais', id: '7NK9QDUxJpoquUFr', nodes: 7, score: 'OK', problem: '' },
      { name: 'Engenheiro de Prompt', id: '4EN4UGoPgJB69ec6', nodes: 21, score: 'OK', problem: '' },
      { name: 'agendando ghl no kommo', id: '7YKG23UuSFOkRBxA', nodes: 16, score: 'OK', problem: '' },
      { name: 'Calculate file hash', id: 'KJGHl53oQm1w7xe4', nodes: 3, score: 'OK', problem: '' },
      { name: 'Edit Image Tool', id: 'J4p75K4RCuwIMBoy', nodes: 11, score: 'OK', problem: '' },
      { name: 'Image to Video Tool', id: 'ADPjJla7AGiNljUH', nodes: 16, score: 'OK', problem: '' },
      { name: 'X Post', id: 'IBTSCQo4JUjZa7g0', nodes: 3, score: 'OK', problem: '' },
      { name: 'My Sub-Workflow 2', id: '4AgUKANTObAIgZiH', nodes: 2, score: 'OK', problem: 'sem uso' },
      { name: 'My Sub-workflow', id: 'NX8VeXT809UqXbDt', nodes: 10, score: 'OK', problem: '' },
      { name: 'Agendafy Formatar Fuso', id: 'FZujF9clGLepuIGl', nodes: 3, score: 'OK', problem: '' },
      { name: 'Tool Call Anthropic PE', id: '72FSNqvPRh6H4ftw', nodes: 5, score: 'OK', problem: '' },
      { name: 'Tool Call Other Models PE', id: '6JeEKeVISMwQDYfS', nodes: 5, score: 'OK', problem: '' },
      { name: 'assistente financeiro kommo', id: '0ddX9qTwxkvvtPTz', nodes: 9, score: 'OK', problem: '' },
      { name: 'webhook Marcos gc', id: '2gK91BDNnPw6yf8j', nodes: 1, score: 'OK', problem: 'sem uso' },
      { name: 'MCP Mentorfy Clientes', id: '1d1kT9fs2G1gvkUq', nodes: 3, score: 'OK', problem: '' },
      { name: 'MCP Mentorfy Produtos', id: 'JdopUKEmhlNHLmTi', nodes: 2, score: 'OK', problem: '' },
    ],
  },
];

const PATTERNS: PatternData[] = [
  {
    title: '403 GHL Multi-Tenant',
    count: 3,
    affected: '01-Organizador-Calls, 05-Escalar para humano, GHL Innovat Phone Calls',
    fix: 'Usar PIT agency-level ou lookup dinamico de token por location_id',
  },
  {
    title: 'UNIQUE VIOLATION',
    count: 2,
    affected: 'Inserir Lead Insights V2, 04-Agent-Factory',
    fix: 'Adicionar ON CONFLICT DO NOTHING ou ON CONFLICT DO UPDATE nos inserts',
  },
  {
    title: 'Tokens Expirados',
    count: 2,
    affected: 'VAPI Call Webhook, Facebook Ads Daily Report',
    fix: 'Renovar credenciais no n8n e implementar refresh automatico',
  },
];

const DEACTIVATION_CANDIDATES: DeactivationEntry[] = [
  { name: 'Invoice Extractor copy', id: '6ICzyTrrI5J9PJQD', reason: 'Duplicata do Invoice Extractor' },
  { name: 'IA MARKEGTING', id: '0eq7VTwySd9qqbZj', reason: 'Typo no nome, 0 execucoes' },
  { name: 'webhook Marcos gc', id: '2gK91BDNnPw6yf8j', reason: '1 node apenas, sem uso identificado' },
  { name: 'My Sub-Workflow 2', id: '4AgUKANTObAIgZiH', reason: '2 nodes, sem uso identificado' },
  { name: 'FLUXO BASE DUPLICAR', id: 'AfVNiiQWzrNl5lV0', reason: 'Template — nao precisa ficar ativo' },
];

// ============================================
// HELPERS
// ============================================

function n8nUrl(id: string): string {
  return `${N8N_BASE_URL}/${id}`;
}

function getScoreColor(score: Score): string {
  switch (score) {
    case 'OK':      return 'fill-emerald-400 text-emerald-400';
    case 'ATENCAO': return 'fill-amber-400 text-amber-400';
    case 'CRITICO': return 'fill-red-400 text-red-400';
  }
}

function computeGroupStats(workflows: WorkflowEntry[]) {
  return workflows.reduce(
    (acc, wf) => {
      acc[wf.score]++;
      return acc;
    },
    { OK: 0, ATENCAO: 0, CRITICO: 0 } as Record<Score, number>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

const ScoreDot = ({ score }: { score: Score }) => (
  <Circle size={8} className={`flex-shrink-0 ${getScoreColor(score)}`} />
);

const RedDot = () => (
  <Circle size={8} className="flex-shrink-0 fill-red-400 text-red-400" />
);

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const cls =
    priority === 'P0'
      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>
      {priority}
    </span>
  );
};

const NodesBadge = ({ nodes }: { nodes: number }) => (
  <span className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted flex-shrink-0">
    {nodes} nodes
  </span>
);

// ── Criticos section item
const CriticalItem = ({ wf }: { wf: CriticalWorkflow }) => (
  <a
    href={n8nUrl(wf.id)}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors"
  >
    <RedDot />
    <span className="text-sm font-medium text-text-primary flex-1 truncate">{wf.name}</span>
    <span className="text-[10px] text-text-muted flex-shrink-0">{wf.errors}</span>
    <PriorityBadge priority={wf.priority} />
    <span className="text-xs text-text-muted truncate max-w-[200px] hidden md:block">{wf.cause}</span>
    <ExternalLink size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
  </a>
);

// ── Por Grupo item
const WorkflowItem = ({ wf }: { wf: WorkflowEntry }) => (
  <a
    href={n8nUrl(wf.id)}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors"
  >
    <ScoreDot score={wf.score} />
    <span className="text-sm text-text-primary truncate flex-1">{wf.name}</span>
    <NodesBadge nodes={wf.nodes} />
    {wf.problem && (
      <span className="text-xs text-text-muted truncate max-w-[180px] hidden lg:block">{wf.problem}</span>
    )}
    <ExternalLink size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
  </a>
);

// ── Colapsavel card para criticos
const CriticalCard = () => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-red-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/15 transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-red-400 flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-red-400 flex-shrink-0" />
        )}
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold text-red-400">Criticos — Acao Imediata</span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
          {CRITICAL_WORKFLOWS.length}
        </span>
      </button>
      {expanded && (
        <div className="divide-y divide-border-default/50">
          {CRITICAL_WORKFLOWS.map((wf) => (
            <CriticalItem key={wf.id} wf={wf} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Colapsavel card para grupo
const GroupCard = ({ group }: { group: GroupData }) => {
  const [expanded, setExpanded] = useState(false);
  const stats = computeGroupStats(group.workflows);
  const total = group.workflows.length;

  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-bg-secondary hover:bg-bg-hover transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
        )}
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-medium text-text-primary">{group.name}</span>
          <span className="text-xs text-text-muted ml-2">{group.description}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-emerald-400">{stats.OK}</span>
          <span className="text-xs text-text-muted">/</span>
          {stats.ATENCAO > 0 && (
            <span className="text-xs text-amber-400">{stats.ATENCAO}</span>
          )}
          {stats.ATENCAO > 0 && stats.CRITICO > 0 && (
            <span className="text-xs text-text-muted">/</span>
          )}
          {stats.CRITICO > 0 && (
            <span className="text-xs text-red-400">{stats.CRITICO}</span>
          )}
          <span className="text-xs text-text-muted ml-1">({total})</span>
        </div>
      </button>
      {expanded && (
        <div className="divide-y divide-border-default/50">
          {group.workflows.map((wf) => (
            <WorkflowItem key={`${wf.id}-${wf.name}`} wf={wf} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Stats Cards (topo)
const AuditStatsCards = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[
      { label: 'Total', value: 98, Icon: Workflow, iconCls: 'text-text-secondary', bg: 'bg-bg-tertiary' },
      { label: 'OK', value: 62, Icon: CheckCircle, iconCls: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      { label: 'Atencao', value: 24, Icon: AlertTriangle, iconCls: 'text-amber-400', bg: 'bg-amber-500/10' },
      { label: 'Critico', value: 12, Icon: XCircle, iconCls: 'text-red-400', bg: 'bg-red-500/10' },
    ].map(({ label, value, Icon, iconCls, bg }) => (
      <div
        key={label}
        className="bg-bg-secondary border border-border-default rounded-lg p-3 space-y-1"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${bg}`}>
            <Icon size={13} className={iconCls} />
          </div>
          <span className="text-xs font-medium text-text-secondary truncate">{label}</span>
        </div>
        <div className="text-2xl font-bold text-text-primary">{value}</div>
      </div>
    ))}
  </div>
);

// ── Candidatos a desativacao item
const DeactivationItem = ({ entry }: { entry: DeactivationEntry }) => (
  <a
    href={n8nUrl(entry.id)}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors"
  >
    <Circle size={8} className="flex-shrink-0 fill-zinc-500 text-zinc-500" />
    <span className="text-sm text-text-primary flex-1 truncate">{entry.name}</span>
    <span className="text-xs text-text-muted truncate max-w-[280px] hidden sm:block">{entry.reason}</span>
    <ExternalLink size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
  </a>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const N8nAudit = () => {
  const [search, setSearch] = useState('');

  // Todos os workflows dos 4 grupos para busca global
  const allWorkflows = useMemo(
    () => GROUPS.flatMap((g) => g.workflows.map((wf) => ({ ...wf, group: g.name }))),
    []
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allWorkflows.filter(
      (wf) =>
        wf.name.toLowerCase().includes(q) ||
        wf.id.toLowerCase().includes(q) ||
        (wf.problem && wf.problem.toLowerCase().includes(q))
    );
  }, [search, allWorkflows]);

  const showSearchResults = search.trim().length > 0;

  return (
    <div className="space-y-5">

      {/* ── STATS ── */}
      <AuditStatsCards />

      {/* ── BUSCA GLOBAL ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar workflow por nome, ID ou problema..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      {/* ── RESULTADOS DA BUSCA ── */}
      {showSearchResults && (
        <div className="border border-border-default rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-bg-secondary border-b border-border-default">
            <span className="text-xs font-medium text-text-muted">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para "{search}"
            </span>
          </div>
          {searchResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              Nenhum workflow encontrado.
            </div>
          ) : (
            <div className="divide-y divide-border-default/50">
              {searchResults.map((wf) => (
                <a
                  key={`search-${wf.id}-${wf.name}`}
                  href={n8nUrl(wf.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-3 py-2 hover:bg-bg-hover transition-colors"
                >
                  <ScoreDot score={wf.score} />
                  <span className="text-sm text-text-primary flex-1 truncate">{wf.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted flex-shrink-0">
                    {wf.group}
                  </span>
                  <NodesBadge nodes={wf.nodes} />
                  {wf.problem && (
                    <span className="text-xs text-text-muted truncate max-w-[180px] hidden lg:block">{wf.problem}</span>
                  )}
                  <ExternalLink size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CRITICOS ── */}
      {!showSearchResults && <CriticalCard />}

      {/* ── POR GRUPO ── */}
      {!showSearchResults && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">Por Grupo</p>
          {GROUPS.map((g) => (
            <GroupCard key={g.name} group={g} />
          ))}
        </div>
      )}

      {/* ── PADROES IDENTIFICADOS ── */}
      {!showSearchResults && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">Padroes Identificados</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PATTERNS.map((p) => (
              <div
                key={p.title}
                className="bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text-primary leading-tight">{p.title}</h3>
                  <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {p.count} WFs
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide mb-1">Afeta</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.affected}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide mb-1">Fix</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CANDIDATOS A DESATIVACAO ── */}
      {!showSearchResults && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">Candidatos a Desativacao</p>
          <div className="border border-border-default rounded-lg overflow-hidden divide-y divide-border-default/50">
            {DEACTIVATION_CANDIDATES.map((entry) => (
              <DeactivationItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default N8nAudit;
